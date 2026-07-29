import type { AppsConfig } from "../config.ts";
import { AppsApiError } from "../lib/result.ts";

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

const REFRESH_SKEW_MS = 60_000;

export class AppsAuth {
  private cache: TokenCache | null = null;
  private inflight: Promise<string> | null = null;

  constructor(private readonly config: AppsConfig) {}

  clear(): void {
    this.cache = null;
    this.inflight = null;
  }

  status(): {
    hasAppId: boolean;
    hasAppSecret: boolean;
    hasStaticAccessToken: boolean;
    hasCachedToken: boolean;
    allowWrite: boolean;
    apiBaseUrl: string;
  } {
    return {
      hasAppId: Boolean(this.config.appId),
      hasAppSecret: Boolean(this.config.appSecret),
      hasStaticAccessToken: Boolean(this.config.accessToken),
      hasCachedToken: Boolean(this.cache && this.cache.expiresAtMs > Date.now()),
      allowWrite: this.config.allowWrite,
      apiBaseUrl: this.config.apiBaseUrl,
    };
  }

  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.config.accessToken) {
      return this.config.accessToken;
    }

    if (!forceRefresh && this.cache && this.cache.expiresAtMs > Date.now() + REFRESH_SKEW_MS) {
      return this.cache.accessToken;
    }

    if (!forceRefresh && this.inflight) {
      return this.inflight;
    }

    this.inflight = this.fetchToken().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async fetchToken(): Promise<string> {
    if (!this.config.appId || !this.config.appSecret) {
      if (this.config.accessToken) return this.config.accessToken;
      throw new Error("APPS_APP_ID and APPS_APP_SECRET are required to fetch an access token.");
    }

    const basic = Buffer.from(`${this.config.appId}:${this.config.appSecret}`, "utf8").toString(
      "base64",
    );
    const base = new URL(this.config.apiBaseUrl);
    const url = new URL("/v1/identity/oauth2/token", `${base.origin}/`);
    if (url.origin !== base.origin) {
      throw new Error("Refusing to leave configured API origin for token request");
    }
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
      redirect: "error",
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    });

    const body = await parseJsonBody(res);
    if (!res.ok) {
      throw new AppsApiError(`Token request failed (HTTP ${res.status})`, res.status, body);
    }

    const token = body as TokenResponse;
    if (!token.access_token || typeof token.expires_in !== "number") {
      // Never attach raw token JSON — access_token may be present without expires_in.
      throw new AppsApiError("Token response missing access_token or expires_in", res.status, {
        error: "invalid_token_response",
      });
    }

    this.cache = {
      accessToken: token.access_token,
      expiresAtMs: Date.now() + token.expires_in * 1000,
    };
    return token.access_token;
  }
}

async function parseJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

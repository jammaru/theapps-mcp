import { type AppsConfig, assertSafePathId } from "../config.ts";
import { AppsApiError } from "../lib/result.ts";
import type { AppsAuth } from "./auth.ts";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RequestOptions = {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  skipAuth?: boolean;
};

export class AppsClient {
  constructor(
    private readonly config: AppsConfig,
    private readonly auth: AppsAuth,
  ) {}

  get baseUrl(): string {
    return this.config.apiBaseUrl;
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const method = options.method ?? "GET";

    const doFetch = async (forceRefresh: boolean) => {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (!options.skipAuth) {
        const token = await this.auth.getAccessToken(forceRefresh);
        headers.Authorization = `Bearer ${token}`;
      }
      if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      return fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        redirect: "error",
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });
    };

    let res = await doFetch(false);
    if (res.status === 401 && !options.skipAuth && !this.config.accessToken) {
      res = await doFetch(true);
    }

    if (res.status === 204) {
      return { ok: true, status: 204 } as T;
    }

    const body = await parseJsonBody(res);
    if (!res.ok) {
      throw new AppsApiError(
        `Apps API error (HTTP ${res.status}) ${method} ${options.path}`,
        res.status,
        body,
      );
    }
    return body as T;
  }

  get<T = unknown>(path: string, query?: RequestOptions["query"]): Promise<T> {
    return this.request<T>({ method: "GET", path, query });
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", path, body });
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "PUT", path, body });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>({ method: "DELETE", path });
  }

  pathId(id: string, label?: string): string {
    return encodeURIComponent(assertSafePathId(id, label));
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const base = new URL(this.config.apiBaseUrl);
    const url = new URL(normalized, `${base.origin}/`);
    if (url.origin !== base.origin) {
      throw new Error("Refusing to leave configured API origin");
    }
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
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

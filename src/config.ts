export type AppsConfig = {
  appId: string;
  appSecret: string;
  accessToken?: string;
  apiBaseUrl: string;
  allowWrite: boolean;
  allowCustomBaseUrl: boolean;
  requestTimeoutMs: number;
};

export const DEFAULT_BASE_URL = "https://api.theapps.jp";
const DEFAULT_TIMEOUT_MS = 30_000;

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseTimeoutMs(value: string | undefined): number {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1000) return DEFAULT_TIMEOUT_MS;
  return Math.floor(n);
}

export function resolveApiBaseUrl(raw: string | undefined, allowCustomBaseUrl: boolean): string {
  const candidate = (raw?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  if (candidate === DEFAULT_BASE_URL) return candidate;
  if (!allowCustomBaseUrl) {
    throw new Error(
      `APPS_API_BASE_URL is restricted to ${DEFAULT_BASE_URL}. ` +
        "Set APPS_MCP_ALLOW_CUSTOM_BASE_URL=true only if you intentionally override it.",
    );
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`Invalid APPS_API_BASE_URL: ${candidate}`);
  }
  if (url.protocol !== "https:") {
    throw new Error("APPS_API_BASE_URL must use https:");
  }
  return candidate;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppsConfig {
  const allowCustomBaseUrl = parseBool(env.APPS_MCP_ALLOW_CUSTOM_BASE_URL, false);
  const apiBaseUrl = resolveApiBaseUrl(env.APPS_API_BASE_URL, allowCustomBaseUrl);

  return {
    appId: env.APPS_APP_ID?.trim() ?? "",
    appSecret: env.APPS_APP_SECRET?.trim() ?? "",
    accessToken: env.APPS_ACCESS_TOKEN?.trim() || undefined,
    apiBaseUrl,
    allowWrite: parseBool(env.APPS_MCP_ALLOW_WRITE, false),
    allowCustomBaseUrl,
    requestTimeoutMs: parseTimeoutMs(env.APPS_MCP_TIMEOUT_MS),
  };
}

export function hasCredentials(config: AppsConfig): boolean {
  return Boolean(config.appId && config.appSecret) || Boolean(config.accessToken);
}

export function maskSecret(value: string | undefined): string {
  if (!value) return "(unset)";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
}

/** Reject path traversal segments and empty IDs used in URL path parts. */
export function assertSafePathId(id: string, label = "id"): string {
  const value = id.trim();
  if (!value) throw new Error(`${label} must not be empty`);
  if (value === "." || value === "..") {
    throw new Error(`${label} must not be "." or ".."`);
  }
  if (value.includes("/") || value.includes("\\") || value.includes("%")) {
    throw new Error(`${label} contains forbidden characters`);
  }
  return value;
}

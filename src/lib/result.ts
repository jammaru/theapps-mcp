export type ToolContent = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

const SENSITIVE_KEY =
  /^(?:.*(?:access_token|refresh_token|id_token|client_secret|app_secret|authorization|password|api_key|apikey).*)$/i;

/** Strip credential-like fields before returning API/error payloads to MCP clients. */
export function sanitizeForToolOutput(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForToolOutput(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "(redacted)";
      continue;
    }
    out[key] = sanitizeForToolOutput(child, depth + 1);
  }
  return out;
}

export function ok(data: unknown): ToolContent {
  const normalized = data === undefined ? { ok: true } : data;
  return {
    content: [
      {
        type: "text",
        text: typeof normalized === "string" ? normalized : JSON.stringify(normalized, null, 2),
      },
    ],
  };
}

export function fail(message: string, details?: unknown): ToolContent {
  const payload =
    details === undefined
      ? { error: message }
      : { error: message, details: sanitizeForToolOutput(details) };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError: true,
  };
}

export async function runTool(fn: () => Promise<unknown>): Promise<ToolContent> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof AppsApiError) {
      return fail(error.message, {
        status: error.status,
        body: error.body,
      });
    }
    const message = error instanceof Error ? error.message : String(error);
    return fail(message);
  }
}

export class AppsApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "AppsApiError";
    this.status = status;
    this.body = sanitizeForToolOutput(body);
  }
}

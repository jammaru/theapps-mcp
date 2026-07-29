export type ToolContent = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

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
  const payload = details === undefined ? { error: message } : { error: message, details };
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
    this.body = body;
  }
}

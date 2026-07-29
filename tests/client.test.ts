import { describe, expect, mock, test } from "bun:test";
import { AppsAuth } from "../src/client/auth.ts";
import { AppsClient } from "../src/client/http.ts";
import { assertSafePathId, loadConfig, resolveApiBaseUrl } from "../src/config.ts";
import { AppsApiError, ok } from "../src/lib/result.ts";
import { guardWrite } from "../src/lib/write-guard.ts";
import { createRuntime } from "../src/server.ts";
import { TOOL_CATALOG } from "../src/tools/catalog.ts";

describe("AppsAuth", () => {
  test("fetches and caches access token", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock(async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          access_token: "tok-1",
          expires_in: 3600,
          token_type: "Bearer",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    try {
      const config = loadConfig({
        APPS_APP_ID: "app",
        APPS_APP_SECRET: "secret",
      } as unknown as NodeJS.ProcessEnv);
      const auth = new AppsAuth(config);
      const t1 = await auth.getAccessToken();
      const t2 = await auth.getAccessToken();
      expect(t1).toBe("tok-1");
      expect(t2).toBe("tok-1");
      expect(calls).toBe(1);
      auth.clear();
      await auth.getAccessToken();
      expect(calls).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("uses static access token without fetch", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      throw new Error("should not fetch");
    }) as unknown as typeof fetch;

    try {
      const config = loadConfig({
        APPS_ACCESS_TOKEN: "static-token",
      } as unknown as NodeJS.ProcessEnv);
      const auth = new AppsAuth(config);
      expect(await auth.getAccessToken()).toBe("static-token");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("AppsClient", () => {
  test("sends bearer token and parses JSON", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      expect(url).toBe("https://api.theapps.jp/v1/customer/c1");
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer static-token",
      });
      expect(init?.redirect).toBe("error");
      return new Response(JSON.stringify({ customer: { customer_id: "c1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    try {
      const runtime = createRuntime(
        loadConfig({
          APPS_ACCESS_TOKEN: "static-token",
        } as unknown as NodeJS.ProcessEnv),
      );
      const body = await runtime.client.get("/v1/customer/c1");
      expect(body).toEqual({ customer: { customer_id: "c1" } });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("maps HTTP 204 to a JSON-serializable payload", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(null, { status: 204 }),
    ) as unknown as typeof fetch;

    try {
      const runtime = createRuntime(
        loadConfig({
          APPS_ACCESS_TOKEN: "static-token",
        } as unknown as NodeJS.ProcessEnv),
      );
      const body = await runtime.client.delete("/v1/discord/guilds/g/roles/r");
      expect(body).toEqual({ ok: true, status: 204 });
      expect(ok(body).content[0]?.text).toContain("204");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("retries once on 401 when using app credentials", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/v1/identity/oauth2/token")) {
        return new Response(
          JSON.stringify({
            access_token: `tok-${++calls}`,
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      }
      if (calls === 1) {
        return new Response(JSON.stringify({ error: "invalid_token" }), { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    try {
      const config = loadConfig({
        APPS_APP_ID: "app",
        APPS_APP_SECRET: "secret",
      } as unknown as NodeJS.ProcessEnv);
      const auth = new AppsAuth(config);
      const client = new AppsClient(config, auth);
      const body = await client.get("/v1/advance");
      expect(body).toEqual({ ok: true });
      expect(calls).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("throws AppsApiError on non-OK", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ error_code: "4003" }), { status: 400 });
    }) as unknown as typeof fetch;

    try {
      const runtime = createRuntime(
        loadConfig({
          APPS_ACCESS_TOKEN: "static-token",
        } as unknown as NodeJS.ProcessEnv),
      );
      await expect(runtime.client.get("/v1/customer/x")).rejects.toBeInstanceOf(AppsApiError);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("pathId rejects traversal segments", () => {
    const runtime = createRuntime(
      loadConfig({
        APPS_ACCESS_TOKEN: "static-token",
      } as unknown as NodeJS.ProcessEnv),
    );
    expect(() => runtime.client.pathId("..", "plan_id")).toThrow(/must not/);
    expect(() => runtime.client.pathId("../x", "plan_id")).toThrow(/forbidden/);
    expect(runtime.client.pathId("abc-123", "plan_id")).toBe("abc-123");
  });
});

describe("config safety", () => {
  test("rejects custom base URL without allow flag", () => {
    expect(() => resolveApiBaseUrl("https://evil.example", false)).toThrow(/restricted/);
  });

  test("assertSafePathId blocks dots", () => {
    expect(() => assertSafePathId("..")).toThrow();
    expect(assertSafePathId("plan_1")).toBe("plan_1");
  });
});

describe("write dry_run path", () => {
  test("dry_run does not call API", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      throw new Error("network should not be used");
    }) as unknown as typeof fetch;

    try {
      const config = loadConfig({
        APPS_APP_ID: "a",
        APPS_APP_SECRET: "b",
        APPS_MCP_ALLOW_WRITE: "true",
      } as unknown as NodeJS.ProcessEnv);
      const gate = guardWrite(config, { dry_run: true }, "create product");
      expect(gate).toEqual({ blocked: false, dryRun: true });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("tool catalog", () => {
  test("has unique names and no /v1/apps paths in catalog source files", async () => {
    expect(new Set(TOOL_CATALOG).size).toBe(TOOL_CATALOG.length);
    expect(TOOL_CATALOG.length).toBeGreaterThan(30);
    const files = [
      "../src/tools/plans.ts",
      "../src/tools/customer-payment.ts",
      "../src/tools/discord.ts",
      "../src/tools/auth.ts",
    ];
    for (const file of files) {
      const text = await Bun.file(new URL(file, import.meta.url)).text();
      expect(text.includes('"/v1/apps')).toBe(false);
      expect(text.includes("'/v1/apps")).toBe(false);
      expect(text.includes("`/v1/apps")).toBe(false);
    }
  });
});

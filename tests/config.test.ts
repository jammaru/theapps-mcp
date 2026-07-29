import { describe, expect, test } from "bun:test";
import { hasCredentials, loadConfig, maskSecret } from "../src/config.ts";
import { AppsApiError, fail, ok } from "../src/lib/result.ts";
import { guardWrite } from "../src/lib/write-guard.ts";
import { createRuntime, createServer } from "../src/server.ts";
import { TOOL_CATALOG } from "../src/tools/catalog.ts";

describe("loadConfig", () => {
  test("defaults to production base URL and write disabled", () => {
    const config = loadConfig({} as NodeJS.ProcessEnv);
    expect(config.apiBaseUrl).toBe("https://api.theapps.jp");
    expect(config.allowWrite).toBe(false);
    expect(hasCredentials(config)).toBe(false);
  });

  test("reads credentials and strips trailing slash", () => {
    const config = loadConfig({
      APPS_APP_ID: " id ",
      APPS_APP_SECRET: " secret ",
      APPS_API_BASE_URL: "https://api.theapps.jp/",
      APPS_MCP_ALLOW_WRITE: "true",
    } as unknown as NodeJS.ProcessEnv);
    expect(config.appId).toBe("id");
    expect(config.appSecret).toBe("secret");
    expect(config.apiBaseUrl).toBe("https://api.theapps.jp");
    expect(config.allowWrite).toBe(true);
    expect(hasCredentials(config)).toBe(true);
  });

  test("maskSecret never echoes full secret", () => {
    expect(maskSecret(undefined)).toBe("(unset)");
    expect(maskSecret("abcd")).toBe("****");
    expect(maskSecret("abcdefgh")).toBe("ab…gh");
  });
});

describe("guardWrite", () => {
  const base = loadConfig({
    APPS_APP_ID: "a",
    APPS_APP_SECRET: "b",
  } as unknown as NodeJS.ProcessEnv);

  test("blocks when write env disabled", () => {
    const result = guardWrite(base, { confirm: true }, "create product");
    expect(result.blocked).toBe(true);
  });

  test("blocks when confirm missing", () => {
    const config = { ...base, allowWrite: true };
    const result = guardWrite(config, {}, "create product");
    expect(result.blocked).toBe(true);
  });

  test("allows dry_run without confirm", () => {
    const config = { ...base, allowWrite: true };
    const result = guardWrite(config, { dry_run: true }, "create product");
    expect(result).toEqual({ blocked: false, dryRun: true });
  });

  test("allows confirm when write enabled", () => {
    const config = { ...base, allowWrite: true };
    const result = guardWrite(config, { confirm: true }, "create product");
    expect(result).toEqual({ blocked: false, dryRun: false });
  });
});

describe("result helpers", () => {
  test("ok and fail shapes", () => {
    expect(ok({ a: 1 }).isError).toBeUndefined();
    expect(ok(undefined).content[0]?.text).toContain("ok");
    expect(fail("x").isError).toBe(true);
    const err = new AppsApiError("boom", 400, { error: "bad" });
    expect(err.status).toBe(400);
  });
});

describe("createServer", () => {
  test("creates server for catalog-sized surface", () => {
    const runtime = createRuntime(
      loadConfig({
        APPS_APP_ID: "test-id",
        APPS_APP_SECRET: "test-secret",
      } as unknown as NodeJS.ProcessEnv),
    );
    const server = createServer(runtime);
    expect(server).toBeDefined();
    expect(TOOL_CATALOG).toContain("apps_help");
    expect(TOOL_CATALOG).toContain("apps_list_paid_plans");
    expect(TOOL_CATALOG).toContain("apps_delete_discord_channel");
  });
});

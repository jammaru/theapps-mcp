import { describe, expect, test } from "bun:test";
import {
  buildAppsMcpEntry,
  claudeDesktopConfigPath,
  formatMcpSnippet,
  removeMcpServer,
  upsertMcpServer,
} from "../src/cli/mcp-paths.ts";

describe("buildAppsMcpEntry", () => {
  test("builds npx entry with optional write flag", () => {
    const entry = buildAppsMcpEntry({
      appId: "id",
      appSecret: "secret",
      allowWrite: true,
      runner: "npx",
    });
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "github:manmaru-ai/apps-mcp"],
      env: {
        APPS_APP_ID: "id",
        APPS_APP_SECRET: "secret",
        APPS_MCP_ALLOW_WRITE: "true",
      },
    });
  });

  test("omits write env when disabled", () => {
    const entry = buildAppsMcpEntry({
      appId: "id",
      appSecret: "secret",
      allowWrite: false,
    });
    expect(entry.env).toEqual({
      APPS_APP_ID: "id",
      APPS_APP_SECRET: "secret",
    });
  });
});

describe("upsert/remove", () => {
  test("merges without dropping other servers", () => {
    const next = upsertMcpServer(
      { mcpServers: { other: { command: "x", args: [] } } },
      "apps",
      buildAppsMcpEntry({ appId: "a", appSecret: "b", allowWrite: false }),
    );
    expect(Object.keys(next.mcpServers ?? {}).sort()).toEqual(["apps", "other"]);
    const removed = removeMcpServer(next, "apps");
    expect(removed.mcpServers).toEqual({ other: { command: "x", args: [] } });
  });
});

describe("formatMcpSnippet", () => {
  test("prints copy-pasteable json", () => {
    const text = formatMcpSnippet(
      buildAppsMcpEntry({ appId: "a", appSecret: "b", allowWrite: false }),
    );
    expect(text).toContain('"apps"');
    expect(text).toContain("APPS_APP_ID");
  });
});

describe("claudeDesktopConfigPath", () => {
  test("prefers Windows Store path when Packages exists", () => {
    const path = claudeDesktopConfigPath(
      {
        LOCALAPPDATA: process.env.LOCALAPPDATA,
        APPDATA: process.env.APPDATA,
      } as NodeJS.ProcessEnv,
      "win32",
    );
    expect(path).toBeTruthy();
    expect(path?.includes("Claude")).toBe(true);
  });
});

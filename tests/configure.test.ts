import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildAppsMcpEntry,
  claudeDesktopConfigPath,
  formatConfigureStdoutSnippets,
  formatMcpSnippet,
  placeholderMcpEntry,
  redactMcpEntry,
  removeMcpServer,
  upsertMcpServer,
} from "../src/cli/mcp-paths.ts";

describe("buildAppsMcpEntry", () => {
  test("builds npx entry with optional write flag", () => {
    const entry = buildAppsMcpEntry({
      appId: "id",
      appSecret: "secret",
      allowWrite: true,
    });
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "github:jammaru/theapps-mcp"],
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

describe("formatMcpSnippet / redact", () => {
  test("prints copy-pasteable json", () => {
    const text = formatMcpSnippet(
      buildAppsMcpEntry({ appId: "a", appSecret: "b", allowWrite: false }),
    );
    expect(text).toContain('"apps"');
    expect(text).toContain("APPS_APP_ID");
  });

  test("redactMcpEntry fully masks secrets without leaking prefix/suffix", () => {
    const entry = buildAppsMcpEntry({
      appId: "abc12345",
      appSecret: "super-secret-value",
      allowWrite: false,
    });
    const redacted = redactMcpEntry(entry);
    expect(redacted.env?.APPS_APP_SECRET).toBe("(set)");
    expect(redacted.env?.APPS_APP_ID).toBe("(set)");
    expect(formatMcpSnippet(redacted)).not.toContain("super-secret-value");
    expect(formatMcpSnippet(redacted)).not.toContain("abc12345");
    expect(formatMcpSnippet(redacted)).not.toContain("ab…");
    // Original entry unchanged
    expect(entry.env?.APPS_APP_SECRET).toBe("super-secret-value");
  });

  test("placeholderMcpEntry uses safe placeholders only", () => {
    const entry = buildAppsMcpEntry({
      appId: "real-id",
      appSecret: "real-secret",
      allowWrite: true,
    });
    const text = formatMcpSnippet(placeholderMcpEntry(entry));
    expect(text).toContain("your-app-id");
    expect(text).toContain("your-app-secret");
    expect(text).toContain("APPS_MCP_ALLOW_WRITE");
    expect(text).not.toContain("real-id");
    expect(text).not.toContain("real-secret");
  });

  test("redact and placeholder cover APPS_ACCESS_TOKEN", () => {
    const entry = {
      command: "npx",
      args: ["-y", "github:jammaru/theapps-mcp"],
      env: {
        APPS_ACCESS_TOKEN: "static-live-token-value",
      },
    };
    expect(redactMcpEntry(entry).env?.APPS_ACCESS_TOKEN).toBe("(set)");
    expect(placeholderMcpEntry(entry).env?.APPS_ACCESS_TOKEN).toBe("your-access-token");
    const snippets = formatConfigureStdoutSnippets(entry);
    expect(snippets.preview).not.toContain("static-live-token-value");
    expect(snippets.template).not.toContain("static-live-token-value");
    expect(snippets.template).toContain("your-access-token");
  });

  test("formatConfigureStdoutSnippets never includes plaintext credentials", () => {
    const appId = "plaintext-app-id-xyz";
    const appSecret = "plaintext-app-secret-xyz";
    const entry = buildAppsMcpEntry({ appId, appSecret, allowWrite: false });
    const { preview, template } = formatConfigureStdoutSnippets(entry);
    // This is the wiring configure() uses for stdout — must not regress to raw entry.
    expect(preview).not.toContain(appId);
    expect(preview).not.toContain(appSecret);
    expect(template).not.toContain(appId);
    expect(template).not.toContain(appSecret);
    expect(preview).toContain("(set)");
    expect(template).toContain("your-app-id");
    expect(template).toContain("your-app-secret");
  });
});

describe("claudeDesktopConfigPath", () => {
  test("prefers Windows Store path when Packages exists", () => {
    const root = mkdtempSync(join(tmpdir(), "apps-mcp-claude-"));
    const localAppData = join(root, "Local");
    const appData = join(root, "Roaming");
    mkdirSync(join(localAppData, "Packages"), { recursive: true });

    const path = claudeDesktopConfigPath(
      {
        LOCALAPPDATA: localAppData,
        APPDATA: appData,
      } as NodeJS.ProcessEnv,
      "win32",
    );
    expect(path).toContain(join("Packages", "Claude_pzs8sxrjxfjjc"));
    expect(path?.endsWith(join("Claude", "claude_desktop_config.json"))).toBe(true);
  });

  test("falls back to APPDATA when Packages is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "apps-mcp-claude-"));
    const localAppData = join(root, "Local");
    const appData = join(root, "Roaming");
    mkdirSync(localAppData, { recursive: true });

    const path = claudeDesktopConfigPath(
      {
        LOCALAPPDATA: localAppData,
        APPDATA: appData,
      } as NodeJS.ProcessEnv,
      "win32",
    );
    expect(path).toBe(join(appData, "Claude", "claude_desktop_config.json"));
  });
});

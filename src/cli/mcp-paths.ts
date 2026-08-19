import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type McpServerEntry = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

/** Env keys that must never be echoed to stdout/logs in plaintext. */
export const SENSITIVE_MCP_ENV_KEYS = [
  "APPS_APP_ID",
  "APPS_APP_SECRET",
  "APPS_ACCESS_TOKEN",
] as const;

const PLACEHOLDER_MCP_ENV: Record<(typeof SENSITIVE_MCP_ENV_KEYS)[number], string> = {
  APPS_APP_ID: "your-app-id",
  APPS_APP_SECRET: "your-app-secret",
  APPS_ACCESS_TOKEN: "your-access-token",
};

export type McpConfigFile = {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
};

export function claudeDesktopConfigPath(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string | null {
  if (platform === "darwin") {
    return join(
      homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );
  }
  if (platform === "linux") {
    return join(homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
  if (platform === "win32") {
    const localAppData = env.LOCALAPPDATA;
    const appData = env.APPDATA;
    if (localAppData) {
      const storePackages = join(localAppData, "Packages");
      const storePath = join(
        localAppData,
        "Packages",
        "Claude_pzs8sxrjxfjjc",
        "LocalCache",
        "Roaming",
        "Claude",
        "claude_desktop_config.json",
      );
      if (existsSync(storePackages)) {
        return storePath;
      }
    }
    if (appData) {
      return join(appData, "Claude", "claude_desktop_config.json");
    }
  }
  return null;
}

export function claudeCodeConfigPath(): string {
  return join(homedir(), ".claude.json");
}

export function cursorMcpConfigPath(): string {
  return join(homedir(), ".cursor", "mcp.json");
}

/** Package spec written into client MCP config. `@latest` so a client restart picks up new npm releases. */
export const APPS_MCP_NPX_SPEC = "theapps-mcp@latest";

export function buildAppsMcpEntry(options: {
  appId: string;
  appSecret: string;
  allowWrite: boolean;
}): McpServerEntry {
  const env: Record<string, string> = {
    APPS_APP_ID: options.appId,
    APPS_APP_SECRET: options.appSecret,
  };
  if (options.allowWrite) {
    env.APPS_MCP_ALLOW_WRITE = "true";
  }
  return {
    command: "npx",
    args: ["-y", APPS_MCP_NPX_SPEC],
    env,
  };
}

export function upsertMcpServer(
  config: McpConfigFile,
  serverName: string,
  entry: McpServerEntry,
): McpConfigFile {
  const mcpServers = { ...(config.mcpServers ?? {}) };
  mcpServers[serverName] = entry;
  return { ...config, mcpServers };
}

export function removeMcpServer(config: McpConfigFile, serverName: string): McpConfigFile {
  const mcpServers = { ...(config.mcpServers ?? {}) };
  delete mcpServers[serverName];
  return { ...config, mcpServers };
}

export function redactMcpEntry(entry: McpServerEntry): McpServerEntry {
  if (!entry.env) return { ...entry };
  const env: Record<string, string> = { ...entry.env };
  for (const key of SENSITIVE_MCP_ENV_KEYS) {
    if (env[key] !== undefined) {
      // Full mask for stdout — never leak length/prefix/suffix into scrollback.
      env[key] = "(set)";
    }
  }
  return { ...entry, env };
}

/** Manual-copy template: real secrets never appear — placeholders only. */
export function placeholderMcpEntry(entry: McpServerEntry): McpServerEntry {
  if (!entry.env) return { ...entry };
  const env: Record<string, string> = { ...entry.env };
  for (const key of SENSITIVE_MCP_ENV_KEYS) {
    if (env[key] !== undefined) {
      env[key] = PLACEHOLDER_MCP_ENV[key];
    }
  }
  return { ...entry, env };
}

export function formatMcpSnippet(entry: McpServerEntry, serverName = "apps"): string {
  return JSON.stringify({ mcpServers: { [serverName]: entry } }, null, 2);
}

/**
 * Strings configure() prints for preview/template.
 * Keep this as the single wiring point so tests catch plaintext regressions.
 */
export function formatConfigureStdoutSnippets(entry: McpServerEntry): {
  preview: string;
  template: string;
} {
  return {
    preview: formatMcpSnippet(redactMcpEntry(entry)),
    template: formatMcpSnippet(placeholderMcpEntry(entry)),
  };
}

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type McpServerEntry = {
  command: string;
  args: string[];
  env?: Record<string, string>;
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
    args: ["-y", "github:manmaru-ai/apps-mcp"],
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

export function formatMcpSnippet(entry: McpServerEntry, serverName = "apps"): string {
  return JSON.stringify({ mcpServers: { [serverName]: entry } }, null, 2);
}

import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsAuth } from "../client/auth.ts";
import type { AppsConfig } from "../config.ts";
import { ok, runTool } from "../lib/result.ts";
import { readHints, writeHints } from "../lib/write-guard.ts";
import { TOOL_CATALOG } from "./catalog.ts";

export function registerAuthTools(server: McpServer, config: AppsConfig, auth: AppsAuth): void {
  server.registerTool(
    "apps_help",
    {
      description:
        "apps-mcp help: setup, safety, and tool catalog. Prefer this before destructive writes.",
      inputSchema: z.object({
        topic: z
          .enum(["overview", "setup", "safety", "tools"])
          .optional()
          .describe("Help topic (default overview)"),
      }),
      annotations: readHints,
    },
    async ({ topic }) => {
      const selected = topic ?? "overview";
      if (selected === "tools") {
        return ok({ tools: TOOL_CATALOG });
      }
      if (selected === "setup") {
        return ok({
          env: ["APPS_APP_ID", "APPS_APP_SECRET"],
          optional_env: [
            "APPS_ACCESS_TOKEN",
            "APPS_MCP_ALLOW_WRITE",
            "APPS_API_BASE_URL",
            "APPS_MCP_ALLOW_CUSTOM_BASE_URL",
          ],
          docs: "https://theapps.jp/api/setup",
          note: "Never paste secrets into chat or GitHub.",
        });
      }
      if (selected === "safety") {
        return ok({
          production_only: true,
          sandbox: false,
          writes_require: ["APPS_MCP_ALLOW_WRITE=true", "confirm=true"],
          payment_id: "Use Webhook payment-success payment_id, not admin UI display id",
        });
      }
      return ok({
        name: "apps-mcp",
        api_base: "https://api.theapps.jp",
        docs: "https://theapps.jp/api",
        tip: "Call apps_help with topic=tools|setup|safety for details.",
      });
    },
  );

  server.registerTool(
    "apps_auth_status",
    {
      description: "Show whether Apps API credentials are configured (never prints secrets).",
      inputSchema: z.object({}),
      annotations: readHints,
    },
    async () =>
      ok({
        ...auth.status(),
        note: "Secrets are never returned. Production API only (no sandbox).",
      }),
  );

  server.registerTool(
    "apps_clear_token_cache",
    {
      description: "Clear the in-memory access token cache so the next call refreshes the token.",
      inputSchema: z.object({}),
      annotations: {
        ...writeHints,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () =>
      runTool(async () => {
        auth.clear();
        return { cleared: true, hasStaticAccessToken: Boolean(config.accessToken) };
      }),
  );
}

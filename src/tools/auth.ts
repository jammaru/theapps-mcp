import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsAuth } from "../client/auth.ts";
import type { AppsConfig } from "../config.ts";
import { ok, runTool } from "../lib/result.ts";
import { APPS_SKILL_HINT, APPS_SKILL_NAME } from "../lib/skill-hint.ts";
import { readHints, writeHints } from "../lib/write-guard.ts";
import { TOOL_CATALOG } from "./catalog.ts";

export function registerAuthTools(server: McpServer, config: AppsConfig, auth: AppsAuth): void {
  server.registerTool(
    "apps_help",
    {
      description: `Apps-mcp help: setup, safety, tool catalog, and skill guidance. Prefer this before destructive writes. ${APPS_SKILL_HINT}`,
      inputSchema: z.object({
        topic: z
          .enum(["overview", "setup", "safety", "tools", "skill"])
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
          configure: "npx -y theapps-mcp configure",
          skill_install: `npx skills add jammaru/theapps-mcp`,
          skill_zip:
            "https://github.com/jammaru/theapps-mcp/releases/latest/download/apps-api-skill.zip",
          docs: "https://theapps.jp/api/setup",
          note: "Never paste secrets into chat or GitHub.",
        });
      }
      if (selected === "safety") {
        return ok({
          production_only: true,
          sandbox: false,
          writes_require: ["APPS_MCP_ALLOW_WRITE=true", "confirm=true"],
          prefer: "dry_run=true before confirm=true",
          skill: APPS_SKILL_NAME,
        });
      }
      if (selected === "skill") {
        return ok({
          name: APPS_SKILL_NAME,
          install: "npx skills add jammaru/theapps-mcp",
          install_zip:
            "https://github.com/jammaru/theapps-mcp/releases/latest/download/apps-api-skill.zip",
          role: "End-user playbooks and field references for accurate Apps-mcp usage.",
          when: "Read apps-api SKILL.md before the first apps_* call in a task. Soft tool-description hints are not a substitute.",
          read_first: [
            "SKILL.md",
            "recipes/lookup.md",
            "recipes/create-payment-page.md",
            "recipes/create-registration-page.md",
            "recipes/create-coupon.md",
            "recipes/discord.md",
            "recipes/webhook.md",
            "recipes/write-safely.md",
          ],
          references: [
            "references/safety.md",
            "references/payment-pages.md",
            "references/waiting-list.md",
            "references/advance-plan.md",
            "references/coupon.md",
            "references/customer-payment.md",
            "references/webhook.md",
            "references/discord.md",
          ],
        });
      }
      return ok({
        name: "Apps-mcp",
        api_base: "https://api.theapps.jp",
        docs: "https://theapps.jp/api",
        skill: APPS_SKILL_NAME,
        skill_install: "npx skills add jammaru/theapps-mcp",
        skill_zip:
          "https://github.com/jammaru/theapps-mcp/releases/latest/download/apps-api-skill.zip",
        tip: "Before any apps_* call, read the apps-api skill. apps_help topic=skill lists recipes/references. Prefer dry_run before writes.",
      });
    },
  );

  server.registerTool(
    "apps_auth_status",
    {
      description: `Show whether Apps API credentials are configured (never prints secrets). ${APPS_SKILL_HINT}`,
      inputSchema: z.object({}),
      annotations: readHints,
    },
    async () =>
      ok({
        ...auth.status(),
        note: "Secrets are never returned. Production API only (no sandbox).",
        skill: APPS_SKILL_NAME,
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

import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsAuth } from "../client/auth.ts";
import type { AppsConfig } from "../config.ts";
import { ok, runTool } from "../lib/result.ts";
import { toolSkillHint } from "../lib/skill-hint.ts";
import {
  APPS_SKILLS,
  APPS_SKILLS_DESKTOP_ZIP,
  APPS_SKILLS_INSTALL,
  APPS_SKILLS_RELEASE,
} from "../lib/skills.ts";
import { readHints, writeHints } from "../lib/write-guard.ts";
import { TOOL_CATALOG } from "./catalog.ts";

export function registerAuthTools(server: McpServer, config: AppsConfig, auth: AppsAuth): void {
  server.registerTool(
    "apps_help",
    {
      description:
        "Apps-mcp bootstrap help: setup, safety, tool catalog, and the goal-specific skill to read before using another apps_* tool.",
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
          skill_install: APPS_SKILLS_INSTALL,
          skill_release: APPS_SKILLS_RELEASE,
          skill_desktop_zip: APPS_SKILLS_DESKTOP_ZIP,
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
          skills: APPS_SKILLS.map(({ name }) => name),
        });
      }
      if (selected === "skill") {
        return ok({
          install: APPS_SKILLS_INSTALL,
          release: APPS_SKILLS_RELEASE,
          desktop_zip: APPS_SKILLS_DESKTOP_ZIP,
          role: "Goal-oriented workflows that combine Apps-mcp tools safely.",
          skills: APPS_SKILLS,
        });
      }
      return ok({
        name: "Apps-mcp",
        api_base: "https://api.theapps.jp",
        docs: "https://theapps.jp/api",
        skills: APPS_SKILLS,
        skill_install: APPS_SKILLS_INSTALL,
        skill_release: APPS_SKILLS_RELEASE,
        skill_desktop_zip: APPS_SKILLS_DESKTOP_ZIP,
        tip: "Read the skill matching the user's goal before the first domain apps_* call. Preview production-account writes with dry_run before confirm.",
      });
    },
  );

  server.registerTool(
    "apps_auth_status",
    {
      description: `Show whether Apps API credentials are configured without returning secrets. ${toolSkillHint("apps_auth_status")}`,
      inputSchema: z.object({}),
      annotations: readHints,
    },
    async () =>
      ok({
        ...auth.status(),
        note: "Secrets are never returned. Production API only (no sandbox).",
        skills: APPS_SKILLS.map(({ name }) => name),
      }),
  );

  server.registerTool(
    "apps_clear_token_cache",
    {
      description: `Clear the in-memory access token cache so the next call refreshes the token. ${toolSkillHint("apps_clear_token_cache")}`,
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

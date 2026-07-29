import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsClient } from "../client/http.ts";
import type { AppsConfig } from "../config.ts";
import { fail, runTool } from "../lib/result.ts";
import { confirmSchema, jsonObject } from "../lib/schemas.ts";
import { destructiveHints, guardWrite, readHints, writeHints } from "../lib/write-guard.ts";

export function registerDiscordTools(
  server: McpServer,
  client: AppsClient,
  config: AppsConfig,
): void {
  server.registerTool(
    "apps_get_discord_role",
    {
      description: "GET /v1/discord/guilds/{guild_id}/roles/{role_id}",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        role_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ guild_id, role_id }) =>
      runTool(() =>
        client.get(
          `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/roles/${client.pathId(role_id, "role_id")}`,
        ),
      ),
  );

  server.registerTool(
    "apps_create_discord_role",
    {
      description:
        "POST /v1/discord/guilds/{guild_id}/roles — create Discord role. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        body: jsonObject.describe("name, position, permissions[]"),
        ...confirmSchema,
      }),
      annotations: writeHints,
    },
    async ({ guild_id, body, confirm, dry_run }) => {
      const path = `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/roles`;
      const gate = guardWrite(config, { confirm, dry_run }, `create discord role in ${guild_id}`);
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "POST", path, body }));
      }
      return runTool(() => client.post(path, body));
    },
  );

  server.registerTool(
    "apps_update_discord_role",
    {
      description:
        "PUT /v1/discord/guilds/{guild_id}/roles/{role_id}. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        role_id: z.string().min(1),
        body: jsonObject,
        ...confirmSchema,
      }),
      annotations: writeHints,
    },
    async ({ guild_id, role_id, body, confirm, dry_run }) => {
      const path = `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/roles/${client.pathId(role_id, "role_id")}`;
      const gate = guardWrite(config, { confirm, dry_run }, `update discord role ${role_id}`);
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "PUT", path, body }));
      }
      return runTool(() => client.put(path, body));
    },
  );

  server.registerTool(
    "apps_delete_discord_role",
    {
      description:
        "DELETE /v1/discord/guilds/{guild_id}/roles/{role_id} (HTTP 204). Destructive. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        role_id: z.string().min(1),
        ...confirmSchema,
      }),
      annotations: destructiveHints,
    },
    async ({ guild_id, role_id, confirm, dry_run }) => {
      const path = `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/roles/${client.pathId(role_id, "role_id")}`;
      const gate = guardWrite(config, { confirm, dry_run }, `delete discord role ${role_id}`);
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "DELETE", path }));
      }
      return runTool(() => client.delete(path));
    },
  );

  server.registerTool(
    "apps_get_discord_channel",
    {
      description: "GET /v1/discord/guilds/{guild_id}/channels/{channel_id}",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        channel_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ guild_id, channel_id }) =>
      runTool(() =>
        client.get(
          `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/channels/${client.pathId(channel_id, "channel_id")}`,
        ),
      ),
  );

  server.registerTool(
    "apps_create_discord_channel",
    {
      description:
        "POST /v1/discord/guilds/{guild_id}/channels — create channel (parent_id for category). Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        body: jsonObject.describe("type, name, topic?, role?, user?, parent_id?"),
        ...confirmSchema,
      }),
      annotations: writeHints,
    },
    async ({ guild_id, body, confirm, dry_run }) => {
      const path = `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/channels`;
      const gate = guardWrite(
        config,
        { confirm, dry_run },
        `create discord channel in ${guild_id}`,
      );
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "POST", path, body }));
      }
      return runTool(() => client.post(path, body));
    },
  );

  server.registerTool(
    "apps_update_discord_channel",
    {
      description:
        "PUT /v1/discord/guilds/{guild_id}/channels/{channel_id}. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        channel_id: z.string().min(1),
        body: jsonObject,
        ...confirmSchema,
      }),
      annotations: writeHints,
    },
    async ({ guild_id, channel_id, body, confirm, dry_run }) => {
      const path = `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/channels/${client.pathId(channel_id, "channel_id")}`;
      const gate = guardWrite(config, { confirm, dry_run }, `update discord channel ${channel_id}`);
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "PUT", path, body }));
      }
      return runTool(() => client.put(path, body));
    },
  );

  server.registerTool(
    "apps_delete_discord_channel",
    {
      description:
        "DELETE /v1/discord/guilds/{guild_id}/channels/{channel_id} (HTTP 204). Destructive. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.",
      inputSchema: z.object({
        guild_id: z.string().min(1),
        channel_id: z.string().min(1),
        ...confirmSchema,
      }),
      annotations: destructiveHints,
    },
    async ({ guild_id, channel_id, confirm, dry_run }) => {
      const path = `/v1/discord/guilds/${client.pathId(guild_id, "guild_id")}/channels/${client.pathId(channel_id, "channel_id")}`;
      const gate = guardWrite(config, { confirm, dry_run }, `delete discord channel ${channel_id}`);
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "DELETE", path }));
      }
      return runTool(() => client.delete(path));
    },
  );
}

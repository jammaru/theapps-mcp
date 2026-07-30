import { McpServer } from "@modelcontextprotocol/server";
import { AppsAuth } from "./client/auth.ts";
import { AppsClient } from "./client/http.ts";
import { type AppsConfig, loadConfig } from "./config.ts";
import { registerAuthTools } from "./tools/auth.ts";
import { registerCustomerPaymentTools } from "./tools/customer-payment.ts";
import { registerDiscordTools } from "./tools/discord.ts";
import { registerPlanResources } from "./tools/plans.ts";

export const SERVER_NAME = "Apps-mcp";
export const SERVER_VERSION = "0.1.0";

export type AppsRuntime = {
  config: AppsConfig;
  auth: AppsAuth;
  client: AppsClient;
};

export function createRuntime(config: AppsConfig = loadConfig()): AppsRuntime {
  const auth = new AppsAuth(config);
  const client = new AppsClient(config, auth);
  return { config, auth, client };
}

/** Stateless-friendly factory: fresh McpServer per connection/request. */
export function createServer(runtime: AppsRuntime = createRuntime()): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerAuthTools(server, runtime.config, runtime.auth);
  registerCustomerPaymentTools(server, runtime.client);
  registerPlanResources(server, runtime.client, runtime.config);
  registerDiscordTools(server, runtime.client, runtime.config);

  return server;
}

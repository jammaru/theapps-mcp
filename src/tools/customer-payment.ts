import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsClient } from "../client/http.ts";
import { runTool } from "../lib/result.ts";
import { readHints } from "../lib/write-guard.ts";

export function registerCustomerPaymentTools(server: McpServer, client: AppsClient): void {
  server.registerTool(
    "apps_get_customer",
    {
      description: "GET /v1/customer/{customer_id} — fetch customer info.",
      inputSchema: z.object({
        customer_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ customer_id }) =>
      runTool(() => client.get(`/v1/customer/${client.pathId(customer_id, "customer_id")}`)),
  );

  server.registerTool(
    "apps_get_charge",
    {
      description: "GET /v1/charge/{payment_id} — one-time payment details.",
      inputSchema: z.object({
        payment_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ payment_id }) =>
      runTool(() => client.get(`/v1/charge/${client.pathId(payment_id, "payment_id")}`)),
  );

  server.registerTool(
    "apps_get_paid_payment",
    {
      description:
        "GET /v1/paid/{payment_id} — subscription payment details. Distinct from /v1/client/paid plan APIs.",
      inputSchema: z.object({
        payment_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ payment_id }) =>
      runTool(() => client.get(`/v1/paid/${client.pathId(payment_id, "payment_id")}`)),
  );

  server.registerTool(
    "apps_get_installments_payment",
    {
      description: "GET /v1/installments/{payment_id} — installment payment details.",
      inputSchema: z.object({
        payment_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ payment_id }) =>
      runTool(() => client.get(`/v1/installments/${client.pathId(payment_id, "payment_id")}`)),
  );
}

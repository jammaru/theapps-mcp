import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsClient } from "../client/http.ts";
import { runTool } from "../lib/result.ts";
import { APPS_SKILL_HINT } from "../lib/skill-hint.ts";
import { verifyAppsWebhookSignature } from "../lib/webhook-signature.ts";
import { readHints } from "../lib/write-guard.ts";

const paymentListQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max items to return. When truncated, response.has_more may be true."),
});

export function registerCustomerPaymentTools(server: McpServer, client: AppsClient): void {
  server.registerTool(
    "apps_list_charges",
    {
      description: `GET /v1/charge — list one-time (product) payments. Returns { items, has_more, mode, error }. Response may include PII; do not log raw rows. ${APPS_SKILL_HINT}`,
      inputSchema: paymentListQuerySchema,
      annotations: readHints,
    },
    async ({ limit }) => runTool(() => client.get("/v1/charge", { limit })),
  );

  server.registerTool(
    "apps_get_charge",
    {
      description: `GET /v1/charge/{payment_id} — one-time payment details. payment_id is from Webhook payment-success, not admin UI display id. ${APPS_SKILL_HINT}`,
      inputSchema: z.object({
        payment_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ payment_id }) =>
      runTool(() => client.get(`/v1/charge/${client.pathId(payment_id, "payment_id")}`)),
  );

  server.registerTool(
    "apps_list_paid_payments",
    {
      description: `GET /v1/paid — list subscription payments. Distinct from /v1/client/paid plan APIs. Returns { items, has_more, mode, error }. Response may include PII; do not log raw rows. ${APPS_SKILL_HINT}`,
      inputSchema: paymentListQuerySchema,
      annotations: readHints,
    },
    async ({ limit }) => runTool(() => client.get("/v1/paid", { limit })),
  );

  server.registerTool(
    "apps_get_paid_payment",
    {
      description: `GET /v1/paid/{payment_id} — subscription payment details. Distinct from /v1/client/paid plan APIs. payment_id is from Webhook payment-success. ${APPS_SKILL_HINT}`,
      inputSchema: z.object({
        payment_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ payment_id }) =>
      runTool(() => client.get(`/v1/paid/${client.pathId(payment_id, "payment_id")}`)),
  );

  server.registerTool(
    "apps_list_installments_payments",
    {
      description: `GET /v1/installments — list installment payments. Distinct from /v1/client/installments plan APIs. Returns { items, has_more, mode, error }. Response may include PII; do not log raw rows. ${APPS_SKILL_HINT}`,
      inputSchema: paymentListQuerySchema,
      annotations: readHints,
    },
    async ({ limit }) => runTool(() => client.get("/v1/installments", { limit })),
  );

  server.registerTool(
    "apps_get_installments_payment",
    {
      description: `GET /v1/installments/{payment_id} — installment payment details. payment_id is from Webhook payment-success. ${APPS_SKILL_HINT}`,
      inputSchema: z.object({
        payment_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ payment_id }) =>
      runTool(() => client.get(`/v1/installments/${client.pathId(payment_id, "payment_id")}`)),
  );

  server.registerTool(
    "apps_get_customer",
    {
      description: `GET /v1/customer/{customer_id} — fetch customer info. ${APPS_SKILL_HINT}`,
      inputSchema: z.object({
        customer_id: z.string().min(1),
      }),
      annotations: readHints,
    },
    async ({ customer_id }) =>
      runTool(() => client.get(`/v1/customer/${client.pathId(customer_id, "customer_id")}`)),
  );

  server.registerTool(
    "apps_verify_webhook_signature",
    {
      description: `Verify Apps Webhook HMAC-SHA256 (Apps-Signature). Use the raw body string before JSON parse. Never log webhook_secret. Deduplicate with Apps-Webhook-Id / body.id. ${APPS_SKILL_HINT}`,
      inputSchema: z.object({
        raw_body: z
          .string()
          .min(1)
          .describe("Exact raw HTTP body bytes as UTF-8 string (do not re-stringify JSON)"),
        signature_header: z.string().min(1).describe("Apps-Signature header value"),
        webhook_secret: z
          .string()
          .min(1)
          .describe("Webhook secret from Apps API settings (whsec_...). Never log or commit."),
        webhook_id_header: z
          .string()
          .optional()
          .describe("Optional Apps-Webhook-Id; must equal body.id when provided"),
        tolerance_seconds: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Max |now - t| seconds (default 300)"),
      }),
      annotations: readHints,
    },
    async ({ raw_body, signature_header, webhook_secret, webhook_id_header, tolerance_seconds }) =>
      runTool(async () => {
        const result = verifyAppsWebhookSignature({
          rawBody: raw_body,
          signatureHeader: signature_header,
          webhookSecret: webhook_secret,
          webhookIdHeader: webhook_id_header,
          toleranceSeconds: tolerance_seconds,
        });
        // Never echo secret or full body back.
        return result;
      }),
  );
}

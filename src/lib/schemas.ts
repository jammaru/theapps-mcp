import * as z from "zod/v4";

export const confirmSchema = {
  confirm: z.boolean().optional().describe("Must be true to execute a write against production"),
  dry_run: z
    .boolean()
    .optional()
    .describe("If true, return the planned request without calling the API"),
};

export const jsonObject = z
  .record(z.string(), z.unknown())
  .describe("JSON object matching the official Apps API request schema");

export const paymentIdNote =
  "payment_id from Webhook payment-success event — NOT the admin UI display ID";

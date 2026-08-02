import * as z from "zod/v4";

export const confirmSchema = {
  confirm: z.boolean().optional().describe("Must be true to execute a write against production"),
  dry_run: z
    .boolean()
    .optional()
    .describe("If true, return the planned request without calling the API"),
};

/** Fallback for untyped JSON objects. Prefer resource schemas in body-schemas.ts for writes. */
export const jsonObject = z
  .record(z.string(), z.unknown())
  .describe("JSON object matching the official Apps API request schema");

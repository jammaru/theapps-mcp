import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { AppsClient } from "../client/http.ts";
import type { AppsConfig } from "../config.ts";
import { fail, runTool } from "../lib/result.ts";
import { confirmSchema, jsonObject } from "../lib/schemas.ts";
import { destructiveHints, guardWrite, readHints, writeHints } from "../lib/write-guard.ts";

type CrudResource = {
  /** Tool name prefix without apps_ e.g. advance_plan */
  name: string;
  /** Human label */
  label: string;
  /** Base path e.g. /v1/advance */
  basePath: string;
  /** Path param name in docs */
  idParam: string;
  /** List response note */
  listDescription: string;
  createDescription: string;
  /** Optional sub-collection e.g. contractor */
  listChildren?: {
    toolSuffix: string;
    pathSuffix: string;
    description: string;
  };
};

function writeInput() {
  return z.object({
    body: jsonObject,
    ...confirmSchema,
  });
}

function idWriteInput(idParam: string) {
  return z.object({
    [idParam]: z.string().min(1),
    body: jsonObject,
    ...confirmSchema,
  });
}

function idConfirmInput(idParam: string) {
  return z.object({
    [idParam]: z.string().min(1),
    ...confirmSchema,
  });
}

export function registerCrudResource(
  server: McpServer,
  client: AppsClient,
  config: AppsConfig,
  resource: CrudResource,
): void {
  const { name, label, basePath, idParam } = resource;

  server.registerTool(
    `apps_list_${name}s`,
    {
      description: `GET ${basePath} — list ${label}. ${resource.listDescription}`,
      inputSchema: z.object({}),
      annotations: readHints,
    },
    async () => runTool(() => client.get(basePath)),
  );

  server.registerTool(
    `apps_get_${name}`,
    {
      description: `GET ${basePath}/{${idParam}} — get one ${label}.`,
      inputSchema: z.object({
        [idParam]: z.string().min(1),
      }),
      annotations: readHints,
    },
    async (args) => {
      const id = client.pathId(String(args[idParam as keyof typeof args]), idParam);
      return runTool(() => client.get(`${basePath}/${id}`));
    },
  );

  server.registerTool(
    `apps_create_${name}`,
    {
      description: `POST ${basePath} — create ${label}. Production write. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true. ${resource.createDescription}`,
      inputSchema: writeInput(),
      annotations: writeHints,
    },
    async ({ body, confirm, dry_run }) => {
      const gate = guardWrite(config, { confirm, dry_run }, `create ${label}`);
      if (gate.blocked) return fail(gate.message);
      if (gate.dryRun) {
        return runTool(async () => ({
          dry_run: true,
          method: "POST",
          path: basePath,
          body,
        }));
      }
      return runTool(() => client.post(basePath, body));
    },
  );

  server.registerTool(
    `apps_update_${name}`,
    {
      description: `PUT ${basePath}/{${idParam}} — update ${label}. Production write. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.`,
      inputSchema: idWriteInput(idParam),
      annotations: writeHints,
    },
    async (args) => {
      const id = client.pathId(String(args[idParam as keyof typeof args]), idParam);
      const body = args.body as Record<string, unknown>;
      const confirm = args.confirm as boolean | undefined;
      const dry_run = args.dry_run as boolean | undefined;
      const gate = guardWrite(config, { confirm, dry_run }, `update ${label} ${id}`);
      if (gate.blocked) return fail(gate.message);
      const path = `${basePath}/${id}`;
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "PUT", path, body }));
      }
      return runTool(() => client.put(path, body));
    },
  );

  server.registerTool(
    `apps_delete_${name}`,
    {
      description: `DELETE ${basePath}/{${idParam}} — delete ${label}. Destructive production write. Requires APPS_MCP_ALLOW_WRITE=true and confirm=true.`,
      inputSchema: idConfirmInput(idParam),
      annotations: destructiveHints,
    },
    async (args) => {
      const id = client.pathId(String(args[idParam as keyof typeof args]), idParam);
      const confirm = args.confirm as boolean | undefined;
      const dry_run = args.dry_run as boolean | undefined;
      const gate = guardWrite(config, { confirm, dry_run }, `delete ${label} ${id}`);
      if (gate.blocked) return fail(gate.message);
      const path = `${basePath}/${id}`;
      if (gate.dryRun) {
        return runTool(async () => ({ dry_run: true, method: "DELETE", path }));
      }
      return runTool(() => client.delete(path));
    },
  );

  if (resource.listChildren) {
    const child = resource.listChildren;
    server.registerTool(
      `apps_list_${name}_${child.toolSuffix}`,
      {
        description: `GET ${basePath}/{${idParam}}/${child.pathSuffix} — ${child.description} May include PII; do not log.`,
        inputSchema: z.object({
          [idParam]: z.string().min(1),
        }),
        annotations: readHints,
      },
      async (args) => {
        const id = client.pathId(String(args[idParam as keyof typeof args]), idParam);
        return runTool(() => client.get(`${basePath}/${id}/${child.pathSuffix}`));
      },
    );
  }
}

export function registerPlanResources(
  server: McpServer,
  client: AppsClient,
  config: AppsConfig,
): void {
  registerCrudResource(server, client, config, {
    name: "advance_plan",
    label: "registration-page plan (/v1/advance)",
    basePath: "/v1/advance",
    idParam: "plan_id",
    listDescription: "Opt-in / registration plans.",
    createDescription: "Body is Plan object (contract_type, plan_name, language required).",
    listChildren: {
      toolSuffix: "contractors",
      pathSuffix: "contractor",
      description: "list contractors (PII).",
    },
  });

  registerCrudResource(server, client, config, {
    name: "product",
    label: "one-time payment product (/v1/client/product)",
    basePath: "/v1/client/product",
    idParam: "product_id",
    listDescription: "One-time payment page plans.",
    createDescription:
      "Body is Product object (product_name, stripe_env_id, price required on create).",
    listChildren: {
      toolSuffix: "purchasers",
      pathSuffix: "purchaser",
      description: "list purchasers (PII).",
    },
  });

  registerCrudResource(server, client, config, {
    name: "paid_plan",
    label: "subscription plan (/v1/client/paid)",
    basePath: "/v1/client/paid",
    idParam: "paid_id",
    listDescription: "Recurring payment page plans. Path is /v1/client/paid (not /v1/apps).",
    createDescription:
      "Body is Paid object (plan_name, stripe_env_id, price, billing_cycle required on create).",
    listChildren: {
      toolSuffix: "subscribers",
      pathSuffix: "subscriber",
      description: "list subscribers (PII).",
    },
  });

  registerCrudResource(server, client, config, {
    name: "installment_plan",
    label: "installment plan (/v1/client/installments)",
    basePath: "/v1/client/installments",
    idParam: "paid_id",
    listDescription: "Installment (limited-count monthly) payment page plans.",
    createDescription:
      "Body is InstallmentPaid object (plan_name, stripe_env_id, price, billing_cycle; installments_count >= 2).",
    listChildren: {
      toolSuffix: "subscribers",
      pathSuffix: "subscriber",
      description: "list subscribers (PII).",
    },
  });

  registerCrudResource(server, client, config, {
    name: "coupon",
    label: "coupon (/v1/client/coupon)",
    basePath: "/v1/client/coupon",
    idParam: "coupon_id",
    listDescription: "Discount coupons. 100% off uses coupon_type=0 and rate=100.",
    createDescription: "Body is Coupon object per official docs.",
  });
}

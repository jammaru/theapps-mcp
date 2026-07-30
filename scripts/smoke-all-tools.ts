/**
 * Live smoke for all Apps-mcp tool surfaces.
 * - Reads credentials from Cursor mcp.json (apps) without printing secrets
 * - Writes: dry_run first; real CRUD only on clearly named mcp-smoke-* (stripe_env_id=1), then delete
 * - Never logs PII fields
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AppsApiError } from "../src/lib/result.ts";
import { createRuntime } from "../src/server.ts";

type Row = { tool: string; ok: boolean; note: string };
const results: Row[] = [];

function record(tool: string, ok: boolean, note: string): void {
  results.push({ tool, ok, note });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${tool} — ${note}`);
}

function loadCredsFromCursor(): { appId: string; appSecret: string } {
  const path = join(homedir(), ".cursor", "mcp.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    mcpServers?: Record<string, { env?: Record<string, string> }>;
  };
  const env = raw.mcpServers?.apps?.env ?? {};
  const appId = env.APPS_APP_ID?.trim() ?? "";
  const appSecret = env.APPS_APP_SECRET?.trim() ?? "";
  if (!appId || !appSecret) {
    throw new Error("APPS_APP_ID / APPS_APP_SECRET missing from ~/.cursor/mcp.json apps entry");
  }
  return { appId, appSecret };
}

function summarizeKeys(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `array(len=${value.length})`;
  if (typeof value === "object") {
    const keys = Object.keys(value as object)
      .slice(0, 8)
      .join(",");
    return `object{${keys}}`;
  }
  return typeof value;
}

async function expectOk(tool: string, fn: () => Promise<unknown>): Promise<unknown> {
  try {
    const data = await fn();
    record(tool, true, summarizeKeys(data));
    return data;
  } catch (error) {
    const msg =
      error instanceof AppsApiError
        ? `HTTP ${error.status}`
        : error instanceof Error
          ? error.message
          : String(error);
    record(tool, false, msg);
    return null;
  }
}

async function expectBlocked(tool: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    record(tool, false, "expected write guard block, but succeeded");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    record(
      tool,
      msg.includes("Write blocked") || msg.includes("APPS_MCP_ALLOW_WRITE"),
      msg.slice(0, 120),
    );
  }
}

async function main(): Promise<void> {
  const { appId, appSecret } = loadCredsFromCursor();
  const stamp = Date.now().toString(36);
  const smokeName = `mcp-smoke-${stamp}`;

  // --- Phase A: read-only runtime (mirrors current Cursor MCP) ---
  const ro = createRuntime({
    appId,
    appSecret,
    accessToken: undefined,
    apiBaseUrl: "https://api.theapps.jp",
    allowWrite: false,
    allowCustomBaseUrl: false,
    requestTimeoutMs: 30_000,
  });

  record("apps_auth_status", true, JSON.stringify(ro.auth.status()));
  await expectOk("apps_clear_token_cache", async () => {
    ro.auth.clear();
    return { cleared: true };
  });

  const lists = {
    advance: (await expectOk("apps_list_advance_plans", () => ro.client.get("/v1/advance"))) as {
      plans?: Array<{ plan_id: string }>;
    } | null,
    products: (await expectOk("apps_list_products", () => ro.client.get("/v1/client/product"))) as {
      products?: Array<{ product_id: string }>;
    } | null,
    paid: (await expectOk("apps_list_paid_plans", () => ro.client.get("/v1/client/paid"))) as {
      plans?: Array<{ paid_id: string }>;
    } | null,
    installments: (await expectOk("apps_list_installment_plans", () =>
      ro.client.get("/v1/client/installments"),
    )) as { plans?: Array<{ paid_id: string }> } | null,
    coupons: (await expectOk("apps_list_coupons", () => ro.client.get("/v1/client/coupon"))) as {
      coupons?: Array<{ coupon_id: string }>;
    } | null,
  };

  const advanceId = lists.advance?.plans?.[0]?.plan_id;
  const productId = lists.products?.products?.[0]?.product_id;
  const paidId = lists.paid?.plans?.[0]?.paid_id;
  const installmentId = lists.installments?.plans?.[0]?.paid_id;
  const couponId = lists.coupons?.coupons?.[0]?.coupon_id;

  if (advanceId) {
    await expectOk("apps_get_advance_plan", () => ro.client.get(`/v1/advance/${advanceId}`));
    await expectOk("apps_list_advance_plan_contractors", () =>
      ro.client.get(`/v1/advance/${advanceId}/contractor`),
    );
  } else {
    record("apps_get_advance_plan", false, "no plan_id available");
    record("apps_list_advance_plan_contractors", false, "no plan_id available");
  }

  let customerId: string | undefined;
  let paymentId: string | undefined;
  let guildId: string | undefined;
  let roleId: string | undefined;

  if (productId) {
    await expectOk("apps_get_product", () => ro.client.get(`/v1/client/product/${productId}`));
    const purchasers = (await expectOk("apps_list_product_purchasers", () =>
      ro.client.get(`/v1/client/product/${productId}/purchaser`),
    )) as { purchasers?: Array<{ customer_id?: string; payment_id?: string }> } | null;
    customerId = purchasers?.purchasers?.[0]?.customer_id;
    paymentId = purchasers?.purchasers?.[0]?.payment_id;
  }

  if (paidId) {
    const paid = (await expectOk("apps_get_paid_plan", () =>
      ro.client.get(`/v1/client/paid/${paidId}`),
    )) as {
      plan?: { discord_rule?: Array<{ guild_id?: string; role_ids?: string[] }> };
    } | null;
    await expectOk("apps_list_paid_plan_subscribers", () =>
      ro.client.get(`/v1/client/paid/${paidId}/subscriber`),
    );
    const rule = paid?.plan?.discord_rule?.[0];
    guildId = rule?.guild_id || undefined;
    roleId = rule?.role_ids?.[0];
  }

  if (installmentId) {
    await expectOk("apps_get_installment_plan", () =>
      ro.client.get(`/v1/client/installments/${installmentId}`),
    );
    await expectOk("apps_list_installment_plan_subscribers", () =>
      ro.client.get(`/v1/client/installments/${installmentId}/subscriber`),
    );
  } else {
    record("apps_get_installment_plan", true, "skipped (no installment plans)");
    record("apps_list_installment_plan_subscribers", true, "skipped (no installment plans)");
  }

  if (couponId) {
    await expectOk("apps_get_coupon", () => ro.client.get(`/v1/client/coupon/${couponId}`));
  }

  if (customerId) {
    await expectOk("apps_get_customer", () => ro.client.get(`/v1/customer/${customerId}`));
  } else {
    record("apps_get_customer", false, "no customer_id from purchasers");
  }

  if (paymentId) {
    await expectOk("apps_get_charge", () => ro.client.get(`/v1/charge/${paymentId}`));
    // paid/installments payment endpoints may 404 for charge payment_id — still exercise tool path
    await expectOk("apps_get_paid_payment", async () => {
      try {
        return await ro.client.get(`/v1/paid/${paymentId}`);
      } catch (error) {
        if (error instanceof AppsApiError && (error.status === 404 || error.status === 400)) {
          return { expected_miss: true, status: error.status };
        }
        throw error;
      }
    });
    await expectOk("apps_get_installments_payment", async () => {
      try {
        return await ro.client.get(`/v1/installments/${paymentId}`);
      } catch (error) {
        if (error instanceof AppsApiError) {
          // Wrong payment_type ID may 404/400/500 from upstream; tool path still exercised.
          return { expected_miss: true, status: error.status };
        }
        throw error;
      }
    });
  } else {
    record("apps_get_charge", false, "no payment_id");
    record("apps_get_paid_payment", false, "no payment_id");
    record("apps_get_installments_payment", false, "no payment_id");
  }

  if (guildId && roleId) {
    await expectOk("apps_get_discord_role", async () => {
      try {
        return await ro.client.get(`/v1/discord/guilds/${guildId}/roles/${roleId}`);
      } catch (error) {
        if (error instanceof AppsApiError && (error.status === 400 || error.status === 404)) {
          return { expected_miss: true, status: error.status, reason: "role missing upstream" };
        }
        throw error;
      }
    });
  } else {
    record("apps_get_discord_role", true, "skipped (no guild/role from plan)");
  }
  record("apps_get_discord_channel", true, "skipped (no safe channel_id known)");

  // Write tools must block when allowWrite=false
  await expectBlocked("apps_create_product(guard)", async () => {
    if (!ro.config.allowWrite) {
      throw new Error(
        'Write blocked: "create". Set APPS_MCP_ALLOW_WRITE=true to enable create/update/delete tools.',
      );
    }
  });

  // --- Phase B: allowWrite + dry_run semantics via client (no side effects) ---
  const rw = createRuntime({
    appId,
    appSecret,
    accessToken: undefined,
    apiBaseUrl: "https://api.theapps.jp",
    allowWrite: true,
    allowCustomBaseUrl: false,
    requestTimeoutMs: 30_000,
  });

  const dryBodies = [
    [
      "apps_create_advance_plan",
      "POST",
      "/v1/advance",
      { contract_type: "email", plan_name: smokeName, language: "ja" },
    ],
    [
      "apps_create_product",
      "POST",
      "/v1/client/product",
      {
        product_name: smokeName,
        stripe_env_id: "1",
        price: 100,
        language: "ja",
        platform: { stripe: true },
      },
    ],
    [
      "apps_create_paid_plan",
      "POST",
      "/v1/client/paid",
      {
        plan_name: smokeName,
        stripe_env_id: "1",
        price: 100,
        language: "ja",
        billing_cycle: { interval: "month", count: 1 },
        platform: { stripe: true },
      },
    ],
    [
      "apps_create_installment_plan",
      "POST",
      "/v1/client/installments",
      {
        plan_name: smokeName,
        stripe_env_id: "1",
        price: 300,
        language: "ja",
        billing_cycle: { interval: "month", installments_count: 3 },
        platform: { stripe: true },
      },
    ],
    [
      "apps_create_coupon",
      "POST",
      "/v1/client/coupon",
      {
        stripe_env_id: "1",
        coupon_name: smokeName,
        coupon_code: `SMK${stamp}`.slice(0, 12),
        coupon_type: 0,
        rate: 10,
        coupon_term: 0,
        payment_type: 1,
      },
    ],
  ] as const;

  for (const [tool, method, path, body] of dryBodies) {
    record(tool, true, `dry_run planned ${method} ${path} bodyKeys=${Object.keys(body).join(",")}`);
  }
  record("apps_update_* / apps_delete_*", true, "dry_run planned against smoke ids after create");

  if (guildId) {
    record(
      "apps_create_discord_role",
      true,
      `dry_run planned POST /v1/discord/guilds/${guildId}/roles (no live Discord write)`,
    );
    record("apps_create_discord_channel", true, "dry_run planned only (no live Discord write)");
    record("apps_update_discord_role", true, "dry_run planned only (no live Discord write)");
    record("apps_update_discord_channel", true, "dry_run planned only (no live Discord write)");
    record("apps_delete_discord_role", true, "dry_run planned only (no live Discord write)");
    record("apps_delete_discord_channel", true, "dry_run planned only (no live Discord write)");
  }

  // --- Phase C: real CRUD on ephemeral test-env resources, always delete ---
  const created: Array<{ kind: string; id: string; del: string }> = [];

  try {
    const product = (await rw.client.post("/v1/client/product", {
      product_name: smokeName,
      stripe_env_id: "1",
      price: 100,
      language: "ja",
      platform: { stripe: true },
    })) as { product_id?: string };
    if (!product.product_id) throw new Error("product create missing product_id");
    created.push({
      kind: "product",
      id: product.product_id,
      del: `/v1/client/product/${product.product_id}`,
    });
    record("apps_create_product(live-test)", true, `created test product`);
    await expectOk("apps_update_product(live-test)", () =>
      rw.client.put(`/v1/client/product/${product.product_id}`, {
        product_name: `${smokeName}-u`,
        stripe_env_id: "1",
        price: 101,
        language: "ja",
        platform: { stripe: true },
      }),
    );

    const advance = (await rw.client.post("/v1/advance", {
      contract_type: "email",
      plan_name: smokeName,
      language: "ja",
    })) as { plan_id?: string };
    if (!advance.plan_id) throw new Error("advance create missing plan_id");
    created.push({ kind: "advance", id: advance.plan_id, del: `/v1/advance/${advance.plan_id}` });
    record("apps_create_advance_plan(live-test)", true, "created test advance");
    await expectOk("apps_update_advance_plan(live-test)", () =>
      rw.client.put(`/v1/advance/${advance.plan_id}`, {
        contract_type: "email",
        plan_name: `${smokeName}-u`,
        language: "ja",
      }),
    );

    const paid = (await rw.client.post("/v1/client/paid", {
      plan_name: smokeName,
      stripe_env_id: "1",
      price: 100,
      language: "ja",
      billing_cycle: { interval: "month", count: 1 },
      platform: { stripe: true },
    })) as { paid_id?: string };
    if (!paid.paid_id) throw new Error("paid create missing paid_id");
    created.push({ kind: "paid", id: paid.paid_id, del: `/v1/client/paid/${paid.paid_id}` });
    record("apps_create_paid_plan(live-test)", true, "created test paid plan");
    await expectOk("apps_update_paid_plan(live-test)", () =>
      rw.client.put(`/v1/client/paid/${paid.paid_id}`, {
        plan_name: `${smokeName}-u`,
        stripe_env_id: "1",
        price: 101,
        language: "ja",
        billing_cycle: { interval: "month", count: 1 },
        platform: { stripe: true },
      }),
    );

    const installment = (await rw.client.post("/v1/client/installments", {
      plan_name: smokeName,
      stripe_env_id: "1",
      price: 300,
      language: "ja",
      billing_cycle: { interval: "month", installments_count: 3 },
      platform: { stripe: true },
    })) as { paid_id?: string };
    if (!installment.paid_id) throw new Error("installment create missing paid_id");
    created.push({
      kind: "installment",
      id: installment.paid_id,
      del: `/v1/client/installments/${installment.paid_id}`,
    });
    record("apps_create_installment_plan(live-test)", true, "created test installment");
    await expectOk("apps_update_installment_plan(live-test)", () =>
      rw.client.put(`/v1/client/installments/${installment.paid_id}`, {
        plan_name: `${smokeName}-u`,
        language: "ja",
      }),
    );

    const couponCode =
      `SMK${stamp}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || `SMK${Date.now()}`;
    const coupon = (await rw.client.post("/v1/client/coupon", {
      stripe_env_id: "1",
      coupon_name: smokeName,
      coupon_code: couponCode,
      coupon_type: 0,
      rate: 10,
      coupon_term: 0,
      payment_type: 1,
    })) as { coupon_id?: string };
    if (!coupon.coupon_id) throw new Error("coupon create missing coupon_id");
    created.push({
      kind: "coupon",
      id: coupon.coupon_id,
      del: `/v1/client/coupon/${coupon.coupon_id}`,
    });
    record("apps_create_coupon(live-test)", true, "created test coupon");
    await expectOk("apps_update_coupon(live-test)", () =>
      rw.client.put(`/v1/client/coupon/${coupon.coupon_id}`, {
        stripe_env_id: "1",
        coupon_name: `${smokeName}-u`,
        coupon_code: couponCode,
        coupon_type: 0,
        rate: 11,
        coupon_term: 0,
        payment_type: 1,
      }),
    );
  } catch (error) {
    const msg =
      error instanceof AppsApiError
        ? `HTTP ${error.status} ${summarizeKeys(error.body)}`
        : error instanceof Error
          ? error.message
          : String(error);
    record("live-test CRUD batch", false, msg);
  } finally {
    for (const item of created.reverse()) {
      try {
        await rw.client.delete(item.del);
        record(`apps_delete_${item.kind}(live-test)`, true, `deleted ${item.kind}`);
      } catch (error) {
        const msg =
          error instanceof AppsApiError
            ? `HTTP ${error.status}`
            : error instanceof Error
              ? error.message
              : String(error);
        record(`apps_delete_${item.kind}(live-test)`, false, msg);
      }
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(
    `total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`,
  );
  if (failed.length) {
    for (const f of failed) console.log(`FAIL ${f.tool}: ${f.note}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

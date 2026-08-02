import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRuntime, createServer } from "../src/server.ts";

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`);
}

const mcp = JSON.parse(readFileSync(join(homedir(), ".cursor", "mcp.json"), "utf8"));
const env = mcp.mcpServers?.apps?.env ?? {};
const appId = env.APPS_APP_ID as string | undefined;
const appSecret = env.APPS_APP_SECRET as string | undefined;
if (!appId || !appSecret) {
  console.error("No Apps credentials in ~/.cursor/mcp.json");
  process.exit(1);
}

const runtime = createRuntime({
  appId,
  appSecret,
  allowWrite: true,
  apiBaseUrl: "https://api.theapps.jp",
  allowCustomBaseUrl: false,
  accessToken: env.APPS_ACCESS_TOKEN as string | undefined,
  requestTimeoutMs: 30_000,
});
const server = createServer(runtime);
const tools = (
  server as unknown as {
    _registeredTools: Record<
      string,
      {
        inputSchema: {
          "~standard": {
            validate: (v: unknown) => Promise<{ value?: unknown; issues?: unknown[] }>;
          };
        };
        handler: (args: unknown, extra: unknown) => Promise<unknown>;
      }
    >;
  }
)._registeredTools;

async function validate(tool: string, args: unknown) {
  return tools[tool].inputSchema["~standard"].validate(args);
}

async function call(tool: string, args: unknown) {
  const validated = await validate(tool, args);
  if (validated.issues) {
    return { validationError: validated.issues };
  }
  return tools[tool].handler(validated.value, {
    signal: AbortSignal.timeout(30000),
    requestId: "test",
    sendNotification: async () => {},
    sendRequest: async () => {
      throw new Error("no nested requests");
    },
  });
}

function textOf(result: unknown): string {
  const r = result as { content?: Array<{ text?: string }> };
  return r?.content?.[0]?.text ?? JSON.stringify(result);
}

const rejects: Array<[string, unknown, string]> = [
  [
    "apps_create_product",
    { body: { product_name: "x", stripe_env_id: "1", price: 100 }, dry_run: true },
    "platform",
  ],
  [
    "apps_create_paid_plan",
    {
      body: { plan_name: "x", stripe_env_id: "1", price: 100, platform: { stripe: true } },
      dry_run: true,
    },
    "billing_cycle",
  ],
  [
    "apps_create_installment_plan",
    {
      body: {
        plan_name: "x",
        stripe_env_id: "1",
        price: 100,
        platform: { stripe: true },
        billing_cycle: { interval: "month", installments_count: 1 },
      },
      dry_run: true,
    },
    "installments_count",
  ],
  [
    "apps_create_coupon",
    {
      body: {
        stripe_env_id: "1",
        coupon_name: "x",
        coupon_code: "X",
        coupon_type: 0,
        coupon_term: 0,
        payment_type: 1,
      },
      dry_run: true,
    },
    "rate",
  ],
  [
    "apps_create_advance_plan",
    { body: { contract_type: "discord", plan_name: "x", language: "ja" }, dry_run: true },
    "discord_rule",
  ],
  ["apps_create_discord_role", { guild_id: "1", body: { position: 1 }, dry_run: true }, "name"],
];

for (const [tool, args, hint] of rejects) {
  const r = await validate(tool, args);
  const ok = Array.isArray(r.issues) && r.issues.length > 0;
  const path = JSON.stringify(r.issues ?? []).includes(hint);
  record(`reject ${tool}`, ok && path, ok ? `issues mention ${hint}=${path}` : "did not reject");
}

const stamp = Date.now().toString(36);
const smokeName = `mcp-schema-${stamp}`;

const accepts: Array<[string, unknown]> = [
  [
    "apps_create_product",
    {
      body: {
        product_name: smokeName,
        stripe_env_id: "1",
        price: 100,
        language: "ja",
        platform: { stripe: true },
      },
      dry_run: true,
    },
  ],
  [
    "apps_create_paid_plan",
    {
      body: {
        plan_name: smokeName,
        stripe_env_id: "1",
        price: 100,
        language: "ja",
        platform: { stripe: true },
        billing_cycle: { interval: "month", count: 1 },
      },
      dry_run: true,
    },
  ],
  [
    "apps_create_installment_plan",
    {
      body: {
        plan_name: smokeName,
        stripe_env_id: "1",
        price: 300,
        language: "ja",
        platform: { stripe: true },
        billing_cycle: { interval: "month", installments_count: 3 },
      },
      dry_run: true,
    },
  ],
  [
    "apps_create_coupon",
    {
      body: {
        stripe_env_id: "1",
        coupon_name: smokeName,
        coupon_code: `T${stamp}`.slice(0, 12),
        coupon_type: 0,
        rate: 10,
        coupon_term: 0,
        payment_type: 1,
      },
      dry_run: true,
    },
  ],
  [
    "apps_create_advance_plan",
    {
      body: { contract_type: "email", plan_name: smokeName, language: "ja" },
      dry_run: true,
    },
  ],
  [
    "apps_update_installment_plan",
    { paid_id: "dummy", body: { plan_name: "only-name", language: "ja" }, dry_run: true },
  ],
];

for (const [tool, args] of accepts) {
  const out = await call(tool, args);
  if ((out as { validationError?: unknown }).validationError) {
    record(
      `dry_run ${tool}`,
      false,
      JSON.stringify((out as { validationError: unknown }).validationError),
    );
    continue;
  }
  const text = textOf(out);
  const parsed = JSON.parse(text) as { dry_run?: boolean; method?: string; path?: string };
  const ok = parsed.dry_run === true && !!parsed.method && !!parsed.path;
  record(`dry_run ${tool}`, ok, ok ? `${parsed.method} ${parsed.path}` : text.slice(0, 200));
}

try {
  const createOut = await call("apps_create_product", {
    body: {
      product_name: smokeName,
      stripe_env_id: "1",
      price: 100,
      language: "ja",
      platform: { stripe: true },
      meta_conversion_api: {},
    },
    confirm: true,
  });
  const created = JSON.parse(textOf(createOut)) as {
    error?: unknown;
    product_id?: string;
  };
  const createFailed =
    !created.product_id ||
    (typeof created.error === "string" && created.error.length > 0) ||
    (Array.isArray(created.error) && created.error.length > 0);
  if (createFailed) {
    record("live create product", false, textOf(createOut).slice(0, 300));
  } else {
    record("live create product", true, `product_id=${created.product_id}`);
    const upd = await call("apps_update_product", {
      product_id: created.product_id,
      body: {
        product_name: `${smokeName}-u`,
        stripe_env_id: "1",
        price: 101,
        language: "ja",
        platform: { stripe: true },
      },
      confirm: true,
    });
    const updParsed = JSON.parse(textOf(upd)) as { error?: unknown; product_id?: string };
    const updFailed =
      (typeof updParsed.error === "string" && updParsed.error.length > 0) ||
      (Array.isArray(updParsed.error) && updParsed.error.length > 0);
    record("live update product", !updFailed, updFailed ? textOf(upd).slice(0, 200) : "updated");

    const del = await call("apps_delete_product", {
      product_id: created.product_id,
      confirm: true,
    });
    const delParsed = JSON.parse(textOf(del)) as { error?: unknown };
    const delFailed =
      (typeof delParsed.error === "string" && delParsed.error.length > 0) ||
      (Array.isArray(delParsed.error) && delParsed.error.length > 0);
    record("live delete product", !delFailed, delFailed ? textOf(del).slice(0, 200) : "deleted");
  }
} catch (e) {
  record("live product CRUD", false, e instanceof Error ? e.message : String(e));
}

const blocked = await call("apps_create_product", {
  body: { product_name: "should-fail", stripe_env_id: "1", price: 1 },
  confirm: true,
});
record(
  "live blocked missing platform",
  !!(blocked as { validationError?: unknown }).validationError,
  (blocked as { validationError?: unknown }).validationError
    ? "validation stopped before API"
    : textOf(blocked).slice(0, 200),
);

const failed = results.filter((r) => !r.ok);
console.log("\n==== SUMMARY ====");
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
if (failed.length) {
  for (const f of failed) console.log("FAIL", f.name, f.detail);
  process.exit(1);
}
console.log("ALL PASSED");

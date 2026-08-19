/**
 * Shallow Apps API request-body schemas for MCP tool input validation.
 *
 * Design:
 * - Create: required / conditionally-required top-level fields (skill + smoke practice)
 * - Update: all known fields optional; extras kept (partial updates must work)
 * - Nested objects (mail_*, discord_rule internals, etc.) stay loose — full official
 *   mirrors would reject valid API payloads
 * - Unknown keys are preserved via z.looseObject (do not strip extras before POST/PUT)
 * - Top-level JSON `null` is treated as omitted (GET echo → update must not fail on nulls)
 *
 * platform: official docs mark it optional; Apps create flows in practice need ≥1 true
 * (skills, recipes, smoke). We require it on payment-page create.
 */
import * as z from "zod/v4";

/** Drop top-level nulls so GET→edit→PUT echoes do not fail optional typed fields. */
function omitTopLevelNulls(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (child !== null) out[key] = child;
  }
  return out;
}

function bodySchema<Schema extends z.ZodType>(schema: Schema) {
  return z.preprocess(omitTopLevelNulls, schema);
}

const language = z.enum(["ja", "en", "pt"]);

const platformObject = z
  .record(z.string(), z.boolean())
  .describe('Payment platforms, e.g. { "stripe": true }. At least one true on create.');

function platformHasEnabled(platform: Record<string, boolean> | undefined): boolean {
  if (!platform) return false;
  return Object.values(platform).some((enabled) => enabled === true);
}

function requirePlatform(body: { platform?: Record<string, boolean> }, ctx: z.RefinementCtx): void {
  if (!platformHasEnabled(body.platform)) {
    ctx.addIssue({
      code: "custom",
      path: ["platform"],
      message:
        'platform is required on create and must include at least one true (e.g. { "stripe": true })',
    });
  }
}

const paidBillingCycle = z
  .looseObject({
    interval: z.string().min(1).describe("Billing interval (see official Apps docs)"),
    count: z.number().int().optional(),
    billing_cycle_anchor: z.number().int().optional(),
    immediate_payment: z.boolean().optional(),
    trial_end: z.number().int().optional(),
  })
  .describe("Paid BillingCycle — interval required");

const installmentBillingCycle = z
  .looseObject({
    interval: z.string().min(1).describe("Billing interval"),
    installments_count: z.number().int().min(2).describe("Number of installments; must be >= 2"),
    manual_payments: z.boolean().optional(),
    sales_count: z.number().int().optional(),
  })
  .describe("Installment BillingCycle — interval and installments_count (>=2) required");

const lineObject = z
  .looseObject({
    channel_id: z.string().min(1),
    channel_secret: z.string().min(1),
    add_friend_option: z.number().int().optional(),
  })
  .describe("LINE channel settings");

/** WaitingList — when present, type is required (advance / installment APIs). */
const waitingListObject = z
  .looseObject({
    type: z.number().int().min(0).max(3).describe("0 off, 1 manual, 2 auto, 3 formation"),
    interval: z.number().int().optional().describe("Hours until auto-approve when type=2"),
  })
  .describe("WaitingList / formation conditions");

function refineWaitingList(
  body: { waiting_list?: unknown },
  ctx: z.RefinementCtx,
  options: { requireIntervalForType2: boolean },
): void {
  if (body.waiting_list === undefined) return;
  if (
    body.waiting_list === null ||
    typeof body.waiting_list !== "object" ||
    Array.isArray(body.waiting_list)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["waiting_list"],
      message: "waiting_list must be an object when sent",
    });
    return;
  }
  const wl = body.waiting_list as Record<string, unknown>;
  if (typeof wl.type !== "number" || !Number.isInteger(wl.type) || wl.type < 0 || wl.type > 3) {
    ctx.addIssue({
      code: "custom",
      path: ["waiting_list", "type"],
      message: "waiting_list.type is required (0–3) when waiting_list is sent",
    });
    return;
  }
  if (
    options.requireIntervalForType2 &&
    wl.type === 2 &&
    (typeof wl.interval !== "number" || !Number.isInteger(wl.interval))
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["waiting_list", "interval"],
      message: "waiting_list.interval is required when type=2 (auto-approve)",
    });
  }
}

// --- Product ---

const productBase = z.looseObject({
  product_name: z.string().min(1),
  stripe_env_id: z
    .string()
    .min(1)
    .describe('Payment mode: "0" live, "1" test. Both write to the connected Apps account.'),
  price: z.number().int(),
  platform: platformObject,
  language: language.optional(),
  waiting_list: waitingListObject.optional(),
});

export const productCreateBody = bodySchema(
  productBase
    .superRefine(requirePlatform)
    .describe(
      "Product create body — product_name, stripe_env_id, price, platform (>=1 true) required",
    ),
);

export const productUpdateBody = bodySchema(
  productBase
    .partial()
    .describe(
      "Product update body — send only fields to change; stripe_env_id/platform are immutable upstream",
    ),
);

// --- Paid ---

const paidBase = z.looseObject({
  plan_name: z.string().min(1),
  stripe_env_id: z
    .string()
    .min(1)
    .describe('Payment mode: "0" live, "1" test. Both write to the connected Apps account.'),
  price: z.number().int(),
  billing_cycle: paidBillingCycle,
  platform: platformObject,
  language: language.optional(),
});

export const paidCreateBody = bodySchema(
  paidBase
    .superRefine(requirePlatform)
    .describe(
      "Paid create body — plan_name, stripe_env_id, price, billing_cycle.interval, platform required",
    ),
);

export const paidUpdateBody = bodySchema(
  paidBase
    .partial()
    .describe(
      "Paid update body — partial updates allowed; stripe_env_id/platform immutable upstream",
    ),
);

// --- Installment ---

const installmentBase = z.looseObject({
  plan_name: z.string().min(1),
  stripe_env_id: z
    .string()
    .min(1)
    .describe('Payment mode: "0" live, "1" test. Both write to the connected Apps account.'),
  price: z.number().int(),
  billing_cycle: installmentBillingCycle,
  platform: platformObject,
  language: language.optional(),
  waiting_list: waitingListObject.optional(),
});

export const installmentCreateBody = bodySchema(
  installmentBase
    .superRefine((body, ctx) => {
      requirePlatform(body, ctx);
      refineWaitingList(body, ctx, { requireIntervalForType2: true });
    })
    .describe(
      "Installment create body — plan_name, stripe_env_id, price, billing_cycle (installments_count>=2), platform required",
    ),
);

export const installmentUpdateBody = bodySchema(
  installmentBase
    .partial()
    .superRefine((body, ctx) => refineWaitingList(body, ctx, { requireIntervalForType2: true }))
    .describe(
      "Installment update body — partial updates allowed; price/billing_cycle immutable upstream (API 400)",
    ),
);

// --- Coupon ---

const couponPaymentTypes = z
  .union([z.literal(0), z.literal(1), z.literal(4), z.literal(5), z.literal(14)])
  .describe("0 stripe-sub, 1 one-time, 4 paid, 5 installment, 14 stripe-billing; 8 unsupported");

const couponBase = z.looseObject({
  stripe_env_id: z
    .string()
    .min(1)
    .describe('Payment mode: "0" live, "1" test. Both write to the connected Apps account.'),
  coupon_name: z.string().min(1),
  coupon_code: z.string().min(1),
  coupon_type: z
    .union([z.literal(0), z.literal(1)])
    .describe("0 percent (needs rate), 1 fixed (needs price)"),
  rate: z.number().optional(),
  price: z.number().optional(),
  coupon_term: z.number().int().describe("-1 every charge, 0 first only, n = n months"),
  payment_type: couponPaymentTypes,
  product_ids: z.array(z.string()).optional(),
  initial_cost_coupon: z.unknown().optional(),
  label: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  coupon_count: z.number().int().optional(),
});

function refineCouponBody(
  body: {
    coupon_type?: 0 | 1;
    rate?: number;
    price?: number;
    coupon_term?: number;
    payment_type?: 0 | 1 | 4 | 5 | 14;
    product_ids?: string[];
    initial_cost_coupon?: unknown;
  },
  ctx: z.RefinementCtx,
  mode: "create" | "update",
): void {
  const { coupon_type, payment_type } = body;

  if (coupon_type === 0 && body.rate == null) {
    ctx.addIssue({
      code: "custom",
      path: ["rate"],
      message: "rate is required when coupon_type=0 (percent)",
    });
  }
  if (coupon_type === 1 && body.price == null) {
    ctx.addIssue({
      code: "custom",
      path: ["price"],
      message: "price is required when coupon_type=1 (fixed amount)",
    });
  }

  if (
    payment_type !== undefined &&
    (payment_type === 1 || payment_type === 5) &&
    body.coupon_term !== undefined &&
    body.coupon_term !== 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["coupon_term"],
      message: "coupon_term must be 0 when payment_type is 1 (one-time) or 5 (installment)",
    });
  }

  if (payment_type === 0 && body.product_ids != null && body.product_ids.length > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["product_ids"],
      message: "product_ids must not be set when payment_type=0",
    });
  }

  if ((payment_type === 1 || payment_type === 5) && body.initial_cost_coupon != null) {
    ctx.addIssue({
      code: "custom",
      path: ["initial_cost_coupon"],
      message: "initial_cost_coupon is not allowed when payment_type is 1 or 5",
    });
  }

  // On update, if coupon_type is omitted we cannot enforce rate/price; create already requires coupon_type.
  if (mode === "create" && coupon_type === undefined) {
    // base schema already requires coupon_type on create
  }
}

export const couponCreateBody = bodySchema(
  couponBase
    .superRefine((body, ctx) => refineCouponBody(body, ctx, "create"))
    .describe(
      "Coupon create body — stripe_env_id, coupon_name, coupon_code, coupon_type, coupon_term, payment_type; rate (type0) or price (type1)",
    ),
);

export const couponUpdateBody = bodySchema(
  couponBase
    .partial()
    .superRefine((body, ctx) => refineCouponBody(body, ctx, "update"))
    .describe(
      "Coupon update body — omit unchanged fields; used coupons have immutable fields upstream",
    ),
);

// --- Advance (registration page) ---

const advanceBase = z.looseObject({
  contract_type: z.enum(["email", "discord", "line"]),
  plan_name: z.string().min(1),
  language,
  discord_rule: z.unknown().optional(),
  line: lineObject.optional(),
  waiting_list: waitingListObject.optional(),
});

function refineAdvanceBody(
  body: {
    contract_type?: "email" | "discord" | "line";
    discord_rule?: unknown;
    line?: unknown;
    waiting_list?: unknown;
  },
  ctx: z.RefinementCtx,
): void {
  if (body.contract_type === "discord" && body.discord_rule == null) {
    ctx.addIssue({
      code: "custom",
      path: ["discord_rule"],
      message: "discord_rule is required when contract_type=discord",
    });
  }
  if (body.contract_type === "line" && body.line == null) {
    ctx.addIssue({
      code: "custom",
      path: ["line"],
      message: "line (channel_id, channel_secret) is required when contract_type=line",
    });
  }
  refineWaitingList(body, ctx, { requireIntervalForType2: false });
}

export const advanceCreateBody = bodySchema(
  advanceBase
    .superRefine(refineAdvanceBody)
    .describe(
      "Advance plan create body — contract_type, plan_name, language; discord_rule if discord; line if line",
    ),
);

export const advanceUpdateBody = bodySchema(
  advanceBase
    .partial()
    .superRefine(refineAdvanceBody)
    .describe("Advance plan update body — partial updates allowed"),
);

// --- Discord ---

const discordRoleBase = z.looseObject({
  name: z.string().min(1),
  position: z.number().int().optional(),
  permissions: z.array(z.string()).optional(),
});

export const discordRoleCreateBody = bodySchema(
  discordRoleBase.describe("Discord role create — name required"),
);

export const discordRoleUpdateBody = bodySchema(
  discordRoleBase.partial().describe("Discord role update — partial updates allowed"),
);

const discordChannelBase = z.looseObject({
  type: z.number().int(),
  name: z.string().min(1),
  topic: z.string().optional(),
  parent_id: z.string().optional(),
  role: z.unknown().optional(),
  user: z.unknown().optional(),
});

export const discordChannelCreateBody = bodySchema(
  discordChannelBase.describe(
    "Discord channel create — type and name required; parent_id for category",
  ),
);

export const discordChannelUpdateBody = bodySchema(
  discordChannelBase.partial().describe("Discord channel update — partial updates allowed"),
);

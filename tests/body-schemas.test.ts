import { describe, expect, test } from "bun:test";
import {
  advanceCreateBody,
  advanceUpdateBody,
  couponCreateBody,
  couponUpdateBody,
  discordChannelCreateBody,
  discordRoleCreateBody,
  installmentCreateBody,
  installmentUpdateBody,
  paidCreateBody,
  paidUpdateBody,
  productCreateBody,
  productUpdateBody,
} from "../src/lib/body-schemas.ts";

function expectOk(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
  value: unknown,
) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(true);
  return result.success ? result.data : undefined;
}

function expectFail(
  schema: {
    safeParse: (v: unknown) => {
      success: boolean;
      error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
    };
  },
  value: unknown,
  pathHint?: string,
) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  if (pathHint) {
    const paths = (result.error?.issues ?? []).map((i) => i.path.join("."));
    expect(paths.some((p) => p.includes(pathHint))).toBe(true);
  }
}

describe("product body schemas", () => {
  const minimal = {
    product_name: "単発講座",
    stripe_env_id: "1",
    price: 3000,
    language: "ja" as const,
    platform: { stripe: true },
  };

  test("accepts smoke/recipe create body and keeps extras", () => {
    const data = expectOk(productCreateBody, {
      ...minimal,
      meta_conversion_api: {},
      waiting_list: { type: 1 },
    }) as Record<string, unknown>;
    expect(data.meta_conversion_api).toEqual({});
    expect(data.waiting_list).toEqual({ type: 1 });
  });

  test("rejects create missing platform or all-false platform", () => {
    expectFail(productCreateBody, { ...minimal, platform: undefined }, "platform");
    const { platform: _p, ...noPlatform } = minimal;
    expectFail(productCreateBody, noPlatform, "platform");
    expectFail(productCreateBody, { ...minimal, platform: { stripe: false } }, "platform");
  });

  test("rejects create missing required fields", () => {
    expectFail(productCreateBody, { ...minimal, product_name: undefined }, "product_name");
    expectFail(productCreateBody, { ...minimal, price: undefined }, "price");
    expectFail(productCreateBody, { ...minimal, stripe_env_id: undefined }, "stripe_env_id");
  });

  test("update allows partial body", () => {
    expectOk(productUpdateBody, { product_name: "renamed" });
    expectOk(productUpdateBody, {});
  });

  test("update treats top-level null as omitted (GET echo)", () => {
    expectOk(productUpdateBody, {
      product_name: "renamed",
      language: null,
      label: null,
    });
  });
});

describe("paid / installment body schemas", () => {
  test("paid create requires billing_cycle.interval and platform", () => {
    expectOk(paidCreateBody, {
      plan_name: "月額",
      stripe_env_id: "1",
      price: 1980,
      language: "ja",
      platform: { stripe: true },
      billing_cycle: { interval: "month", count: 1 },
    });
    expectFail(
      paidCreateBody,
      {
        plan_name: "月額",
        stripe_env_id: "1",
        price: 1980,
        platform: { stripe: true },
      },
      "billing_cycle",
    );
  });

  test("installment create requires installments_count >= 2", () => {
    expectOk(installmentCreateBody, {
      plan_name: "3回払い",
      stripe_env_id: "1",
      price: 30000,
      language: "ja",
      platform: { stripe: true },
      billing_cycle: { interval: "month", installments_count: 3 },
    });
    expectFail(
      installmentCreateBody,
      {
        plan_name: "1回",
        stripe_env_id: "1",
        price: 100,
        platform: { stripe: true },
        billing_cycle: { interval: "month", installments_count: 1 },
      },
      "installments_count",
    );
  });

  test("installment update allows name-only (smoke)", () => {
    expectOk(installmentUpdateBody, { plan_name: "renamed", language: "ja" });
  });

  test("paid update allows partial", () => {
    expectOk(paidUpdateBody, { plan_name: "x" });
  });
});

describe("coupon body schemas", () => {
  const percent = {
    stripe_env_id: "1",
    coupon_name: "キャンペーン",
    coupon_code: "SAVE10",
    coupon_type: 0 as const,
    rate: 10,
    coupon_term: 0,
    payment_type: 1 as const,
  };

  test("accepts percent and 100% off create", () => {
    expectOk(couponCreateBody, percent);
    expectOk(couponCreateBody, { ...percent, rate: 100, coupon_code: "FREE100" });
  });

  test("requires rate for type 0 and price for type 1", () => {
    expectFail(couponCreateBody, { ...percent, rate: undefined }, "rate");
    expectFail(
      couponCreateBody,
      {
        ...percent,
        coupon_type: 1,
        rate: undefined,
        price: undefined,
      },
      "price",
    );
    expectOk(couponCreateBody, {
      ...percent,
      coupon_type: 1,
      rate: undefined,
      price: 500,
    });
  });

  test("enforces coupon_term=0 for payment_type 1/5", () => {
    expectFail(couponCreateBody, { ...percent, coupon_term: -1 }, "coupon_term");
  });

  test("rejects product_ids for payment_type 0", () => {
    expectFail(
      couponCreateBody,
      {
        ...percent,
        payment_type: 0,
        coupon_term: -1,
        product_ids: ["abc"],
      },
      "product_ids",
    );
  });

  test("update can change name only", () => {
    expectOk(couponUpdateBody, { coupon_name: "new" });
  });
});

describe("advance body schemas", () => {
  test("email create minimal", () => {
    expectOk(advanceCreateBody, {
      contract_type: "email",
      plan_name: "無料登録",
      language: "ja",
    });
  });

  test("discord requires discord_rule; line requires line", () => {
    expectFail(
      advanceCreateBody,
      { contract_type: "discord", plan_name: "x", language: "ja" },
      "discord_rule",
    );
    expectOk(advanceCreateBody, {
      contract_type: "discord",
      plan_name: "x",
      language: "ja",
      discord_rule: {
        trigger: "auto",
        action: "grant",
        guild_id: "g",
        target_type: "role",
        role_ids: ["r"],
      },
    });
    expectFail(
      advanceCreateBody,
      { contract_type: "line", plan_name: "x", language: "ja" },
      "line",
    );
    expectOk(advanceCreateBody, {
      contract_type: "line",
      plan_name: "x",
      language: "ja",
      line: { channel_id: "c", channel_secret: "s" },
    });
  });

  test("update allows partial without contract_type", () => {
    expectOk(advanceUpdateBody, { plan_name: "renamed" });
  });

  test("waiting_list requires type when sent", () => {
    expectFail(
      advanceCreateBody,
      {
        contract_type: "email",
        plan_name: "先行",
        language: "ja",
        waiting_list: {},
      },
      "waiting_list",
    );
    expectOk(advanceCreateBody, {
      contract_type: "email",
      plan_name: "先行",
      language: "ja",
      waiting_list: { type: 1 },
    });
  });
});

describe("installment waiting_list", () => {
  const minimal = {
    plan_name: "3回払い",
    stripe_env_id: "1",
    price: 30000,
    language: "ja" as const,
    platform: { stripe: true },
    billing_cycle: { interval: "month", installments_count: 3 },
  };

  test("type=2 requires interval", () => {
    expectFail(
      installmentCreateBody,
      { ...minimal, waiting_list: { type: 2 } },
      "waiting_list",
    );
    expectOk(installmentCreateBody, {
      ...minimal,
      waiting_list: { type: 2, interval: 24 },
    });
  });
});

describe("discord body schemas", () => {
  test("role create requires name", () => {
    expectOk(discordRoleCreateBody, { name: "vip", position: 1, permissions: [] });
    expectFail(discordRoleCreateBody, { position: 1 }, "name");
  });

  test("channel create requires type and name", () => {
    expectOk(discordChannelCreateBody, { type: 0, name: "general", parent_id: "cat" });
    expectFail(discordChannelCreateBody, { name: "general" }, "type");
  });
});

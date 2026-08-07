import { describe, expect, test } from "bun:test";
import {
  computeAppsWebhookSignature,
  parseAppsSignatureHeader,
  verifyAppsWebhookSignature,
} from "../src/lib/webhook-signature.ts";

const SECRET = "whsec_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const RAW_BODY = JSON.stringify({
  id: "58886defd811bdbadec04bafd19d9f58",
  event: "customer",
  mode: "live",
});

describe("parseAppsSignatureHeader", () => {
  test("parses t and multiple v1 values", () => {
    const parsed = parseAppsSignatureHeader(
      "t=1769500800,v1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,v1=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );
    expect(parsed.timestamp).toBe(1769500800);
    expect(parsed.signatures).toHaveLength(2);
    expect(parsed.signatures[0]).toBe(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  });

  test("rejects missing v1", () => {
    expect(() => parseAppsSignatureHeader("t=1")).toThrow(/missing v1/);
  });
});

describe("verifyAppsWebhookSignature", () => {
  test("accepts a valid signature within tolerance", () => {
    const t = 1_700_000_000;
    const v1 = computeAppsWebhookSignature(SECRET, t, RAW_BODY);
    const result = verifyAppsWebhookSignature({
      rawBody: RAW_BODY,
      signatureHeader: `t=${t},v1=${v1}`,
      webhookSecret: SECRET,
      webhookIdHeader: "58886defd811bdbadec04bafd19d9f58",
      nowSeconds: t + 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event).toBe("customer");
      expect(result.eventId).toBe("58886defd811bdbadec04bafd19d9f58");
      expect(result.matchedSignatureIndex).toBe(0);
    }
  });

  test("accepts when any of multiple v1 matches (secret rotation window)", () => {
    const t = 1_700_000_100;
    const good = computeAppsWebhookSignature(SECRET, t, RAW_BODY);
    const result = verifyAppsWebhookSignature({
      rawBody: RAW_BODY,
      signatureHeader: `t=${t},v1=${"00".repeat(32)},v1=${good}`,
      webhookSecret: SECRET,
      nowSeconds: t,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matchedSignatureIndex).toBe(1);
    }
  });

  test("rejects tampered body", () => {
    const t = 1_700_000_200;
    const v1 = computeAppsWebhookSignature(SECRET, t, RAW_BODY);
    const result = verifyAppsWebhookSignature({
      rawBody: RAW_BODY.replace("customer", "payment"),
      signatureHeader: `t=${t},v1=${v1}`,
      webhookSecret: SECRET,
      nowSeconds: t,
    });
    expect(result).toEqual({ ok: false, reason: "no matching v1 signature" });
  });

  test("rejects expired timestamp", () => {
    const t = 1_700_000_300;
    const v1 = computeAppsWebhookSignature(SECRET, t, RAW_BODY);
    const result = verifyAppsWebhookSignature({
      rawBody: RAW_BODY,
      signatureHeader: `t=${t},v1=${v1}`,
      webhookSecret: SECRET,
      nowSeconds: t + 301,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("tolerance");
    }
  });

  test("rejects Apps-Webhook-Id mismatch", () => {
    const t = 1_700_000_400;
    const v1 = computeAppsWebhookSignature(SECRET, t, RAW_BODY);
    const result = verifyAppsWebhookSignature({
      rawBody: RAW_BODY,
      signatureHeader: `t=${t},v1=${v1}`,
      webhookSecret: SECRET,
      webhookIdHeader: "different-id",
      nowSeconds: t,
    });
    expect(result).toEqual({
      ok: false,
      reason: "Apps-Webhook-Id does not match body.id",
    });
  });

  test("does not require re-stringified JSON (whitespace-sensitive)", () => {
    const compact = '{"id":"x","event":"payment"}';
    const pretty = '{\n  "id": "x",\n  "event": "payment"\n}';
    const t = 1_700_000_500;
    const v1 = computeAppsWebhookSignature(SECRET, t, compact);
    expect(
      verifyAppsWebhookSignature({
        rawBody: compact,
        signatureHeader: `t=${t},v1=${v1}`,
        webhookSecret: SECRET,
        nowSeconds: t,
      }).ok,
    ).toBe(true);
    expect(
      verifyAppsWebhookSignature({
        rawBody: pretty,
        signatureHeader: `t=${t},v1=${v1}`,
        webhookSecret: SECRET,
        nowSeconds: t,
      }).ok,
    ).toBe(false);
  });
});

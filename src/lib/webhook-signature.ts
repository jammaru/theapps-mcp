import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

export type ParsedAppsSignature = {
  timestamp: number;
  signatures: string[];
};

export type WebhookVerifyInput = {
  /** Raw request body before JSON.parse / re-stringify. */
  rawBody: string;
  /** Value of the Apps-Signature header. */
  signatureHeader: string;
  /** Webhook secret from Apps API settings (whsec_...). Never log this. */
  webhookSecret: string;
  /** Optional Apps-Webhook-Id; when set, must match body.id after parse. */
  webhookIdHeader?: string;
  /** Max |now - t| in seconds (default 300). */
  toleranceSeconds?: number;
  /** Override for tests. */
  nowSeconds?: number;
};

export type WebhookVerifyResult =
  | {
      ok: true;
      timestamp: number;
      eventId: string | null;
      event: string | null;
      matchedSignatureIndex: number;
    }
  | {
      ok: false;
      reason: string;
    };

/**
 * Parse `Apps-Signature: t=<unix>,v1=<hex>[,v1=<hex>...]`.
 * Re-issue window may attach two v1 values (new + old secret).
 */
export function parseAppsSignatureHeader(header: string): ParsedAppsSignature {
  const parts = header
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  let timestamp: number | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        throw new Error("Apps-Signature timestamp is not a number");
      }
      timestamp = n;
    } else if (key === "v1" && value) {
      signatures.push(value.toLowerCase());
    }
  }

  if (timestamp === undefined) {
    throw new Error("Apps-Signature missing t=");
  }
  if (signatures.length === 0) {
    throw new Error("Apps-Signature missing v1=");
  }

  return { timestamp, signatures };
}

export function computeAppsWebhookSignature(
  webhookSecret: string,
  timestamp: number,
  rawBody: string,
): string {
  const payload = `${timestamp}.${rawBody}`;
  return createHmac("sha256", webhookSecret).update(payload, "utf8").digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Verify Apps Webhook HMAC-SHA256 per https://theapps.jp/api/webhook-config
 *
 * Signed payload is `{t}.{rawBody}` (raw bytes as UTF-8 string, before JSON parse).
 * Deduplicate deliveries with body.id / Apps-Webhook-Id, not the signature value.
 */
export function verifyAppsWebhookSignature(input: WebhookVerifyInput): WebhookVerifyResult {
  const secret = input.webhookSecret.trim();
  if (!secret) {
    return { ok: false, reason: "webhook_secret is empty" };
  }
  if (!input.signatureHeader?.trim()) {
    return { ok: false, reason: "Apps-Signature header is missing" };
  }

  let parsed: ParsedAppsSignature;
  try {
    parsed = parseAppsSignatureHeader(input.signatureHeader.trim());
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "invalid Apps-Signature",
    };
  }

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_WEBHOOK_TOLERANCE_SECONDS;
  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return {
      ok: false,
      reason: `timestamp outside tolerance (±${tolerance}s)`,
    };
  }

  const expected = computeAppsWebhookSignature(secret, parsed.timestamp, input.rawBody);
  let matchedSignatureIndex = -1;
  for (let i = 0; i < parsed.signatures.length; i += 1) {
    const candidate = parsed.signatures[i];
    if (candidate !== undefined && safeEqualHex(expected, candidate)) {
      matchedSignatureIndex = i;
      break;
    }
  }
  if (matchedSignatureIndex < 0) {
    return { ok: false, reason: "no matching v1 signature" };
  }

  let eventId: string | null = null;
  let event: string | null = null;
  try {
    const body = JSON.parse(input.rawBody) as { id?: unknown; event?: unknown };
    if (typeof body.id === "string") eventId = body.id;
    if (typeof body.event === "string") event = body.event;
  } catch {
    // Signature can still be valid; body parse is only for metadata / id checks.
  }

  if (input.webhookIdHeader !== undefined && input.webhookIdHeader !== "") {
    if (!eventId) {
      return { ok: false, reason: "body.id missing; cannot compare Apps-Webhook-Id" };
    }
    if (input.webhookIdHeader !== eventId) {
      return { ok: false, reason: "Apps-Webhook-Id does not match body.id" };
    }
  }

  return {
    ok: true,
    timestamp: parsed.timestamp,
    eventId,
    event,
    matchedSignatureIndex,
  };
}

# Webhook protocol

Official sources:

- https://theapps.jp/api/webhook-config
- https://theapps.jp/api/webhook-schema

## Delivery behavior

- Apps sends JSON over HTTP POST.
- The receiver must return HTTP 200 within 30 seconds.
- Failed deliveries are retried up to three times and can also be manually resent.
- Administration-screen test delivery uses the production event structure with placeholder values and does not create a real payment.

## Events

| Event | Important differences |
|---|---|
| `customer` | Contains `customer` |
| `application` | Recurring and installment only; contains `contract_id`, `customer`, and `plan` |
| `payment` | Contains top-level `contract_id` and `payment_id` |
| `refund` | Contains top-level `payment_id`; `payment.refund_id` can be present |
| `payment_error` | Omits `mode` and `contract_id`; customer fields are top-level |
| `abandoned` | Omits `mode`; contains `cart_abandoned_list` |
| `canceled` | Recurring and installment only; omits `payment` |

Every event contains `id`, `event`, and `create_at`. Optional or null values may be omitted from the JSON entirely.

## Signature verification

With a configured Webhook secret, Apps sends:

```text
Apps-Signature: t=<unix-seconds>,v1=<hex>[,v1=<hex>]
Apps-Webhook-Id: <body.id>
```

Verify HMAC-SHA256 over the UTF-8 bytes of:

```text
{t}.{exact raw request body}
```

Require an absolute timestamp difference of at most 300 seconds and compare each `v1` in constant time. Secret rotation can produce both old and new signatures for 24 hours. Accept the delivery when any valid `v1` matches.

Do not parse and reserialize JSON before verification. Reject verification failures with HTTP 400.

`apps_verify_webhook_signature` checks one delivery. Required inputs: `raw_body` (exact UTF-8 body), `signature_header` (`Apps-Signature`), and `webhook_secret` (often `whsec_...`). Optional: `webhook_id_header`, `tolerance_seconds` (default 300). Never log or paste the secret into chat.

## Idempotency and identifiers

Retries and manual resends use a new timestamp and signature. Deduplicate with body `id` or `Apps-Webhook-Id`. For payment lookup, use the top-level `payment_id` from `payment` or `refund`, never the delivery `id`.

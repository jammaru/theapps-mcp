---
name: apps-handle-webhooks
description: Design, implement, review, or troubleshoot an Apps Webhook receiver, verify Apps-Signature, prevent duplicate processing, or extract payment_id and customer_id from Apps events. Use for event-driven integrations and Webhook handler code (Webhook受信, 決済通知, 二重処理).
---

# Handle Apps Webhooks

Build a receiver that verifies the exact request body, responds quickly, and processes each delivery idempotently. Read [references/webhooks.md](references/webhooks.md) before implementing or reviewing a handler.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. In particular, load it before `apps_verify_webhook_signature`; the tool performs one check, while this workflow supplies the receiver, secret-handling, and idempotency context.

## Workflow

1. Identify the events and downstream action required by the user.
2. Configure the endpoint URL and event selection in the Apps administration screen; there is no public Webhook settings CRUD API.
3. Capture the raw request body before JSON parsing.
4. When `Apps-Signature` is present, verify the timestamp and every `v1` candidate. Use `apps_verify_webhook_signature` for an isolated verification check when the secret and exact raw body are available through a secure execution path.
5. Reject invalid signatures before performing downstream work.
6. Parse JSON only after verification and validate required fields per event.
7. Deduplicate on body `id` or `Apps-Webhook-Id`, not on the signature.
8. Persist or enqueue the minimum work needed, then return HTTP 200 within 30 seconds.
9. Use the administration-screen test delivery to verify the receiver without creating a real payment.

## Secret handling

Never request, print, log, commit, or echo the Webhook secret, signature input, or full payload. Use environment-backed secret storage. Redact customer fields from examples and diagnostics.

## Result

Return the implementation or review findings, the handled event set, signature and idempotency behavior, response behavior, and any unsupported assumption. Do not include a real payload or credential.

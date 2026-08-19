---
name: apps-inspect-payments
description: Inspect Apps customers or payment records, check whether a one-time, recurring, or installment payment succeeded, list recent payments, or resolve a Webhook payment_id/customer_id. Use for transaction investigation and customer lookup, not for editing payment pages.
---

# Inspect Apps payments

Retrieve the smallest amount of Apps data needed to answer a payment or customer question.

Read [references/identifiers.md](references/identifiers.md) when an ID is supplied or its type is unclear.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. It supplies the payment-family and identifier decisions that must happen before selecting a lookup tool.

## Workflow

1. Call `apps_auth_status`.
2. Identify whether the request concerns a customer, a transaction, or a payment-page configuration.
3. Select the payment family from the user's wording, a known plan type, or Webhook `plan.payment_type`:
   - One-time: `apps_list_charges` / `apps_get_charge`
   - Recurring: `apps_list_paid_payments` / `apps_get_paid_payment`
   - Installment: `apps_list_installments_payments` / `apps_get_installments_payment`
4. Use `apps_get_customer` only when a `customer_id` is available.
5. Prefer a single-item lookup when the correct ID and payment family are known. Otherwise list a limited number of records and inspect only the relevant candidate.
6. Do not probe unrelated endpoints repeatedly when the identifier type is unknown.
7. Summarize the result without reproducing raw customer or purchaser records.

## Result

Return the payment family, status, amount and time when present, the identifier used, and any next action supported by the response. Omit unrelated personal fields.

## Boundaries

- Do not claim that a payment executed, refunded, or canceled unless the returned data establishes it.
- Apps-mcp does not provide customer-list search, payment execution, refund, or cancellation tools.
- Use payment-page tools only when the user asks about plan configuration rather than transaction status.

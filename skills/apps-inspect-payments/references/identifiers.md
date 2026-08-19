# Apps identifiers and payment lookup

Official sources:

- https://theapps.jp/api/endpoints
- https://theapps.jp/api/webhook-schema

## Identifier rules

- `customer_id` identifies a customer and is accepted by `apps_get_customer`.
- `payment_id` identifies an Apps payment record. In Webhooks it is a top-level field on `payment` and `refund` events.
- Webhook `id` and the `Apps-Webhook-Id` header identify the delivery for deduplication. They are not `payment_id`.
- A number displayed in the Apps administration screen is not necessarily the API `payment_id`.

When a valid `payment_id` is unavailable, use the matching list tool to locate a candidate. Do not invent cursors or offsets: the public documentation does not define pagination parameters beyond the supported list response and optional MCP `limit`.

## Transaction APIs versus plan APIs

| User goal | MCP tools | API family |
|---|---|---|
| Inspect one-time transactions | `apps_list_charges`, `apps_get_charge` | `/v1/charge` |
| Inspect recurring transactions | `apps_list_paid_payments`, `apps_get_paid_payment` | `/v1/paid` |
| Inspect installment transactions | `apps_list_installments_payments`, `apps_get_installments_payment` | `/v1/installments` |
| Inspect one-time page settings | `apps_list_products`, `apps_get_product` | `/v1/client/product` |
| Inspect recurring page settings | `apps_list_paid_plans`, `apps_get_paid_plan` | `/v1/client/paid` |
| Inspect installment page settings | `apps_list_installment_plans`, `apps_get_installment_plan` | `/v1/client/installments` |

Webhook `plan.payment_type` uses `1` for one-time, `4` for recurring, and `5` for installment payments.

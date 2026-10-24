# Payment-page rules

Official source: https://theapps.jp/api/endpoints

Product manual for URL prefills: https://theapps.jp/payment/remarks-url-parameters

## Endpoint and identifier map

| Billing behavior | Base path | ID | MCP prefix |
|---|---|---|---|
| One-time | `/v1/client/product` | `product_id` | `apps_*_product` |
| Recurring | `/v1/client/paid` | `paid_id` | `apps_*_paid_plan` |
| Fixed-count installment | `/v1/client/installments` | `paid_id` | `apps_*_installment_plan` |

The transaction paths `/v1/charge`, `/v1/paid`, and `/v1/installments` inspect payments; they do not manage page configuration.

## Create bodies

The MCP schema enforces the fields it needs for a reliable create request.

- Product: `product_name`, `stripe_env_id`, `price`, and at least one enabled `platform` entry.
- Recurring: `plan_name`, `stripe_env_id`, `price`, `billing_cycle.interval`, and at least one enabled `platform` entry.
- Installment: `plan_name`, `stripe_env_id`, `price`, `billing_cycle.interval`, `billing_cycle.installments_count` of at least 2, and at least one enabled `platform` entry.

The official API marks `platform` optional and immutable after creation. Apps-mcp requires an enabled platform on creation so the intended payment method is explicit.

`stripe_env_id` is required on creation and immutable on update. Values used by Apps are `"0"` for live payments and `"1"` for test-mode payments. This mode does not change the API base URL or create a separate account sandbox.

Optional `discord_rule` attaches automatic Discord access after payment. Create the role with `apps-manage-discord` first, then put its ID here.

Optional `notes` is the remark-field list (`name`, `require`). After a plan has applications, remark fields cannot be added or removed (rename only). Design `notes` before the first application.

## Update restrictions

- `stripe_env_id` and `platform` cannot be changed after creation.
- Installment `price` and `billing_cycle` cannot be changed.
- Product `PUT` requires `product_name`, `price`, and `language` even when only one field changes; a flags-only body returns 400.
- Fetch before updating and submit only changed keys, plus the fields the endpoint requires on update.

## One-click purchase and order numbers

`use_one_click` lets a repeat customer pay with one click: the card saved at first purchase (with consent) is reused after the customer logs in. Return the same purchase URL; do not build a separate one-click URL.

- One-time card payments only (Stripe / UnivaPay). Recurring, installment, bank transfer, and PayPal purchases are out of scope.
- Enabling it requires `allow_duplicate: true`, at least one card platform (`stripe` or `univapay`), and no `waiting_list`. The API rejects other combinations with 400; apps-mcp applies the same checks on create.
- `keep_order_no` is effective only when `use_one_click` is true. It makes the plan keep the `order_no` from the purchase URL and settle only one purchase per order number.
- Disabling `use_one_click` stops one-click purchases for every customer of that plan. The saved card belongs to the seller and payment processor, not to one plan.
- On update, omitting both `use_one_click` and `keep_order_no` keeps their current values. Product `PUT` still requires `product_name`, `price`, and `language`, so include them when toggling either flag.

With `keep_order_no` enabled, pass the order number on the purchase URL:

- Use half-width letters, digits, `_`, `.`, and `-`, up to 64 characters. An invalid value is ignored and the purchase proceeds without an order number.
- A given order number settles at most once per plan. Reopening the URL after a successful purchase shows the completion screen instead of charging again, and the number stays used after a refund. Issue a new order number for a new order.
- A failed payment (insufficient funds, 3-D Secure failure, closed authentication screen) can retry with the same order number.
- Duplicate blocking applies to card payments only. Bank transfer and PayPal still store and report the order number.
- `order_no` appears in the completion redirect, the payment API and Webhook `payment` object, and the purchaser list. The customer can edit `order_no` and `quantity` in the URL, so reconcile Webhook values against the seller's order data.

## Application URL parameters

Create and get responses can contain `url_application`. Return that URL instead of constructing one.

When the user wants prefilled form values, append query parameters to the returned URL (UTF-8 encode values). If the URL already has a query string, join with `&`.

| Parameter | Applies to | Meaning |
|---|---|---|
| `remark_n=value` | One-time, recurring, installment, registration, and plan-selection forms | Prefill remark field `n`. `n` is 1-based and matches the plan-edit table (`notes[0]` → `remark_1`). Max 500 characters before encoding. |
| `quantity=` | One-time product and recurring application URLs | Prefill the purchase quantity (one-time) or contracted units (recurring, when the plan accepts a unit count). |
| `order_no=value` | One-time product URLs with `keep_order_no` enabled | Attach the seller's order number so the same order cannot be paid twice. Must match the allowed characters and 64-character limit; an invalid value is ignored. |

Prefills are editable by the customer; they cannot be made read-only. Unknown `remark_n` indexes are ignored. Mail merge tags `${remarks_name_N}` / `${remarks_value_N}` are 0-based (`remark_1` → `${remarks_value_0}`) and also work in cancellation-complete mail.

## Installment amount patterns

The Apps administration screen offers three installment amount patterns: equal split, stepped amounts, and amount-by-range. Official `InstallmentBillingCycle` documents `interval`, `installments_count` (≥2), `manual_payments`, and `sales_count`. Create equal-split plans with `price` (total) and `billing_cycle.installments_count`. Do not invent per-installment schedule keys.

Lump-sum early repayment of remaining installments is an administration-screen action that emails the customer a confirmation URL. Apps-mcp does not provide payment-execution REST.

## Recurring free trial

Official `BillingCycle` includes `trial_end` (unix time). The product UI requires immediate billing for a free-trial period. Repeat applications can skip the trial (match by phone or email) in the administration screen; phone matching requires `use_phone_number` to be required. Official Paid / BillingCycle docs do not list that skip-trial key; do not invent names.

## Checkout form settings

Product, recurring, and installment create/update bodies share these customer-input settings:

- `disable_company_name: true` hides the company-name field on the form. The Apps admin screen can also mark the field required, but the public API object only exposes the hide/optional choice.
- `card_attribute` selects card input fields: `card_name`, `card_address_country`, `card_address_zip`, `card_address_line`. Write integers (`0` hidden, `1` optional, `2` required); the API returns booleans on read and accepts both, so echoing a fetched value back is safe. Apps defaults apply when omitted. Use it when the user asks about billing-address country or required card fields; the Stripe form can accept non-Japanese billing addresses.

Report exports (for example a canceled-subscriber CSV) and per-customer billing-amount changes are admin-screen features; the public API exposes no endpoints for them.

## WaitingList

WaitingList is documented on products and installment plans, not recurring `/v1/client/paid` plans. Do not send `waiting_list` on paid-plan requests unless the official endpoint docs add it.

- When `waiting_list` is sent, `type` is required.
- For installment `type=2`, `interval` is also required.
- `type` values: `0` off, `1` manual approval, `2` automatic approval after `interval` hours, `3` formation conditions.
- For `type=3`, include only the formation fields the official API documents (deadline, minimum participants, and related mail flags). Extra keys pass through; do not invent names.

Formation-condition plans show pending (approval-waiting) applicant counts in parentheses next to the contract count in the administration list. The parenthesis is omitted when the pending count is 0. Do not invent a list-response field if the API payload does not include it.

Official DiscordRule `trigger` values are `auto`, `manual`, and `cancel` (契約解約 / contract cancellation). A live GET of a recurring plan also returned `error` (payment-error timing); do not send `error` unless a GET of that plan already shows it. Formation-condition plans can set waiting-list application and waiting-list withdrawal timings in the administration screen. Those extra waiting-list trigger strings are not listed in the Apps API DiscordRule table; do not invent names. Official `cancel` is not waiting-list withdrawal. If a role should be granted at waiting-list application and removed on withdrawal, tell the user to set both timings in the Apps administration screen — MCP has no documented REST key for them, and without the admin withdrawal rule the role remains.

## Responses

Purchaser and subscriber list tools return personal records; summarize only when the user asked for enrollment.

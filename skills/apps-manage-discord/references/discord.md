# Discord resource rules

Official source: https://theapps.jp/api/discord

## Roles

Role paths use `/v1/discord/guilds/{guild_id}/roles[/{role_id}]`.

Create requires `name`. Update may send:

- `name`
- `position`
- `permissions`: Discord permission names

Deletion returns HTTP 204.

## Channels

Channel paths use `/v1/discord/guilds/{guild_id}/channels[/{channel_id}]`.

Create requires `type` and `name`. Update may also send:

- `topic`
- `role` and `user`: permission entries
- `parent_id`: parent category ID

Each permission entry requires `id` and can include `allow` and `deny` arrays. Avoid granting permissions not named in the request.

## Plan automation boundary

The Discord resource API creates and maintains roles and channels. `discord_rule` on a payment or registration plan controls automatic actions associated with an application. Creating a role alone does not connect it to a plan.

Official DiscordRule `trigger` values are `auto` (at application, automatic), `manual` (at application, after registration), and `cancel` (契約解約 / contract cancellation). A live GET of a recurring plan in this project also returned `error` (payment-error timing); do not send `error` unless a GET of that plan already shows it. Formation-condition (`waiting_list.type=3`) plans can set waiting-list application and waiting-list withdrawal (申し込みの取り消し) timings in the Apps administration screen. Those extra waiting-list trigger strings are not listed in the Apps API DiscordRule table and were not present on sampled plans; do not invent names. Official `cancel` is not a substitute for waiting-list withdrawal. If a role should be granted at waiting-list application and removed on withdrawal, tell the user to configure both timings in the administration screen — MCP has no documented REST key for them, and without the admin withdrawal rule the role remains.

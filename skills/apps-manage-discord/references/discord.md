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

Official DiscordRule `trigger` values are `auto` (at application, automatic), `manual` (at application, after registration), and `cancel` (cancellation). A live GET of a recurring plan in this project also returned `error` (payment-error timing). Formation-condition (`waiting_list.type=3`) plans can also set administration-screen timings for waiting-list application and waiting-list cancellation. Those extra waiting-list trigger strings are not listed in the Apps API DiscordRule table and were not present on sampled plans; do not invent names. If a role is granted at waiting-list application, add a matching cancellation-time rule or the role remains after the application is withdrawn.

# Discord resource rules

Official source: https://theapps.jp/api/discord

## Roles

Role paths use `/v1/discord/guilds/{guild_id}/roles[/{role_id}]`.

Create and update bodies can contain:

- `name`
- `position`
- `permissions`: Discord permission names

Deletion returns HTTP 204.

## Channels

Channel paths use `/v1/discord/guilds/{guild_id}/channels[/{channel_id}]`.

Create and update bodies can contain:

- `type`: Discord channel type
- `name`
- `topic`
- `role` and `user`: permission entries
- `parent_id`: parent category ID

Each permission entry requires `id` and can include `allow` and `deny` arrays. Avoid granting permissions not named in the request.

## Plan automation boundary

The Discord resource API creates and maintains roles and channels. `discord_rule` on a payment or registration plan controls automatic actions associated with an application. Creating a role alone does not connect it to a plan.

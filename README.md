# apps-mcp

**Unofficial** Model Context Protocol (MCP) server for the [Apps API](https://theapps.jp/api) (`theapps.jp`).

> This project is **not** affiliated with, endorsed by, or related to the Apps product or its operator.  
> It is a community open-source client. Always follow the official docs and terms.

- Protocol: **MCP 2026-07-28** oriented (stateless factory; stdio by default, optional HTTP)
- Runtime: **Bun** + **TypeScript** + **Biome** + **Zod**
- Auth: your own `APPS_APP_ID` / `APPS_APP_SECRET` (no hosted OAuth)
- License: **MIT**

## Why local OSS?

Apps API auth is **app credentials** (client credentials), not a hosted OAuth connector flow.  
The safest and simplest UX is: install locally, put secrets in your MCP client `env`, done.

## Quick start

### 1. Get credentials

In the Apps admin API settings, copy **App ID** and **App Secret**.  
Never paste them into chat, GitHub, or support forms.

### 2. Add to your MCP client

```json
{
  "mcpServers": {
    "apps": {
      "command": "bunx",
      "args": ["-y", "apps-mcp"],
      "env": {
        "APPS_APP_ID": "your-app-id",
        "APPS_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

Node alternative:

```json
{
  "mcpServers": {
    "apps": {
      "command": "npx",
      "args": ["-y", "apps-mcp"],
      "env": {
        "APPS_APP_ID": "your-app-id",
        "APPS_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

### 3. (Optional) enable writes

Writes talk to **production** (Apps API has **no sandbox**).

```json
{
  "env": {
    "APPS_APP_ID": "your-app-id",
    "APPS_APP_SECRET": "your-app-secret",
    "APPS_MCP_ALLOW_WRITE": "true"
  }
}
```

Create/update/delete tools still require `confirm: true`. Prefer `dry_run: true` first.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `APPS_APP_ID` | yes* | App ID |
| `APPS_APP_SECRET` | yes* | App Secret |
| `APPS_ACCESS_TOKEN` | no | Static bearer (skips refresh if set; 401 will not auto-refresh) |
| `APPS_API_BASE_URL` | no | Default `https://api.theapps.jp` (override needs `APPS_MCP_ALLOW_CUSTOM_BASE_URL=true`) |
| `APPS_MCP_ALLOW_CUSTOM_BASE_URL` | no | Allow non-default API base (dangerous) |
| `APPS_MCP_ALLOW_WRITE` | no | Default `false` |
| `APPS_MCP_TIMEOUT_MS` | no | HTTP timeout (default `30000`) |
| `PORT` / `APPS_MCP_PORT` | no | HTTP mode port (default `8787`, Bun only) |
| `APPS_MCP_HOST` | no | HTTP bind host (default `127.0.0.1`) |
| `APPS_MCP_HTTP_ALLOW_REMOTE` | no | Allow non-loopback HTTP bind (dangerous) |

\* Or provide `APPS_ACCESS_TOKEN`.

## Tools (overview)

| Area | Examples |
|------|----------|
| Auth | `apps_auth_status`, `apps_clear_token_cache` |
| Customer / payment | `apps_get_customer`, `apps_get_charge`, `apps_get_paid_payment`, `apps_get_installments_payment` |
| Registration plans | `apps_list_advance_plans`, `apps_create_advance_plan`, … |
| One-time products | `apps_list_products`, `apps_create_product`, … |
| Subscriptions | `apps_list_paid_plans`, … |
| Installments | `apps_list_installment_plans`, … |
| Coupons | `apps_list_coupons`, … |
| Discord | `apps_get_discord_role`, `apps_create_discord_channel`, … |

Official endpoint details: https://theapps.jp/api/endpoints

### Important API facts

- Base URL is production only: `https://api.theapps.jp`
- Payment page APIs use `/v1/client/...` (not `/v1/apps/...`)
- `payment_id` comes from the Webhook payment-success event — not the admin UI display id

## Agent skill

Repository skill: [`skills/apps-api/`](./skills/apps-api/)

Install into your agent skills folder if you want workflow guidance alongside the MCP tools.

## Develop

```bash
bun install
bun run start
bun test
bun run check
bun run typecheck
```

Optional stateless HTTP (**Bun only**, loopback by default):

```bash
bun run src/index.ts --http
```

`npx` / Node users should use **stdio** (default). HTTP mode uses `Bun.serve` and refuses non-loopback binds unless `APPS_MCP_HTTP_ALLOW_REMOTE=true`.

Build distributable bin:

```bash
bun run build
```

## Security notes

- Default mode is **read-only**
- Write tools require env flag + `confirm: true`
- Do not log PII or secrets
- This MCP does not implement charge/refund/cancel APIs (not publicly available)

## Disclaimer

Apps / アップス / theapps.jp are trademarks of their respective owners.  
This software is provided as-is, with no warranty, and no official support channel.

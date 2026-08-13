---
title: Getting Started
description: Fastest path to set up Apps-mcp.
---

Apps-mcp is an **unofficial** toolkit for the [Apps API](https://theapps.jp/api). Use it from Cursor, Claude Code, Codex, and similar agents for customers, payment pages, coupons, and Discord.

This repository has two parts:

- **MCP (Apps-mcp)** — executes Apps API calls with auth, HTTP, and write guards
- **Agent Skills (apps-api)** — recipes and required fields for stable workflows

Auth uses **App ID / App Secret** from the Apps admin console (not OAuth).

## Prerequisites

- Node.js 20+
- Apps API enabled
- App ID and App Secret

Never paste secrets into chat, GitHub, or tickets.

## Start in 5 minutes

1. Follow [Installation](/en/docs/installation/)
2. Add Agent Skills
3. Restart your client
4. Check with `apps_auth_status`
5. Ask in natural language

Writes are off by default. See [Safety Guide](/en/docs/safety/).

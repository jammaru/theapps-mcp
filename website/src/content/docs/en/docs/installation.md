---
title: Installation
description: configure, Skills, and manual MCP setup.
---

## 1. Get credentials

1. Sign in to [Apps](https://theapps.jp/)
2. Install the API feature
3. Copy App ID and App Secret

## 2. Configure

```bash
npx -y theapps-mcp configure
```

## 3. Add Skills

```bash
npx skills add jammaru/theapps-mcp
```

## 4. Restart and verify

Restart Cursor, Claude Code, Codex, or a similar client, then use `apps_auth_status`.

## Manual config

```json
{
  "mcpServers": {
    "apps": {
      "command": "npx",
      "args": ["-y", "theapps-mcp"],
      "env": {
        "APPS_APP_ID": "your-app-id",
        "APPS_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

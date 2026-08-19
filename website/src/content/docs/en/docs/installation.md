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

Claude Desktop: upload [theapps-mcp-skills.zip](https://github.com/jammaru/theapps-mcp/releases/latest/download/theapps-mcp-skills.zip) once. It includes every workflow skill.

## 4. Restart and verify

Restart Cursor, Claude Code, Codex, or a similar client, then use `apps_auth_status`.

## Manual config

```json
{
  "mcpServers": {
    "apps": {
      "command": "npx",
      "args": ["-y", "theapps-mcp@latest"],
      "env": {
        "APPS_APP_ID": "your-app-id",
        "APPS_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

`theapps-mcp@latest` means a client restart picks up the current npm release.

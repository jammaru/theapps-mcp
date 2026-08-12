---
title: 設定
description: Apps-mcp の環境変数と設定項目。
---

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `APPS_APP_ID` | yes* | アプリID |
| `APPS_APP_SECRET` | yes* | アプリシークレット |
| `APPS_ACCESS_TOKEN` | no | 固定 Bearer（指定時は自動更新しない） |
| `APPS_MCP_ALLOW_WRITE` | no | 書き込み許可（既定 `false`） |
| `APPS_API_BASE_URL` | no | 既定 `https://api.theapps.jp`（変更には `APPS_MCP_ALLOW_CUSTOM_BASE_URL=true`） |
| `APPS_MCP_HTTP_BEARER` | HTTP remote 時 | 非 loopback の `--http` では必須。`Authorization: Bearer …` |

\* または `APPS_ACCESS_TOKEN`

## configure ウィザード

```bash
npx -y theapps-mcp configure
```

- 資格情報の入力
- 書き込み許可の選択（許可時は本番 API・実データへの影響を表示）
- MCP クライアントへの登録（任意）

再設定:

```bash
npx -y theapps-mcp configure --force
```

## 手動 MCP 設定例

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

## HTTP モード（開発者向け）

コントリビュータ向けの起動例です。利用者向けの `npx` 導入に Bun は不要です。

```bash
bun run src/index.ts --http
```

非 loopback は `APPS_MCP_HTTP_ALLOW_REMOTE=true` と `APPS_MCP_HTTP_BEARER` が必要です。

## 資格情報の扱い

- リポジトリ・チャット・Issue・スクリーンショットに貼らない
- ツールはシークレットを返さない設計
- 応答に出てきても保存・再投稿しない

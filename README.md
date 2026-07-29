# apps-mcp

**Unofficial** [Apps API](https://theapps.jp/api) 向け MCP サーバー（MIT）

認証は OAuth ではなく、Apps 管理画面の **アプリID / アプリシークレット** です。  
ローカルで動かして、自分の資格情報だけを MCP クライアントに渡す使い方がいちばん簡単です。

## 使い方（いちばん簡単）

### 1. アプリID・シークレットを取得

1. [Apps](https://theapps.jp/) にログイン
2. 管理画面で API 機能をインストール
3. API 設定画面で **アプリID** と **アプリシークレット** を控える

チャット・GitHub・問い合わせ本文には貼らないでください。

### 2. セットアップ

```bash
npx -y github:manmaru-ai/apps-mcp configure
```

対話ウィザードが次を行います。

- アプリID / アプリシークレットの入力
- 書き込み許可の有無（既定は読み取り専用）
- Cursor / Claude Code / Claude Desktop への MCP 登録（任意）
- 手動追加用 JSON の表示

再設定:

```bash
npx -y github:manmaru-ai/apps-mcp configure --force
```

npm 公開後は `npx -y apps-mcp configure` でも同じです。

### 3. クライアントを再起動

設定後、Cursor や Claude Desktop を再起動してください。  
まずはツール `apps_auth_status` で接続確認できます。

Windows Store 版 Claude Desktop は設定ファイルのパスが異なります。`configure` が自動検出します。

---

## 手動で追加する場合

`configure` を使わず、設定ファイルに直接書いても構いません。

```json
{
  "mcpServers": {
    "apps": {
      "command": "npx",
      "args": ["-y", "github:manmaru-ai/apps-mcp"],
      "env": {
        "APPS_APP_ID": "your-app-id",
        "APPS_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

### 書き込みを許可する場合のみ

Apps API は **本番のみ**（Sandbox なし）です。

```json
{
  "env": {
    "APPS_APP_ID": "your-app-id",
    "APPS_APP_SECRET": "your-app-secret",
    "APPS_MCP_ALLOW_WRITE": "true"
  }
}
```

作成・更新・削除ツールは、さらに `confirm: true` が必要です。先に `dry_run: true` 推奨。

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `APPS_APP_ID` | yes* | アプリID |
| `APPS_APP_SECRET` | yes* | アプリシークレット |
| `APPS_ACCESS_TOKEN` | no | 固定 Bearer（指定時は自動更新しない） |
| `APPS_MCP_ALLOW_WRITE` | no | 書き込み許可（既定 `false`） |
| `APPS_API_BASE_URL` | no | 既定 `https://api.theapps.jp`（変更には `APPS_MCP_ALLOW_CUSTOM_BASE_URL=true`） |

\* または `APPS_ACCESS_TOKEN`

## できること

| 領域 | 例 |
|------|----|
| 認証 | `apps_auth_status` |
| 顧客・決済照会 | `apps_get_customer`, `apps_get_charge`, … |
| 登録ページ | `apps_list_advance_plans`, … |
| 決済ページ | `apps_list_products`, `apps_list_paid_plans`, … |
| クーポン | `apps_list_coupons`, … |
| Discord | `apps_get_discord_role`, … |

公式エンドポイント: https://theapps.jp/api/endpoints

- 決済ページ API は `/v1/client/...`
- `payment_id` は Webhook 決済成功イベント由来（管理画面の表示IDではない）

## Agent skill

[`skills/apps-api/`](./skills/apps-api/)

## 開発

```bash
bun install
bun run start
bun test
bun run check
bun run typecheck
```

```bash
bun run src/index.ts configure
bun run src/index.ts --http   # Bun のみ / 既定は loopback
```

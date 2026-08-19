---
title: インストール
description: npx configure、Skills 追加、手動 MCP 登録の手順。
---

## 1. アプリID・シークレットを取得

1. [Apps](https://theapps.jp/) にログイン
2. 管理画面で API 機能をインストール
3. API 設定画面で **アプリID** と **アプリシークレット** を控える

## 2. configure（推奨）

Node.js 20 以上があれば十分です。リポジトリのクローンは不要です。

```bash
npx -y theapps-mcp configure
```

対話ウィザードが次を行います。

- アプリID / アプリシークレットの入力
- 書き込み許可の有無（既定は読み取り専用）
- Cursor / Claude Code / Claude Desktop への MCP 登録（任意）
- 設定プレビューと手動追加用テンプレートの表示

再設定:

```bash
npx -y theapps-mcp configure --force
```

## 3. Agent Skills（推奨）

```bash
npx skills add jammaru/theapps-mcp
```

GitHub CLI（v2.90.0 以降）:

必要なSkill名を指定します。例:

```bash
gh skill install jammaru/theapps-mcp apps-manage-payment-pages
```

Claude Desktop は [theapps-mcp-skills.zip](https://github.com/jammaru/theapps-mcp/releases/latest/download/theapps-mcp-skills.zip) を1つアップロードしてください。全ワークフローSkillが含まれます。

## 4. クライアントを再起動

設定後、Cursor や Claude Code、Codex などを再起動し、ツール `apps_auth_status` で接続確認してください。

Windows Store 版 Claude Desktop は設定ファイルのパスが異なります。`configure` が自動検出します。

## 手動で追加する場合

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

`theapps-mcp@latest` なので、MCP クライアントを再起動すると npm の最新版を取ります。

書き込みを許可する場合のみ（Apps API は **本番のみ**）:

```json
{
  "env": {
    "APPS_APP_ID": "your-app-id",
    "APPS_APP_SECRET": "your-app-secret",
    "APPS_MCP_ALLOW_WRITE": "true"
  }
}
```

作成・更新・削除ツールは、さらに `confirm: true` が必要です。先に `dry_run: true` を推奨します。

## Agent にセットアップを任せる

```text
Apps-mcp をセットアップしてください。

1. node -v / npx -v を確認する。無ければ Node.js LTS（20以上）の入れ方を案内して、導入後に続きをやる
2. ユーザーに Apps 管理画面のアプリID / アプリシークレットを用意してもらう（configure の対話入力で渡す）
3. 実行: npx -y theapps-mcp configure
4. 推奨: npx skills add jammaru/theapps-mcp
5. Cursor / Claude Code / Codex などの再起動を案内し、ツール apps_auth_status で接続確認する手順を伝える
```

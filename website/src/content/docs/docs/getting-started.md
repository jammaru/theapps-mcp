---
title: はじめに
description: Apps-mcp を使い始める最短ルート。認証、configure、Skills、接続確認まで。
---

Apps-mcp は **非公式** の [Apps API](https://theapps.jp/api) 向けツールキットです。Cursor や Claude などの AI エージェントから、顧客照会・決済ページ・クーポン・Discord 連携などを扱えます。

このリポジトリには次の **2つ** があります。

- **MCP（Apps-mcp）** … Apps API を呼び出す実行役。認証、HTTP、読み取り／書き込みガードを担当します。
- **Agent Skills（apps-api）** … 使い方の手順書。どのツールを使うか、必須フィールド、作業の流れ、注意点をエージェントに渡します。

認証は OAuth ではなく、Apps 管理画面の **アプリID / アプリシークレット** です。

## 前提

- Node.js 20 以上（`node -v` / `npx -v`）
- Apps 管理画面で API 機能をインストール済み
- アプリID と アプリシークレット

チャット・GitHub・問い合わせ本文にシークレットを貼らないでください。

## 5 分で始める

1. [Installation](/docs/installation/) の手順で `configure` を実行する
2. 推奨: Agent Skills を入れる
3. Cursor / Claude を再起動する
4. ツール `apps_auth_status` で接続を確認する
5. 日本語で依頼する（例: 「買い切り決済ページの一覧を見せて」）

書き込みは既定でオフです。作成・更新・削除が必要なときだけ書き込みを許可してください。詳細は [Safety Guide](/docs/safety/) を読んでください。

## 次のページ

- [Installation](/docs/installation/)
- [Usage](/docs/usage/)
- [Tools](/docs/tools/)
- [Configuration](/docs/configuration/)
- [Safety Guide](/docs/safety/)
- [FAQ](/docs/faq/)

ソースと README: [jammaru/theapps-mcp](https://github.com/jammaru/theapps-mcp)

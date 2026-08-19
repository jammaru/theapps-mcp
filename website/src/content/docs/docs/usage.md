---
title: 使い方
description: セットアップ後の使い方、dry_run / confirm、依頼例。
---

セットアップ後は、普通に日本語で依頼すれば大丈夫です。Agent がツールを選びます。

## 依頼例

- 「Apps の決済ページ（1回払い）一覧を見せて」
- 「テストモード決済用に『単発セミナー』3000円の決済ページを作って。実アカウントへの書き込み前に dry_run して」
- 「この customer_id の顧客情報を確認して: …」
- 「登録ページの一覧を出して」

## 読み取りから始める

書き込みは既定でオフです。まずは一覧・取得系から始めてください。

1. `apps_auth_status` で接続確認
2. 必要なら `apps_help`（`topic=skill`）で索引を確認
3. 顧客・決済・プランの読み取り
4. 書き込みが必要になったら [Safety Guide](/docs/safety/) と [Configuration](/docs/configuration/) を確認

## 書き込みの流れ

Apps API は **本番のみ**（Sandbox なし）です。

1. `APPS_MCP_ALLOW_WRITE=true` を有効化（`configure` でも可）
2. 先に `dry_run: true` で method / path / body を確認
3. 内容を説明し、ユーザー確認後に `confirm: true` で実行
4. DELETE は戻せない前提で確認する

## 目的に合うSkillを使う

SkillsはAPI全体の説明書ではなく、利用者の目的ごとのワークフローです。決済確認、決済ページ、登録ページ、割引コード、Discord、Webhookなどから、依頼に合うSkillが選ばれます。

ソース: [`skills/`](https://github.com/jammaru/theapps-mcp/tree/main/skills)

---
title: FAQ
description: Apps-mcp についてのよくある質問。
---

## 公式ですか？

いいえ。**Unofficial** です。Apps / theapps.jp の公式プロダクトではありません。仕様の正本は [theapps.jp/api](https://theapps.jp/api) です。

## Bun は必要ですか？

利用者向けの `npx` 導入に Bun は不要です。Bun はコントリビュータ／リリース向けです。

## クローンは必要ですか？

通常は不要です。`npx -y theapps-mcp configure` で始められます。

## 書き込みが拒否されます

既定は読み取り専用です。`APPS_MCP_ALLOW_WRITE=true` を設定し、実行時に `confirm: true` が必要です。先に `dry_run: true` を推奨します。

## Sandbox はありますか？

ありません。本番 API のみです。

## Skills は必須ですか？

必須ではありませんが、作成・更新の安定のために強く推奨します。

```bash
npx skills add jammaru/theapps-mcp
```

## Claude Desktop で Skills を入れるには？

[theapps-mcp-skills.zip](https://github.com/jammaru/theapps-mcp/releases/latest/download/theapps-mcp-skills.zip) を1つアップロードしてください。全ワークフローSkillが含まれます。

## ライセンスは？

MIT License です。[LICENSE](https://github.com/jammaru/theapps-mcp/blob/main/LICENSE)

## 問題を報告したい

[GitHub Issues](https://github.com/jammaru/theapps-mcp/issues) または Pull Request を歓迎します。

## README との関係

サイトの説明は README と実装に合わせてあります。最新の開発者向け詳細は [README](https://github.com/jammaru/theapps-mcp/blob/main/README.md) を参照してください。

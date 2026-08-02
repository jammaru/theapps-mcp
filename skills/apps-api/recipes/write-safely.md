# 書き込みを安全に行う

## 前提チェック

1. `apps_auth_status` で資格情報あり
2. 環境に `APPS_MCP_ALLOW_WRITE=true`（無ければユーザーに設定を案内。勝手に有効化の手順だけ伝えて値は聞かない）
3. 対象リソースを GET / list で確認済み
4. 変更差分をユーザーに説明済み

## 手順

```text
1. dry_run: true で create/update/delete を呼ぶ
2. 返った method / path / body を確認
3. 問題なければ confirm: true で本番実行
```

例（1回払い作成のドライラン）:

```json
{
  "body": {
    "product_name": "単発講座",
    "stripe_env_id": "1",
    "price": 3000,
    "language": "ja",
    "platform": { "stripe": true }
  },
  "dry_run": true
}
```

本番:

```json
{
  "body": { "...同じ..." },
  "confirm": true
}
```

## 失敗しやすい点

- `confirm` なし → ガードで拒否される（正常）
- 書き込み無効 → 環境変数の案内が必要
- 必須フィールド欠落 → 該当 `references/` を読む
- 本番 `stripe_env_id=0` をテストのつもりで指定 → 必ず確認

詳細: [references/safety.md](../references/safety.md)

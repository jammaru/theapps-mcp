# WaitingList（成立条件付き申込）

一次情報: https://theapps.jp/api/endpoints （WaitingList オブジェクト）

`waiting_list` は、手動承認・自動承認・成立条件付き申込（従来のウェイティングリスト）の設定です。

## 対応 API

| API | パス | ツール |
|-----|------|--------|
| 1回払い | `/v1/client/product` | `apps_*_product` |
| 毎月払い（回数制限） | `/v1/client/installments` | `apps_*_installment_plan` |
| 登録ページ | `/v1/advance` | `apps_*_advance_plan` |

定期払い（`/v1/client/paid`）では `waiting_list` を使わない。

## type

| type | 意味 |
|------|------|
| `0` | 使用しない |
| `1` | 手動承認 |
| `2` | 自動承認（`interval` 時間後に自動契約） |
| `3` | 成立条件付き申込 |

## 送信ルール（重要）

### 登録ページ（advance）

- `waiting_list` を送る場合は **`type` 必須**
- 機能を使わない場合は **`waiting_list` オブジェクト自体を送らない**（`type: 0` を送らない）

### 毎月払いプラン（installments）

- `waiting_list` を送る場合は **`type` 必須**
- `type=2`（自動承認）のときは **`interval` も必須**

### 1回払い（product）

- `waiting_list` で成立条件付き申込を設定できる
- 詳細フィールドは公式 WaitingList 表を正とする

## 主なフィールド

| key | 条件 | 説明 |
|-----|------|------|
| `type` | advance / installments でオブジェクト送信時は必須 | `0`–`3` |
| `interval` | `type=2`。installments では必須 | 自動承認までの時間（時間単位） |
| `mail_application` | 任意 | 申し込みメール |
| `mail_cancel` | `type=3` で有効 | 不成立メール |
| `formation_trigger` | 任意 | 成立条件 |
| `application_deadline` | `type=3` | 締切（Unix 時間想定。公式制約に従う） |
| `min_participants` | `type=3` | 最小成立人数 |

## 例

登録ページで手動承認:

```json
{
  "contract_type": "email",
  "plan_name": "先行申込",
  "language": "ja",
  "waiting_list": { "type": 1 }
}
```

毎月払いで 24 時間後自動承認:

```json
{
  "plan_name": "分割講座",
  "stripe_env_id": "1",
  "price": 30000,
  "language": "ja",
  "platform": { "stripe": true },
  "billing_cycle": { "interval": "month", "installments_count": 3 },
  "waiting_list": { "type": 2, "interval": 24 }
}
```

使わない登録ページ例（`waiting_list` キーなし）:

```json
{
  "contract_type": "email",
  "plan_name": "通常登録",
  "language": "ja"
}
```

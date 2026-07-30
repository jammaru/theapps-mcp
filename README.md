# Apps-mcp

**Unofficial** [Apps API](https://theapps.jp/api) 向けのツールキットです。  
Cursor や Claude などの AI エージェントから、顧客照会・決済ページ作成・クーポン・Discord 連携などを扱えるようにします。

このリポジトリには次の **2つ** があります。

- **MCP（Apps-mcp）** … 実際に Apps API を呼び出す実行役です。認証、HTTP、読み取り／書き込みのガードを担当します。エージェントの「ツール」として動きます。
- **Agent Skills（apps-api）** … 使い方の手順書です。どのツールを使うか、必須フィールド、よくある作業の流れ、注意点をエージェントに渡します。MCP だけでは迷いやすい作成・更新を、Skills があると安定させやすくなります。

認証は OAuth ではなく、Apps 管理画面の **アプリID / アプリシークレット** です。  
ローカルで動かして、自分の資格情報だけを MCP クライアントに渡す使い方がいちばん簡単です。

問題や改善案があれば、Issue や Pull Request を歓迎します。

## 使い方（いちばん簡単）

### 1. アプリID・シークレットを取得

1. [Apps](https://theapps.jp/) にログイン
2. 管理画面で API 機能をインストール
3. API 設定画面で **アプリID** と **アプリシークレット** を控える

チャット・GitHub・問い合わせ本文には貼らないでください。

### 2. セットアップ

`npx` を使うため、**Node.js 20 以上**が必要です。入っていなければ先に入れてください。

- 確認: `node -v` / `npx -v`
- 未導入: https://nodejs.org/ から LTS をインストール

```bash
npx -y github:jammaru/apps-mcp configure
```

対話ウィザードが次を行います。

- アプリID / アプリシークレットの入力
- 書き込み許可の有無（既定は読み取り専用。許可時は本番APIのみ・実データに影響し得る旨を表示）
- Cursor / Claude Code / Claude Desktop への MCP 登録（任意）
- 設定プレビューと手動追加用テンプレートの表示

接続後は Agent Skills も入れると、プラン作成などの手順が安定します。

```bash
npx skills add jammaru/apps-mcp
```

再設定:

```bash
npx -y github:jammaru/apps-mcp configure --force
```

npm 公開後は `npx -y apps-mcp configure` でも同じです。

#### Agent にセットアップを任せたい場合

次のプロンプトを Agent に渡してください。

```text
Apps-mcp をセットアップしてください。

1. node -v / npx -v を確認する。無ければ Node.js LTS（20以上）の入れ方を案内して、導入後に続きをやる
2. ユーザーに Apps 管理画面のアプリID / アプリシークレットを用意してもらう（configure の対話入力で渡す）
3. 実行: npx -y github:jammaru/apps-mcp configure
4. 推奨: npx skills add jammaru/apps-mcp
5. Cursor / Claude の再起動を案内し、ツール apps_auth_status で接続確認する手順を伝える
```

### 3. クライアントを再起動

設定後、Cursor や Claude Desktop を再起動してください。  
まずはツール `apps_auth_status` で接続確認できます。

Windows Store 版 Claude Desktop は設定ファイルのパスが異なります。`configure` が自動検出します。

### 4. 使う（これだけでOK）

セットアップ後は、普通に日本語で依頼すれば大丈夫です。例:

- 「Apps の決済ページ（1回払い）一覧を見せて」
- 「テスト環境で『単発セミナー』3000円の決済ページを作って。先に dry_run して」
- 「この customer_id の顧客情報を確認して: …」
- 「登録ページの一覧を出して」

Agent がツールを選びます。書き込みは既定でオフなので、作る・更新・削除をしたいときだけ `configure` で書き込み許可するか、設定の `APPS_MCP_ALLOW_WRITE=true` を有効にしてください。

---

## 手動で追加する場合

`configure` を使わず、設定ファイルに直接書いても構いません。

```json
{
  "mcpServers": {
    "apps": {
      "command": "npx",
      "args": ["-y", "github:jammaru/apps-mcp"],
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
| `APPS_MCP_HTTP_BEARER` | HTTP remote 時 | 非 loopback の `--http` では必須。`Authorization: Bearer …` |

\* または `APPS_ACCESS_TOKEN`

## できること

書き込み（create / update / delete）は `APPS_MCP_ALLOW_WRITE=true` かつ `confirm: true` が必要です。

### 認証・ヘルプ

| ツール | 内容 |
|--------|------|
| `apps_help` | セットアップ・安全・ツール一覧の案内 |
| `apps_auth_status` | 資格情報の有無（シークレットは返さない） |
| `apps_clear_token_cache` | アクセストークンキャッシュのクリア |

### 顧客・決済照会

| ツール | 内容 |
|--------|------|
| `apps_get_customer` | 顧客情報 |
| `apps_get_charge` | 買い切り決済 |
| `apps_get_paid_payment` | 定期課金の決済 |
| `apps_get_installments_payment` | 分割払いの決済 |

### 登録ページ（advance）

| ツール | 内容 |
|--------|------|
| `apps_list_advance_plans` | 一覧 |
| `apps_get_advance_plan` | 取得 |
| `apps_create_advance_plan` | 作成 |
| `apps_update_advance_plan` | 更新 |
| `apps_delete_advance_plan` | 削除 |
| `apps_list_advance_plan_contractors` | 契約者一覧 |

### 決済ページ — 買い切り（product）

| ツール | 内容 |
|--------|------|
| `apps_list_products` | 一覧 |
| `apps_get_product` | 取得 |
| `apps_create_product` | 作成 |
| `apps_update_product` | 更新 |
| `apps_delete_product` | 削除 |
| `apps_list_product_purchasers` | 購入者一覧 |

### 決済ページ — 定期（paid）

| ツール | 内容 |
|--------|------|
| `apps_list_paid_plans` | 一覧 |
| `apps_get_paid_plan` | 取得 |
| `apps_create_paid_plan` | 作成 |
| `apps_update_paid_plan` | 更新 |
| `apps_delete_paid_plan` | 削除 |
| `apps_list_paid_plan_subscribers` | 購読者一覧 |

### 決済ページ — 分割（installments）

| ツール | 内容 |
|--------|------|
| `apps_list_installment_plans` | 一覧 |
| `apps_get_installment_plan` | 取得 |
| `apps_create_installment_plan` | 作成 |
| `apps_update_installment_plan` | 更新 |
| `apps_delete_installment_plan` | 削除 |
| `apps_list_installment_plan_subscribers` | 購読者一覧 |

### クーポン

| ツール | 内容 |
|--------|------|
| `apps_list_coupons` | 一覧 |
| `apps_get_coupon` | 取得 |
| `apps_create_coupon` | 作成 |
| `apps_update_coupon` | 更新 |
| `apps_delete_coupon` | 削除 |

### Discord

| ツール | 内容 |
|--------|------|
| `apps_get_discord_role` | ロール取得 |
| `apps_create_discord_role` | ロール作成 |
| `apps_update_discord_role` | ロール更新 |
| `apps_delete_discord_role` | ロール削除 |
| `apps_get_discord_channel` | チャンネル取得 |
| `apps_create_discord_channel` | チャンネル作成 |
| `apps_update_discord_channel` | チャンネル更新 |
| `apps_delete_discord_channel` | チャンネル削除 |

公式エンドポイント: https://theapps.jp/api/endpoints

- 決済ページ API は `/v1/client/...`
- `payment_id` は Webhook 決済成功イベント由来（管理画面の表示IDではない）

## Agent Skills（利用者向け）

MCP は実行、スキルは「どのツール・どのフィールド・どの順番か」を案内します。  
Cursor / Claude Code などでは次で入れられます。

```bash
npx skills add jammaru/apps-mcp
```

入るスキル名は `apps-api` です。書き込みやプラン作成の前に `recipes/` と `references/` を読む想定です。  
中身: [`skills/apps-api/`](./skills/apps-api/)

迷ったらツール `apps_help`（`topic=skill`）でも索引を返せます。

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
# 非 loopback は APPS_MCP_HTTP_ALLOW_REMOTE=true と APPS_MCP_HTTP_BEARER が必要
```

## License

MIT

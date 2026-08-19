import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import prompts from "prompts";
import {
  buildAppsMcpEntry,
  claudeCodeConfigPath,
  claudeDesktopConfigPath,
  cursorMcpConfigPath,
  formatConfigureStdoutSnippets,
  type McpConfigFile,
  type McpServerEntry,
  removeMcpServer,
  upsertMcpServer,
} from "./mcp-paths.ts";

const SERVER_NAME = "apps";

function readJsonFile(path: string): McpConfigFile {
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as McpConfigFile;
  } catch {
    return {};
  }
}

function writeJsonFile(path: string, data: McpConfigFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  // Node's mode is ignored on Windows; on Unix re-apply after write for umask safety.
  if (process.platform !== "win32") {
    try {
      chmodSync(path, 0o600);
    } catch {
      console.warn(
        `警告: ${path} の権限を 0600 にできませんでした。ファイル権限を確認してください。`,
      );
    }
  }
}

async function maybeUpdateClient(
  label: string,
  path: string | null,
  entry: McpServerEntry,
): Promise<void> {
  if (!path) {
    console.log(`\n${label}: この環境では設定パスを自動検出できませんでした。`);
    return;
  }

  const current = readJsonFile(path);
  const exists = Boolean(current.mcpServers?.[SERVER_NAME]);

  if (exists) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: `${label} に "${SERVER_NAME}" が既にあります。どうしますか？\n  (${path})`,
      choices: [
        { title: "そのまま残す", value: "keep" },
        { title: "設定を更新する", value: "update" },
        { title: "削除する", value: "remove" },
      ],
      initial: 1,
    });
    if (action === "keep" || action === undefined) return;
    if (action === "remove") {
      writeJsonFile(path, removeMcpServer(current, SERVER_NAME));
      console.log(`✓ ${label} から削除しました: ${path}`);
      return;
    }
    writeJsonFile(path, upsertMcpServer(current, SERVER_NAME, entry));
    console.log(`✓ ${label} を更新しました: ${path}`);
    return;
  }

  const { add } = await prompts({
    type: "confirm",
    name: "add",
    message: `${label} に MCP を追加しますか？\n  (${path})`,
    initial: true,
  });
  if (!add) return;
  writeJsonFile(path, upsertMcpServer(current, SERVER_NAME, entry));
  console.log(`✓ ${label} に追加しました: ${path}`);
}

export async function configure(argv: string[] = process.argv.slice(2)): Promise<void> {
  const force = argv.includes("--force");

  console.log("\nApps-mcp configure\n");
  console.log("Apps 管理画面の API 設定で取得したアプリID / アプリシークレットを使います。");
  console.log("ブラウザログインは不要です。\n");

  if (force) {
    console.log("--force: 新しく入力し直します。\n");
  }

  const answers = await prompts([
    {
      // password style: avoid echoing client id into scrollback / IDE terminal logs
      type: "password",
      name: "appId",
      message: "APPS_APP_ID（アプリID）",
      validate: (v: string) => (v.trim() ? true : "必須です"),
    },
    {
      type: "password",
      name: "appSecret",
      message: "APPS_APP_SECRET（アプリシークレット）",
      validate: (v: string) => (v.trim() ? true : "必須です"),
    },
    {
      type: "confirm",
      name: "allowWrite",
      message:
        "書き込み（作成・更新・削除）を許可しますか？\n  ※接続先は本番APIのみです（Sandboxなし）。実データに影響し得ます / 既定はいいえ",
      initial: false,
    },
  ]);

  if (!answers.appId || !answers.appSecret) {
    console.error("キャンセルされました。");
    process.exit(1);
  }

  const entry = buildAppsMcpEntry({
    appId: String(answers.appId).trim(),
    appSecret: String(answers.appSecret).trim(),
    allowWrite: Boolean(answers.allowWrite),
  });

  const snippets = formatConfigureStdoutSnippets(entry);
  console.log("\n--- 設定プレビュー ---\n");
  console.log(snippets.preview);
  console.log("\n--- 手動追加用テンプレート ---\n");
  console.log(snippets.template);
  console.log("");

  await maybeUpdateClient("Cursor", cursorMcpConfigPath(), entry);
  await maybeUpdateClient("Claude Code", claudeCodeConfigPath(), entry);
  await maybeUpdateClient("Claude Desktop", claudeDesktopConfigPath(), entry);

  console.log("\n完了です。MCP クライアントを再起動してください。");
  console.log("動作確認: ツール apps_auth_status を実行");
  console.log("手順スキル（推奨）: npx skills add jammaru/theapps-mcp");
  console.log("Claude Desktop 向け Skills: https://github.com/jammaru/theapps-mcp/releases/latest");
}

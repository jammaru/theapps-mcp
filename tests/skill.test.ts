import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { APPS_TOOL_SKILLS, toolSkillHint } from "../src/lib/skill-hint.ts";
import { APPS_SKILLS } from "../src/lib/skills.ts";
import { registerAuthTools } from "../src/tools/auth.ts";
import { TOOL_CATALOG, type ToolName } from "../src/tools/catalog.ts";
import { registerCustomerPaymentTools } from "../src/tools/customer-payment.ts";
import { registerDiscordTools } from "../src/tools/discord.ts";
import { registerPlanResources } from "../src/tools/plans.ts";

const root = join(import.meta.dir, "..");
const skillsRoot = join(root, "skills");

const expected = [
  {
    name: "apps-connect",
    direct: "Apps-mcpをセットアップして",
    indirect: "Appsのツールが表示されない",
    notFor: "決済ページを作成する",
  },
  {
    name: "apps-inspect-payments",
    direct: "この決済が成功したか確認して",
    indirect: "昨日の定期課金を調べたい",
    notFor: "月額ページを作成する",
  },
  {
    name: "apps-manage-payment-pages",
    direct: "一回払いの決済ページを作って",
    indirect: "月額プランの申込URLが欲しい",
    notFor: "取引の成功状態を調べる",
  },
  {
    name: "apps-manage-registration-pages",
    direct: "メール登録ページを作って",
    indirect: "承認制の無料申込URLが欲しい",
    notFor: "有料チェックアウトを作る",
  },
  {
    name: "apps-manage-coupons",
    direct: "20%オフのコードを作って",
    indirect: "キャンペーン割引を商品だけに適用したい",
    notFor: "商品の価格を直接変更する",
  },
  {
    name: "apps-manage-discord",
    direct: "Apps経由でDiscordロールを作って",
    indirect: "登録者に付けるロールを準備したい",
    notFor: "Appsと無関係なDiscord管理",
  },
  {
    name: "apps-handle-webhooks",
    direct: "AppsのWebhook受信を実装して",
    indirect: "決済通知を二重処理しないようにしたい",
    notFor: "決済ページを一覧表示する",
  },
] as const;

describe("goal-oriented Apps skills", () => {
  test("exports the same skill inventory used by apps_help", () => {
    expect(APPS_SKILLS.map(({ name }) => name)).toEqual(expected.map(({ name }) => name));
  });

  test("each skill is self-contained and has UI metadata", async () => {
    for (const item of expected) {
      const skillRoot = join(skillsRoot, item.name);
      const skillPath = join(skillRoot, "SKILL.md");
      const metadataPath = join(skillRoot, "agents", "openai.yaml");

      expect(existsSync(skillPath), item.name).toBe(true);
      expect(existsSync(metadataPath), item.name).toBe(true);

      const skill = await Bun.file(skillPath).text();
      const frontmatterEnd = skill.indexOf("---", 3);
      const frontmatter = skill.slice(0, frontmatterEnd);
      expect(frontmatter).toContain(`name: ${item.name}`);
      expect(frontmatter).toContain("description:");
      expect(skill).toContain("Read this skill before the first matching `apps_*` MCP call");

      const metadata = await Bun.file(metadataPath).text();
      expect(metadata).toContain(`$${item.name}`);
    }
  });

  test("documents representative activation and exclusion requests", () => {
    for (const item of expected) {
      expect(item.direct.length).toBeGreaterThan(8);
      expect(item.indirect.length).toBeGreaterThan(8);
      expect(item.notFor.length).toBeGreaterThan(8);
    }
  });

  test("removes the API-wide umbrella skill", () => {
    expect(existsSync(join(skillsRoot, "apps-api", "SKILL.md"))).toBe(false);
  });

  test("keeps current Apps API invariants in the relevant workflows", async () => {
    const payment = await Bun.file(
      join(skillsRoot, "apps-manage-payment-pages", "SKILL.md"),
    ).text();
    expect(payment).toContain("not an API sandbox");
    expect(payment).toContain("/v1/client/...");

    const identifiers = await Bun.file(
      join(skillsRoot, "apps-inspect-payments", "references", "identifiers.md"),
    ).text();
    expect(identifiers).toContain("Webhook `id`");
    expect(identifiers).toContain("`payment_id`");

    const webhooks = await Bun.file(
      join(skillsRoot, "apps-handle-webhooks", "references", "webhooks.md"),
    ).text();
    expect(webhooks).toContain("https://theapps.jp/api/webhook-config");
    expect(webhooks).toContain("https://theapps.jp/api/webhook-schema");
    expect(webhooks).toContain("300 seconds");
    expect(webhooks).toContain("exact raw request body");
  });

  test("routes every domain MCP tool to its goal-specific skill", () => {
    const descriptions = new Map<ToolName, string>();
    const server = {
      registerTool(name: ToolName, definition: { description?: string }) {
        descriptions.set(name, definition.description ?? "");
      },
    };

    registerAuthTools(server as never, {} as never, {} as never);
    registerCustomerPaymentTools(server as never, {} as never);
    registerPlanResources(server as never, {} as never, {} as never);
    registerDiscordTools(server as never, {} as never, {} as never);

    expect([...descriptions.keys()].sort()).toEqual([...TOOL_CATALOG].sort());
    expect(descriptions.get("apps_help")).toContain("bootstrap");

    for (const toolName of TOOL_CATALOG) {
      if (toolName === "apps_help") continue;
      const route = APPS_TOOL_SKILLS[toolName];
      if (route !== "current-goal") {
        expect(
          APPS_SKILLS.some((skill) => skill.name === route),
          toolName,
        ).toBe(true);
      }
      expect(descriptions.get(toolName), toolName).toContain(toolSkillHint(toolName));
    }
  });

  test("release packaging discovers all workflow skills", async () => {
    const script = await Bun.file(join(root, "scripts", "pack-skill.mjs")).text();
    expect(script).toContain('join(root, "skills")');
    expect(script).toContain("readdirSync");
    expect(script).toContain("-skill.zip");
  });
});

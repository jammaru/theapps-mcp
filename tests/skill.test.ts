import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { APPS_TOOL_SKILLS, toolSkillHint } from "../src/lib/skill-hint.ts";
import { APPS_SKILLS, APPS_SKILLS_DESKTOP_ZIP } from "../src/lib/skills.ts";
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
    writes: true,
    direct: "Apps-mcpをセットアップして",
    indirect: "Appsのツールが表示されない",
    notFor: "決済ページを作成する",
    triggers: ["セットアップ", "ツールが表示されない"],
  },
  {
    name: "apps-inspect-payments",
    writes: false,
    direct: "この決済が成功したか確認して",
    indirect: "昨日の定期課金を調べたい",
    notFor: "月額ページを作成する",
    triggers: ["決済が成功したか", "定期課金", "決済ページ"],
  },
  {
    name: "apps-manage-payment-pages",
    writes: true,
    direct: "一回払いの決済ページを作って",
    indirect: "月額プランの申込URLが欲しい",
    notFor: "取引の成功状態を調べる",
    triggers: ["決済ページ", "一回払い", "月額プラン"],
  },
  {
    name: "apps-manage-registration-pages",
    writes: true,
    direct: "メール登録ページを作って",
    indirect: "承認制の無料申込URLが欲しい",
    notFor: "有料チェックアウトを作る",
    triggers: ["登録ページ", "メール登録", "承認制"],
  },
  {
    name: "apps-manage-coupons",
    writes: true,
    direct: "20%オフのコードを作って",
    indirect: "キャンペーン割引を商品だけに適用したい",
    notFor: "商品の価格を直接変更する",
    triggers: ["coupon", "クーポン", "割引コード"],
  },
  {
    name: "apps-manage-discord",
    writes: true,
    direct: "Apps経由でDiscordロールを作って",
    indirect: "登録者に付けるロールを準備したい",
    notFor: "Appsと無関係なDiscord管理",
    triggers: ["Discordロール", "登録者に付けるロール"],
  },
  {
    name: "apps-handle-webhooks",
    writes: false,
    direct: "AppsのWebhook受信を実装して",
    indirect: "決済通知を二重処理しないようにしたい",
    notFor: "決済ページを一覧表示する",
    triggers: ["Webhook受信", "決済通知", "二重処理"],
  },
] as const;

const representativeRoutes = {
  apps_clear_token_cache: "apps-connect",
  apps_get_charge: "apps-inspect-payments",
  apps_list_product_purchasers: "apps-manage-payment-pages",
  apps_create_product: "apps-manage-payment-pages",
  apps_list_advance_plan_contractors: "apps-manage-registration-pages",
  apps_create_coupon: "apps-manage-coupons",
  apps_create_discord_role: "apps-manage-discord",
  apps_verify_webhook_signature: "apps-handle-webhooks",
} as const;

function parseDescription(frontmatter: string): string {
  const folded = frontmatter.match(/^description:\s*>-?\s*\n((?:[ \t].*\n?)*)/m);
  if (folded) {
    return folded[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ");
  }
  return frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
}

describe("goal-oriented Apps skills", () => {
  test("exports the same skill inventory used by apps_help", () => {
    expect(APPS_SKILLS.map(({ name }) => name)).toEqual(expected.map(({ name }) => name));
  });

  test("disk skill directories match the exported inventory", () => {
    const onDisk = readdirSync(skillsRoot, { withFileTypes: true })
      .filter(
        (entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")),
      )
      .map((entry) => entry.name)
      .sort();
    expect(onDisk).toEqual([...expected.map(({ name }) => name)].sort());
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

      const description = parseDescription(frontmatter);
      expect(description.length, item.name).toBeGreaterThan(0);
      expect(description.length, item.name).toBeLessThanOrEqual(1024);
      expect(description, item.name).not.toBe(">-");
      for (const trigger of item.triggers) {
        expect(description, `${item.name} description should include ${trigger}`).toContain(
          trigger,
        );
      }
      if (item.writes) {
        expect(skill, item.name).toContain("APPS_MCP_ALLOW_WRITE");
      }

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

  test("links every bundled reference from SKILL.md", async () => {
    for (const item of expected) {
      const skillRoot = join(skillsRoot, item.name);
      const skill = await Bun.file(join(skillRoot, "SKILL.md")).text();
      const linked = [...skill.matchAll(/\[[^\]]*\]\((references\/[^)]+)\)/g)].map(
        (match) => match[1],
      );
      const referencesDir = join(skillRoot, "references");
      if (!existsSync(referencesDir)) {
        expect(linked, item.name).toEqual([]);
        continue;
      }
      const files = readdirSync(referencesDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => `references/${name}`)
        .sort();
      expect([...linked].sort(), item.name).toEqual(files);
      for (const relative of linked) {
        expect(existsSync(join(skillRoot, relative)), `${item.name}:${relative}`).toBe(true);
      }
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
    expect(payment).toContain("apps_list_product_purchasers");

    const identifiers = await Bun.file(
      join(skillsRoot, "apps-inspect-payments", "references", "identifiers.md"),
    ).text();
    expect(identifiers).toContain("Webhook `id`");
    expect(identifiers).toContain("`payment_id`");
    expect(identifiers).toContain("apps-manage-payment-pages");
    expect(identifiers).not.toContain("apps_list_products");

    const discord = await Bun.file(join(skillsRoot, "apps-manage-discord", "SKILL.md")).text();
    expect(discord).toContain("apps_create_discord_role");
    expect(discord).toContain("apps_create_discord_channel");

    const webhooks = await Bun.file(
      join(skillsRoot, "apps-handle-webhooks", "references", "webhooks.md"),
    ).text();
    expect(webhooks).toContain("https://theapps.jp/api/webhook-config");
    expect(webhooks).toContain("https://theapps.jp/api/webhook-schema");
    expect(webhooks).toContain("300 seconds");
    expect(webhooks).toContain("exact raw request body");
    expect(webhooks).toContain("raw_body");
    expect(webhooks).toContain("whsec_");
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

    for (const [toolName, skillName] of Object.entries(representativeRoutes)) {
      expect(APPS_TOOL_SKILLS[toolName as keyof typeof APPS_TOOL_SKILLS], toolName).toBe(skillName);
    }
  });

  test("release packaging puts every workflow skill in one zip", () => {
    const result = spawnSync("node", [join(root, "scripts", "pack-skill.mjs")], {
      encoding: "utf8",
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);

    const zipPath = join(root, "theapps-mcp-skills.zip");
    expect(existsSync(zipPath)).toBe(true);
    expect(APPS_SKILLS_DESKTOP_ZIP).toContain("theapps-mcp-skills.zip");

    for (const { name } of expected) {
      expect(existsSync(join(root, `${name}-skill.zip`))).toBe(false);
    }

    const listing = spawnSync(
      "python3",
      [
        "-c",
        "import zipfile,sys; print('\\n'.join(zipfile.ZipFile(sys.argv[1]).namelist()))",
        zipPath,
      ],
      { encoding: "utf8" },
    );
    expect(listing.status).toBe(0);
    const files = listing.stdout.split("\n").filter(Boolean);
    expect(files).toContain("SKILL.md");
    expect(files).toContain("VERSION.md");
    const packedSkillDocs = files.filter(
      (name) => name.endsWith("/SKILL.md") || name === "SKILL.md",
    );
    expect(packedSkillDocs.sort()).toEqual(
      ["SKILL.md", ...expected.map(({ name }) => `${name}/SKILL.md`)].sort(),
    );

    const rootSkill = spawnSync(
      "python3",
      [
        "-c",
        "import zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]).decode())",
        zipPath,
        "SKILL.md",
      ],
      { encoding: "utf8" },
    );
    expect(rootSkill.stdout).toContain("APPS_MCP_ALLOW_WRITE=true");
    expect(rootSkill.stdout).not.toContain(" — >-");

    const versionText = spawnSync(
      "python3",
      [
        "-c",
        "import zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]).decode())",
        zipPath,
        "VERSION.md",
      ],
      { encoding: "utf8" },
    );
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
    expect(versionText.stdout).toContain(`theapps-mcp version: ${pkg.version}`);

    rmSync(zipPath, { force: true });
  });
});

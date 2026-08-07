import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { APPS_SKILL_HINT, APPS_SKILL_NAME } from "../src/lib/skill-hint.ts";

const skillRoot = join(import.meta.dir, "..", "skills", "apps-api");

describe("end-user apps-api skill", () => {
  test("skill package has entry and playbooks", () => {
    expect(APPS_SKILL_NAME).toBe("apps-api");
    expect(APPS_SKILL_HINT).toContain(APPS_SKILL_NAME);

    const required = [
      "SKILL.md",
      "references/safety.md",
      "references/endpoints.md",
      "references/customer-payment.md",
      "references/payment-pages.md",
      "references/waiting-list.md",
      "references/advance-plan.md",
      "references/coupon.md",
      "references/discord.md",
      "references/webhook.md",
      "recipes/write-safely.md",
      "recipes/lookup.md",
      "recipes/create-payment-page.md",
      "recipes/create-registration-page.md",
      "recipes/create-coupon.md",
      "recipes/discord.md",
      "recipes/webhook.md",
    ];

    for (const rel of required) {
      expect(existsSync(join(skillRoot, rel))).toBe(true);
    }
  });

  test("SKILL.md is end-user oriented and installable", async () => {
    const text = await Bun.file(join(skillRoot, "SKILL.md")).text();
    expect(text).toContain("name: apps-api");
    expect(text).toContain("npx skills add jammaru/theapps-mcp");
    expect(text).toContain("recipes/");
    expect(text).toContain("apps_auth_status");
    expect(text).toContain("いつ読むか");
    expect(text).toContain("apps_*");
    expect(text).toContain("apps_list_charges");
    expect(text).toContain("waiting-list.md");
    expect(text).toContain("webhook.md");
    expect(text.toLowerCase()).not.toContain("contributor");
    expect(text.toLowerCase()).not.toContain("開発者向け");
  });

  test("skill hint and description push agents to read before MCP use", async () => {
    expect(APPS_SKILL_HINT.toLowerCase()).toContain("before calling");
    expect(APPS_SKILL_HINT).toContain(APPS_SKILL_NAME);

    const text = await Bun.file(join(skillRoot, "SKILL.md")).text();
    const frontmatter = text.slice(0, text.indexOf("---", 3));
    expect(frontmatter).toContain("apps_*");
    expect(frontmatter).toMatch(/必ずこのスキルを最初に読む|read the apps-api skill/i);
  });

  test("skill is not published in the npm package files", async () => {
    const pkg = JSON.parse(await Bun.file(join(import.meta.dir, "..", "package.json")).text()) as {
      files: string[];
    };
    expect(pkg.files).not.toContain("skills/");
    expect(existsSync(join(skillRoot, "SKILL.md"))).toBe(true);
    expect(existsSync(join(import.meta.dir, "..", "scripts", "pack-skill.mjs"))).toBe(true);
  });

  test("waiting-list and webhook references cover Aug 2026 rules", async () => {
    const waiting = await Bun.file(join(skillRoot, "references/waiting-list.md")).text();
    expect(waiting).toContain("type");
    expect(waiting).toContain("interval");
    expect(waiting).toContain("オブジェクト自体を送らない");

    const webhook = await Bun.file(join(skillRoot, "references/webhook.md")).text();
    expect(webhook).toContain("HMAC-SHA256");
    expect(webhook).toContain("Apps-Webhook-Id");
    expect(webhook).toContain("apps_verify_webhook_signature");
    expect(webhook).toContain("application");
    expect(webhook).toContain("canceled");
  });
});

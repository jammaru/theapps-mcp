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
      "references/advance-plan.md",
      "references/coupon.md",
      "references/discord.md",
      "recipes/write-safely.md",
      "recipes/lookup.md",
      "recipes/create-payment-page.md",
      "recipes/create-registration-page.md",
      "recipes/create-coupon.md",
      "recipes/discord.md",
    ];

    for (const rel of required) {
      expect(existsSync(join(skillRoot, rel))).toBe(true);
    }
  });

  test("SKILL.md is end-user oriented and installable", async () => {
    const text = await Bun.file(join(skillRoot, "SKILL.md")).text();
    expect(text).toContain("name: apps-api");
    expect(text).toContain("npx skills add jammaru/apps-mcp");
    expect(text).toContain("recipes/");
    expect(text).toContain("apps_auth_status");
    expect(text.toLowerCase()).not.toContain("contributor");
    expect(text.toLowerCase()).not.toContain("開発者向け");
  });
});

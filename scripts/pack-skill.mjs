#!/usr/bin/env node
/** Pack every goal-oriented skill into one Claude Desktop zip. */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL_PACK_ZIP = "theapps-mcp-skills.zip";

const SKILL_ORDER = [
  "apps-connect",
  "apps-inspect-payments",
  "apps-manage-payment-pages",
  "apps-manage-registration-pages",
  "apps-manage-coupons",
  "apps-manage-discord",
  "apps-handle-webhooks",
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const skillsRoot = join(root, "skills");
const discovered = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")))
  .map((entry) => entry.name);
const skillNames = [
  ...SKILL_ORDER.filter((name) => discovered.includes(name)),
  ...discovered.filter((name) => !SKILL_ORDER.includes(name)).sort(),
];

if (skillNames.length === 0) {
  console.error("No skills/*/SKILL.md files found");
  process.exit(1);
}

function skillSummary(skillName) {
  const text = readFileSync(join(skillsRoot, skillName, "SKILL.md"), "utf8");
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) {
    throw new Error(`Missing YAML frontmatter in skills/${skillName}/SKILL.md`);
  }
  const name = block[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = block[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description) {
    throw new Error(`skills/${skillName}/SKILL.md must declare name and description`);
  }
  return { name, description };
}

const summaries = skillNames.map(skillSummary);

function packSkillMarkdown(skills) {
  const rows = skills
    .map(
      (skill) =>
        `- **${skill.name}** — ${skill.description}\n  Read \`${skill.name}/SKILL.md\` and its linked references.`,
    )
    .join("\n");

  return `---
name: apps-mcp
description: Use for any Apps (theapps.jp) task with Apps-mcp: connect and verify auth, inspect customers or payments, manage payment or registration pages, coupons, Discord roles and channels, or Webhook receivers. This pack contains every workflow skill; read the nested skill that matches the user's goal before the first domain apps_* call.
---

# Apps-mcp skills

This zip is the full Apps-mcp skill pack. Upload it once in Claude Desktop. Coding agents can still install individual skills from GitHub with \`npx skills add jammaru/theapps-mcp\`.

## Before the first matching \`apps_*\` call

Read only the nested skill that matches the user's goal:

${rows}

If the request is only setup or missing tools, start with \`apps-connect/SKILL.md\`. After the connection works, switch to the skill for the next goal. Do not load every nested skill for one task.

## Safety

- Apps API has no separate sandbox. Test-mode payment settings still write to the connected account.
- Writes need \`APPS_MCP_ALLOW_WRITE=true\` and \`confirm: true\`. Preview with \`dry_run: true\` first.
- Never paste app ID, app secret, or access tokens into chat.
`;
}

for (const skillName of discovered) {
  rmSync(join(root, `${skillName}-skill.zip`), { force: true });
}
rmSync(join(root, "apps-api-skill.zip"), { force: true });

const outZip = join(root, SKILL_PACK_ZIP);
rmSync(outZip, { force: true });

const staging = mkdtempSync(join(tmpdir(), "theapps-mcp-skills-"));

try {
  writeFileSync(join(staging, "SKILL.md"), packSkillMarkdown(summaries), "utf8");
  writeFileSync(join(staging, "VERSION.md"), `theapps-mcp version: ${version}\n`, "utf8");

  for (const skillName of skillNames) {
    cpSync(join(skillsRoot, skillName), join(staging, skillName), { recursive: true });
  }

  const zip = spawnSync("zip", ["-r", outZip, "."], {
    cwd: staging,
    stdio: "inherit",
  });

  if (zip.status !== 0) {
    console.error("zip failed — is the zip CLI installed?");
    process.exit(zip.status ?? 1);
  }
} finally {
  rmSync(staging, { recursive: true, force: true });
}

console.log(`Packed ${outZip} (v${version}, ${skillNames.length} skills)`);

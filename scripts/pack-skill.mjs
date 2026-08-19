#!/usr/bin/env node
/** Pack every goal-oriented skill into its own release zip. */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const skillsRoot = join(root, "skills");
const skillNames = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")))
  .map((entry) => entry.name)
  .sort();

if (skillNames.length === 0) {
  console.error("No skills/*/SKILL.md files found");
  process.exit(1);
}

for (const skillName of skillNames) {
  const skillDir = join(skillsRoot, skillName);
  const outZip = join(root, `${skillName}-skill.zip`);
  const versionFile = join(skillDir, "VERSION.md");

  rmSync(outZip, { force: true });
  writeFileSync(versionFile, `theapps-mcp version: ${version}\n`, "utf8");

  const zip = spawnSync("zip", ["-r", outZip, "."], {
    cwd: skillDir,
    stdio: "inherit",
  });

  rmSync(versionFile, { force: true });

  if (zip.status !== 0) {
    console.error(`zip failed for ${skillName} — is the zip CLI installed?`);
    process.exit(zip.status ?? 1);
  }

  console.log(`Packed ${outZip} (v${version})`);
}

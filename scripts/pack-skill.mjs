#!/usr/bin/env node
/**
 * Pack skills/apps-api into apps-api-skill.zip for GitHub Releases
 * (Claude Desktop skill upload). Coding agents use `npx skills add` from GitHub.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = join(root, "skills", "apps-api");
const outZip = join(root, "apps-api-skill.zip");
const versionFile = join(skillDir, "VERSION.md");

if (!existsSync(join(skillDir, "SKILL.md"))) {
  console.error("Missing skills/apps-api/SKILL.md");
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

rmSync(outZip, { force: true });
writeFileSync(versionFile, `theapps-mcp version: ${version}\n`, "utf8");

const zip = spawnSync("zip", ["-r", outZip, "."], {
  cwd: skillDir,
  stdio: "inherit",
});

rmSync(versionFile, { force: true });

if (zip.status !== 0) {
  console.error("zip failed — is the `zip` CLI installed?");
  process.exit(zip.status ?? 1);
}

console.log(`Packed ${outZip} (v${version})`);

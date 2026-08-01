#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Build for local install / publish. End users get a prebuilt bin from the npm package.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const binPath = join(root, "bin", "theapps-mcp.js");

function bunAvailable() {
  const result = spawnSync("bun", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return result.status === 0;
}

if (bunAvailable()) {
  const result = spawnSync("bun", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

if (existsSync(binPath)) {
  console.error("prepare: bun not available; reusing existing bin/theapps-mcp.js");
  process.exit(0);
}

console.error(`prepare: cannot build Apps-mcp (Bun required for developers / publish).

End users should install from npm (Node only):
  npx -y theapps-mcp configure

Developers: install Bun (https://bun.sh) then re-run install / bun run build.
`);
process.exit(1);

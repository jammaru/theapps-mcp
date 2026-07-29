import { chmodSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = join(root, "bin");

mkdirSync(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, "src", "index.ts")],
  outdir,
  target: "node",
  format: "esm",
  sourcemap: "none",
  minify: false,
  naming: "apps-mcp.js",
  banner: "#!/usr/bin/env node",
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

try {
  chmodSync(join(outdir, "apps-mcp.js"), 0o755);
} catch {
  // Windows may ignore chmod; fine for npm bin
}

console.error(`built ${join(outdir, "apps-mcp.js")}`);

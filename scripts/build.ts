import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = join(root, "bin");
const outfile = join(outdir, "apps-mcp.js");

mkdirSync(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, "src", "index.ts")],
  outdir,
  target: "node",
  format: "esm",
  sourcemap: "none",
  minify: false,
  naming: "apps-mcp.js",
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

const shebang = "#!/usr/bin/env node\n";
let code = readFileSync(outfile, "utf8");
// Bun may preserve an entry shebang; keep exactly one at byte 0 for Node ESM.
code = code.replace(/^(?:#!.*\r?\n)+/, "");
writeFileSync(outfile, shebang + code, "utf8");

try {
  chmodSync(outfile, 0o755);
} catch {
  // Windows may ignore chmod; fine for npm bin
}

console.error(`built ${outfile}`);

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, '..', 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFFFFF"/>
  <rect x="72" y="72" width="120" height="120" rx="28" fill="#FFFFFF"/>
  <text x="88" y="148" font-family="Outfit, Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="-0.04em" fill="#111827">A</text>
  <text x="118" y="148" font-family="Outfit, Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="-0.04em" fill="#111827">mcp</text>
  <text x="72" y="290" font-family="Outfit, IBM Plex Sans JP, Arial, sans-serif" font-size="86" font-weight="700" letter-spacing="-0.045em" fill="#111827">Apps-mcp</text>
  <text x="72" y="360" font-family="IBM Plex Sans JP, Arial, sans-serif" font-size="30" font-weight="500" fill="#6B7280">Unofficial MCP toolkit for Apps API</text>
  <rect x="72" y="430" width="640" height="78" rx="39" fill="#F3F4F6"/>
  <circle cx="111" cy="469" r="24" fill="#FFFFFF" stroke="#E5E7EB"/>
  <text x="152" y="479" font-family="IBM Plex Mono, Consolas, monospace" font-size="24" fill="#4B5563">npx -y theapps-mcp configure</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(path.join(publicDir, 'og.png'));
writeFileSync(path.join(publicDir, 'og.svg'), svg);
console.log('generated og.png / og.svg');

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, '..', 'public');
const logoPath = path.join(publicDir, 'logo-mark.png');

/** Logical layout size */
const width = 1200;
const height = 630;
/** Export scale — 2× keeps the mark and type crisp on retina */
const scale = 2;
const logoSize = 136;
const logoX = 80;
const logoY = 72;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="orbA" cx="90%" cy="8%" r="34%">
      <stop offset="0%" stop-color="#F3F4F6" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#111827" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  <rect width="${width}" height="${height}" fill="url(#orbA)"/>

  <text x="80" y="302" font-family="Outfit, Arial, sans-serif" font-size="84" font-weight="700" letter-spacing="-0.05em" fill="#111827">Apps-mcp</text>
  <text x="80" y="368" font-family="Noto Sans JP, IBM Plex Sans JP, Arial, sans-serif" font-size="28" font-weight="500" fill="#6B7280">Unofficial MCP toolkit for Apps API</text>

  <g filter="url(#soft)">
    <rect x="80" y="436" width="620" height="84" rx="42" fill="#F9FAFB" stroke="#E5E7EB"/>
  </g>
  <circle cx="122" cy="478" r="22" fill="#FFFFFF" stroke="#E5E7EB"/>
  <text x="115" y="486" font-family="IBM Plex Mono, Consolas, monospace" font-size="22" font-weight="600" fill="#111827">$</text>
  <text x="160" y="487" font-family="IBM Plex Mono, Consolas, monospace" font-size="24" fill="#374151">npx -y theapps-mcp configure</text>
</svg>`;

/* density 144 → 2× raster (2400×1260). Logo is composited AFTER so it is not re-encoded by the SVG renderer. */
const base = await sharp(Buffer.from(svg), { density: 72 * scale })
	.png({ compressionLevel: 1, effort: 10 })
	.toBuffer();

const logoBuf = await sharp(logoPath)
	.resize(logoSize * scale, logoSize * scale, {
		kernel: sharp.kernel.lanczos3,
		fit: 'fill',
	})
	.png({ compressionLevel: 1, effort: 10 })
	.toBuffer();

const ogOut = await sharp(base)
	.composite([
		{
			input: logoBuf,
			left: logoX * scale,
			top: logoY * scale,
		},
	])
	.png({ compressionLevel: 1, effort: 10 })
	.toBuffer();

await sharp(ogOut).toFile(path.join(publicDir, 'og@2x.png'));
/* Keep og.png as the same hi-res asset for any hard-coded /og.png links */
await sharp(ogOut).toFile(path.join(publicDir, 'og.png'));

/* Preview SVG: embed the same hi-res mark so opening og.svg stays sharp */
const logoEmbed = await sharp(logoPath)
	.resize(logoSize * 4, logoSize * 4, { kernel: sharp.kernel.lanczos3 })
	.png({ compressionLevel: 1 })
	.toBuffer();

const svgWithLogo = svg.replace(
	'<rect width="1200" height="630" fill="url(#orbA)"/>',
	`<rect width="1200" height="630" fill="url(#orbA)"/>
  <image href="data:image/png;base64,${logoEmbed.toString('base64')}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`,
);
writeFileSync(path.join(publicDir, 'og.svg'), svgWithLogo);

const meta = await sharp(ogOut).metadata();
console.log(`generated og@2x.png / og.png ${meta.width}×${meta.height} (${ogOut.byteLength} bytes)`);

for (const [name, size] of [
	['favicon-32.png', 32],
	['favicon.png', 48],
	['apple-touch-icon.png', 180],
	['logo-mark-512.png', 512],
]) {
	await sharp(logoPath)
		.resize(size, size, { kernel: sharp.kernel.lanczos3 })
		.png({ compressionLevel: 1, effort: 10 })
		.toFile(path.join(publicDir, name));
}
console.log('refreshed favicon derivatives');

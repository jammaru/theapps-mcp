import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import glyphData from '../src/lib/font-glyphs.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, 'node_modules/.cache/font-src');
const outDir = path.join(root, 'src/assets/fonts');
const glyphs = glyphData.glyphs;

const sources = [
	{
		id: 'noto-sans-jp',
		url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP[wght].ttf',
		file: 'NotoSansJP-wght.ttf',
		out: 'noto-sans-jp.woff2',
	},
	{
		id: 'zen-kaku-700',
		url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf',
		file: 'ZenKakuGothicNew-Bold.ttf',
		out: 'zen-kaku-gothic-new-700.woff2',
	},
];

async function download(url, dest) {
	try {
		const info = await stat(dest);
		if (info.size > 1000) return;
	} catch {}
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
	await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

await mkdir(cacheDir, { recursive: true });
await mkdir(outDir, { recursive: true });

for (const source of sources) {
	const srcPath = path.join(cacheDir, source.file);
	const destPath = path.join(outDir, source.out);
	console.log(`subset ${source.id}…`);
	await download(source.url, srcPath);
	const input = await readFile(srcPath);
	const output = await subsetFont(input, glyphs, { targetFormat: 'woff2' });
	await writeFile(destPath, output);
	console.log(`  ${source.out} ${(output.byteLength / 1024).toFixed(1)} KB`);
}

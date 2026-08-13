import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src/lib/font-glyphs.json');
const scanDirs = [path.join(root, 'src')];
const translationFiles = [
	path.join(root, 'node_modules/@astrojs/starlight/translations/en.json'),
	path.join(root, 'node_modules/@astrojs/starlight/translations/ja.json'),
];

const latin = Array.from({ length: 126 - 32 + 1 }, (_, i) => String.fromCharCode(32 + i)).join('');
const extras = '©—–…·‘’“”„⌘・、。「」『』（）【】〔〕〜ー？！：；＋＝＜＞％＆＊＃＠☆★→←↑↓';

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(full)));
		else if (
			/\.(astro|md|mdx|ts|tsx|json)$/.test(entry.name) &&
			!entry.name.endsWith('.test.ts') &&
			!full.endsWith('font-glyphs.json')
		) {
			files.push(full);
		}
	}
	return files;
}

const files = (await Promise.all(scanDirs.map((dir) => walk(dir)))).flat();
files.push(...translationFiles);

const set = new Set([...latin, ...extras]);
for (const file of files) {
	const text = await readFile(file, 'utf8');
	for (const ch of text) {
		const code = ch.codePointAt(0) ?? 0;
		if (code >= 32) set.add(ch);
	}
}

const glyphs = [...set].sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0)).join('');
await writeFile(out, `${JSON.stringify({ glyphs, count: glyphs.length })}\n`);
console.log(`wrote ${glyphs.length} unique glyphs to ${path.relative(root, out)}`);

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(root, '..');
const outDir = path.resolve(websiteRoot, '.lighthouse', process.argv[2] || 'run');
const port = Number(process.env.LH_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const urls = (process.env.LH_URLS || '/,/docs/getting-started/,/en/').split(',').filter(Boolean);
const runs = Number(process.env.LH_RUNS || 3);
const chromePath =
	process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(outDir, { recursive: true });

function waitForServer(url, timeoutMs = 60000) {
	const start = Date.now();
	return new Promise((resolve, reject) => {
		const tick = async () => {
			try {
				const res = await fetch(url, { redirect: 'manual' });
				if (res.status < 500) {
					resolve();
					return;
				}
			} catch {}
			if (Date.now() - start > timeoutMs) {
				reject(new Error(`Server did not start at ${url}`));
				return;
			}
			setTimeout(tick, 300);
		};
		tick();
	});
}

function run(cmd, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, {
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: process.platform === 'win32',
			...opts,
		});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (d) => {
			stdout += d.toString();
		});
		child.stderr.on('data', (d) => {
			stderr += d.toString();
		});
		child.on('close', (code) => {
			if (code === 0) resolve({ stdout, stderr });
			else reject(new Error(`${cmd} ${args.join(' ')} failed (${code})\n${stderr}\n${stdout}`));
		});
	});
}

const astroBin = path.join(
	websiteRoot,
	'node_modules',
	'.bin',
	process.platform === 'win32' ? 'astro.cmd' : 'astro',
);
const preview = spawn(
	astroBin,
	['preview', '--force', '--host', '127.0.0.1', '--port', String(port)],
	{
		cwd: websiteRoot,
		stdio: ['ignore', 'pipe', 'pipe'],
		shell: process.platform === 'win32',
		env: { ...process.env },
	},
);

preview.stdout.on('data', (d) => process.stdout.write(d));
preview.stderr.on('data', (d) => process.stderr.write(d));

const shutdown = () => {
	if (!preview.pid) return;
	if (process.platform === 'win32') {
		spawn('taskkill', ['/PID', String(preview.pid), '/T', '/F'], { stdio: 'ignore' });
		return;
	}
	preview.kill();
};
process.on('exit', shutdown);
process.on('SIGINT', () => {
	shutdown();
	process.exit(1);
});

try {
	await waitForServer(baseUrl);
	const summaries = [];

	for (const urlPath of urls) {
		const target = `${baseUrl}${urlPath}`;
		const pathSlug = urlPath === '/' ? 'home' : urlPath.replace(/^\/|\/$/g, '').replaceAll('/', '-');
		const runSummaries = [];

		for (let i = 1; i <= runs; i++) {
			const jsonPath = path.join(outDir, `${pathSlug}-${i}.json`);
			console.log(`\nLighthouse ${pathSlug} run ${i}/${runs}: ${target}`);
			await run('npx', [
				'lighthouse',
				target,
				'--quiet',
				'--only-categories=performance,accessibility,best-practices,seo',
				'--form-factor=mobile',
				'--screenEmulation.mobile',
				'--throttling-method=simulate',
				'--output=json',
				`--output-path=${jsonPath}`,
				`--chrome-flags=--headless --no-sandbox --disable-gpu`,
				`--chrome-path=${chromePath}`,
			]);

			const report = JSON.parse(await (await import('node:fs/promises')).readFile(jsonPath, 'utf8'));
			const cats = report.categories;
			const a = report.audits;
			const summary = {
				url: target,
				run: i,
				performance: cats.performance?.score,
				accessibility: cats.accessibility?.score,
				bestPractices: cats['best-practices']?.score,
				seo: cats.seo?.score,
				fcp: a['first-contentful-paint']?.numericValue,
				lcp: a['largest-contentful-paint']?.numericValue,
				si: a['speed-index']?.numericValue,
				tbt: a['total-blocking-time']?.numericValue,
				cls: a['cumulative-layout-shift']?.numericValue,
				tti: a['interactive']?.numericValue,
				inp: a['interaction-to-next-paint']?.numericValue ?? a['experimental-interaction-to-next-paint']?.numericValue,
				jsExecution: a['bootup-time']?.numericValue,
				mainThread: a['mainthread-work-breakdown']?.numericValue,
				totalByteWeight: a['total-byte-weight']?.numericValue,
				lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.snippet
					?? a['largest-contentful-paint-element']?.displayValue,
				opportunities: Object.values(a)
					.filter((x) => x?.details?.type === 'opportunity' && x.score !== null && x.score < 1)
					.map((x) => ({
						id: x.id,
						title: x.title,
						savingsMs: x.metricSavings?.LCP || x.numericValue,
						display: x.displayValue,
					})),
				diagnostics: [
					'render-blocking-resources',
					'unused-javascript',
					'unused-css-rules',
					'unminified-javascript',
					'unminified-css',
					'uses-text-compression',
					'uses-rel-preconnect',
					'font-display',
					'third-party-summary',
					'dom-size',
					'long-tasks',
					'network-dependency-tree',
					'lcp-lazy-loaded',
					'prioritize-lcp-image',
				]
					.map((id) => {
						const x = a[id];
						if (!x) return null;
						return { id, title: x.title, score: x.score, display: x.displayValue, description: x.description?.slice(0, 180) };
					})
					.filter(Boolean),
			};
			runSummaries.push(summary);
			console.log(
				JSON.stringify(
					{
						performance: summary.performance,
						fcp: Math.round(summary.fcp),
						lcp: Math.round(summary.lcp),
						si: Math.round(summary.si),
						tbt: Math.round(summary.tbt),
						cls: summary.cls,
						bytes: summary.totalByteWeight,
						lcpElement: summary.lcpElement,
					},
					null,
					2,
				),
			);
		}

		const avg = (key) => runSummaries.reduce((s, r) => s + (r[key] || 0), 0) / runSummaries.length;
		summaries.push({
			url: target,
			runs: runSummaries,
			average: {
				performance: avg('performance'),
				accessibility: avg('accessibility'),
				bestPractices: avg('bestPractices'),
				seo: avg('seo'),
				fcp: avg('fcp'),
				lcp: avg('lcp'),
				si: avg('si'),
				tbt: avg('tbt'),
				cls: avg('cls'),
				jsExecution: avg('jsExecution'),
				mainThread: avg('mainThread'),
				totalByteWeight: avg('totalByteWeight'),
			},
			lcpElement: runSummaries[0]?.lcpElement,
			opportunities: runSummaries[0]?.opportunities,
			diagnostics: runSummaries[0]?.diagnostics,
		});
	}

	const reportPath = path.join(outDir, 'summary.json');
	await writeFile(reportPath, JSON.stringify(summaries, null, 2));
	console.log(`\nWrote ${reportPath}`);
} finally {
	shutdown();
}

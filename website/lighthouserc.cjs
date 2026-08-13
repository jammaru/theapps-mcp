module.exports = {
	ci: {
		collect: {
			numberOfRuns: 3,
			startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4173 --force',
			startServerReadyPattern: '127.0.0.1|localhost',
			url: [
				'http://127.0.0.1:4173/',
				'http://127.0.0.1:4173/docs/getting-started/',
				'http://127.0.0.1:4173/en/',
			],
			settings: {
				formFactor: 'mobile',
				throttlingMethod: 'simulate',
				screenEmulation: {
					mobile: true,
					width: 412,
					height: 823,
					deviceScaleFactor: 1.75,
					disabled: false,
				},
				onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
				chromeFlags: '--no-sandbox --disable-dev-shm-usage',
			},
		},
		assert: {
			assertions: {
				'categories:performance': ['error', { minScore: 0.85 }],
				'categories:accessibility': ['error', { minScore: 0.9 }],
				'categories:best-practices': ['error', { minScore: 0.9 }],
				'categories:seo': ['error', { minScore: 0.9 }],
				'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
				'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
				'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
			},
		},
		upload: {
			target: 'filesystem',
			outputDir: './.lighthouseci',
		},
	},
};

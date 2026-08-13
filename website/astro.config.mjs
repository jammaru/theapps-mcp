// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL || 'https://theapps-mcp.pages.dev';

const sidebar = [
	{
		label: 'Guide',
		translations: { en: 'Guide', ja: 'ガイド' },
		items: [
			{ label: 'Getting Started', translations: { ja: 'はじめに' }, slug: 'docs/getting-started' },
			{ label: 'Installation', translations: { ja: 'インストール' }, slug: 'docs/installation' },
		],
	},
	{
		label: 'Usage',
		translations: { en: 'Usage', ja: '使い方' },
		items: [
			{ label: 'Usage', translations: { ja: '使い方' }, slug: 'docs/usage' },
			{ label: 'Tools', translations: { ja: 'ツール' }, slug: 'docs/tools' },
			{ label: 'Configuration', translations: { ja: '設定' }, slug: 'docs/configuration' },
		],
	},
	{
		label: 'Safety & FAQ',
		translations: { en: 'Safety & FAQ', ja: '安全と FAQ' },
		items: [
			{ label: 'Safety Guide', translations: { ja: '安全ガイド' }, slug: 'docs/safety' },
			{ label: 'FAQ', translations: { ja: 'FAQ' }, slug: 'docs/faq' },
		],
	},
];

export default defineConfig({
	site,
	devToolbar: { enabled: false },
	integrations: [
		starlight({
			title: 'Apps-mcp',
			description:
				'Unofficial MCP server and Agent Skills for Apps API (theapps.jp). Use it from Cursor, Claude Code, Codex, and similar agents.',
			favicon: '/favicon.svg',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				alt: '',
				replacesTitle: true,
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/jammaru/theapps-mcp',
				},
				{
					icon: 'npm',
					label: 'npm',
					href: 'https://www.npmjs.com/package/theapps-mcp',
				},
				{
					icon: 'x.com',
					label: 'X',
					href: 'https://x.com/jammaru_lab',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/jammaru/theapps-mcp/edit/main/website/',
			},
			customCss: ['./src/styles/global.css'],
			defaultLocale: 'root',
			locales: {
				root: { label: '日本語', lang: 'ja' },
				en: { label: 'English', lang: 'en' },
			},
			pagefind: true,
			lastUpdated: false,
			pagination: true,
			sidebar,
			head: [
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: `${site}/og.png` },
				},
				{
					tag: 'meta',
					attrs: { property: 'og:image:width', content: '2400' },
				},
				{
					tag: 'meta',
					attrs: { property: 'og:image:height', content: '1260' },
				},
				{
					tag: 'meta',
					attrs: { property: 'og:image:type', content: 'image/png' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:card', content: 'summary_large_image' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:image', content: `${site}/og.png` },
				},
				{
					tag: 'link',
					attrs: { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon.png' },
				},
				{
					tag: 'link',
					attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
				},
			],
			components: {
				Head: './src/components/overrides/Head.astro',
				Header: './src/components/overrides/Header.astro',
				Hero: './src/components/overrides/Hero.astro',
				Search: './src/components/overrides/Search.astro',
				SiteTitle: './src/components/overrides/SiteTitle.astro',
				ThemeSelect: './src/components/overrides/ThemeSelect.astro',
				LanguageSelect: './src/components/overrides/LanguageSelect.astro',
			},
		}),
		sitemap(),
	],
	// Inline only the small Starlight ui.css. Do not use 'always' — that
	// inlined common.css too and ballooned HTML to ~129 KB (PSI 84).
	build: {
		inlineStylesheets: 'auto',
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			assetsInlineLimit: 14 * 1024,
		},
	},
	fonts: [
		{
			name: 'Outfit',
			cssVariable: '--font-outfit',
			provider: fontProviders.google(),
			weights: [700],
			styles: ['normal'],
			subsets: ['latin'],
			formats: ['woff2'],
			fallbacks: ['sans-serif'],
			display: 'swap',
		},
		{
			name: 'IBM Plex Mono',
			cssVariable: '--font-ibm-plex-mono',
			provider: fontProviders.google(),
			weights: [400, 600],
			styles: ['normal'],
			subsets: ['latin'],
			formats: ['woff2'],
			fallbacks: ['monospace'],
			display: 'swap',
		},
		{
			name: 'Noto Sans JP',
			cssVariable: '--font-noto-sans-jp',
			provider: fontProviders.local(),
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/noto-sans-jp.woff2'],
						weight: '100 900',
						style: 'normal',
					},
				],
			},
			fallbacks: ['sans-serif'],
			display: 'swap',
		},
		{
			name: 'Zen Kaku Gothic New',
			cssVariable: '--font-zen-kaku',
			provider: fontProviders.local(),
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/zen-kaku-gothic-new-700.woff2'],
						weight: 700,
						style: 'normal',
					},
				],
			},
			fallbacks: ['sans-serif'],
			display: 'swap',
		},
	],
});

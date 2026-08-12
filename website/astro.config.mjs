// @ts-check
import { defineConfig } from 'astro/config';
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
				'Unofficial MCP server and Agent Skills for Apps API (theapps.jp).',
			favicon: '/favicon.svg',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				alt: 'Apps-mcp',
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
					attrs: { property: 'og:image', content: `${site}/og@2x.png` },
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
					attrs: { name: 'twitter:image', content: `${site}/og@2x.png` },
				},
				{
					tag: 'link',
					attrs: { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon.png' },
				},
				{
					tag: 'link',
					attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.googleapis.com',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.gstatic.com',
						crossorigin: true,
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Noto+Sans+JP:wght@400;500;700&family=Outfit:wght@600;700&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap',
					},
				},
			],
			components: {
				Header: './src/components/overrides/Header.astro',
				Hero: './src/components/overrides/Hero.astro',
				SiteTitle: './src/components/overrides/SiteTitle.astro',
				ThemeSelect: './src/components/overrides/ThemeSelect.astro',
				LanguageSelect: './src/components/overrides/LanguageSelect.astro',
			},
		}),
		sitemap(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});

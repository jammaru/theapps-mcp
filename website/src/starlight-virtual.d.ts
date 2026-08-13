declare module 'virtual:starlight/project-context' {
	const project: {
		trailingSlash: 'always' | 'never' | 'ignore';
	};
	export default project;
}

declare module 'virtual:starlight/pagefind-config' {
	export const pagefindUserConfig: Record<string, unknown>;
}

declare module 'virtual:starlight/user-config' {
	const config: {
		pagefind: boolean;
		isMultilingual: boolean;
		locales?: Record<string, { label: string } | undefined>;
		components: Record<string, string>;
	};
	export default config;
}

declare module 'virtual:starlight/components/LanguageSelect' {
	const Component: any;
	export default Component;
}

declare module 'virtual:starlight/components/Search' {
	const Component: any;
	export default Component;
}

declare module 'virtual:starlight/components/SiteTitle' {
	const Component: any;
	export default Component;
}

declare module 'virtual:starlight/components/SocialIcons' {
	const Component: any;
	export default Component;
}

declare module 'virtual:starlight/components/ThemeSelect' {
	const Component: any;
	export default Component;
}

declare var StarlightThemeProvider: {
	updatePickers: (theme?: string) => void;
};

interface Window {
	StarlightThemeProvider: typeof StarlightThemeProvider;
	gtag?: (...args: unknown[]) => void;
	dataLayer?: unknown[];
}

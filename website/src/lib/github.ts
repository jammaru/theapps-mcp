export type GithubMeta = {
	stars: number | null;
};

export async function getGithubMeta(): Promise<GithubMeta> {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 3500);
		const repoRes = await fetch('https://api.github.com/repos/jammaru/theapps-mcp', {
			headers: { Accept: 'application/vnd.github+json' },
			signal: controller.signal,
		});
		clearTimeout(timer);
		const repo = repoRes.ok ? await repoRes.json() : null;
		return {
			stars: typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : null,
		};
	} catch {
		return { stars: null };
	}
}

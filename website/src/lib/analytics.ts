const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;

/** Returns a Measurement ID only when the value is a well-formed GA4 id. */
export function resolveGoogleAnalyticsId(raw: unknown): string | null {
	if (typeof raw !== 'string') return null;
	const id = raw.trim();
	return GA_ID_PATTERN.test(id) ? id : null;
}

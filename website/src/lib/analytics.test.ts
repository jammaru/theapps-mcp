import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveGoogleAnalyticsId } from './analytics.ts';

test('empty and missing values disable analytics', () => {
	assert.equal(resolveGoogleAnalyticsId(undefined), null);
	assert.equal(resolveGoogleAnalyticsId(''), null);
	assert.equal(resolveGoogleAnalyticsId('   '), null);
});

test('rejects non-GA4 ids so forks cannot silently send to a bogus property', () => {
	assert.equal(resolveGoogleAnalyticsId('UA-123'), null);
	assert.equal(resolveGoogleAnalyticsId('G-'), null);
	assert.equal(resolveGoogleAnalyticsId('G-abc'), null);
	assert.equal(resolveGoogleAnalyticsId('G-W9LNKP0T5Y extra'), null);
});

test('accepts a valid GA4 Measurement ID', () => {
	assert.equal(resolveGoogleAnalyticsId('G-W9LNKP0T5Y'), 'G-W9LNKP0T5Y');
	assert.equal(resolveGoogleAnalyticsId('  G-W9LNKP0T5Y  '), 'G-W9LNKP0T5Y');
});

test('rejects ids that could break out of an inline script', () => {
	assert.equal(resolveGoogleAnalyticsId('G-W9LNKP0T5Y";alert(1)//'), null);
	assert.equal(resolveGoogleAnalyticsId("G-ABC</script>"), null);
});

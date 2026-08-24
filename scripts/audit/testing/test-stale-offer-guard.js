/**
 * Tests for the stale-offer guard.
 *
 * `today` is injected rather than read from the clock, so these stay
 * deterministic -- a guard about expiry dates that itself expires would be a
 * poor joke.
 */

const { test } = require('node:test');
const assert = require('node:assert');

const { findStaleOffers } = require('../stale-offer-guard.js');

const AUG_18 = new Date(2026, 7, 18);

test('flags an offer tag whose date has passed', () => {
  const out = findStaleOffers('offer: "summer-special-2026-jul31"', 'x.js', AUG_18);
  assert.strictEqual(out.length, 1);
  assert.match(out[0], /2026-07-31, which has passed/);
});

test('flags visitor-facing wording whose date has passed', () => {
  const src = 'limitedTimeText.textContent = "through July 31 at midnight"; // 2026';
  const out = findStaleOffers(src, 'x.js', AUG_18);
  assert.strictEqual(out.length, 1);
  assert.match(out[0], /through July 31/);
});

test('passes an offer that has not ended yet', () => {
  const src = 'offer: "fall-special-2026-sep30"\n"through September 30 at midnight" 2026';
  assert.deepStrictEqual(findStaleOffers(src, 'x.js', AUG_18), []);
});

test('an offer ending today is not expired', () => {
  const out = findStaleOffers('offer: "x-2026-aug18"', 'x.js', AUG_18);
  assert.deepStrictEqual(out, []);
});

test('reports one finding per distinct problem, not per occurrence', () => {
  // The real #7966 says "through July 31" in the header, the JSDoc and the code.
  const src = [
    '/* through July 31 at midnight */',
    ' * Offer: ... through July 31, 2026 (midnight Pacific).',
    'limitedTimeText.textContent = "through July 31 at midnight";',
  ].join('\n');
  const out = findStaleOffers(src, 'x.js', AUG_18);
  assert.strictEqual(out.length, 1, 'three occurrences of one stale date = one finding');
});

test('ignores an offer tag with no date in it', () => {
  assert.deepStrictEqual(findStaleOffers('offer: "evergreen-referral"', 'x.js', AUG_18), []);
});

test('ignores unrelated "through" prose', () => {
  assert.deepStrictEqual(
    findStaleOffers('// walk through Thrive settings', 'x.js', AUG_18),
    []
  );
});

test('respects an explicit year rather than assuming the current one', () => {
  // December 2025 has passed as of August 2026; December 2026 has not.
  assert.strictEqual(findStaleOffers('offer: "winter-2025-dec24"', 'x.js', AUG_18).length, 1);
  assert.deepStrictEqual(findStaleOffers('offer: "winter-2026-dec24"', 'x.js', AUG_18), []);
});

test('catches the real #7966 payload tag', () => {
  const src = '                offer: "summer-special-2026-jul31"';
  const out = findStaleOffers(src, '7966.js', AUG_18);
  assert.strictEqual(out.length, 1);
  assert.match(out[0], /filed under this campaign name/);
});

test('collectPageFiles skips Archive directories', () => {
  const path = require('path');
  const { collectPageFiles } = require('../stale-offer-guard.js');
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const files = collectPageFiles(repoRoot);
  assert.ok(files.every((f) => !f.split(path.sep).includes('Archive')));
});

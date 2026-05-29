#!/usr/bin/env node
/**
 * Deterministic guard: the Racquet Sports page must keep the two-CTA Pickleball
 * Hub promo (Hub web app + League sign-up) and must NOT regress to the abandoned
 * "season timeline + single Register" variant.
 *
 * Background: on 2026-05-08 the promo markup was swapped to a timeline/single-register
 * layout, the matching two-button CSS was left behind (orphaned), and it shipped to
 * live looking broken. This guard makes that class of regression fail fast.
 *
 * Run:        npm run guard:racquet-promo
 * Install as a local pre-commit hook (optional, opt-in):
 *   cp scripts/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
 *
 * LEAGUE URL: intentionally NOT enforced here. Structure only. If/when the canonical
 * league URL is settled (/league-play/register vs /league-play), add an href assertion
 * in checkHtml() below.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const HTML_FILE = path.join(
  repoRoot,
  'Website',
  'Pages',
  'racquet-sports',
  'Racquet Sports HTML.html'
);
const CSS_FILE = path.join(
  repoRoot,
  'Website',
  'Pages',
  'racquet-sports',
  'Racquet Sports CSS.css'
);

// Regression markers from the 2026-05-08 swap. Must not appear in HTML or CSS.
const FORBIDDEN_MARKERS = [
  'pb-hub-promo__timeline',
  'pb-hub-promo__date-card',
  'pb-hub-promo__date-label',
  'pb-hub-promo__date-value',
  'pb-hub-promo__btn--register',
];

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

function checkHtml(html) {
  const failures = [];

  // Required two-CTA structure (the restored 9bc169a baseline).
  if (!html.includes('pb-hub-promo'))
    failures.push('missing .pb-hub-promo container');
  if (!html.includes('pb-hub-promo__title'))
    failures.push('missing .pb-hub-promo__title');
  if (!html.includes('pb-hub-promo__lede'))
    failures.push('missing .pb-hub-promo__lede');

  const hubCount = countOccurrences(html, 'pb-hub-promo__btn--hub');
  const leagueCount = countOccurrences(html, 'pb-hub-promo__btn--league');
  if (hubCount !== 1)
    failures.push('expected exactly 1 .pb-hub-promo__btn--hub, found ' + hubCount);
  if (leagueCount !== 1)
    failures.push(
      'expected exactly 1 .pb-hub-promo__btn--league, found ' + leagueCount
    );

  // Forbidden regression markers.
  for (const marker of FORBIDDEN_MARKERS) {
    if (html.includes(marker)) {
      failures.push('regression marker present: ' + marker);
    }
  }

  return failures;
}

function checkCss(css) {
  const failures = [];
  // Orphan styles from the abandoned timeline/register variant must stay removed,
  // so HTML and CSS cannot drift apart unnoticed.
  for (const marker of FORBIDDEN_MARKERS) {
    if (css.includes(marker)) {
      failures.push('orphan regression style present: ' + marker);
    }
  }
  return failures;
}

function main() {
  const targets = [
    { label: 'Racquet Sports HTML.html', file: HTML_FILE, check: checkHtml },
    { label: 'Racquet Sports CSS.css', file: CSS_FILE, check: checkCss },
  ];

  const bad = [];
  for (const t of targets) {
    if (!fs.existsSync(t.file)) {
      console.error('[racquet-promo-guard] missing file:', t.file);
      process.exit(1);
    }
    const contents = fs.readFileSync(t.file, 'utf8');
    const failures = t.check(contents);
    if (failures.length) bad.push({ label: t.label, failures });
  }

  if (bad.length) {
    console.error('[racquet-promo-guard] FAILED');
    for (const b of bad) {
      console.error(' ', b.label);
      b.failures.forEach((msg) => console.error('   -', msg));
    }
    process.exit(1);
  }

  console.log('[racquet-promo-guard] OK (two-CTA hub promo intact, no timeline regression)');
}

main();

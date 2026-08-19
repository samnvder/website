/**
 * Regenerates 7966-paste-into-wpcode.js from the live mirror.
 * Run: node patches/fix-7966-young-discounts/generate.js
 *
 * Deriving the paste from the MIRROR rather than the repo paste-source copy is
 * deliberate: the mirror is the byte-exact record of what is in the WPCode
 * editor today, so the output differs from what is running by exactly the
 * substitutions below and nothing else.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const MIRROR = path.join(root, 'live/wpcode/7966-build-your-membership-discounted-enrollment-percent.js');
const OUT = path.join(__dirname, '7966-paste-into-wpcode.js');
const BAR = '/* ' + '='.repeat(74) + ' */';

const SUBS = [
  // The approved fix: young-family discounts were an oversight at 25/15 while
  // #9926 and #7315 both moved to 30/20 (owner-confirmed 2026-08-18).
  ['const youngChildDiscounts = { 1: 25, 2: 15 };', 'const youngChildDiscounts = { 1: 30, 2: 20 };'],
  // Neutralise the expired campaign. This is a reusable template; leaving a
  // real-looking past campaign in it is what makes a stale offer ship silently.
  // A loud placeholder is obviously wrong instead of plausibly wrong.
  [' * Offer: flat $100 enrollment + 10 guest passes through July 31, 2026 (midnight Pacific).',
   ' * Offer: NONE ACTIVE. Template between campaigns - set the offer before publishing a page.'],
  ['limitedTimeText.textContent = "through July 31 at midnight · 10 guest passes included";',
   'limitedTimeText.textContent = "OFFER NOT SET — update this snippet before publishing";'],
  ['offer: "summer-special-2026-jul31"', 'offer: "UNSET-set-before-launch"'],
];

let s = fs.readFileSync(MIRROR, 'utf8');
s = s.slice(s.lastIndexOf(BAR) + BAR.length + 1); // drop the mirror header

SUBS.forEach(([from, to]) => {
  if (!s.includes(from)) throw new Error(`Expected text not found: ${from.slice(0, 60)}`);
  s = s.replace(from, to);
});

fs.writeFileSync(OUT, s);
console.log(`Wrote ${OUT} (${s.length} chars, ${SUBS.length} substitutions).`);

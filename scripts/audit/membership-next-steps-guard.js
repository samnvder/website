/*
 * guard:membership-next-steps — deterministic enforcement of "edit the
 * source, regenerate the artifacts" for the membership next-steps page.
 *
 * Recomputes every generated artifact from the page source via the
 * same build() the generator uses, then fails on any drift:
 *
 *   1. patches/membership-next-steps/ generated files must equal what
 *      generate.js produces from the page source.
 *   2. The redirect snippet must compile (it is authored, not generated).
 *   3. If a live/wpcode mirror of the page JS or redirect exists (IDs
 *      assigned at paste time in phase 2), it must equal the matching
 *      patches file. Phase 1 has no live mirrors — inventing snippet
 *      IDs here would be the 9951 failure mode.
 *
 * Line endings are normalized before comparing, so CRLF/LF churn never
 * produces a false positive.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const gen = require(path.join(ROOT, 'patches', 'membership-next-steps', 'membership-next-steps--generate.js'));

const norm = s => s.replace(/\r\n/g, '\n');
const read = p => norm(fs.readFileSync(p, 'utf8'));

let failures = 0;
function fail(msg) { failures++; console.error('  ✗ ' + msg); }
function ok(msg) { console.log('  ✓ ' + msg); }

let artifacts;
try {
  artifacts = gen.build();
} catch (e) {
  console.error('[membership-next-steps-guard] cannot build from page source: ' + e.message);
  process.exit(1);
}

for (const [name, expected] of Object.entries(artifacts)) {
  const p = path.join(gen.OUT_DIR, name);
  if (!fs.existsSync(p)) { fail(name + ' is missing — run: node patches/membership-next-steps/membership-next-steps--generate.js'); continue; }
  if (read(p) !== norm(expected)) {
    fail(name + ' does not match the page source. If you edited the page source, run: node patches/membership-next-steps/membership-next-steps--generate.js — if you edited this artifact directly, move the change into the page source FIRST (a regenerate will silently discard it).');
  } else {
    ok(name + ' matches page source');
  }
}

const redirectSrc = path.join(ROOT, 'patches', 'membership-next-steps', 'membership-next-steps--paste-into-wpcode-redirect.js');
if (!fs.existsSync(redirectSrc)) {
  fail('membership-next-steps--paste-into-wpcode-redirect.js is missing');
} else {
  try { new Function(read(redirectSrc)); ok('redirect snippet compiles'); }
  catch (e) { fail('redirect snippet has a syntax error: ' + e.message); }
}

const pageJsSrc = path.join(gen.OUT_DIR, 'membership-next-steps--paste-into-wpcode-page.js');
if (fs.existsSync(pageJsSrc)) {
  try { new Function(read(pageJsSrc)); ok('page JS compiles'); }
  catch (e) { fail('page JS has a syntax error: ' + e.message); }
}

const wpcodeDir = path.join(ROOT, 'live', 'wpcode');
if (fs.existsSync(wpcodeDir)) {
  const files = fs.readdirSync(wpcodeDir).filter(f => f.endsWith('.js'));
  const pageMirrors = files.filter(f => /membership-next-steps-page/.test(f) || /js-membership-next-steps-page/.test(f));
  const redirectMirrors = files.filter(f => /membership-next-steps-redirect/.test(f) || /js-membership-next-steps-redirect/.test(f));
  for (const f of pageMirrors) {
    if (read(path.join(wpcodeDir, f)) !== read(pageJsSrc)) {
      fail('live/wpcode/' + f + ' differs from the generated page JS. After a source change: regenerate, re-paste, and copy the generated file over this mirror in the same session.');
    } else {
      ok('live/wpcode/' + f + ' matches generated page JS');
    }
  }
  for (const f of redirectMirrors) {
    if (read(path.join(wpcodeDir, f)) !== read(redirectSrc)) {
      fail('live/wpcode/' + f + ' differs from patches/membership-next-steps/membership-next-steps--paste-into-wpcode-redirect.js. Edit the patches copy, re-paste, and copy it over the mirror in the same session.');
    } else {
      ok('live/wpcode/' + f + ' matches redirect source');
    }
  }
}

const html = read(path.join(ROOT, 'Website', 'Pages', 'Memberships (Category)', 'membership-next-steps', 'Membership Next Steps HTML.html'));
['id="purchaseButton"', 'id="membershipType"', 'id="originalPrice"', 'id="discountedPrice"'].forEach(forbidden => {
  if (html.indexOf(forbidden) !== -1) fail('page source contains forbidden builder id ' + forbidden + ' (§28)');
  else ok('no ' + forbidden);
});

if (read(redirectSrc).indexOf("event: 'membership_application'") === -1) {
  fail('redirect snippet lost membership_application (join vs special-offer insight)');
} else {
  ok('redirect pushes membership_application');
}
if (html.indexOf("event: 'membership_next_steps'") === -1) {
  fail('page source lost membership_next_steps destination event');
} else {
  ok('page pushes membership_next_steps');
}

if (failures) {
  console.error('[membership-next-steps-guard] FAILED — ' + failures + ' problem(s) above.');
  process.exit(1);
}
console.log('[membership-next-steps-guard] OK — sources, artifacts, and redirect agree.');

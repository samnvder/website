/*
 * guard:tour-confirmation — deterministic enforcement of "edit the
 * source, regenerate the artifacts" for the tour-confirmation page
 * (owner-mandated 2026-08-20, hardening what was previously only a
 * README rule).
 *
 * Recomputes every generated artifact from the page source via the
 * same build() the generator uses, then fails on any drift:
 *
 *   1. patches/tour-confirmation-paste/* must equal what generate.js
 *      produces from the page source. A mismatch means either the page
 *      source changed without regenerating (fix: run the generator) or
 *      the artifact was edited directly (fix: move the edit into the
 *      page source first — direct artifact edits are lost on the next
 *      regenerate, which is exactly how repo and live drift apart).
 *   2. live/wpcode/9998-js-tour-confirmation-page.js (the mirror of
 *      what runs on the site) must equal the generated WPCode body —
 *      when this fires after a legitimate source change, regenerate,
 *      re-paste snippet 9998, and update the mirror in the same
 *      session (backup law).
 *   3. live/wpcode/10010-js-tour-confirmation-redirect.js must equal
 *      its source patches/tour-confirmation-paste/wpcode-tour-redirect.js.
 *   4. Every mirrored tour snippet must still be syntactically valid JS.
 *
 * Line endings are normalized before comparing, so CRLF/LF churn never
 * produces a false positive.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const gen = require(path.join(ROOT, 'patches', 'tour-confirmation-paste', 'generate.js'));

const norm = s => s.replace(/\r\n/g, '\n');
const read = p => norm(fs.readFileSync(p, 'utf8'));

let failures = 0;
function fail(msg) { failures++; console.error('  ✗ ' + msg); }
function ok(msg) { console.log('  ✓ ' + msg); }

// 1) generated artifacts match the page source
let artifacts;
try {
  artifacts = gen.build();
} catch (e) {
  console.error('[tour-confirmation-guard] cannot build from page source: ' + e.message);
  process.exit(1);
}

for (const [name, expected] of Object.entries(artifacts)) {
  const p = path.join(gen.OUT_DIR, name);
  if (!fs.existsSync(p)) { fail(name + ' is missing — run: node patches/tour-confirmation-paste/generate.js'); continue; }
  if (read(p) !== norm(expected)) {
    fail(name + ' does not match the page source. If you edited the page source, run: node patches/tour-confirmation-paste/generate.js — if you edited this artifact directly, move the change into the page source FIRST (a regenerate will silently discard it).');
  } else {
    ok(name + ' matches page source');
  }
}

// 2) live mirror of WPCode 9998 matches the generated body
const mirror9998 = path.join(ROOT, 'live', 'wpcode', '9998-js-tour-confirmation-page.js');
if (read(mirror9998) !== norm(artifacts['wpcode-tour-confirmation.js'])) {
  fail('live/wpcode/9998-js-tour-confirmation-page.js differs from the generated WPCode body. After a page-source JS change: regenerate, re-paste snippet 9998 in WPCode, and copy the generated file over this mirror in the same session (backup law).');
} else {
  ok('live/wpcode/9998 mirror matches generated body');
}

// 2b) live mirror of WPCode 10011 (footer reviews) matches the generated artifact
const mirror10011 = path.join(ROOT, 'live', 'wpcode', '10011-html-footer-member-reviews.html');
if (read(mirror10011) !== norm(artifacts['footer-reviews-element.html'])) {
  fail('live/wpcode/10011-html-footer-member-reviews.html differs from the generated footer artifact. After a quote or component change: regenerate, re-paste snippet 10011 in WPCode, and copy the generated file over this mirror in the same session (backup law).');
} else {
  ok('live/wpcode/10011 mirror matches generated artifact');
}

// 3) redirect snippet mirror matches its source
const redirectSrc = path.join(ROOT, 'patches', 'tour-confirmation-paste', 'wpcode-tour-redirect.js');
const mirror10010 = path.join(ROOT, 'live', 'wpcode', '10010-js-tour-confirmation-redirect.js');
if (read(mirror10010) !== read(redirectSrc)) {
  fail('live/wpcode/10010-js-tour-confirmation-redirect.js differs from patches/tour-confirmation-paste/wpcode-tour-redirect.js. Edit the patches copy, re-paste snippet 10010, and copy it over the mirror in the same session.');
} else {
  ok('live/wpcode/10010 mirror matches source');
}

// 4) mirrored tour snippets must compile
for (const f of [mirror9998, mirror10010]) {
  try { new Function(read(f)); ok(path.basename(f) + ' compiles'); }
  catch (e) { fail(path.basename(f) + ' has a syntax error: ' + e.message); }
}

if (failures) {
  console.error('[tour-confirmation-guard] FAILED — ' + failures + ' problem(s) above.');
  process.exit(1);
}
console.log('[tour-confirmation-guard] OK — sources, artifacts, and live mirrors agree.');

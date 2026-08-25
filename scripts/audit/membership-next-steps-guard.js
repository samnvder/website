/*
 * guard:membership-next-steps — the page-folder files ARE the paste.
 * There is no generator and no patches/ copy. This fails if:
 *
 *   1. A generated paste copy reappears under patches/membership-next-steps/
 *      (the stale-copy failure: Gutenberg paste sat at 743 lines after the
 *      source was already markup-only).
 *   2. HTML contains <script> (JS lives in Membership Next Steps JS.js —
 *      post content entity-encodes &&).
 *   3. Page JS or redirect fail to compile, lose their events, or lose
 *      the #se-mn-page / fetch-wrapper contracts.
 *   4. A live/wpcode mirror exists and differs from the page-folder file.
 *
 * Line endings are normalized before comparing.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PAGE = path.join(ROOT, 'Website', 'Pages', 'Memberships (Category)', 'membership-next-steps');
const PATCH = path.join(ROOT, 'patches', 'membership-next-steps');

const HTML = path.join(PAGE, 'Membership Next Steps HTML.html');
const CSS = path.join(PAGE, 'Membership Next Steps CSS.css');
const PAGE_JS = path.join(PAGE, 'Membership Next Steps JS.js');
const REDIRECT = path.join(PAGE, 'Membership Next Steps redirect.js');

const FORBIDDEN_COPIES = [
  'membership-next-steps--generate.js',
  'membership-next-steps--paste-into-gutenberg.html',
  'membership-next-steps--paste-into-thrive-markup.html',
  'membership-next-steps--paste-into-wpcode-page.js',
  'membership-next-steps--paste-into-wpcode-css.css',
  'membership-next-steps--paste-into-wpcode-redirect.js',
];

const norm = s => s.replace(/\r\n/g, '\n');
const read = p => norm(fs.readFileSync(p, 'utf8'));

let failures = 0;
function fail(msg) { failures++; console.error('  ✗ ' + msg); }
function ok(msg) { console.log('  ✓ ' + msg); }

FORBIDDEN_COPIES.forEach(name => {
  const p = path.join(PATCH, name);
  if (fs.existsSync(p)) {
    fail('patches/membership-next-steps/' + name + ' is a generated copy. Paste the page-folder file instead, then delete this.');
  } else {
    ok('no generated copy ' + name);
  }
});

[HTML, CSS, PAGE_JS, REDIRECT].forEach(p => {
  if (!fs.existsSync(p)) fail('missing ' + path.relative(ROOT, p).replace(/\\/g, '/'));
  else ok(path.basename(p) + ' exists');
});

if (fs.existsSync(HTML)) {
  const html = read(HTML);
  if (/<script[\s>]/i.test(html)) {
    fail('HTML contains <script> — move it into Membership Next Steps JS.js (WPCode). Post content entity-encodes &&.');
  } else {
    ok('HTML has no <script>');
  }
  if (/<style[\s>]/i.test(html)) {
    fail('HTML contains <style> — CSS is Membership Next Steps CSS.css (Thrive Custom CSS). A Gutenberg <style> block is wpautop\'d into <p> tags.');
  } else {
    ok('HTML has no <style>');
  }
  if (html.indexOf('<!-- wp:html -->') === -1 || html.indexOf('<!-- /wp:html -->') === -1) {
    fail('HTML must wrap markup in <!-- wp:html --> so Gutenberg code editor is a select-all paste');
  } else {
    ok('HTML is a Gutenberg wp:html block');
  }
  ['id="purchaseButton"', 'id="membershipType"', 'id="originalPrice"', 'id="discountedPrice"'].forEach(forbidden => {
    if (html.indexOf(forbidden) !== -1) fail('page HTML contains forbidden builder id ' + forbidden + ' (§28)');
    else ok('no ' + forbidden);
  });
}

if (fs.existsSync(PAGE_JS)) {
  const js = read(PAGE_JS);
  try { new Function(js); ok('page JS compiles'); }
  catch (e) { fail('page JS has a syntax error: ' + e.message); }
  if (js.indexOf("getElementById('se-mn-page')") === -1) {
    fail('page JS lost the #se-mn-page guard');
  } else {
    ok('page JS guards on #se-mn-page');
  }
  if (js.indexOf("event: 'membership_next_steps'") === -1) {
    fail('page JS lost membership_next_steps');
  } else {
    ok('page JS pushes membership_next_steps');
  }
}

if (fs.existsSync(REDIRECT)) {
  const js = read(REDIRECT);
  try { new Function(js); ok('redirect compiles'); }
  catch (e) { fail('redirect has a syntax error: ' + e.message); }
  if (js.indexOf("event: 'membership_application'") === -1) {
    fail('redirect lost membership_application');
  } else {
    ok('redirect pushes membership_application');
  }
  if (js.indexOf('create-signature-request') === -1) {
    fail('redirect no longer wraps create-signature-request');
  } else {
    ok('redirect wraps create-signature-request');
  }
}

const wpcodeDir = path.join(ROOT, 'live', 'wpcode');
if (fs.existsSync(wpcodeDir) && fs.existsSync(PAGE_JS) && fs.existsSync(REDIRECT)) {
  const files = fs.readdirSync(wpcodeDir).filter(f => f.endsWith('.js'));
  const pageMirrors = files.filter(f => /membership-next-steps-page/.test(f) || /js-membership-next-steps-page/.test(f));
  const redirectMirrors = files.filter(f => /membership-next-steps-redirect/.test(f) || /js-membership-next-steps-redirect/.test(f));
  for (const f of pageMirrors) {
    if (read(path.join(wpcodeDir, f)) !== read(PAGE_JS)) {
      fail('live/wpcode/' + f + ' differs from Membership Next Steps JS.js. Re-paste the page-folder file and copy it over this mirror in the same session.');
    } else {
      ok('live/wpcode/' + f + ' matches page JS');
    }
  }
  for (const f of redirectMirrors) {
    if (read(path.join(wpcodeDir, f)) !== read(REDIRECT)) {
      fail('live/wpcode/' + f + ' differs from Membership Next Steps redirect.js. Re-paste the page-folder file and copy it over this mirror in the same session.');
    } else {
      ok('live/wpcode/' + f + ' matches redirect');
    }
  }
}

if (failures) {
  console.error('[membership-next-steps-guard] FAILED — ' + failures + ' problem(s) above.');
  process.exit(1);
}
console.log('[membership-next-steps-guard] OK — paste the page-folder files; no generated copies.');

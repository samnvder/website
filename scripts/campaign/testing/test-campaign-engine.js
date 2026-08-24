'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const { parseEmail } = require('../parse-email');
const { validateManifest, assertApplyReady, PARKED, describeArchive } = require('../manifest');
const { pacificEndOfDayIso, offerTag, sanitizeSlug, archiveLabel } = require('../dates');
const { renderButton, renderPromo, renderBuilderJs, renderBanner } = require('../render');
const { applyManifestToPage, installAllMarkers } = require('../page');
const { applyManifestToRepo } = require('../apply');
const { archiveFile } = require('../archive');
const { toLf } = require('../eol');
const { hasAllMarkers } = require('../html');
const { MARKERS, TARGETS } = require('../paths');
const { patchNames } = require('../patches');
const { verify } = require('../verify');

const REPO = path.resolve(__dirname, '..', '..', '..');
const JULY_EMAIL = path.join(REPO, 'campaigns', '2026-07-summer-special', 'email-final.html');
const JULY_15 = new Date(2026, 6, 15);

function julyManifest(overrides = {}) {
  const html = fs.readFileSync(JULY_EMAIL, 'utf8');
  const parsed = parseEmail(html, { today: JULY_15, slug: 'summer-special' });
  return {
    ...parsed,
    status: 'approved',
    ambiguities: [],
    ...overrides,
  };
}

test('requiring campaign modules does not print or write', () => {
  const script = path.join(REPO, 'scripts', 'campaign', 'index.js');
  const { execFileSync } = require('child_process');
  const out = execFileSync(process.execPath, ['-e', `require(${JSON.stringify(script)})`], {
    cwd: os.tmpdir(),
    encoding: 'utf8',
  });
  assert.strictEqual(out.trim(), '');
});

test('parses the July 2026 email into enrollment, end date, and CTAs', () => {
  const m = julyManifest();
  assert.strictEqual(m.enrollment, 100);
  assert.strictEqual(m.guestPasses, null);
  assert.deepStrictEqual(m.endParts, { year: 2026, month: 7, day: 31 });
  assert.strictEqual(m.endDateISO, '2026-08-01T06:59:59.000Z');
  assert.match(m.primaryCta.href, /special-offer/);
  assert.match(m.secondaryCta.href, /schedule-a-tour/);
  assert.strictEqual(m.offerTag, 'summer-special-2026-jul31');
  assert.strictEqual(m.id, '2026-07-summer-special');
  assert.match(m.headline, /August dues go up/);
  assert.ok(m.heroImage.src.includes('Facility-Day'));
});

test('Pacific midnight July 31 2026 is 2026-08-01T06:59:59.000Z', () => {
  assert.strictEqual(pacificEndOfDayIso(2026, 7, 31), '2026-08-01T06:59:59.000Z');
});

test('Pacific midnight January 31 2026 is PST (UTC-8)', () => {
  assert.strictEqual(pacificEndOfDayIso(2026, 1, 31), '2026-02-01T07:59:59.000Z');
});

test('offer tag and filename sanitization', () => {
  assert.strictEqual(offerTag('fall-special', 2026, 9, 30), 'fall-special-2026-sep30');
  assert.strictEqual(sanitizeSlug("Autumn's Lock-In!"), 'autumns-lock-in');
  assert.strictEqual(
    archiveLabel(['2026-07-summer-special', '100-enrollment', '10-guest-passes']),
    '2026-07-summer-special-100-enrollment-10-guest-passes'
  );
});

test('missing enrollment is an ambiguity and blocks apply', () => {
  const html = '<html><title>Hi</title><body>Join us in September 30 for fun</body></html>';
  const m = parseEmail(html, { today: JULY_15, slug: 'x' });
  assert.ok(m.ambiguities.some((a) => a.field === 'enrollment'));
  m.status = 'approved';
  m.ambiguities = [];
  const errs = validateManifest(m, { today: JULY_15 });
  assert.ok(errs.some((e) => /enrollment/.test(e)));
});

test('unresolved ambiguities and UNSET tags cannot be approved launches', () => {
  const m = julyManifest({ ambiguities: [{ field: 'enrollment', message: 'unclear' }] });
  assert.throws(() => assertApplyReady(m, { today: JULY_15 }));
  const parked = validateManifest({ ...PARKED });
  assert.deepStrictEqual(parked, []);
  const unset = julyManifest({ offerTag: 'UNSET-set-before-launch' });
  assert.ok(validateManifest(unset, { today: JULY_15 }).some((e) => /UNSET/.test(e)));
});

test('expired end date fails validation', () => {
  const m = julyManifest();
  const errs = validateManifest(m, { today: new Date(2026, 7, 24) });
  assert.ok(errs.some((e) => /already passed/.test(e)));
});

test('archive copy is byte-exact and refuses a conflicting file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-archive-'));
  const src = path.join(dir, 'src.html');
  fs.writeFileSync(src, Buffer.from('abc\r\nxyz', 'utf8'));
  const destDir = path.join(dir, 'Archive');
  const first = archiveFile(src, destDir, 'label', 'page.html');
  assert.strictEqual(fs.readFileSync(first.dest).equals(fs.readFileSync(src)), true);
  const again = archiveFile(src, destDir, 'label', 'page.html');
  assert.strictEqual(again.skipped, true);
  fs.writeFileSync(src, 'changed');
  assert.throws(() => archiveFile(src, destDir, 'label', 'page.html'));
});

test('installAllMarkers then apply is idempotent', () => {
  const fixture = [
    '<!-- Primary Meta Tags -->',
    '<title>Old</title>',
    '<meta name="title" content="Old">',
    '<meta name="description" content="Old desc">',
    '<meta property="og:title" content="Old og">',
    '<meta property="og:description" content="Old ogd">',
    '<meta name="twitter:title" content="Old tw">',
    '<meta name="twitter:description" content="Old twd">',
    '<!-- Canonical URL -->',
    '<!-- ==============================',
    '     SUMMER SPECIAL — sits BELOW hero',
    '============================== -->',
    '<div class="promo-banner-summer">old</div>',
    '<script>io.observe(builder);',
    '});',
    '})();',
    '</script>',
    '<!-- =========================',
    '     NAVIGATION STYLES (inline for WordPress)',
    '  ========================== -->',
    '<div class="so-offer-callout"><div>x</div></div>',
    '<!-- Membership Type Selection -->',
    '<span id="limitedTimeText" class="limited-time">through July 31 at midnight · 10 guest passes included</span>',
    '<!-- Special-offer pricing (inlined — do not rely on WPCode 7966 for this page) -->',
    '<script>var old = 1;</script>',
  ].join('\n');

  const marked = installAllMarkers(fixture);
  assert.ok(hasAllMarkers(marked, Object.values(MARKERS)));
  const m = julyManifest();
  const once = applyManifestToPage(marked, m);
  const twice = applyManifestToPage(once, m);
  assert.strictEqual(toLf(once), toLf(twice));
  assert.ok(once.includes('summer-special-2026-jul31'));
  assert.ok(once.includes('se-campaign-promo'));
  assert.ok(!once.includes('through July 31 at midnight · 10 guest passes included') || once.includes(m.limitedTimeText));
});

test('builder JS, banner, and promo stay synchronized to the same manifest', () => {
  const m = julyManifest();
  const js = renderBuilderJs(m);
  const promo = renderPromo(m);
  const banner = renderBanner(m);
  const button = renderButton(m);
  assert.ok(js.includes('offer: "summer-special-2026-jul31"'));
  assert.ok(js.includes('const SPECIAL_ENROLLMENT = 100;'));
  assert.ok(js.includes('{ 1: 30, 2: 20 }'));
  assert.ok(promo.includes('$100'));
  assert.ok(banner.includes('special-offer'));
  assert.ok(banner.includes('se-campaign-banner'));
  assert.ok(button.includes('utm_campaign=summer-special-2026-jul31'));
  new Function(js.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
});

test('parked builder uses UNSET tag and zero enrollment', () => {
  const js = renderBuilderJs(PARKED);
  assert.ok(js.includes('UNSET-set-before-launch'));
  assert.ok(js.includes('const SPECIAL_ENROLLMENT = 0;'));
  assert.ok(js.includes('OFFER NOT SET'));
});

test('global button hides on /special-offer/, when expired, and when parked', () => {
  const m = julyManifest();
  const html = renderButton(m);
  assert.ok(html.includes('#se-bk-floating-wrap'));
  assert.ok(html.includes('#se-crm-btn'));
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

  function run(pathname, nowIso) {
    const el = { classList: { added: false, add(name) { if (name === 'is-visible') this.added = true; } } };
    const now = new Date(nowIso).getTime();
    const RealDate = Date;
    const sandbox = {
      location: { pathname },
      document: { getElementById: () => el },
      Date: function DateShim(arg) {
        if (arguments.length === 0) return new RealDate(now);
        return new RealDate(arg);
      },
    };
    vm.runInNewContext(script, sandbox);
    return el.classList.added;
  }

  assert.strictEqual(run('/memberships/', '2026-07-15T12:00:00.000Z'), true);
  assert.strictEqual(run('/special-offer/', '2026-07-15T12:00:00.000Z'), false);
  assert.strictEqual(run('/special-offer', '2026-07-15T12:00:00.000Z'), false);
  assert.strictEqual(run('/memberships/', '2026-08-02T00:00:00.000Z'), false);

  const parkedHtml = renderButton(PARKED);
  const parkedScript = parkedHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
  const el = { classList: { added: false, add() { this.added = true; } } };
  vm.runInNewContext(parkedScript, {
    location: { pathname: '/memberships/' },
    document: { getElementById: () => el },
    Date,
  });
  assert.strictEqual(el.classList.added, false);
});

test('describeArchive names the offer', () => {
  const m = julyManifest({ guestPasses: 10 });
  assert.strictEqual(describeArchive(m), '2026-07-summer-special-100-enrollment-10-guest-passes');
});

test('installAllMarkers and park survive on the real CRLF Special Offer.html', () => {
  const raw = fs.readFileSync(path.join(REPO, TARGETS.page), 'utf8');
  assert.ok(raw.includes('\r\n'), 'real page is CRLF');
  const marked = installAllMarkers(raw);
  assert.ok(hasAllMarkers(marked, Object.values(MARKERS)));
  const parked = applyManifestToPage(marked, PARKED);
  const twice = applyManifestToPage(parked, PARKED);
  assert.strictEqual(toLf(parked), toLf(twice));
  assert.ok(parked.includes('.so-offer-callout {'));
  assert.ok(parked.includes('Match join-page Thrive hero sizing'));
  assert.ok(parked.includes('UNSET-set-before-launch'));
  assert.ok(parked.includes('const SPECIAL_ENROLLMENT = 0;'));
  assert.ok(parked.includes('se-campaign-promo'));
  assert.ok(parked.includes('Digital-SIgn.mp4'));
  assert.ok(parked.includes('id="membershipBuilder"'));
  assert.ok(parked.includes('Yes - We allow reservations'));
  assert.ok(!/through\s+[A-Za-z]+\s+\d{1,2}/.test(parked.replace(/<!--[\s\S]*?-->/g, ' ')));
});

test('installAllMarkers finds promo without a SUMMER SPECIAL comment', () => {
  const raw = fs.readFileSync(path.join(REPO, TARGETS.page), 'utf8');
  const mutated = raw.replace(/SUMMER SPECIAL/g, 'SEASONAL OFFER');
  assert.ok(!mutated.includes('SUMMER SPECIAL'));
  const marked = installAllMarkers(mutated);
  assert.ok(hasAllMarkers(marked, Object.values(MARKERS)));
});

test('archive ifExists skip leaves a conflicting file alone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-archive-skip-'));
  const src = path.join(dir, 'src.html');
  fs.writeFileSync(src, 'abc');
  const destDir = path.join(dir, 'Archive');
  archiveFile(src, destDir, 'label', 'page.html');
  fs.writeFileSync(src, 'changed');
  const skipped = archiveFile(src, destDir, 'label', 'page.html', { ifExists: 'skip' });
  assert.strictEqual(skipped.skipped, true);
  assert.strictEqual(fs.readFileSync(skipped.dest, 'utf8'), 'abc');
});

test('applyManifestToRepo on a copy of the real page only writes campaign targets', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'se-campaign-apply-'));
  function copyRel(rel) {
    const dest = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), dest);
  }
  copyRel(TARGETS.page);
  copyRel(TARGETS.builderJs);
  fs.mkdirSync(path.join(tmp, 'scripts', 'campaign'), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, TARGETS.state),
    JSON.stringify({
      status: 'parked',
      id: null,
      archiveLabel: null,
      manifest: null,
      patchDir: null,
      appliedAt: null,
    }) + '\n'
  );

  const youthCamp = path.join('Components', 'Homepage', 'Homepage Youth Camp Banner.html');
  copyRel(youthCamp);

  applyManifestToRepo(tmp, PARKED, {
    archiveLabel: '2026-07-summer-special-100-enrollment-10-guest-passes',
  });

  const written = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else written.push(path.relative(tmp, full).split(path.sep).join('/'));
    });
  };
  walk(tmp);

  const allowed = new Set([
    TARGETS.page.split(path.sep).join('/'),
    TARGETS.builderJs.split(path.sep).join('/'),
    TARGETS.homepageBanner.split(path.sep).join('/'),
    TARGETS.globalButton.split(path.sep).join('/'),
    TARGETS.state.split(path.sep).join('/'),
    youthCamp.split(path.sep).join('/'),
  ]);
  written.forEach((rel) => {
    if (rel.startsWith('patches/parked/')) return;
    assert.ok(allowed.has(rel), 'unexpected write: ' + rel);
  });
  assert.strictEqual(
    fs.readFileSync(path.join(tmp, youthCamp), 'utf8'),
    fs.readFileSync(path.join(REPO, youthCamp), 'utf8'),
    'youth camp banner must be untouched'
  );

  const page = fs.readFileSync(path.join(tmp, TARGETS.page), 'utf8');
  assert.ok(page.includes('\r\n'), 'applied page stays CRLF');
  assert.ok(page.includes('.so-offer-callout {'));
  assert.ok(page.includes('UNSET-set-before-launch'));

  const names = patchNames('parked');
  assert.ok(fs.existsSync(path.join(tmp, 'patches', 'parked', 'README.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'patches', 'parked', names.promo)));
  assert.ok(fs.existsSync(path.join(tmp, 'patches', 'parked', names.generate)));

  const checked = verify(tmp, { strictArchives: false });
  assert.deepStrictEqual(checked.failures, []);
});

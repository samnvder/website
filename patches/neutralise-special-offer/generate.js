#!/usr/bin/env node
/**
 * Neutralises the expired Summer 2026 campaign in the /special-offer/ page source.
 *
 * Run:  node patches/neutralise-special-offer/generate.js            (writes artifacts)
 *       node patches/neutralise-special-offer/generate.js --apply    (also rewrites the page source)
 *       node patches/neutralise-special-offer/generate.js --check    (exit 1 if the page still has stale values)
 *
 * Why this shape
 * --------------
 * /special-offer/ does not use a WPCode builder. It INLINES its own copy of the
 * builder in the page HTML. So this is not a snippet re-paste: the values live
 * in the page, and the page is Thrive paste-source.
 *
 * The replacements follow the precedent set by #7966 (see CLAUDE.md): between
 * campaigns the template rests carrying NO offer, with loud placeholders, so an
 * accidental publish fails obviously instead of plausibly. A silent, plausible
 * wrong value is what filed July's tag on August's signups.
 *
 * Every replacement is asserted to hit an expected count. A silent no-op here
 * would leave a stale campaign in place while reporting success.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PAGE_REL = path.join(
  'Website', 'Pages', 'Memberships (Category)', 'special-offer', 'Special Offer.html'
);
const OUT_DIR = __dirname;

/** Each rule states how many hits it MUST make. Deterministic, order-independent. */
const RULES = [
  {
    what: 'payload offer tag (reaches Heroku + Dropbox Sign)',
    find: 'offer: "summer-special-2026-jul31"',
    replace: 'offer: "UNSET-set-before-launch"',
    expect: 1,
  },
  {
    what: 'young-family discounts (canonical is 30/20)',
    find: 'const youngChildDiscounts = { 1: 25, 2: 15 };',
    replace: 'const youngChildDiscounts = { 1: 30, 2: 20 };',
    expect: 1,
  },
  {
    what: 'limitedTimeText — rendered markup',
    find: '<span id="limitedTimeText" class="limited-time">through July 31 at midnight · 10 guest passes included</span>',
    replace: '<span id="limitedTimeText" class="limited-time">OFFER NOT SET — do not publish</span>',
    expect: 1,
  },
  {
    what: 'limitedTimeText — assigned by JS',
    find: 'limitedTimeText.textContent = "through July 31 at midnight · 10 guest passes included";',
    replace: 'limitedTimeText.textContent = "OFFER NOT SET — do not publish";',
    expect: 1,
  },
  {
    what: 'builder header comment',
    find: ' * Offer: flat $100 enrollment + 10 guest passes through July 31, 2026 (midnight Pacific).',
    replace: ' * Offer: NOT SET. Set enrollment, wording, countdown and the offer: tag before launch.',
    expect: 1,
  },
  {
    // Appears in BOTH og:description and twitter:description -- the assertion
    // caught that, which is why every rule states its expected hit count.
    what: 'og:description + twitter:description',
    find: '$100 enrollment + 10 guest passes through July 31 at midnight.',
    replace: 'OFFER NOT SET.',
    expect: 2,
  },
  {
    what: 'meta description (inner block)',
    find: 'Lock in with $100 enrollment and 10 guest passes through July 31.',
    replace: 'OFFER NOT SET.',
    expect: 1,
  },
  {
    what: 'countdown target (renders 00d 00h once passed)',
    find: "var END = new Date('2026-08-01T06:59:59.000Z'); // July 31, 2026 11:59:59pm PDT",
    replace: "var END = null; // OFFER NOT SET — set the campaign end before launch",
    expect: 1,
  },
];

function neutralise(source) {
  const report = [];
  let out = source;

  RULES.forEach((rule) => {
    const hits = out.split(rule.find).length - 1;
    if (hits !== rule.expect) {
      throw new Error(
        `Rule "${rule.what}" expected ${rule.expect} hit(s), found ${hits}. ` +
          'The page changed under this patch — re-derive it rather than forcing it through.'
      );
    }
    out = out.split(rule.find).join(rule.replace);
    report.push(`  ${String(hits).padStart(2)}x  ${rule.what}`);
  });

  return { out, report };
}

/** The countdown must tolerate END === null, or the page throws once neutralised. */
function guardCountdown(source) {
  const find = '    var diff = Math.max(0, END - now);';
  const replace = [
    '    if (!END) { return; } // OFFER NOT SET — leave the digits at their markup value',
    '    var diff = Math.max(0, END - now);',
  ].join('\r\n');
  if (!source.includes(find)) {
    throw new Error('countdown tick() not found — re-derive this patch');
  }
  if (source.includes('if (!END)')) return source;
  return source.split(find).join(replace);
}

function main() {
  const args = process.argv.slice(2);
  const pageAbs = path.join(REPO_ROOT, PAGE_REL);
  const original = fs.readFileSync(pageAbs, 'utf8');

  if (args.includes('--check')) {
    const stale = RULES.filter((r) => original.includes(r.find));
    if (stale.length) {
      console.error('[neutralise-special-offer] STALE — page still carries the expired campaign:');
      stale.forEach((r) => console.error(`  - ${r.what}`));
      process.exit(1);
    }
    console.log('[neutralise-special-offer] OK — no expired campaign values in the page.');
    return;
  }

  const { out, report } = neutralise(original);
  const patched = guardCountdown(out);

  fs.writeFileSync(path.join(OUT_DIR, 'Special Offer.neutralised.html'), patched);

  console.log('[neutralise-special-offer] replacements made:');
  report.forEach((r) => console.log(r));
  console.log(`\n  original: ${original.length} bytes`);
  console.log(`  patched:  ${patched.length} bytes`);

  if (args.includes('--apply')) {
    fs.writeFileSync(pageAbs, patched);
    console.log(`\n  APPLIED to ${PAGE_REL}`);
  } else {
    console.log('\n  Not applied. Re-run with --apply to rewrite the page source.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { neutralise, guardCountdown, RULES };

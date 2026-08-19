/**
 * Regenerates the two paste files from the LIVE mirrors in live/wpcode/.
 * Run: node patches/membership-builder-single-bind/generate.js
 *
 * Deriving from the mirrors rather than the repo paste-source copies is
 * deliberate (same as patches/fix-7966-young-discounts): the mirror is the
 * byte-exact record of what is in the WPCode editor today, so each output
 * differs from what is running by exactly ONE inserted block and nothing else.
 *
 * What gets inserted, in each builder, right after its getElementById block:
 *
 *   #9926 (sticker builder)   -- bail unless the four core builder nodes exist;
 *                                bail if #discountedPrice exists (that markup
 *                                belongs to a discount builder); bail if another
 *                                builder already stamped #purchaseButton.
 *   #7315 (discount builder)  -- bail unless the core nodes AND the discount
 *                                nodes (#originalPrice, #discountedPrice,
 *                                #limitedTimeText) exist; bail if another
 *                                builder already stamped #purchaseButton.
 *
 * #discountedPrice is the discriminator: the join-page frontend has none, the
 * Discounted Enrollment and special-offer frontends have one. So on any page
 * exactly one of the two can pass, and the data-se-builder stamp makes "at most
 * one binds" hold even if a page is ever given both kinds of markup.
 *
 * The script proves its own output: stripping the inserted block must reproduce
 * the mirror body byte-for-byte, and the result must still pass the pricing
 * validator with the same expectations npm run guard applies. It throws if any
 * anchor text is missing -- the signal that live has moved and the mirror is
 * stale, in which case re-capture first.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const BAR = '/* ' + '='.repeat(74) + ' */';

const {
  validateMembershipPricing,
  loadCanonicalPricing,
  comparePricingToCanonical,
  loadMembershipBuilderPricing,
} = require(path.join(root, 'scripts/audit/membership-pricing-validate.js'));

const TARGETS = [
  {
    id: '9926',
    mirror: 'live/wpcode/9926-build-your-membership-with-email-notification.js',
    out: '9926-paste-into-wpcode.js',
    discounts: 'forbidden',
    // Insert immediately after the LAST line of the getElementById block.
    anchor: '    const foodBeverageHidden = document.getElementById("foodBeverageMinimum");\n',
    block: [
      '',
      '    // ---- bind guard (2026-08-19) -------------------------------------------',
      '    // This is the STICKER builder (#9926). Bail out cleanly when this is not a',
      '    // builder page, or when the page carries discount markup (#discountedPrice)',
      '    // that belongs to #7315 / #7966. Without this, a page that renders two',
      '    // builder snippets binds #purchaseButton twice and every click creates two',
      '    // Dropbox Sign requests. See patches/membership-builder-single-bind/.',
      '    const discountedPriceDisplay = document.getElementById("discountedPrice");',
      '    const purchaseButton = document.getElementById("purchaseButton");',
      '    if (!membershipType || !tierSelect || !priceDisplay || !purchaseButton) {',
      '        console.warn("[membership builder #9926] Required DOM nodes missing - not bound.");',
      '        return;',
      '    }',
      '    if (discountedPriceDisplay) {',
      '        console.warn("[membership builder #9926] Discount markup present (#discountedPrice); this page belongs to the discounted-enrollment builder - #9926 not bound.");',
      '        return;',
      '    }',
      '    if (purchaseButton.dataset.seBuilder) {',
      '        console.warn("[membership builder #9926] #purchaseButton already bound by builder " + purchaseButton.dataset.seBuilder + " - not binding twice.");',
      '        return;',
      '    }',
      '    purchaseButton.dataset.seBuilder = "9926";',
      '    // ------------------------------------------------------------------------',
      '',
    ].join('\n') + '\n',
  },
  {
    id: '7315',
    mirror: 'live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js',
    out: '7315-paste-into-wpcode.js',
    discounts: 'required',
    anchor: '    const limitedTimeText = document.getElementById("limitedTimeText");\n',
    block: [
      '',
      '    // ---- bind guard (2026-08-19) -------------------------------------------',
      '    // This is the DISCOUNTED-ENROLLMENT builder (#7315). It needs the discount',
      '    // markup (#originalPrice, #discountedPrice, #limitedTimeText). Without it the',
      '    // old code threw a TypeError in updateEnrollmentFee() -- which was the ONLY',
      '    // reason it never double-bound #purchaseButton on /memberships/, where',
      '    // [wpcode id="7315"] was left in the page alongside [wpcode id="9926"].',
      '    // Bail out on purpose instead of by accident. See',
      '    // patches/membership-builder-single-bind/.',
      '    const purchaseButton = document.getElementById("purchaseButton");',
      '    if (!membershipType || !tierSelect || !priceDisplay || !purchaseButton',
      '        || !originalPriceDisplay || !discountedPriceDisplay || !limitedTimeText) {',
      '        console.warn("[membership builder #7315] Discount markup missing - not bound (this is not a discounted-enrollment page).");',
      '        return;',
      '    }',
      '    if (purchaseButton.dataset.seBuilder) {',
      '        console.warn("[membership builder #7315] #purchaseButton already bound by builder " + purchaseButton.dataset.seBuilder + " - not binding twice.");',
      '        return;',
      '    }',
      '    purchaseButton.dataset.seBuilder = "7315";',
      '    // ------------------------------------------------------------------------',
      '',
    ].join('\n') + '\n',
  },
];

function stripMirrorHeader(s) {
  const i = s.lastIndexOf(BAR);
  if (i < 0) throw new Error('Mirror header bar not found');
  return s.slice(i + BAR.length + 1);
}

function insertOnce(body, anchor, block, label) {
  const i = body.indexOf(anchor);
  if (i < 0) throw new Error(`${label}: anchor not found: ${anchor.trim().slice(0, 70)}`);
  if (body.indexOf(anchor, i + 1) >= 0) throw new Error(`${label}: anchor is not unique`);
  return body.slice(0, i + anchor.length) + block + body.slice(i + anchor.length);
}

const canonical = loadCanonicalPricing(root);
let failed = false;

TARGETS.forEach((t) => {
  const mirrorPath = path.join(root, t.mirror);
  const raw = fs.readFileSync(mirrorPath, 'utf8');
  if (raw.includes('\r\n')) throw new Error(`${t.id}: mirror is CRLF; generator assumes LF`);
  const body = stripMirrorHeader(raw);

  // Refuse to run against a mirror that already carries the guard -- that means
  // the paste landed and the mirror was re-captured; this patch is then history.
  if (body.includes('dataset.seBuilder')) {
    throw new Error(`${t.id}: mirror already contains the bind guard; nothing to generate`);
  }

  const out = insertOnce(body, t.anchor, t.block, `#${t.id}`);

  // Proof 1: removing the block reproduces the mirror body byte-for-byte.
  if (out.replace(t.block, '') !== body) {
    throw new Error(`#${t.id}: output minus block != mirror body`);
  }

  const outPath = path.join(__dirname, t.out);
  fs.writeFileSync(outPath, out);

  // Proof 2: the output still validates under the guard's own expectations
  // (shape + canonical pricing + discounts forbidden/required).
  const rel = path.relative(root, outPath);
  const { data } = loadMembershipBuilderPricing(root, rel);
  const { ok, errors } = validateMembershipPricing(data, { discounts: t.discounts });
  const drift = comparePricingToCanonical(data, canonical, { discounts: t.discounts });
  errors.push(...drift);
  if (!ok || drift.length) {
    failed = true;
    console.error(`#${t.id}: generated paste FAILS pricing validation:`);
    errors.forEach((e) => console.error('  ', e));
  }

  const guardLines = t.block.split('\n').length - 1;
  console.log(
    `Wrote ${rel} (${out.length} chars = mirror body ${body.length} + guard ${t.block.length}; ` +
      `${guardLines} lines inserted; discounts ${t.discounts}; pricing ${ok && !drift.length ? 'OK' : 'FAIL'})`
  );
});

if (failed) process.exit(1);

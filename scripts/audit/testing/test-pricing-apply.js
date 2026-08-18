/**
 * Regression tests for the membership pricing codegen.
 *
 * Every defect covered here shipped at once: `npm run pricing:apply` threw on
 * the join-page builder, and once it stopped throwing it reindented the whole
 * of the deeper-nested summer-offer builder and flattened multi-line blocks.
 * These run against in-memory fixtures -- no repo file is written.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const {
  updateMembershipBuilderJs,
  normalizePricingModel,
  reindent,
  matchEol,
} = require('../membership-pricing-apply.js');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const model = normalizePricingModel(
  JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/audit/membership-pricing-source.json'), 'utf8'))
);

/** Builder nested one level deeper than the join page, as #7966 is. */
function deepBuilderFixture() {
  return [
    '(function () {',
    '    function init() {',
    '        const pricing = {',
    '            single: [1, 1, 1],',
    '            couple: [1, 1, 1],',
    '            family: {',
    '                1: [1, 1, 1], 2: [1, 1, 1], 3: [1, 1, 1],',
    '                4: [1, 1, 1], 5: [1, 1, 1], 6: [1, 1, 1]',
    '            }',
    '        };',
    '',
    '        const minimumAmounts = { single: "$1", couple: "$1", family: "$1" };',
    '',
    '        const enrollmentFees = {',
    '            single: [1, 1, 1],',
    '            couple: [1, 1, 1],',
    '            family: [1, 1, 1]',
    '        };',
    '',
    '        function updatePrice() {',
    '            for (let i = 1; i <= numChildren; i++) {',
    '                if (age > 17) {',
    '                    additionalCharge += (i === 1) ? 1 : 2 - (i - 1) * 3;',
    '                }',
    '                if (age > 13 && age <= 17) {',
    '                    additionalCharge += 1;',
    '                }',
    '            }',
    '            if (averageAge <= 1 && numChildren <= 1) {',
    '                additionalCharge -= 1;',
    '            }',
    '',
    '            for (let i = 3; i <= numChildren; i++) {',
    '                if (age > 4) {',
    '                    additionalCharge += 1;',
    '                }',
    '            }',
    '        }',
    '    }',
    '}());',
    '',
  ].join('\r\n');
}

test('reindent keeps relative nesting when the template base is column 0', () => {
  const out = reindent('if (x) {\n    doThing();\n}', '        ');
  assert.strictEqual(out, 'if (x) {\n            doThing();\n        }');
});

test('does not introduce a discounts const into a builder that has none', () => {
  const out = updateMembershipBuilderJs(deepBuilderFixture(), model);
  assert.ok(!/const\s+discounts\s*=/.test(out), 'discounts must not be added');
  assert.ok(!/const\s+discountRates\s*=/.test(out), 'discountRates must not be added');
  assert.ok(!/discountedPrice/.test(out), 'discount calc must not be added');
});

test('preserves the deeper builder indentation instead of flattening it', () => {
  const out = updateMembershipBuilderJs(deepBuilderFixture(), model);
  assert.match(out, /\n {8}const pricing = \{/, 'const stays at its original 8-space indent');
  assert.match(out, /\n {12}single: \[245, 225, 205\]/, 'members indent one level deeper');
  assert.match(out, /\n {8}\};/, 'closing brace returns to the const indent');
  // The young-discount block is multi-line: its body must nest, not flatten.
  assert.match(out, /\n {16}const youngChildDiscounts = \{ 1: 30, 2: 20 \};/);
  assert.match(out, /\n {20}additionalCharge -= youngChildDiscounts\[numChildren\];/);
});

test('writes the canonical pricing values into the builder', () => {
  const out = updateMembershipBuilderJs(deepBuilderFixture(), model);
  assert.match(out, /single: \[245, 225, 205\]/);
  assert.match(out, /couple: \[420, 380, 350\]/);
  assert.match(out, /family: \[600, 550, 500\]/);
  assert.match(out, /couple: "\$40"/);
});

test('preserves CRLF line endings', () => {
  const out = updateMembershipBuilderJs(deepBuilderFixture(), model);
  assert.ok(out.includes('\r\n'), 'CRLF preserved');
  assert.ok(!/[^\r]\n/.test(out), 'no bare LF introduced');
});

test('matchEol converts to LF for an LF-majority file', () => {
  assert.strictEqual(matchEol('a\r\nb', 'x\ny\nz'), 'a\nb');
});

test('is idempotent: a second pass changes nothing', () => {
  const once = updateMembershipBuilderJs(deepBuilderFixture(), model);
  const twice = updateMembershipBuilderJs(once, model);
  assert.strictEqual(twice, once);
});

test('rewrites discounts in a builder that already has them', () => {
  const withDiscounts = deepBuilderFixture().replace(
    '        const enrollmentFees = {',
    [
      '        const discounts = {',
      '            single: 1,',
      '            couple: 1,',
      '            family: 1',
      '        };',
      '',
      '        function calc() {',
      '            const originalPrice = enrollmentFees[type][tier - 1];',
      '            const discount = discounts[type];',
      '            const discountedPrice = originalPrice - discount;',
      '        }',
      '',
      '        const enrollmentFees = {',
    ].join('\r\n')
  );
  const out = updateMembershipBuilderJs(withDiscounts, model);
  assert.match(out, /single: 100,/);
  assert.match(out, /family: 150/);
  assert.match(out, /const discountedPrice = originalPrice - discount;/);
});

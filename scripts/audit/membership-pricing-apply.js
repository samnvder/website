/**
 * Canonical pricing updater for membership builder.
 *
 * Input: pricing JSON (schema-compatible with membership_pricing_schema.json)
 * Output: updates only pricing-related files:
 *   - Website/Pages/Memberships (Category)/memberships/membership builder JS.js
 *   - Website/Pages/Memberships (Category)/memberships/membership builder JS-discount-enrollment.js
 *   - scripts/audit/membership-pricing-source.json
 *   - scripts/audit/membership-pricing-alterations.md
 *
 * Usage:
 *   npm run pricing:apply
 *   npm run pricing:apply -- --input "C:\\path\\to\\pricing.json"
 */

const fs = require('fs');
const path = require('path');
const {
  TARGET_JS_REL,
  CANONICAL_JSON_REL,
  CANONICAL_MD_REL,
  BACKUP_DIR_REL,
} = require('./membership-pricing-paths.js');

function parseArgs(argv) {
  const out = { input: null, dryRun: false, noBackup: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--input') {
      out.input = argv[i + 1] || null;
      i += 1;
    } else if (a === '--dry-run') {
      out.dryRun = true;
    } else if (a === '--no-backup') {
      out.noBackup = true;
    }
  }
  return out;
}

function timestampTag(now = new Date()) {
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function writeBackup(repoRoot, relPath, contentBefore) {
  const backupRoot = path.join(repoRoot, BACKUP_DIR_REL);
  fs.mkdirSync(backupRoot, { recursive: true });
  const fileName = relPath
    .replace(/[\\/]/g, '__')
    .replace(/\s+/g, '-');
  const backupPath = path.join(backupRoot, `${fileName}.${timestampTag()}.bak`);
  fs.writeFileSync(backupPath, contentBefore, 'utf8');
  return backupPath;
}

function assertInteger(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer number.`);
  }
}

function assertNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a number.`);
  }
}

function asTierArray(tierMap, label) {
  if (!tierMap || typeof tierMap !== 'object') {
    throw new Error(`${label} must be an object keyed by "1", "2", "3".`);
  }
  const arr = [tierMap['1'], tierMap['2'], tierMap['3']];
  arr.forEach((v, idx) => assertInteger(v, `${label}.${idx + 1}`));
  return arr;
}

function normalizeDiscount(rawDiscount, label) {
  if (typeof rawDiscount === 'number') {
    if (rawDiscount > 0 && rawDiscount <= 1) {
      return { mode: 'rate', value: rawDiscount };
    }
    assertInteger(rawDiscount, `${label} (fixed amount)`);
    return { mode: 'amount', value: rawDiscount };
  }

  if (rawDiscount && typeof rawDiscount === 'object') {
    const t = String(rawDiscount.type || '').toLowerCase();
    const v = rawDiscount.value;
    if (!t || v === undefined) {
      throw new Error(
        `${label} object must include { "type": "amount|rate", "value": <number> }.`
      );
    }
    if (t === 'rate') {
      assertNumber(v, `${label}.value`);
      if (v < 0 || v > 1) {
        throw new Error(`${label}.value must be between 0 and 1 for rate discounts.`);
      }
      return { mode: 'rate', value: v };
    }
    if (t === 'amount') {
      assertInteger(v, `${label}.value`);
      return { mode: 'amount', value: v };
    }
  }

  throw new Error(
    `${label} must be either a number or object { type: "amount|rate", value: number }.`
  );
}

function computeFinalEnrollment(original, discount) {
  if (discount.mode === 'amount') {
    return original - discount.value;
  }
  return Math.round(original * (1 - discount.value));
}

function normalizePricingModel(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Input JSON must be an object.');
  }

  const memberships = input.membership_types;
  if (!memberships || typeof memberships !== 'object') {
    throw new Error('Input JSON must contain membership_types.');
  }

  const single = memberships.single;
  const couple = memberships.couple;
  const family = memberships.family;
  if (!single || !couple || !family) {
    throw new Error('membership_types must include single, couple, and family.');
  }

  const monthlySingle = asTierArray(single.monthly_dues, 'membership_types.single.monthly_dues');
  const monthlyCouple = asTierArray(couple.monthly_dues, 'membership_types.couple.monthly_dues');

  const familyBase = {};
  for (let n = 1; n <= 6; n += 1) {
    familyBase[n] = asTierArray(
      family.base_monthly_dues_by_children?.[String(n)],
      `membership_types.family.base_monthly_dues_by_children.${n}`
    );
  }

  const enrollment = {};
  ['single', 'couple', 'family'].forEach((typeKey) => {
    const src = memberships[typeKey].enrollment_fee;
    if (!src || typeof src !== 'object') {
      throw new Error(`membership_types.${typeKey}.enrollment_fee is required.`);
    }
    const original = asTierArray(
      src.original,
      `membership_types.${typeKey}.enrollment_fee.original`
    );
    const discount = normalizeDiscount(src.discount, `membership_types.${typeKey}.enrollment_fee.discount`);
    const providedFinal = asTierArray(
      src.final,
      `membership_types.${typeKey}.enrollment_fee.final`
    );
    const computedFinal = original.map((v) => computeFinalEnrollment(v, discount));
    for (let i = 0; i < 3; i += 1) {
      if (computedFinal[i] !== providedFinal[i]) {
        throw new Error(
          `membership_types.${typeKey}.enrollment_fee.final.${i + 1} does not match computed value (${computedFinal[i]}).`
        );
      }
      if (computedFinal[i] < 0) {
        throw new Error(`membership_types.${typeKey}.enrollment_fee.final.${i + 1} cannot be negative.`);
      }
    }
    enrollment[typeKey] = { original, discount, final: computedFinal };
  });

  const discountModes = new Set(
    ['single', 'couple', 'family'].map((k) => enrollment[k].discount.mode)
  );
  if (discountModes.size !== 1) {
    throw new Error(
      'Mixed discount modes are not supported in builder JS. Use all fixed-amount discounts or all rate discounts.'
    );
  }
  const discountMode = [...discountModes][0];
  const discountValues = {
    single: enrollment.single.discount.value,
    couple: enrollment.couple.discount.value,
    family: enrollment.family.discount.value,
  };

  const fpa = input.family_pricing_adjustments;
  if (!fpa || typeof fpa !== 'object') {
    throw new Error('family_pricing_adjustments is required.');
  }

  const over17 = fpa.age_over_17 || {};
  assertInteger(over17.first_child, 'family_pricing_adjustments.age_over_17.first_child');
  assertInteger(
    over17.additional_children_start,
    'family_pricing_adjustments.age_over_17.additional_children_start'
  );
  assertInteger(
    over17.step_down_per_child,
    'family_pricing_adjustments.age_over_17.step_down_per_child'
  );

  assertInteger(fpa.age_14_to_17, 'family_pricing_adjustments.age_14_to_17');
  assertInteger(
    fpa.third_child_over_age_4_surcharge,
    'family_pricing_adjustments.third_child_over_age_4_surcharge'
  );

  const young = fpa.young_children_average_discount || {};
  assertNumber(young.max_average_age, 'family_pricing_adjustments.young_children_average_discount.max_average_age');
  assertInteger(young.max_children, 'family_pricing_adjustments.young_children_average_discount.max_children');
  if (!young.discounts || typeof young.discounts !== 'object') {
    throw new Error('family_pricing_adjustments.young_children_average_discount.discounts is required.');
  }
  const youngDiscounts = {};
  Object.keys(young.discounts).forEach((k) => {
    assertInteger(young.discounts[k], `family_pricing_adjustments.young_children_average_discount.discounts.${k}`);
    youngDiscounts[String(k)] = young.discounts[k];
  });

  const minimumAmounts = {
    single: single.monthly_food_and_beverage_minimum,
    couple: couple.monthly_food_and_beverage_minimum,
    family: family.monthly_food_and_beverage_minimum,
  };
  Object.keys(minimumAmounts).forEach((k) =>
    assertInteger(minimumAmounts[k], `membership_types.${k}.monthly_food_and_beverage_minimum`)
  );

  return {
    pricing: {
      single: monthlySingle,
      couple: monthlyCouple,
      family: familyBase,
    },
    enrollmentFees: {
      single: enrollment.single.original,
      couple: enrollment.couple.original,
      family: enrollment.family.original,
    },
    discounts: {
      mode: discountMode,
      values: discountValues,
    },
    minimumAmounts,
    familyAdjustments: {
      over17: {
        firstChild: over17.first_child,
        additionalChildrenStart: over17.additional_children_start,
        stepDownPerChild: over17.step_down_per_child,
      },
      age14to17: fpa.age_14_to_17,
      youngAverage: {
        maxAverageAge: young.max_average_age,
        maxChildren: young.max_children,
        discounts: youngDiscounts,
      },
      thirdChildOver4Surcharge: fpa.third_child_over_age_4_surcharge,
    },
    stickerRateSource: Array.isArray(input.sticker_rate_source)
      ? input.sticker_rate_source
      : null,
    raw: input,
  };
}

function objectLiteralFromMap(obj, level = 1) {
  const indent = '    '.repeat(level);
  const childIndent = '    '.repeat(level + 1);
  const keys = Object.keys(obj);
  const lines = ['{'];
  keys.forEach((k, idx) => {
    const v = obj[k];
    const valueStr =
      typeof v === 'string'
        ? `"${v}"`
        : Array.isArray(v)
        ? `[${v.join(', ')}]`
        : typeof v === 'object'
        ? objectLiteralFromMap(v, level + 1)
        : String(v);
    const comma = idx === keys.length - 1 ? '' : ',';
    lines.push(`${childIndent}${k}: ${valueStr}${comma}`);
  });
  lines.push(`${indent}}`);
  return lines.join('\n');
}

/**
 * Indentation and line endings differ between builders: the join-page builder
 * sits inside a DOMContentLoaded callback (4-space base) while the summer-offer
 * builder is nested one level deeper inside an IIFE (8-space base), and the
 * builder files are CRLF. The codegen used to emit one hardcoded shape, which
 * reindented the whole of the deeper file on every run -- dozens of lines of
 * churn for a pricing change that touched three numbers. These helpers make the
 * emitted text adopt whatever shape the target file already uses.
 */

/** Leading whitespace of the line `index` falls on. */
function indentAt(source, index) {
  const lineStart = source.lastIndexOf('\n', index) + 1;
  return (source.slice(lineStart, index).match(/^[ \t]*/) || [''])[0];
}

/** Smallest indentation across all lines after the first (the block's own base). */
function baseIndentOf(text) {
  const rest = text.split('\n').slice(1).filter((l) => l.trim() !== '');
  if (rest.length === 0) return '';
  return rest.reduce((min, l) => {
    const lead = (l.match(/^[ \t]*/) || [''])[0];
    return lead.length < min.length ? lead : min;
  }, (rest[0].match(/^[ \t]*/) || [''])[0]);
}

/**
 * Re-anchor generated text to `indent`, preserving relative nesting.
 * The first line is left alone -- it follows `= ` or the match start.
 */
function reindent(text, indent) {
  const base = baseIndentOf(text);
  return text
    .split('\n')
    .map((line, i) => {
      if (i === 0) return line;
      if (line.trim() === '') return '';
      // When the template's own base is column 0, its lines already carry the
      // relative nesting we want -- keep it and just shift the whole block.
      const stripped = base && line.startsWith(base) ? line.slice(base.length) : line;
      return indent + stripped;
    })
    .join('\n');
}

/** Restore the file's original line endings after codegen (which emits \n). */
function matchEol(next, raw) {
  const crlf = (raw.match(/\r\n/g) || []).length;
  const lf = (raw.match(/\n/g) || []).length - crlf;
  const normalized = next.replace(/\r\n/g, '\n');
  return crlf > lf ? normalized.replace(/\n/g, '\r\n') : normalized;
}

/**
 * Replace a matched block, re-anchored to the indentation the block already had.
 * `build` receives the RegExp match, so patterns with backreferences still work.
 */
function replaceBlockAtIndent(source, pattern, build, label) {
  const m = source.match(pattern);
  if (!m) {
    throw new Error(`Pattern not found for ${label}.`);
  }
  const indent = indentAt(source, m.index);
  const text = typeof build === 'function' ? build(m) : build;
  return source.slice(0, m.index) + reindent(text, indent) + source.slice(m.index + m[0].length);
}


function findConstObjectBounds(source, constName) {
  const needle = `const ${constName}`;
  const idx = source.indexOf(needle);
  if (idx === -1) {
    throw new Error(`Could not find const ${constName}.`);
  }
  let i = idx + needle.length;
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] !== '=') throw new Error(`Expected "=" after const ${constName}.`);
  i += 1;
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] !== '{') throw new Error(`Expected "{" for const ${constName}.`);
  const startObj = i;
  let depth = 0;
  for (; i < source.length; i += 1) {
    const c = source[i];
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = i + 1;
        while (end < source.length && /\s/.test(source[end])) end += 1;
        if (source[end] === ';') end += 1;
        while (end < source.length && /[\r\n\t ]/.test(source[end])) end += 1;
        return { startObj, end };
      }
    }
  }
  throw new Error(`Unclosed object literal for const ${constName}.`);
}

function replaceConstObject(source, constName, objectLiteralText) {
  const bounds = findConstObjectBounds(source, constName);
  const indent = indentAt(source, source.indexOf(`const ${constName}`));
  return (
    source.slice(0, bounds.startObj) +
    reindent(objectLiteralText, indent) +
    `;

${indent}` +
    source.slice(bounds.end)
  );
}

function replaceFirstOrThrow(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Pattern not found for ${label}.`);
  }
  return source.replace(pattern, replacement);
}

function buildPricingObject(model) {
  return `{
        single: [${model.pricing.single.join(', ')}],
        couple: [${model.pricing.couple.join(', ')}],
        family: {
            1: [${model.pricing.family[1].join(', ')}],
            2: [${model.pricing.family[2].join(', ')}],
            3: [${model.pricing.family[3].join(', ')}],
            4: [${model.pricing.family[4].join(', ')}],
            5: [${model.pricing.family[5].join(', ')}],
            6: [${model.pricing.family[6].join(', ')}]
        }
    }`;
}

function buildEnrollmentObject(model) {
  return `{
        single: [${model.enrollmentFees.single.join(', ')}],
        couple: [${model.enrollmentFees.couple.join(', ')}],
        family: [${model.enrollmentFees.family.join(', ')}]
    }`;
}

function buildMinimumAmountsObject(model) {
  return `{
        single: "$${model.minimumAmounts.single}",
        couple: "$${model.minimumAmounts.couple}",
        family: "$${model.minimumAmounts.family}"
    }`;
}

function buildDiscountObject(model) {
  if (model.discounts.mode === 'amount') {
    return {
      constName: 'discounts',
      objectText: `{
        single: ${model.discounts.values.single},
        couple: ${model.discounts.values.couple},
        family: ${model.discounts.values.family}
    }`,
      calcText: `const originalPrice = enrollmentFees[type][tier - 1];
        const discount = discounts[type];
        const discountedPrice = originalPrice - discount;`,
    };
  }
  return {
    constName: 'discountRates',
    objectText: `{
        single: ${model.discounts.values.single},
        couple: ${model.discounts.values.couple},
        family: ${model.discounts.values.family}
    }`,
    calcText: `const originalPrice = enrollmentFees[type][tier - 1];
        const discountRate = discountRates[type];
        const discountedPrice = Math.round(originalPrice * (1 - discountRate));`,
  };
}

function buildYoungDiscountMapLiteral(youngDiscounts) {
  const keys = Object.keys(youngDiscounts).sort((a, b) => Number(a) - Number(b));
  const parts = keys.map((k) => `${k}: ${youngDiscounts[k]}`);
  return `{ ${parts.join(', ')} }`;
}

function updateMembershipBuilderJs(raw, model) {
  let next = raw;
  next = replaceConstObject(next, 'pricing', buildPricingObject(model));
  next = replaceConstObject(next, 'minimumAmounts', buildMinimumAmountsObject(model));
  next = replaceConstObject(next, 'enrollmentFees', buildEnrollmentObject(model));

  // Discount codegen is OPTIONAL, and deliberately never *introduced*.
  //
  // The normal join-page builder (WPCode #9926) has carried no discount const
  // since commit 3fc792b removed its promo UI, and the summer-offer builder
  // (#7966) uses a flat SPECIAL_ENROLLMENT constant rather than a discounts
  // map. Writing a discounts block into either would put promo pricing on a
  // page that is not running one -- exactly what the guard now fails on. So we
  // only rewrite discounts in builders that already have them (#7315).
  if (/const\s+(discounts|discountRates)\s*=/.test(next)) {
    const discountModel = buildDiscountObject(model);
    const altConst = discountModel.constName === 'discounts' ? 'discountRates' : 'discounts';

    try {
      next = replaceConstObject(next, altConst, discountModel.objectText);
      next = next.replace(`const ${altConst}`, `const ${discountModel.constName}`);
    } catch {
      next = replaceConstObject(next, discountModel.constName, discountModel.objectText);
    }

    next = replaceBlockAtIndent(
      next,
      /const originalPrice = enrollmentFees\[type\]\[tier - 1\];[\s\S]*?const discountedPrice = .*?;/,
      discountModel.calcText,
      'enrollment discounted price calculation'
    );
  }

  next = replaceBlockAtIndent(
    next,
    /additionalCharge \+= \(i === 1\) \? .*?;/,
    `additionalCharge += (i === 1) ? ${model.familyAdjustments.over17.firstChild} : ${model.familyAdjustments.over17.additionalChildrenStart} - (i - 1) * ${model.familyAdjustments.over17.stepDownPerChild};`,
    'age > 17 pricing'
  );

  next = replaceBlockAtIndent(
    next,
    /if \(age > 13 && age <= 17\) \{\s*[\r\n]+\s*additionalCharge \+= \d+;\s*[\r\n]+\s*}/,
    `if (age > 13 && age <= 17) {
    additionalCharge += ${model.familyAdjustments.age14to17};
}`,
    'age 14-17 pricing'
  );

  const youngDiscountMap = buildYoungDiscountMapLiteral(model.familyAdjustments.youngAverage.discounts);
  const youngBlock = `if (averageAge <= ${model.familyAdjustments.youngAverage.maxAverageAge} && numChildren <= ${model.familyAdjustments.youngAverage.maxChildren}) {
    const youngChildDiscounts = ${youngDiscountMap};
    if (youngChildDiscounts[numChildren]) {
        additionalCharge -= youngChildDiscounts[numChildren];
    }
}`;

  next = replaceBlockAtIndent(
    next,
    /if \(averageAge <=[\s\S]*?(for \(let i = 3;)/,
    (m) => `${youngBlock}\n\n${m[1]}`,
    'young family discount block'
  );

  next = replaceBlockAtIndent(
    next,
    /if \(age > 4\) \{\s*[\r\n]+\s*additionalCharge \+= \d+;\s*[\r\n]+\s*}/,
    `if (age > 4) {
    additionalCharge += ${model.familyAdjustments.thirdChildOver4Surcharge};
}`,
    'third child surcharge'
  );

  // Codegen emits \n; put the file back on the line endings it arrived with.
  return matchEol(next, raw);
}

function renderAlterationsMarkdown(model) {
  // The discount model is per-builder, not global. Saying "enrollment discounts
  // are fixed dollar amounts" flat out was wrong for the normal join page, which
  // has charged sticker enrollment since 3fc792b -- and this file regenerating
  // that claim is how the doc drifted away from the code it documents.
  const unit = (v) =>
    model.discounts.mode === 'amount'
      ? `$${v} off enrollment`
      : `${(v * 100).toFixed(2).replace(/\.00$/, '')}% off enrollment`;

  const discountRows = ['single', 'couple', 'family']
    .map((k) => `- ${k}: ${unit(model.discounts.values[k])}`)
    .join('\n');

  const stickerSource = model.stickerRateSource
    ? `\n## Sticker rate source\n\n${model.stickerRateSource.map((l) => `- ${l}`).join('\n')}\n`
    : '';

  return `# Membership Pricing Alterations

This file is generated by \`scripts/audit/membership-pricing-apply.js\`.

## Discount model

**Normal join page (WPCode #9926):** no enrollment discount. Sticker enrollment fees display as-is.

**Discounted enrollment (WPCode #7315)** — \`memberships/Discounted Enrollment/membership builder JS.js\`:

${discountRows}

**Special offer (WPCode #7966)** — \`membership builder JS-discount-enrollment.js\`: flat enrollment amount, set in the file as \`SPECIAL_ENROLLMENT\`.

## Family monthly adjustment rules

- If any child age is missing/invalid: use base family monthly dues only.
- Age > 17: first child +$${model.familyAdjustments.over17.firstChild}; additional children use ${model.familyAdjustments.over17.additionalChildrenStart} - (childIndex - 1) * ${model.familyAdjustments.over17.stepDownPerChild}.
- Age 14 to 17: +$${model.familyAdjustments.age14to17} per child.
- Young average discount gate: average age <= ${model.familyAdjustments.youngAverage.maxAverageAge} and children <= ${model.familyAdjustments.youngAverage.maxChildren}.
- Young average discounts: ${Object.keys(model.familyAdjustments.youngAverage.discounts)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => `${k} child = -$${model.familyAdjustments.youngAverage.discounts[k]}`)
    .join(', ')}.
- Third child+ surcharge: +$${model.familyAdjustments.thirdChildOver4Surcharge} for each child #3+ over age 4.
${stickerSource}`;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const args = parseArgs(process.argv);
  const inputPath = args.input
    ? path.resolve(args.input)
    : path.join(repoRoot, CANONICAL_JSON_REL);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input JSON not found: ${inputPath}`);
  }

  const rawInput = fs.readFileSync(inputPath, 'utf8');
  const parsedInput = JSON.parse(rawInput);
  const model = normalizePricingModel(parsedInput);

  const changes = [];

  TARGET_JS_REL.forEach((relPath) => {
    const absPath = path.join(repoRoot, relPath);
    const before = fs.readFileSync(absPath, 'utf8');
    const after = updateMembershipBuilderJs(before, model);
    const changed = before !== after;
    changes.push({ relPath, changed, before, after, type: 'js' });
  });

  const canonicalJsonPath = path.join(repoRoot, CANONICAL_JSON_REL);
  const canonicalJsonBefore = fs.existsSync(canonicalJsonPath)
    ? fs.readFileSync(canonicalJsonPath, 'utf8')
    : '';
  const canonicalJsonAfter = `${JSON.stringify(model.raw, null, 2)}\n`;
  changes.push({
    relPath: CANONICAL_JSON_REL,
    changed: canonicalJsonBefore !== canonicalJsonAfter,
    before: canonicalJsonBefore,
    after: canonicalJsonAfter,
    type: 'json',
  });

  const canonicalMdPath = path.join(repoRoot, CANONICAL_MD_REL);
  const canonicalMdBefore = fs.existsSync(canonicalMdPath)
    ? fs.readFileSync(canonicalMdPath, 'utf8')
    : '';
  const canonicalMdAfter = renderAlterationsMarkdown(model);
  changes.push({
    relPath: CANONICAL_MD_REL,
    changed: canonicalMdBefore !== canonicalMdAfter,
    before: canonicalMdBefore,
    after: canonicalMdAfter,
    type: 'md',
  });

  const changedCount = changes.filter((c) => c.changed).length;
  if (changedCount === 0) {
    console.log('[pricing:apply] No file changes needed.');
    return;
  }

  if (args.dryRun) {
    console.log('[pricing:apply] Dry run (no files written).');
    changes
      .filter((c) => c.changed)
      .forEach((c) => console.log('[pricing:apply] Would update', c.relPath));
    return;
  }

  changes
    .filter((c) => c.changed)
    .forEach((c) => {
      const absPath = path.join(repoRoot, c.relPath);
      if (!args.noBackup && c.before) {
        const backupPath = writeBackup(repoRoot, c.relPath, c.before);
        console.log('[pricing:apply] Backup created', path.relative(repoRoot, backupPath));
      }
      fs.writeFileSync(absPath, c.after, 'utf8');
      console.log('[pricing:apply] Updated', c.relPath);
    });
}

// Importing this module used to RUN it -- a bare `require` rewrote every live
// pricing file as a side effect. Only execute when invoked directly.
if (require.main === module) {
  main();
}

module.exports = {
  updateMembershipBuilderJs,
  renderAlterationsMarkdown,
  normalizePricingModel,
  reindent,
  matchEol,
};

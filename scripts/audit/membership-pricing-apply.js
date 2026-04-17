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
  return source.slice(0, bounds.startObj) + objectLiteralText + ';\n\n    ' + source.slice(bounds.end);
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

  const discountModel = buildDiscountObject(model);
  const altConst = discountModel.constName === 'discounts' ? 'discountRates' : 'discounts';

  try {
    next = replaceConstObject(next, altConst, discountModel.objectText);
    next = next.replace(`const ${altConst}`, `const ${discountModel.constName}`);
  } catch {
    next = replaceConstObject(next, discountModel.constName, discountModel.objectText);
  }

  next = replaceFirstOrThrow(
    next,
    /const originalPrice = enrollmentFees\[type\]\[tier - 1\];[\s\S]*?const discountedPrice = .*?;/,
    discountModel.calcText,
    'enrollment discounted price calculation'
  );

  next = replaceFirstOrThrow(
    next,
    /additionalCharge \+= \(i === 1\) \? .*?;/,
    `additionalCharge += (i === 1) ? ${model.familyAdjustments.over17.firstChild} : ${model.familyAdjustments.over17.additionalChildrenStart} - (i - 1) * ${model.familyAdjustments.over17.stepDownPerChild};`,
    'age > 17 pricing'
  );

  next = replaceFirstOrThrow(
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

  next = replaceFirstOrThrow(
    next,
    /if \(averageAge <=[\s\S]*?(for \(let i = 3;)/,
    `${youngBlock}

                $1`,
    'young family discount block'
  );

  next = replaceFirstOrThrow(
    next,
    /if \(age > 4\) \{\s*[\r\n]+\s*additionalCharge \+= \d+;\s*[\r\n]+\s*}/,
    `if (age > 4) {
                        additionalCharge += ${model.familyAdjustments.thirdChildOver4Surcharge};
                    }`,
    'third child surcharge'
  );

  return next;
}

function renderAlterationsMarkdown(model) {
  const discountHeader =
    model.discounts.mode === 'amount'
      ? 'Enrollment discounts are fixed dollar amounts by membership type.'
      : 'Enrollment discounts are percentage rates by membership type.';

  const discountRows = ['single', 'couple', 'family']
    .map((k) => {
      const v = model.discounts.values[k];
      return model.discounts.mode === 'amount'
        ? `- ${k}: $${v} off enrollment`
        : `- ${k}: ${(v * 100).toFixed(2).replace(/\.00$/, '')}% off enrollment`;
    })
    .join('\n');

  return `# Membership Pricing Alterations

This file is generated by \`scripts/audit/membership-pricing-apply.js\`.

## Discount model

${discountHeader}

${discountRows}

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
`;
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

main();

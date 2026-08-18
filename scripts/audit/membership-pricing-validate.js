/**
 * Deterministic guard for membership builder JS pricing data.
 * Same inputs → same digest; validation rules fail fast on bad edits.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const {
  SOURCE_REL,
  DISCOUNTED_ENROLLMENT_SOURCE_REL,
  GUARD_TARGETS,
  CANONICAL_JSON_REL,
} = require('./membership-pricing-paths.js');

function extractConstObjectLiteral(source, name) {
  const needle = `const ${name}`;
  const idx = source.indexOf(needle);
  if (idx === -1) {
    throw new Error(`Could not find "const ${name}" in source file.`);
  }
  let i = idx + needle.length;
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] !== '=') throw new Error(`Expected "=" after const ${name}`);
  i += 1;
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] !== '{') throw new Error(`Expected "{" for const ${name}`);
  const start = i;
  let depth = 0;
  for (; i < source.length; i += 1) {
    const c = source[i];
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed object for const ${name}`);
}

function evalObjectLiteral(literal) {
  return vm.runInNewContext(`(${literal})`, Object.create(null));
}

/**
 * Load and parse pricing-related consts from a membership builder JS file.
 *
 * Discounts are OPTIONAL. The normal join-page builder (WPCode #9926) has had
 * no `discounts` const since commit 3fc792b removed the promo UI; demanding one
 * is what made this guard throw. Absence is reported as discountsMode 'none' so
 * the caller can assert it, rather than silently treated as a parse failure.
 *
 * @param {string} repoRoot Absolute path to Website repo root (parent of Website/Pages/...)
 * @param {string} [relPath] Builder file to read, relative to repoRoot. Defaults to
 *   the normal join page (SOURCE_REL) so existing callers are unaffected.
 */
function loadMembershipBuilderPricing(repoRoot, relPath = SOURCE_REL) {
  const sourcePath = path.join(repoRoot, relPath);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source not found: ${sourcePath}`);
  }
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const sourceBytes = Buffer.byteLength(raw, 'utf8');
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');

  const pricing = evalObjectLiteral(extractConstObjectLiteral(raw, 'pricing'));
  const minimumAmounts = evalObjectLiteral(extractConstObjectLiteral(raw, 'minimumAmounts'));
  const enrollmentFees = evalObjectLiteral(extractConstObjectLiteral(raw, 'enrollmentFees'));
  let discountsMode = 'none';
  let discountValues = null;
  if (raw.includes('const discounts')) {
    discountValues = evalObjectLiteral(extractConstObjectLiteral(raw, 'discounts'));
    discountsMode = 'amount';
  } else if (raw.includes('const discountRates')) {
    discountValues = evalObjectLiteral(extractConstObjectLiteral(raw, 'discountRates'));
    discountsMode = 'rate';
  }

  const data = {
    pricing,
    minimumAmounts,
    enrollmentFees,
    discounts: discountValues,
    discountsMode,
  };
  return { sourcePath, raw, sourceBytes, sha256, data };
}

/**
 * Reduce membership-pricing-source.json — the declared canonical pricing —
 * to the same shape the builder JS exposes, so the two can be compared.
 */
function loadCanonicalPricing(repoRoot) {
  const jsonPath = path.join(repoRoot, CANONICAL_JSON_REL);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Canonical pricing source not found: ${jsonPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const types = raw.membership_types || {};
  const tiers = (obj) => [obj['1'], obj['2'], obj['3']];

  const family = {};
  const byChildren = (types.family || {}).base_monthly_dues_by_children || {};
  Object.keys(byChildren).forEach((n) => {
    family[n] = tiers(byChildren[n]);
  });

  const discountValue = (t) => {
    const d = ((types[t] || {}).enrollment_fee || {}).discount;
    return d && typeof d === 'object' ? d.value : d;
  };

  return {
    pricing: {
      single: tiers(types.single.monthly_dues),
      couple: tiers(types.couple.monthly_dues),
      family,
    },
    minimumAmounts: {
      single: `$${types.single.monthly_food_and_beverage_minimum}`,
      couple: `$${types.couple.monthly_food_and_beverage_minimum}`,
      family: `$${types.family.monthly_food_and_beverage_minimum}`,
    },
    enrollmentFees: {
      single: tiers(types.single.enrollment_fee.original),
      couple: tiers(types.couple.enrollment_fee.original),
      family: tiers(types.family.enrollment_fee.original),
    },
    discounts: {
      single: discountValue('single'),
      couple: discountValue('couple'),
      family: discountValue('family'),
    },
  };
}

function sameTiers(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length
    && a.every((v, i) => v === b[i]);
}

/**
 * Compare a builder's constants against the canonical pricing source.
 *
 * This is the check that makes the guard mean something. Shape validation alone
 * passes any internally-consistent set of numbers, so a dues figure edited in
 * one place and not the other would sail through. Real drift fails here.
 *
 * @returns {string[]} errors (empty when the builder agrees with canonical)
 */
function comparePricingToCanonical(data, canonical, expect = {}) {
  const errors = [];
  const where = 'differs from membership-pricing-source.json';

  ['single', 'couple'].forEach((t) => {
    if (!sameTiers(data.pricing[t], canonical.pricing[t])) {
      errors.push(
        `pricing.${t}: [${data.pricing[t]}] ${where} ([${canonical.pricing[t]}]).`
      );
    }
  });

  Object.keys(canonical.pricing.family).forEach((n) => {
    const got = (data.pricing.family || {})[n];
    if (!sameTiers(got, canonical.pricing.family[n])) {
      errors.push(
        `pricing.family[${n}]: [${got}] ${where} ([${canonical.pricing.family[n]}]).`
      );
    }
  });

  ['single', 'couple', 'family'].forEach((t) => {
    if (!sameTiers(data.enrollmentFees[t], canonical.enrollmentFees[t])) {
      errors.push(
        `enrollmentFees.${t}: [${data.enrollmentFees[t]}] ${where} ([${canonical.enrollmentFees[t]}]).`
      );
    }
    if (data.minimumAmounts[t] !== canonical.minimumAmounts[t]) {
      errors.push(
        `minimumAmounts.${t}: "${data.minimumAmounts[t]}" ${where} ("${canonical.minimumAmounts[t]}").`
      );
    }
  });

  if (expect.discounts === 'required' && (data.discountsMode || 'none') !== 'none') {
    ['single', 'couple', 'family'].forEach((t) => {
      if (data.discounts[t] !== canonical.discounts[t]) {
        errors.push(
          `discounts.${t}: ${data.discounts[t]} ${where} (${canonical.discounts[t]}).`
        );
      }
    });
  }

  return errors;
}

/**
 * Canonical JSON for stable digest (sorted keys, fixed ordering).
 */
function computePricingDigest(data) {
  const familyKeys = Object.keys(data.pricing.family)
    .map(Number)
    .sort((a, b) => a - b);
  const family = {};
  familyKeys.forEach((k) => {
    family[k] = data.pricing.family[k];
  });
  const canonical = {
    pricing: {
      single: data.pricing.single,
      couple: data.pricing.couple,
      family,
    },
    minimumAmounts: {
      couple: data.minimumAmounts.couple,
      family: data.minimumAmounts.family,
      single: data.minimumAmounts.single,
    },
    enrollmentFees: {
      couple: data.enrollmentFees.couple,
      family: data.enrollmentFees.family,
      single: data.enrollmentFees.single,
    },
    discounts:
      data.discountsMode === 'none' || !data.discounts
        ? { mode: 'none' }
        : {
            mode: data.discountsMode || 'amount',
            couple: data.discounts.couple,
            family: data.discounts.family,
            single: data.discounts.single,
          },
  };
  const json = JSON.stringify(canonical);
  return crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

function isValidMoney(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && Number.isInteger(n);
}

/** Tier 1 (index 0) = highest; Tier 3 (index 2) = lowest monthly due. */
function assertTierOrderDesc(label, arr, errors) {
  if (!Array.isArray(arr) || arr.length !== 3) {
    errors.push(`${label}: expected number[3] (tiers 1–3).`);
    return;
  }
  for (let i = 0; i < 3; i += 1) {
    if (!isValidMoney(arr[i])) {
      errors.push(`${label}[${i}]: expected non-negative integer (USD).`);
    }
  }
  if (arr[0] < arr[1] || arr[1] < arr[2]) {
    errors.push(
      `${label}: Tier 1 ≥ Tier 2 ≥ Tier 3 required (index 0 = Tier 1 full club, index 2 = Tier 3 entry).`
    );
  }
}

/**
 * @param {object} data Parsed builder constants from loadMembershipBuilderPricing.
 * @param {{ discounts?: 'forbidden'|'required'|'any' }} [expect]
 *   Asserts the KIND of builder this file is. 'forbidden' = the normal join
 *   page, which must carry no discount const; 'required' = a promo builder,
 *   which must. Without this a file could lose its discounts entirely and
 *   still pass, which is the failure mode this guard exists to catch.
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validateMembershipPricing(data, expect = {}) {
  const errors = [];
  const mode = data.discountsMode || 'none';
  const expectDiscounts = expect.discounts || 'any';

  if (!data.pricing || !data.minimumAmounts || !data.enrollmentFees) {
    errors.push('Missing top-level keys: pricing, minimumAmounts, enrollmentFees.');
    return { ok: false, errors };
  }

  if (expectDiscounts === 'required' && mode === 'none') {
    errors.push(
      'discounts: expected a discount const (discounts or discountRates) in this builder, found none.'
    );
  }
  if (expectDiscounts === 'forbidden' && mode !== 'none') {
    errors.push(
      `discounts: this builder must not define discounts (found "${mode}" mode). ` +
        'Promo pricing belongs in the Discounted Enrollment builder.'
    );
  }

  assertTierOrderDesc('pricing.single', data.pricing.single, errors);
  assertTierOrderDesc('pricing.couple', data.pricing.couple, errors);

  for (let n = 1; n <= 6; n += 1) {
    if (!data.pricing.family || data.pricing.family[n] === undefined) {
      errors.push(`pricing.family[${n}]: required (children count 1–6).`);
    } else {
      assertTierOrderDesc(`pricing.family[${n}]`, data.pricing.family[n], errors);
    }
  }

  assertTierOrderDesc('enrollmentFees.single', data.enrollmentFees.single, errors);
  assertTierOrderDesc('enrollmentFees.couple', data.enrollmentFees.couple, errors);
  assertTierOrderDesc('enrollmentFees.family', data.enrollmentFees.family, errors);

  if (mode !== 'none') ['single', 'couple', 'family'].forEach((t) => {
    const d = data.discounts[t];
    if (typeof d !== 'number' || !Number.isFinite(d) || d < 0) {
      errors.push(`discounts.${t}: expected non-negative number.`);
      return;
    }
    if ((data.discountsMode || 'amount') === 'amount' && !Number.isInteger(d)) {
      errors.push(`discounts.${t}: expected non-negative integer for fixed amount mode.`);
    }
    if ((data.discountsMode || 'amount') === 'rate' && d > 1) {
      errors.push(`discounts.${t}: expected value between 0 and 1 for rate mode.`);
    }
  });

  if (mode !== 'none') ['single', 'couple', 'family'].forEach((t) => {
    const orig = data.enrollmentFees[t];
    const d = data.discounts[t];
    if (!orig || d === undefined) return;
    for (let i = 0; i < 3; i += 1) {
      const final =
        (data.discountsMode || 'amount') === 'rate'
          ? Math.round(orig[i] * (1 - d))
          : orig[i] - d;
      if (final < 0) {
        errors.push(
          `${t} tier ${i + 1}: enrollment fee after discount cannot be negative.`
        );
      }
    }
  });

  ['single', 'couple', 'family'].forEach((t) => {
    const m = data.minimumAmounts[t];
    if (typeof m !== 'string' || !/^\$\d+(\.\d{1,2})?$/.test(m)) {
      errors.push(`minimumAmounts.${t}: expected string like "$20" or "$12.50".`);
    }
  });

  return { ok: errors.length === 0, errors };
}

function assertValidMembershipPricing(data, expect = {}) {
  const r = validateMembershipPricing(data, expect);
  if (!r.ok) {
    const msg = ['[membership-pricing guard] Validation failed:', ...r.errors.map((e) => `  - ${e}`)].join('\n');
    throw new Error(msg);
  }
}

module.exports = {
  SOURCE_REL,
  DISCOUNTED_ENROLLMENT_SOURCE_REL,
  GUARD_TARGETS,
  loadCanonicalPricing,
  comparePricingToCanonical,
  loadMembershipBuilderPricing,
  validateMembershipPricing,
  assertValidMembershipPricing,
  computePricingDigest,
};

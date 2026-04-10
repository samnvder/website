/**
 * Deterministic guard for membership builder JS pricing data.
 * Same inputs → same digest; validation rules fail fast on bad edits.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const SOURCE_REL = path.join(
  'Website',
  'Pages',
  'Memberships (Category)',
  'memberships',
  'membership builder JS.js'
);

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
 * Load and parse pricing-related consts from membership builder JS.js.
 * @param {string} repoRoot Absolute path to Website repo root (parent of Website/Pages/...)
 */
function loadMembershipBuilderPricing(repoRoot) {
  const sourcePath = path.join(repoRoot, SOURCE_REL);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source not found: ${sourcePath}`);
  }
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const sourceBytes = Buffer.byteLength(raw, 'utf8');
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');

  const pricing = evalObjectLiteral(extractConstObjectLiteral(raw, 'pricing'));
  const minimumAmounts = evalObjectLiteral(extractConstObjectLiteral(raw, 'minimumAmounts'));
  const enrollmentFees = evalObjectLiteral(extractConstObjectLiteral(raw, 'enrollmentFees'));
  const discounts = evalObjectLiteral(extractConstObjectLiteral(raw, 'discounts'));

  const data = { pricing, minimumAmounts, enrollmentFees, discounts };
  return { sourcePath, raw, sourceBytes, sha256, data };
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
    discounts: {
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
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validateMembershipPricing(data) {
  const errors = [];

  if (!data.pricing || !data.minimumAmounts || !data.enrollmentFees || !data.discounts) {
    errors.push('Missing top-level keys: pricing, minimumAmounts, enrollmentFees, discounts.');
    return { ok: false, errors };
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

  ['single', 'couple', 'family'].forEach((t) => {
    const d = data.discounts[t];
    if (typeof d !== 'number' || !Number.isFinite(d) || d < 0 || !Number.isInteger(d)) {
      errors.push(`discounts.${t}: expected non-negative integer.`);
    }
  });

  ['single', 'couple', 'family'].forEach((t) => {
    const orig = data.enrollmentFees[t];
    const d = data.discounts[t];
    if (!orig || d === undefined) return;
    for (let i = 0; i < 3; i += 1) {
      if (orig[i] - d < 0) {
        errors.push(`${t} tier ${i + 1}: enrollment fee minus discount cannot be negative.`);
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

function assertValidMembershipPricing(data) {
  const r = validateMembershipPricing(data);
  if (!r.ok) {
    const msg = ['[membership-pricing guard] Validation failed:', ...r.errors.map((e) => `  - ${e}`)].join('\n');
    throw new Error(msg);
  }
}

module.exports = {
  SOURCE_REL,
  loadMembershipBuilderPricing,
  validateMembershipPricing,
  assertValidMembershipPricing,
  computePricingDigest,
};

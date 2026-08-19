/**
 * Deterministic guard: exit 0 only if every LIVE membership builder passes validation.
 * Run: npm run guard:membership-pricing
 *
 * Two builders are live (confirmed with the site owner 2026-08-18):
 *   WPCode #9926 — normal join page, no enrollment discounts
 *   WPCode #7315 — discounted enrollment, $100/$100/$150
 * Each is checked against its expected shape, so a builder silently losing (or
 * gaining) its discount const fails rather than passing on a technicality.
 */

const path = require('path');
const {
  GUARD_TARGETS,
  loadMembershipBuilderPricing,
  validateMembershipPricing,
  computePricingDigest,
  loadCanonicalPricing,
  comparePricingToCanonical,
} = require('./membership-pricing-validate.js');

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const canonical = loadCanonicalPricing(repoRoot);
  let failed = false;

  GUARD_TARGETS.forEach((target) => {
    let sourcePath;
    let data;
    try {
      ({ sourcePath, data } = loadMembershipBuilderPricing(repoRoot, target.rel));
    } catch (err) {
      failed = true;
      console.error('[membership-pricing guard] FAILED —', target.label);
      console.error('Source:', target.rel);
      console.error(' ', err.message);
      return;
    }

    const { ok, errors } = validateMembershipPricing(data, { discounts: target.discounts });
    const driftErrors = comparePricingToCanonical(data, canonical, {
      discounts: target.discounts,
    });
    errors.push(...driftErrors);

    if (!ok || driftErrors.length) {
      failed = true;
      console.error('[membership-pricing guard] FAILED —', target.label);
      console.error('Source:', sourcePath);
      errors.forEach((e) => console.error(' ', e));
      return;
    }

    console.log('[membership-pricing guard] OK —', target.label);
    console.log('  Source:', sourcePath);
    console.log('  Pricing digest (SHA-256):', computePricingDigest(data));
  });

  if (failed) process.exit(1);
}

main();

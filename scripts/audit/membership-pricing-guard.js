/**
 * Deterministic guard: exit 0 only if membership builder JS.js pricing passes validation.
 * Run: npm run guard:membership-pricing
 */

const path = require('path');
const {
  loadMembershipBuilderPricing,
  validateMembershipPricing,
  computePricingDigest,
} = require('./membership-pricing-validate.js');

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const { sourcePath, data } = loadMembershipBuilderPricing(repoRoot);
  const { ok, errors } = validateMembershipPricing(data);
  const digest = computePricingDigest(data);

  if (!ok) {
    console.error('[membership-pricing guard] FAILED');
    console.error('Source:', sourcePath);
    errors.forEach((e) => console.error(' ', e));
    process.exit(1);
  }

  console.log('[membership-pricing guard] OK');
  console.log('Source:', sourcePath);
  console.log('Pricing digest (SHA-256):', digest);
}

main();

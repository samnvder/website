/**
 * Pricing-change wrapper — runs the full gated pricing workflow in order.
 *
 * Gates (sequential, fail-fast):
 *   1. Dry-run  — validate + preview changes without writing files
 *   2. Apply    — write changes with timestamped backups
 *   3. Guard    — structural validation of live JS pricing data
 *   4. Audit    — regenerate PDF/log audit artifacts
 *   5. Diff     — scoped git diff of pricing-only files
 *
 * Usage:
 *   npm run pricing-change
 *   npm run pricing-change -- --input "C:\path\to\pricing.json"
 */

const { execSync } = require('child_process');
const path = require('path');
const {
  TARGET_JS_REL,
  CANONICAL_JSON_REL,
  CANONICAL_MD_REL,
} = require('./membership-pricing-paths.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function forwardedArgs() {
  const args = process.argv.slice(2);
  return args.length > 0 ? ` ${args.join(' ')}` : '';
}

function run(label, cmd) {
  const divider = '='.repeat(60);
  console.log(`\n${divider}`);
  console.log(`GATE: ${label}`);
  console.log(divider);
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error(`\n[pricing-change] FAILED at gate: ${label}`);
    process.exit(err.status || 1);
  }
}

const extra = forwardedArgs();

run('1 — Dry Run', `node scripts/audit/membership-pricing-apply.js --dry-run${extra}`);
run('2 — Apply (with backup)', `node scripts/audit/membership-pricing-apply.js${extra}`);
run('3 — Guard (validation)', 'node scripts/audit/membership-pricing-guard.js');
run('4 — Audit (PDF + log)', 'node scripts/audit/membership-pricing-guard.js && node scripts/audit/membership-pricing-audit-pdf.js');

const diffTargets = [...TARGET_JS_REL, CANONICAL_JSON_REL, CANONICAL_MD_REL]
  .map((p) => `"${p}"`)
  .join(' ');

const divider = '='.repeat(60);
console.log(`\n${divider}`);
console.log('GATE: 5 — Scoped Diff (pricing files only)');
console.log(divider);
try {
  execSync(`git diff -- ${diffTargets}`, { cwd: REPO_ROOT, stdio: 'inherit' });
} catch {
  // git diff exits non-zero when there are differences; not a failure
}

console.log(`\n${'='.repeat(60)}`);
console.log('[pricing-change] All gates passed.');
console.log('Deploy/push only after explicit confirmation.');
console.log('='.repeat(60));

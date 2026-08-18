/**
 * Proof harness for the membership pricing guard.
 * Each case mutates a real pricing file, asserts the mutation actually landed,
 * runs the guard, then restores from git. A case only "passes" if the guard
 * exits non-zero -- and a mutation that no-ops is reported as an invalid test,
 * never as a guard success.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const A = 'Website/Pages/Memberships (Category)/memberships/membership builder JS.js';
const B = 'Website/Pages/Memberships (Category)/memberships/Discounted Enrollment/membership builder JS.js';
const C = 'scripts/audit/membership-pricing-source.json';

const abs = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const write = (p, s) => fs.writeFileSync(abs(p), s, 'utf8');
const restore = () => execFileSync('git', ['checkout', '--', A, B, C], { cwd: ROOT });

function runGuard() {
  const r = spawnSync(process.execPath, ['scripts/audit/membership-pricing-guard.js'], {
    cwd: ROOT, encoding: 'utf8',
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const CASES = [
  ['#9926 single Tier-1 dues 245 -> 265', A,
    (s) => s.replace('single: [245, 225, 205]', 'single: [265, 225, 205]')],
  ['#7315 couple dues drift away from #9926 (420 -> 400)', B,
    (s) => s.replace('couple: [420, 380, 350]', 'couple: [400, 380, 350]')],
  ['#9926 family 3-child Tier-2 dues 445 -> 465', A,
    (s) => s.replace('3: [495, 445, 420]', '3: [495, 465, 420]')],
  ['#9926 enrollment fee couple 500 -> 550', A,
    (s) => s.replace('couple: [500, 450, 400]', 'couple: [550, 450, 400]')],
  ['#9926 F&B minimum $40 -> $45', A,
    (s) => s.replace('couple: "$40"', 'couple: "$45"')],
  ['#7315 discount silently changed 100 -> 50', B,
    (s) => s.replace('single: 100,', 'single: 50,')],
  ['#7315 loses its discounts const entirely', B,
    (s) => s.replace(/\r?\n\s*const discounts = \{[\s\S]*?\r?\n\s*\};\r?\n/, '\r\n')],
  ['#9926 gains a discounts const (promo leaks into join page)', A,
    (s) => s.replace(/(const enrollmentFees = \{[\s\S]*?\r?\n\s*\};\r?\n)/,
      '$1\r\n    const discounts = {\r\n        single: 100,\r\n        couple: 100,\r\n        family: 150\r\n    };\r\n')],
  ['canonical JSON edited, builders not (drift from the other side)', C,
    (s) => s.replace('"1": 245', '"1": 255')],
  ['#9926 tier order inverted (Tier 3 > Tier 1)', A,
    (s) => s.replace('single: [245, 225, 205]', 'single: [205, 225, 245]')],
  ['#9926 dues made non-integer (245 -> 245.5)', A,
    (s) => s.replace('single: [245, 225, 205]', 'single: [245.5, 225, 205]')],
  ['#7315 discount exceeds enrollment fee (100 -> 450, goes negative)', B,
    (s) => s.replace('single: 100,', 'single: 450,')],
];

// Safety: this harness edits real pricing files and restores them with
// `git checkout --`. If any target is already dirty, that restore would destroy
// uncommitted work, so refuse to run instead.
const dirtyBefore = execFileSync('git', ['status', '--porcelain', A, B, C], {
  cwd: ROOT, encoding: 'utf8',
}).trim();
if (dirtyBefore !== '') {
  console.error('[prove-pricing-drift] Refusing to run: pricing files have uncommitted changes.');
  console.error('This harness restores files with `git checkout --`, which would discard them:');
  console.error(dirtyBefore);
  process.exit(2);
}

console.log('=== Baseline (untouched repo) ===');
console.log('   guard exit', runGuard().code, '  (0 = expected)\n');
console.log('=== Drift cases: each MUST exit non-zero ===');

let caught = 0, missed = 0, invalid = 0;
for (const [name, file, mutate] of CASES) {
  const before = read(file);
  const after = mutate(before);
  if (after === before) {
    console.log(`?? MUTATION NO-OP  | ${name}  <- invalid test, not a guard result`);
    invalid++; restore(); continue;
  }
  write(file, after);
  const { code, out } = runGuard();
  if (code === 0) {
    console.log(`!! NOT CAUGHT      | ${name}`);
    missed++;
  } else {
    const detail = out.split(/\r?\n/).find((l) => /^\s+(pricing|enrollmentFees|minimumAmounts|discounts)/.test(l)) || '';
    console.log(`   caught exit ${code}   | ${name}`);
    if (detail) console.log(`        ${detail.trim()}`);
    caught++;
  }
  restore();
}

console.log(`\n=== ${caught} caught / ${missed} missed / ${invalid} invalid tests ===`);
const dirty = execFileSync('git', ['status', '--porcelain', A, B, C], { cwd: ROOT, encoding: 'utf8' }).trim();
console.log('Repo state after proof:', dirty === '' ? 'clean (fully restored)' : `DIRTY:\n${dirty}`);
console.log('Guard on restored repo: exit', runGuard().code, '(0 = passing)');
process.exit(missed === 0 && invalid === 0 && dirty === '' ? 0 : 1);

#!/usr/bin/env node
/*
 * update-pricing.js
 * ----------------------------------------------------------------------------
 * The deterministic "change the prices" flow.
 *
 *   1. Edits the monthly dues in "membership builder JS.js".
 *   2. Shows an old -> new diff so a human (or Claude) can confirm.
 *   3. On --apply, rewrites the JS, then refreshes the audit artifacts
 *      (.log, .pdf, .md, ledger) via pricing-audit.gen.js.
 *   4. Prints exactly what to paste into the live WordPress wpcode snippet #9926.
 *
 * Dues are triples in TIER ORDER:  Tier1,Tier2,Tier3  (matches pricing[type][tier-1]).
 *
 * Usage:
 *   node "update-pricing.js" --single 245,215,195 --couple 390,350,335 --family 490,425,395
 *        (DRY RUN by default — prints the diff, writes nothing)
 *   node "update-pricing.js" --single 245,215,195 --apply
 *        (writes the JS + refreshes audit + prints the live-paste step)
 *
 * Only the types you pass are changed; omit any you want to leave alone.
 * No external dependencies (Node core only).
 * ----------------------------------------------------------------------------
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const SRC = path.join(DIR, 'membership builder JS.js');
const GEN = path.join(DIR, 'pricing-audit.gen.js');
const TYPES = ['single', 'couple', 'family'];

// --- args -------------------------------------------------------------------
const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf('--' + name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}
const APPLY = argv.includes('--apply');
const HELP = argv.includes('--help') || argv.includes('-h') || argv.length === 0;

if (HELP) {
  console.log([
    'Update membership monthly dues (Tier1,Tier2,Tier3 per type).',
    '',
    '  node "update-pricing.js" --single 245,215,195 --couple 390,350,335 --family 490,425,395',
    '  node "update-pricing.js" --family 500,430,400 --apply',
    '',
    'Flags:',
    '  --single a,b,c   Single monthly dues   (Tier 1, Tier 2, Tier 3)',
    '  --couple a,b,c   Couple monthly dues',
    '  --family a,b,c   Family base monthly dues (applies to all child counts 1-6)',
    '  --apply          Write the change (otherwise DRY RUN — shows diff only)',
    '',
    'Omitted types are left unchanged. Enrollment fees and F&B minimums',
    'are edited directly in "membership builder JS.js" (then run pricing-audit.gen.js).'
  ].join('\n'));
  process.exit(0);
}

function parseTriple(label, str) {
  const parts = str.split(',').map(s => s.trim());
  if (parts.length !== 3) fail(label + ': expected 3 comma-separated numbers (Tier1,Tier2,Tier3), got "' + str + '"');
  const nums = parts.map(Number);
  if (nums.some(n => !Number.isInteger(n) || n <= 0)) fail(label + ': values must be positive whole numbers, got "' + str + '"');
  return nums;
}
function fail(msg) { console.error('[update-pricing] ERROR: ' + msg); process.exit(1); }

const wanted = {};
for (const t of TYPES) {
  const raw = flag(t);
  if (raw !== null) wanted[t] = parseTriple(t, raw);
}
if (Object.keys(wanted).length === 0) fail('No price flags given. Pass at least one of --single/--couple/--family. Use --help.');

// --- read current pricing ---------------------------------------------------
let src;
try { src = fs.readFileSync(SRC, 'utf8'); } catch (e) { fail('Cannot read ' + SRC + ' (' + e.message + ')'); }

const block = src.match(/const pricing\s*=\s*\{[\s\S]*?\n\s*\};/);
if (!block) fail('Could not locate the `const pricing = { ... };` block in the source.');
const pricingBlock = block[0];

const dataMatch = src.match(/\/\/ Pricing data([\s\S]*?)function updatePrice/);
let current;
try {
  current = new Function(dataMatch[1] + '\n; return pricing;')();
} catch (e) { fail('Could not parse current pricing: ' + e.message); }
const cur = {
  single: current.single,
  couple: current.couple,
  family: current.family[1]
};

// --- compute diff -----------------------------------------------------------
const T = ['Tier 1', 'Tier 2', 'Tier 3'];
const rows = [];
let changeCount = 0;
for (const t of TYPES) {
  if (!wanted[t]) continue;
  for (let i = 0; i < 3; i++) {
    const before = cur[t][i], after = wanted[t][i];
    const changed = before !== after;
    if (changed) changeCount++;
    rows.push({
      field: (t[0].toUpperCase() + t.slice(1)) + (t === 'family' ? ' base ' : ' ') + T[i],
      before: '$' + before, after: '$' + after, changed
    });
  }
}

console.log('\nProposed monthly dues change' + (APPLY ? '' : '  (DRY RUN)') + ':\n');
const w = Math.max.apply(null, rows.map(r => r.field.length).concat([8]));
console.log('  ' + 'Field'.padEnd(w) + '   Current     New');
console.log('  ' + '-'.repeat(w) + '   -------     -------');
for (const r of rows) {
  console.log('  ' + r.field.padEnd(w) + '   ' + r.before.padEnd(8) + '  ' + r.after.padEnd(8) + (r.changed ? '  <-- change' : ''));
}
console.log('\n  ' + changeCount + ' value(s) will change.\n');

if (changeCount === 0) {
  console.log('[update-pricing] Nothing to do — requested values already match. No write.');
  process.exit(0);
}

if (!APPLY) {
  console.log('[update-pricing] DRY RUN — nothing written. Re-run with --apply to commit the change.');
  process.exit(0);
}

// --- apply: rewrite the pricing block ---------------------------------------
let newBlock = pricingBlock;
if (wanted.single) newBlock = newBlock.replace(/single:\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/, 'single: [' + wanted.single.join(', ') + ']');
if (wanted.couple) newBlock = newBlock.replace(/couple:\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/, 'couple: [' + wanted.couple.join(', ') + ']');
if (wanted.family) newBlock = newBlock.replace(/(\b[1-6]\b):\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/g, '$1: [' + wanted.family.join(', ') + ']');

if (newBlock === pricingBlock) fail('Rewrite produced no change — pricing block format may have shifted; aborting to avoid a bad edit.');

const updated = src.replace(pricingBlock, newBlock);
fs.writeFileSync(SRC, updated, 'utf8');
console.log('[update-pricing] Wrote new dues to: ' + SRC);

// --- refresh audit artifacts ------------------------------------------------
try {
  const out = execFileSync(process.execPath, [GEN], { encoding: 'utf8' });
  process.stdout.write(out);
} catch (e) {
  fail('Pricing JS updated, but audit regeneration failed: ' + e.message);
}

// --- next step: go live -----------------------------------------------------
console.log('\n============================================================');
console.log(' GO LIVE — paste into WordPress');
console.log('============================================================');
console.log(' 1. WP Admin -> Code Snippets (WPCode) -> snippet #9926 (normal join)');
console.log('    ("JS - Build Your Membership - with email notification")');
console.log(' 2. Replace its entire contents with the full contents of:');
console.log('      ' + SRC);
console.log(' 3. Save / Update the snippet.');
console.log(' 4. Tell Claude "pasted it" and Claude will verify the live page matches.');
console.log('============================================================\n');

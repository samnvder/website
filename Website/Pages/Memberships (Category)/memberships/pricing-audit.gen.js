#!/usr/bin/env node
/*
 * pricing-audit.gen.js
 * ----------------------------------------------------------------------------
 * Regenerates membership-pricing-audit.log and membership-pricing-audit.pdf
 * from the canonical pricing in "membership builder JS.js".
 *
 * Run manually:   node "pricing-audit.gen.js"
 * Runs automatically via the project PostToolUse hook whenever the builder
 * JS is edited (see .claude/settings.local.json -> hooks.PostToolUse).
 *
 * No external dependencies (Node core only).
 * ----------------------------------------------------------------------------
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = __dirname;
const SRC = process.env.AUDIT_SRC || path.join(DIR, 'membership builder JS.js');
const LOG = process.env.AUDIT_LOG || path.join(DIR, 'membership-pricing-audit.log');
const PDF = process.env.AUDIT_PDF || path.join(DIR, 'membership-pricing-audit.pdf');
const MD = process.env.AUDIT_MD || path.join(DIR, 'membership-pricing-audit.md');
const LEDGER = process.env.AUDIT_LEDGER || path.join(DIR, 'membership-pricing-audit.ledger.log');

// --- Read source ------------------------------------------------------------
let srcBuf;
try {
  srcBuf = fs.readFileSync(SRC);
} catch (e) {
  console.error('[pricing-audit] Cannot read source: ' + SRC + ' (' + e.message + ')');
  process.exit(1);
}
const src = srcBuf.toString('utf8');

// --- Extract the pricing data block (the four const declarations) -----------
// They live between the "// Pricing data" comment and "function updatePrice".
const block = src.match(/\/\/ Pricing data([\s\S]*?)function updatePrice/);
if (!block) {
  console.error('[pricing-audit] Could not locate the pricing data block in source.');
  process.exit(1);
}
let data;
try {
  // The block is pure data literals (no DOM access) so this is safe to evaluate.
  data = new Function(
    block[1] + '\n; return { pricing, minimumAmounts, enrollmentFees };'
  )();
} catch (e) {
  console.error('[pricing-audit] Failed to parse pricing data: ' + e.message);
  process.exit(1);
}
const { pricing, minimumAmounts, enrollmentFees } = data;

// --- Hashes -----------------------------------------------------------------
function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}
const pricingCanon = canonical({ pricing, minimumAmounts, enrollmentFees });
const srcHash = crypto.createHash('sha256').update(srcBuf).digest('hex');
const priceHash = crypto.createHash('sha256').update(pricingCanon, 'utf8').digest('hex');

// --- Timestamps -------------------------------------------------------------
const now = new Date();
const iso = now.toISOString();
let la;
try {
  la = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'full', timeStyle: 'long' });
} catch (_) {
  la = now.toString();
}
const unix = now.getTime();

// --- Build the report -------------------------------------------------------
// Price arrays are ordered [Tier 1, Tier 2, Tier 3] (lookup is pricing[type][tier-1]).
function tierLine(arr) {
  return 'Tier 1: $' + arr[0] + ', Tier 2: $' + arr[1] + ', Tier 3: $' + arr[2];
}
function enrollLine(type) {
  const f = enrollmentFees[type];
  return type + ': '
    + 'Tier 1 $' + f[0] + ' | '
    + 'Tier 2 $' + f[1] + ' | '
    + 'Tier 3 $' + f[2];
}
const famBase = pricing.family[1]; // same for all child counts 1-6

const lines = [
  '===== Membership Builder — Pricing audit =====',
  'Generated (UTC): ' + iso,
  'Generated (America/Los_Angeles): ' + la,
  'Unix time (ms): ' + unix,
  'Source file: ' + SRC,
  'Source size (bytes): ' + srcBuf.length,
  'SHA-256 (source): ' + srcHash,
  'Pricing digest (SHA-256, canonical JSON): ' + priceHash,
  'Generator: Node ' + process.version + ' | ' + process.platform + ' | pricing-audit.gen.js',
  '',
  '--- Monthly dues (base) ---',
  'Single — ' + tierLine(pricing.single),
  'Couple — ' + tierLine(pricing.couple),
  'Family (monthly base by tier; same tiers as Single/Couple):',
  'All child counts (1–6): Tier 1 $' + famBase[0] + ', Tier 2 $' + famBase[1] + ', Tier 3 $' + famBase[2],
  '',
  '--- Food & beverage assessment (display minimums) ---',
  'Single: ' + minimumAmounts.single,
  'Couple: ' + minimumAmounts.couple,
  'Family: ' + minimumAmounts.family,
  '',
  '--- Enrollment fees (sticker / no promo) ---',
  enrollLine('single'),
  enrollLine('couple'),
  enrollLine('family'),
  '',
  '--- Family monthly add-ons (logic in membership builder JS.js) ---',
  'Base = family base for selected tier and child count (see tables).',
  'If any child age is empty or invalid: monthly due = base only (no add-ons).',
  'When all ages are filled, add-ons apply:',
  '  • Age > 17: +$90 for 1st child; 2nd+ use 100 − (childIndex − 1) × 10 (2nd: +$80, 3rd: +$70, …).',
  '  • Age 14–17: +$15 each.',
  '  • If average age of all children ≤ 6 and at most 2 children: −$30 (one child) or −$20 (two children).',
  '  • For 3rd+ child: if that child’s age > 4, +$20 each.',
  'Final monthly due = base + additional charges (after the adjustments above).',
  '',
  'End of audit (detail sections).',
  '',
  '----- Audit record (closing) -----',
  'Generated (UTC): ' + iso,
  'Source: ' + SRC,
  'Source size (bytes): ' + srcBuf.length,
  'SHA-256 (source): ' + srcHash,
  'Pricing digest (SHA-256): ' + priceHash,
  'End of audit — regenerated automatically by pricing-audit.gen.js; do not edit by hand.'
];

// --- Write .log -------------------------------------------------------------
fs.writeFileSync(LOG, lines.join('\n') + '\n', 'utf8');

// --- Write .pdf (minimal, dependency-free) ----------------------------------
function pdfText(s) {
  return s
    .replace(/[—–]/g, '-')
    .replace(/•/g, '*')
    .replace(/≤/g, '<=')
    .replace(/×/g, 'x')
    .replace(/−/g, '-')
    .replace(/→/g, '->')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}
const fontSize = 9, leading = 12, left = 40, top = 760;
let content = 'BT /F1 ' + fontSize + ' Tf ' + leading + ' TL ' + left + ' ' + top + ' Td\n';
for (const ln of lines) content += '(' + pdfText(ln) + ') Tj T*\n';
content += 'ET';

const objs = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  '<< /Length ' + Buffer.byteLength(content, 'latin1') + ' >>\nstream\n' + content + '\nendstream',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
];
let pdf = '%PDF-1.4\n';
const offsets = [];
for (let i = 0; i < objs.length; i++) {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += (i + 1) + ' 0 obj\n' + objs[i] + '\nendobj\n';
}
const xrefStart = Buffer.byteLength(pdf, 'latin1');
pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
for (const off of offsets) pdf += String(off).padStart(10, '0') + ' 00000 n \n';
pdf += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';
fs.writeFileSync(PDF, Buffer.from(pdf, 'latin1'));

// --- Write .md (human-friendly markdown report) -----------------------------
const md = [
  '# Membership Builder — Pricing Audit',
  '',
  '_Generated: ' + iso + ' (' + la + ')_',
  '',
  '- **Source:** `membership builder JS.js` — ' + srcBuf.length + ' bytes',
  '- **Source SHA-256:** `' + srcHash + '`',
  '- **Pricing digest:** `' + priceHash + '`',
  '',
  '## Monthly dues (base)',
  '',
  '| Type | Tier 1 | Tier 2 | Tier 3 |',
  '| --- | ---: | ---: | ---: |',
  '| Single | $' + pricing.single[0] + ' | $' + pricing.single[1] + ' | $' + pricing.single[2] + ' |',
  '| Couple | $' + pricing.couple[0] + ' | $' + pricing.couple[1] + ' | $' + pricing.couple[2] + ' |',
  '| Family (base) | $' + pricing.family[1][0] + ' | $' + pricing.family[1][1] + ' | $' + pricing.family[1][2] + ' |',
  '',
  '_Family base applies to all child counts (1–6) before age surcharges._',
  '',
  '## Food & beverage assessment (display minimums)',
  '',
  '| Type | Minimum |',
  '| --- | ---: |',
  '| Single | ' + minimumAmounts.single + ' |',
  '| Couple | ' + minimumAmounts.couple + ' |',
  '| Family | ' + minimumAmounts.family + ' |',
  '',
  '## Enrollment fees (sticker / no promo)',
  '',
  '| Type | Tier 1 | Tier 2 | Tier 3 |',
  '| --- | ---: | ---: | ---: |',
  '| Single | $' + enrollmentFees.single[0] +
    ' | $' + enrollmentFees.single[1] +
    ' | $' + enrollmentFees.single[2] + ' |',
  '| Couple | $' + enrollmentFees.couple[0] +
    ' | $' + enrollmentFees.couple[1] +
    ' | $' + enrollmentFees.couple[2] + ' |',
  '| Family | $' + enrollmentFees.family[0] +
    ' | $' + enrollmentFees.family[1] +
    ' | $' + enrollmentFees.family[2] + ' |',
  '',
  '_Discounted enrollment variants live under `Discounted Enrollment/`._',
  '',
  '## Family monthly add-ons',
  '',
  '- Age > 17: **+$90** for the 1st child; 2nd+ use `100 − (childIndex − 1) × 10` (2nd +$80, 3rd +$70, …).',
  '- Age 14–17: **+$15** each.',
  '- If average age of all children ≤ 6 and at most 2 children: **−$30** (one child) or **−$20** (two children).',
  '- 3rd+ child older than 4: **+$20** each.',
  '',
  'Final monthly due = base + add-ons. If any child age is blank/invalid, only the base is shown.',
  '',
  '> Auto-generated by `pricing-audit.gen.js`. Do not edit by hand.',
  ''
].join('\n');
fs.writeFileSync(MD, md, 'utf8');

// --- Append-only ledger (one entry per actual pricing change) ---------------
// A flat, diff-friendly view of every priced field.
function flatPricing() {
  const m = {};
  const T = ['Tier 1', 'Tier 2', 'Tier 3'];
  ['single', 'couple'].forEach(t => T.forEach((tn, i) => { m['Monthly ' + t + ' ' + tn] = pricing[t][i]; }));
  T.forEach((tn, i) => { m['Monthly family-base ' + tn] = pricing.family[1][i]; });
  ['single', 'couple', 'family'].forEach(t => { m['F&B ' + t] = minimumAmounts[t]; });
  ['single', 'couple', 'family'].forEach(t => {
    T.forEach((tn, i) => { m['Enrollment ' + t + ' ' + tn] = enrollmentFees[t][i]; });
  });
  return m;
}
function fmtVal(v) { return v === undefined ? '(none)' : (typeof v === 'number' ? '$' + v : String(v)); }
function diffMaps(prev, cur) {
  const out = [];
  Object.keys(cur).forEach(k => {
    const a = prev ? prev[k] : undefined;
    if (String(a) !== String(cur[k])) {
      out.push('    - ' + k + ': ' + (prev ? fmtVal(a) + ' → ' + fmtVal(cur[k]) : fmtVal(cur[k])));
    }
  });
  return out;
}

// Find the most recent recorded digest/data in the existing ledger.
let lastDigest = null, lastData = null, ledgerExists = false;
if (fs.existsSync(LEDGER)) {
  ledgerExists = true;
  const txt = fs.readFileSync(LEDGER, 'utf8');
  const dm = txt.match(/^# digest: (.+)$/gm);
  if (dm) lastDigest = dm[dm.length - 1].replace('# digest: ', '').trim();
  const pm = txt.match(/^# data: (.+)$/gm);
  if (pm) { try { lastData = JSON.parse(pm[pm.length - 1].replace('# data: ', '')); } catch (_) {} }
}

let ledgerStatus;
if (lastDigest === priceHash) {
  ledgerStatus = 'unchanged (no new ledger entry)';
} else {
  const curMap = flatPricing();
  const changes = diffMaps(lastData, curMap);
  let entry = '';
  if (!ledgerExists) {
    entry += '===== Membership Builder — Pricing CHANGE LEDGER (append-only) =====\n';
    entry += 'One block per recorded pricing change, oldest first / newest at the bottom.\n';
    entry += 'Maintained by pricing-audit.gen.js. Do not edit by hand.\n\n';
  }
  entry += '================================================================================\n';
  entry += (lastDigest === null ? 'Initial baseline entry\n' : 'Pricing change recorded\n');
  entry += '  When (UTC):     ' + iso + '\n';
  entry += '  When (local):   ' + la + '\n';
  entry += '  Source size:    ' + srcBuf.length + ' bytes\n';
  entry += '  Source SHA-256: ' + srcHash + '\n';
  entry += '  Pricing digest: ' + priceHash + '\n';
  entry += '  Changes:\n';
  entry += (changes.length ? changes.join('\n') + '\n' : '    - (digest changed; summarized fields identical)\n');
  entry += '  Snapshot:\n';
  entry += '    Monthly dues (T1/T2/T3) — Single $' + pricing.single.join('/$') +
           ' · Couple $' + pricing.couple.join('/$') +
           ' · Family base $' + pricing.family[1].join('/$') + '\n';
  entry += '    F&B — Single ' + minimumAmounts.single + ' · Couple ' + minimumAmounts.couple +
           ' · Family ' + minimumAmounts.family + '\n';
  entry += '    Enrollment (T1/T2/T3) — single $' + enrollmentFees.single.join('/$') +
           ' · couple $' + enrollmentFees.couple.join('/$') +
           ' · family $' + enrollmentFees.family.join('/$') + '\n';
  entry += '# digest: ' + priceHash + '\n';
  entry += '# data: ' + JSON.stringify(curMap) + '\n';
  fs.appendFileSync(LEDGER, entry, 'utf8');
  ledgerStatus = (lastDigest === null ? 'baseline entry appended' : 'change entry appended');
}

console.log('[pricing-audit] Regenerated:');
console.log('  ' + LOG);
console.log('  ' + PDF);
console.log('  ' + MD);
console.log('  ledger: ' + LEDGER + ' (' + ledgerStatus + ')');
console.log('  source SHA-256: ' + srcHash);
console.log('  pricing digest: ' + priceHash);

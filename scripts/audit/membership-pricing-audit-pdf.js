/**
 * Membership Builder — pricing audit (PDF + plain log).
 * Reads Website/Pages/.../membership builder JS.js, parses pricing constants, and writes:
 *   - membership-pricing-audit.pdf
 *   - membership-pricing-audit.log
 * next to the source file.
 *
 * Run from Website repo root: npm run audit:membership-pricing
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const PDFDocument = require('pdfkit');

const {
  loadMembershipBuilderPricing,
  assertValidMembershipPricing,
  computePricingDigest,
} = require('./membership-pricing-validate.js');

function gitMeta(cwd) {
  try {
    return {
      branch: execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf8' }).trim(),
      short: execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf8' }).trim(),
      full: execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim(),
      dirty:
        execSync('git status --porcelain', { cwd, encoding: 'utf8' }).trim().length > 0,
    };
  } catch {
    return null;
  }
}

/** Always-on timestamps + environment (audit trail). */
function buildRunContext(now = new Date()) {
  const generatedUtc = now.toISOString();
  const la = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(now);
  return {
    generatedUtc,
    generatedLosAngeles: `${la} (America/Los_Angeles)`,
    unixMs: now.getTime(),
    node: process.version,
    platform: process.platform,
    hostname: os.hostname(),
  };
}

function assertAuditMeta(meta) {
  const required = [
    'generatedUtc',
    'generatedLosAngeles',
    'unixMs',
    'sourcePath',
    'sourceBytes',
    'sha256',
    'pricingDigest',
    'node',
    'hostname',
  ];
  for (const k of required) {
    if (meta[k] === undefined || meta[k] === null || meta[k] === '') {
      throw new Error(`Audit meta incomplete: missing or empty "${k}"`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(meta.generatedUtc)) {
    throw new Error('Audit meta incomplete: generatedUtc must be ISO-8601');
  }
}

function formatMoney(n) {
  return `$${n}`;
}

function familyBaseSummary(pricing) {
  const f = pricing.family;
  const keys = Object.keys(f).map(Number).sort((a, b) => a - b);
  const first = f[keys[0]];
  const same = keys.every((k) => JSON.stringify(f[k]) === JSON.stringify(first));
  if (same) {
    return `All child counts (${keys[0]}–${keys[keys.length - 1]}): Tier 1 ${formatMoney(first[0])}, Tier 2 ${formatMoney(first[1])}, Tier 3 ${formatMoney(first[2])}`;
  }
  return keys.map((k) => `${k} children: T1 ${formatMoney(f[k][0])}, T2 ${formatMoney(f[k][1])}, T3 ${formatMoney(f[k][2])}`).join('\n');
}

const FAMILY_RULES = [
  'Base = family base for selected tier and child count (see tables).',
  'If any child age is empty or invalid: monthly due = base only (no add-ons).',
  'When all ages are filled, add-ons apply:',
  '  • Age > 17: +$90 for 1st child; 2nd+ use 100 − (childIndex − 1) × 10 (2nd: +$80, 3rd: +$70, …).',
  '  • Age 14–17: +$15 each.',
  '  • If average age of all children ≤ 6 and at most 2 children: −$30 (one child) or −$20 (two children).',
  '  • For 3rd+ child: if that child’s age > 4, +$20 each.',
  'Final monthly due = base + additional charges (after the adjustments above).',
];

function buildMetaBlock(meta) {
  const lines = [];
  lines.push('===== Membership Builder — Pricing audit =====');
  lines.push(`Generated (UTC): ${meta.generatedUtc}`);
  lines.push(`Generated (America/Los_Angeles): ${meta.generatedLosAngeles}`);
  lines.push(`Unix time (ms): ${meta.unixMs}`);
  lines.push(`Source file: ${meta.sourcePath}`);
  lines.push(`Source size (bytes): ${meta.sourceBytes}`);
  lines.push(`SHA-256 (source): ${meta.sha256}`);
  lines.push(`Pricing digest (SHA-256, canonical JSON): ${meta.pricingDigest}`);
  lines.push(`Generator: Node ${meta.node} | ${meta.platform} | ${meta.hostname}`);
  if (meta.git) {
    lines.push(
      `Git: ${meta.git.branch} @ ${meta.git.short}${meta.git.dirty ? ' (working tree dirty)' : ''}`
    );
    lines.push(`Commit: ${meta.git.full}`);
  } else {
    lines.push('Git: (not available)');
  }
  return lines.join('\n');
}

function buildClosingBlock(meta) {
  const lines = [];
  lines.push('----- Audit record (closing) -----');
  lines.push(`Generated (UTC): ${meta.generatedUtc}`);
  lines.push(`Generated (America/Los_Angeles): ${meta.generatedLosAngeles}`);
  lines.push(`Unix time (ms): ${meta.unixMs}`);
  lines.push(`Source: ${meta.sourcePath}`);
  lines.push(`Source size (bytes): ${meta.sourceBytes}`);
  lines.push(`SHA-256 (source): ${meta.sha256}`);
  lines.push(`Pricing digest (SHA-256): ${meta.pricingDigest}`);
  lines.push('End of audit — same run as header; do not append by hand.');
  return lines.join('\n');
}

function buildDetailText({ pricing, minimumAmounts, enrollmentFees, discounts }) {
  const lines = [];
  lines.push('--- Monthly dues (base) ---');
  lines.push(
    `Single — Tier 1: ${formatMoney(pricing.single[0])}, Tier 2: ${formatMoney(pricing.single[1])}, Tier 3: ${formatMoney(pricing.single[2])}`
  );
  lines.push(
    `Couple — Tier 1: ${formatMoney(pricing.couple[0])}, Tier 2: ${formatMoney(pricing.couple[1])}, Tier 3: ${formatMoney(pricing.couple[2])}`
  );
  lines.push('Family (monthly base by tier; same tiers as Single/Couple):');
  lines.push(familyBaseSummary(pricing));
  lines.push('');
  lines.push('--- Food & beverage assessment (display minimums) ---');
  lines.push(`Single: ${minimumAmounts.single}`);
  lines.push(`Couple: ${minimumAmounts.couple}`);
  lines.push(`Family: ${minimumAmounts.family}`);
  lines.push('');
  lines.push('--- Enrollment fees (before / after promo discount) ---');
  ['single', 'couple', 'family'].forEach((t) => {
    const orig = enrollmentFees[t];
    const d = discounts[t];
    lines.push(
      `${t}: Tier 1 ${formatMoney(orig[0])} → ${formatMoney(orig[0] - d)} | Tier 2 ${formatMoney(orig[1])} → ${formatMoney(
        orig[1] - d
      )} | Tier 3 ${formatMoney(orig[2])} → ${formatMoney(orig[2] - d)} (discount $${d})`
    );
  });
  lines.push('');
  lines.push('--- Family monthly add-ons (logic in membership builder JS.js) ---');
  FAMILY_RULES.forEach((r) => lines.push(r));
  lines.push('');
  lines.push('End of audit (detail sections).');
  return lines.join('\n');
}

function writePdfHeader(doc, meta) {
  const blue = '#0b468c';
  const ink = '#204147';
  doc.fillColor(blue).font('Helvetica-Bold').fontSize(16).text('Membership Builder — Pricing audit');
  doc.moveDown(0.5);
  doc.fillColor(ink).font('Helvetica').fontSize(9);
  doc.text(`Generated (UTC): ${meta.generatedUtc}`);
  doc.text(`Generated (America/Los_Angeles): ${meta.generatedLosAngeles}`);
  doc.text(`Unix time (ms): ${meta.unixMs}`);
  doc.text(`SHA-256 (source): ${meta.sha256}`);
  doc.text(`Pricing digest (canonical): ${meta.pricingDigest}`);
  doc.text(`Source size (bytes): ${meta.sourceBytes}`);
  if (meta.git) {
    doc.text(`Git: ${meta.git.branch} @ ${meta.git.short}${meta.git.dirty ? ' — working tree dirty' : ''}`);
    doc.fillColor('#64748b').fontSize(8).text(meta.git.full, { width: 500 });
    doc.fillColor(ink).fontSize(9);
  }
  doc.text(`Source: ${meta.sourcePath}`, { width: 500 });
  doc.text(`Generator: Node ${meta.node} | ${meta.platform} | ${meta.hostname}`);
  doc.moveDown(1);
}

function writePdf(detailText, closingText, meta, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 56, bottom: 56, left: 56, right: 56 } });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const blue = '#0b468c';
    const ink = '#204147';
    const lines = detailText.split('\n');

    writePdfHeader(doc, meta);

    doc.fontSize(10);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.startsWith('--- ') && line.endsWith(' ---')) {
        doc.moveDown(0.5);
        doc.fillColor(blue).font('Helvetica-Bold').text(line.replace(/^---\s+|\s+---$/g, ''));
        doc.fillColor(ink).font('Helvetica');
      } else if (line.trim() === '') {
        doc.moveDown(0.2);
      } else {
        doc.text(line, { width: 500 });
      }
    }

    doc.moveDown(0.8);
    doc.fontSize(8).fillColor('#64748b').text('Regenerate: npm run audit:membership-pricing', { width: 500 });

    doc.addPage();
    doc.fillColor(ink).font('Helvetica').fontSize(9);
    closingText.split('\n').forEach((line) => {
      if (line.startsWith('-----') && line.endsWith('-----')) {
        doc.moveDown(0.5);
        doc.fillColor(blue).font('Helvetica-Bold').text(line.replace(/^-+\s*|\s*-+$/g, '').trim());
        doc.fillColor(ink).font('Helvetica');
      } else if (line.trim() === '') {
        doc.moveDown(0.2);
      } else {
        doc.text(line, { width: 500 });
      }
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');

  const loaded = loadMembershipBuilderPricing(repoRoot);
  const { sourcePath, sourceBytes, sha256, data } = loaded;

  assertValidMembershipPricing(data);
  const pricingDigest = computePricingDigest(data);

  const ctx = buildRunContext();

  const meta = {
    ...ctx,
    sourcePath,
    sourceBytes,
    sha256,
    pricingDigest,
    git: gitMeta(repoRoot),
  };

  assertAuditMeta(meta);

  const metaBlock = buildMetaBlock(meta);
  const detailText = buildDetailText(data);
  const closingBlock = buildClosingBlock(meta);
  const fullLog = `${metaBlock}\n\n${detailText}\n\n${closingBlock}`;

  const outDir = path.dirname(sourcePath);
  const logPath = path.join(outDir, 'membership-pricing-audit.log');
  const pdfPath = path.join(outDir, 'membership-pricing-audit.pdf');

  fs.writeFileSync(logPath, fullLog, 'utf8');
  console.log(
    `[membership-pricing-audit] ${meta.generatedUtc} | ${meta.generatedLosAngeles.split('(')[0].trim()} | log + pdf`
  );
  console.log('Wrote log:', logPath);

  await writePdf(detailText, closingBlock, meta, pdfPath);
  console.log('Wrote PDF:', pdfPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

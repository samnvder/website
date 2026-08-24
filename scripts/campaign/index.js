#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, TARGETS, abs, LEGACY_HOMEPAGE } = require('./paths');
const { parseEmail } = require('./parse-email');
const { assertApplyReady, PARKED, describeArchive, validateManifest } = require('./manifest');
const { archiveCurrentSources, defaultArchiveSet } = require('./archive');
const { applyManifestToRepo, readState } = require('./apply');
const { park } = require('./park');
const { verify } = require('./verify');

function printHelp() {
  const msg = `
Membership campaign engine — IDE/LLM agnostic.

  node scripts/campaign/index.js prepare --input <email.html> [--slug kebab]
  node scripts/campaign/index.js apply --id <campaign-id>
  node scripts/campaign/index.js verify
  node scripts/campaign/index.js park
  node scripts/campaign/index.js bootstrap

prepare  reads email HTML (file or stdin), writes scripts/campaign/work/<id>/
         campaign.json + email-source.html. Does not change page sources.

apply    requires campaign.json status "approved". Archives current sources,
         writes landing page / builder JS / homepage banner / global button,
         and generates patches/<id>/ paste artifacts.

verify   checks markers and generated sources stay in sync.

park     archives the active campaign (if any) and restores OFFER NOT SET
         placeholders.

bootstrap  one-time: archive the last saved summer sources, install markers,
           park active files. Safe to re-run (archives will no-op if identical).
`.trim();
  console.log(msg);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { action: args[0] || 'help', input: null, slug: null, id: null, dryRun: false };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--input' || a === '-i') out.input = args[++i];
    else if (a === '--slug') out.slug = args[++i];
    else if (a === '--id') out.id = args[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.action = 'help';
    else throw new Error('Unknown argument: ' + a);
  }
  return out;
}

function readInput(opts) {
  if (opts.input) return fs.readFileSync(path.resolve(opts.input), 'utf8');
  if (process.stdin.isTTY) {
    throw new Error('prepare needs --input <file> or stdin');
  }
  return fs.readFileSync(0, 'utf8');
}

function writeWork(repoRoot, manifest, emailHtml) {
  const dir = abs(repoRoot, path.join(TARGETS.workDir, manifest.id));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'email-source.html'), emailHtml);
  fs.writeFileSync(path.join(dir, 'campaign.json'), JSON.stringify(manifest, null, 2).replace(/\r\n/g, '\n') + '\n');
  return dir;
}

function loadApproved(repoRoot, id) {
  const p = abs(repoRoot, path.join(TARGETS.workDir, id, 'campaign.json'));
  if (!fs.existsSync(p)) {
    throw new Error('No work manifest at ' + p + ' — run prepare first.');
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function copyEmailToCampaigns(repoRoot, manifest, emailHtml) {
  const dir = abs(repoRoot, path.join(TARGETS.campaignsDir, manifest.id));
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, 'email-source.html');
  if (fs.existsSync(dest)) {
    console.log('[campaign] campaigns/' + manifest.id + '/email-source.html already exists — leaving it (immutable).');
    return dest;
  }
  fs.writeFileSync(dest, emailHtml);
  return dest;
}

function cmdPrepare(opts) {
  const html = readInput(opts);
  const manifest = parseEmail(html, { slug: opts.slug });
  const dir = writeWork(ROOT, manifest, html);
  console.log('[campaign] draft written to ' + dir);
  console.log('[campaign] id:     ' + manifest.id);
  console.log('[campaign] tag:    ' + manifest.offerTag);
  console.log('[campaign] enroll: ' + manifest.enrollment);
  console.log('[campaign] ends:   ' + manifest.endDateISO);
  if (manifest.ambiguities.length) {
    console.log('[campaign] ambiguities (' + manifest.ambiguities.length + ') — resolve in campaign.json before apply:');
    manifest.ambiguities.forEach((a) => console.log('  - ' + a.field + ': ' + a.message));
  } else {
    console.log('[campaign] no ambiguities. Set "status": "approved" in campaign.json, then apply.');
  }
  const errs = validateManifest(manifest);
  if (errs.length) {
    console.log('[campaign] not apply-ready yet:');
    errs.forEach((e) => console.log('  - ' + e));
  }
}

function logArchiveReport(report) {
  report.forEach((r) => {
    if (r.reason === 'missing') console.log('[campaign] archive skip (missing): ' + r.rel);
    else if (r.reason === 'exists') console.log('[campaign] archive exists, leaving it: ' + path.basename(r.dest || r.rel));
    else if (r.skipped) console.log('[campaign] archive already identical: ' + r.rel);
    else console.log('[campaign] archived ' + r.rel);
  });
}

function cmdApply(opts) {
  if (!opts.id) throw new Error('apply requires --id <campaign-id>');
  const manifest = loadApproved(ROOT, opts.id);
  assertApplyReady(manifest);
  const state = readState(ROOT);
  const label = state.manifest ? describeArchive(state.manifest) : (state.archiveLabel || 'previous-campaign');
  if (opts.dryRun) {
    applyManifestToRepo(ROOT, manifest, { dryRun: true, archiveLabel: label });
    console.log('[campaign] dry-run — sources not written.');
    return;
  }
  logArchiveReport(archiveCurrentSources(ROOT, label, defaultArchiveSet(ROOT)));
  const workEmail = abs(ROOT, path.join(TARGETS.workDir, manifest.id, 'email-source.html'));
  copyEmailToCampaigns(ROOT, manifest, fs.readFileSync(workEmail, 'utf8'));
  const applied = { ...manifest, status: 'active' };
  const result = applyManifestToRepo(ROOT, applied, { archiveLabel: label });
  console.log('[campaign] applied ' + manifest.id);
  console.log('[campaign] patches: ' + result.patchDir);
}

function cmdPark(opts) {
  const out = park(ROOT, { dryRun: opts.dryRun });
  console.log('[campaign] parked. archive label: ' + out.label);
}

function cmdVerify() {
  const out = verify(ROOT, { strictArchives: true });
  if (!out.ok) {
    console.error('[campaign] verify FAILED');
    out.failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('[campaign] verify OK');
}

function cmdBootstrap() {
  const label = '2026-07-summer-special-100-enrollment-10-guest-passes';
  const report = archiveCurrentSources(ROOT, label, defaultArchiveSet(ROOT), { ifExists: 'skip' });
  report.forEach((r) => {
    if (r.reason === 'missing') console.log('[campaign] bootstrap archive skip: ' + r.rel);
    else if (r.skipped) console.log('[campaign] bootstrap archive exists: ' + path.basename(r.dest || r.rel));
    else console.log('[campaign] bootstrap archived ' + r.rel);
  });

  applyManifestToRepo(ROOT, PARKED, { archiveLabel: label });

  LEGACY_HOMEPAGE.forEach((rel) => {
    const full = abs(ROOT, rel);
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
      console.log('[campaign] removed superseded ' + rel);
    }
  });

  const out = verify(ROOT, { strictArchives: true });
  if (!out.ok) {
    console.error('[campaign] bootstrap verify FAILED');
    out.failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('[campaign] bootstrap OK — sources parked with markers.');
}

function main() {
  const opts = parseArgs(process.argv);
  switch (opts.action) {
    case 'prepare':
      cmdPrepare(opts);
      break;
    case 'apply':
      cmdApply(opts);
      break;
    case 'verify':
      cmdVerify();
      break;
    case 'park':
      cmdPark(opts);
      break;
    case 'bootstrap':
      cmdBootstrap();
      break;
    case 'help':
    default:
      printHelp();
      if (opts.action !== 'help' && opts.action) {
        throw new Error('Unknown action: ' + opts.action);
      }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[campaign] ' + err.message);
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
  parseEmail,
  PARKED,
  verify,
  applyManifestToRepo,
};

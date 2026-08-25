'use strict';

const fs = require('fs');
const { ROOT, TARGETS, abs, markerStart } = require('./paths');
const { PARKED, describeArchive } = require('./manifest');
const { archiveCurrentSources, defaultArchiveSet } = require('./archive');
const { applyManifestToRepo, readState } = require('./apply');

function park(repoRoot, opts = {}) {
  const root = repoRoot || ROOT;
  const state = readState(root);
  const active = state.status === 'active' && state.manifest;
  const label = active
    ? describeArchive(state.manifest)
    : (state.archiveLabel || 'parked-previous');

  let archiveReport = [];
  const shouldArchive = active && !opts.skipArchive && !opts.dryRun;
  if (shouldArchive) {
    archiveReport = archiveCurrentSources(root, label, defaultArchiveSet(root));
  }

  const result = applyManifestToRepo(root, PARKED, {
    dryRun: !!opts.dryRun,
    archiveLabel: label,
  });

  return { archiveReport, result, label };
}

function needsBootstrap(repoRoot) {
  const page = fs.readFileSync(abs(repoRoot, TARGETS.page), 'utf8');
  return !page.includes(markerStart('PROMO'));
}

module.exports = { park, needsBootstrap };

'use strict';

const fs = require('fs');
const path = require('path');
const { TARGETS, LEGACY_HOMEPAGE, abs } = require('./paths');

function copyExact(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, fs.readFileSync(src));
}

function archiveFile(srcAbs, destDirAbs, label, roleExt, opts = {}) {
  const dest = path.join(destDirAbs, `${label}--${roleExt}`);
  if (fs.existsSync(dest)) {
    if (opts.ifExists === 'skip') return { dest, skipped: true, reason: 'exists' };
    const a = fs.readFileSync(srcAbs);
    const b = fs.readFileSync(dest);
    if (Buffer.compare(a, b) === 0) return { dest, skipped: true };
    throw new Error(`Archive already exists and differs: ${dest}`);
  }
  copyExact(srcAbs, dest);
  return { dest, skipped: false };
}

function archiveCurrentSources(repoRoot, label, files, opts = {}) {
  const report = [];
  files.forEach((item) => {
    const src = abs(repoRoot, item.rel);
    if (!fs.existsSync(src)) {
      report.push({ rel: item.rel, skipped: true, reason: 'missing' });
      return;
    }
    const destDir = abs(repoRoot, item.archiveDir);
    const result = archiveFile(src, destDir, label, item.role, opts);
    report.push({ rel: item.rel, dest: result.dest, skipped: result.skipped, reason: result.reason });
  });
  return report;
}

function defaultArchiveSet(repoRoot) {
  const set = [
    {
      rel: TARGETS.page,
      archiveDir: TARGETS.pageArchiveDir,
      role: 'Special-Offer.html',
    },
    {
      rel: TARGETS.builderJs,
      archiveDir: TARGETS.pageArchiveDir,
      role: 'membership-builder-JS-special-offer.js',
    },
  ];
  if (fs.existsSync(abs(repoRoot, TARGETS.homepageBanner))) {
    set.push({
      rel: TARGETS.homepageBanner,
      archiveDir: TARGETS.homepageArchiveDir,
      role: 'Homepage-Campaign-Banner.html',
    });
  }
  LEGACY_HOMEPAGE.forEach((rel) => {
    if (fs.existsSync(abs(repoRoot, rel))) {
      set.push({
        rel,
        archiveDir: TARGETS.homepageArchiveDir,
        role: path.basename(rel).replace(/\s+/g, '-'),
      });
    }
  });
  if (fs.existsSync(abs(repoRoot, TARGETS.globalButton))) {
    set.push({
      rel: TARGETS.globalButton,
      archiveDir: TARGETS.sharedArchiveDir,
      role: 'Global-Special-Offer-Button.html',
    });
  }
  return set;
}

function isArchiveRel(relPosix) {
  return /(^|\/)Archive\//.test(relPosix);
}

module.exports = {
  copyExact,
  archiveFile,
  archiveCurrentSources,
  defaultArchiveSet,
  isArchiveRel,
};

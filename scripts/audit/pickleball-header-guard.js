#!/usr/bin/env node
/**
 * Deterministic guard: Pickleball HTML pages must include the shared header markers
 * and a Profile affordance (Open Play profile panel or League header profile link).
 *
 * Run: npm run guard:pickleball-header
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const SCAN_DIRS = [
  path.join(repoRoot, 'Programs', 'Pickleball', 'live'),
  path.join(repoRoot, 'Programs', 'Pickleball', 'advanced-open-play', 'staging'),
  path.join(repoRoot, 'Programs', 'Pickleball', 'league-play'),
];

function hasHeaderClass(html) {
  return /\bclass\s*=\s*["'][^"']*\bheader\b[^"']*["']/i.test(html);
}

function checkFile(absPath) {
  const rel = path.relative(repoRoot, absPath).replace(/\\/g, '/');
  const html = fs.readFileSync(absPath, 'utf8');
  const failures = [];

  if (!hasHeaderClass(html)) failures.push('missing .header (class includes "header")');
  if (!html.includes('hdr-eyebrow')) failures.push('missing .hdr-eyebrow');
  if (!html.includes('hdr-title')) failures.push('missing .hdr-title');
  if (!html.includes('hdr-sub')) failures.push('missing .hdr-sub');

  // Pre-auth pages (e.g. password reset) legitimately have no logged-in profile UI.
  const isPreAuthPage = /forgot[_-]?password/i.test(rel);
  if (!isPreAuthPage) {
    const profileOk =
      html.includes('openplay-profile-panel.js') || html.includes('league-header-profile');
    if (!profileOk) {
      failures.push(
        'missing profile affordance (openplay-profile-panel.js or league-header-profile)'
      );
    }
  }

  return { rel, failures };
}

function main() {
  const all = [];
  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) {
      console.error('[pickleball-header-guard] missing dir:', dir);
      process.exit(1);
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.html')) {
        all.push(path.join(dir, e.name));
      }
    }
  }

  const bad = [];
  for (const f of all.sort()) {
    const r = checkFile(f);
    if (r.failures.length) bad.push(r);
  }

  if (bad.length) {
    console.error('[pickleball-header-guard] FAILED');
    for (const b of bad) {
      console.error(' ', b.rel);
      b.failures.forEach((msg) => console.error('   -', msg));
    }
    process.exit(1);
  }

  console.log('[pickleball-header-guard] OK (' + all.length + ' HTML files)');
}

main();

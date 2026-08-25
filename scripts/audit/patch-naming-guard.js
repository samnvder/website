/*
 * guard:patch-naming — deterministic enforcement of the patches/ naming law
 * (owner-mandated 2026-08-21; convention in patches/README.md).
 *
 * For every directory under patches/:
 *   1. It must contain a README.md.
 *   2. Every top-level file except README.md and .gitignore must be named
 *      "<dir-name>--<descriptor>.<ext>" (one-off patches), or
 *      "<ROLE>--<dir-name>.<ext>" (campaign packs: PAGE / HOME / WPCODE first
 *      so Notepad taskbar titles distinguish them).
 *
 * Files inside subdirectories are exempt (e.g. live-blocks/ contents).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PATCHES = path.join(ROOT, 'patches');
const EXEMPT = new Set(['README.md', '.gitignore']);
const ROLE_FIRST = /^(PAGE|HOME|WPCODE|YOAST|PROMO|BUILDER|PREVIEW|GEN)--(.+)\.(html|js|md)$/;

function isNamedOk(dir, name) {
  if (name.startsWith(dir + '--')) return true;
  const m = name.match(ROLE_FIRST);
  return Boolean(m && m[2] === dir);
}

let failures = 0;
const fail = msg => { failures++; console.error('  ✗ ' + msg); };

const dirs = fs.readdirSync(PATCHES, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const dir of dirs) {
  const full = path.join(PATCHES, dir);
  const entries = fs.readdirSync(full, { withFileTypes: true });
  // An empty dir is another session's just-created workspace (its files live
  // on that session's branch) — git cannot track it, so there is nothing to name.
  if (entries.length === 0) continue;
  if (!entries.some(e => e.isFile() && e.name === 'README.md')) {
    fail('patches/' + dir + '/ has no README.md');
  }
  for (const e of entries) {
    if (!e.isFile() || EXEMPT.has(e.name)) continue;
    if (!isNamedOk(dir, e.name)) {
      fail('patches/' + dir + '/' + e.name + ' — must be named "' + dir + '--<role>.<ext>" or "<ROLE>--' + dir + '.<ext>"');
    }
  }
}

if (failures) {
  console.error('[patch-naming-guard] FAILED — ' + failures + ' problem(s). Convention: patches/README.md');
  process.exit(1);
}
console.log('[patch-naming-guard] OK — ' + dirs.length + ' patch dirs follow the naming law.');

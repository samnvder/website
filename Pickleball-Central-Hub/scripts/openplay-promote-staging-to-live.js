#!/usr/bin/env node
/**
 * Copy advanced-open-play/staging → live (promotion for production deploy).
 * Requires OPENPLAY_CONFIRM_PROMOTE=1 to avoid accidents.
 */
const fs = require('fs');
const path = require('path');

const OPENPLAY_ROOT = path.join(__dirname, '..');
const PICKLEBALL_PROGRAM_ROOT = OPENPLAY_ROOT;
const LIVE = path.join(PICKLEBALL_PROGRAM_ROOT, 'live');
const STAGING = path.join(OPENPLAY_ROOT, 'staging');

function mkdirp(d) {
  fs.mkdirSync(d, { recursive: true });
}

function copyRecursive(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    mkdirp(dest);
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    mkdirp(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

if (process.env.OPENPLAY_CONFIRM_PROMOTE !== '1') {
  console.error('');
  console.error('[openplay-promote] BLOCKED: This overwrites Programs/Pickleball/live from staging.');
  console.error('Run: set OPENPLAY_CONFIRM_PROMOTE=1 (Windows) or export OPENPLAY_CONFIRM_PROMOTE=1 (Unix)');
  console.error('Then: npm run openplay:promote');
  console.error('');
  process.exit(1);
}

if (!fs.existsSync(STAGING)) {
  console.error('[openplay-promote] missing staging — run npm run openplay:bootstrap-staging');
  process.exit(1);
}

console.log('[openplay-promote] replacing live/ from staging/ …');
if (fs.existsSync(LIVE)) {
  fs.rmSync(LIVE, { recursive: true, force: true });
}
mkdirp(LIVE);
copyRecursive(STAGING, LIVE);
console.log('[openplay-promote] OK. Set openplay-mode.json activeTree to "live" and deploy when ready.');

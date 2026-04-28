#!/usr/bin/env node
/**
 * Copy Programs/Pickleball/live → staging (first-time or full reset).
 * Overwrites Firebase config too. To refresh staging from live but **keep** staging
 * `js/openplay-firebase-config.js` (+ `.example.js`), use `npm run openplay:sync-from-live`.
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

if (!fs.existsSync(LIVE)) {
  console.error('[openplay-bootstrap-staging] missing:', LIVE);
  process.exit(1);
}

if (fs.existsSync(STAGING)) {
  console.log('[openplay-bootstrap-staging] replacing existing staging/ from live/ …');
  fs.rmSync(STAGING, { recursive: true, force: true });
}

mkdirp(STAGING);
copyRecursive(LIVE, STAGING);
console.log('[openplay-bootstrap-staging] OK:', STAGING);

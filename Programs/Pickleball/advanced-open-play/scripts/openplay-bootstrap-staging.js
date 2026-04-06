#!/usr/bin/env node
/**
 * Copy advanced-open-play/live → staging (first-time or refresh staging from live).
 * Excludes nothing by default — full tree copy for HTML + js.
 */
const fs = require('fs');
const path = require('path');

const PICKLEBALL = path.join(__dirname, '..');
const LIVE = path.join(PICKLEBALL, 'live');
const STAGING = path.join(PICKLEBALL, 'staging');

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

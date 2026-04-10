#!/usr/bin/env node
/**
 * Firebase deploy wrapper — blocks production hosting until mode + confirmation allow it.
 *
 * Production hosting always deploys firebase.json → Programs/Pickleball/advanced-open-play/live.
 * If activeTree is "staging", your latest edits are NOT in live/ — promote first.
 *
 * Unblock hosting deploy:
 *   - Set openplay-mode.json: "activeTree": "live", "allowProductionHostingDeploy": true
 *   - OR set OPENPLAY_CONFIRM_PRODUCTION=1 (one-shot override; still requires activeTree live)
 */
const { spawnSync } = require('child_process');
const path = require('path');
const { readMode, getActiveTreeName } = require('./openplay-resolve-tree.js');

const WEBSITE_ROOT = path.join(__dirname, '..', '..', '..', '..');
const fa = process.argv.slice(2);

if (fa.length === 0) {
  console.error('Usage: node openplay-deploy.js --only hosting');
  console.error('Example: node openplay-deploy.js --only hosting,database');
  process.exit(1);
}

const argStr = fa.join(' ');
const onlyMatch = argStr.match(/--only\s+([\w,-]+)/);
let scopes = null;
if (onlyMatch) {
  scopes = onlyMatch[1].split(',').map(function (s) {
    return s.trim();
  });
}
const isHosting = scopes === null || scopes.indexOf('hosting') !== -1;

const mode = readMode();
const tree = getActiveTreeName();
const confirm = process.env.OPENPLAY_CONFIRM_PRODUCTION === '1';
const allow = mode.allowProductionHostingDeploy === true;

function fail(msg) {
  console.error('');
  console.error('[openplay-deploy] BLOCKED:', msg);
  console.error('');
  process.exit(1);
}

if (isHosting) {
  if (tree !== 'live') {
    fail(
      'Hosting deploy uses Programs/Pickleball/advanced-open-play/live (see firebase.json), but openplay-mode.json has activeTree "' +
        tree +
        '". Run npm run openplay:promote to copy staging → live, set activeTree to "live", then deploy.'
    );
  }
  if (!allow && !confirm) {
    fail(
      'Production hosting deploy is locked (allowProductionHostingDeploy is false). Set "allowProductionHostingDeploy": true in Programs/Pickleball/advanced-open-play/openplay-mode.json after QA, or use OPENPLAY_CONFIRM_PRODUCTION=1 for a one-shot deploy.'
    );
  }
  if (confirm && !allow) {
    console.warn('[openplay-deploy] OPENPLAY_CONFIRM_PRODUCTION=1 — deploying hosting despite allowProductionHostingDeploy false.');
  }
} else {
  console.log('[openplay-deploy] --only scope has no hosting — skipping Open Play hosting guards.');
}

const r = spawnSync('npx', ['firebase-tools', 'deploy', '--non-interactive'].concat(fa), {
  stdio: 'inherit',
  cwd: WEBSITE_ROOT,
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(r.status !== null && r.status !== undefined ? r.status : 1);

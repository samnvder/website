#!/usr/bin/env node
/**
 * Set activeTree in openplay-mode.json: node openplay-switch-tree.js staging|live
 */
const fs = require('fs');
const path = require('path');
const { modeFilePath, DEFAULTS } = require('./openplay-resolve-tree.js');

const next = (process.argv[2] || '').toLowerCase();
if (next !== 'staging' && next !== 'live') {
  console.error('Usage: node openplay-switch-tree.js staging|live');
  process.exit(1);
}

const p = modeFilePath();
let cur = { ...DEFAULTS };
try {
  if (fs.existsSync(p)) {
    cur = { ...cur, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
  }
} catch (e) {
  console.warn('[openplay-switch-tree] reset mode file:', e.message);
}

cur.activeTree = next;
fs.writeFileSync(p, JSON.stringify(cur, null, 2) + '\n', 'utf8');
console.log('[openplay-switch-tree] activeTree is now:', next);
console.log('[openplay-switch-tree] local-test mirrors from:', path.join(path.dirname(p), next));

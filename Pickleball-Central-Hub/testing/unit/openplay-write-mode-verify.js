'use strict';
/**
 * Invoked only via spawn from test-roll-live.js with OPENPLAY_MODE_FILE set
 * before this file loads (fresh Node process).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const tmp = process.env.OPENPLAY_MODE_FILE;
if (!tmp) {
  console.error('[openplay-write-mode-verify] OPENPLAY_MODE_FILE is required');
  process.exit(1);
}

const { writeMode, readMode } = require(path.join(__dirname, '..', '..', 'scripts', 'openplay-resolve-tree.js'));

writeMode({ activeTree: 'live', allowProductionHostingDeploy: true });
const m = readMode();
assert.strictEqual(m.activeTree, 'live');
assert.strictEqual(m.allowProductionHostingDeploy, true);

writeMode({ activeTree: 'staging', allowProductionHostingDeploy: false });
const m2 = readMode();
assert.strictEqual(m2.activeTree, 'staging');
assert.strictEqual(m2.allowProductionHostingDeploy, false);

try {
  fs.unlinkSync(tmp);
} catch (_) {}

console.log('[openplay-write-mode-verify] ok');
process.exit(0);

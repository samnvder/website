'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const { describe, it } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseRollLiveOpts, transformLeagueHtmlForCentralHost } = require(path.join(__dirname, '..', '..', 'scripts', 'openplay-roll-live.js'));

describe('parseRollLiveOpts', () => {
  it('blocks without confirmation', () => {
    const o = parseRollLiveOpts([], {});
    assert.strictEqual(o.hasYes, false);
  });

  it('accepts --yes', () => {
    const o = parseRollLiveOpts(['--yes'], {});
    assert.strictEqual(o.hasYes, true);
    assert.strictEqual(o.deployAll, false);
    assert.strictEqual(o.dryRun, false);
  });

  it('accepts --all and --dry-run with --yes', () => {
    const o = parseRollLiveOpts(['--yes', '--all', '--dry-run'], {});
    assert.strictEqual(o.hasYes, true);
    assert.strictEqual(o.deployAll, true);
    assert.strictEqual(o.dryRun, true);
  });

  it('accepts OPENPLAY_CONFIRM_ROLL_LIVE variants', () => {
    assert.strictEqual(parseRollLiveOpts([], { OPENPLAY_CONFIRM_ROLL_LIVE: '1' }).hasYes, true);
    assert.strictEqual(parseRollLiveOpts([], { OPENPLAY_CONFIRM_ROLL_LIVE: 'true' }).hasYes, true);
    assert.strictEqual(parseRollLiveOpts([], { OPENPLAY_CONFIRM_ROLL_LIVE: ' YES ' }).hasYes, true);
  });
});

describe('writeMode (subprocess, OPENPLAY_MODE_FILE)', () => {
  it('writes normalized values to an isolated mode file', () => {
    const tmp = path.join(os.tmpdir(), 'openplay-mode-verify-' + Date.now() + '.json');
    const verifyScript = path.join(__dirname, 'openplay-write-mode-verify.js');
    const r = spawnSync(process.execPath, [verifyScript], {
      encoding: 'utf8',
      env: { ...process.env, OPENPLAY_MODE_FILE: tmp },
      shell: false,
      windowsHide: true,
    });
    if (r.error) {
      assert.fail(r.error.message);
    }
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.ok(!fs.existsSync(tmp), 'verify script should remove temp mode file');
  });
});

describe('transformLeagueHtmlForCentralHost', () => {
  it('rewrites League Play links to central slugs/assets', () => {
    const html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<title>League</title>',
      '</head>',
      '<body>',
      '<a href="../advanced-open-play/live/SouthEnd_Pickleball_Hub.html">Hub</a>',
      '<a href="../advanced-open-play/live/SouthEnd_OpenPlay_Account.html?return=../../league-play/SouthEnd_League_Play_Hub.html">Profile</a>',
      '<script src="../advanced-open-play/live/js/pickleball-invite-share.js"></script>',
      '"../advanced-open-play/live/SouthEnd_OpenPlay_Account.html?return=" + target',
      '</body>',
      '</html>',
    ].join('\n');
    const out = transformLeagueHtmlForCentralHost(html);
    assert.match(out, /<base href="\/league-play\/" \/>/);
    assert.match(out, /href="\/main"/);
    assert.match(out, /href="\/advanced-open-play\?return=/);
    assert.match(out, /src="\/js\/pickleball-invite-share\.js"/);
    assert.match(out, /"\/advanced-open-play\?return=" \+ target/);
    assert.doesNotMatch(out, /\.\.\/advanced-open-play\/live/);
  });
});

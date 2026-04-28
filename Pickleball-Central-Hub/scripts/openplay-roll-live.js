#!/usr/bin/env node
/**
 * One-shot: staging → live (promote) → Firebase Hosting deploy → reset mode to safe dev defaults.
 *
 * Requires confirmation (accident guard):
 *   npm run roll-live -- --yes
 *   npm run roll-live -- --yes --all     # hosting + database rules (same as deploy:openplay:all)
 *   npm run roll-live -- --yes --dry-run # validate deploy with firebase deploy --dry-run (still promotes)
 * Or: OPENPLAY_CONFIRM_ROLL_LIVE=1|true|yes npm run roll-live   (Unix)
 *     $env:OPENPLAY_CONFIRM_ROLL_LIVE='1'; npm run roll-live   (PowerShell)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { writeMode, PROGRAM_ROOT } = require('./openplay-resolve-tree.js');

/**
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} env
 */
function parseRollLiveOpts(argv, env) {
  const e = env || process.env;
  const hasYes =
    argv.indexOf('--yes') !== -1 ||
    (function () {
      const v = String(e.OPENPLAY_CONFIRM_ROLL_LIVE || '')
        .toLowerCase()
        .trim();
      return v === '1' || v === 'true' || v === 'yes';
    })();
  return {
    hasYes,
    deployAll: argv.indexOf('--all') !== -1,
    dryRun: argv.indexOf('--dry-run') !== -1,
  };
}

function fail(msg) {
  console.error('');
  console.error('[roll-live]', msg);
  console.error('');
  process.exit(1);
}

function assertSpawnOk(label, r) {
  if (r.error) {
    fail(label + ' failed to start: ' + r.error.message);
  }
  if (r.signal) {
    fail(label + ' interrupted (' + r.signal + ').');
  }
  if (r.status === null || r.status === undefined) {
    fail(label + ' exited with unknown status.');
  }
}

function mkdirp(d) {
  fs.mkdirSync(d, { recursive: true });
}

function transformLeagueHtmlForCentralHost(s) {
  let out = String(s)
    .replace(/"\.\.\/advanced-open-play\/live\/SouthEnd_Pickleball_Hub\.html"/g, '"/main"')
    .replace(/"\.\.\/advanced-open-play\/staging\/SouthEnd_Pickleball_Hub\.html"/g, '"/main"')
    .replace(/"\.\.\/live\/SouthEnd_Pickleball_Hub\.html"/g, '"/main"')
    .replace(/"\.\.\/advanced-open-play\/live\/SouthEnd_OpenPlay_Account\.html\?return=/g, '"/advanced-open-play?return=')
    .replace(/"\.\.\/advanced-open-play\/staging\/SouthEnd_OpenPlay_Account\.html\?return=/g, '"/advanced-open-play?return=')
    .replace(/"\.\.\/live\/SouthEnd_OpenPlay_Account\.html\?return=/g, '"/advanced-open-play?return=')
    .replace(/"\.\.\/advanced-open-play\/live\/js\/pickleball-invite-share\.js"/g, '"/js/pickleball-invite-share.js"')
    .replace(/"\.\.\/advanced-open-play\/staging\/js\/pickleball-invite-share\.js"/g, '"/js/pickleball-invite-share.js"')
    .replace(/"\.\.\/live\/js\/pickleball-invite-share\.js"/g, '"/js/pickleball-invite-share.js"')
    .replace(/\.\.\/advanced-open-play\/live\/SouthEnd_OpenPlay_Account\.html\?return=/g, '/advanced-open-play?return=')
    .replace(/\.\.\/advanced-open-play\/staging\/SouthEnd_OpenPlay_Account\.html\?return=/g, '/advanced-open-play?return=')
    .replace(/\.\.\/live\/SouthEnd_OpenPlay_Account\.html\?return=/g, '/advanced-open-play?return=');
  if (!/<base\s/i.test(out)) {
    out = out.replace(/<head>/i, '<head>\n    <base href="/league-play/" />');
  }
  return out;
}

function copyLeagueStaticToLive() {
  const stagingLeagueRoot = path.join(PROGRAM_ROOT, 'staging', 'league-play');
  const legacyLeagueRoot = path.join(PROGRAM_ROOT, 'league-play');
  const srcRoot = fs.existsSync(stagingLeagueRoot) ? stagingLeagueRoot : legacyLeagueRoot;
  const destRoot = path.join(PROGRAM_ROOT, 'live', 'league-play');
  if (!fs.existsSync(srcRoot)) {
    console.warn('[roll-live] League Play source not found; skipping /league-play mirror:', srcRoot);
    return;
  }
  if (fs.existsSync(destRoot)) {
    fs.rmSync(destRoot, { recursive: true, force: true });
  }
  mkdirp(destRoot);

  function copyAllowed(src, dest) {
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      mkdirp(dest);
      for (const name of fs.readdirSync(src)) {
        copyAllowed(path.join(src, name), path.join(dest, name));
      }
      return;
    }
    const ext = path.extname(src).toLowerCase();
    if (ext !== '.html' && ext !== '.css' && ext !== '.js') return;
    if (/\.example\.js$/i.test(src)) return;
    mkdirp(path.dirname(dest));
    if (ext === '.html') {
      fs.writeFileSync(dest, transformLeagueHtmlForCentralHost(fs.readFileSync(src, 'utf8')), 'utf8');
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyAllowed(srcRoot, destRoot);
  console.log('[roll-live] League Play mirrored to live/league-play for central Hosting slugs.');
}

function main() {
  const argv = process.argv.slice(2);
  const opts = parseRollLiveOpts(argv, process.env);

  if (!opts.hasYes) {
    fail(
      'Blocked: promotion overwrites live/ and deploys to production.\n' +
        'Run: npm run roll-live -- --yes\n' +
        '  With database rules: npm run roll-live -- --yes --all\n' +
        '  Validate only: npm run roll-live -- --yes --dry-run\n' +
        'Or set OPENPLAY_CONFIRM_ROLL_LIVE=1, true, or yes (PowerShell: $env:OPENPLAY_CONFIRM_ROLL_LIVE=1)'
    );
  }

  const scriptsDir = __dirname;
  const promoteScript = path.join(scriptsDir, 'openplay-promote-staging-to-live.js');
  const deployScript = path.join(scriptsDir, 'openplay-deploy.js');
  const onlyArg = opts.deployAll ? 'hosting,database' : 'hosting';

  console.log('[roll-live] 1/3 Promote staging → live …');
  const pr = spawnSync(process.execPath, [promoteScript], {
    stdio: 'inherit',
    env: { ...process.env, OPENPLAY_CONFIRM_PROMOTE: '1' },
    shell: false,
    windowsHide: true,
  });
  assertSpawnOk('Promote', pr);
  if (pr.status !== 0) {
    fail('Promote failed; live/ may be incomplete. Fix errors and retry.');
  }
  copyLeagueStaticToLive();

  console.log('[roll-live] 2/3 Set mode for deploy (activeTree live, allow deploy) …');
  writeMode({ activeTree: 'live', allowProductionHostingDeploy: true });

  const deployArgs = [deployScript, '--only', onlyArg];
  if (opts.dryRun) {
    deployArgs.push('--dry-run');
  }
  console.log(
    '[roll-live] 3/3 Firebase deploy (--only ' + onlyArg + (opts.dryRun ? ', --dry-run' : '') + ') …'
  );
  const dr = spawnSync(process.execPath, deployArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
    windowsHide: true,
  });
  assertSpawnOk('Deploy', dr);
  if (dr.status !== 0) {
    console.error('');
    console.error(
      '[roll-live] Deploy failed. openplay-mode.json is left at activeTree live + allowProductionHostingDeploy true so you can fix and run npm run deploy:openplay (or roll-live again).'
    );
    console.error('');
    process.exit(dr.status);
  }

  try {
    writeMode({ activeTree: 'staging', allowProductionHostingDeploy: false });
  } catch (e) {
    console.error('');
    console.error(
      '[roll-live] Deploy succeeded but resetting openplay-mode.json failed:',
      e.message || e
    );
    console.error('Set activeTree to "staging" and allowProductionHostingDeploy to false manually.');
    console.error('');
    process.exit(1);
  }
  console.log('');
  console.log(
    opts.dryRun
      ? '[roll-live] Dry run complete. Firebase validated the deploy; openplay-mode.json reset to activeTree staging + allowProductionHostingDeploy false.'
      : '[roll-live] Done. Production updated; openplay-mode.json reset to activeTree staging + allowProductionHostingDeploy false.'
  );
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { parseRollLiveOpts, transformLeagueHtmlForCentralHost };

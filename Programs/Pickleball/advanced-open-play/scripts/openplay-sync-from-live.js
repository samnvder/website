#!/usr/bin/env node
/**
 * Copy advanced-open-play/live → staging/ and into local test mirrors (same file set as local-test.js).
 * Preserves each destination's Firebase config files so staging/testing projects stay separate from production.
 *
 * Preserved (per destination, if present before sync):
 *   - js/openplay-firebase-config.js
 *   - js/openplay-firebase-config.example.js
 */
const fs = require('fs');
const path = require('path');
const { PROGRAM_ROOT } = require('./openplay-resolve-tree.js');

const LIVE = path.join(PROGRAM_ROOT, 'live');
const STAGING = path.join(PROGRAM_ROOT, 'staging');
const ROOT = path.join(PROGRAM_ROOT, '..', '..', '..');

/** Keep in sync with testing/scripts/local-test.js FILES. */
const FILES = [
  'SouthEnd_Session_RSVP.html',
  'SouthEnd_OpenPlay_Account.html',
  'SouthEnd_Message_Board.html',
  'SouthEnd_Session_Checkin.html',
  'SouthEnd_Admin_Activity.html',
  'js/south-end-openplay-sync.js',
  'js/openplay-profile-panel.js',
  'js/openplay-firebase-config.js',
  'js/openplay-firebase-config.example.js',
  'js/openplay-rsvp-helpers.js',
  'js/openplay-waiver-modals.js',
  'js/openplay-testing-env.js',
];

const PRESERVE_REL = ['js/openplay-firebase-config.js', 'js/openplay-firebase-config.example.js'];

const OUT_DIRS = [
  path.join(PROGRAM_ROOT, 'testing', 'local-page'),
  path.join(ROOT, 'local-page'),
];

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

function readIfExists(p) {
  if (!fs.existsSync(p)) return undefined;
  return fs.readFileSync(p, 'utf8');
}

/**
 * Append se_cb to relative js/ script URLs (same behavior as local-test.js).
 */
function bustHtmlJsRefs(html, token) {
  const esc = encodeURIComponent(token);
  return html.replace(/(<script\s+src=")(js\/[^"]+)(")/g, (_, a, b, c) => {
    const sep = b.includes('?') ? '&' : '?';
    return `${a}${b}${sep}se_cb=${esc}${c}`;
  });
}

function backupPreserves(targetRoot) {
  const out = {};
  for (const rel of PRESERVE_REL) {
    const p = path.join(targetRoot, rel);
    const body = readIfExists(p);
    if (body !== undefined) out[rel] = body;
  }
  return out;
}

function restorePreserves(targetRoot, backups) {
  for (const rel of PRESERVE_REL) {
    if (Object.prototype.hasOwnProperty.call(backups, rel)) {
      const dest = path.join(targetRoot, rel);
      mkdirp(path.dirname(dest));
      fs.writeFileSync(dest, backups[rel], 'utf8');
    }
  }
}

function syncStagingFromLive() {
  const backups = backupPreserves(STAGING);
  if (fs.existsSync(STAGING)) {
    fs.rmSync(STAGING, { recursive: true, force: true });
  }
  mkdirp(STAGING);
  copyRecursive(LIVE, STAGING);
  restorePreserves(STAGING, backups);
  for (const rel of PRESERVE_REL) {
    if (!Object.prototype.hasOwnProperty.call(backups, rel)) {
      console.warn(
        '[openplay-sync-from-live] no prior',
        rel,
        'in staging/ — left as copied from live; set staging Firebase keys if needed.'
      );
    }
  }
  console.log('[openplay-sync-from-live] staging/ ← live/ (preserved:', PRESERVE_REL.join(', ') + ')');
}

function hubHtml(syncedAt) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Local test — Pickleball Open Play</title>
  <style>
    :root { --bg:#0a1628; --card:#152342; --neon:#00ff88; --muted:rgba(255,255,255,.55); --rule:rgba(255,255,255,.1); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, Segoe UI, sans-serif; background: var(--bg); color: #fff; min-height: 100vh; padding: 32px 24px; }
    h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 8px; }
    h1 span { color: var(--neon); }
    p.meta { font-size: 12px; color: var(--muted); margin-bottom: 24px; font-family: ui-monospace, monospace; }
    ul { list-style: none; max-width: 420px; }
    li { margin-bottom: 10px; }
    a {
      display: block; padding: 14px 18px; background: var(--card); border: 1px solid var(--rule);
      border-radius: 8px; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600;
      transition: border-color .15s, background .15s;
    }
    a:hover { border-color: rgba(0,255,136,.35); background: rgba(0,255,136,.06); }
    a small { display: block; font-weight: 400; font-size: 11px; color: var(--muted); margin-top: 6px; }
    .hint { margin-top: 28px; font-size: 12px; color: var(--muted); line-height: 1.6; max-width: 520px; }
    code { font-size: 11px; color: rgba(0,255,136,.75); }
  </style>
</head>
<body>
  <h1>Pickleball · Advanced Open Play <span>local</span></h1>
  <p class="meta">Synced ${syncedAt} · source: Programs/Pickleball/advanced-open-play/<strong>live</strong>/ (openplay-sync-from-live — Firebase configs preserved per folder)</p>
  <ul>
    <li><a href="SouthEnd_Session_RSVP.html">RSVP <small>Open Play — reservation form</small></a></li>
    <li><a href="SouthEnd_OpenPlay_Account.html">Account <small>Sign in / create account (then RSVP)</small></a></li>
    <li><a href="SouthEnd_Message_Board.html">Message board <small>Community feed (signed-in)</small></a></li>
    <li><a href="SouthEnd_Session_Checkin.html">Check-in <small>Staff roster / scan</small></a></li>
    <li><a href="SouthEnd_Admin_Activity.html">Admin activity <small>Staff event feed</small></a></li>
  </ul>
  <p class="hint">Content matches <code>live/</code>; <code>js/openplay-firebase-config.js</code> here stays on your test/staging Firebase project. Run <code>npm run local-test</code> for active-tree mirroring. Production: <code>npm run deploy:openplay</code>.</p>
</body>
</html>
`;
}

function copyInto(OUT, rel, syncedAt) {
  const src = path.join(LIVE, rel);
  const dest = path.join(OUT, rel);
  if (!fs.existsSync(src)) {
    console.warn('[openplay-sync-from-live] skip (missing in live):', rel);
    return false;
  }
  mkdirp(path.dirname(dest));
  if (rel.endsWith('.html')) {
    let body = fs.readFileSync(src, 'utf8');
    body = bustHtmlJsRefs(body, syncedAt);
    fs.writeFileSync(dest, body, 'utf8');
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

function syncLocalMirrorsFromLive() {
  const syncedAt = new Date().toISOString();
  for (const OUT of OUT_DIRS) {
    const backups = backupPreserves(OUT);
    mkdirp(OUT);
    for (const f of FILES) {
      if (PRESERVE_REL.indexOf(f) !== -1) {
        const src = path.join(LIVE, f);
        const dest = path.join(OUT, f);
        mkdirp(path.dirname(dest));
        fs.copyFileSync(src, dest);
      } else {
        copyInto(OUT, f, syncedAt);
      }
    }
    restorePreserves(OUT, backups);
    for (const rel of PRESERVE_REL) {
      if (!Object.prototype.hasOwnProperty.call(backups, rel)) {
        console.warn(
          '[openplay-sync-from-live] no prior',
          rel,
          'in',
          path.relative(ROOT, OUT).replace(/\\/g, '/') || '.',
          '— left as copied from live; set test/staging Firebase keys if needed.'
        );
      }
    }
    fs.writeFileSync(path.join(OUT, 'index.html'), hubHtml(syncedAt), 'utf8');
    const rel = path.relative(ROOT, OUT).replace(/\\/g, '/');
    console.log('[openplay-sync-from-live] mirror:', rel, '(Firebase config preserved if it existed)');
  }
}

if (!fs.existsSync(LIVE)) {
  console.error('[openplay-sync-from-live] missing:', LIVE);
  process.exit(1);
}

syncStagingFromLive();
syncLocalMirrorsFromLive();
console.log('[openplay-sync-from-live] done.');

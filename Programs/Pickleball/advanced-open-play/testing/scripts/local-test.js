#!/usr/bin/env node
/**
 * Mirrors staging (under advanced-open-play/) or production live (Programs/Pickleball/live/) per openplay-mode.json into the testing mirror for local QA.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const { getActiveSourceDir, getActiveTreeName } = require(path.join(
  ROOT,
  'Programs',
  'Pickleball',
  'advanced-open-play',
  'scripts',
  'openplay-resolve-tree.js'
));
const SOURCE = getActiveSourceDir();
const TREE_LABEL = getActiveTreeName();

if (!fs.existsSync(SOURCE)) {
  console.error('[local-test] missing source tree:', SOURCE);
  console.error('Run: npm run openplay:bootstrap-staging');
  process.exit(1);
}
const SOURCE_LABEL = path.relative(path.join(ROOT, 'Programs', 'Pickleball'), SOURCE).replace(/\\/g, '/');
console.log('[local-test] mirroring from:', 'Programs/Pickleball/' + SOURCE_LABEL + '/');

/** Canonical mirror. Keep Pickleball test files under Programs/Pickleball. */
const OUT_DIRS = [
  path.join(ROOT, 'Programs', 'Pickleball', 'advanced-open-play', 'testing', 'local-page'),
];

const FILES = [
  'SouthEnd_Pickleball_Hub.html',
  'SouthEnd_Session_RSVP.html',
  'SouthEnd_OpenPlay_Account.html',
  'SouthEnd_Message_Board.html',
  'SouthEnd_Open_Play_Signups.html',
  'SouthEnd_Session_Checkin.html',
  'SouthEnd_Admin_Hub.html',
  'SouthEnd_Admin_League_Play.html',
  'SouthEnd_Admin_Advanced_Open_Play.html',
  'SouthEnd_Admin_Activity.html',
  'SouthEnd_Admin_Module_Access.html',
  'SouthEnd_Admin_User_Management.html',
  'pickleball-hub-nav.js',
  'league-play/SouthEnd_League_Account.html',
  'league-play/SouthEnd_League_Invites.html',
  'league-play/SouthEnd_League_Overview.html',
  'league-play/SouthEnd_League_Payment.html',
  'league-play/SouthEnd_League_Play_Hub.html',
  'league-play/SouthEnd_League_Teams.html',
  'league-play/css/south-end-league.css',
  'league-play/js/league-firebase-config.js',
  'league-play/js/league-team-builder.js',
  'league-play/js/pickleball-hub-nav.js',
  'league-play/js/south-end-league-sync.js',
  'js/south-end-openplay-sync.js',
  'js/pickleball-invite-share.js',
  'js/openplay-profile-panel.js',
  'js/openplay-firebase-config.js',
  'js/openplay-firebase-config.example.js',
  'js/openplay-rsvp-helpers.js',
  'js/openplay-waiver-modals.js',
  'js/openplay-testing-env.js',
];

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Append se_cb to relative js/ script URLs so each npm run local-test:sync
 * produces a new query string — browsers treat it as a distinct resource.
 */
function bustHtmlJsRefs(html, token) {
  const esc = encodeURIComponent(token);
  return html.replace(/(<script\s+src=")(js\/[^"]+)(")/g, (_, a, b, c) => {
    const sep = b.includes('?') ? '&' : '?';
    return `${a}${b}${sep}se_cb=${esc}${c}`;
  });
}

function localizeLeagueHtml(html) {
  return String(html)
    .replace(/\s*<base\s+href="\/league-play\/"\s*\/>\s*/i, '\n')
    .replace(/(<script\s+src=")\/js\/([^"]+)(")/g, '$1../js/$2$3')
    .replace(/\.\.\/advanced-open-play\/(?:staging|live)\/SouthEnd_OpenPlay_Account\.html/g, '../SouthEnd_OpenPlay_Account.html')
    .replace(/\.\.\/advanced-open-play\/(?:staging|live)\/SouthEnd_Pickleball_Hub\.html/g, '../SouthEnd_Pickleball_Hub.html')
    .replace(/\.\.\/advanced-open-play\/(?:staging|live)\/SouthEnd_Admin_Hub\.html/g, '../SouthEnd_Admin_Hub.html')
    .replace(/\.\.\/live\/SouthEnd_OpenPlay_Account\.html/g, '../SouthEnd_OpenPlay_Account.html')
    .replace(/\.\.\/live\/SouthEnd_Pickleball_Hub\.html/g, '../SouthEnd_Pickleball_Hub.html')
    .replace(/\.\.\/live\/SouthEnd_Admin_Hub\.html/g, '../SouthEnd_Admin_Hub.html')
    .replace(/(<a[^>]+\bhref=")\/hub(")/g, '$1../SouthEnd_Pickleball_Hub.html$2')
    .replace(/(<a[^>]+\bhref=")\/account([^"]*)(")/g, '$1../SouthEnd_OpenPlay_Account.html$2$3')
    .replace(/(["'])\/account\?return=/g, '$1../SouthEnd_OpenPlay_Account.html?return=')
    .replace(/(["'])\/admin(["'])/g, '$1../SouthEnd_Admin_Hub.html$2');
}

function copyInto(OUT, rel) {
  const src = path.join(SOURCE, rel);
  const dest = path.join(OUT, rel);
  if (!fs.existsSync(src)) {
    console.warn('[local-test] skip (missing):', rel);
    return false;
  }
  mkdirp(path.dirname(dest));
  if (rel.endsWith('.html')) {
    let body = fs.readFileSync(src, 'utf8');
    if (rel.startsWith('league-play/')) {
      body = localizeLeagueHtml(body);
    }
    body = bustHtmlJsRefs(body, syncedAt);
    fs.writeFileSync(dest, body, 'utf8');
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

function syncEverywhere() {
  for (const f of FILES) {
    let ok = true;
    for (const OUT of OUT_DIRS) {
      if (!copyInto(OUT, f)) ok = false;
    }
    if (ok) console.log('[local-test] copied:', f);
  }
}

const syncedAt = new Date().toISOString();
const hub = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Local test — South End Pickleball Hub</title>
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
  <h1>South End Pickleball Hub <span>local</span></h1>
  <p class="meta">Synced ${syncedAt} · source: Programs/Pickleball/${SOURCE_LABEL}/ (see openplay-mode.json)</p>
  <ul>
    <li><a href="SouthEnd_Pickleball_Hub.html">Hub <small>Parent menu for pickleball modules</small></a></li>
    <li><a href="SouthEnd_OpenPlay_Account.html">Advanced Open Play <small>Module home, schedule, RSVP, and profile</small></a></li>
    <li><a href="SouthEnd_Message_Board.html">Message Board <small>Community module (signed-in)</small></a></li>
    <li><a href="SouthEnd_Session_RSVP.html">RSVP <small>Advanced Open Play reservation form</small></a></li>
    <li><a href="SouthEnd_Open_Play_Signups.html">Open Play signups <small>Admin registration view</small></a></li>
    <li><a href="SouthEnd_Session_Checkin.html">Check-in <small>Staff roster / scan</small></a></li>
    <li><a href="SouthEnd_Admin_Hub.html">Admin hub <small>Parent menu for staff tools</small></a></li>
    <li><a href="SouthEnd_Admin_League_Play.html">League Play admin <small>Team management and roster tools</small></a></li>
    <li><a href="SouthEnd_Admin_Advanced_Open_Play.html">Advanced Open Play admin <small>Signups, check-ins, and activity</small></a></li>
    <li><a href="SouthEnd_Admin_Activity.html">Admin activity <small>Staff event feed</small></a></li>
    <li><a href="SouthEnd_Admin_Module_Access.html">Module access <small>Submodule grants (staff)</small></a></li>
    <li><a href="SouthEnd_Admin_User_Management.html">User management <small>Edit non-admin profiles (staff)</small></a></li>
  </ul>
  <p class="hint">Run <code>npm run local-test</code> from the Website folder to refresh. Mirror is gitignored and stays under <code>Programs/Pickleball/advanced-open-play/testing/local-page/</code>. Active tree: <strong>${TREE_LABEL}</strong> — switch with <code>npm run openplay:use-staging</code> / <code>npm run openplay:use-live</code>. Production deploy uses <code>Programs/Pickleball/live/</code> (see <code>openplay-mode.json</code> + deploy guard).</p>
</body>
</html>
`;

syncEverywhere();
for (const OUT of OUT_DIRS) {
  fs.writeFileSync(path.join(OUT, 'index.html'), hub, 'utf8');
  const rel = path.relative(ROOT, OUT).replace(/\\/g, '/');
  console.log('[local-test] wrote:', rel + '/index.html');
}
console.log('[local-test] done. Open http://127.0.0.1:3456/Programs/Pickleball/advanced-open-play/testing/local-page/index.html when using live-server from repo root.');

#!/usr/bin/env node
/**
 * Mirrors Programs/Pickleball/advanced-open-play/{staging|live} (see openplay-mode.json) into testing mirrors for local QA.
 * Writes to two paths so both URL styles work with live-server (repo root = site root).
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
console.log('[local-test] mirroring from:', 'Programs/Pickleball/advanced-open-play/' + TREE_LABEL + '/');

/** Canonical mirror + short legacy path (same files). */
const OUT_DIRS = [
  path.join(ROOT, 'Programs', 'Pickleball', 'advanced-open-play', 'testing', 'local-page'),
  path.join(ROOT, 'local-page'),
];

const FILES = [
  'SouthEnd_Session_RSVP.html',
  'SouthEnd_OpenPlay_Account.html',
  'SouthEnd_Session_Checkin.html',
  'js/south-end-openplay-sync.js',
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
  <p class="meta">Synced ${syncedAt} · source: Programs/Pickleball/advanced-open-play/${TREE_LABEL}/ (see openplay-mode.json)</p>
  <ul>
    <li><a href="SouthEnd_Session_RSVP.html">RSVP <small>Open Play — reservation form</small></a></li>
    <li><a href="SouthEnd_OpenPlay_Account.html">Account <small>Sign in / create account (then RSVP)</small></a></li>
    <li><a href="SouthEnd_Session_Checkin.html">Check-in <small>Staff roster / scan</small></a></li>
  </ul>
  <p class="hint">Run <code>npm run local-test</code> from the Website folder to refresh. Short URL: <code>/local-page/</code>. Mirrors are gitignored. Active tree: <strong>${TREE_LABEL}</strong> — switch with <code>npm run openplay:use-staging</code> / <code>npm run openplay:use-live</code>. Production deploy uses <code>live/</code> only (see <code>openplay-mode.json</code> + deploy guard).</p>
</body>
</html>
`;

syncEverywhere();
for (const OUT of OUT_DIRS) {
  fs.writeFileSync(path.join(OUT, 'index.html'), hub, 'utf8');
  const rel = path.relative(ROOT, OUT).replace(/\\/g, '/');
  console.log('[local-test] wrote:', rel + '/index.html');
}
console.log('[local-test] done. Open http://127.0.0.1:3456/local-page/index.html (or …/Programs/Pickleball/advanced-open-play/testing/local-page/index.html) when using live-server from repo root.');

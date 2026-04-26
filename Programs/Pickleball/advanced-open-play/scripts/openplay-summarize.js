#!/usr/bin/env node
/**
 * Open Play summarize command:
 * - Creates/updates knowledge base markdown
 * - Converts the markdown to PDF
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const OPENPLAY_ROOT = path.join(ROOT, 'Programs', 'Pickleball', 'advanced-open-play');
const KB_DIR = path.join(OPENPLAY_ROOT, 'knowledge base');
const MD_PATH = path.join(KB_DIR, 'OPENPLAY_PROJECT_SUMMARY.md');
const PDF_PATH = path.join(KB_DIR, 'OPENPLAY_PROJECT_SUMMARY.pdf');

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readUtf8(filePath));
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

function extractUrls(content) {
  const matches = content.match(/https?:\/\/[^\s"'`)<]+/g) || [];
  return matches.map((url) => url.replace(/[.,;:!?]+$/g, ''));
}

function collectDiscoveredUrls(openplayRoot) {
  const sourceFiles = [
    path.join(openplayRoot, 'README.md'),
    path.join(openplayRoot, 'firebase-hosting', 'README.md'),
    path.join(openplayRoot, 'live', 'SouthEnd_OpenPlay_Account.html'),
    path.join(openplayRoot, 'live', 'SouthEnd_Session_RSVP.html'),
    path.join(openplayRoot, 'live', 'SouthEnd_Session_Checkin.html'),
    path.join(openplayRoot, 'live', 'SouthEnd_Admin_Activity.html'),
    path.join(openplayRoot, 'live', 'js', 'south-end-openplay-sync.js'),
    path.join(openplayRoot, 'live', 'js', 'openplay-firebase-config.js'),
    path.join(openplayRoot, 'testing', 'scripts', 'local-test.js'),
  ];
  const urls = new Set();
  sourceFiles.forEach((filePath) => {
    if (!fileExists(filePath)) return;
    extractUrls(readUtf8(filePath)).forEach((url) => urls.add(url));
  });
  return Array.from(urls).sort();
}

function parseOpenplayDatabasePaths(databaseRules) {
  if (!databaseRules || !databaseRules.rules || !databaseRules.rules.openplay_se) return [];
  return Object.keys(databaseRules.rules.openplay_se).map((key) => `openplay_se/${key}`);
}

function summarizeScripts(scripts) {
  const preferred = [
    'local-test',
    'local-test:sync',
    'deploy:openplay',
    'deploy:openplay:all',
    'firebase:deploy-rules',
    'openplay:promote',
    'openplay:bootstrap-staging',
    'openplay:sync-from-live',
    'openplay:use-staging',
    'openplay:use-live',
    'test',
    'start',
    'dev',
    'serve',
  ];
  const selected = [];
  preferred.forEach((name) => {
    if (Object.prototype.hasOwnProperty.call(scripts, name)) {
      selected.push({ name, cmd: scripts[name] });
    }
  });
  return selected;
}

function parseFirebaseConfigFromBrowserFile(filePath) {
  const text = readUtf8(filePath);
  function pick(key) {
    const m = text.match(new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`));
    return m ? m[1] : '';
  }
  return {
    authDomain: pick('authDomain'),
    databaseURL: pick('databaseURL'),
    projectId: pick('projectId'),
  };
}

function findBrowserExecutable() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (envPath && fileExists(envPath)) return envPath;

  if (os.platform() === 'win32') {
    const windowsCandidates = [
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    const found = windowsCandidates.find((candidate) => fileExists(candidate));
    if (found) return found;
  }

  if (os.platform() === 'darwin') {
    const macCandidates = [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];
    const found = macCandidates.find((candidate) => fileExists(candidate));
    if (found) return found;
  }

  const linuxCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
  ];
  return linuxCandidates.find((candidate) => fileExists(candidate)) || null;
}

function buildMarkdown(context) {
  const {
    updatedAt,
    firebaseConfig,
    firebaseJson,
    openplayMode,
    scripts,
    publicUrls,
    discoveredUrls,
    databasePaths,
  } = context;

  const deployRoot = (firebaseJson.hosting && firebaseJson.hosting.public) || 'Programs/Pickleball/advanced-open-play/live';
  const databaseRulesFile = (firebaseJson.database && firebaseJson.database.rules) || 'database.rules.json';
  const allowProdDeploy = openplayMode.allowProductionHostingDeploy === true ? 'true' : 'false';
  const activeTree = openplayMode.activeTree || 'unknown';
  const authDomain = firebaseConfig.authDomain || '(not set)';
  const databaseUrl = firebaseConfig.databaseURL || '(not set)';
  const projectId = firebaseConfig.projectId || '(not set)';

  return `# Advanced Open Play - Project Infrastructure Summary

Last updated: ${updatedAt}

## Purpose

This is the operational knowledge base for links, services, and servers used to maintain, test, build, and deploy the Advanced Open Play project.

## Core Paths

- Project root: \`Programs/Pickleball/advanced-open-play/\`
- Deploy source (Firebase Hosting public): \`${deployRoot}\`
- Firebase rules file: \`${databaseRulesFile}\`
- Runtime mode file: \`Programs/Pickleball/advanced-open-play/openplay-mode.json\`

## Public Web Links

| Surface | URL |
|---|---|
| Account | ${publicUrls.account} |
| RSVP | ${publicUrls.rsvp} |
| Session Check-in | ${publicUrls.checkin} |
| Admin Activity | ${publicUrls.admin} |
| Alternate Hosting Domain Pattern | https://pickleball-advanced-open-play.firebaseapp.com/... |

## Cloud Services In Use

| Service | Purpose | Endpoint / Reference |
|---|---|---|
| Firebase Hosting | Serves production static app from \`live/\` | https://pickleball-advanced-open-play.web.app |
| Firebase Authentication | Account sign-up/sign-in/password reset | authDomain: \`${authDomain}\` |
| Firebase Realtime Database | RSVP, profiles, admin UIDs, activity feed | databaseURL: \`${databaseUrl}\` |
| Firebase Web SDK (compat v10.7.1) | Client SDK loaded at runtime | https://www.gstatic.com/firebasejs/10.7.1/ |
| Google Fonts | UI typography | https://fonts.googleapis.com |
| cdnjs QRCodeJS | QR code rendering in RSVP page | https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js |
| FormSubmit | Email relay used by RSVP flow | https://formsubmit.co |
| Zelle QR enrollment link | Payments shortcut surfaced in RSVP page | https://enroll.zellepay.com |

## Firebase Project Snapshot

- projectId: \`${projectId}\`
- authDomain: \`${authDomain}\`
- databaseURL: \`${databaseUrl}\`
- openplay-mode activeTree: \`${activeTree}\`
- openplay-mode allowProductionHostingDeploy: \`${allowProdDeploy}\`

## Realtime Database Namespaces

${databasePaths.map((p) => `- \`${p}\``).join('\n')}

## Local and Maintenance Servers

| Server | How to Run | URL |
|---|---|---|
| Local Open Play QA hub | \`npm run local-test\` | http://127.0.0.1:3456/Programs/Pickleball/advanced-open-play/testing/local-page/index.html |
| Local website dev server | \`npm run start\` or \`npm run dev\` | http://127.0.0.1:3000/ |
| Static local server | \`npm run serve\` | http://127.0.0.1:3000/ |

## Build / Deploy / Workflow Commands

${scripts.map((s) => `- \`npm run ${s.name}\` -> \`${s.cmd}\``).join('\n')}

## Key Project Surfaces to Maintain

- \`live/\` -> production source of truth for Hosting deploy output.
- \`staging/\` -> development tree for iterative edits before promotion.
- \`scripts/openplay-deploy.js\` -> deploy guard enforcing active tree and production deploy lock.
- \`testing/scripts/local-test.js\` -> mirrors active tree into local test hubs.
- \`live/js/openplay-firebase-config.js\` -> Firebase project wiring used by runtime.
- \`live/js/south-end-openplay-sync.js\` -> auth/database sync and shared client logic.
- \`database.rules.json\` -> Realtime Database read/write rules.

## Additional Discovered URLs (from source scan)

${discoveredUrls.map((url) => `- ${url}`).join('\n')}

## Update Behavior

This document and its PDF are auto-generated by \`npm run summarize\`.

- First run: creates \`knowledge base/OPENPLAY_PROJECT_SUMMARY.md\` and \`knowledge base/OPENPLAY_PROJECT_SUMMARY.pdf\`
- Later runs: overwrite both files with the latest snapshot
`;
}

async function writePdfFromMarkdown(markdown, outputPath) {
  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      'No supported browser executable found for PDF generation. Set PUPPETEER_EXECUTABLE_PATH to Edge/Chrome and re-run.'
    );
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Open Play Project Summary</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 34px; color: #111; line-height: 1.5; font-size: 12px; }
    h1, h2, h3 { color: #0f172a; margin-top: 22px; margin-bottom: 8px; }
    h1 { font-size: 24px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; }
    h2 { font-size: 18px; }
    h3 { font-size: 15px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0 16px; font-size: 11px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 1px 3px; border-radius: 3px; }
    a { color: #0b57d0; text-decoration: none; }
    ul { margin-top: 6px; margin-bottom: 10px; }
  </style>
</head>
<body>
${marked.parse(markdown)}
</body>
</html>`;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  fs.mkdirSync(KB_DIR, { recursive: true });

  const packageJson = readJson(path.join(ROOT, 'package.json'));
  const firebaseJson = readJson(path.join(ROOT, 'firebase.json'));
  const openplayMode = readJson(path.join(OPENPLAY_ROOT, 'openplay-mode.json'));
  const databaseRules = readJson(path.join(ROOT, 'database.rules.json'));
  const firebaseConfigPath = path.join(OPENPLAY_ROOT, 'live', 'js', 'openplay-firebase-config.js');
  const firebaseConfig = parseFirebaseConfigFromBrowserFile(firebaseConfigPath);

  const markdown = buildMarkdown({
    updatedAt: new Date().toISOString(),
    firebaseConfig,
    firebaseJson,
    openplayMode,
    scripts: summarizeScripts(packageJson.scripts || {}),
    publicUrls: {
      account: 'https://pickleball-advanced-open-play.web.app/SouthEnd_OpenPlay_Account.html',
      rsvp: 'https://pickleball-advanced-open-play.web.app/SouthEnd_Session_RSVP.html',
      checkin: 'https://pickleball-advanced-open-play.web.app/SouthEnd_Session_Checkin.html',
      admin: 'https://pickleball-advanced-open-play.web.app/SouthEnd_Admin_Activity.html',
    },
    discoveredUrls: collectDiscoveredUrls(OPENPLAY_ROOT),
    databasePaths: parseOpenplayDatabasePaths(databaseRules),
  });

  fs.writeFileSync(MD_PATH, markdown, 'utf8');
  await writePdfFromMarkdown(markdown, PDF_PATH);

  console.log('[summarize] Updated markdown:', path.relative(ROOT, MD_PATH).replace(/\\/g, '/'));
  console.log('[summarize] Updated PDF:', path.relative(ROOT, PDF_PATH).replace(/\\/g, '/'));
}

main().catch((err) => {
  console.error('[summarize] Failed:', err.message || err);
  process.exit(1);
});

/**
 * Layout assertions for #swim-instructors pills (Puppeteer + static http).
 * Run from repo root (folder that contains package.json):
 *   npm run test:pools-instructors
 *
 * Requires Chrome/Chromium. Set CHROME_PATH to override detection.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Website project root (contains Pages/, package.json may be parent of Pages) */
const WEBSITE_ROOT = path.resolve(__dirname, '../../..');

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function mime(p) {
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  return 'application/octet-stream';
}

function serveFile(res, filePath) {
  if (!filePath.startsWith(WEBSITE_ROOT)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  const type = mime(filePath);
  const headers = { 'Content-Type': type };
  if (filePath.endsWith('.css')) headers['Cache-Control'] = 'no-store';
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/' || pathname === '') pathname = '/Pages/pools/testing/instructor-pill-layout-test.html';
      const filePath = path.normalize(path.join(WEBSITE_ROOT, pathname.replace(/^\//, '')));
      serveFile(res, filePath);
    } catch {
      res.writeHead(500).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function assertLayout(page) {
  const results = await page.evaluate(() => {
    const section = document.querySelector('#swim-instructors');
    if (!section) return { ok: false, reason: 'missing #swim-instructors' };

    const pills = [...section.querySelectorAll('.instructor-pill')];
    if (pills.length < 1) return { ok: false, reason: 'no .instructor-pill' };

    const checks = [];

    for (const pill of pills) {
      const info = pill.closest('.instructor-info');
      if (!info) {
        checks.push({ ok: false, reason: 'pill has no .instructor-info ancestor' });
        continue;
      }

      const csPill = getComputedStyle(pill);
      const pl = parseFloat(csPill.paddingLeft);
      const pr = parseFloat(csPill.paddingRight);
      if (pl < 16 || pr < 16) {
        checks.push({
          ok: false,
          reason: `pill horizontal padding too small: ${pl}px / ${pr}px`,
        });
        continue;
      }

      const csInfo = getComputedStyle(info);
      const padL = parseFloat(csInfo.paddingLeft) || 0;
      const padR = parseFloat(csInfo.paddingRight) || 0;
      const borderL = parseFloat(csInfo.borderLeftWidth) || 0;
      const borderR = parseFloat(csInfo.borderRightWidth) || 0;
      /* clientWidth includes padding; in-flow children use the padding box as containing block */
      const innerTarget = info.clientWidth - padL - padR - borderL - borderR;
      const pillOuter = pill.offsetWidth;
      const wrap = pill.parentElement;
      const wrapW = wrap ? wrap.offsetWidth : -1;
      if (pillOuter < innerTarget - 2) {
        checks.push({
          ok: false,
          reason: `pill narrower than info content: pillOuter=${pillOuter} inner≈${innerTarget} infoClient=${info.clientWidth} pad=${padL}/${padR} parent=${wrap?.className} parentW=${wrapW}`,
        });
        continue;
      }

      for (const row of pill.querySelectorAll('.availability-row')) {
        const cs = getComputedStyle(row);
        const rpl = parseFloat(cs.paddingLeft);
        const rpr = parseFloat(cs.paddingRight);
        if (rpl < 16 || rpr < 16) {
          checks.push({
            ok: false,
            reason: `availability-row padding too small: ${rpl}px / ${rpr}px`,
          });
          break;
        }
        for (const p of row.querySelectorAll('p')) {
          if (p.scrollWidth > p.clientWidth + 2) {
            checks.push({
              ok: false,
              reason: `schedule line overflows: ${p.className} scroll ${p.scrollWidth} > ${p.clientWidth}`,
            });
            break;
          }
        }
      }

      for (const li of pill.querySelectorAll('.instructor-pill-levels li')) {
        if (li.scrollWidth > li.clientWidth + 2) {
          checks.push({
            ok: false,
            reason: `list item overflows scrollWidth=${li.scrollWidth} clientWidth=${li.clientWidth}`,
          });
          break;
        }
      }

      checks.push({ ok: true, pillOuter, innerTarget, padL });
    }

    const failed = checks.find((c) => c.ok === false);
    if (failed) return { ok: false, reason: failed.reason, checks };
    return { ok: true, checks };
  });

  return results;
}

const chromePath = findChrome();
if (!chromePath) {
  console.error(
    'Chrome not found. Install Google Chrome or set CHROME_PATH to chrome.exe (Windows) or chromium binary.',
  );
  process.exit(1);
}

const { server, port } = await startServer();
const url = `http://127.0.0.1:${port}/Pages/pools/testing/instructor-pill-layout-test.html`;

let browser;
try {
  browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const runAt = async (label, vw) => {
    await page.setViewport({ width: vw, height: 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
    const layout = await assertLayout(page);
    if (!layout.ok) {
      console.error(`LAYOUT TEST FAILED (${label} ${vw}px):`, layout.reason);
      if (layout.checks) console.error(JSON.stringify(layout.checks, null, 2));
      process.exitCode = 1;
    } else {
      console.log(`instructor-pill-layout-test OK (${label} ${vw}px)`, JSON.stringify(layout.checks));
    }
    return layout.ok;
  };

  let ok = await runAt('narrow', 420);
  if (ok) ok = await runAt('desktop', 1440);
  if (!ok) process.exit(1);
} finally {
  if (browser) await browser.close();
  server.close();
}

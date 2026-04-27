#!/usr/bin/env node
/**
 * Local test now serves the single checked-in local-page site directly.
 * This script intentionally does not mirror staging/live into local-page.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const LOCAL_PAGE = path.join(ROOT, 'Programs', 'Pickleball', 'advanced-open-play', 'testing', 'local-page');
const INDEX = path.join(LOCAL_PAGE, 'index.html');

if (!fs.existsSync(LOCAL_PAGE)) {
  console.error('[local-test] missing local test site:', LOCAL_PAGE);
  process.exit(1);
}

if (!fs.existsSync(INDEX)) {
  console.error('[local-test] missing local test index:', INDEX);
  process.exit(1);
}

console.log('[local-test] direct local site only. No staging/live copy was run.');
console.log('[local-test] open http://127.0.0.1:3456/Programs/Pickleball/advanced-open-play/testing/local-page/index.html');

#!/usr/bin/env node
/**
 * rls-guard.js — asserts the Supabase anonymous-access surface has not drifted.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-18, public.tour_bookings (231 prospect records) and
 * public.tour_referrals (30 two-party records) were readable, writable and
 * deletable by anyone on the internet. RLS was enabled on every table; the hole
 * was a policy granted `TO public` — which in Postgres means every role,
 * including anon — carrying the reassuring name "Service role full access".
 *
 * A review that read policy NAMES would have passed that database. This guard
 * reads BEHAVIOUR instead: it asks production what anon can actually see.
 *
 * WHAT IT CHECKS
 * --------------
 *   1. Every table marked "denied" returns ZERO rows to the anon key.
 *   2. PII tables additionally return a literally empty body.
 *   3. Tables marked "public" still exist (a 404 means the baseline is stale).
 *
 * It uses the anon key already published in the page source — no secret is
 * introduced by running this, and it tests the exact credential an attacker has.
 *
 * KNOWN LIMIT — read this before trusting a green run
 * ---------------------------------------------------
 * This cannot DISCOVER new tables. Enumerating the schema requires the
 * service_role key (`GET /rest/v1/` rejects anon with 401), so a brand-new
 * exposed table is invisible here until someone adds it to the baseline. That
 * is exactly how the original finding stayed hidden: two of the three tables
 * were found by guessing names. Refresh the baseline with the SQL in
 * security/README.md whenever tables are added.
 *
 * Usage:
 *   node scripts/audit/rls-guard.js              # probe production
 *   node scripts/audit/rls-guard.js --offline    # validate baseline shape only
 *   node scripts/audit/rls-guard.js --json       # machine-readable result
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
// Overridable so the drift tests can point the guard at fixtures.
const BASELINE_REL = process.env.RLS_BASELINE || 'security/rls-baseline.json';
const KEY_SOURCE_REL = 'live/wpcode/8309-floating-book-tour-button.html';
const SUPABASE_URL = 'https://zngbawafqjntciafhxgr.supabase.co';

const VALID_CLASSES = new Set(['denied', 'public']);

function fail(msg) {
  console.error(`\n  RLS GUARD FAILED\n\n${msg}\n`);
  process.exit(1);
}

function readBaseline() {
  const p = path.join(REPO, BASELINE_REL);
  if (!fs.existsSync(p)) fail(`Baseline not found: ${BASELINE_REL}`);
  let b;
  try {
    b = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`Could not parse ${BASELINE_REL}: ${e.message}`);
  }

  const problems = [];
  if (!b.tables || typeof b.tables !== 'object') problems.push('missing "tables" object');
  if (!Array.isArray(b.pii_tables)) problems.push('missing "pii_tables" array');

  for (const [t, cls] of Object.entries(b.tables || {})) {
    if (!VALID_CLASSES.has(cls)) {
      problems.push(`table "${t}" has class "${cls}" (expected: ${[...VALID_CLASSES].join(' | ')})`);
    }
  }
  // A PII table must never be classed public — that combination is always a bug.
  for (const t of b.pii_tables || []) {
    if (!(t in (b.tables || {}))) problems.push(`pii_table "${t}" is not listed in "tables"`);
    else if (b.tables[t] !== 'denied') {
      problems.push(`pii_table "${t}" is classed "${b.tables[t]}" — PII must be "denied"`);
    }
  }
  // Every "public" table should carry a written reason. Undocumented public
  // access is how a deliberate exception becomes an unnoticed hole.
  for (const [t, cls] of Object.entries(b.tables || {})) {
    if (cls === 'public' && !(b.public_rationale || {})[t]) {
      problems.push(`table "${t}" is "public" but has no entry in "public_rationale"`);
    }
  }

  if (problems.length) fail('Baseline is malformed:\n\n  - ' + problems.join('\n  - '));
  return b;
}

function readAnonKey() {
  const p = path.join(REPO, KEY_SOURCE_REL);
  if (!fs.existsSync(p)) fail(`Cannot read the anon key — ${KEY_SOURCE_REL} not found.`);
  const m = fs.readFileSync(p, 'utf8').match(/eyJ[A-Za-z0-9_.-]{40,}/);
  if (!m) fail(`No anon key found in ${KEY_SOURCE_REL}.`);
  return m[0];
}

async function probe(table, key) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const body = await res.text();
  // PostgREST reports the total after the slash: "0-0/231", or "*/0" when empty.
  const cr = res.headers.get('content-range');
  let count = null;
  if (cr && cr.includes('/')) {
    const raw = cr.split('/').pop().trim();
    if (raw !== '*') count = Number(raw);
  }
  return { status: res.status, count, body: body.trim() };
}

async function main() {
  const args = process.argv.slice(2);
  const offline = args.includes('--offline');
  const asJson = args.includes('--json');

  const baseline = readBaseline();
  const tables = Object.entries(baseline.tables);
  const pii = new Set(baseline.pii_tables);

  if (offline) {
    console.log(`  RLS guard: baseline OK — ${tables.length} tables, ` +
                `${tables.filter(([, c]) => c === 'denied').length} denied, ` +
                `${pii.size} PII. (--offline: production not probed)`);
    return;
  }

  if (typeof fetch !== 'function') {
    fail('global fetch() is unavailable — Node 18+ is required to probe production.\n' +
         'Run with --offline to validate the baseline shape only.');
  }

  const key = readAnonKey();
  const failures = [];
  const results = [];

  for (const [table, cls] of tables) {
    let r;
    try {
      r = await probe(table, key);
    } catch (e) {
      failures.push(`${table}: request failed — ${e.message}`);
      continue;
    }
    results.push({ table, class: cls, status: r.status, count: r.count });

    if (cls === 'denied') {
      if (r.count !== 0) {
        const who = pii.has(table) ? 'PII TABLE' : 'table';
        failures.push(
          `${who} "${table}" is EXPOSED — anon read ${r.count} rows (expected 0). ` +
          `HTTP ${r.status}.\n      Check for a policy granted TO public or TO anon on this table.`);
      } else if (pii.has(table) && r.body !== '[]' && r.body !== '') {
        failures.push(
          `PII table "${table}" reported 0 rows but returned a non-empty body: ` +
          `${r.body.slice(0, 120)}`);
      }
    } else if (r.status === 404) {
      failures.push(
        `"${table}" is classed "public" but returned 404 — it no longer exists, ` +
        `or was renamed. The baseline is stale.`);
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ ok: failures.length === 0, failures, results }, null, 2));
    if (failures.length) process.exit(1);
    return;
  }

  if (failures.length) {
    fail(failures.map((f) => `  - ${f}`).join('\n\n') +
         `\n\n  Baseline: ${BASELINE_REL}` +
         `\n  Background: security/2026-08-18-supabase-rls-exposure.pdf`);
  }

  const denied = tables.filter(([, c]) => c === 'denied').length;
  const pub = tables.length - denied;
  console.log(`  RLS guard OK — ${denied} tables deny anon (incl. ${pii.size} PII), ` +
              `${pub} intentionally public, ${tables.length} checked against production.`);
}

main().catch((e) => fail(e.stack || String(e)));

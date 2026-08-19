#!/usr/bin/env node
/**
 * Proves scripts/audit/rls-guard.js actually catches things.
 *
 * A guard that exits 0 without this passing is not known to check anything —
 * see CLAUDE.md on the membership-pricing guard, which crashed unnoticed for
 * weeks and then, once "fixed", still only validated shape.
 *
 * The interesting case here is the LIVE DRIFT test. Rather than mocking a
 * response, it points the guard at a fixture that reclassifies a genuinely
 * readable table (central_events) as "denied". Production really does return
 * rows for it, so the guard must fail — which exercises the exposure-detection
 * path end to end against the real database. That is the same shape of failure
 * tour_bookings presented on 2026-08-18.
 *
 * Network tests skip themselves when production is unreachable, so this stays
 * runnable offline without going red for the wrong reason.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..', '..');
const GUARD = path.join(REPO, 'scripts', 'audit', 'rls-guard.js');
const REAL_BASELINE = path.join(REPO, 'security', 'rls-baseline.json');

function baseline() {
  return JSON.parse(fs.readFileSync(REAL_BASELINE, 'utf8'));
}

/** Write a mutated baseline to a temp file and return its repo-relative path. */
function fixture(mutate) {
  const b = baseline();
  mutate(b);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rls-guard-'));
  const abs = path.join(dir, 'rls-baseline.json');
  fs.writeFileSync(abs, JSON.stringify(b, null, 2));
  return path.relative(REPO, abs).split(path.sep).join('/');
}

/** Run the guard. Returns {code, out}. Never throws on non-zero exit. */
function runGuard(args = [], baselineRel = null) {
  const env = { ...process.env };
  if (baselineRel) env.RLS_BASELINE = baselineRel;
  try {
    const out = execFileSync(process.execPath, [GUARD, ...args], {
      cwd: REPO, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

let online = null;
async function productionReachable() {
  if (online !== null) return online;
  try {
    const r = await fetch('https://zngbawafqjntciafhxgr.supabase.co/rest/v1/', {
      method: 'HEAD', signal: AbortSignal.timeout(8000),
    });
    online = r.status > 0;
  } catch { online = false; }
  return online;
}

// ---------------------------------------------------------------- shape

test('the committed baseline is well-formed', () => {
  const r = runGuard(['--offline']);
  assert.strictEqual(r.code, 0, `expected pass, got:\n${r.out}`);
  assert.match(r.out, /baseline OK/);
});

test('every PII table is classed denied in the committed baseline', () => {
  const b = baseline();
  assert.ok(b.pii_tables.length > 0, 'expected at least one PII table');
  for (const t of b.pii_tables) {
    assert.strictEqual(b.tables[t], 'denied', `${t} must be denied`);
  }
});

test('rejects a PII table reclassified as public', () => {
  const f = fixture((b) => { b.tables[b.pii_tables[0]] = 'public'; });
  const r = runGuard(['--offline'], f);
  assert.strictEqual(r.code, 1, 'guard should reject PII classed public');
  assert.match(r.out, /PII must be "denied"/);
});

test('rejects an unknown access class', () => {
  const f = fixture((b) => { b.tables.tour_bookings = 'maybe'; });
  const r = runGuard(['--offline'], f);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /expected: denied \| public/);
});

test('rejects a public table with no written rationale', () => {
  const f = fixture((b) => {
    b.tables.central_activity_log = 'public';   // was denied
    delete b.public_rationale.central_activity_log;
  });
  const r = runGuard(['--offline'], f);
  assert.strictEqual(r.code, 1, 'undocumented public access should fail');
  assert.match(r.out, /no entry in "public_rationale"/);
});

test('rejects a PII table missing from the tables map', () => {
  const f = fixture((b) => { delete b.tables[b.pii_tables[0]]; });
  const r = runGuard(['--offline'], f);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /is not listed in "tables"/);
});

test('rejects malformed JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rls-guard-bad-'));
  const abs = path.join(dir, 'rls-baseline.json');
  fs.writeFileSync(abs, '{ not json');
  const rel = path.relative(REPO, abs).split(path.sep).join('/');
  const r = runGuard(['--offline'], rel);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Could not parse/);
});

test('rejects a missing baseline', () => {
  const r = runGuard(['--offline'], 'security/does-not-exist.json');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Baseline not found/);
});

// ---------------------------------------------------------------- live drift

test('DRIFT: flags a readable table that the baseline says is denied', async (t) => {
  if (!(await productionReachable())) return t.skip('production unreachable');

  // central_events is genuinely readable by anon (published public events).
  // Claiming it is denied must trip the exposure check against the real DB.
  const f = fixture((b) => {
    b.tables.central_events = 'denied';
    delete b.public_rationale.central_events;
  });
  const r = runGuard([], f);
  assert.strictEqual(r.code, 1, `expected exposure failure, got:\n${r.out}`);
  assert.match(r.out, /central_events" is EXPOSED/);
  assert.match(r.out, /granted TO public or TO anon/);
});

test('DRIFT: reports a PII table as PII when exposed, not just as a table', async (t) => {
  if (!(await productionReachable())) return t.skip('production unreachable');

  // Same mechanism, but assert the message escalates for PII: reclassify a
  // readable table as PII+denied and confirm the louder wording is used.
  const f = fixture((b) => {
    b.tables.central_events = 'denied';
    delete b.public_rationale.central_events;
    b.pii_tables = [...b.pii_tables, 'central_events'];
  });
  const r = runGuard([], f);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /PII TABLE "central_events" is EXPOSED/);
});

test('the real baseline passes against production', async (t) => {
  if (!(await productionReachable())) return t.skip('production unreachable');
  const r = runGuard([]);
  assert.strictEqual(r.code, 0, `production drifted from the baseline:\n${r.out}`);
  assert.match(r.out, /RLS guard OK/);
});

test('--json emits a parseable result', async (t) => {
  if (!(await productionReachable())) return t.skip('production unreachable');
  const r = runGuard(['--json']);
  assert.strictEqual(r.code, 0);
  const parsed = JSON.parse(r.out);
  assert.strictEqual(parsed.ok, true);
  assert.ok(Array.isArray(parsed.results) && parsed.results.length > 0);
});

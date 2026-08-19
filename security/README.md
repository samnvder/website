# security/

Security findings against the live site and its backing services, kept as dated,
self-contained records.

## What lives here

| File | What it is |
|---|---|
| [2026-08-18-supabase-rls-exposure.pdf](./2026-08-18-supabase-rls-exposure.pdf) | Audit record: RLS exposure on `tour_bookings` / `tour_referrals`, root cause, fix, verification |
| [generate-rls-audit-record.py](./generate-rls-audit-record.py) | Regenerates that PDF. Edit this, not the PDF. |
| [rls-baseline.json](./rls-baseline.json) | The expected anonymous-access surface of the database. Enforced by `npm run guard:rls`. |

Regenerate with:

```bash
python security/generate-rls-audit-record.py
```

## The rule that makes these safe to keep

**A record in this directory contains no secrets and no personal data.**

Exposure gets evidenced by *row counts, policy definitions and HTTP status
codes* — never by sample rows, never by a key. That is what makes these files
committable, and shareable with counsel or an insurer, without the record
becoming a second copy of the incident.

Concretely, never put in here:

- Customer names, emails, phone numbers, or any row of a table holding them
- API keys of any kind. The Supabase `anon` key is published by design and is
  still not reproduced here — quoting it invites the misreading that its
  disclosure was the bug.
- Connection strings, service-role keys, admin credentials
- Database dumps or CSV exports

**Exports of affected data go outside the repository.** A dump taken as a
restore point before a risky change is 200+ rows of PII; committing it moves the
exposure into git history, where it is far harder to expunge than a database
row. Write it somewhere like `Documents/supabase-pii-backup-<date>/`.

## Why the generator is committed alongside the PDF

The PDF is a build artifact. Findings get corrected — the 2026-08-18 record was
revised twice during the work it documents, once when the root cause turned out
to be a `{public}` policy rather than absent RLS, and once when the original
status-code methodology was shown to be unsound. Keeping the source means a
correction is a diff rather than a new document, and git history shows what
changed and when.

## Relationship to the rest of the repo

These records are **not** restore points and **not** a backup — the same caveat
that applies to the whole repository (see [CLAUDE.md](../CLAUDE.md)). They are
written records of what was found, what was changed, and what was verified.

Live remediation work is tracked in [handoffs/](../handoffs/); a record here
points back at the handoff that produced it. Code running on the live site is
mirrored in [live/](../live/) under the backup law.

## The RLS baseline and its guard

`npm run guard:rls` asks **production** what the `anon` role can actually read,
and fails if it disagrees with [rls-baseline.json](./rls-baseline.json). It is in
the `npm run guard` chain, so a red chain now includes "someone opened a table to
the internet".

It records **access class, not row counts** — counts change as the club adds
events; access class should never change without someone deciding it should.

```bash
npm run guard:rls                            # probe production
node scripts/audit/rls-guard.js --offline    # validate baseline shape only
node scripts/audit/rls-guard.js --json       # machine-readable
```

**Why behaviour and not policy names.** The 2026-08-18 hole was a policy called
"Service role full access" granted `TO public`. It read as correct in any listing.
A guard that parsed policy names would have passed that database every time, so
this one asks what anon can *see*.

Proven by `scripts/audit/testing/test-rls-guard.js` (12 tests, in `npm test`).
Two of them are real drift tests: they reclassify a genuinely readable table as
`denied` and confirm the guard fails against the live database. **A guard that
exits 0 without those passing is not known to check anything** — see
[CLAUDE.md](../CLAUDE.md) on the membership-pricing guard.

### Known limit — read before trusting a green run

**The guard cannot discover new tables.** Enumerating the schema needs the
`service_role` key (`GET /rest/v1/` rejects `anon` with 401), so a newly exposed
table is invisible until it is added to the baseline. This is exactly how the
original finding stayed hidden: two of the three known tables were found by
guessing names, and a 60-name guess later missed 42 tables that existed.

**Refresh the baseline whenever tables are added.** In the Supabase SQL editor:

```sql
select c.relname                                    as table_name,
       c.relrowsecurity                             as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;
```

Any table in that list and not in `tables` needs classifying. Default to
`denied`; `public` requires an entry in `public_rationale` explaining why, and
the guard fails without one — undocumented public access is how a deliberate
exception becomes an unnoticed hole.

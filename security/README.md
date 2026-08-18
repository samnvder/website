# security/

Security findings against the live site and its backing services, kept as dated,
self-contained records.

## What lives here

| File | What it is |
|---|---|
| [2026-08-18-supabase-rls-exposure.pdf](./2026-08-18-supabase-rls-exposure.pdf) | Audit record: RLS exposure on `tour_bookings` / `tour_referrals`, root cause, fix, verification |
| [generate-rls-audit-record.py](./generate-rls-audit-record.py) | Regenerates that PDF. Edit this, not the PDF. |

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

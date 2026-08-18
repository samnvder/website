# Handoff — Lock down Supabase RLS on `tour_bookings` and `tour_referrals`

**Created:** 2026-08-18 · **Status:** 🔴 **OPEN — priority zero** · **Est.:** ~30 min, most of it verification

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## What is wrong

**Every tour prospect's name, email and phone number is readable by anyone on the internet, and the whole booking table is deletable by anyone on the internet.**

Supabase project `zngbawafqjntciafhxgr` exposes PostgREST at `/rest/v1/`. The `anon` key that authenticates those requests is embedded in the page source of `/schedule-a-tour/`, `/memberships/` and — via WPCode snippet **8309** — the floating booking widget on all ~26 pages.

**Publishing the anon key is normal and correct.** It is designed to be public. The key is not the bug. The bug is that **Row Level Security is not restricting what the anon role may do with it**, so a key intended to be a public identifier is functioning as a public admin credential.

Found 2026-08-18 while deleting the `tour_booked` test booking (see [publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md)). Deleting that row required no privileged access at all — the anon key alone was sufficient, which is what exposed the problem.

### Measured exposure

Every figure below came from a live request against production on 2026-08-18.

| Table | Rows reachable | Contents | anon `SELECT` | anon `UPDATE` | anon `DELETE` |
|---|---|---|---|---|---|
| `tour_bookings` | **231** | first/last name, email, `cell_phone`, preferred date/time, `how_heard`, `interests`, `note`, `gender`, contact-consent flags, `engage_pro_prospect_id`, `source_page`, UTMs | ✅ | ✅ | ✅ |
| `tour_referrals` | **30** | `referee_*` and `referrer_*` name/email/phone — **PII for two people per row**, including members who referred someone | ✅ | ✅ | ✅ |
| `central_departments` | 12 | operational, not sensitive | ✅ | ✅ | ✅ |

`INSERT` on `tour_bookings` returned **HTTP 400** (a `NOT NULL` column complaint), not 401/403 — meaning **RLS permitted the write and Postgres rejected the payload shape**. Insert is open too.

### How the write probes were run without destroying anything

Both used a filter matching a UUID that cannot exist, so zero rows were in scope. A locked-down table returns `401`/`403` regardless of filter; an open one returns `204`. Both returned `204`.

```bash
# Reproduces the finding. Deletes nothing — the id matches no row.
K='<anon key from live/wpcode/8309-floating-book-tour-button.html line 490>'
U='https://zngbawafqjntciafhxgr.supabase.co'
curl -s -o /dev/null -w "DELETE -> %{http_code}\n" -X DELETE \
  "$U/rest/v1/tour_bookings?id=eq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: $K" -H "Authorization: Bearer $K"
```

Currently prints `DELETE -> 204`. **After the fix it must print `401` or `403`.**

### Why this rates above everything else in `handoffs/`

Every other open handoff moves a number in a report. This one is a live data-protection failure with three distinct blast radii:

1. **Disclosure.** 231 prospects and 30 referral pairs — names, emails, phones — retrievable by one `curl`. California, so CCPA applies, and these are marketing leads with consent flags attached.
2. **Destruction.** One `DELETE` with no filter wipes the booking table. There is **no verified restore path** — see [CLAUDE.md § Known issues](../CLAUDE.md): server backups exist but cannot be restored under the free plugin's ~512 MB import cap, and GoDaddy's managed backups have never been checked. That covers WordPress, not Supabase, so **whether Supabase backups exist at all is itself unverified — step 1 below.**
3. **Tampering.** `UPDATE` is open, so appointment times can be silently rewritten. Staff would see a calendar that disagrees with the confirmation emails already sent, with no audit trail.

---

## Why the fix is safe — verified, not assumed

**No live widget reads or writes a Supabase table directly.** Every call goes through an edge function:

```bash
cd "<repo root>"
grep -rn "rest/v1" live/ patches/ "Website/Pages"        # expect: no output
grep -rhoE "functions/v1/[a-zA-Z0-9-]+" live/ | sort -u  # expect exactly 3 lines
```

Expected output of the second command:

```
functions/v1/book-tour
functions/v1/check-availability
functions/v1/validate-referral
```

Edge functions run server-side with the **service role**, which **bypasses RLS entirely**. So revoking anon table access removes the hole without touching the booking flow.

> **This is the load-bearing claim of the whole handoff — re-run both greps yourself before changing any policy.** If the first grep ever returns a hit, some widget does read a table directly and denying anon will break it. The repo also lags live ([CLAUDE.md](../CLAUDE.md)), so the greps prove what the *repo* does. Step 4's live booking test is what proves it for *production*.

---

## Steps

### 1 · Establish a restore point before touching anything

🛑 **HUMAN GATE — do not change a policy until a restore path exists.** The whole reason this is urgent is that the table can be wiped; do not add risk while fixing it.

In the Supabase dashboard → **Database → Backups**, confirm PITR or daily backups are on and note the most recent timestamp. If there are none, take a manual dump first:

```bash
pg_dump "<connection string from Supabase → Settings → Database>" \
  -t public.tour_bookings -t public.tour_referrals \
  --data-only --column-inserts > supabase-pii-backup-2026-08-18.sql
```

**Write it outside the repo.** It is 261 rows of customer PII — committing it would move the leak into git history, where it is far harder to remove than a database row.

### 2 · Read the current policies before writing new ones

Supabase dashboard → **SQL Editor**:

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in ('tour_bookings','tour_referrals','central_departments');

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Two shapes are possible and they need different fixes:

| `relrowsecurity` | Meaning | Fix |
|---|---|---|
| `false` | RLS never enabled — PostgREST exposes the table wholesale | Step 3a |
| `true` | RLS on, but a permissive policy grants `anon` | Step 3b — drop that policy |

**Record the output in this handoff before changing anything.** If a policy is dropped, its definition must be recoverable.

### 3 · Close the hole

The booking flow needs **no** anon table access, so the correct grant is none.

**3a — if RLS is off:**

```sql
alter table public.tour_bookings   enable row level security;
alter table public.tour_referrals  enable row level security;
alter table public.central_departments enable row level security;
```

With RLS enabled and no policy present, `anon` is denied everything and the service role still bypasses it. **Do not add a permissive policy to "keep things working"** — that recreates the hole.

**3b — if a permissive policy exists,** drop precisely that policy by the name from step 2:

```sql
drop policy "<exact name from pg_policies>" on public.tour_bookings;
```

Then re-run the step 2 query and confirm no `anon`/`public` row remains.

> `central_departments` holds nothing sensitive, but it is exposed by the same misconfiguration. If any widget reads it, step 4 will fail loudly and you can add a narrow `select`-only policy for that one table. Lock it down first and find out.

### 4 · Verify — the fix and the booking flow

**Anon table access is closed.** Every line must print `401` or `403`:

```bash
K='<anon key>'; U='https://zngbawafqjntciafhxgr.supabase.co'
for t in tour_bookings tour_referrals central_departments; do
  printf "%-22s " "$t"
  printf "GET %s  " "$(curl -s -o /dev/null -w '%{http_code}' \
    "$U/rest/v1/$t?select=*&limit=1" -H "apikey: $K" -H "Authorization: Bearer $K")"
  printf "DELETE %s\n" "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE \
    "$U/rest/v1/$t?id=eq.00000000-0000-0000-0000-000000000000" \
    -H "apikey: $K" -H "Authorization: Bearer $K")"
done
```

Before the fix this prints `GET 200  DELETE 204` on all three rows. **After, every code must be `401` or `403`. A `200` on any line means that table is still open.**

**The booking flow still works.** Availability must keep returning data — it is served by an edge function, so RLS must not affect it:

```bash
curl -s -X POST "$U/functions/v1/check-availability" \
  -H "Content-Type: application/json" -H "apikey: $K" -H "Authorization: Bearer $K" \
  -d '{"date":"2026-09-15"}'
```

Expect `"success":true` with populated `all_slots` and `available_slots`. **An error here means an edge function was reading the table as `anon` after all — roll back step 3 immediately and re-read step 2's output.**

🛑 **HUMAN GATE — end-to-end booking test.** A real booking writes a real row, sends a real confirmation email and lands on the staff tour calendar in Engage Pro. Confirm with the site owner first, use a `+alias` address, and **delete both the Supabase row and the Engage Pro appointment afterwards** — the 2026-08-18 test needed exactly that cleanup and the Engage Pro half is still outstanding.

The `curl` availability check plus the two greps cover the read path. Only a real booking exercises the `book-tour` write path.

### 5 · Check the rest of the schema

`tour_bookings` was found because the tour work touched it. **Nothing suggests it is the only exposed table** — the two others were found by guessing names.

```bash
curl -s "$U/rest/v1/" -H "apikey: $K" -H "Authorization: Bearer $K" | head -c 4000
```

The PostgREST root returns an OpenAPI document listing every table the anon role can see. Walk it and apply steps 2–4 to anything holding personal or operational data.

---

## When it is done

- [ ] Restore point confirmed or dump taken (step 1)
- [ ] Pre-change `pg_policies` output recorded below
- [ ] RLS enabled / permissive policy dropped on all three tables
- [ ] All nine status codes in step 4 are `401`/`403`
- [ ] `check-availability` still returns `"success":true`
- [ ] Real booking placed, confirmed, then cleaned up from **both** Supabase and Engage Pro
- [ ] PostgREST root walked; no other table exposes personal data
- [ ] Outcome recorded here and the row in [handoffs/README.md](README.md) moved to Closed

### Pre-change policy state

> Paste the step 2 output here before changing anything.

```
(not yet captured)
```

---

## Out of scope

- **Rotating the anon key.** It is meant to be public; rotating it changes nothing about the exposure and forces edits to four live code blocks. Fix RLS instead. *(If the key is ever rotated for another reason, all four embeds must change together — the two `se-cal.html` blocks, WPCode 8309, and the repo page sources. See [live/README.md](../live/README.md) and the backup law in [CLAUDE.md](../CLAUDE.md).)*
- **Whether 231 prospects must be notified.** A disclosure decision for the owner, not an engineering one. Worth knowing: there is no access log proving the data was *not* retrieved.
- **Engage Pro's own access controls.** Different system, unreviewed.

## Related

- **[publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md)** — where this was found; its outstanding Engage Pro cleanup is referenced in step 4.
- **[live/wpcode/8309-floating-book-tour-button.html](../live/wpcode/8309-floating-book-tour-button.html)** — the site-wide widget carrying the anon key.
- **[CLAUDE.md § Known issues](../CLAUDE.md)** — the unverified-restore problem that makes the `DELETE` exposure worse than the `SELECT` one.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/lock-down-supabase-rls.md in this repo.

Read it in full first, along with CLAUDE.md.

Context: the Supabase anon key embedded in the live booking widgets grants
full SELECT/UPDATE/DELETE on public.tour_bookings (231 rows of prospect
name/email/phone), public.tour_referrals (30 rows, PII for two people each)
and public.central_departments. Confirmed against production on 2026-08-18
with live requests. This is a missing-RLS problem, NOT a leaked-key problem —
the anon key is supposed to be public. Do not "fix" it by rotating the key.

Order matters:

1. Confirm a restore point EXISTS before changing any policy. The table can
   currently be wiped by anyone and the repo documents no verified restore
   path. Do not add risk while fixing risk. This is a HUMAN GATE.
2. Record the current pg_policies / relrowsecurity output into the handoff
   BEFORE changing it, so anything you drop can be recreated.
3. Only then enable RLS or drop the permissive policy.

The fix is safe because no live widget touches /rest/v1 directly — all three
widgets call edge functions (book-tour, check-availability, validate-referral)
which run as the service role and bypass RLS. VERIFY THAT YOURSELF with the
two greps in the handoff before you change a policy. It is the load-bearing
assumption. Note the repo lags live, so the greps prove the repo, not
production — the availability curl is what proves production.

Verify with curl and expected status codes, never a browser (the browser lies
about cache — see CLAUDE.md). After the change every /rest/v1 request with the
anon key must return 401 or 403, and check-availability must still return
"success":true. If availability breaks, roll back immediately.

Do NOT make a real test booking without asking me first — it writes a real
row, sends a real email, and puts a fake tour on the staff calendar in Engage
Pro. The last test booking's Engage Pro appointment (id 831) still has not
been cleaned up.

Finally, walk the PostgREST root document and check whether any OTHER table is
exposed. tour_bookings was found by accident; the other two were found by
guessing table names, so the list is probably incomplete.

Report: what the policy state was before, what you changed, the nine status
codes from the verification loop, whether the booking flow still works, and
any other exposed table you found.
```

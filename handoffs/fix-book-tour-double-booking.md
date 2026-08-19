# Handoff — `book-tour` accepts double-bookings

**Created:** 2026-08-18 · **Status:** 🔴 **OPEN** · **Est.:** ~45 min, most of it getting at the edge-function source

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## What is wrong

**The `book-tour` edge function does not check whether a slot is already taken.** It accepts and confirms a booking for a time that `check-availability` reports as booked, creating a second prospect for a tour slot that already has one.

Slot conflict is enforced **only in the browser**. The server enforces nothing.

Found 2026-08-18 while verifying the write path during [lock-down-supabase-rls.md](lock-down-supabase-rls.md). The request was expected to be rejected; it succeeded.

### Reproduction

`2026-08-23 10:30 AM` had a genuine booking. `check-availability` reported it:

```
"booked_slots":["10:30 AM"]
```

Posting that exact slot to `book-tour` anyway returned:

```json
{"success":true,"booking_id":"4a2f82a7-51c9-47d4-9540-63394f2770bf",
 "status":"confirmed","crm_synced":true,"appointment_created":true,
 "appointment_rescheduled":false,"supabase_available":true,
 "message":"Tour booked successfully! You'll receive a confirmation shortly."}
```

No warning, no conflict field, no `rescheduled` flag. A row was written, the CRM was synced, and a **second appointment was placed on the staff calendar for a slot that already had one**. Both the row and the Engage Pro prospect (`34548`) were cleaned up afterwards.

### Why client-side gating is not enough

The widget does gate carefully — [`live/wpcode/8309-floating-book-tour-button.html:606`](../live/wpcode/8309-floating-book-tour-button.html) builds a `bookedSet` from `booked_slots` and renders taken times as `disabled` options labelled `(Booked)`, with an alternative-time suggester at line 924. That is good UX and it is why this has stayed invisible.

It is not a control. Two ways past it, neither exotic:

1. **The race.** Two visitors load the form at the same time, both see 10:30 AM free, both submit. `check-availability` was correct when each of them read it. Nothing re-checks at write time. This needs no bad actor at all — just two people and one popular slot.
2. **Any request not made by the widget.** The endpoint is a public HTTP POST authenticated with a key published in the page source. A stale tab, a resubmitted request, a script, or a curl bypasses every `disabled` attribute in the markup.

### Blast radius

Two prospects arrive for the same tour. Both hold a confirmation email naming that time, and both appear on the staff calendar in Engage Pro. Staff discover it when the second person walks in.

This is the **primary conversion path** for the club. The failure lands on a prospect at their first in-person contact, which is the worst possible moment for it.

Severity is bounded by tour volume — this is not a high-frequency booking system — but the race is real and the impact per occurrence is high.

---

## Where the fix goes, and the blocker

**The fix belongs in the `book-tour` edge function.** A slot conflict must be rejected server-side, at write time, inside the same transaction that inserts the row.

**⚠️ The edge-function source is not in this repository.** `Components/Backend/supabase/functions/book-tour/` exists but is **empty**. Nothing in this repo can build or deploy the function. Retrieve the current source before editing:

- Supabase dashboard → **Edge Functions** → `book-tour` → source view, or
- `supabase functions download book-tour` (the CLI is **not** installed on this machine), or
- wherever it is actually deployed from, if that is a separate project.

> **This is itself a gap worth closing.** Three edge functions — `book-tour`, `check-availability`, `validate-referral` — are load-bearing production code living in exactly one mutable place outside this repo. That is precisely what [CLAUDE.md § the backup law](../CLAUDE.md) exists to prevent. **Mirror all three into `live/supabase/functions/<name>/` as part of this work**, unpatched capture first, then the patched version, per the two-commit rule.

---

## Steps

### 1 · Retrieve and mirror the current source

Get `book-tour`'s source by paste or download. Commit it **unmodified** to `live/supabase/functions/book-tour/` first, so the pre-change state is a `git show HEAD~1:` away. Do the same for `check-availability` and `validate-referral` while you have access.

### 2 · Add a server-side conflict check

Reject a booking whose `preferred_date` + `preferred_time` already has a confirmed row, **before** inserting, syncing the CRM, or sending mail. Return a shape the widget can already act on — it has a suggester built for exactly this case.

Suggested response for a conflict:

```json
{"success": false, "error": "slot_unavailable",
 "message": "That time was just booked. Please choose another.",
 "available_slots": ["11:00 AM", "11:30 AM"]}
```

Ordering matters: the check, the insert and the CRM sync must not be able to interleave with another request. A check-then-insert with a gap between them reopens the same race at a narrower window.

### 3 · Close the race at the database, not just in code

🛑 **HUMAN GATE — schema change on production.** Application-level checks lose races; the database does not. A partial unique index makes a double-booking impossible regardless of what any caller does:

```sql
-- Confirm the intended semantics first: is one tour per slot correct,
-- or can staff run concurrent tours? This index enforces exactly one.
create unique index concurrently if not exists tour_bookings_one_per_slot
  on public.tour_bookings (preferred_date, preferred_time)
  where status = 'confirmed';
```

**Check for existing duplicates before creating it** — the index will fail to build if any exist, which is itself a useful audit:

```sql
select preferred_date, preferred_time, count(*)
from public.tour_bookings
where status = 'confirmed'
group by 1, 2 having count(*) > 1
order by 1, 2;
```

If that returns rows, there are already double-bookings in the table, and how to resolve them is an owner decision — not something to clean up unilaterally.

### 4 · Verify

**The conflict is rejected.** Against a slot known to be booked — confirm with `check-availability` first:

```bash
K='<anon key from live/wpcode/8309-floating-book-tour-button.html>'
U='https://zngbawafqjntciafhxgr.supabase.co'
curl -s -X POST "$U/functions/v1/check-availability" \
  -H "Content-Type: application/json" -H "apikey: $K" -H "Authorization: Bearer $K" \
  -d '{"date":"<date>"}' | grep -oE '"booked_slots":\[[^]]*\]'
```

Then post that exact slot to `book-tour`. **Expect `"success":false` and `"error":"slot_unavailable"`.** A `"success":true` means the fix did not land.

Use clearly-labelled, undeliverable test data so a regression cannot reach a real inbox — `@example.invalid` does not resolve:

```json
{"first_name":"CONFLICT","last_name":"PROBE-DELETE-ME",
 "email":"probe@example.invalid","cell_phone":"0000000000",
 "preferred_date":"<booked date>","preferred_time":"<booked time>",
 "send_texts":"0","send_calls":"0","send_emails":"now",
 "source_page":"conflict-verification-probe","device_type":"desktop"}
```

🛑 **HUMAN GATE — if the probe returns `"success":true`, it has created a real row, a real CRM prospect and a real staff-calendar appointment.** Note the `booking_id` and `engage_pro_prospect_id` from the response and clean up **both** systems immediately. Anon cannot delete the row — RLS is locked down — so removal requires the SQL editor:

```sql
delete from public.tour_bookings where id = '<booking_id>';
```

**A free slot still books.** Confirm the fix did not break the normal path by posting to a slot `check-availability` reports as available. **Expect `"success":true`** — and then clean that booking up too, in both systems.

---

## When it is done

- [ ] `book-tour` source retrieved and mirrored unpatched to `live/supabase/functions/book-tour/`
- [ ] `check-availability` and `validate-referral` mirrored too
- [ ] Server-side conflict check added and deployed
- [ ] Existing duplicates checked for, and resolved with the owner if any exist
- [ ] Unique index created (or a deliberate decision recorded not to)
- [ ] Conflict probe returns `"success":false`
- [ ] A free slot still books successfully
- [ ] Every test booking cleaned up from **both** Supabase and Engage Pro
- [ ] Row in [handoffs/README.md](README.md) moved to Closed

## Out of scope

- **The client-side gating.** It works and is good UX. Leave it; it is the wrong layer for the fix, not a broken one.
- **RLS.** Settled in [lock-down-supabase-rls.md](lock-down-supabase-rls.md). This defect is unrelated and predates it — the function has never checked for conflicts.

## Related

- **[lock-down-supabase-rls.md](lock-down-supabase-rls.md)** — where this was found. Also documents that `anon` can no longer delete rows, which is why cleanup now needs the SQL editor.
- **[security/2026-08-18-supabase-rls-exposure.pdf](../security/2026-08-18-supabase-rls-exposure.pdf)** — the probe that exposed this is recorded in §8.
- **Engage Pro appointment `831`** — outstanding cleanup from an earlier test, noted in both handoffs.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/fix-book-tour-double-booking.md in this repo.

Read it in full first, along with CLAUDE.md.

Context: the book-tour Supabase edge function accepts a booking for a slot
that check-availability reports as already booked. Confirmed against
production on 2026-08-18 — the request returned "success":true, wrote a row,
synced the CRM and created a second staff-calendar appointment for a slot that
already had one. Slot conflict is enforced only in browser JavaScript; the
server enforces nothing. Two prospects can be booked into one tour, either by
two people submitting at once or by any request that does not come from the
widget.

The blocker is that the edge-function source is NOT in this repo —
Components/Backend/supabase/functions/book-tour/ exists but is empty, and the
supabase CLI is not installed. Retrieve it from the Supabase dashboard first,
and mirror it (plus check-availability and validate-referral) into
live/supabase/functions/ per the backup law in CLAUDE.md — unpatched capture
committed first, then the patched version.

Fix server-side, at write time, in the same transaction as the insert. Then
close the race at the database with a partial unique index — but check for
existing duplicates first, and treat any you find as an owner decision, not
something to clean up yourself. The index is a HUMAN GATE.

Verify with curl and expected output, never a browser (the browser lies about
cache — see CLAUDE.md). Posting a booked slot must return "success":false with
"error":"slot_unavailable"; a free slot must still return "success":true.

Use undeliverable @example.invalid test data. If a probe returns
"success":true unexpectedly, it has created a REAL row, a REAL CRM prospect
and a REAL staff-calendar appointment — capture booking_id and
engage_pro_prospect_id from the response and clean up BOTH systems at once.
Anon cannot delete rows any more (RLS was locked down 2026-08-18), so removal
needs the SQL editor. Engage Pro appointment 831 is also still outstanding
from an earlier test.

Report: what the function did before, what you changed, whether any existing
duplicate bookings were found, and the verification output for both the
conflict case and the free-slot case.
```

# Handoff — `book-tour` accepts double-bookings

**Created:** 2026-08-18 · **Status:** 🟡 **MOSTLY DONE 2026-08-18 — do not re-run steps 1 and 2.** The server-side conflict check is **written, deployed and verified in production**; the source blocker is gone. **What is genuinely left is step 3 only** — the database-level unique index, never attempted. · **Est.:** ~20 min for step 3, most of it deciding whether one tour per slot is the correct rule.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## ⚠️ Read this first — most of this handoff is already done

Executed 2026-08-18. **Steps 1 and 2 are finished. Do not redo them.** A cold reader following this
document top to bottom would re-retrieve source that is already in git and re-write a check that is
already running in production.

| Step | State |
|---|---|
| 1 · Retrieve and mirror the source | ✅ **Done, but not where this handoff said.** See below. |
| 2 · Server-side conflict check | ✅ **Written, deployed and verified in production.** A second booking of the same slot now returns **409**; it returned `success:true` before. |
| 3 · Unique index at the database | ❌ **Not attempted. This is the open work.** |
| 4 · Verify | ✅ Done for steps 1–2, by `curl` against production — output below. |

**The blocker this handoff was built around is gone.** The source was never missing, only missing *here*:
all three edge functions live in a **separate repo**, `Documents/Local Projects/engagepro-booking-app`,
with git history and a GitHub remote. **That repo is the source of truth for the booking system.**
The fix is commit `b9d5e3c` there.

**Mirroring into `live/supabase/functions/` was tried and then deliberately reversed** (commits `2274c87`
and `1ceddf3`, undone by `18137c7`). Two copies of the same code in two repos is a drift hazard — exactly
the failure the backup law exists to prevent, arriving by a different route. This repo now holds a pointer
and the flow documentation instead. **Reverse that only with a reason**; the backup law is satisfied
because the code is in version control with a remote, which is what the law actually asks for.

**A follow-on defect came out of this work and is not fixed:** the 409 renders the raw token
`slot_unavailable` to visitors. Patch prepared, not deployed —
[patches/booking-409-message/](../patches/booking-409-message/). See [§ The 409 message](#the-409-message-defect).

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

### 1 · ~~Retrieve and mirror the current source~~ — ✅ DONE, differently

> **Done 2026-08-18, and the instruction below is superseded.** The source was not missing — it is in
> `engagepro-booking-app`, in git, with a remote. It was briefly mirrored here and then removed again
> (`18137c7`) to avoid keeping two copies of the same code. **Do not re-mirror without a reason.**

Get `book-tour`'s source by paste or download. Commit it **unmodified** to `live/supabase/functions/book-tour/` first, so the pre-change state is a `git show HEAD~1:` away. Do the same for `check-availability` and `validate-referral` while you have access.

### 2 · ~~Add a server-side conflict check~~ — ✅ DONE and DEPLOYED

> **Done 2026-08-18** — `engagepro-booking-app@b9d5e3c`, deployed to production. `findSlotConflict` runs
> **before** the Supabase insert and before any CRM call, so a rejected booking leaves nothing behind:
> no row, no lead, no calendar event, no email. It **fails open** on an Engage Pro outage, matching
> `check-availability` — deliberate, and the alternative (rejecting bookings during an outage) is the
> stricter trade nobody chose.
>
> Verified in production, both directions:
>
> ```
> 1. 2026-09-15 booked_slots: []
> 2. book 3:00 PM             -> 200  booking_id 213e4bf7-...  crm_synced:true
> 3. booked_slots: ["3:00 PM"]
> 4. re-book 3:00 PM (other person) -> 409 {"error":"slot_unavailable"}
> ```
>
> Step 4 returned `success:true` before the fix. **The response shape shown below was not what shipped**
> — no `available_slots` field is returned, so the widget's suggester is not fed. That is a real gap, and
> it is why the visitor gets a bare rejection rather than an alternative time.

Reject a booking whose `preferred_date` + `preferred_time` already has a confirmed row, **before** inserting, syncing the CRM, or sending mail. Return a shape the widget can already act on — it has a suggester built for exactly this case.

Suggested response for a conflict:

```json
{"success": false, "error": "slot_unavailable",
 "message": "That time was just booked. Please choose another.",
 "available_slots": ["11:00 AM", "11:30 AM"]}
```

Ordering matters: the check, the insert and the CRM sync must not be able to interleave with another request. A check-then-insert with a gap between them reopens the same race at a narrower window.

### 3 · Close the race at the database, not just in code — 🔴 **THE OPEN WORK**

> **Not attempted.** The application-level check from step 2 narrows the race; it does not close it. Two
> requests can still pass the check before either inserts. **Run the duplicate query below first** — if it
> returns rows, those are pre-existing double-bookings and resolving them is an owner call, not cleanup
> to do unilaterally.

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

## The 409 message defect

**Found 2026-08-19, while confirming the RLS change had not broken booking. Not deployed.**

The conflict response carries a machine token in the field the widgets actually display:

```json
{ "success": false, "error": "slot_unavailable", "message": "That time was just booked. Please choose another time." }
```

Every widget renders `res.data.error` **verbatim** — it never reads `message`:

```js
errEl.textContent = res.data.error || 'Something went wrong. Please try again.';
```

**So the human sentence is sent and thrown away, and the visitor sees the word `slot_unavailable`.**
It is also the only place in `book-tour` that breaks the file's own convention — every other error
returns a sentence through that field (`"First name is required"`, `"Unable to complete booking. Please
try again or call us directly."`).

**Fixed server-side rather than in the widgets, on purpose.** Three live widgets book tours — `se-cal`
(2 pages), `se-bk-floating` (site-wide via WPCode 8309), and **`se-bk-inline` on the homepage, whose
source exists in no repo at all** ([SEO/TODO.md §24](../SEO/TODO.md)). A widget-side fix needs three
Thrive pastes and is **blocked on capturing `se-bk-inline` first**; one field rename fixes all three.

Prepared on `engagepro-booking-app@claude/409-human-message`, pushed, **not deployed**. Diff, rationale,
deploy command and `curl` verification: [patches/booking-409-message/](../patches/booking-409-message/).

**Note for any future error response:** these widgets read `error` and ignore `message`, so the field
they read has to hold the human text. The server cannot send them a code and a sentence separately.

## When it is done

- [x] `book-tour` source retrieved — **in `engagepro-booking-app`, not mirrored here** (deliberate, `18137c7`)
- [x] `check-availability` and `validate-referral` accounted for — same repo
- [x] Server-side conflict check added and deployed — `b9d5e3c`
- [x] Conflict probe returns `409` · [x] a free slot still books · [x] test bookings cleaned from both systems
- [ ] **Existing duplicates checked for** — query written, never run
- [ ] **Unique index created** (or a deliberate decision recorded not to) — the open work
- [ ] **409 message patch deployed** — prepared, gated: [patches/booking-409-message/](../patches/booking-409-message/)
- [ ] `available_slots` returned on conflict, so the widget can suggest a time — never shipped
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

⚠️ **The original kickoff is retired — it would send an agent to redo finished work.** It told the reader
the source was missing and asked for the conflict check to be written; both are done. Kept out of the way
rather than left where it could be pasted by mistake.

Use this instead. It covers only what is actually left:

```
Continue handoffs/fix-book-tour-double-booking.md in this repo. Read it in
full first, along with CLAUDE.md.

MOST OF IT IS DONE. Do NOT retrieve the edge-function source and do NOT write
a conflict check -- both landed 2026-08-18 and the check is deployed and
verified in production. The source is NOT in this repo by design: it lives in
Documents/Local Projects/engagepro-booking-app, in git, with a remote. Do not
re-mirror it here; that was tried and deliberately reversed (18137c7).

Three things are open, in this order:

1. Run the duplicate-check query in step 3 BEFORE anything else. If it
   returns rows, STOP and report -- those are pre-existing double-bookings
   and resolving them is the owner's call, not cleanup for you to do.

2. The partial unique index in step 3. This is a schema change on production
   and a HUMAN GATE. Confirm the semantics first: is exactly one tour per
   slot correct, or can staff run concurrent tours? The index enforces one.
   Ask -- do not assume.

3. Deploy the prepared 409 message patch, or say why not:
   patches/booking-409-message/. It is a one-field rename that stops the
   word "slot_unavailable" being shown to customers. Branch
   claude/409-human-message in the other repo, pushed, NOT deployed.
   Deploying is a HUMAN GATE.

Rules:
- Verify with curl and stated expected output, never a browser.
- Use undeliverable @example.invalid test data.
- A booking probe that unexpectedly returns success:true has created a REAL
  row, a REAL CRM prospect and a REAL staff-calendar appointment. Capture
  booking_id and engage_pro_prospect_id and clean up BOTH systems. anon
  cannot delete rows since the 2026-08-18 RLS lockdown, so removal needs the
  SQL editor. Engage Pro appointment 831 is still outstanding from an earlier
  test -- that is a standing example of exactly this cleanup being missed.
- More than one agent writes this repo. git log --oneline -5 and git status
  before you start, and stage explicit paths -- never git add -A.

Report: whether duplicates exist, what you decided about the index and why,
and whether the 409 patch was deployed with the curl output proving it.
```
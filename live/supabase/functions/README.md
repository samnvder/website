# live/supabase/functions/

Mirrors of the Supabase Edge Functions that run the tour booking system.

These are **the entire booking pipeline**. Before 2026-08-18 they existed in
exactly one mutable place — the Supabase dashboard — with no copy anywhere.
Nothing in this repo could rebuild them. That is precisely what the backup law
in [CLAUDE.md](../../../CLAUDE.md) exists to prevent, and it is why fixing the
double-booking defect was blocked until the source was retrieved.

| Function | Mirrored | Role |
|---|---|---|
| [`book-tour/index.ts`](./book-tour/index.ts) | ⚠️ 2026-08-18 (lossy — see below) | Writes the booking, syncs Engage Pro, creates the calendar appointment |
| [`check-availability/index.ts`](./check-availability/index.ts) | ✅ 2026-08-18 (clean) | Returns `all_slots` / `booked_slots` / `available_slots` for a date |
| [`validate-referral/index.ts`](./validate-referral/index.ts) | ✅ 2026-08-18 (clean) | Verifies a referring member by email or phone |

All three are mirrored. Only `book-tour` came through lossy; the other two
captures retained their non-ASCII characters intact.

---

## ⚠️ The `book-tour` capture is NOT byte-exact — do not paste it back

The source was captured by paste from the dashboard editor, and **the paste lost
every non-ASCII character**. The file now contains **zero** non-ASCII bytes where
the original had emoji and box-drawing characters; they arrived as `?`.

Where this shows up:

- **Comment banners** — `// ?? Config ????????...` was `// ── Config ─────...`.
  Cosmetic.
- **Staff email subjects and HTML** — `"?? Tour Booking: Supabase Down but CRM
  Succeeded"` and the `? Failed` / `? Success` markers in the alert body were
  emoji. These reach the inbox at `s@southendclub.com`. Degraded, not broken.

**The logic is intact.** The corruption is confined to comments and string
literals; no identifier, operator or control-flow token was affected. Note that
many `?` in this file are legitimate TypeScript — optional chaining (`?.`),
nullish coalescing (`??`), ternaries, optional properties — so a blind
find-and-replace would destroy it.

**Consequences, in order of importance:**

1. **Never paste this file wholesale into the dashboard.** It would replace
   working emoji with `?` in live staff notifications.
2. **It is still a usable restore point.** If the function were lost tomorrow,
   this file rebuilds it with correct behaviour and cosmetically degraded
   comments — vastly better than the nothing that existed before.
3. **Patches should be applied at the dashboard**, using this mirror to author
   and review the change, then committed here to match.

**To replace this with a byte-exact copy**, get the file rather than its text —
`supabase functions download book-tour` (the CLI is not installed on this
machine), or any dashboard download that yields a file rather than a selection.
Then verify: a correct capture has non-zero non-ASCII characters and no `??`
runs in the comment banners.

---

## Known defect in `book-tour`

**It does not check whether a requested slot is already taken.** Step 4-PRE
searches the calendar, but filters on `String(m?.ID) === pid` — *does this
prospect already have an appointment*. That is **reschedule detection**, not
conflict detection. No code path asks whether the slot is occupied by anyone
else, so two prospects can be booked into one tour.

Confirmed against production 2026-08-18. Tracked in
[handoffs/fix-book-tour-double-booking.md](../../../handoffs/fix-book-tour-double-booking.md).

## What `check-availability` reads — and a correction it forced

**`check-availability` never touches Supabase.** It contains zero references to
`createClient`, `supabase` or `tour_bookings`. Its `booked_slots` come from the
**Engage Pro CRM calendar** (`GET /api/calendar`), not from the database.

This corrected a claim made during the RLS remediation on 2026-08-18. That work
treated a populated `booked_slots` response as proof that the edge functions
bypass RLS — reasoning that the function *must* be reading `tour_bookings`, and
that returning a booking `anon` could not see therefore demonstrated service-role
access. **The premise was false.** The function reads the CRM, so its response
says nothing about database permissions either way.

The conclusion survived on other evidence: `book-tour` demonstrably wrote a row
while `anon` held no table access, and its source shows
`createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` outright. But the
reasoning was unsound and is corrected in section 8.2 of the audit record. It is
recorded here because it is the same failure the remediation itself was
criticised for: an expectation about behaviour that nobody had checked against
the implementation.

There is a practical consequence. **`check-availability` is not a health check
for database access.** It will keep returning `"success":true` with correct slot
data even if Supabase is entirely unreachable, because it never asks Supabase
anything. Do not use it to verify an RLS or database change.

## What the `book-tour` mirror settles

`book-tour` constructs its Supabase client with the service-role key:

```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

That is the load-bearing assumption of the RLS remediation, now confirmed in
source rather than inferred from behaviour. The booking flow needs no anonymous
table access, which is why every `anon` grant on `tour_bookings` could be
removed. See [security/](../../../security/) for the audit record.

No secret is committed here — every credential is read from `Deno.env`.

## Adding the remaining two

Same procedure, and the same two-commit rule as the rest of [live/](../../README.md):
commit the **unpatched capture first**, then any patch as a separate commit, so
the pre-change state is always one `git show HEAD~1:` away.

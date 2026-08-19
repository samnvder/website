# The tour booking flow

How a visitor booking a tour on southendclub.com reaches the club's CRM.

> **The source of truth for this system is a different repository:**
> [`engagepro-booking-app`](https://github.com/samnvder/engagepro-booking-app)
> (locally `Documents/Local Projects/engagepro-booking-app`). It holds the edge
> functions, the database migrations and the frontend, with full git history and
> a GitHub remote. **Edit there, not here.**

## Engage Pro is the system of record — not Supabase

This is the thing to understand first, because the naming misleads.

The booking system is **an Engage Pro (`api.vfpnext.com`) integration**. Supabase
is used to *host* the three edge functions and to keep a **secondary log** of
bookings. It is not the booking system.

Concretely, in `book-tour`:

- The Supabase insert is wrapped in a try/catch and is **explicitly non-blocking**.
  If Supabase is down, the booking proceeds and a Resend alert is emailed to staff.
- Success is decided solely by the CRM:

  ```ts
  const crmWorked = !!prospectId && !!appointmentId;
  ```

  A row in Supabase with no CRM appointment is reported to the visitor as a
  **failure**. A CRM appointment with no Supabase row is reported as **success**.

So the club's actual tour calendar lives in Engage Pro. `tour_bookings` is a
marketing/analytics record of what was submitted.

## The three functions

| Function | Talks to | Purpose |
|---|---|---|
| `check-availability` | **Engage Pro only** | Which slots are free on a date |
| `validate-referral` | **Engage Pro only** | Match a referring member by email or phone |
| `book-tour` | Engage Pro **and** Supabase | Create the booking; Supabase write is best-effort |

**Two of the three never touch the database at all.**

## Flow

```
Visitor on southendclub.com
  │  (widget: WPCode 8309 site-wide, or the se-cal element on
  │   /schedule-a-tour/ and /memberships/)
  │
  ├─1─ POST /functions/v1/check-availability   { date }
  │      └─> GET api.vfpnext.com/api/calendar  (Engage Pro)
  │          Builds all_slots from business hours, subtracts:
  │            • Tour / Interview / Consultation events (non-cancelled)
  │            • "Unavailable" blocks — staff out, holidays, early close
  │          Returns all_slots / booked_slots / available_slots
  │          Widget renders taken times as disabled "(Booked)"
  │
  ├─2─ POST /functions/v1/validate-referral    { search_type, search_value }
  │      └─> POST api.vfpnext.com/api/member/search
  │          Email or phone only. Name-only is "noted", never matched.
  │
  └─3─ POST /functions/v1/book-tour            { full payload }
         ├─ validate: names, email, 10-digit phone, date/time,
         │            and a 2-hour minimum lead time (club timezone)
         ├─ INSERT tour_bookings                    [Supabase, best-effort]
         ├─ POST /api/engage/start                  creates lead + starts Track 11
         │                                          ("Web General Inquiry")
         ├─ appointment:
         │    • existing appointment for THIS prospect?  → reschedule it
         │    • otherwise → /api/interview/schedule      → InterviewID
         │                  GET /api/calendar            → find event (3 retries)
         │                  /api/calendar/update         → Type="Tour",
         │                                                 Status="Scheduled"
         │      (Type must be exactly "Tour" or the CRM's appointment
         │       tracks never fire)
         ├─ if referred: /api/connection/create, Track 50 on the referrer,
         │               INSERT tour_referrals, Resend notification to staff
         └─ UPDATE tour_bookings with prospect id, appointment id, sync status
```

**Constants that matter:** Track 11 = Web General Inquiry, Track 50 = Tour
Referral, `STAFF_ID` 1567364, 30-minute tours, hours 11–19 weekdays / 8–16
weekends (mirrored in the widget — change both).

## Consequences worth knowing

**`check-availability` is not a database health check.** It returns
`"success":true` with correct slot data even if Supabase is entirely
unreachable, because it never asks Supabase anything.

This corrected a claim made during the RLS remediation on 2026-08-18, which
treated a populated `booked_slots` response as proof that edge functions bypass
RLS — reasoning the function must be reading `tour_bookings`. **The premise was
false.** The conclusion held on other evidence (`book-tour` wrote a row while
`anon` had no table access, and its source uses `SUPABASE_SERVICE_ROLE_KEY`), but
the reasoning was unsound. Recorded because it is the same failure the
remediation itself was criticised for: an expectation about behaviour nobody had
checked against the implementation.

**A CRM outage fails the booking; a Supabase outage does not.** Alerts for the
latter go to `s@southendclub.com` via Resend.

**Availability fails open.** If the calendar fetch throws, `booked_slots` stays
empty and every slot is offered. Deliberate — better to take a booking and sort
it out than to show a visitor a fully-booked day.

## Open defect: `book-tour` accepts double-bookings

`book-tour` never checks whether a slot is taken **by someone else**. Its
pre-check filters the calendar on `String(m?.ID) === pid` — *does this prospect
already have an appointment* — which is reschedule detection. Slot conflict is
enforced only in the widget's JavaScript, so two simultaneous submissions, or any
request not made by the widget, book two prospects into one tour.

Confirmed against production 2026-08-18. See
[handoffs/fix-book-tour-double-booking.md](../../../handoffs/fix-book-tour-double-booking.md).

## ⚠️ The migrations still contain the RLS bug

`engagepro-booking-app/supabase/migrations/001_create_tour_bookings.sql` and
`002_create_tour_referrals.sql` are **where the 2026-08-18 exposure came from**,
and they are unfixed:

```sql
-- Allow Edge Functions (service_role) full access
CREATE POLICY "Service role full access"
  ON tour_bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

There is no `TO service_role`. Omitting the `TO` clause defaults to `public`,
which in Postgres means *every* role — including the anonymous role used by the
public website. The comment states the intent; the SQL does the opposite. The
next comment in the file reads "Block anon from reading/updating/deleting",
which was never true.

**Re-running these migrations against any fresh project reopens the hole.** They
also no longer match production, where `Anon can insert bookings` has been
dropped. A corrective migration is needed in that repo.

Live state is guarded from this repo by `npm run guard:rls` — see
[security/README.md](../../../security/README.md).

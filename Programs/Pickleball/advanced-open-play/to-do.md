# Pickleball Central Hub — project to-do

Single place for backlog, integrations, and follow-ups for **`Programs/Pickleball/advanced-open-play/`**. Update as tasks complete or scope changes.

---

## Stripe (payments)

### How hard?

**Moderate effort** — not a few lines in the static pages alone. Today, hosting is **static** (Firebase Hosting) + **client-side** Firebase; **Stripe secret keys must never ship in the browser**. You need a **trusted backend** (or an official Firebase/Stripe pattern) to create charges, confirm payments, and verify webhooks.

| Approach | Rough complexity | Notes |
|----------|------------------|--------|
| **Stripe Checkout** (redirect) + **Cloud Functions** (or Cloud Run) to create `Session`, handle **webhooks** (`checkout.session.completed`) | Medium | Good fit: create session with `metadata` (`firebaseUid`, `sessionIds`, amount). User returns to RSVP success URL. |
| **Stripe Payment Element** embedded on site | Medium–high | Still needs backend to create `PaymentIntent`; PCI handled by Stripe.js. |
| **Payment Links** (Stripe Dashboard) | Low | Manual / semi-manual; link from email or a simple “Pay” page; weak automation for “pay for exactly these RSVP slots.” |
| **Firebase Extension “Run Payments with Stripe”** | Medium | Opinionated; still need products/prices, customer mapping, testing. |

### Integration checklist (when you pick an approach)

1. **Business rules** — Pay before RSVP vs deposit vs pay at door; member $0 vs guest amount; coupons (you already have code-based discounts in RSVP).
2. **Backend** — Cloud Functions (Node) with `STRIPE_SECRET_KEY` in **Secret Manager** / env; callable HTTPS or redirect to Checkout.
3. **Webhook** — Verify signature; idempotent writes to RTDB (e.g. `openplay_se/payments/{id}` or flags on RSVP rows).
4. **Auth** — Tie Stripe Customer or `client_reference_id` to **Firebase Auth UID** so payments aren’t orphaned.
5. **UX** — Loading states, cancel URL, success/cancel pages; align with existing Zelle copy if both coexist during transition.
6. **Compliance** — Receipts, refunds, dispute handling; club counsel if terms change.

### Current baseline (no Stripe yet)

- RSVP flow references **Zelle** and **“confirmed at check-in”** in copy; revenue math on check-in is local/state-based.
- Removing Zelle later should be a deliberate copy + flow pass after Stripe is live.

---

## Backlog (non-Stripe)

- [x] **Standings + league games** — `openplay_se/league_games` in rules; public standings aggregate completed games; staff entry under **League admin → Schedule & scores**. Deploy `database.rules.json` when rules change.
- [ ] Confirm production **`database.rules.json`** deployed whenever rules change (`npm run firebase:deploy-rules` from repo `Website/`).
- [ ] Move notification production from client-side mirroring to **Cloud Functions** when private games, tournaments, or push/email delivery are added; keep `openplay_se/user_notifications/{uid}` as the user-facing feed.
- [ ] Document staff access patterns for **user_profiles** (Console vs future admin tool) if front desk needs read-only waiver view without Firebase Console.
- [ ] Optional: unify **`staging/`** with **`live/`** after large features (promote script / QA).

---

## Done / archived

_Add completed items here with a one-line note and optional date._

- **2026-04-16** — Removed **Tuesday Morning** session from the schedule. Front-end surfaces updated in `live/` and `staging/`: RSVP `SCHEDULE_CONFIG` slots, quick-add chips (`All Tue AM` removed), help copy, session groups; Account page `SCHEDULE_CONFIG_ACC`; Check-in reference schedule + `m-session` / `sm-day` dropdowns; `scripts/backtest-schedule.js` config + test cases (all 15 pass). Legacy parse/sort/time helpers in `js/south-end-openplay-sync.js` and the Check-in `SESSION_SLOT_ORDER` / `sessionSortMeta` regex keep `Tuesday Morning` so any historical RSVPs still render.
- **2026-04-16** — **Pricing + payment method**: full session price **$20 → $15** (`NON_MEMBER_SESSION_RATE`), half-off discount code now a fixed **$10/session** via new `DISCOUNT_SESSION_RATE` constant. Check-in tier dropdown labels updated to `Full Price ($15)` / `Full $15`. Swapped Zelle → PayPal throughout RSVP form and success screen; Check-in surfaces unchanged (staff payment collected off-platform).
- **2026-04-16** — **PayPal amount-specific NCP links**: RSVP (`live/` + `staging/`) now uses a `PAYPAL_LINKS` map ($15 → `UFXTWG4JHK38S`, $30 → `MZTNTLDBBQ7MA`, $45 → `UJL6S2MJLPERL`, $60 → `K8ZQAYY8BVGYA`). `updatePaymentDisplay` + success-screen handler choose the matching URL based on `pricing.total` and render the button label as `Open PayPal ($X) →`. Amounts not in the map (e.g. discount-code totals of $10/$20/$40, or >$60) fall back to `PAYPAL_FALLBACK_URL` (managed-QR link) with an "Enter this amount manually in PayPal" hint. If you start using the discount code often, add $10/$20/$40 NCP links to the map to keep everything one-tap.
- **2026-04-16** — **Pay button deduped**: the "Open PayPal" CTA is now only on the confirmation page (as the hero block, moved above the Player ID / QR codes). The RSVP form's `#pay-box` only shows `Payment | PayPal | Total Due: $X` plus a small note "You'll get the PayPal link on the next screen after you reserve." New `.success-pay-hero` CSS scales the confirmation block's title/amount/button and adds a glow + full-width CTA. `updatePaymentDisplay` cleaned up (no more pay-btn/pay-hint refs since those elements are removed from the form).
- **2026-04-16** — **Board auto-log for RSVPs**: new `SE.pushBoardRsvpLog(sessionLabels)` helper in `js/south-end-openplay-sync.js` pushes a `board_messages` entry with `kind: 'rsvp_log'` (same `uid`/`authorName`/`skill`/`isStaffAdmin`/`ts` schema as chat messages, so existing rules allow it without changes). Message text: `🎾 Signed up for <Session Label>` for 1 session or `🎾 Signed up for N sessions: A; B; C` for multiple. `submitRSVP` in `SouthEnd_Session_RSVP.html` calls it once after all successful sends (silent .catch). Board renderer styles these cards with `.board-card--rsvp-log` (neon-tinted border + pulse bar), shows a green "RSVP" pill in the meta row, and hides the "Delete my message" button for auto-logs (only chat messages stay user-deletable).
- 2026-04-26: Added scalable notification feed baseline for League Play (`user_notifications/{uid}`), with team invite notifications mirrored from invite lifecycle events and the profile-header bell reading the unified feed.

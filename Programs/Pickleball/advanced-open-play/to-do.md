# Advanced Open Play — project to-do

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

- [ ] Confirm production **`database.rules.json`** deployed whenever rules change (`npm run firebase:deploy-rules` from repo `Website/`).
- [ ] Document staff access patterns for **user_profiles** (Console vs future admin tool) if front desk needs read-only waiver view without Firebase Console.
- [ ] Optional: unify **`staging/`** with **`live/`** after large features (promote script / QA).

---

## Done / archived

_Add completed items here with a one-line note and optional date._

- _(none yet)_

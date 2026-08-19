# Handoff: Site-wide event tracking — everything that is still invisible after tours

**Status:** 🟡 **TODO — written 2026-08-19, nothing executed.** Successor to
[tour-conversion-tracking.md](tour-conversion-tracking.md), which closed the
single biggest measurement gap. This one closes the rest.
**Owner:** Claude (GTM + repo), **Sam** at every 🛑 gate.
**Time:** ~2h for Parts A–D. Phase 2 items are scoped, not timed.
**Container:** `GTM-WLRX58RN` · **GA4 property** `424923833` · **stream** `6675857159` (`G-SJN8S5QWXE`) · GA4 account `a300330852`, `authuser=2` (see the [navigation trap](publish-tour-tracking-gtm.md)).

---

## Why this exists

`tour_booked` went live 2026-08-18 (container **v7**). It was the biggest gap, not
the only one. As of 2026-08-19 the container carries the Google Tag, two legacy
click tags, and the tour event — and **the membership application, the one
action on the site that is actually revenue, reports nothing.** Neither do phone
clicks, and the Contact Us / Subscribe forms are Zapier iframes that GA4's
automatic form tracking cannot see (`form_submit = 5` per 28 days is that gap,
visible as a number — [GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md)).

When Google Ads eventually exists ([google-ads-account-setup.md](google-ads-account-setup.md)),
it will optimise toward whatever is marked as a conversion. Right now that would
be tours only, which would train it toward *lead volume* rather than *joins*.

### What is tracked today

| Tag | Type | Trigger |
|---|---|---|
| `Google Tag - G-SJN8S5QWXE` | Google Tag | All Pages |
| `Click - Message Us Button` | GA4 Event | Click Text contains "Message Us" |
| `Click - Virtual Tour!` | GA4 Event | Click Text contains "Virtual Tour!" |
| `GA4 - tour_booked` | GA4 Event | `CE - tour_booked` — v7 |
| GA4 enhanced measurement | automatic | page views, scrolls, outbound clicks, file downloads, native `<form>` submits |

### What is not, in order of value

| # | Event | Why it matters | What was found (2026-08-19) | Part |
|---|---|---|---|---|
| 1 | **Membership application sent** | The money event. A tour is a lead; this is someone who priced a plan and asked for the contract. Should be the primary Ads conversion later, valued above `tour_booked`. | All three builders (#9926, #7315, #7966) end in `alert("Thank you!…")` after `create-signature-request` succeeds — no `dataLayer` push ([9926:262–272](../live/wpcode/9926-build-your-membership-with-email-notification.js)). One push per builder + one GTM tag. Re-paste into WPCode = owner gate. | **A** |
| 2 | **Membership agreement *signed*** | Dropbox Sign completion is the true "purchase". | Server-side, in the Heroku app. Needs a GA4 Measurement Protocol call from the Dropbox Sign webhook, and ideally the browser's GA client id passed through so the server event joins the session. Needs Heroku access. | Phase 2 |
| 3 | **Phone clicks (`tel:`)** | For a local club, calls are probably the #1 conversion nobody can see. | 23 `tel:` links in the page sources — but **only 4 are the club's number** (`3105300630` / `310-530-0630`); the rest are vendor and pro numbers on `/services/` and `/racquet-sports/`. Track all, key-event only the club's. Pure GTM, no site edit. | **B** |
| 4 | **Contact Us + Subscribe forms** | The `form_submit = 5` is these, undercounted. | Both pages embed **Zapier Interfaces** (`interfaces.zapier.com`, 3 hits each on live as of 2026-08-19). Cross-origin iframe — GTM cannot see inside. Either a Zap step posting to GA4's Measurement Protocol, or a `postMessage` listener if Zapier emits one. | **C** |
| 5 | **Email clicks (`mailto:`)**, **Directions / Maps clicks** | Secondary intent signals; cheap. | `mailto:` is only on `/events/` (`events@`, `lounge@`). The Contact Us map is a Google Maps *embed* iframe — clicks inside it are invisible; only outbound `google.com/maps` links count. | **B** |
| 6 | **Pickleball open-play RSVPs** | Separate Firebase-hosted app, separate origin. | Would need its own GA4 stream or the same tag in that app. Low priority unless it is a number someone wants. | Phase 2 |
| 7 | **Enhanced Conversions (hashed email/phone)** | Improves Ads match rate. | **Deliberately deferred** until the consent language is fixed — the tour form ships a pre-ticked SMS/calls box with hardcoded flags ([SEO/TODO.md §13/§19](../SEO/TODO.md)). Do not hash and send PII on top of that. | Phase 2 |

Also in scope as a side effect: the privacy policy's §5 says only *"We may use cookies and similar tracking technologies"* — it names neither Google Analytics nor Tag Manager, and will need to name remarketing before any Ads remarketing runs. Legal content → Sam edit, not an agent edit. Tracked at the end as a follow-up, not a step.

**A cookie banner is *not* in this handoff.** US traffic, single-location club: GDPR does not apply, CCPA/CPRA applies only above thresholds the club is unlikely to meet, and Consent Mode v2 is mandatory for EEA/UK users only. Adding a banner without a legal need costs real data to opt-outs. If a lawyer says otherwise, that is a separate ~1h handoff (CMP plugin + Consent Mode in GTM).

---

## ⚠️ Read before touching the builders

1. **Two builders are served on `/memberships/`.** `curl` on 2026-08-19 shows both #9926 (double-quoted strings, ~line 2460) and #7315 (single-quoted, ~line 3194) injected into the page, and **both bind a click listener to the same `#purchaseButton`.** #7315 is inert *by accident*: its init calls `updateEnrollmentFee()`, which writes to `#originalPrice`, an element that is not on that page, so it throws and never reaches the listener. Consequences for this handoff: (a) the `membership_requested` push will fire **once** per click today, which is correct; (b) if anyone ever adds `#originalPrice` to `/memberships/`, both listeners bind and every click creates **two Dropbox Sign requests** — that is a pre-existing hazard this handoff surfaces but does not fix; (c) verify by count, not by presence. Step A0 below records what is actually loading before anything is changed.
2. **Never paste a repo page file into Thrive** — [CLAUDE.md](../CLAUDE.md). This handoff pastes **WPCode snippets** (the builders), not Thrive elements, and only from `patches/membership-requested-event/`.
3. **The builders are guarded.** `npm run guard` checks the pricing in all three against `scripts/audit/membership-pricing-source.json` and asserts #9926 has no `discounts` const. Inserting a `dataLayer` push touches none of that, but **run `npm run guard` after editing and `npm run guard:membership-pricing:prove` before committing** — a guard that passes without the proof is not known to check anything.
4. **#7966 is a reusable offer template that rests carrying `OFFER NOT SET`.** Patch it so the three stay in sync; **do not toggle it on** and do not touch its placeholders.
5. **Files are CRLF.** `pricing:apply` once emitted LF into them — do not repeat that. The generator below must preserve line endings; `git diff --stat` showing the whole file changed means it did not.
6. **Mirror law.** Every builder you paste into WPCode gets its `live/wpcode/<id>-*.js` mirror and its `Website/Pages/…` paste-source copy updated **in the same commit**, and the capture has to prove byte-identical (ignoring EOL) to the editor. Two commits per the convention: the unpatched state is already in git, so one commit with the patched trio is enough — but say so in the message.
7. **No PII in `dataLayer`, ever.** Name, email, phone stay out. Plan type, tier, counts and dollar figures are fine.

---

## Part A — `membership_requested` (the money event)

### A0 · Record what is live (read-only)

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ > /tmp/mem.html
grep -c "create-signature-request" /tmp/mem.html        # expect 2 — two builders served
grep -c 'id="originalPrice"' /tmp/mem.html               # expect 0 — which is why #7315 is inert
grep -c "membership_requested" /tmp/mem.html             # expect 0 — nothing tracked yet
```

If the first count is not 2 or the second is not 0, the page has changed since 2026-08-19 — stop and re-read the warning above before continuing.

### A1 · Generate the patches

Create `patches/membership-requested-event/` with a script `build.js` that, for each of the three mirrors in `live/wpcode/`, inserts the block below **immediately after** the `Thank you! A membership form has been sent` alert line (9926:272, 7315:280, 7966:301 as of 2026-08-19 — locate by string, not line number), preserving the file's indentation and line endings, and writes `patches/membership-requested-event/<id>.js`. The script must also support `--verify`, which re-derives each patch from the current mirror and fails if the committed patch differs — the same proof discipline as `tour-conversion-tracking`.

The block (indent to match the surrounding `alert`):

```js
/* --- conversion tracking: one push per successful signature request (no PII) --- */
try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'membership_requested',
        membership_type: membershipTypeValue || null,          // individual | couple | family …
        membership_tier: tier || null,
        membership_children: Number(numberOfChildrenValue) || 0,
        membership_enrollment_fee: Number(String(enrollmentFee).replace(/[^0-9.]/g, '')) || null,
        membership_monthly_due: Number(String(monthlyDue).replace(/[^0-9.]/g, '')) || null,
        membership_builder: '9926'                              // 7315 / 7966 in their copies
    });
} catch (e) { /* never let tracking break the confirmation */ }
/* --- end conversion tracking --- */
```

`membership_builder` is the snippet id, hardcoded per file — it is how a report can tell a sticker-price join from a promo-template join without touching the `offer:` tag. Check the variable names against each builder before generating: #7315 and #7966 carry `discountedPrice` / `originalPrice` locals in scope at that point and you may prefer to report the discounted figure as `membership_enrollment_fee`; whatever you choose, say so in the patch README.

Then:

```bash
node patches/membership-requested-event/build.js
node patches/membership-requested-event/build.js --verify      # expect: 3 patches verified
for f in patches/membership-requested-event/*.js; do node --check "$f" && echo "ok $f"; done
for f in patches/membership-requested-event/*.js; do printf "%s " "$f"; grep -c "membership_requested" "$f"; done
# expect exactly 1 per file
```

Also generate `patches/membership-requested-event/<id>.diff` per file so the owner can see the change is the inserted block and nothing else.

### A2 · Apply to the repo copies and prove the guard still passes

Apply the same block to the paste-source copies (`Website/Pages/Memberships (Category)/memberships/membership builder JS.js`, `…/Discounted Enrollment/membership builder JS.js`, `…/Discounted Enrollment/membership builder JS-discount-enrollment.js`) and to the three `live/wpcode/` mirrors — or, simpler, make `build.js --in-place` do it, so there is one source of truth for the edit.

```bash
npm run guard                                  # expect 5/5 green
npm run guard:membership-pricing:prove         # expect 12/12 drift cases caught
git diff --stat                                # expect a handful of lines per file, NOT whole-file churn
```

Commit. Do not paste anything live yet.

### A3 · 🛑 HUMAN GATE — paste into WPCode

Three snippets, or two if Sam prefers to leave the inert #7966 for its next pre-launch edit (then note it in the mirror header so the template is patched before it is ever published). For each: open the snippet in WPCode, select-all, paste the **whole** patch file, save. Confirm the character count WPCode reports matches `wc -c` on the patch (CRLF counted). Then GoDaddy → Flush Cache.

### A4 · Verify live with `curl`

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c "membership_requested"
# expect 2 — one per builder served (3 if #7966 ever binds to a published page)
```

Source presence is necessary, not sufficient. Extract each served block and check it parses (`node --check`), contains **exactly one** push, sits **inside** the success branch (after the alert, before `notify-admin`), and is `try/catch`-wrapped — the same four checks `tour-conversion-tracking` used.

### A5 · GTM — container v8 (do not publish yet; Parts B–C go in the same version)

Naming follows the tour build so the container reads as one system.

- **Variables** (Data Layer Variable, version 2): `membership_type`, `membership_tier`, `membership_children`, `membership_enrollment_fee`, `membership_monthly_due`, `membership_builder`.
- **Trigger:** Custom Event · `CE - membership_requested` · event name `membership_requested`.
- **Tag:** GA4 Event · `GA4 - membership_requested` · Measurement ID `G-SJN8S5QWXE` · event name `membership_requested` · each variable mapped to a same-named parameter · trigger `CE - membership_requested`.
- **GTM Preview** on `/memberships/`: build a plan and submit. **Use a real-looking test email you control** — the flow creates a genuine Dropbox Sign request and emails the admin. Confirm the event and every parameter in Preview and in GA4 DebugView. **Tell Sam the test signature request exists so it can be voided**, the same way the 2026-08-18 test booking left Engage Pro appointment `831` behind.

### A6 · GA4

- Admin → Events → mark `membership_requested` as a **key event**. Expect propagation — `tour_booked` took ~22h to become starrable; do not treat "not listed yet" as failure.
- Admin → Custom definitions → register `membership_type`, `membership_tier`, `membership_builder` as **event-scoped** dimensions, and `membership_enrollment_fee`, `membership_monthly_due` as **event-scoped metrics** (currency). Property is at 17/50 dimension slots; this uses 3.
- Update [GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) Key events table.

---

## Part B — click events, GTM only (no site edit, no gate until publish)

Enable the **Click** built-in variables (`Click URL`, `Click Text`, `Click Element`) if not already on.

| Tag | Trigger | Parameters |
|---|---|---|
| `GA4 - phone_click` | Just Links · `Click URL` **starts with** `tel:` | `link_url` = `{{Click URL}}`; `phone_is_club` = a Custom JS variable that returns `true` when `{{Click URL}}` with non-digits stripped ends in `3105300630`, else `false`; `link_page` = `{{Page Path}}` |
| `GA4 - email_click` | Just Links · `Click URL` starts with `mailto:` | `link_url`, `link_page` |
| `GA4 - directions_click` | Just Links · `Click URL` contains `google.com/maps` **or** `maps.app.goo.gl` **or** `goo.gl/maps` | `link_url`, `link_page` |

Then in GA4: mark **`phone_click` as a key event** and, once the data is in, build the Ads conversion (later) on `phone_click` **with `phone_is_club = true`** only. A pro's cell number on `/racquet-sports/` is a useful signal, not a conversion. Register `phone_is_club` as an event-scoped dimension.

Keep **"Wait for tags"** off on the `tel:`/`mailto:` triggers — those links do not navigate away, so there is nothing to wait for, and on mobile it only adds latency.

Verification in GTM Preview: click the footer phone number on `/` — expect `phone_click` with `phone_is_club = true`; click a pro's number on `/racquet-sports/` — expect `phone_is_club = false`.

---

## Part C — Zapier Interfaces forms (Contact Us, Subscribe)

Read-only first:

```bash
for p in contact-us subscribe; do printf "%-12s " "$p"; curl -s -A "Mozilla/5.0" "https://southendclub.com/$p/" | grep -c "interfaces.zapier.com"; done
# expect 3 and 3 as of 2026-08-19
```

Then decide between two designs — **do not build both**:

1. **Server-side (recommended).** In each Zap, add a *Webhooks by Zapier → POST* step after the trigger, posting `{ client_id: "<synthetic or passed>", events: [{ name: "contact_form_submitted", params: { form: "contact-us" } }] }` to `https://www.google-analytics.com/mp/collect?measurement_id=G-SJN8S5QWXE&api_secret=…`. 🛑 **HUMAN GATE** before creating the **Measurement Protocol API secret** in GA4 (Admin → Data streams → South End Club → Measurement Protocol API secrets) — it is a credential; store it in Zapier only, never in this repo. Attribution will be weak (Measurement Protocol has no session unless the browser's `_ga` client id is passed through the form as a hidden field — check whether Zapier Interfaces allows a hidden/prefilled field; if it does, do that).
2. **Client-side.** Only if Zapier Interfaces emits a `postMessage` on submit — open DevTools on `/contact-us/`, submit a test, and watch `window.addEventListener('message', e => console.log(e.origin, e.data))`. If nothing usable arrives, design 1 is the only option; do not build a scroll/visibility proxy and call it a submit.

Whichever is built, the event names are `contact_form_submitted` and `newsletter_subscribed`; mark the first as a key event.

---

## Part D — publish v8, back it up, record it

1. 🛑 **HUMAN GATE — publish the container.** Version name `v8 — membership_requested, phone/email/directions clicks[, zapier]`. Publishing is a production change.
2. Re-export the **published** container to [`analytics/gtm-container-export.json`](../analytics/gtm-container-export.json) and commit — [backup law](../CLAUDE.md), and [backup-gtm-container.md](backup-gtm-container.md) says re-export after every publish. Verify `grep -c '"membership_requested"' analytics/gtm-container-export.json` ≥ 1.
3. Update [GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md): container v8, the new key events, the new custom definitions and slot count.
4. Update [google-ads-account-setup.md](google-ads-account-setup.md): `membership_requested` becomes the **primary** conversion (value above `tour_booked`), `phone_click` (club number only) secondary; and its prerequisite row 1 (`tour_booked` key event) is ✅ as of 2026-08-18, the row is stale.
5. Close this handoff in [README.md](README.md) and retire the kickoff.

---

## Phase 2 — scoped, not part of this handoff

| Item | What it takes | Blocker |
|---|---|---|
| **`membership_signed`** (Dropbox Sign completed) | Heroku app's Dropbox Sign webhook → GA4 Measurement Protocol. For attribution, the builder should read the `_ga` cookie and send `ga_client_id` in the `data` payload to `create-signature-request`, and the server store it on the signature request metadata and echo it in the MP call. | Heroku access; confirm the server ignores unknown payload fields before adding one. |
| Pickleball RSVPs | Same Google Tag in the Firebase app, or a second stream. | Someone has to want the number. |
| Enhanced Conversions | Hashed email/phone on `membership_requested` and `tour_booked`. | [§13/§19](../SEO/TODO.md) consent fix first, then a privacy-policy update. |
| Privacy policy §5 | Name GA4/GTM explicitly; add remarketing language before any Ads remarketing. | Sam — legal content. |
| Two builders on `/memberships/` | Decide whether #7315 should be served there at all; if yes, guard both builders so only one binds. | Owner decision; surfaced by this handoff's A0. |

---

## Verification summary (what "done" looks like)

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c "membership_requested"   # 2
npm run guard                                                                                      # 5/5
grep -c '"membership_requested"' analytics/gtm-container-export.json                               # ≥1
grep -c '"phone_click"' analytics/gtm-container-export.json                                        # ≥1
```

Plus: GA4 Admin → Key events lists `membership_requested`, `phone_click` (and `contact_form_submitted` if Part C shipped) next to `tour_booked`; DebugView showed each firing with parameters during Preview.

## Rollback

- Builders: `git show HEAD~1:live/wpcode/<id>-*.js` is the pre-patch snippet; paste it back, flush cache.
- GTM: Versions → restore v7. The export in `analytics/` is v7 until Part D step 2 lands.
- GA4 key events can be un-starred; custom definitions archived (not deleted — archiving is reversible).

## Related

- [tour-conversion-tracking.md](tour-conversion-tracking.md) — the pattern this copies
- [publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md) — GA4 navigation trap, ad-blocker findings, the 22h propagation wait
- [mirror-membership-builders.md](mirror-membership-builders.md) — what the three builders are and why they are guarded
- [gtm-conversion-linker.md](gtm-conversion-linker.md) / [google-ads-account-setup.md](google-ads-account-setup.md) — what consumes these events later
- [SEO/TODO.md §13/§19](../SEO/TODO.md) — the consent problem that blocks Enhanced Conversions

---

## Kickoff prompt

```
Execute handoffs/site-wide-event-tracking.md in this repo.

Read it in full first, along with CLAUDE.md, handoffs/tour-conversion-tracking.md
(the pattern it copies) and handoffs/mirror-membership-builders.md (why the
builders are guarded).

This adds the events that are still invisible after tour tracking shipped:
membership_requested (the money event, three WPCode builders), phone/email/
directions clicks (GTM only), and the Zapier contact/subscribe forms. It ends
with GTM container v8.

Rules:
- Do step A0 first and stop if the counts differ from what the handoff records.
  Two builders are served on /memberships/ and one is inert by accident; the
  handoff explains why that matters.
- Generate the builder patches with a script under
  patches/membership-requested-event/ and prove them with --verify. Preserve
  CRLF. Never hand-edit a builder.
- After editing builders run npm run guard (expect 5/5) and
  npm run guard:membership-pricing:prove (expect 12/12). Commit the repo copies
  and live/wpcode mirrors together.
- No name, email or phone in dataLayer. Ever.
- Stop and ask me at every 🛑 HUMAN GATE: the WPCode pastes, the Measurement
  Protocol API secret, and publishing the container.
- Flush GoDaddy cache after live edits, then verify with curl, not the browser.
- The GTM Preview test on /memberships/ creates a real Dropbox Sign request —
  use an email I control and tell me so I can void it.
- After publishing, re-export the container to analytics/gtm-container-export.json
  in the same session. That is the backup law.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```

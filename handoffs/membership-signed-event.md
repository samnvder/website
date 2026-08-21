# Handoff: `membership_signed` — the true purchase reaches GA4

**Status:** 🟡 **SCOPED 2026-08-21 from the actual Heroku source — nothing built.**
Phase 2 item of [site-wide-event-tracking.md](site-wide-event-tracking.md), promoted.
**Owner:** Claude (repo + Heroku + GTM/GA4), **Sam** at every 🛑 gate.
**Time:** ~2h build + a coordinated test signature.
**App:** Heroku `still-cliffs-89444` (one-file Express server, `server.js`, 185 lines).
Heroku CLI access working as `s@southendclub.com` since 2026-08-21.

## What the scope pass found (read from the cloned source)

1. **There is no Dropbox Sign webhook handler.** The server only has
   `POST /notify-admin` (Resend email) and `POST /create-signature-request`
   (send_with_template + a one-shot status poll). Nothing listens for the
   signed event — this handoff **adds** the endpoint, and the callback URL must
   also be **registered** in the Dropbox Sign dashboard (Settings → API).
2. **The server ignores unknown payload fields** — it reads named fields only.
   Adding `ga_client_id` to the builders' payload is safe before the server
   understands it.
3. **Side-finding:** the promo builders send an `offer:` tag, and the server
   *ignores it* — it is not forwarded to Dropbox Sign, contrary to what
   [CLAUDE.md]'s stale-offer rationale assumes ("reaches Heroku and Dropbox
   Sign" — it reaches Heroku's logs and stops). The guard is still right to
   police it; the record should be corrected when convenient.
4. **`TEST_MODE` config var** flips Dropbox Sign test mode — test signature
   requests still fire webhooks, so end-to-end testing needs no real contract.
5. Config vars today: `ALERT_EMAIL(_PASSWORD)`, `DROPBOX_SIGN_API_KEY`,
   `PAPERTRAIL_API_TOKEN`, `RESEND_API_KEY`, `TEST_MODE`. This build adds
   `GA4_API_SECRET` (and hardcodes measurement id `G-SJN8S5QWXE` beside it).

## The design

**Attribution thread:** builder reads the GA4 `_ga` cookie → sends
`ga_client_id` in the application payload → server stores it (plus
`membership_type`, `tier`) in the signature request's **`metadata`** → when
Dropbox Sign calls back `signature_request_signed`, the server posts
**`membership_signed`** to GA4's Measurement Protocol with that `client_id`,
so the signing joins the same visitor's session history. No name, email or
phone ever goes to GA4.

## Steps

1. **Mirror the app into the repo first** (backup law — Heroku git is a single
   mutable place nobody else holds): `live/heroku/still-cliffs-89444/` with
   `server.js`, `package.json`, `Procfile` and a README recording app name,
   config-var *names*, and the git URL. Two-commit convention: unpatched
   capture, then the patch.
2. **Builder patch** — `patches/ga-client-id/` (naming law), same generator
   contract as `tour-widget-param`: insert into all three builders (mirrors +
   paste-sources, 6 files) a `ga_client_id` field in the `data` payload, read
   via `document.cookie.match(/_ga=GA\d\.\d\.(.+?)(;|$)/)` → `1.1.<client_id>`
   stripped to the bare client id, `null` if absent. 🛑 **HUMAN GATE:** WPCode
   pastes #9926/#7315/#7966, flush cache, `curl`-verify.
3. **Server patch** (in the mirror, then deployed):
   - `send_with_template` gains `metadata: { ga_client_id, membership_type, tier }`.
   - New `POST /dropbox-sign-webhook`: Dropbox Sign posts
     **multipart/form-data with a `json` field** (needs `multer` — one new
     dep), reply must contain the literal string `Hello API Event Received`,
     and the event must be verified: `event_hash` =
     HMAC-SHA256(`DROPBOX_SIGN_API_KEY`, `event_time + event_type`).
   - On `signature_request_signed`: read `metadata` from the payload's
     `signature_request`, POST to
     `https://www.google-analytics.com/mp/collect?measurement_id=G-SJN8S5QWXE&api_secret=$GA4_API_SECRET`
     with `{ client_id, events: [{ name: 'membership_signed', params: {
     membership_type, membership_tier, test_mode } }] }`. Fall back to a
     synthetic `client_id` (`sig-<signature_request_id>`) when `ga_client_id`
     is absent — the event still counts, attribution is just weak.
   - Never let tracking break the webhook reply; wrap the MP call, always 200.
4. 🛑 **HUMAN GATE — GA4 Measurement Protocol API secret**: create under
   Admin → Data streams → South End Club → Measurement Protocol API secrets;
   store it ONLY as Heroku config var `GA4_API_SECRET`. Never in either repo.
5. 🛑 **HUMAN GATE — register the callback URL** in Dropbox Sign
   (Settings → API → Account callback):
   `https://still-cliffs-89444-6c029a7a2024.herokuapp.com/dropbox-sign-webhook`.
6. 🛑 **HUMAN GATE — deploy**: `git push heroku` from the mirror-derived
   commit. Watch `heroku logs --tail` on first events.
7. **Test end-to-end**: flip `TEST_MODE=true`, submit a builder application
   with an owner-controlled email, sign the test document, confirm
   `membership_signed` in GA4 DebugView carrying the browser's client id, then
   flip `TEST_MODE` back and void the test request. The `test_mode` param
   keeps the test event filterable forever.
8. **GA4**: once listed, star `membership_signed` as a key event — it
   outranks `membership_requested` as the top conversion; update
   [GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) and
   [google-ads-account-setup.md](google-ads-account-setup.md) (primary
   conversion becomes signed, requested drops to secondary).

## Verification summary

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/memberships/ | grep -c "ga_client_id"   # 1
curl -s -o /dev/null -w "%{http_code}" -X POST https://still-cliffs-89444-6c029a7a2024.herokuapp.com/dropbox-sign-webhook   # 400/401 (unsigned), NOT 404
```

Plus: DebugView shows `membership_signed` with the test browser's client id.

## Rollback

Server: `git revert` in the Heroku repo, push. Builders: previous mirror
commit, paste back. Callback URL: clear the field in Dropbox Sign. GA4 secret:
delete it in Admin.

## Kickoff prompt

```
Execute handoffs/membership-signed-event.md in this repo.

Read it in full first, plus CLAUDE.md and patches/tour-widget-param/ (the
generator contract). Heroku CLI is authed as s@southendclub.com; the app
is still-cliffs-89444 (single server.js). The handoff was scoped from the
real source — trust its findings but re-clone and diff before patching.

Rules: mirror the app into live/heroku/ before touching it (two commits:
capture, then patch); builder patch via generator with --verify; no PII
to GA4 ever; stop at all four 🛑 gates (WPCode pastes, GA4 API secret,
Dropbox Sign callback registration, Heroku deploy); test with
TEST_MODE=true and an owner-controlled email, then flip it back and void
the test signature request. Work on a branch; verify which branch every
commit landed on afterwards.
```

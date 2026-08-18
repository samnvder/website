# Handoff — Verify and publish the `tour_booked` GTM build, then make GA4 report it

**Created:** 2026-08-18 · **Status:** OPEN — **12 unpublished changes are sitting in the container right now** · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~30 min, most of it waiting on a test booking.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## ⚠️ Read this before touching anything

**The GTM work is already built. Do not rebuild it.** On 2026-08-18 a trigger, ten variables and a GA4 event tag were created in workspace 7 of `GTM-WLRX58RN` and **saved but not published**. The container currently shows **Workspace Changes: 12**.

That is an unstable state and it is the reason this handoff exists:

- Unpublished changes are **invisible to the live site** — `tour_booked` fires on all four call sites but nothing receives it.
- Anyone else editing that container works on top of these changes and may publish them **half-verified**, or discard them.
- A second agent that "starts Part B" from scratch will create **duplicates** — a second `CE - tour_booked` trigger and a second GA4 tag would double-count every booking, which is worse than not tracking at all.

**First action: open the container and confirm the inventory below still matches.** If it does not, stop and report rather than reconciling.

### What is already there

| Item | Detail |
|---|---|
| Trigger | `CE - tour_booked` · Custom Event · event name `tour_booked` · fires on All Custom Events |
| Variables | 10 × Data Layer Variable (Version 2), named `DLV - <key>` |
| Tag | `GA4 - tour_booked` · GA4 Event · Measurement ID `G-SJN8S5QWXE` (validated: *"Google tag found in this container"*) · Event Name `tour_booked` · 10 event parameters · fires on `CE - tour_booked` |

The ten parameters, each mapped `<name>` → `{{DLV - <name>}}`:
`tour_booking_id` · `tour_is_reschedule` · `tour_date` · `tour_time` · `tour_heard_about` · `tour_source_page` · `tour_device` · `tour_utm_source` · `tour_utm_medium` · `tour_utm_campaign`

---

## ⚠️ Preview will fail for a reason that is not the site

A Preview session on 2026-08-18 could not connect. The cause was **a browser extension blocking `googletagmanager.com` outright**, not anything wrong with the container or the page:

| Request made from the page console | Result |
|---|---|
| `fetch('https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN')` | **blocked — `Failed to fetch`** |
| control request to `southendclub.com` | OK (HTTP 404 — a real response) |

The `gtm.js` script tag was present in the HTML; the request never left the browser, so `window.google_tag_manager` stayed empty and Tag Assistant timed out with *"There are currently no debuggable Google tags at that address."*

**Run that two-line check first.** If `gtm.js` fails while a control request succeeds, it is the browser. Use a clean Chrome profile or disable the blocker for `southendclub.com`. Do not go debugging the container.

Two further notes on the same session:

- **The Tag Assistant popup was also blocked.** Its "Connect" opens the site with `window.open`; if that is blocked the handshake never completes, and opening the URL manually does **not** work — Tag Assistant needs the `window.opener` relationship. A human should click Connect.
- **`tagmanager.google.com`'s account list showed no accounts** for both signed-in Google accounts, which looks like a permissions failure but is not — navigating straight to the container URL worked fine. Do not conclude access is missing from the account-list page alone.

This has an implication worth carrying into any future analytics work: **anyone with an ad blocker is invisible to GA4.** A staff member checking their own visit and seeing nothing is expected, not a bug.

---

## Steps

### 1 · Confirm the build is intact

Open [the container](https://tagmanager.google.com/#/container/accounts/6261176694/containers/201877150/workspaces/7/tags) and check the inventory table above, and that Workspace Changes is still **12**. A different number means someone else has been in here — stop and report.

### 2 · Preview and fire a real booking

Preview, then complete a **real tour booking** on `/schedule-a-tour/`. Confirm in Tag Assistant:

- the `tour_booked` event appears
- `GA4 - tour_booked` **fired**
- every one of the ten variables **resolves to a value**

> **The single most important thing to record here is whether `tour_booking_id` is `null`.** It is still unverified. It is what makes Google Ads deduplication reliable later, and if the edge function does not return an appointment id, that is a request to the `book-tour` owner — not something to paper over.

> **🛑 HUMAN GATE — a real booking has real consequences.** It writes a Supabase row and sends a real confirmation email and probably a real SMS. Tell whoever staffs the tour calendar *before* testing, and delete the row afterwards.

### 3 · Publish

> **🛑 HUMAN GATE — publishing the container is a production change.** Confirm first. Use a version name referencing `tour_booked` and a description pointing at this handoff.

### 4 · Make GA4 actually report it

Publishing makes the event *collected*. It does not make it *reportable*. Both of these are required:

1. **Admin → Events** → mark `tour_booked` as a **key event**.
2. **Admin → Custom definitions** → register as custom dimensions (event-scoped): `tour_source_page`, `tour_utm_source`, `tour_utm_campaign`, `tour_heard_about`, `tour_device`.

**This is the step people skip.** Unregistered parameters are collected and silently unreportable — the data arrives, and every report shows `(not set)`. 12 of 50 dimension slots were in use as of 2026-08-17, so all five fit.

`tour_source_page` matters more than it looks: the floating widget is injected site-wide from WPCode snippet 8309, so bookings arrive from **all ~26 pages**, not two. That dimension is the whole page-level attribution answer.

### 5 · Verify

```bash
for p in schedule-a-tour memberships fitness; do printf "%-18s " "$p"; curl -s -A "Mozilla/5.0" "https://southendclub.com/$p/" | grep -c "tour_booked"; done
```

Expect `2`, `2`, `1` — unchanged by this handoff, since it touches no page code. Then confirm in **GA4 DebugView** that the event lands with all parameters attached, and in **Realtime** that it appears at all.

Finally, the check that proves completeness rather than mere function: **count bookings in Supabase for a window after publish and compare to `tour_booked` in GA4 for the same window. They should match.** A persistent shortfall means a widget is missing the push — the failure mode that looks like success.

## What is deliberately out of scope

- **Google Ads.** No account exists. See [gtm-conversion-linker.md](gtm-conversion-linker.md), which must run **before** any Ads conversion work.
- **Repo mirroring.** GTM container config is not code; [the backup law](../CLAUDE.md) covers pasted code. Record outcomes in this handoff and [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).

## Related

- **[tour-conversion-tracking.md](tour-conversion-tracking.md)** — the parent handoff. Part A ✅ done and verified live 2026-08-18; this handoff is the rest of Part B plus Part D.
- **[analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md)** — property `424923833`, stream `G-SJN8S5QWXE`. Never use the dormant MonsterInsights stream `G-KSB6ZBR8FS`.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/publish-tour-tracking-gtm.md in this repo.

Read it in full first, along with CLAUDE.md.

CRITICAL: the GTM work is ALREADY BUILT and saved but not published —
container GTM-WLRX58RN, workspace 7, showing "Workspace Changes: 12".
Do NOT rebuild it. Creating a second CE - tour_booked trigger or a second
GA4 - tour_booked tag would double-count every booking, which is worse
than no tracking. Your first action is to confirm the existing inventory
matches what the handoff lists.

Your job: verify it in Preview, publish it, then register it in GA4.

Rules:
- If GTM Preview will not connect, check the BROWSER before the site. Run
  in the page console:
  fetch('https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN')
  If that fails while other requests succeed, an ad blocker is blocking
  googletagmanager.com. That is exactly what happened on 2026-08-18 and it
  cost a whole verification cycle. Use a clean profile.
- Tag Assistant's "Connect" opens a popup. If popups are blocked the
  handshake never completes, and opening the URL by hand does NOT work —
  it needs window.opener. Ask me to click Connect.
- tagmanager.google.com's account list may show zero accounts even when
  access is fine. Navigate straight to the container URL instead.
- Record whether tour_booking_id resolves or is null. It is unverified and
  it determines whether Ads dedup will work later.
- Stop and ask me at every 🛑 HUMAN GATE — the test booking (it sends a real
  email and SMS and writes a real Supabase row) and the publish.
- After publishing you are NOT done. Mark tour_booked as a key event and
  register the five custom dimensions. Unregistered parameters are
  collected but unreportable, and every report shows (not set).

Report what you verified with what output, whether tour_booking_id was
null, and anything you left undone.
```

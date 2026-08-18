# Handoff — Add a Conversion Linker tag to `GTM-WLRX58RN`

**Created:** 2026-08-18 · **Status:** OPEN — **deliberately parked** · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~10 min. Do **not** do this yet — see [When to do this](#when-to-do-this).

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

---

## Why

Container `GTM-WLRX58RN` has **no Conversion Linker tag**. Confirmed from inside the container 2026-08-18 — it holds four tags, none of them a linker.

A Conversion Linker reads the ad-click identifier from the landing URL (`gclid`, `wbraid`, `gbraid`) and writes it into a first-party cookie so a conversion minutes or days later can still be attributed to the click that caused it. Without one, Google Ads under-reports conversions badly on Safari and increasingly on Chrome, because the click identifier is gone by the time the person books.

## When to do this

**Not now.** There is no Google Ads account — confirmed absent 2026-08-17 and re-confirmed by the absence of any `AW-` tag in the container. A Conversion Linker with nothing to link is a tag that fires on every page and does nothing.

Do it when **either** of these becomes true:

1. A Google Ads account exists and Part C of [tour-conversion-tracking.md](tour-conversion-tracking.md) is about to be executed. **Then this handoff runs first** — the linker must be collecting click IDs *before* the conversion tag needs them, and it cannot backfill.
2. Any other ad platform that relies on click-ID stitching is introduced.

**The ordering point is the whole reason this is written down.** The linker is easy to add and easy to forget, and forgetting it produces the worst possible failure: conversions that look like they are tracked, reported at a fraction of the true number, with no error anywhere.

## Steps

### 1 · Confirm it is still absent

Open [the container's tags](https://tagmanager.google.com/#/container/accounts/6261176694/containers/201877150/workspaces/7/tags) and check no tag of type **Conversion Linker** exists. If one appeared since 2026-08-18, stop — someone else did this, and a second one is not harmless.

### 2 · Create the tag

- **Tag type:** Conversion Linker
- **Name:** `Conversion Linker`
- **Trigger:** `Initialization - All Pages` — *not* `All Pages`

> **Use the Initialization trigger.** It fires before ordinary page-view tags, which is what lets the linker capture the click ID before any conversion tag reads it. `All Pages` usually works and sometimes loses a race it will never report losing.

Leave **Enable linking across domains** off unless booking moves to another hostname. It does not today — the Supabase call is `fetch`, not a redirect.

### 3 · Verify in Preview, then publish

> **🛑 HUMAN GATE — publishing the container is a production change.** Confirm before submitting, and use a version description referencing this handoff.

Preview with a URL carrying a fake click ID:

```
https://southendclub.com/schedule-a-tour/?gclid=TEST123
```

Expect the Conversion Linker tag to fire, and a `_gcl_aw` cookie to be set on the domain. **A blocked tag manager will make this look broken** — see the warning below.

### 4 · Mirror nothing

There is no repo artifact for this. Container config is not code, and [the backup law](../CLAUDE.md) covers pasted code, not GTM UI state. Record the change in this handoff's status line and in [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).

---

## ⚠️ Verifying anything in GTM Preview may fail for a reason that is not the site

On 2026-08-18 a Preview session could not connect at all. The cause was **an extension in the Chrome profile blocking `googletagmanager.com` outright**:

| Request from the page | Result |
|---|---|
| `googletagmanager.com/gtm.js?id=GTM-WLRX58RN` | **blocked — `Failed to fetch`** |
| control request to `southendclub.com` | OK (HTTP 404 — a real response) |

The `gtm.js` script tag was present in the HTML; the request simply never left the browser, so `window.google_tag_manager` stayed empty and Tag Assistant timed out.

**Before debugging the site, run that two-line check in the page console.** If `gtm.js` fails while a control request succeeds, the problem is the browser. Use a clean profile or disable the blocker for `southendclub.com`.

This has a second implication worth stating plainly: **anyone at the club with an ad blocker will not appear in GA4 at all**, and will see "no data" if they check their own visit. That is normal and is not evidence tracking is broken.

## Related

- **[tour-conversion-tracking.md](tour-conversion-tracking.md)** — Part C is the Google Ads work this unblocks; Parts A and B are done
- **[analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md)** — property, stream and container inventory

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/gtm-conversion-linker.md in this repo.

Read it in full first, along with CLAUDE.md.

FIRST: confirm with me that a Google Ads account now exists. If it does not,
STOP and tell me — this handoff is deliberately parked until then, and adding
a Conversion Linker with no Ads account to link to is a no-op tag on every
page.

If Ads does exist, add a Conversion Linker tag to container GTM-WLRX58RN.

Rules:
- Use the "Initialization - All Pages" trigger, NOT "All Pages". The linker
  must capture the click ID before any conversion tag reads it.
- Check first that no Conversion Linker already exists. Two is not harmless.
- Leave cross-domain linking off — booking does not leave the domain.
- Stop and ask me before publishing the container. Publishing is a production
  change.
- If GTM Preview will not connect, check whether the browser is blocking
  googletagmanager.com before you debug the site. Run this in the page
  console: fetch('https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN')
  If that fails while other requests succeed, it is an ad blocker, not the
  site. That exact thing happened on 2026-08-18.

Report what you created, what you verified, and whether you published.
```

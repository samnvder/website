# Handoff — Link Search Console to GA4

**Created:** 2026-08-17 · **Status:** OPEN · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~5 minutes. No code. No site changes.

---

## Why

Search Console and GA4 are both live and neither knows the other exists. Confirmed 2026-08-17: GA4 → Admin → Product links → **Search Console links** reads *"No links yet."* ([GA4 snapshot](../analytics/GA4-SNAPSHOT.md)).

That split costs you the one join that matters for organic:

- **Search Console** knows the *query* — what someone typed, impressions, position, CTR. It does not know what they did next.
- **GA4** knows the *behaviour* — landing page, engagement, and (once [tour-conversion-tracking](tour-conversion-tracking.md) ships) whether they booked. It does not know the query.

Unlinked, "which search terms bring people who actually book" is unanswerable. Linked, it's a report.

This matters more here than at most sites: **62.6% of sessions are Organic Search** — 3,015 of 4,813 over 28 days. It is the single largest channel by a wide margin, and it's the one you currently have the least visibility into.

It also directly serves [SEO/TODO.md](../SEO/TODO.md), which repeatedly defers content decisions pending real query data — §4 ("No blog / informational content"), and the closing note that further metadata tuning "would be guessing" without Search Console data. **This is the link that stops the guessing.**

## Done means

- [ ] Search Console property `sc-domain:southendclub.com` linked to GA4 property `424923833`
- [ ] Link covers web stream `6675857159` (`G-SJN8S5QWXE`) — **not** the dormant MonsterInsights stream
- [ ] The two Search Console reports published to the GA4 reports nav
- [ ] Verified: query data visible in GA4 (allow ~48h for first data)

---

## Prerequisites

| Need | Why |
|---|---|
| **Verified owner** on Search Console property `sc-domain:southendclub.com` | Google requires owner-level GSC access to create the link. Edit access is not enough. |
| **Editor** on GA4 property `424923833` | |

Both must be held by **the same Google account, signed in at once.** This is the step that usually blocks people: if GSC was verified by one account and GA4 set up by another, the link screen shows no available properties and gives no useful reason why. If that happens, the fix is to add the GA4 account as a GSC owner first, not to keep retrying.

The GSC property is `sc-domain:southendclub.com` — a **domain** property verified by DNS, per [SEO/HANDOFF.md](../SEO/HANDOFF.md). There's no verification meta tag in the HTML; don't go looking for one.

---

## Steps

**1.** GA4 → **Admin** → Product links → **Search Console links** → **Link**

Direct: `analytics.google.com/analytics/web/#/a300330852p424923833/admin/integrations/search-console`

> URL routing into GA4 admin subpages is unreliable — the SPA silently bounces to the reports home. If that happens, navigate to Admin and click through instead. Don't conclude the page is missing.

**2.** Choose accounts → select **`sc-domain:southendclub.com`** → Confirm

**3.** Select web stream → **South End Club** (`6675857159`, `G-SJN8S5QWXE`)

> 🛑 **Not** the `MonsterInsights - southendclub.com` stream (`6705513126`, `G-KSB6ZBR8FS`). It is dormant and receives nothing; linking to it would produce a link that silently never reports. See [ga4-hygiene.md](ga4-hygiene.md).

**4.** Review → **Submit**

> 🛑 **HUMAN GATE — this creates a product link between two live Google properties.** Confirm before submitting. It is reversible (links can be removed) but it is a real account change.

**5.** Publish the reports. Linking alone does **not** surface anything — the reports exist but are unpublished, which is why people link it and conclude it didn't work. GA4 → **Library** → find the **Search Console** collection → **Publish**. That adds two reports:

- *Queries* — search terms, impressions, clicks, CTR, average position
- *Google organic search traffic* — landing page joined to GA4 engagement

---

## Verification

**1.** Admin → Product links → Search Console links shows one row with the property name, stream `6675857159`, and today's date.

**2.** Reports nav shows a **Search Console** collection with both reports.

**3.** Open *Queries*. **Expect it to be empty at first** — data takes up to 48 hours and is not backfilled. An empty report on day one is normal and is not a failed link. Re-check after two days before touching anything.

**4.** Once populated, sanity-check against Search Console directly. Numbers will not match exactly — GSC and GA4 attribute and sample differently — but the top queries should be recognisably the same set. Wildly different results mean the wrong property was linked.

---

## Rollback

Admin → Product links → Search Console links → row menu → **Unlink**. No data is destroyed; the reports simply stop populating. Unpublishing the Library collection hides the reports without unlinking.

## Notes

- **Not backfilled.** Query data starts from the link date forward. Another reason to do it now rather than alongside some larger piece of work.
- **This does not fix attribution for tour bookings.** It joins queries to *sessions*. Joining queries to *bookings* additionally requires [tour-conversion-tracking](tour-conversion-tracking.md) — once both are live, "which query produced a booked tour" becomes answerable, which is the actual goal.
- **Nothing here touches the website**, so no Thrive edit, no cache flush, no `curl` verification.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

```
Execute handoffs/link-search-console.md in this repo.

Read it in full first, plus analytics/GA4-SNAPSHOT.md for the property and
stream IDs.

This is a ~5 minute account change, no code and no site edits. Link Search
Console property sc-domain:southendclub.com to GA4 property 424923833, on
web stream 6675857159 (G-SJN8S5QWXE).

Rules:
- Never select the MonsterInsights stream 6705513126 — it's dormant and the
  link would silently never report.
- Stop and ask me at the step marked 🛑 HUMAN GATE before submitting.
- After linking, publish the Search Console collection from the Library.
  Linking without publishing surfaces nothing, and that's the usual reason
  people think it failed.
- An empty Queries report on day one is expected — data takes up to 48h and
  isn't backfilled. Don't treat that as a failure or start debugging it.
- If the GSC property doesn't appear as selectable, it's almost certainly an
  access mismatch: the signed-in account needs to be a verified OWNER in
  Search Console, not just have edit access. Tell me rather than retrying.

Report what you linked, what you verified, and what's pending the 48h wait.
```

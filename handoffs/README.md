# handoffs/

Executable briefs for work on the live South End Club stack. **Each one is written to be run by a Claude Code agent in Cowork**, not worked through by hand — see [CLAUDE.md § Handoffs](../CLAUDE.md).

Every handoff ends with a **kickoff prompt**. All of them are also collected [at the bottom of this file](#kickoff-prompts) so you can grab one without opening anything.

## Open

| # | Handoff | What it does | Time | Blocked? |
|---|---|---|---|---|
| 1 | **[tour-conversion-tracking](tour-conversion-tracking.md)** | Makes tour bookings visible to GA4 and Google Ads. **Highest value on the board after GBP.** | ~1h | Part C only — no Google Ads account exists |
| 2 | **[link-search-console](link-search-console.md)** | Joins search queries to site behaviour. No code, no site changes. | ~5 min | no |
| 3 | **[ga4-hygiene](ga4-hygiene.md)** | Clears MonsterInsights residue. **Low priority — moves no numbers.** | ~20 min | no |

**Suggested order: 2 → 1 → 3.** Search Console is five minutes and pays off immediately. Conversion tracking is the one that changes what you can know. Hygiene is whenever you're next in the account.

Backlog context for all three: [SEO/TODO.md](../SEO/TODO.md) §14. Property config and the pre-tracking baseline: [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md).

## Closed

| Handoff | Outcome |
|---|---|
| [SEO/HANDOFF.md](../SEO/HANDOFF.md) | Closed 2026-08-07. Kept as a record of hypothesis-vs-reality, plus two reusable verification scripts. |

---

## What a handoff here looks like

The convention, so new ones match:

- **Runnable steps** — each is a command the agent runs, a browser action it drives, or a marked **🛑 HUMAN GATE**.
- **🛑 HUMAN GATE** on anything production-facing or hard to reverse: live Thrive edits, publishing a GTM container, creating an Ads conversion, deleting a plugin. The agent stops and asks.
- **Verification with expected output stated.** "Expect 2" beats "check it worked" — the agent can tell when it has failed.
- **Prepared artifacts** under [`patches/<task>/`](../patches/) when the change needs pasting into Thrive, with the script that generated them. Hand-inserting into Thrive is where mistakes happen.
- **A kickoff prompt as the last section.** Always.

Two rules that apply to every handoff touching the website:

1. **Editing `Website/Pages/**/*.html` does not change the live site.** Those files are Thrive paste-source. See [CLAUDE.md](../CLAUDE.md).
2. **Never paste a whole repo page file into Thrive.** The repo lags live — the `se-bk-floating` booking widget runs in production and exists nowhere in this repo. Pasting a repo page over a live one deletes whatever live has and the repo doesn't.

---

## Kickoff prompts

### 1 · Tour conversion tracking

```
Execute handoffs/tour-conversion-tracking.md in this repo.

Read it in full first, along with CLAUDE.md, before doing anything.

Context: Part A's repo edits are already applied. Your job is the live site
(Thrive), GTM, and Google Ads.

Rules:
- Never paste a repo page file into Thrive — it would delete the floating
  booking widget from production. Paste only patches/tour-conversion-tracking/
  live-blocks/*.js, one per widget, four total.
- Before pasting, re-curl each live page and confirm the blocks still match;
  regenerate with extract_live.py if live has drifted.
- Stop and ask me at every step marked 🛑 HUMAN GATE.
- Flush GoDaddy cache after live edits, then verify with curl, not the browser.
- Google Ads is confirmed absent, so Part C is blocked. Finish A, B and D and
  don't stall on it.

Work on a branch. Report what you changed, what you verified with what output,
and anything you deliberately left undone.
```

### 2 · Link Search Console

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

### 3 · GA4 hygiene

```
Execute handoffs/ga4-hygiene.md in this repo.

Read it in full first, plus analytics/GA4-SNAPSHOT.md for the property,
stream and dimension details.

This is LOW priority cleanup — confirm with me that the conversion-tracking
and Search Console handoffs are already done or deliberately deferred before
you start.

Order matters. Do step 1 first: check the email_address custom dimension for
real values, using a secondary dimension in a standard report, NOT a saved
Exploration.

Rules:
- If email_address contains real email addresses, STOP and report. Do not
  archive it — archiving hides it without deleting the data, which conceals
  the problem instead of fixing it. That needs a data deletion request and
  is my call, not yours.
- Rename the dormant stream 6705513126, do not delete it. Deleting is
  permanent and buys nothing the rename doesn't.
- Stop and ask me at every step marked 🛑 HUMAN GATE.
- Do not re-adopt or reinstall MonsterInsights. GTM already does more, and
  it couldn't track the booking widgets anyway.

Report what you changed, what you verified, and anything you left undone.
```

# Handoff — GA4 hygiene: MonsterInsights residue

**Created:** 2026-08-17 · **Status:** OPEN · **Priority: LOW** · **Executed by:** Claude Code (Cowork) — see [Kickoff prompt](#kickoff-prompt)
**Est.:** ~20 minutes, plus one PII check that may need a decision.

> ⚠️ **This moves no numbers.** It is cleanup. Do [tour-conversion-tracking](tour-conversion-tracking.md) and [link-search-console](link-search-console.md) first — this exists so the residue is written down, not so it gets done next.

---

## Why

MonsterInsights is a WordPress plugin that wraps GA4 in a WP dashboard. It was in use around Feb–Dec 2024 and has left debris in three places. **It is no longer running:** live pages load only `captainform` and `thrive-visual-editor`, there is no MonsterInsights output in any page's HTML, and its GA4 stream has received nothing.

**Do not re-adopt it.** The site already uses Google Tag Manager, which is strictly more capable. MonsterInsights also could not solve the booking-measurement problem: its form tracking hooks native `<form>` submissions, and the booking widgets are custom JS that never submit a form element — the same reason GA4's built-in `form_submit` sits at 5 events per 28 days while real bookings sit at zero.

## Done means

- [ ] `email_address` custom dimension checked for real values; PII decision made
- [ ] Dormant data stream renamed so nobody can grab the wrong measurement ID
- [ ] Orphaned custom dimensions archived
- [ ] MonsterInsights plugin confirmed absent from WordPress, or deleted

---

## 1. Check `email_address` for real values — **do this first**

The most consequential item and the only one with a deadline shape to it.

Among the 12 orphaned custom dimensions is one named **Email Address**, event-scoped, parameter `email_address`. **If MonsterInsights ever populated it with real addresses, that is personal data in Google Analytics** — a breach of Google's terms and grounds for property suspension.

**Likely, but unverified, that it's empty:** the stream is dormant, and the dimensions were last touched Dec 2024, which is outside GA4's rolling 14-month retention window anyway.

**How to check without writing anything:** Reports → Engagement → Events → add **Email Address** as a secondary dimension over the widest available range. A secondary dimension is a transient UI state and is not saved.

> Prefer this to building an Exploration. An Exploration persists as a saved object in the property; a secondary dimension does not.

**If it's empty:** archive it with the rest in step 3. Done.

**If it contains real addresses:** 🛑 **STOP and report before doing anything else.** Do not archive it — archiving hides the dimension but does not delete the underlying data, so it would conceal the problem rather than fix it. The remedy is a **data deletion request** (Admin → Data deletion requests), which has its own process and timeline. That is a decision to escalate, not to action unattended.

## 2. Rename the dormant data stream — **do not delete**

| | |
|---|---|
| Stream | `MonsterInsights - https://southendclub.com` |
| Stream ID | `6705513126` |
| Measurement ID | `G-KSB6ZBR8FS` |
| State | No data received; enhanced measurement off |

**Rename to:** `DO NOT USE — legacy MonsterInsights (dormant)`

Admin → Data streams → the stream → **Stream details** → pencil icon → edit name → Save.

**Rename rather than delete.** The whole risk this stream poses is that someone pastes the wrong measurement ID somewhere; a name that says so removes that risk entirely. Deleting is permanent, needs its historical-data implications confirmed first, and buys nothing beyond what the rename already achieves. There is no upside to the irreversible option here.

> 🛑 **HUMAN GATE — this is a live property setting.** Confirm the exact new name before saving.

## 3. Archive the orphaned custom dimensions

All 12 are event-scoped and described "MonsterInsights custom dimension":

`affiliate_label` · `category` · `email_address` · `is_affiliate_link` · `link_action` · `link_text` · `link_type` · `outbound` · `percentage` · `post_type` · `tel_number` · `wp_user_id`

Admin → Custom definitions → row menu → **Archive**.

**No urgency.** 12 of 50 slots are used, so they block nothing — including the five that [tour-conversion-tracking](tour-conversion-tracking.md) needs to register. This is tidying.

**Archiving loses historical reporting for that dimension** (the underlying data is not deleted, but it stops being reportable). Given the data predates the retention window, that costs nothing here — but state it rather than assuming, and don't archive `email_address` if step 1 found real values.

> 🛑 **HUMAN GATE** before the first archive.

## 4. Confirm the plugin is gone from WordPress

WP Admin → Plugins. Look for **MonsterInsights** / *Google Analytics for WordPress*.

- **Not listed:** nothing to do — the evidence already says it isn't running.
- **Listed and deactivated:** delete it. A deactivated plugin still ships its code to the server and is still attack surface — the same argument [SEO/TODO.md](../SEO/TODO.md) §8 makes for the pirated migration plugin.
- **Listed and active:** stop and report. That contradicts the live-HTML evidence and means something has changed since 2026-08-17.

> 🛑 **HUMAN GATE — deleting a plugin is irreversible** and can remove its settings. Confirm first.

---

## Verification

```bash
curl -s -A "Mozilla/5.0" https://southendclub.com/ | grep -c -i "monsterinsights"
```

Expect **0** — as it already was on 2026-08-17. This is a regression check, not proof of the cleanup.

In GA4: the stream list shows the renamed stream, Custom definitions shows the archived rows gone, and `G-SJN8S5QWXE` still reports normally.

## Rollback

Renaming and archiving are both reversible (archived dimensions can be restored; names can be changed back). Plugin deletion is not — hence the gate. **Nothing in this handoff should require a rollback**, because nothing here is on the collection path for the live stream.

---

## Kickoff prompt

Paste into a fresh Claude Code (Cowork) session in this repo:

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

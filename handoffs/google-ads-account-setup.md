# Handoff — Google Ads: optimal account setup from zero

**Created:** 2026-08-18 · **Status:** OPEN — **not ready to execute** · **Executed by:** Claude Code (Cowork) + human for anything touching billing
**Est.:** ~30 min of agent work. The decisions in front of it take longer, and should.

> **Execution convention:** written to be run by a Claude Code agent in Cowork. See [CLAUDE.md § Handoffs](../CLAUDE.md).

> 🛑 **The agent must not create the Google Ads account and must never enter payment details.** Account creation and billing are human-only steps in this handoff, marked as such. Everything after the account exists is agent work.

---

## Read this before spending anything

**You may not need Google Ads, and the honest recommendation is to prove you do before paying for it.** Three facts from this repo:

| Fact | Source |
|---|---|
| **62.6% of sessions are organic search** — 3,015 of 4,813 over 28 days | [GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) |
| The **top query is the club's own name at position 1.33** | Search Console, 2026-08-17 |
| The Google Business Profile has **192 reviews, 4.4★, 5,748 monthly views** — with an **empty description** and unanswered reviews | [SEO/TODO.md](../SEO/TODO.md) §1 |

That last one is a **30-minute, zero-cost job that has been open the whole time** and governs the local pack — which is where someone searching "tennis club near me" in Torrance actually looks. **Do §1 before spending a dollar on ads.** Paid traffic bought before the free listing is fixed is buying what you could have had for nothing.

Ads make sense once you want *more* demand than the South Bay currently sends you, or you want demand for something specific (padel, squash, summer camp) that nobody is searching for by name yet. That is a real strategy — it is just not the *first* thing.

## The constraint that shapes everything else

**Smart bidding needs roughly 15–30 conversions per month to work.** Below that, Google's algorithms cannot learn and Target CPA / Maximise Conversions perform worse than manual bidding.

**Nobody knows how many tours per month South End books.** Until 2026-08-18 the number was literally unmeasurable. `tour_booked` now collects — so **the first job is to look**, not to launch.

> **Do not choose a bid strategy before you have a month of `tour_booked` data.** This is the single most consequential decision in the setup and it depends on a number we are currently 24 hours into collecting.

If the answer is **under ~15/month** — likely for a single club — the correct setup is deliberately unfashionable: one tightly-targeted search campaign, manual CPC or Maximise Clicks, small budget, watched weekly. Not Performance Max, not tCPA.

---

## Hard prerequisites — all blocking

| # | Prerequisite | State |
|---|---|---|
| 1 | `tour_booked` marked as a **key event** in GA4 | 🔴 pending propagation — [publish-tour-tracking-gtm.md](publish-tour-tracking-gtm.md) |
| 2 | **≥1 month of `tour_booked` data** to size the account | 🔴 collection started 2026-08-18 |
| 3 | **Conversion Linker** in GTM — [gtm-conversion-linker.md](gtm-conversion-linker.md) | 🔴 parked, **must run BEFORE any conversion tag** |
| 4 | `tour_booking_id` returns a real id, not `null` | 🔴 `book-tour` edge-function fix |
| 5 | **GBP §1 done** | 🔴 open, ~30 min, free |
| 6 | A **budget** and a **conversion value** decided by a human | 🔴 see below |

**#3 is the one that silently ruins everything.** The Conversion Linker must be collecting `gclid` **before** the conversion tag needs it, and it cannot backfill. Adding it afterwards leaves a stretch of conversions that look tracked and report at a fraction of the truth, with no error anywhere.

**#4 matters less than it looks.** Without an appointment id, Ads deduplication falls back to Google's own heuristics. Tolerable at low volume; fix it before scaling.

---

## Decisions a human must make first

### Conversion value

Ads cannot bid sensibly toward an unvalued conversion. A tour is worth far more than a newsletter signup and the platform has no way to know that.

Framework — **fill in the unknown, don't guess the whole thing**:

```
tour value = monthly dues × average tenure in months × tour→join rate
```

From [SEO/GUIDELINES.md](../SEO/GUIDELINES.md) and the membership builder, dues run **$245 single / $420 couple / $495 family** at tier 1, down to $205/$350/$420 at tier 3. **Average tenure and tour→join rate are not in this repo** — the club knows them, or can pull them from Club Automation.

Illustratively: a single membership at $245 held 18 months is ~$4,400. At a 30% tour→join rate a booked tour is worth **~$1,300**. That would make a $75 cost-per-tour extremely profitable — but the 30% is invented here. **Get the real number before setting a target CPA.**

Enrollment fees and the $20/month F&B assessment are additional; whether to include them is the club's call.

### Budget

Start small enough that a bad month is uninteresting. For a single local club, **$20–40/day on one campaign** is a real test. Scale on evidence, not optimism.

### Brand bidding — probably not

The club ranks **position 1.33 for its own name**. Bidding on it mostly buys clicks you already get free.

It is only worth it if **a competitor is bidding on your name** — which is a five-minute check, not an assumption. Search the club's name in an incognito window and look for competitor ads above the fold. If none, skip brand entirely and revisit quarterly.

---

## Steps

### Phase 1 — Create the account 🛑 HUMAN ONLY

> 🛑 **The agent must not perform this phase.** It requires creating an account and entering billing details. Ask the human to do it and to report back the customer ID.

1. Create at [ads.google.com](https://ads.google.com) using **the same Google account that owns GA4 and Search Console** (`samnader11@gmail.com` per the 2026-08-17 access check). Splitting accounts across logins is what made the Search Console link need an access fix mid-flight.
2. **Switch to Expert Mode immediately.** The default "Smart" onboarding railroads you into a Smart Campaign, which cannot be converted to a normal campaign later and hides nearly all controls.
3. Skip campaign creation — choose *"Create an account without a campaign."*
4. Set billing, currency **USD**, time zone **(GMT-07:00) Los Angeles** to match GA4.
5. Report the **customer ID** (`123-456-7890`).

> **Time zone and currency are permanent.** They cannot be changed after the account is created without starting over. Mismatching GA4 makes every cross-tool comparison subtly wrong forever.

### Phase 2 — Wire measurement before building anything

**Order matters. Do not reorder.**

1. **Run [gtm-conversion-linker.md](gtm-conversion-linker.md) first.** All Pages trigger. It must be live before step 3.
2. **Link Google Ads ↔ GA4:** GA4 Admin → Product links → Google Ads links. Also link **Search Console** is already done, and link **Google Business Profile** if available — it feeds location assets.
3. **Create the conversion action.** Google Ads → Goals → Conversions → New → Website → *manual/GTM setup*:
   - Name `Tour Booked` · Category **Submit lead form** · Count **One** · Attribution data-driven
   - **Value:** the number from the decision above. Not blank.
   - Record the **Conversion ID** (`AW-…`) and **Label**.
4. **Add the Ads conversion tag in GTM** — trigger `CE - tour_booked`, Transaction ID `{{tour_booking_id}}`, **with a condition excluding reschedules** (`tour_is_reschedule` equals `false`). The trigger and all ten variables already exist from container v7 — **do not rebuild them.**
5. **Do not import the GA4 key event as a second conversion action.** Having both a GTM-fired Ads conversion and an imported GA4 conversion for the same event double-counts. Pick the GTM one.

> 🛑 **HUMAN GATE — publishing the container and creating a conversion action both change live behaviour.** Confirm before each.

### Phase 3 — Campaign structure

Deliberately minimal. Complexity is what kills small accounts.

**One Search campaign, geo-targeted:**

- **Location:** radius around **2800 Skypark Dr, Torrance, CA 90505** — start ~8–10 miles. A health club is a physical habit; nobody drives 40 minutes to a gym four times a week. Set *Presence: people in or regularly in your targeted locations* — **not** the default, which includes people merely *interested in* the area and wastes budget on out-of-state searchers.
- **Ad groups by sport, tightly themed** — this is where South End is genuinely differentiated:

| Ad group | Why it's worth bidding on |
|---|---|
| Pickleball | 9 courts; highest-growth racquet sport in the US |
| Padel | **2 courts — rare in the South Bay**, low competition, high intent |
| Tennis | 9 courts, USTA league play |
| Squash / racquetball | 2 + 1 courts, almost nobody else has these |
| Pools & swim | showcase pool, beach-entry, lessons |
| Summer camp *(seasonal)* | ages 5–13, existing Jotform funnel |

- **Ad copy leads with countable facts.** "26 courts across 6 racquet sports in Torrance" beats any adjective. The site's own headline problem — *"an Elite Athletic Club Haven"* — is the thing to avoid repeating here.
- **Assets:** sitelinks to `/racquet-sports/`, `/pools/`, `/memberships/`, `/schedule-a-tour/`; callouts for the 4.4★/192 reviews; location asset from GBP; call asset **+1-310-530-0630** (*not* 310-325-8000, which is wrong and appears in six schema blocks — see [SEO/GUIDELINES.md](../SEO/GUIDELINES.md)).
- **Negative keywords from day one:** `jobs`, `careers`, `hiring`, `free`, `cheap`, `day pass`, `hotel`, `public`, `courts near me` *(if unqualified)*, plus city names outside the radius. Review the search terms report **weekly** for the first month — that is where the budget actually leaks.

**Landing pages:** send racquet traffic to `/racquet-sports/`, not the homepage. The floating booking widget is on **every page** (confirmed 2026-08-18, `se-bk-floating` on all ~26), so any page can convert — no need to force everyone to `/schedule-a-tour/`.

### Phase 4 — Launch guardrails

- **Bid strategy:** Maximise Clicks or manual CPC until conversion volume supports smart bidding. Revisit at ~15–30 conversions/month.
- **Ad rotation, budget pacing, weekly search-terms review** for the first month.
- **Watch `tour_booked` in GA4 segmented by `tour_utm_source`** to confirm ad traffic converts at all before scaling.
- Remember GA4 undercounts by roughly 15–30% because ad blockers block `googletagmanager.com`. **Supabase remains the source of truth for how many tours were booked.** Ads' own conversion count will also undercount for the same reason — do not reconcile the two to zero.

---

## What not to do

| Don't | Why |
|---|---|
| **Performance Max as the first campaign** | Needs conversion volume, gives almost no control, and quietly absorbs brand traffic you already get free — making itself look effective. |
| **Smart Campaigns** | The default path. Cannot be converted to a standard campaign later. |
| **Broad match + smart bidding on day one** | Needs the conversion data you don't have yet. |
| **Bidding on your own brand reflexively** | Position 1.33 organic already. Check for competitor ads first. |
| **Enabling the Display Network on a Search campaign** | On by default, spends real money on nothing. Turn it off. |
| **Enhanced conversions without a privacy review** | It hashes customer email/phone. Given the pre-ticked SMS/calls consent already flagged in [SEO/TODO.md](../SEO/TODO.md) §13, the privacy policy and consent language need looking at *first*. |

---

## Verification

```bash
curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-WLRX58RN" | grep -o -E "AW-[0-9]+" | sort -u
```

Expect the new conversion ID once the Ads tag is published. Then:

- GTM Preview: the Ads tag fires on `tour_booked` and **does not** fire when `tour_is_reschedule` is `true`.
- Google Ads → Conversions: status moves *"No recent conversions"* → **"Recording."** Can take hours.
- Google Ads → Tools → Google Tag: **no "Conversion Linker missing" diagnostic.**
- GA4 → Admin → Product links → Google Ads shows the link.

## Rollback

Pause campaigns to stop spend immediately. Conversion actions can be archived. GTM: Versions → restore the prior version. **Nothing here touches site code**, so no Thrive edit and no cache flush.

## Related

- [gtm-conversion-linker.md](gtm-conversion-linker.md) — **prerequisite, must run first**
- [tour-conversion-tracking.md](tour-conversion-tracking.md) — Part C is this handoff's ancestor
- [backup-gtm-container.md](backup-gtm-container.md) — export the container before and after
- [analytics/GA4-SNAPSHOT.md](../analytics/GA4-SNAPSHOT.md) — traffic baseline, property IDs

---

## Kickoff prompt

```
Execute handoffs/google-ads-account-setup.md in this repo.

Read it in full first, along with CLAUDE.md and analytics/GA4-SNAPSHOT.md.

BEFORE DOING ANYTHING, check the six hard prerequisites in the handoff and
report which are unmet. Several were open as of 2026-08-18 — most importantly
there is not yet a month of tour_booked data, which is what sizes the account
and determines the bid strategy. If they are unmet, STOP and tell me. Do not
proceed on the assumption they will be fixed.

You must NOT create the Google Ads account and must NEVER enter billing or
payment details. Phase 1 is human-only. Ask me to do it and report the
customer ID back to you.

Rules:
- Run handoffs/gtm-conversion-linker.md BEFORE creating any conversion tag.
  The linker cannot backfill; adding it afterwards produces conversions that
  look tracked and report at a fraction of the truth, with no error anywhere.
- The CE - tour_booked trigger and all ten variables already exist in
  container v7. Do NOT rebuild them — duplicates double-count.
- Do not create both a GTM Ads conversion tag AND an imported GA4 conversion
  for the same event. That double-counts. Use the GTM one.
- Exclude reschedules from the Ads conversion (tour_is_reschedule = false).
- Do not set up Performance Max, Smart Campaigns, or smart bidding.
- Stop and ask me at every 🛑 HUMAN GATE.

Also flag to me, don't just proceed past: the handoff argues the Google
Business Profile work (SEO/TODO.md §1, ~30 min, free) should happen before
any ad spend, since the club already ranks 1.33 for its own name and the GBP
has 192 reviews with an empty description. Tell me whether that's done.

Report which prerequisites are unmet, what you built, and what needs my
decision.
```

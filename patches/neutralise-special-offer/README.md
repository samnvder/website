# Patch — park the expired Summer 2026 campaign on `/special-offer/`

**Repo source: ✅ applied 2026-08-19. Live site: 🛑 NOT applied — that is the gate.**

---

## The live problem, in one line

`/special-offer/` **is published right now** and every submission sends
`offer: "summer-special-2026-jul31"` to Heroku and Dropbox Sign — filing August signups under July's
campaign — while showing visitors a dead countdown and quoting young-family discounts that are $5–10 off.

> ⚠️ **The bare URL returns a cached `404`.** That is GoDaddy's cache, not the page. Verify with a
> cache-buster or you will conclude it is down when it is serving:
> ```bash
> curl -s -o /dev/null -w "%{http_code}\n" -A "Mozilla/5.0" "https://southendclub.com/special-offer/?cb=$RANDOM"
> ```

## What this patch changes

Nine replacements across eight rules, each asserting its own hit count:

| # | What | From | To |
|---|---|---|---|
| 1 | Payload `offer:` tag | `summer-special-2026-jul31` | `UNSET-set-before-launch` |
| 1 | Young-family discounts | `{ 1: 25, 2: 15 }` | `{ 1: 30, 2: 20 }` (canonical) |
| 2 | `limitedTimeText` (markup + JS) | "through July 31 at midnight · 10 guest passes" | `OFFER NOT SET — do not publish` |
| 1 | Builder header comment | "flat $100 … through July 31, 2026" | "NOT SET. Set … before launch." |
| 3 | og / twitter / meta descriptions | "$100 enrollment … through July 31" | `OFFER NOT SET.` |
| 1 | Countdown target | `2026-08-01T06:59:59.000Z` | `null`, plus an early return in `tick()` |

**Why placeholders rather than new dates.** This follows #7966's precedent (CLAUDE.md): between campaigns
the template rests carrying **no offer**, loudly, so an accidental publish fails *obviously* instead of
*plausibly*. A silent, plausible wrong value is exactly what put July's tag on August's signups.

**The countdown needed code, not just data.** Setting `END = null` alone would make `tick()` compute
`null - now` → `NaN` and paint `NaNd`. `guardCountdown()` inserts an early return so a parked page simply
leaves the digits as-authored.

## Applying it

```bash
node patches/neutralise-special-offer/generate.js --check
```

Exits `0` — the repo source is already patched. Re-run `--apply` only if the page is re-derived from live.

### 🛑 HUMAN GATE — the live page

**Editing the repo file changes nothing on the site.** `Website/Pages/**` is Thrive paste-source; live is
a WordPress/Thrive database row. Two ways to fix live, and the first is almost certainly right:

**Option A — unpublish the page (recommended, ~1 minute).** The campaign ended July 31. `/special-offer/`
is published only during promotions, it is **not in the sitemap**, and unpublishing removes every live
symptom at once — the tag, the wording, the dead countdown, the wrong discounts. Nothing else links to it
except the delivered July email ([`campaigns/2026-07-summer-special/`](../../campaigns/2026-07-summer-special/)),
which is what handoff #9's redirect exists for.

**Option B — keep it live and paste the fix.** Only if the page must stay up. In Thrive, open the Custom
HTML element holding the inlined builder (`data-css="tve-u-693b313a87da28"`) and paste the corresponding
block from `Special Offer.neutralised.html`. **Never paste the whole page file** — the repo lags live, and
a whole-page paste deletes whatever live has and the repo does not (CLAUDE.md).

Then flush GoDaddy cache and verify:

```bash
curl -s -A "Mozilla/5.0" "https://southendclub.com/special-offer/?cb=$RANDOM" | grep -c "summer-special-2026-jul31"
```

Expect **`0`**. Also expect `0` for `1: 25, 2: 15`.

## Before the next campaign

Set all eight values together — tag, discounts, both `limitedTimeText` spots, header comment, three
descriptions, countdown. `guard:stale-offer` now scans page HTML, so a date that has passed fails
`npm run guard`; it cannot tell you a *future* date is the wrong one.

Deliverable emails go in [`campaigns/<YYYY-MM>-<slug>/`](../../campaigns/), which the guard skips — a sent
email is allowed to name a date that has passed.

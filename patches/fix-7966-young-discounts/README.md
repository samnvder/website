# Patch — #7966 young-family discounts + neutralise the expired campaign

**Prepared and APPLIED 2026-08-18.** ✅ Pasted into WPCode by the owner; mirror re-captured and verified identical. Kept as the record of what changed and why.

## What this changes

`fix-7966-young-discounts--paste-into-wpcode-7966.js` is the **current live contents of WPCode #7966**, with
exactly four substitutions:

| # | From | To | Why |
|---|---|---|---|
| 1 | `youngChildDiscounts = { 1: 25, 2: 15 }` | `{ 1: 30, 2: 20 }` | **The fix.** #9926 and #7315 both use 30/20; #7966 was left behind. Owner confirmed 2026-08-18 it was an oversight. A family with one young child was paying $5/month more through this builder. |
| 2 | header comment naming July 31, 2026 | "NONE ACTIVE. Template between campaigns" | The campaign is over. |
| 3 | `limitedTimeText` "through July 31 at midnight…" | "OFFER NOT SET — update this snippet before publishing" | Visitor-facing. |
| 4 | `offer: "summer-special-2026-jul31"` | `offer: "UNSET-set-before-launch"` | **The one that matters.** This tag reaches Heroku and Dropbox Sign. Left as-is, the next campaign's signups would all be filed under the old offer's name — the page looks right and only the paperwork is wrong. |

Rows 2–4 are not cosmetic tidying. #7966 is a **reusable template**: publishing an
offer page activates whatever it currently holds. A loud placeholder fails
obviously; a plausible-looking past campaign fails silently.

**Nothing else changes.** No dues, no enrollment fees, no F&B minimums, no logic.

## Safe to do now

#7966 is enabled but **inert** — no page is published that carries the builder
markup, and it returns early unless all four builder elements exist. So this
paste changes nothing a visitor can see today. Doing it now costs nothing;
doing it during a campaign launch is a live pricing change under time pressure.

## Steps

1. WP Admin → **Code Snippets (WPCode)** → open **#7966**
2. Click into the editor, **Ctrl+A**, paste the full contents of
   `fix-7966-young-discounts--paste-into-wpcode-7966.js`
3. **Update**
4. Paste the saved editor contents back into the conversation so the mirror can
   be re-captured — the mirror is only worth having if it is true

## After the paste — done

- ✅ Mirror re-captured; stripping its header reproduces this file exactly, and the
  repo paste-source matches too. Repo, live and mirror are one thing.
- ✅ `npm run guard:stale-offer` passes
- ✅ Wired into the chain — it was kept out while it was red, on purpose

## Regenerate

```bash
node patches/fix-7966-young-discounts/fix-7966-young-discounts--generate.js
```

Derives from the live mirror, so the output differs from what is running by
exactly the four substitutions above. It throws if any expected text is missing
— which is the signal that live has moved and the mirror is stale.

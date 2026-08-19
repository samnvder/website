# campaigns/

**Delivered marketing artifacts. Historical records — not page source, and never edited after sending.**

```
campaigns/<YYYY-MM>-<slug>/
```

`<YYYY-MM>` is the month the campaign **ran**, `<slug>` names it. One directory per campaign, everything
for that campaign inside it. The shape is deterministic on purpose: tooling keys off the path, not off a
filename convention someone has to remember.

| Campaign | Ran | Contents |
|---|---|---|
| [`2026-07-summer-special/`](2026-07-summer-special/) | July 2026 | `email-final.html` (delivered), `email-draft.html` (earlier version, "through July 21") |

## Why this directory exists

**A sent campaign is allowed to reference a date that has passed.** The July email correctly says
*"through July 31"* — it was true when it was sent, and rewriting it would falsify a record of what
customers were actually told.

That is the opposite of a **live page** carrying an expired offer, which is a real defect: it shows
visitors a dead countdown and, worse, sends a stale `offer:` tag to Heroku and Dropbox Sign, filing every
signup of the *new* campaign under the *old* campaign's name.

`guard:stale-offer` has to tell those two apart, and it does it by path:

| Path | Treated as | Expired date is |
|---|---|---|
| `live/wpcode/*.js` | code running on the site | **a failure** |
| `Website/Pages/**` | page source | **a failure** |
| `campaigns/**` | delivered history | **expected — skipped** |

Before this split, the guard flagged the two July emails alongside the genuinely broken
`Special Offer.html`. Findings nobody can act on are how a guard starts getting ignored, and a guard
being ignored is precisely the failure mode CLAUDE.md records for the membership-pricing guard — it
crashed for weeks and nobody noticed, because a red check had stopped meaning anything.

## Rules

1. **Never edit a delivered campaign.** It is a record of what was sent. If a follow-up differs, that is
   a new campaign directory.
2. **Put the whole campaign in one directory** — email HTML, any landing-page variant, the copy brief.
3. **Name from the month it ran**, not the month it was written.
4. **Do not put live page source here.** `/special-offer/` is a real page and lives in
   `Website/Pages/Memberships (Category)/special-offer/`. Only the *email* moved.
5. A campaign that is still being drafted has not run — keep it out until it does, or name it for its
   intended month and expect the guard to stay quiet either way.

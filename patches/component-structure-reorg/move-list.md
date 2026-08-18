# Derived move list — component-structure-reorg

Generated 2026-08-18 from `render-map.txt`, then **revised 2026-08-18** to apply
the HUMAN GATE 1 decisions. **NOTHING MOVED YET.**

Routing rules (see [the handoff](../../handoffs/component-structure-reorg.md)):

| Live page count | Destination |
|---|---|
| 2 or more | `Components/Shared/` (Rule B) |
| exactly 1 | `Components/{slug}/` (`index` → `Homepage/`) |
| 0, **seasonal** | `Components/Homepage/`, flagged seasonal (**Rule A-bis**) |
| 0, not seasonal | `Components/Archive/` — do not delete |
| generic scaffold, never deployed | `Components/_scaffolds/` — exempt from Rule A |

## Moves

| # | Current path | Renders on | Destination | Differs? |
|---|---|---|---|---|
| 1 | `Components/Archive/tour-button-google.html` | ABSENT | `Components/Archive/` | no |
| 2 | `Components/Buttons/Static Buttons/tour-button.html` | ABSENT | `Components/Archive/` | YES |
| 3 | `Components/Buttons/Static Buttons/virtual-tour-button.html` | index | `Components/Homepage/` | YES |
| 4 | `Components/CTA/Homepage Hero Summer Offer CTA.html` | ABSENT | `Components/Homepage/` **seasonal** | YES |
| 5 | `Components/CTA/Ready To Experience South End Footer CTA.html` | 20 pages | `Components/Shared/` | YES |
| 6 | `Components/CTA/Special Membership Promo CTA (Zapier).html` | **20 pages** | `Components/Shared/` ⚠️ **stale vs live** | YES |
| 7 | `Components/Footer.html` | 20 pages | `Components/Shared/` | YES |
| 8 | `Components/Header.html` (+ `.js`, `.readme`) | 20 pages | `Components/Shared/` | YES |
| 9 | `Components/Index/carousel-pickleball-homepage.html` | index, racquet-sports | `Components/Shared/` | YES |
| 10 | `Components/Carousel/Pickleball/*` (css, js, readme) | supports #9 | `Components/Shared/` | YES |
| 11 | `Templates/.../Floating Section Nav/*` (2 html + assets) | ABSENT | `Components/Archive/` | YES |
| 12 | `Templates/.../Left Upper CTA/*` (2 html + assets) | youth-programs | `Components/youth-programs/` | YES |
| 13 | `Templates/.../General Button/general-button.html` | ABSENT | `Components/Archive/` | YES |
| 14 | `Website/Pages/youth-programs/Homepage Youth Camp Banner.html` | ABSENT | `Components/Homepage/` **seasonal** | YES |
| 15 | `Website/Pages/.../summer-membership/Homepage Summer Banner.html` | ABSENT | `Components/Homepage/` **seasonal** | YES |
| 16 | `Website/Pages/.../memberships/Memberships Nav Block.html` | 10 pages | `Components/Shared/` | YES |
| 17 | `Website/Pages/.../special-offer/Homepage Hero Offer CTA.html` | ABSENT | **DELETE** (Phase 2 duplicate) | YES |
| 18 | `Components/Carousel/template/*` | never deployed | `Components/_scaffolds/carousel/` | YES |

**16 of 18 entries resolve to a directory that does not match where they live
today.** That ratio is the measurement of the problem.

## Seasonal register

Filed by intended page under Rule A-bis, **not** archived. Dormant, not dead.

| Block | Window | Live on 2026-08-18? |
|---|---|---|
| `Homepage Youth Camp Banner.html` | 6/8 – 8/21 | no — **inside its own window** |
| `Homepage Summer Banner.html` | summer | no |
| `Homepage Hero Summer Offer CTA.html` | summer | no |

The youth camp banner being dark inside its own stated registration window is
**out of scope for this handoff** — nothing here publishes or touches Thrive —
but it should be surfaced to the owner.

## Decisions applied at HUMAN GATE 1

1. **Seasonal blocks are not archived** (Rule A-bis). Rows 4, 14, 15 were routed
   to `Archive/` by the raw rule; that would bury content that returns next
   summer next to genuinely dead code.
2. **Phase 2 tiebreak.** Both copies of the hero CTA are ABSENT, so the render
   map cannot decide. Keep `Components/CTA/…` (row 4); delete the
   `special-offer/` copy (row 17), which is filed by advertised topic — the
   anti-pattern Rule A exists to kill. Use `git mv`, separate commit.
3. **`Components/_scaffolds/`** for generic never-deployed starters, exempt from
   Rule A. Row 18 (`Carousel/template/`) has live lineage — `Carousel/Pickleball/`
   is derived from it — so it is a starting point, not dead code.

## Both flagged rows resolved 2026-08-18

- **Row 13, `general-button.html` -> `Archive/`.** Decided by the owner. Confirmed
  independently: `sec-btn-glow` returns 0/20 on a second fingerprint pass. No live
  instance, no derived instance -- dead, not a scaffold.
- **Row 6, `Special Membership Promo CTA (Zapier)` -> `Shared/`, NOT Archive.**
  The hook check inverted this one. See below.

## 🚨 The Zapier row was a false negative, and the method that produced it is flawed

Checking the hook before archiving (as instructed) found the component is **live
on all 20 pages**. The render map said ABSENT because it fingerprinted the block
by the repo file's wrapper class:

| Fingerprint | Live |
|---|---|
| `zapierFormContainer` (repo file's div id) | **0/20** |
| `cm1jxql2l001o8bubfm2nwb35` (Zapier interface id) | **20/20** |
| `interfaces.zapier.com` | **20/20** |

Same Zapier interface, **different wrapper markup**. Live uses a
`<zapier-interfaces-page-embed>` web component plus the official
`zapier-interfaces.esm.js`; the repo file uses a hand-rolled `zapierFormContainer`
div with a manually-assigned `iframe.src`. **The repo copy is a stale earlier
implementation of something running site-wide** -- the same drift class as
`se-bk-floating` in CLAUDE.md.

Archiving it would have buried the repo's only record of a site-wide component.
It goes to `Shared/`, and its contents must **not** be treated as current: get a
paste from the live editor per the backup law before anyone edits it.

### The systematic flaw

**A block re-implemented live with different wrapper markup reads as ABSENT.**
Class-name fingerprints only detect blocks whose live markup still matches the
repo's. Every ABSENT verdict is therefore a *possible* false negative rather than
a finding.

Second-pass results using stable identifiers -- external URLs, form ids, embed
ids, things that survive a re-skin:

| Block | Stable fingerprint | Live | Verdict |
|---|---|---|---|
| Special Promo (Zapier) | `cm1jxql2l001o8bubfm2nwb35` | 20/20 | **false negative, corrected** |
| Homepage Youth Camp Banner | `250416539351152` (jotform) | 1/20 | banner absent; its CTA target is live on `youth-programs` via row 12 |
| tour-button / virtual-tour | `se-bk-floating`, "Book a Tour" | 20/20 | tour booking is live, but via the **`se-bk-floating` widget**; these two files are superseded implementations. Archive stands. |
| general-button | `sec-btn-glow` | 0/20 | genuinely absent |
| Floating Section Nav | `sec-floating-nav` | 0/20 | ⚠️ class-only, no stable id available |
| Hero Offer CTA | `se-hero-offer-cta` | 0/20 | ⚠️ class-only, no stable id available |
| Homepage Summer Banner | `se-home-summer-banner` | 0/20 | ⚠️ class-only, no stable id available |

The three marked ⚠️ **could not be verified by any re-skin-proof
identifier**. They are treated as absent, but that verdict is weaker than the
others. Rule A-bis routes all three to `Homepage/` (seasonal) rather than
`Archive/`, so nothing is buried on the strength of an unverified negative --
the risk is contained, not resolved.

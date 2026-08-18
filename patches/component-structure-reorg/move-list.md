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
| 6 | `Components/CTA/Special Membership Promo CTA (Zapier).html` | ABSENT | `Components/Archive/` — safe, see below | YES |
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
- **Row 6, `Special Membership Promo CTA (Zapier)` -> `Archive/`. Archiving is
  safe.** Investigated in full below, through one wrong turn.

## Row 6: the Zapier question, resolved

**Verdict: genuinely ABSENT. Archive it. Nothing is stranded.**

Every marker unique to this component is absent from all 20 live pages:

| Fingerprint | Live | Unique to this component? |
|---|---|---|
| `zapierFormContainer` | 0/20 | yes |
| `contactButton2` | 0/20 | yes |
| `"Submit a Form"` | 0/20 | yes |
| `cm1jxql2l001o8bubfm2nwb35` | **20/20** | **no -- shared Zapier interface** |

**Why archiving does not strand the hook.** The Zapier interface
`cm1jxql2l001o8bubfm2nwb35` is live and in active use -- but by a *different*
component: the **Ready To Experience South End Footer CTA** (row 5), which embeds
the same interface through `secFooterCtaIframe` / `sec-cta-open` / "Notify Me",
all 20/20. That component is staying, in `Shared/`. The interface keeps its
caller; only a superseded second wrapper around it goes to `Archive/`.

### The wrong turn, recorded

An earlier pass read `cm1jxql2l001o8bubfm2nwb35` at 20/20 and concluded row 6 was
a false negative that belonged in `Shared/`. **That was wrong.** A third-party
interface id is a *shared resource*, not a component fingerprint -- two different
components can embed the same Zapier page, and here two do.

So the Phase 1.4 rule needs its own guard: a stable identifier must be **unique to
the component**, not merely re-skin-proof. External URLs and embed ids fail this
when a resource is reused. Corroborate with a marker the component alone owns --
a wrapper id, a button label, a handler name.

## 🚨 Found while investigating: an unmirrored sitewide component

Not part of this reorg, but it surfaced and should not be dropped.

A **"Message Us" floating modal** runs on **20/20 live pages**: `se-crm-btn`,
`se-crm-modal`, embedding Zapier interface `cm4kje8hw001hp13agzjz9ul9`. Its own
markup says how it gets there:

> `<!-- Modal (kept out of Thrive wrappers by inserting sitewide via Code Snippets) -->`

That makes it a **WPCode snippet**, and the backup law requires it at
`live/wpcode/<id>-<kebab-name>.html`. **It is mirrored nowhere in `live/`.**
`grep -rl "se-crm-btn\|cm4kje8hw" live/` returns nothing.

It does appear inside four page files -- `Contact Us Page HTML.html`,
`Memberships Page HTML.html`, `Special Offer.html`, `Event Tour Booking Page.html`
-- but those are page sources, not the snippet, and cannot be the mirror for
something injected globally. A block on `privacy-policy` and `terms-conditions`
was not hand-pasted into those pages.

**This is the `se-bk-floating` pattern repeating**: a component running on every
page of production, existing in this repo only as incidental fragments. Capturing
it needs an editor paste from the WPCode screen -- out of scope here, since this
handoff does not touch the live site.

### The second-pass results in full

| Block | Fingerprint | Live | Verdict |
|---|---|---|---|
| Special Promo (Zapier) | `zapierFormContainer`, `contactButton2` | 0/20 | absent; shared interface id misled the first pass |
| Homepage Youth Camp Banner | `250416539351152` (jotform) | 1/20 | banner absent; its CTA target is live on `youth-programs` via row 12 |
| tour-button / virtual-tour | `se-bk-floating`, "Book a Tour" | 20/20 | booking is live via the **`se-bk-floating` widget**; these files are superseded. Archive stands. |
| general-button | `sec-btn-glow` | 0/20 | genuinely absent |
| Floating Section Nav | `sec-floating-nav` | 0/20 | ⚠️ class-only, no unique stable id |
| Hero Offer CTA | `se-hero-offer-cta` | 0/20 | ⚠️ class-only, no unique stable id |
| Homepage Summer Banner | `se-home-summer-banner` | 0/20 | ⚠️ class-only, no unique stable id |

The three marked ⚠️ have no unique re-skin-proof identifier. Rule A-bis
routes them to `Homepage/` (seasonal) rather than `Archive/`, so nothing is buried
on an unverified negative.

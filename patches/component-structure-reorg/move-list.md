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
| 6 | `Components/CTA/Special Membership Promo CTA (Zapier).html` | ABSENT | `Components/Archive/` ⚠️ | YES |
| 7 | `Components/Footer.html` | 20 pages | `Components/Shared/` | YES |
| 8 | `Components/Header.html` (+ `.js`, `.readme`) | 20 pages | `Components/Shared/` | YES |
| 9 | `Components/Index/carousel-pickleball-homepage.html` | index, racquet-sports | `Components/Shared/` | YES |
| 10 | `Components/Carousel/Pickleball/*` (css, js, readme) | supports #9 | `Components/Shared/` | YES |
| 11 | `Templates/.../Floating Section Nav/*` (2 html + assets) | ABSENT | `Components/Archive/` | YES |
| 12 | `Templates/.../Left Upper CTA/*` (2 html + assets) | youth-programs | `Components/youth-programs/` | YES |
| 13 | `Templates/.../General Button/general-button.html` | ABSENT | `Components/_scaffolds/` ⚠️ | YES |
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

## ⚠️ Two flagged for confirmation

- **Row 13, `general-button.html`** — routed to `_scaffolds/` by extension of
  decision 3, since it reads as a generic starter. **Unlike the carousel it has
  no demonstrated derived instance**, so the case is weaker; it may simply be
  dead. Confirm, or send it to `Archive/`.
- **Row 6, `Special Membership Promo CTA (Zapier)`** — ABSENT with no stated
  date window, so Rule A-bis sends it to `Archive/`. But "Special Membership
  Promo" *may* be seasonal with an unrecorded window. It also carries a Zapier
  integration, so archiving it may strand a live hook. **Confirm with the owner
  before archiving.**

## Notable corrections from measurement

- `carousel-pickleball-homepage.html` renders on **index *and* racquet-sports**,
  not homepage-only as the handoff assumed. Rule B sends it to `Shared/`.
- `Memberships Nav Block.html` renders on **10 pages** including fitness, pools,
  wellness, and youth-programs. Named for memberships, filed under memberships,
  shared across a third of the site — the same mis-filing-by-name as the youth
  banner.
- `Homepage Youth Camp Banner.html` is **ABSENT from all 20 live pages**, not
  live on the homepage as the handoff's worked example claimed. The example
  still holds — the filing error was linked-page-vs-intent, never liveness.

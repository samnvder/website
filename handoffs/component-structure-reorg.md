# component-structure-reorg

**Repo-only. No live system is touched.** Like
[consolidate-snippet-mirrors](consolidate-snippet-mirrors.md), this moves files
inside the repo and rewrites docs. It never edits Thrive, never publishes, never
flushes cache. The live site is used **read-only**, as the source of truth for
where each block actually renders.

**Status 2026-08-18: Phases 1–4 COMPLETE** (`eb845d3` → `ff81463`).
Phases 5–6 open, plus three items found along the way. **Time remaining:** ~2h.

---

## The problem

Four parallel homes exist for reusable blocks, with no rule distinguishing them:

| Location | Organized by |
|---|---|
| `Components/{Type}/` | component type |
| `Templates/Components/{Type}/` | mirrors `Components/` |
| `Website/Pages/{page}/` | page |
| `live/thrive/pages/{slug}/` | live URL |

Measured consequences, as of 2026-08-18:

1. **A byte-identical duplicate exists.** `Components/CTA/Homepage Hero Summer
   Offer CTA.html` and `Website/Pages/Memberships (Category)/special-offer/Homepage
   Hero Offer CTA.html` share an md5. Two conventions, one component, no
   authoritative copy — the same failure class as the `se-bk-floating` drift,
   but internal to the repo.
2. **Five homepage blocks sit under three parents**, filed by four different
   logics: by type, by page, by advertised topic, by linked page.
3. **The docs describe a repo that does not exist.** `Components/README.md` and
   `Website/Pages/README.md` both mandate "work in `Dev/`, promote with
   approval." **`Dev/` does not exist. Neither does `Applications/`.**
4. **Law citations do not resolve.** Component READMEs cite "Law I / IV / VIII";
   `Website-Law.md` contains Commandments 0–10.
5. **Commandment 5 is unenforceable.** It forbids `<style>` blocks; **33 files
   violate it**, including every file in `Components/CTA/`. Commandment Zero's
   Defense section simultaneously *mandates* per-component CSS. Thrive
   paste-blocks must be self-contained, so Commandment 5 cannot hold as written.

`live/` is the one convention that works — it is keyed to where code actually
runs and has a written verification ritual. This handoff extends that logic.

---

## The decision

**`Components/` becomes the single home for embeddable blocks, subdivided by
where the block renders.** `Templates/` is retired.

```
Components/
  Homepage/          blocks that render on /
  Shared/            blocks that render on 2+ pages (header, footer, buttons)
  {page-slug}/       blocks that render on exactly that page
  _scaffolds/        generic starters, never deployed — exempt from Rule A
  Archive/           deprecated, kept for history
```

Two rules carry the whole design:

> **Rule A — "Renders on", never "relates to".** A block is filed by the page it
> *renders on*, never the page it links to or the topic it advertises.
>
> **Rule A-bis — ABSENT is not automatically Archive.** A block absent from
> every live page may be dormant rather than dead. **ABSENT + a known seasonal
> window** → file by *intended* render page and flag it seasonal, with its date
> range, in the index. **ABSENT + no window + no owner** → `Archive/`.
> Conflating the two buries live-again content next to dead code.
>
> **Rule B — The 2+ threshold for `Shared/`.** A block enters `Shared/` only if
> it renders on two or more pages. One page means it goes to that page's
> directory. No exceptions, or `Shared/` becomes the new dumping ground.

Rule A is what fixes the actual bug. The worked example is `Homepage Youth Camp
Banner.html`: it advertises youth programs and links to
`/youth-programs/#sports-camp`, but its **intended placement is the homepage**.
It is currently filed under `Website/Pages/youth-programs/` — by linked page,
the exact error Rule A forbids. It belongs in `Components/Homepage/`.

**Measured 2026-08-18:** the block is `ABSENT` from all 16 live pages —
`youth-camp-promo` and `promo-card` return 0 hits on both `/` and
`/youth-programs/` (fetched clean at 772 KB and 363 KB). It is dormant, not
dead, and lands in `Components/Homepage/` under Rule A-bis. Note that its own
stated window is 6/8–8/21, so it was inside that window and still not live on
2026-08-18 — worth surfacing to the owner, but **out of scope for this
handoff**, which does not publish.

**Boundary with `Website/Pages/`:** `Pages/` keeps whole-page Thrive source
(`* HTML.html`, page CSS). `Components/` holds reusable or separately-pasted
blocks. If it is pasted into Thrive as its own element, it is a component.

---

## Phase 1 — Establish ground truth (do this first, it gates everything)

**The move list cannot be executed against assumptions.** Guessing where a
block renders is the exact error this handoff exists to fix. Phase 1 replaces
every guess with a measurement.

### 1.1 Build the block inventory

For each candidate file, extract its distinctive top-level class or ID — the
selector that would appear in rendered HTML.

```bash
cd "C:/Users/samna/Documents/Local Projects/Website"
find Components Templates "Website/Pages" -name "*.html" -print0 \
  | while IFS= read -r -d '' f; do
      cls=$(grep -oE '<section[^>]+class="[^" ]+' "$f" | head -1 | sed 's/.*class="//')
      [ -z "$cls" ] && cls=$(grep -oE 'id="se-[a-z0-9-]+"' "$f" | head -1)
      printf '%s\t%s\n' "${cls:-NONE}" "$f"
    done | sort > /tmp/block-inventory.tsv
cat /tmp/block-inventory.tsv
```

Write the result to `patches/component-structure-reorg/block-inventory.tsv`.

### 1.2 Fetch live pages read-only

Derive slugs from `Website/Pages/`. For each, capture rendered HTML:

```bash
mkdir -p patches/component-structure-reorg/live
for slug in "" memberships youth-programs racquet-sports fitness pools services \
            wellness contact-us events food-beverage schedule-a-tour \
            lounge-rentals special-offer summer-membership subscribe; do
  out="patches/component-structure-reorg/live/${slug:-index}.html"
  curl -sL "https://southendclub.com/$slug/" -o "$out"
  printf '%-24s %s bytes\n' "${slug:-index}" "$(wc -c < "$out")"
done
```

**Expected:** every file > 50,000 bytes. Anything under 10,000 is an error page
— stop and report rather than treating it as "block absent".

### 1.3 Map block → pages

For each class from 1.1, count which live pages contain it:

```bash
while IFS=$'\t' read -r cls f; do
  [ "$cls" = "NONE" ] && continue
  hits=$(grep -l -- "$cls" patches/component-structure-reorg/live/*.html 2>/dev/null \
         | xargs -n1 basename 2>/dev/null | tr '\n' ',')
  printf '%-28s %-3s %s\n' "$cls" "$(echo "$hits" | tr -cd ',' | wc -c)" "${hits:-ABSENT}"
done < patches/component-structure-reorg/block-inventory.tsv \
  | sort > patches/component-structure-reorg/render-map.txt
cat patches/component-structure-reorg/render-map.txt
```

### 1.4 Second pass — re-verify every ABSENT by a stable identifier

**A class-name fingerprint only finds blocks whose live markup still matches the
repo's.** If a block was re-implemented live with different wrapper markup, it
reads as ABSENT while running on every page. **ABSENT from 1.3 is a hypothesis,
not a finding.**

This is not hypothetical. On 2026-08-18 the Zapier promo CTA measured `0/20` by
its repo class `zapierFormContainer` and `20/20` by its Zapier interface id
`cm1jxql2l001o8bubfm2nwb35`. Live had been rebuilt on the
`<zapier-interfaces-page-embed>` web component; the repo copy was a stale
hand-rolled iframe. Archiving on the class-name verdict would have buried the
repo's only record of a site-wide component.

For every ABSENT row, extract identifiers that **survive a re-skin** — external
URLs, form ids, embed ids, third-party script srcs — and re-grep:

```bash
# stable identifiers = things a redesign cannot rename
grep -ohE 'https?://[^"'"'"' )]+|[0-9]{10,}' "<the-absent-file>" | sort -u
# then, per identifier:
grep -l -- "<identifier>" patches/component-structure-reorg/live/*.html | wc -l
```

**The identifier must be unique to the component, not merely re-skin-proof.**
A third-party embed id is a *shared resource*: on 2026-08-18 the Zapier interface
`cm1jxql2l001o8bubfm2nwb35` read 20/20, but because the **Footer CTA** embeds it,
not the promo CTA being tested — which was genuinely absent. Corroborate with a
marker the component alone owns: a wrapper id, a button label, a handler name.

**Any row that turns up > 0 on a stable, component-unique identifier is a false negative** — route
it by the real count, and flag the repo copy as stale-vs-live. A block with **no
re-skin-proof identifier** must be reported as *unverified absent*, never as
confirmed dead.

This produces the authoritative destination for every block:

| Live page count | Destination |
|---|---|
| 0 (`ABSENT`), seasonal | `Components/Homepage/` (or intended page) — flag seasonal, see Rule A-bis |
| 0 (`ABSENT`), not seasonal | `Components/Archive/` — **do not delete**, report it |
| exactly 1 | `Components/{that-slug}/` |
| 2 or more | `Components/Shared/` |

### 🛑 HUMAN GATE 1

**Present `render-map.txt` and the derived move list. Do not move anything yet.**

Flag explicitly:
- every block resolving to `ABSENT` **after the 1.4 second pass**, stating which
  stable identifier was used, or that none existed (unverified absent)
- every false negative 1.4 caught, with the repo copy marked stale-vs-live
- every block whose measured destination differs from its current directory
- `Homepage Youth Camp Banner.html` — expected `ABSENT`; confirm and treat
  under Rule A-bis (seasonal), **not** as Archive

Wait for approval before Phase 2.

---

## Phase 2 — Resolve the duplicate

Separate commit, before any moves, so it is independently revertible.

```bash
md5sum "Components/CTA/Homepage Hero Summer Offer CTA.html" \
       "Website/Pages/Memberships (Category)/special-offer/Homepage Hero Offer CTA.html"
```

**Expected:** two identical hashes.

**The render map cannot decide this one — both copies are `ABSENT`.** Decided
2026-08-18: **keep `Components/CTA/Homepage Hero Summer Offer CTA.html`**, delete
the `Website/Pages/Memberships (Category)/special-offer/` copy.

The reason is not that `Components/CTA/` is the surviving convention — it is a
type-directory and is also being retired. It is that the `special-offer/` copy is
filed **by advertised topic**, precisely the anti-pattern Rule A exists to kill;
keeping it would encode the bug into the surviving tree. Both copies are destined
for `Components/Homepage/` regardless, so this only decides which path carries
history through `git mv`.

```bash
git rm "<the-losing-path>"
git commit -m "Resolve the duplicated Homepage Hero Offer CTA"
```

If the hashes now **differ**, they have diverged since 2026-08-18 — stop, diff
them, and report. Do not pick one.

---

## Phase 3 — Move

Use `git mv` throughout. A delete-and-recreate loses history and defeats the
restore-point rule in CLAUDE.md.

```bash
mkdir -p Components/Homepage Components/Shared Components/_scaffolds
git mv "Website/Pages/youth-programs/Homepage Youth Camp Banner.html" Components/Homepage/
# …one line per row of the approved move list
```

**The scaffold exception.** `Components/Carousel/template/` is a generic starter,
never deployed, and `Carousel/Pickleball/` is derived from it — so it has live
lineage and is **not** deprecated. Decided 2026-08-18: it moves to
`Components/_scaffolds/`, explicitly exempt from Rule A.

```bash
git mv Components/Carousel/template Components/_scaffolds/carousel
```

Not `Archive/` (that means dead, and this is actively derived from). Not a
resurrected `Templates/` (that tree is one of the four competing homes this
handoff exists to collapse). The underscore sorts it first and reads as "not a
component" at a glance. **`_scaffolds/` is the only exemption from Rule A** —
adding a second one reopens the ambiguity.

Then retire the empty trees:

```bash
git mv Templates/Components/Buttons/* Components/Shared/   # per approved map
find Templates Components -type d -empty -delete
```

**Verify nothing was lost.** HTML file count outside `Programs/`,
`Pickleball-Central-Hub/`, and `node_modules/` must be **identical before and
after**, minus exactly the one duplicate deleted in Phase 2:

```bash
find Components Templates Website -name "*.html" 2>/dev/null | wc -l
```

**Expected:** pre-move count minus 1. Baseline recorded 2026-08-18 was **48**,
so expect **47**.

---

## Phase 4 — Repair cross-references

Moved basenames are referenced from `SEO/TODO.md`, `ASSETS-REFERENCE.md`,
`WORKFLOW-STRUCTURE.md`, page files, and other handoffs.

```bash
for name in "Homepage Youth Camp Banner" "Homepage Summer Banner" \
            "carousel-pickleball-homepage" "Homepage Hero Summer Offer CTA"; do
  echo "=== $name"
  grep -rn --exclude-dir=node_modules --exclude-dir=.git -- "$name" . | grep -v "^./Components/"
done
```

**Expected after fixing:** every hit points at a path that exists. Confirm:

```bash
grep -rhoE '\(\.?\.?/?(Components|Templates|Website)/[^)]+\)' --include="*.md" . \
  | tr -d '()' | sort -u | while read -r p; do
      [ -e "${p#./}" ] || echo "BROKEN: $p"
    done
```

**Expected:** no output.

---

## Phase 5 — The law system nobody wrote down

**Scope changed after measurement.** The original plan said "renumber the Law
citations." The real finding is larger:

**31 files make 36 citations to a roman-numeral law system. Not one of those
laws is defined anywhere in the repo.**

```bash
grep -rhoE "Law [IVX]+" --exclude-dir=node_modules --exclude-dir=.git . | sort | uniq -c | sort -rn
```

| Cited | Times | Meaning, inferred from usage |
|---|---:|---|
| **Law I** | 27 | Never edit production files directly; copy to `Dev/`, test, promote |
| **Law XI** | 4 | Every script carries a `.readme` |
| **Law IV** | 3 | Thrive uses inline styles; no `<style>` blocks in Thrive content |
| **Law VIII** | 2 | `{name}.html` / `.css` / `.js` / `-combined.html` |

Every hit is a *citation*. A search for definitions returns only more citations.
`Website-Law.md` contains **Commandments 0–10**, arabic, and its numbers do not
line up: its 4 is "320px minimum", its 5 is "separate HTML and CSS". Neither
matches Law IV or Law VIII as used.

Two consequences worth stating plainly:

1. **The most-cited rule in the repo is unfollowable.** Law I appears in 27
   files and prescribes working in `Dev/` — which does not exist. `HISTORY.md`
   shows `Dev/central/` belonged to a different project (Central) that this repo
   no longer contains, so the workflow was real once and its removal was never
   reflected in the docs.
2. **The roman system may be more accurate than the arabic one.** Law IV as
   cited ("Thrive uses inline styles; no `<style>` blocks in Thrive *content*")
   describes reality. `Website-Law.md` Commandment 5 ("separate HTML and CSS.
   **Always.**") is violated by 33 files and cannot hold, because Thrive
   paste-blocks must be self-contained. **Do not assume the arabic file wins.**

### 5.1 Decide the single authority — 🛑 HUMAN GATE

This is not a mechanical fix and must not be guessed. Present the table above
and ask which way to resolve:

- **(a)** Define the roman laws in `Website-Law.md` as a numbered section, keeping
  all 36 citations valid. Least churn, and honours how the repo already talks.
- **(b)** Rewrite all 36 citations to point at existing Commandments. Requires a
  meaning-by-meaning mapping, and there is no Commandment matching Law XI.
- **(c)** Drop the citations and state the rule inline in each README.

Recommend **(a)**: the citations are consistent and their meanings are
recoverable; the defect is a missing definition, not bad references.

### 5.2 Fix `Dev/` — 🛑 HUMAN GATE

27 files tell the reader to work somewhere that does not exist. Either recreate
`Dev/`, or rewrite Law I to describe the workflow actually in use. **Ask which
— this is a statement about how the owner works, not a documentation defect.**
`Applications/Tour-Booking-nvde` is cited by three page READMEs and is likewise
missing.

### 5.3 Reconcile Commandment 5

Amend `Website-Law.md` so it states the real rule: page sources separate HTML
and CSS; **Thrive paste-blocks are self-contained by necessity and are the
documented exception.** This reconciles it with Commandment Zero's Defense
section, with Law IV as cited, and with the 33 files already violating it.

### 5.4 Write Rules A, A-bis and B into `Components/README.md`

Verbatim from this handoff, or the ambiguity returns with the next banner.
`Components/README.md` also still carries the Law I / Law VIII / `Dev/` /
`Applications/` text and describes the retired `{Type}/` structure.

---

## Phase 6 — The component index

**The phase that prevents recurrence. Do not skip it as documentation polish.**

Write `Components/README.md` with a table of every block and the live URL it
renders on, generated from `patches/component-structure-reorg/render-map.txt`:

| Block | Location | Renders on | Notes |
|---|---|---|---|
| `Homepage Youth Camp Banner.html` | `Homepage/` | — | seasonal 6/8–8/21, dormant |
| `Header.html` | `Shared/Header/` | all 20 pages | |
| … | | | |

Include the seasonal register, and mark archived blocks with *why* they died
(superseded by `se-bk-floating`, replaced by the footer CTA, and so on).

**The absence of this index is the direct reason the youth camp banner was
invisible.** The reorg made the tree tidy; only the index makes it searchable.

---

## Found along the way — open

Not part of the original handoff. Ordered by consequence.

### A. `npm run audit:capture` does not cover `Components/`

The script hardcodes `Website/Pages`. **After this reorg, `Components/` holds
every reusable block and sits permanently unaudited.** Widen it or add a second
target:

```bash
node scripts/convert/live-capture-to-source.js Components --report Components/CAPTURE-AUDIT.md
```

Currently clean (17 files, 0 carrying output-only markup) — so this is about
keeping it that way.

### B. Nine page sources carry output-only markup

44 boolean and 26 `data-*` attribute expansions across the Membership Builders,
Memberships Page, Special Offer, both Tour Booking pages, Contact Us and Index.
Four also carry `thrv_wrapper thrv_custom_html_shortcode` divs the converter
**refuses to strip automatically** — removing one means matching its closing
div, which is hand work. `index/Index.html` additionally carries Thrive
header/footer symbol markup, meaning that capture is wider than the element it
should mirror.

### C. `npm run guard` has been broken since `3fc792b`

Pre-existing, documented in CLAUDE.md, untouched by this work. **A red check is
the normal state, so a genuinely broken build looks identical to a healthy one.**
Two faults: `DISCOUNT_SOURCE_REL` misses the `Discounted Enrollment/`
subdirectory, and `loadMembershipBuilderPricing` reads discounts from a file
that no longer defines them. **Confirm which file is authoritative for live
pricing before repointing** — pointing the guard at the wrong file would
silently stop validating real pricing drift, which is its entire purpose.

---

## Kickoff prompt — Phases 5 and 6

```
Continue handoffs/component-structure-reorg.md from Phase 5. Phases 1-4 are
committed (eb845d3 through ff81463); do not redo them.

Read Phase 5 first -- its scope changed after measurement. The finding is not
that Law citations are misnumbered: it is that 31 files cite a roman-numeral
law system that is defined nowhere, and the most-cited law (Law I, 27 files)
prescribes working in a Dev/ directory that does not exist.

Phase 5 has two HUMAN GATES, 5.1 and 5.2. Both are decisions about how the
owner works, not documentation defects. Stop and ask; do not guess, and do not
assume Website-Law.md wins just because it is the file named after the laws --
Law IV as cited describes reality better than Commandment 5 does.

Then do Phase 6, the component index. That is the phase that prevents this
recurring, so do not treat it as polish. Generate it from
patches/component-structure-reorg/render-map.txt and include the seasonal
register plus why each archived block died.

Report the three "Found along the way" items separately; do not fix C (the
guard) without confirming which pricing file is authoritative.
```

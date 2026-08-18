# component-structure-reorg

**Repo-only. No live system is touched.** Like
[consolidate-snippet-mirrors](consolidate-snippet-mirrors.md), this moves files
inside the repo and rewrites docs. It never edits Thrive, never publishes, never
flushes cache. The live site is used **read-only**, as the source of truth for
where each block actually renders.

**Time:** ~1.5h. **Blocked:** no.

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
- every block resolving to `ABSENT` (in repo, not on any live page)
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

## Phase 5 — Reconcile the docs

These are wrong today regardless of the reorg and are worth fixing on their own.

1. **Law citations.** In `Components/README.md`, rewrite "Law I / IV / VIII" to
   the actual Commandment numbers from `Website-Law.md` (0–10).
2. **The `Dev/` workflow.** `Components/README.md` and `Website/Pages/README.md`
   both instruct readers to work in `Dev/` and promote from there. **Neither
   `Dev/` nor `Applications/` exists.** Strike the language, or create the
   directories — do not leave it pointing at nothing.
3. **Commandment 5.** Amend in `Website-Law.md` to state the real rule: page
   sources separate HTML and CSS; **Thrive paste-blocks are self-contained by
   necessity and are the documented exception.** This reconciles it with
   Commandment Zero's Defense section and with the 33 files already violating it.
4. **Rules A and B** go into `Components/README.md` verbatim, or the ambiguity
   returns with the next banner.

---

## Phase 6 — The index

Write `Components/README.md` with a table of every block and the live URL it
renders on, generated from `render-map.txt`:

| Block | Renders on |
|---|---|
| `Homepage Youth Camp Banner.html` | `/` |
| … | … |

**The absence of this index is the direct reason the youth camp banner was
invisible** — there was no place to look that would have shown it existed. This
phase is the one that prevents recurrence; do not skip it as documentation
polish.

---

## Guardrails

- **Repo-only.** Nothing here edits Thrive, publishes, or flushes cache. If a
  step seems to require a live edit, you have misread it — stop and ask.
- **The repo lags live.** Moving a file does not validate its contents against
  production. This handoff reorganizes; it does not certify.
- **`git mv`, never delete-and-recreate.**
- **Three commits minimum:** docs fix, duplicate resolution, moves. Do not
  squash — the moves must be revertible without losing the doc repairs.
- **Out of scope:** `Programs/` (49 HTML files) and `Pickleball-Central-Hub/`
  (43) were never surveyed. Together they are larger than everything above.
  Leave them alone and say so in the closing report.

---

## Kickoff prompt

```
Execute handoffs/component-structure-reorg.md in this repo.

This is a repo-only reorganization — it moves files and rewrites docs, and
never touches the live site except to read it with curl. Read CLAUDE.md first.

Start with Phase 1 and stop at HUMAN GATE 1. Do not move any file before I
approve the render map.

Phase 1 is the whole point: the destination of every block is decided by
measuring which live pages actually contain it, not by what its filename or
current directory implies. A block that advertises youth programs but renders
on the homepage is a homepage component. Report anything that resolves to
ABSENT rather than quietly archiving it.

When you reach the gate, show me render-map.txt, the derived move list, and
specifically flag every block whose measured destination differs from where it
currently lives.
```

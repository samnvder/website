# Add Ana Sampaio to the fitness trainers grid

Adds a fourth personal trainer card to `/fitness/` and moves the trainers grid
from 3 columns to 2×2 on desktop.

Repo source of truth is [`Website/Pages/fitness/fitness HTML.html`](../../Website/Pages/fitness/fitness%20HTML.html)
and [`Fitness CSS.css`](../../Website/Pages/fitness/Fitness%20CSS.css). The
artifacts here are **sliced out of those files** by `fitness-add-trainer-ana--generate.js`, so they
cannot drift from what was reviewed and committed. Regenerate with:

```bash
node patches/fitness-add-trainer-ana/fitness-add-trainer-ana--generate.js
```

| File | What it is |
|---|---|
| `fitness-add-trainer-ana--paste-into-thrive-section.html` | The whole Personal Training section — paste this if replacing the section wholesale |
| `fitness-add-trainer-ana--paste-into-thrive-card-ana.html` | Just Ana's card, for inserting one card after Justin Stuler's |
| `fitness-add-trainer-ana--preview.html` | Standalone render (section + full page CSS) for eyeballing layout |
| `fitness-add-trainer-ana--generate.js` | Regenerates all three from the page file |

## Photo — uploaded, but oversized

The card points at:

```
https://southendclub.com/wp-content/uploads/2026/08/Ana.png
```

Verified live: `HTTP/1.1 200`, `Content-Type: image/png`. CompressX has already
generated its derivatives, so browsers get AVIF/WebP rather than the PNG.

**It is far heavier than it needs to be**, and worth fixing before or soon after
publishing:

| | Source | Delivered (AVIF) |
|---|---|---|
| `Ana.png` | 2.29 MB | 105 KB |
| `SouthEndEddieLopez-Headshot.jpg` | 7.5 KB | — |
| `SouthEndkaren-merrell-Headshot.jpg` | 5.5 KB | — |

It renders inside `.trainer-photo`, which is **140x140 px**. Even after
CompressX, Ana's headshot is roughly 14x the weight of the other three combined,
for the same rendered size. A ~300x300 JPG (2x for retina) would land around
15-25 KB and be visually identical at display size.

This is a content fix, not a code one — resize and re-upload, keeping the same
filename so no markup has to change. If the filename does change, edit the page
file and regenerate rather than hand-editing the artifact:

```bash
node scripts/convert/live-capture-to-source.js "Website/Pages/fitness/fitness HTML.html" --check
node patches/fitness-add-trainer-ana/fitness-add-trainer-ana--generate.js
```

Note the source is a PNG where the other three are JPGs. PNG is the wrong format
for a photograph — it is why the original is 2.29 MB. CompressX hides most of
that, but the Media Library still carries it.

## ⚠️ Verify the phone number before publishing

The number given was **(414) 554-5559**. Area code 414 is Wisconsin; every other
trainer on this page is 310, and the South Bay overlay is 424. This may be a
typo for (424) 554-5559. It is rendered exactly as supplied — confirm with Ana
before this goes live, because a wrong number on a live page is worse than a
missing one.

## Changes made to the repo source

**HTML** — one new `.trainer-card` after Justin Stuler, structurally identical
to the existing three (same `thrv_wrapper thrv_text_element` wrapper, same SVG
icons, same `.trainer-contact` block).

The three certifications stack as consecutive `.trainer-role` lines rather than
one role line:

```html
<p class="trainer-role trainer-role-stacked">NASM Certified Personal Trainer (CPT)</p>
<p class="trainer-role trainer-role-stacked">Functional Aging Specialist (FAI)</p>
<p class="trainer-role">Parkinson Wellness Recovery (PWR! Moves&reg;)</p>
```

**CSS** — two changes:

```css
.trainers-grid { grid-template-columns: repeat(2, 1fr); }  /* was repeat(3, 1fr) */
.trainer-role-stacked { margin-bottom: 4px; }              /* new */
```

`.trainer-role-stacked` tightens every credential line but the last, so the
block keeps the same 14px gap to the bio that a single-line role has. An
explicit modifier class rather than `:has()` or a negative margin, so it
survives a Thrive editor round-trip.

The existing `@media (max-width: 1024px)` rule already set `repeat(2, 1fr)` and
is now redundant with the base rule. Left in place deliberately: if desktop ever
goes back to 3 columns, tablet still resolves to 2.

## Bio

Condensed to ~57 words to match the other three trainers (~40 words each). A
full-length 4-paragraph bio would have made her card roughly 3× their height.

The supplied copy listed her credentials in the bio; since they now appear
stacked above it, the bio drops that sentence to avoid saying it twice. Nothing
else was cut — both specialisms (women's programming, and older adults /
Parkinson's) are still there.

## Verification performed

Measured in a real browser at 1280px and 981px against the actual page CSS:

- grid resolves to two 593.5px columns; 4 cards in 2 rows of 2
- credential lines render 3-deep with 4px / 4px / 14px bottom margins
- no horizontal page overflow; the long email does not overflow its pill
- CSSOM confirms all three breakpoints: base `repeat(2, 1fr)`,
  ≤1024 `repeat(2, 1fr)`, ≤768 `1fr`

Not verified: rendering at 375px specifically — the preview pane would not
apply the resize. Mobile relies on the unchanged ≤768 `1fr` rule, and Ana's card
is structurally identical to the other three, so it stacks the same way.

Also confirmed the page file is still editor-form
(`live-capture-to-source.js --check` exits 0) — no CompressX or DOM-copy
artifacts crept in.

## 🛑 HUMAN GATE — publishing

1. ~~Upload the headshot~~ — done, `Ana.png`, verified 200
2. Consider resizing it first (see above) — same filename, no markup change
3. Confirm the phone number with Ana
4. Open `/fitness/` in Thrive Architect and paste `fitness-add-trainer-ana--paste-into-thrive-card-ana.html`
   directly after Justin Stuler's card, inside `.trainers-grid`
5. Apply the two CSS changes wherever this page's CSS lives in Thrive
6. Save, then **GoDaddy → Quick Links → Flush Cache**
7. Verify by `curl`, never the browser:

```bash
curl -s https://southendclub.com/fitness/ | grep -c 'class="trainer-card"'
```

Expect **4**.

```bash
curl -s https://southendclub.com/fitness/ | grep -c 'analupersonal2014@gmail.com'
```

Expect **1**.

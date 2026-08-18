# Add Ana Sampaio to the fitness trainers grid

Adds a fourth personal trainer card to `/fitness/` and moves the trainers grid
from 3 columns to 2×2 on desktop.

Repo source of truth is [`Website/Pages/fitness/fitness HTML.html`](../../Website/Pages/fitness/fitness%20HTML.html)
and [`Fitness CSS.css`](../../Website/Pages/fitness/Fitness%20CSS.css). The
artifacts here are **sliced out of those files** by `build-artifact.js`, so they
cannot drift from what was reviewed and committed. Regenerate with:

```bash
node patches/fitness-add-trainer-ana/build-artifact.js
```

| File | What it is |
|---|---|
| `personal-training-section.html` | The whole Personal Training section — paste this if replacing the section wholesale |
| `trainer-card-ana.html` | Just Ana's card, for inserting one card after Justin Stuler's |
| `preview.html` | Standalone render (section + full page CSS) for eyeballing layout |
| `build-artifact.js` | Regenerates all three from the page file |

## 🛑 BLOCKER — the photo is not uploaded yet

The card points at:

```
https://southendclub.com/wp-content/uploads/2026/08/SouthEndAnaSampaio-Headshot.jpg
```

**That URL does not exist yet.** Until the photo is in the WordPress Media
Library at that exact path, the card renders with a broken image.

Existing trainers follow the naming pattern `SouthEndEddieLopez-Headshot.jpg`,
`SouthEndkaren-merrell-Headshot.jpg`, `SouthEndJustinStulerPhoto-Small.jpg`, so
`SouthEndAnaSampaio-Headshot.jpg` matches. If WordPress assigns a different
month folder or appends a suffix on upload, fix the source file and regenerate
rather than hand-editing the artifact:

```bash
node scripts/convert/live-capture-to-source.js "Website/Pages/fitness/fitness HTML.html" --check
node patches/fitness-add-trainer-ana/build-artifact.js
```

Do **not** paste this into Thrive before the photo exists — you would ship a
broken image to a live page.

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

1. Upload the headshot to the WP Media Library as `SouthEndAnaSampaio-Headshot.jpg`
2. `curl -sI https://southendclub.com/wp-content/uploads/2026/08/SouthEndAnaSampaio-Headshot.jpg | head -1` → expect `HTTP/2 200`
3. Confirm the phone number with Ana
4. Open `/fitness/` in Thrive Architect and paste `trainer-card-ana.html`
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

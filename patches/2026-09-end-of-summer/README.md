# 2026-09-end-of-summer

Thrive / WPCode paste pack from `scripts/campaign`. Regenerated on every apply.
Campaign status: **active**.
Offer tag: `end-of-summer-2026-sep1`.

Notepad titles start with **PAGE** / **HOME** / **WPCODE** so the three live pastes are distinguishable in the taskbar.

**Every apply writes a full-page Thrive select-all** (`PAGE--2026-09-end-of-summer.html`). That is the file to paste into `/special-offer/`.

Do not hand-edit these files. Do not paste a browser or curl capture (`<picture>` / AVIF wrappers).

## 🛑 HUMAN GATE — live pastes

Nothing here is live until a human pastes it.

---

### 1. FULL PAGE — `/special-offer/` (this is the main paste)

**File:** `PAGE--2026-09-end-of-summer.html`

**Where:** WordPress → Pages → **Special Offer** → Edit with Thrive Architect → the page content HTML (the same select-all you used for the summer page: metadata, video hero, offer card, nav, membership cards, builder, FAQ, corporate teaser, tour calendar).

**How:** Open this file → Ctrl+A → Ctrl+C. In Thrive, select-all the page HTML → paste → Save / Update.

This file is the applied `Special Offer.html`: hero, promo, countdown, builder with enrollment / dues / guest passes, FAQ, and tour widget. Campaign comments like `CAMPAIGN:PROMO` are harmless and should stay.

Do **not** also enable WPCode **#7966** on this page. The builder is inlined.

Thrive **Custom CSS** is a separate panel. Do not paste extra membership-card CSS into this file. This paste is the page HTML only.

---

### 2. Homepage campaign banner — `/`

**File:** `HOME--2026-09-end-of-summer.html`

**Where:** WordPress → Pages → **Home** (the front page) → Edit with Thrive Architect → **one** Custom HTML block in the offer / hero area.

**How:** Select-all in that Custom HTML code box → paste this file. Remove any previous seasonal offer banner or summer hero CTA so only this block remains.

---

### 3. Site-wide floating offer button — WPCode footer

**File:** `WPCODE--2026-09-end-of-summer.html`

**Where:** WPCode → Code Snippets → HTML snippet, **Site Wide**, **Footer**. First campaign: create it. Later campaigns: reopen **this same snippet** and replace it. Do not create a second snippet.

**How:** Ctrl+A in the snippet editor → paste → **Update**. Confirm the **"Snippet updated."** notice (the form can look saved when it is not). Then mirror the editor contents to `live/wpcode/<assigned-id>-global-special-offer-button.html` in the same session.

The chip hides itself on `/special-offer/` and after the end date. It sits with `#se-bk-floating-wrap` (tour) and `#se-crm-btn` (message).

---

### 4. Yoast — Google title and description

**File:** `YOAST--2026-09-end-of-summer.md`

**Where:** Edit **Special Offer** → Yoast SEO panel (not Thrive, not the meta tags at the top of the page HTML). Those body meta tags do **not** change Google.

**How:** Paste the title and description from the file into Yoast → Update the page.

---

### Fragments — only if you are replacing one Custom HTML box, not the whole page

| File | Where |
|---|---|
| `PROMO--2026-09-end-of-summer.html` | `/special-offer/` Custom HTML for the offer card under the video hero |
| `BUILDER--2026-09-end-of-summer.html` | `/special-offer/` Custom HTML `data-css="tve-u-693b313a87da28"` (inlined builder JS) |

If you pasted **#1 (full page)**, you do not need these two.

---

## Cache and curl

Flush GoDaddy cache, then verify with curl, not the browser.

```powershell
curl.exe -sL "https://southendclub.com/special-offer/?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" -o "$env:TEMP\se-offer.html"
Select-String -Path "$env:TEMP\se-offer.html" -Pattern "se-campaign-promo","end-of-summer-2026-sep1" | Measure-Object | Select-Object -ExpandProperty Count
```

Expect a non-zero count for `se-campaign-promo`. Expect the offer tag **end-of-summer-2026-sep1**. Expect **0** hits for the previous campaign tag.

```powershell
curl.exe -sL "https://southendclub.com/?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" | Select-String "se-campaign-float","se-campaign-banner"
```

Expect the banner on the homepage. Expect **one** `se-campaign-float` on ordinary pages and **zero** visible copies on `/special-offer/` (the markup may be present globally; the script must not add `is-visible` there).

## Regenerate

```powershell
node patches/2026-09-end-of-summer/GEN--2026-09-end-of-summer.js
```

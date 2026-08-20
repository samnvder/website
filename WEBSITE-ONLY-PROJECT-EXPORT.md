# Website-only Cursor project — export manifest

> **Role:** Single checklist of every path to copy from this monorepo into a dedicated website-only repository or Cursor workspace before you delete or stop tracking website assets here. Paths are relative to the repository root (`WebsiteV1/`).

---

## 1. Copy these directories (required)

| Relative path | Notes |
|---------------|--------|
| `Website/` | All public pages (e.g. `Website/Pages/`). |
| `Components/` | Reusable site components. |
| `Templates/` | Page and component templates. |
| `css/` | Site stylesheets. |
| `js/` | Site scripts. |
| `media/` | Assets and carousel source markdown (e.g. pickleball images list). |
| `Programs/Pickleball/live/` | Open Play RSVP + check-in HTML and `js/` (deploy paths). |
| `Programs/Pickleball/advanced-open-play/testing/unit/` | Node tests for Open Play helpers. |
| `Programs/Pickleball/advanced-open-play/testing/scripts/` | `local-test.js` (mirrors active tree → `advanced-open-play/testing/local-page/`). |

---

## 2. Copy these root files (required)

| Relative path | Notes |
|---------------|--------|
| `index.html` | |
| `readme.md` | Trim references to Central after move. |
| `package.json` | **See §7** — remove Central scripts before or after copy. |
| `package-lock.json` | Regenerate with `npm install` if you simplify `package.json`. |
| `package.readme` | |
| `package-lock.readme` | |
| `STYLE-GUIDE.md` | |
| `LAYOUT-STANDARDS.md` | |
| `SEO-GUIDELINES.md` | |
| `JS-PATTERNS.md` | |
| `ASSETS-REFERENCE.md` | |
| `Website-Law.md` | |
| `WORKFLOW-STRUCTURE.md` | |
| `AI-RULES.md` | Optional; align with website-only scope. |

---

## 3. Copy these directories (optional — include if you use them)

| Relative path | Notes |
|---------------|--------|
| `Create/` | Creative / marketing drafts. |
| `email-templates/` | Marketing email work. |
| `Archive/` | Retired site material; omit for a clean repo. |
| `scripts/build/build-carousel.js` + `scripts/build/build-carousel.readme` | Required if you use carousel build. |
| `scripts/build/build-all-pdfs.js` and related | **Omit** unless you still want PDF builds from the website repo. |
| `scripts/build/carousel-configs/` | Pickleball, tennis, etc. |
| `scripts/scaffold/new-carousel.js` + readme | |
| `scripts/convert/` | Local/live URL conversion. |
| `scripts/README.md` | |
| `scripts/build/README.md` | |
| `scripts/scaffold/README.md` | |
| `scripts/convert/README.md` | |

**Minimal scripts folder for carousels only:** `scripts/build/build-carousel.js`, `scripts/build/build-carousel.readme`, `scripts/build/carousel-configs/**`, `scripts/scaffold/new-carousel.js`, `scripts/scaffold/new-carousel.readme`, `scripts/scaffold/README.md`, plus parent `scripts/README.md` if desired.

---

## 4. Do **not** copy (platform / Central — stays in this repo)

| Relative path | Reason |
|---------------|--------|
| `Dev/` | Central + experiments (`Dev/central/`, tour-booking-v2, etc.). |
| `Applications/` | e.g. Tour-Booking-nvde — separate app. |
| `Daxco Resources/` | Vendor API reference. |
| `docs/` | Product vision, migration notes — not the marketing site tree. |
| `prompts-main/` | Prompt engineering. |
| `HUMAN-ONLY/` | Human-only; never ship. |
| `node_modules/` | Regenerate with `npm install`. |
| `supabase/` (repo root) | Only `.temp/` CLI cache here — not real project config. |
| `.github/` | Copy only if you recreate CI for the website repo. |

---

## 5. Backend-coupled pages (Supabase) — do not forget

These files call **`https://zngbawafqjntciafhxgr.supabase.co`** and **`/functions/v1/`** (`check-availability`, `validate-referral`, `book-tour`). They are still part of the **website** export; they are not self-contained static HTML.

| File |
|------|
| `Website/Pages/Memberships (Category)/memberships/Memberships Page HTML.html` |
| `Website/Pages/Memberships (Category)/special-offer/Special Offer.html` |
| `Website/Pages/Tours (Category)/schedule-a-tour/Membership Tour Booking Page.html` |

**After export:** Consider one shared config for the Supabase base URL instead of three duplicates, and ensure the new repo’s README documents that booking depends on those Edge Functions remaining deployed.

---

## 6. Cursor rules for the website-only project

Copy into the new repo as `.cursor/rules/` (all `*.mdc` files and `README.md` live at the root of that folder — no subfolders).

| Source | Purpose |
|--------|---------|
| `.cursor/rules/*.mdc` | All rule files (website/marketing, general formatting, local-test — see `README.md` in that folder). |

**Optional** (trim to taste): `project-style-guide.mdc`, `no-inline-horizontal-scroll.mdc`, `iframe-sandbox.mdc`, `context-aware-pages.mdc`, `ui-interaction-guards.mdc`, `universal-base.mdc`, `context-discipline.mdc`, `model-selection.mdc`, `human-only.mdc`.

**Omit** for a pure marketing repo: anything named `central-*`, `crm-*`, `supabase-project-ref.mdc`, `rls-enforcement.mdc`, `frontend-module-patterns.mdc`, `form-ux.mdc` (if only Central), `smart-search-pattern.mdc`, `staff-*`, `lead-member-*`, `department-*`, `category-editor-*`, `test-samples-required.mdc`, `change-validation.mdc`, `testing.mdc`, `terminal-flows.mdc` (unless you want deploy samples), `compliance.mdc`, `dev-laws.mdc` / `project-identity.mdc` **unless** you want monorepo-wide governance duplicated.

---

## 7. `package.json` — website-only trim

After copy, **remove or rewrite** scripts that point at `Dev/central/`, for example:

- `scaffold:central-form`
- `test:central`, `test:central:*`
- `build:central-*`, `build:central-maps`, `build:all-pdfs` (unless you kept those scripts)

**Keep** as needed: `start`, `serve`, `dev`, `test`, `local-test`, `local-test:sync`, `build:pickleball-carousel`, `scaffold:carousel`, `convert:local`, `convert:live`.

---

## 8. Suggested `.gitignore` for the new website repo

```
node_modules
.env
*.env
config.env
.DS_Store
supabase/.temp/
```

Add any deploy or OS cruft you use locally.

---

## 9. Verification checklist (before removing files from this repo)

- [ ] All paths in §1–§2 exist in the destination.
- [ ] §5 three HTML files open and booking flow still targets the correct Supabase project.
- [ ] Carousel: run `npm run build:pickleball-carousel` (or equivalent) from the new repo root if you use carousels.
- [ ] `npx serve . -p 3000` (or your choice) serves `index.html` and `Website/Pages/...` without broken asset paths.
- [ ] Cursor loads `.cursor/rules/*.mdc` (or your chosen set); see `.cursor/rules/README.md` for the index.

---

## 10. Test sample (smoke)

| Step | Input | Expected |
|------|--------|----------|
| Local serve | From new repo root: `npx serve . -l 3000` | Server starts. |
| Open home | Browser: `http://localhost:3000/index.html` | Page loads without 404 for main assets. |
| Open a page | e.g. `http://localhost:3000/Website/Pages/index/Index.html` | Page loads (adjust path if you flatten `Website/` in the new repo). |

---

## 11. Doc note for the new repo

This monorepo’s `project-identity.mdc` still refers to a root `Pages/` folder; **live pages are under `Website/Pages/`**. Update the new project’s README or rules to match your final folder layout (keep `Website/Pages/` or rename to `pages/` — if you rename, fix internal links and this manifest mentally).

---

*Generated for export from WebsiteV1; update this file if the monorepo layout changes.*

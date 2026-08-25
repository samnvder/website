# scripts/campaign/

IDE/LLM-agnostic engine for membership special-offer campaigns. It writes **only** the campaign-marked slices of `/special-offer/`, the canonical offer builder JS, a homepage campaign banner, and a site-wide floating offer button. Ordinary pages (join, tour, fitness, youth, header/footer, WPCode #9926/#7315/#7966, #8309, #8292) stay untouched.

## Commands

```powershell
node scripts/campaign/index.js ingest --input <email.html> [--slug kebab]
node scripts/campaign/index.js prepare --input <email.html> [--slug kebab]
node scripts/campaign/index.js apply --id <campaign-id> [--dry-run]
node scripts/campaign/index.js verify
node scripts/campaign/index.js park [--dry-run]
node scripts/campaign/index.js bootstrap
```

npm aliases: `campaign`, `campaign:ingest`, `campaign:prepare`, `campaign:apply`, `campaign:verify`, `campaign:park`, `campaign:bootstrap`.

**Chat trigger:** a pasted offer-email HTML is enough. Agents run `ingest`, not a homework list of commands. `ingest` is detect-then-prepare: it exits 1 if the paste looks like `/special-offer/` page source or is not an offer email.

| Action | What it does |
|---|---|
| **ingest** | Detect-then-prepare. Entry for chat pastes. Exits 1 if the HTML is not an offer email. |
| **prepare** | Parse email HTML. Writes `scripts/campaign/work/<id>/campaign.json` + `email-source.html`. Does **not** change page sources. |
| **apply** | Requires `status: "approved"` and zero unresolved ambiguities. Archives current campaign surfaces, writes the four generated files, copies the email into `campaigns/<id>/email-source.html` (never overwrites a delivered file), and regenerates `patches/<id>/` including the **full-page Thrive select-all**. |
| **verify** | Markers, builder JS, banner, button, and `state.json` must agree. Parked sources must shout `OFFER NOT SET` / `UNSET-set-before-launch`. Wired as `npm run guard:campaign`. |
| **park** | Archives the **active** campaign (if any) and restores loud placeholders. No-op archive when already parked. |
| **bootstrap** | One-time: archive the last saved summer sources under `2026-07-summer-special-100-enrollment-10-guest-passes`, install markers, park. Safe to re-run (existing archives are left alone). |

`--dry-run` on apply/park does not write archives or sources.

## Loop

1. **Paste the email HTML in chat** (or `ingest --input`). Detection plus ordinary language is the trigger — not a remembered CLI.
2. Human confirms the draft in `scripts/campaign/work/<id>/campaign.json` (`"status": "approved"`, empty `ambiguities`).
3. `apply --id <id>`. Expired end dates and `UNSET-set-before-launch` cannot be approved launches.
4. 🛑 **HUMAN GATE** — nothing is live until a human pastes from `patches/<id>/`. **Primary paste:** `PAGE--<id>.html` is the full `/special-offer/` Thrive select-all. Then `HOME--<id>.html` and `WPCODE--<id>.html`. Do not paste a browser capture.
5. When the campaign ends: `park`.

Work drafts under `scripts/campaign/work/` are gitignored.

## Isolation

The engine may write only:

| Path | Role |
|---|---|
| `Website/Pages/Memberships (Category)/special-offer/Special Offer.html` | Marked slices: META, PROMO, CALLOUT, LIMITED-TIME, BUILDER-JS |
| `Website/Pages/Memberships (Category)/special-offer/membership builder JS-special-offer.js` | Canonical companion of the inlined builder |
| `Components/Homepage/Homepage Campaign Banner.html` | Generated homepage banner |
| `Components/Shared/Global Special Offer Button.html` | Generated site-wide chip |
| `patches/<campaign-id>/` | Paste artifacts. **Always includes** `PAGE--<id>.html` (full `/special-offer/` Thrive select-all), `HOME--<id>.html`, `WPCODE--<id>.html` |
| `campaigns/<id>/email-source.html` | Copy of the driving email on first apply |
| The `Archive/` dirs next to those sources | Byte-exact previous campaign |
| `scripts/campaign/state.json` | Last applied manifest |

Hero video, membership cards, FAQ, tour widget, nav, and sticker monthly dues stay. Sticker dues in the builder template must match `membership-pricing-source.json`. A campaign may also set `duesDiscount` (`single` / `couple` / `family`); that subtracts in the special-offer builder only, after sticker math, and strikes through the sticker amount next to the deal price the same way enrollment does. When every dues off-amount is 0, the builder shows sticker dues with no cross-off.

`git diff --name-only` after apply/park/bootstrap must not show `/memberships/`, `Index.html`, 8309, 8292, the youth camp banner, or WPCode 9926/7315/7966.

## Markers

`Special Offer.html` carries HTML comments `<!-- CAMPAIGN:<name>:START -->` / `END` around the replaceable slices. Persistent CSS (Thrive hero sizing, `.so-offer-callout`) lives **outside** the PROMO marker so apply cannot delete it.

The companion JS file is generated from `templates/membership-builder.js.tmpl` and spliced into the BUILDER-JS marker. Do not hand-edit either copy; they must match.

## Global button

Small chip, footer WPCode HTML. Coexists with `#se-bk-floating-wrap` (bottom-left tour) and `#se-crm-btn` (bottom-right message). Hidden on `/special-offer/`. No-op when `END` is null or the campaign has expired. Parking hides it in JS; disabling the snippet is the real off switch.

## Parking

Parked sources use `OFFER NOT SET` and `offer: "UNSET-set-before-launch"` so an accidental publish fails obviously instead of shipping the last campaign's tag to Heroku / Dropbox Sign.

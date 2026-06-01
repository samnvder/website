# memberships

## Layman's terms

Main memberships page. Membership builder, comparison, etc. Don't edit directly—work in Dev.

## Medium understanding

Memberships landing page. Memberships Page HTML.html, CSS, membership builder JS.js. Law I: never edit directly.

## Advanced

- **Script:** membership builder JS.js + .readme

## Advanced

- **Files:** Memberships Nav Block.html, Memberships Page CSS.css, Memberships Page HTML.html, membership builder JS.js, membership builder JS.readme

## Pricing update flow

Deterministic way to change membership **monthly dues** (Tier order = Tier1,Tier2,Tier3):

1. **Dry run** — prints an old→new diff, writes nothing:
   `node "update-pricing.js" --single 245,215,195 --couple 390,350,335 --family 490,425,395`
2. **Apply** — re-run with `--apply` to write `membership builder JS.js`, then it auto-refreshes
   the audit (`membership-pricing-audit.log` / `.pdf` / `.md`) and appends a row to
   `membership-pricing-audit.ledger.log` (only when prices actually change).
3. **Go live** — paste the full contents of `membership builder JS.js` into WordPress
   WPCode snippet **#7315**, then ask Claude to verify the live page matches.

Pass only the types you want to change; omit the rest. Enrollment fees, discounts and F&B
minimums are edited directly in `membership builder JS.js`, then run `pricing-audit.gen.js`.

Supporting scripts:
- `update-pricing.js` — edit dues + confirm (diff) + regenerate audit.
- `pricing-audit.gen.js` — rebuild `.log` / `.pdf` / `.md` + ledger from the JS.
- `pricing-audit.hook.js` — PostToolUse hook wrapper (in `.claude/settings.json`); regenerates the
  audit automatically whenever `membership builder JS.js` is edited via Claude Code.

## History

- 2026-03-02 09:16:47: Added: Memberships Nav Block.html, Memberships Page CSS.css, Memberships Page HTML.html, membership builder JS.js, membership builder JS.readme

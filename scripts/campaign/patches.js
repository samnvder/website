'use strict';

const fs = require('fs');
const path = require('path');
const { TARGETS, abs } = require('./paths');
const { detectEol, withEol, toLf } = require('./eol');

function patchNames(id) {
  return {
    generate: `GEN--${id}.js`,
    page: `PAGE--${id}.html`,
    promo: `PROMO--${id}.html`,
    builder: `BUILDER--${id}.html`,
    banner: `HOME--${id}.html`,
    button: `WPCODE--${id}.html`,
    preview: `PREVIEW--${id}.html`,
    yoast: `YOAST--${id}.md`,
  };
}

function stalePatchNames(id) {
  return [
    `${id}--generate.js`,
    `${id}--paste-into-thrive-special-offer-page.html`,
    `${id}--paste-into-thrive-special-offer-promo.html`,
    `${id}--paste-into-thrive-special-offer-builder.html`,
    `${id}--paste-into-thrive-homepage-banner.html`,
    `${id}--paste-into-wpcode-global-special-offer-button.html`,
    `${id}--preview.html`,
    `${id}--yoast.md`,
  ];
}

function generateJs(id) {
  return `#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { writePatchDir, readManifestFromState } = require('../../scripts/campaign/patches');
const { TARGETS, abs } = require('../../scripts/campaign/paths');
const repoRoot = path.resolve(__dirname, '..', '..');
const manifest = readManifestFromState(repoRoot);
if (!manifest || manifest.id !== ${JSON.stringify(id)}) {
  throw new Error('State manifest id does not match this patch directory (${id}).');
}
const render = require('../../scripts/campaign/render');
writePatchDir(repoRoot, manifest, {
  page: fs.readFileSync(abs(repoRoot, TARGETS.page), 'utf8'),
  promo: render.renderPromo(manifest),
  builder: render.renderBuilderElement(manifest),
  banner: render.renderBanner(manifest),
  button: render.renderButton(manifest),
  preview: render.renderPreview(manifest),
  yoast: render.renderYoast(manifest),
});
console.log('[campaign] regenerated artifacts for ${id}');
`;
}

function readmeFor(manifest) {
  const id = manifest.id;
  const parked = manifest.status === 'parked';
  const names = patchNames(id);
  return `# ${id}

Thrive / WPCode paste pack from \`scripts/campaign\`. Regenerated on every apply.
Campaign status: **${manifest.status}**.
Offer tag: \`${manifest.offerTag}\`.

Notepad titles start with **PAGE** / **HOME** / **WPCODE** so the three live pastes are distinguishable in the taskbar.

**Every apply writes a full-page Thrive select-all** (\`PAGE--${id}.html\`). That is the file to paste into \`/special-offer/\`.

Do not hand-edit these files. Do not paste a browser or curl capture (\`<picture>\` / AVIF wrappers).

## 🛑 HUMAN GATE — live pastes

Nothing here is live until a human pastes it.

---

### 1. FULL PAGE — \`/special-offer/\` (this is the main paste)

**File:** \`${names.page}\`

**Where:** WordPress → Pages → **Special Offer** → Edit with Thrive Architect → the page content HTML (the same select-all you used for the summer page: metadata, video hero, offer card, nav, membership cards, builder, FAQ, corporate teaser, tour calendar).

**How:** Open this file → Ctrl+A → Ctrl+C. In Thrive, select-all the page HTML → paste → Save / Update.

This file is the applied \`Special Offer.html\`: hero, promo, countdown, builder with enrollment / dues / guest passes, FAQ, and tour widget. Campaign comments like \`CAMPAIGN:PROMO\` are harmless and should stay.

Do **not** also enable WPCode **#7966** on this page. The builder is inlined.

Thrive **Custom CSS** is a separate panel. Do not paste extra membership-card CSS into this file. This paste is the page HTML only.

---

### 2. Homepage campaign banner — \`/\`

**File:** \`${names.banner}\`

**Where:** WordPress → Pages → **Home** (the front page) → Edit with Thrive Architect → **one** Custom HTML block in the offer / hero area.

**How:** Select-all in that Custom HTML code box → paste this file. Remove any previous seasonal offer banner or summer hero CTA so only this block remains.

---

### 3. Site-wide floating offer button — WPCode footer

**File:** \`${names.button}\`

**Where:** WPCode → Code Snippets → HTML snippet, **Site Wide**, **Footer**. First campaign: create it. Later campaigns: reopen **this same snippet** and replace it. Do not create a second snippet.

**How:** Ctrl+A in the snippet editor → paste → **Update**. Confirm the **"Snippet updated."** notice (the form can look saved when it is not). Then mirror the editor contents to \`live/wpcode/<assigned-id>-global-special-offer-button.html\` in the same session.

${parked
    ? 'This campaign is parked. Disable the snippet. Parking hides the button in JS; disabling it is the real off switch.'
    : 'The chip hides itself on `/special-offer/` and after the end date. It sits with `#se-bk-floating-wrap` (tour) and `#se-crm-btn` (message).'}

---

### 4. Yoast — Google title and description

**File:** \`${names.yoast}\`

**Where:** Edit **Special Offer** → Yoast SEO panel (not Thrive, not the meta tags at the top of the page HTML). Those body meta tags do **not** change Google.

**How:** Paste the title and description from the file into Yoast → Update the page.

---

### Fragments — only if you are replacing one Custom HTML box, not the whole page

| File | Where |
|---|---|
| \`${names.promo}\` | \`/special-offer/\` Custom HTML for the offer card under the video hero |
| \`${names.builder}\` | \`/special-offer/\` Custom HTML \`data-css="tve-u-693b313a87da28"\` (inlined builder JS) |

If you pasted **#1 (full page)**, you do not need these two.

---

## Cache and curl

Flush GoDaddy cache, then verify with curl, not the browser.

\`\`\`powershell
curl.exe -sL "https://southendclub.com/special-offer/?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" -o "$env:TEMP\\se-offer.html"
Select-String -Path "$env:TEMP\\se-offer.html" -Pattern "se-campaign-promo","${manifest.offerTag}" | Measure-Object | Select-Object -ExpandProperty Count
\`\`\`

Expect a non-zero count for \`se-campaign-promo\`. Expect the offer tag **${manifest.offerTag}**. Expect **0** hits for the previous campaign tag.

\`\`\`powershell
curl.exe -sL "https://southendclub.com/?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" | Select-String "se-campaign-float","se-campaign-banner"
\`\`\`

Expect the banner on the homepage. Expect **one** \`se-campaign-float\` on ordinary pages and **zero** visible copies on \`/special-offer/\` (the markup may be present globally; the script must not add \`is-visible\` there).

## Regenerate

\`\`\`powershell
node patches/${id}/GEN--${id}.js
\`\`\`
`;
}

function readManifestFromState(repoRoot) {
  const p = abs(repoRoot, TARGETS.state);
  if (!fs.existsSync(p)) return null;
  const state = JSON.parse(fs.readFileSync(p, 'utf8'));
  return state.manifest || null;
}

function writePatchDir(repoRoot, manifest, artifacts) {
  const id = manifest.id;
  const dir = abs(repoRoot, path.join(TARGETS.patchesDir, id));
  fs.mkdirSync(dir, { recursive: true });
  const names = patchNames(id);
  stalePatchNames(id).forEach((name) => {
    const full = path.join(dir, name);
    if (!fs.existsSync(full)) return;
    try {
      fs.unlinkSync(full);
    } catch (err) {
      if (err.code !== 'EBUSY' && err.code !== 'EPERM') throw err;
    }
  });
  const lf = (s) => withEol(toLf(String(s)).replace(/\n$/, '') + '\n', '\n');
  const pageHtml = artifacts.page != null
    ? artifacts.page
    : fs.readFileSync(abs(repoRoot, TARGETS.page), 'utf8');
  const pageEol = detectEol(pageHtml);
  fs.writeFileSync(path.join(dir, 'README.md'), lf(readmeFor(manifest)));
  fs.writeFileSync(path.join(dir, names.generate), lf(generateJs(id)));
  fs.writeFileSync(
    path.join(dir, names.page),
    withEol(toLf(pageHtml).replace(/\n$/, '') + '\n', pageEol)
  );
  fs.writeFileSync(path.join(dir, names.promo), lf(artifacts.promo));
  fs.writeFileSync(path.join(dir, names.builder), lf(artifacts.builder));
  fs.writeFileSync(path.join(dir, names.banner), lf(artifacts.banner));
  fs.writeFileSync(path.join(dir, names.button), lf(artifacts.button));
  fs.writeFileSync(path.join(dir, names.preview), lf(artifacts.preview));
  fs.writeFileSync(path.join(dir, names.yoast), lf(artifacts.yoast));
  return dir;
}

module.exports = { patchNames, writePatchDir, readManifestFromState, readmeFor };

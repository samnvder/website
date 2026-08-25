'use strict';

const { MARKERS, markerStart, markerEnd } = require('./paths');
const { toLf } = require('./eol');
const { replaceMarkedBlock, hasAllMarkers } = require('./html');
const {
  renderMeta,
  renderPromo,
  renderCallout,
  renderBuilderElement,
} = require('./render');

const HERO_SIZING_CSS = `<style>
/* Match join-page Thrive hero sizing (those data-css rules live on /memberships/ only).
   Without this, the empty video section collapses on /special-offer/. */
[data-css="tve-u-19b118c3a37"].tcb-video-background-parent,
.tcb-video-background-parent[data-css="tve-u-19b118c3a37"] {
  margin-top: 129px !important;
  position: relative !important;
  overflow: hidden !important;
}
[data-css="tve-u-693b313a87d943"] {
  min-width: auto !important;
  min-height: 720px !important;
}
.tcb-video-background-parent .tcb-bg-video,
.tcb-video-background-parent video.tcb-bg-video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
@media (max-width: 1023px) {
  [data-css="tve-u-19b118c3a37"].tcb-video-background-parent,
  .tcb-video-background-parent[data-css="tve-u-19b118c3a37"] {
    margin-top: 60px !important;
  }
  [data-css="tve-u-693b313a87d943"] {
    min-height: 450px !important;
  }
}
@media (max-width: 767px) {
  [data-css="tve-u-19b118c3a37"].tcb-video-background-parent,
  .tcb-video-background-parent[data-css="tve-u-19b118c3a37"] {
    margin-top: 0 !important;
  }
  [data-css="tve-u-693b313a87d943"] {
    min-height: 230px !important;
  }
}
</style>`;

const CALLOUT_CSS = `<style>
/* Campaign callout — persistent. Promo apply must not delete these rules. */
.so-offer-callout {
  max-width: 640px !important;
  margin: -18px auto 36px !important;
  padding: 18px 20px !important;
  text-align: center !important;
  background: linear-gradient(135deg, rgba(11,70,140,0.08), rgba(184,134,11,0.12)) !important;
  border: 2px solid #0b468c !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 28px rgba(11,70,140,0.12) !important;
  font-family: Montserrat, sans-serif !important;
}
.so-offer-callout-eyebrow {
  margin: 0 0 8px !important;
  color: #b8860b !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
}
.so-offer-callout-title {
  margin: 0 0 12px !important;
  color: #204147 !important;
  font-size: clamp(17px, 2.4vw, 20px) !important;
  font-weight: 800 !important;
  line-height: 1.3 !important;
  text-wrap: balance !important;
}
.so-offer-callout-perks {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  gap: 8px !important;
}
.so-offer-callout-perks span {
  display: inline-block !important;
  padding: 7px 12px !important;
  background: #0b468c !important;
  color: #fff !important;
  border-radius: 999px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
}
@media (max-width: 768px) {
  .so-offer-callout { margin: -10px 0 28px !important; padding: 16px 14px !important; }
}
</style>`;

function wrap(name, inner) {
  return `${markerStart(name)}\n${inner}\n${markerEnd(name)}`;
}

function findNavStylesIndex(html) {
  const m = html.match(/<!-- =+\s*\n\s*NAVIGATION STYLES/);
  if (!m) return -1;
  return html.indexOf(m[0]);
}

function indexAfterVideoHero(html) {
  const inner = html.indexOf('data-css="tve-u-693b313a87d943"');
  if (inner < 0) return -1;
  const closeInner = html.indexOf('</div>', inner);
  if (closeInner < 0) return -1;
  const closeParent = html.indexOf('</div>', closeInner + 1);
  if (closeParent < 0) return -1;
  return closeParent + '</div>'.length;
}

function indexOfFirst(html, regexes, before) {
  let best = -1;
  regexes.forEach((re) => {
    const m = html.match(re);
    if (!m) return;
    const i = html.indexOf(m[0]);
    if (i >= 0 && i < before && (best < 0 || i < best)) best = i;
  });
  return best;
}

function findPromoStart(html, navIdx) {
  const afterHero = indexAfterVideoHero(html);
  if (afterHero >= 0 && afterHero < navIdx) return afterHero;
  return indexOfFirst(html, [
    /<div class="promo-banner-summer"/,
    /<div id="se-campaign-promo"/,
    /id="se-campaign-promo"/,
    /<!-- Campaign promo/,
    /<!-- =+\s*\n\s*SUMMER SPECIAL/,
  ], navIdx);
}

function installMetaMarker(html) {
  if (html.includes(markerStart(MARKERS.meta))) return html;
  const metaStart = html.indexOf('<!-- Primary Meta Tags -->');
  const canonical = html.indexOf('<!-- Canonical URL -->');
  if (metaStart < 0 || canonical < 0 || canonical < metaStart) {
    throw new Error('installMarkers: cannot find Primary Meta Tags / Canonical URL');
  }
  const metaBlock = html.slice(metaStart, canonical).trimEnd();
  const titleM = metaBlock.match(/<title>[\s\S]*?<\/title>/);
  const nameTitle = metaBlock.match(/<meta name="title"[^>]*>/);
  const nameDesc = metaBlock.match(/<meta name="description"[^>]*>/);
  const ogTitle = metaBlock.match(/<meta property="og:title"[^>]*>/);
  const ogDesc = metaBlock.match(/<meta property="og:description"[^>]*>/);
  const twTitle = metaBlock.match(/<meta name="twitter:title"[^>]*>/);
  const twDesc = metaBlock.match(/<meta name="twitter:description"[^>]*>/);
  if (!titleM || !nameTitle || !nameDesc || !ogTitle || !ogDesc || !twTitle || !twDesc) {
    throw new Error('installMarkers: missing a title/description meta tag');
  }
  const metaInner = [
    titleM[0],
    nameTitle[0],
    nameDesc[0],
    ogTitle[0],
    ogDesc[0],
    twTitle[0],
    twDesc[0],
  ].join('\n');
  let metaReplaced = metaBlock
    .replace(titleM[0], 'TITLE_PLACE')
    .replace(nameTitle[0], '')
    .replace(nameDesc[0], '')
    .replace(ogTitle[0], '')
    .replace(ogDesc[0], '')
    .replace(twTitle[0], '')
    .replace(twDesc[0], '');
  metaReplaced = metaReplaced.replace('TITLE_PLACE', wrap(MARKERS.meta, metaInner));
  metaReplaced = metaReplaced.replace(/\n{3,}/g, '\n\n');
  return html.slice(0, metaStart) + metaReplaced + '\n\n' + html.slice(canonical);
}

function installPromoMarker(html) {
  if (html.includes(markerStart(MARKERS.promo))) return html;
  const navIdx = findNavStylesIndex(html);
  if (navIdx < 0) {
    throw new Error('installMarkers: cannot find NAVIGATION STYLES');
  }
  const start = findPromoStart(html, navIdx);
  if (start < 0) {
    throw new Error('installMarkers: cannot find promo region (video hero, banner, or campaign promo)');
  }
  const inner = html.slice(start, navIdx).trim();
  if (!inner) {
    throw new Error('installMarkers: promo region empty');
  }
  const persist = `${HERO_SIZING_CSS}\n${CALLOUT_CSS}\n`;
  return html.slice(0, start) + persist + wrap(MARKERS.promo, inner) + '\n' + html.slice(navIdx);
}

function installCalloutMarker(html) {
  if (html.includes(markerStart(MARKERS.callout))) return html;
  const calloutStart = html.indexOf('<div class="so-offer-callout">');
  const membershipType = html.indexOf('<!-- Membership Type Selection -->', calloutStart);
  if (calloutStart < 0 || membershipType < 0) {
    throw new Error('installMarkers: cannot find so-offer-callout');
  }
  const calloutBlock = html.slice(calloutStart, membershipType).trim();
  return html.slice(0, calloutStart) + wrap(MARKERS.callout, calloutBlock) + '\n    ' + html.slice(membershipType);
}

function installMarkers(html) {
  const src = toLf(html);
  if (hasAllMarkers(src, [MARKERS.meta, MARKERS.promo, MARKERS.callout])) return src;
  let out = installMetaMarker(src);
  out = installPromoMarker(out);
  out = installCalloutMarker(out);
  return out;
}

function installLimitedTimeMarker(html) {
  const src = toLf(html);
  if (src.includes(markerStart(MARKERS.limitedTime))) return src;
  const re = /<span id="limitedTimeText" class="limited-time">([\s\S]*?)<\/span>/;
  const m = src.match(re);
  if (!m) throw new Error('installMarkers: limitedTimeText span not found');
  return src.replace(re, `<span id="limitedTimeText" class="limited-time">${wrap(MARKERS.limitedTime, m[1])}</span>`);
}

function installBuilderMarker(html) {
  const src = toLf(html);
  if (src.includes(markerStart(MARKERS.builderJs))) return src;
  const re = /<!-- Special-offer pricing \(inlined[\s\S]*?<\/script>/;
  const m = src.match(re);
  if (!m) throw new Error('installMarkers: inlined builder script not found');
  return src.replace(re, wrap(MARKERS.builderJs, m[0]));
}

function installAllMarkers(html) {
  let out = toLf(html);
  if (!hasAllMarkers(out, [MARKERS.meta, MARKERS.promo, MARKERS.callout])) {
    out = installMarkers(out);
  }
  out = installLimitedTimeMarker(out);
  out = installBuilderMarker(out);
  if (!hasAllMarkers(out, Object.values(MARKERS))) {
    const missing = Object.values(MARKERS).filter(
      (n) => !out.includes(markerStart(n)) || !out.includes(markerEnd(n))
    );
    throw new Error('installAllMarkers: still missing ' + missing.join(', '));
  }
  return out;
}

function applyManifestToPage(html, manifest) {
  let out = toLf(html);
  if (!hasAllMarkers(out, Object.values(MARKERS))) {
    out = installAllMarkers(out);
  }
  out = replaceMarkedBlock(out, MARKERS.meta, renderMeta(manifest));
  out = replaceMarkedBlock(out, MARKERS.promo, renderPromo(manifest));
  out = replaceMarkedBlock(out, MARKERS.callout, renderCallout(manifest));
  out = replaceMarkedBlock(out, MARKERS.limitedTime, manifest.limitedTimeText);
  out = replaceMarkedBlock(out, MARKERS.builderJs, renderBuilderElement(manifest));
  return out;
}

module.exports = {
  HERO_SIZING_CSS,
  CALLOUT_CSS,
  installAllMarkers,
  applyManifestToPage,
};

/**
 * Fails when a mirrored WPCode offer snippet still carries a campaign that has
 * already ended. Run: npm run guard:stale-offer
 *
 * Why this exists
 * ---------------
 * #7315 and #7966 are reusable offer templates -- the owner re-edits them per
 * promotion rather than replacing them, so each holds the LAST campaign's
 * values until the next edit. Publishing an offer page activates whatever is in
 * there. The dangerous part is not the visible date (someone would notice the
 * page saying "through July 31" in October); it is the `offer:` tag in the
 * fetch payload, which reaches Heroku and Dropbox Sign. A stale tag files every
 * signup of the NEW campaign under the OLD campaign's name. The page looks
 * right; only the paperwork is wrong, and nobody reads the paperwork until they
 * need it.
 *
 * A header checklist already documented this. A checklist is what failed the
 * first time, so this makes it mechanical.
 *
 * What it checks, in live/wpcode/*.js:
 *   1. `offer: "...-<month><day>"` tags whose date has passed
 *   2. Human-facing "through <Month> <day>" wording whose date has passed
 *
 * Deliberately NOT checked: whether the snippet is enabled. An inert snippet
 * with a stale tag is still a launch hazard -- that is precisely the state it
 * sits in between campaigns, and the moment it goes live is the moment it is
 * too late to notice.
 */

const fs = require('fs');
const path = require('path');

const MIRROR_DIR_REL = path.join('live', 'wpcode');

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

/**
 * `today` is injected so the guard is testable and deterministic.
 * Dates are compared at day granularity: an offer ending today has not expired.
 */
function findStaleOffers(source, fileLabel, today) {
  const findings = [];
  const currentYear = today.getFullYear();

  const expired = (monthIdx, day, year) => {
    const end = new Date(year, monthIdx, day);
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return end < todayMidnight ? end : null;
  };

  const fmt = (d) => d.toISOString().slice(0, 10);

  // 1. offer tags: offer: "summer-special-2026-jul31"
  const tagRe = /offer:\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = tagRe.exec(source)) !== null) {
    const tag = m[1];
    const dm = tag.match(/(?:^|[-_])([a-z]{3,9})(\d{1,2})(?:$|[-_])/i);
    if (!dm) continue;
    const monthIdx = MONTHS[dm[1].toLowerCase()];
    if (monthIdx === undefined) continue;
    const ym = tag.match(/(20\d{2})/);
    const year = ym ? Number(ym[1]) : currentYear;
    const end = expired(monthIdx, Number(dm[2]), year);
    if (end) {
      findings.push(
        `${fileLabel}: offer tag "${tag}" names ${fmt(end)}, which has passed. ` +
          'Every signup would be filed under this campaign name.'
      );
    }
  }

  // 2. visitor-facing wording: "through July 31 at midnight"
  const textRe = /through\s+([A-Za-z]{3,9})\s+(\d{1,2})/g;
  while ((m = textRe.exec(source)) !== null) {
    const monthIdx = MONTHS[m[1].toLowerCase()];
    if (monthIdx === undefined) continue;
    const near = source.slice(m.index, m.index + 200);
    const ym = near.match(/(20\d{2})/);
    const year = ym ? Number(ym[1]) : currentYear;
    const end = expired(monthIdx, Number(m[2]), year);
    if (end) {
      findings.push(
        `${fileLabel}: offer wording "through ${m[1]} ${m[2]}" names ${fmt(end)}, which has passed.`
      );
    }
  }

  // The same date usually appears several times in one file (header comment,
  // visitor wording, payload tag). Report each distinct problem once.
  return [...new Set(findings)];
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const dir = path.join(repoRoot, MIRROR_DIR_REL);
  if (!fs.existsSync(dir)) {
    console.log('[stale-offer-guard] No live/wpcode mirrors; nothing to check.');
    return;
  }

  const today = new Date();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  const findings = [];

  files.forEach((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    findings.push(...findStaleOffers(raw, f, today));
  });

  if (findings.length) {
    console.error('[stale-offer-guard] FAILED — a mirrored offer snippet is out of date.');
    findings.forEach((x) => console.error(' ', x));
    console.error('');
    console.error('These are reusable templates: publishing an offer page activates');
    console.error('whatever they currently hold. Update the snippet in WPCode, re-capture');
    console.error('it into live/wpcode/, or -- if the campaign is genuinely over and the');
    console.error('snippet is parked -- neutralise the date and tag so it cannot ship stale.');
    process.exit(1);
  }

  console.log(`[stale-offer-guard] OK (${files.length} mirrored snippets, no expired offers)`);
}

if (require.main === module) {
  main();
}

module.exports = { findStaleOffers };

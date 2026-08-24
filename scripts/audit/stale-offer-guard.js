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
 * What it checks, in live/wpcode (.js) AND Website/Pages (.html, recursive):
 *   1. `offer: "...-<month><day>"` tags whose date has passed
 *   2. Human-facing "through <Month> <day>" wording whose date has passed
 *
 * Why page HTML too (added 2026-08-19)
 * -----------------------------------
 * Scanning only live/wpcode/ was too narrow, and the gap was not theoretical.
 * /special-offer/ does not use a WPCode builder at all -- it INLINES its own
 * copy of the builder in the page HTML, and says so in a comment. That fourth
 * copy carried `offer: "summer-special-2026-jul31"` well into August, in the
 * one place this guard did not look. A guard that checks three of four copies
 * reads as "all clear" while the fourth ships stale.
 *
 * Deliberately NOT checked: campaigns/ -- see campaigns/README.md. A DELIVERED
 * email is allowed to say "through July 31"; it was true when it was sent, and
 * rewriting it would falsify the record. Only code that runs and page source
 * that ships can be stale. Findings nobody can act on are how a guard starts
 * getting ignored.
 *
 * Deliberately NOT checked: whether the snippet is enabled. An inert snippet
 * with a stale tag is still a launch hazard -- that is precisely the state it
 * sits in between campaigns, and the moment it goes live is the moment it is
 * too late to notice.
 */

const fs = require('fs');
const path = require('path');

const MIRROR_DIR_REL = path.join('live', 'wpcode');
const PAGES_DIR_REL = path.join('Website', 'Pages');

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

/**
 * `today` is injected so the guard is testable and deterministic.
 * Dates are compared at day granularity: an offer ending today has not expired.
 */
/**
 * HTML comments are not offers.
 *
 * Page source documents its own behaviour in comments -- Summer HTML.html has
 * "SECTION 5: EARLY BIRD (Date-Gated -- Shows through June 30)" and "Hide after
 * July 1". Those describe a gating rule; they are never rendered, and no visitor
 * or payload is affected by them. Flagging them produces a finding nobody can
 * act on, every run, forever.
 *
 * JS block comments are skipped for the same reason. Summer HTML.html documents
 * a date gate -- "Show through June 30, 2026. Hide after July 1" -- that
 * handleEarlyBirdVisibility() actually enforces. The comment is accurate, not
 * stale.
 *
 * What is left is what can actually reach someone: the `offer:` tag in the
 * payload, and wording assigned to a rendered string or attribute. Those are
 * the two signals this guard was built for, and neither is a comment.
 *
 * `//` line comments are deliberately NOT stripped -- every https:// URL in the
 * file would be mangled, which is worse than the noise it would remove.
 *
 * Replaced with equal-length blanks so byte offsets -- and therefore the
 * year-lookahead window -- are unchanged.
 */
function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
}
function findStaleOffers(source, fileLabel, today) {
  const findings = [];
  const currentYear = today.getFullYear();
  source = stripComments(source);

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
      findings.push({
        key: `${fileLabel}|tag|${fmt(end)}`,
        message:
          `${fileLabel}: offer tag "${tag}" names ${fmt(end)}, which has passed. ` +
          'Every signup would be filed under this campaign name.',
      });
    }
  }

  // 2. visitor-facing wording: "through July 31 at midnight"
  const textRe = /through\s+([A-Za-z]{3,9})\s+(\d{1,2})/g;
  while ((m = textRe.exec(source)) !== null) {
    const monthIdx = MONTHS[m[1].toLowerCase()];
    if (monthIdx === undefined) continue;
    // Look ahead for a year, but NOT one sitting inside a URL path.
    // Page HTML is full of /wp-content/uploads/2024/09/... , which made the
    // guard report a July 31 offer as expiring in 2024. Same date, wrong
    // year, and a finding nobody can act on is how a guard starts getting
    // ignored.
    const near = source
      .slice(m.index, m.index + 200)
      .replace(/\/20\d{2}\//g, '/');
    const ym = near.match(/(20\d{2})/);
    const year = ym ? Number(ym[1]) : currentYear;
    const end = expired(monthIdx, Number(m[2]), year);
    if (end) {
      findings.push({
        key: `${fileLabel}|wording|${monthIdx}-${m[2]}`,
        message:
          `${fileLabel}: offer wording "through ${m[1]} ${m[2]}" names ${fmt(end)}, which has passed.`,
      });
    }
  }

  // The same date usually appears several times in one file (header comment,
  // visitor wording, payload tag). Report each distinct problem once -- keyed
  // on the DATE, not the rendered sentence, so one wording cannot be reported
  // twice because two different years were inferred nearby.
  const seen = new Set();
  return findings.filter((f) => {
    if (seen.has(f.key)) return false;
    seen.add(f.key);
    return true;
  }).map((f) => f.message);
}

function isArchiveDir(dirName) {
  return dirName === 'Archive';
}

/** Every .html under Website/Pages, recursively, repo-relative. */
function collectPageFiles(repoRoot) {
  const root = path.join(repoRoot, PAGES_DIR_REL);
  if (!fs.existsSync(root)) return [];

  const out = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name)) // deterministic output
      .forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!isArchiveDir(entry.name)) walk(full);
        } else if (entry.name.toLowerCase().endsWith('.html')) out.push(full);
      });
  };
  walk(root);
  return out;
}

function collectCampaignOfferFiles(repoRoot) {
  const extras = [
    path.join(repoRoot, 'Website', 'Pages', 'Memberships (Category)', 'special-offer', 'membership builder JS-special-offer.js'),
    path.join(repoRoot, 'Components', 'Homepage', 'Homepage Campaign Banner.html'),
    path.join(repoRoot, 'Components', 'Shared', 'Global Special Offer Button.html'),
  ];
  return extras.filter((p) => fs.existsSync(p));
}

function collectMirrorFiles(repoRoot) {
  const dir = path.join(repoRoot, MIRROR_DIR_REL);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => path.join(dir, f));
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');

  const mirrors = collectMirrorFiles(repoRoot);
  const pages = collectPageFiles(repoRoot);
  const extras = collectCampaignOfferFiles(repoRoot);
  const files = [...mirrors, ...pages, ...extras];

  if (!files.length) {
    console.log('[stale-offer-guard] Nothing to check.');
    return;
  }

  const today = new Date();
  const findings = [];

  files.forEach((full) => {
    const raw = fs.readFileSync(full, 'utf8');
    const label = path.relative(repoRoot, full).split(path.sep).join('/');
    findings.push(...findStaleOffers(raw, label, today));
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

  console.log(
    `[stale-offer-guard] OK (${mirrors.length} mirrored snippets + ${pages.length} page files`
      + ` + ${extras.length} campaign files, no expired offers)`
  );
}

if (require.main === module) {
  main();
}

module.exports = { findStaleOffers, collectPageFiles, collectCampaignOfferFiles, stripComments };

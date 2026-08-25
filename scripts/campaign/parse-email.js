'use strict';

const { stripTags } = require('./html');
const {
  parseMonthName,
  pacificEndOfDayIso,
  endLabel,
  offerTag,
  campaignId,
  sanitizeSlug,
  isPastDate,
} = require('./dates');

const MONTH_RE = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';

function commentField(html, name) {
  const re = new RegExp(`${name}:\\s*([^\\n<]+)`, 'i');
  const m = String(html).match(re);
  return m ? m[1].trim() : null;
}

function firstMatch(html, re) {
  const m = String(html).match(re);
  return m ? m[1].trim() : null;
}

function unique(arr) {
  const seen = new Set();
  const out = [];
  arr.forEach((x) => {
    const k = JSON.stringify(x);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(x);
  });
  return out;
}

function extractCtas(html) {
  const out = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const hrefM = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefM) continue;
    const href = hrefM[1].trim();
    const label = stripTags(m[2]);
    const roleM = attrs.match(/\bdata-campaign-cta=["']([^"']+)["']/i);
    out.push({ href, label, role: roleM ? roleM[1] : null });
  }
  return out;
}

function extractHeadlineCell(html) {
  const re = /<td\b(?=[^>]*\bclass\s*=\s*(["'])([^"']*)\1)[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/\bheadline\b/i.test(m[2])) return m[3];
  }
  return firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
}

function extractDuesDiscounts(text) {
  const combo = String(text).match(
    /\$(\d+)\s+off\s+singles[,.\s]+\$(\d+)\s+off\s+couples[,.\s]+(?:and\s+)?\$(\d+)\s+off\s+family(?:\s+monthly\s+dues)?/i
  );
  const fromOff = combo
    ? { single: Number(combo[1]), couple: Number(combo[2]), family: Number(combo[3]) }
    : null;

  const fromStarting = {};
  const pairs = [
    ['single', /Singles:\s*\$(\d+)\s*\/\s*mo\s*\(normally\s*\$(\d+)\)/i],
    ['couple', /Couples:\s*\$(\d+)\s*\/\s*mo\s*\(normally\s*\$(\d+)\)/i],
    ['family', /Families:\s*(?:from\s*)?\$(\d+)\s*\/\s*mo\s*\(normally\s*\$(\d+)\)/i],
  ];
  pairs.forEach(([key, re]) => {
    const m = String(text).match(re);
    if (m) fromStarting[key] = Number(m[2]) - Number(m[1]);
  });
  const starting = Object.keys(fromStarting).length === 3 ? fromStarting : null;

  return { fromOff, fromStarting: starting };
}

function duesDiscountPerk(d) {
  if (!d) return null;
  if (d.single === d.couple && d.couple === d.family) {
    return `$${d.single} off monthly dues`;
  }
  return `$${d.single} / $${d.couple} / $${d.family} off monthly dues`;
}

function extractHeroImage(html) {
  const slot = html.match(/data-campaign-image-slot=["']hero["'][\s\S]{0,800}?<img\b([^>]*)>/i);
  const attrs = slot ? slot[1] : null;
  const fallback = !attrs && html.match(/<img\b([^>]*southendclub\.com\/wp-content\/uploads[^>]*)>/i);
  const used = attrs || (fallback && fallback[1]);
  if (!used) return null;
  const srcM = used.match(/\bsrc=["']([^"']+)["']/i);
  const altM = used.match(/\balt="([^"]*)"/i) || used.match(/\balt='([^']*)'/i);
  if (!srcM) return null;
  const src = srcM[1];
  if (/logo/i.test(src) && !slot) return null;
  return { src, alt: altM ? altM[1] : '' };
}

function extractDates(text) {
  const re = new RegExp(`\\b(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(20\\d{2}))?\\b`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const month = parseMonthName(m[1]);
    if (!month) continue;
    out.push({
      month,
      day: Number(m[2]),
      year: m[3] ? Number(m[3]) : null,
      raw: m[0],
    });
  }
  return unique(out);
}

function extractEnrollment(text) {
  const out = [];
  const re = /\$(\d{2,4})\s+enrollment/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(Number(m[1]));
  }
  return unique(out);
}

function extractGuestPasses(text) {
  const out = [];
  const re = /(\d+)\s+guest\s+passes/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(Number(m[1]));
  }
  return unique(out);
}

function guessYear(date, today) {
  if (date.year) return date.year;
  const y = today.getFullYear();
  if (!isPastDate(y, date.month, date.day, today)) return y;
  return y + 1;
}

function pickJoinCta(ctas) {
  const tagged = ctas.find((c) => c.role === 'join');
  if (tagged) return tagged;
  return ctas.find((c) => /special-offer/i.test(c.href)) || null;
}

function pickTourCta(ctas) {
  const tagged = ctas.find((c) => c.role === 'tour');
  if (tagged) return tagged;
  return ctas.find((c) => /schedule-a-tour/i.test(c.href)) || null;
}

function parseEmail(html, opts = {}) {
  const today = opts.today || new Date();
  const slugOpt = opts.slug ? sanitizeSlug(opts.slug) : null;
  const text = stripTags(html);
  const subject = commentField(html, 'SUBJECT') || firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const preheader = commentField(html, 'PREHEADER')
    || firstMatch(html, /mso-hide:all[^>]*>([\s\S]*?)<\/div>/i);
  const headline = extractHeadlineCell(html) || subject;
  const headlineText = headline ? stripTags(headline).replace(/<br\s*\/?>/gi, '\n') : null;
  const headlineClean = headlineText ? headlineText.replace(/\s+/g, ' ').trim() : null;
  const headlineMultiline = headline
    ? stripTags(String(headline).replace(/<br\s*\/?>/gi, '\n')).replace(/[ \t]+\n/g, '\n').trim()
    : null;

  const eyebrow = firstMatch(html, /letter-spacing:0\.06em[\s\S]*?>([\s\S]*?)<\/td>/i);
  const eyebrowText = eyebrow ? stripTags(eyebrow) : null;

  const enrollments = extractEnrollment(text);
  const guestPasses = extractGuestPasses(text);
  const dates = extractDates(text);
  const ctas = extractCtas(html);
  const joinCta = pickJoinCta(ctas);
  const tourCta = pickTourCta(ctas);
  const image = extractHeroImage(html);

  const ambiguities = [];
  const evidence = {};

  function field(name, value, ev, confidence) {
    evidence[name] = { value, evidence: ev, confidence };
    if (confidence === 'ambiguous') {
      ambiguities.push({ field: name, message: ev, candidates: value });
    }
    return value;
  }

  let enrollment = null;
  if (enrollments.length === 1) {
    enrollment = field('enrollment', enrollments[0], `Matched "$N enrollment"`, 'high');
  } else if (enrollments.length > 1) {
    field('enrollment', enrollments, `Multiple enrollment amounts: ${enrollments.join(', ')}`, 'ambiguous');
  } else {
    field('enrollment', null, 'No "$N enrollment" phrase found', 'missing');
    ambiguities.push({ field: 'enrollment', message: 'No "$N enrollment" phrase found', candidates: [] });
  }

  let guestPassCount = null;
  if (guestPasses.length === 1) {
    guestPassCount = field('guestPasses', guestPasses[0], 'Matched "N guest passes"', 'high');
  } else if (guestPasses.length > 1) {
    field('guestPasses', guestPasses, `Multiple guest-pass counts: ${guestPasses.join(', ')}`, 'ambiguous');
  } else {
    field('guestPasses', null, 'No guest-pass count found (optional)', 'optional');
  }

  let duesDiscount = null;
  const duesFound = extractDuesDiscounts(text);
  if (duesFound.fromOff && duesFound.fromStarting) {
    const a = duesFound.fromOff;
    const b = duesFound.fromStarting;
    if (a.single === b.single && a.couple === b.couple && a.family === b.family) {
      duesDiscount = field('duesDiscount', a, 'Matched "$N off singles/couples/family" (agrees with starting monthly)', 'high');
    } else {
      field(
        'duesDiscount',
        [a, b],
        `Dues "$N off" (${a.single}/${a.couple}/${a.family}) disagrees with starting monthly (${b.single}/${b.couple}/${b.family})`,
        'ambiguous'
      );
    }
  } else if (duesFound.fromOff) {
    duesDiscount = field('duesDiscount', duesFound.fromOff, 'Matched "$N off singles/couples/family"', 'high');
  } else if (duesFound.fromStarting) {
    duesDiscount = field('duesDiscount', duesFound.fromStarting, 'Derived from starting monthly vs normally', 'high');
  } else if (/lower monthly dues/i.test(text)) {
    field('duesDiscount', null, 'Email mentions lower monthly dues but no $N off singles/couples/family amounts were found', 'missing');
    ambiguities.push({
      field: 'duesDiscount',
      message: 'Email mentions lower monthly dues but no $N off singles/couples/family amounts were found',
      candidates: [],
    });
  } else {
    field('duesDiscount', null, 'No monthly dues discount (optional)', 'optional');
  }

  let end = null;
  const dated = dates.filter((d, i, arr) => arr.findIndex((x) => x.month === d.month && x.day === d.day && x.year === d.year) === i);
  const uniqueDay = unique(dated.map((d) => ({ month: d.month, day: d.day, year: d.year })));
  if (uniqueDay.length === 1) {
    const d = uniqueDay[0];
    const year = guessYear(d, today);
    end = field('endDate', { year, month: d.month, day: d.day }, `Matched "${d.year || ''} ${d.month}/${d.day}"`.trim(), 'high');
  } else if (uniqueDay.length > 1) {
    field('endDate', uniqueDay, `Multiple dates found: ${dates.map((d) => d.raw).join(', ')}`, 'ambiguous');
  } else {
    field('endDate', null, 'No month+day offer end date found', 'missing');
    ambiguities.push({ field: 'endDate', message: 'No month+day offer end date found', candidates: [] });
  }

  if (!joinCta) {
    ambiguities.push({
      field: 'primaryCta',
      message: 'No Join /special-offer/ CTA found',
      candidates: ctas.map((c) => c.href),
    });
  }

  const slug = slugOpt || sanitizeSlug(headlineClean || subject || 'special') || 'special';
  const year = end ? end.year : today.getFullYear();
  const month = end ? end.month : today.getMonth() + 1;
  const day = end ? end.day : null;
  const id = campaignId(year, month, slug);

  const perks = [];
  if (enrollment != null) perks.push(`$${enrollment} enrollment`);
  const duesPerk = duesDiscountPerk(duesDiscount);
  if (duesPerk) perks.push(duesPerk);
  if (guestPassCount != null) perks.push(`${guestPassCount} guest passes`);
  if (end) perks.push(`Ends ${endLabel(end.year, end.month, end.day)}`);

  const limitedTimeText = end
    ? `through ${endLabel(end.year, end.month, end.day)} at midnight`
      + (guestPassCount != null ? ` · ${guestPassCount} guest passes included` : '')
      + (duesDiscount ? ' · lower monthly dues' : '')
    : null;

  return {
    schemaVersion: 1,
    status: 'draft',
    profile: 'membership-special-offer',
    id,
    slug,
    offerTag: end ? offerTag(slug, end.year, end.month, end.day) : null,
    headline: headlineMultiline || headlineClean,
    eyebrow: eyebrowText,
    subject,
    preheader: preheader ? stripTags(preheader) : null,
    enrollment,
    guestPasses: guestPassCount,
    duesDiscount,
    endDatePacific: end ? `${end.year}-${String(end.month).padStart(2, '0')}-${String(end.day).padStart(2, '0')}T23:59:59` : null,
    endDateISO: end ? pacificEndOfDayIso(end.year, end.month, end.day) : null,
    endLabel: end ? endLabel(end.year, end.month, end.day) : null,
    endParts: end,
    limitedTimeText,
    perks,
    primaryCta: joinCta
      ? { label: joinCta.label || 'Join Now', href: joinCta.href }
      : { label: 'Join Now', href: 'https://southendclub.com/special-offer/' },
    secondaryCta: tourCta
      ? { label: tourCta.label || 'Schedule a Tour', href: tourCta.href }
      : { label: 'Schedule a Tour', href: 'https://southendclub.com/schedule-a-tour/' },
    heroImage: image || {
      src: 'https://southendclub.com/wp-content/uploads/2024/09/Pool5.jpg',
      alt: 'South End Club pool and facilities in Torrance',
    },
    preset: 'south-end-premium',
    tone: 'urgency',
    yoast: {
      title: headlineClean
        ? `${headlineClean.replace(/\n/g, ' ')} | South End Club`
        : 'Special Offer | South End Club',
      description: (preheader && stripTags(preheader)) || null,
    },
    extracted: evidence,
    ambiguities,
    approvedAt: null,
  };
}

module.exports = { parseEmail, extractHeadlineCell, extractDuesDiscounts, duesDiscountPerk };

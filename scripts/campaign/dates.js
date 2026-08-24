'use strict';

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const dow = first.getUTCDay();
  const firstSunday = 1 + ((7 - dow) % 7);
  return firstSunday + (n - 1) * 7;
}

/** US Pacific DST: 2nd Sunday in March 02:00 → 1st Sunday in November 02:00. */
function inUsPacificDst(year, month, day) {
  const start = nthSunday(year, 3, 2);
  const end = nthSunday(year, 11, 1);
  const ymd = year * 10000 + month * 100 + day;
  const startYmd = year * 10000 + 3 * 100 + start;
  const endYmd = year * 10000 + 11 * 100 + end;
  return ymd >= startYmd && ymd < endYmd;
}

function pacificEndOfDayIso(year, month, day) {
  const offset = inUsPacificDst(year, month, day) ? '-07:00' : '-08:00';
  const local = `${year}-${pad(month)}-${pad(day)}T23:59:59${offset}`;
  return new Date(local).toISOString();
}

function parseMonthName(name) {
  if (!name) return null;
  const idx = MONTHS[String(name).toLowerCase()];
  return idx || null;
}

function endLabel(year, month, day) {
  return `${MONTH_FULL[month - 1]} ${day}`;
}

function endLabelNbsp(year, month, day) {
  return `${MONTH_FULL[month - 1]}&nbsp;${day}`;
}

function offerTag(slug, year, month, day) {
  return `${slug}-${year}-${MONTH_ABBR[month - 1]}${day}`;
}

function parseOfferTagDate(tag) {
  const dm = String(tag).match(/(?:^|[-_])([a-z]{3,9})(\d{1,2})(?:$|[-_])/i);
  if (!dm) return null;
  const month = parseMonthName(dm[1]);
  if (!month) return null;
  const ym = String(tag).match(/(20\d{2})/);
  const year = ym ? Number(ym[1]) : null;
  return { year, month, day: Number(dm[2]) };
}

function ymdToday(today) {
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

function isPastDate(year, month, day, today) {
  const t = ymdToday(today);
  const a = year * 10000 + month * 100 + day;
  const b = t.year * 10000 + t.month * 100 + t.day;
  return a < b;
}

function campaignId(year, month, slug) {
  return `${year}-${pad(month)}-${slug}`;
}

function sanitizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function archiveLabel(parts) {
  return parts
    .filter(Boolean)
    .map((p) => sanitizeSlug(p))
    .join('-')
    .replace(/-+/g, '-');
}

module.exports = {
  MONTHS,
  MONTH_ABBR,
  MONTH_FULL,
  pad,
  pacificEndOfDayIso,
  parseMonthName,
  endLabel,
  endLabelNbsp,
  offerTag,
  parseOfferTagDate,
  isPastDate,
  campaignId,
  sanitizeSlug,
  archiveLabel,
};

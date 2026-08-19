#!/usr/bin/env node
/**
 * Add the tour_booked dataLayer push to the homepage inline booking widget.
 *
 * The block is COPIED, not invented: it is the one already running on
 * live/wpcode/8309-floating-book-tour-button.html, inside the
 * `if(res.ok && res.data.success)` branch. Three properties of that block
 * matter and are preserved verbatim:
 *
 *   - it sits inside the success branch, so a failed booking never fires
 *     a conversion;
 *   - it is wrapped in try/catch, so tracking can never break the booking
 *     confirmation the visitor sees;
 *   - tour_booking_id reads appointment_id || id || null.
 *
 * tour_source_page comes from payload.source_page, which the widget already
 * sends, so the homepage identifies itself with no extra work.
 *
 * Idempotent: re-running is a no-op. CRLF is preserved because the target is
 * a paste-in mirror and a line-ending flip would show as a whole-file diff.
 *
 *   node patches/se-bk-inline-tracking/apply-tour-booked-push.js [--verify]
 *
 * --verify exits 1 if the push is absent, 0 if present. Nothing is written.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', '..', 'live', 'thrive', 'pages', 'index', 'se-bk-inline.html');
const ANCHOR = '      if(res.ok && res.data.success){\r\n';

const BLOCK = [
  '        /* --- GA4 / Google Ads conversion \u2014 added 2026-08-19, see handoffs/capture-and-track-se-bk-inline.md --- */',
  '        try {',
  '          window.dataLayer = window.dataLayer || [];',
  '          window.dataLayer.push({',
  "            event: 'tour_booked',",
  '            tour_booking_id: res.data.appointment_id || res.data.id || null,',
  '            tour_is_reschedule: !!res.data.appointment_rescheduled,',
  '            tour_date: payload.preferred_date || null,',
  '            tour_time: payload.preferred_time || null,',
  '            tour_heard_about: payload.how_heard || null,',
  '            tour_source_page: payload.source_page || null,',
  '            tour_device: payload.device_type || null,',
  '            tour_utm_source: payload.utm_source || null,',
  '            tour_utm_medium: payload.utm_medium || null,',
  '            tour_utm_campaign: payload.utm_campaign || null',
  '          });',
  '        } catch(e) { /* never let tracking break the booking confirmation */ }',
  '        /* --- end conversion tracking --- */',
  '',
].join('\r\n');

const verify = process.argv.includes('--verify');
const src = fs.readFileSync(TARGET, 'utf8');
const already = src.includes("event: 'tour_booked'");

if (verify) {
  console.log(already ? 'tour_booked push: PRESENT' : 'tour_booked push: ABSENT');
  process.exit(already ? 0 : 1);
}

if (already) {
  console.log('No change needed - the push is already there.');
  process.exit(0);
}

const hits = src.split(ANCHOR).length - 1;
if (hits !== 1) {
  console.error(`Expected exactly 1 success branch, found ${hits}. Refusing to guess.`);
  process.exit(2);
}

fs.writeFileSync(TARGET, src.replace(ANCHOR, ANCHOR + BLOCK), 'utf8');
console.log('Added the tour_booked push inside the success branch.');

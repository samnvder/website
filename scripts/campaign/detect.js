'use strict';

const STRONG = new Set([
  'subject-comment',
  'preheader-comment',
  'data-campaign',
  'mso',
  'enrollment',
  'special-offer-url',
]);

function detectCampaignIntent(text) {
  const t = String(text || '');
  const signals = [];
  const tests = [
    ['offer', /\b(special[\s-]?offer|membership (offer|special|promo|campaign)|new offer|this (offer|campaign|email))\b/i],
    ['campaign', /\b(campaign|promo|blast)\b/i],
    ['enrollment', /\benrollment\b/i],
    ['lock-in', /\block in\b/i],
    ['apply', /\b(apply|launch|use this|go ahead)\b/i],
  ];
  tests.forEach(([name, re]) => {
    if (re.test(t)) signals.push(name);
  });
  return { ok: signals.length > 0, signals };
}

function detectCampaignPaste(raw) {
  const html = String(raw || '');
  const reasons = [];
  const signals = [];

  if (html.trim().length < 80) {
    return { ok: false, signals, reasons: ['paste too short'], score: 0 };
  }

  if (!/<[a-z!/][\s\S]*>/i.test(html)) {
    return { ok: false, signals, reasons: ['not HTML'], score: 0 };
  }

  if (
    /\bid=["']membershipBuilder["']/i.test(html)
    || /CAMPAIGN:PROMO:START/.test(html)
    || /\bid=["']se-campaign-promo["']/i.test(html)
  ) {
    return {
      ok: false,
      signals: ['landing-page'],
      reasons: ['looks like /special-offer/ page source, not an email'],
      score: 0,
    };
  }

  const add = (name, cond) => {
    if (cond) signals.push(name);
  };

  add('subject-comment', /SUBJECT:\s*\S+/i.test(html));
  add('preheader-comment', /PREHEADER:\s*\S+/i.test(html));
  add('data-campaign', /data-campaign-(cta|type|design|image-slot)/i.test(html));
  add('mso', /mso-hide/i.test(html));
  add('enrollment', /\$\d{2,4}\s+enrollment/i.test(html));
  add('special-offer-url', /southendclub\.com\/special-offer\//i.test(html));
  add('guest-passes', /\d+\s+guest\s+passes/i.test(html));
  add('presentation-table', /role=["']presentation["']/i.test(html));
  add('lock-in', /lock in/i.test(html));

  const score = signals.reduce((n, s) => n + (STRONG.has(s) ? 2 : 1), 0);
  if (score < 3) {
    reasons.push('not enough offer-email signals (need $N enrollment, /special-offer/, or email markup)');
  }

  return { ok: score >= 3, signals, reasons, score };
}

module.exports = { detectCampaignPaste, detectCampaignIntent, STRONG };

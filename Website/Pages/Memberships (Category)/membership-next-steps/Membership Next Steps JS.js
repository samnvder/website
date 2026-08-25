/* Membership next-steps page JS — paste into a new WPCode snippet
 * (site-wide footer). This file is the source; do not generate a copy.
 * WHY WPCode and not inline in the HTML: WordPress content filters
 * entity-encode stray ampersands on output (&& becomes &#038;&#038;),
 * which is a syntax error. WPCode injects raw. Discovered 2026-08-20.
 * Each IIFE no-ops unless #se-mn-page exists on the page. */

/* Membership next-steps personalization.
   Reads sessionStorage key "seMembershipRequest":
     { "firstName": "Sam",
       "membershipType": "family",
       "tier": "1",
       "offer": "end-of-summer-2026-sep1",
       "membership_source": "special_offer",
       "membership_page": "/special-offer/" }
   Written by the site-wide fetch wrapper on a successful
   create-signature-request. Every field is optional; anything missing
   or malformed leaves the generic page as-is. All injection is via
   textContent — never innerHTML. No name/email/phone in dataLayer. */
(function(){
  'use strict';
  if (!document.getElementById('se-mn-page')) return;

  var data = null;
  try { data = JSON.parse(sessionStorage.getItem('seMembershipRequest') || 'null'); } catch (e) { data = null; }
  if (!data || typeof data !== 'object') return;

  var firstName = null;
  if (typeof data.firstName === 'string') {
    var fn = data.firstName.trim();
    if (/^[A-Za-zÀ-ɏ' -]{1,30}$/.test(fn)) firstName = fn;
  }

  function setSentences(el, sentences){
    el.textContent = '';
    for (var s = 0; s < sentences.length; s++) {
      if (s > 0) el.appendChild(document.createTextNode(' '));
      var sp = document.createElement('span');
      sp.className = 'se-mn-sent';
      sp.textContent = sentences[s];
      el.appendChild(sp);
    }
  }

  if (firstName) {
    var title = document.getElementById('se-mn-hero-title');
    title.textContent = '';
    var nameSpan = document.createElement('span');
    nameSpan.textContent = firstName;
    title.appendChild(nameSpan);
    title.appendChild(document.createTextNode(', your membership form is on its way'));
  }

  var type = (typeof data.membershipType === 'string') ? data.membershipType.trim().toLowerCase() : '';
  var tier = (typeof data.tier === 'string') ? data.tier.trim() : '';
  var typeLabel = ({ single: 'Single', couple: 'Couple', family: 'Family' })[type] || '';
  var plan = document.getElementById('se-mn-plan');
  if (plan && typeLabel && /^[123]$/.test(tier)) {
    plan.textContent = typeLabel + ' · Tier ' + tier;
    plan.style.display = 'inline-block';
  }

  if (firstName) {
    var after = document.getElementById('se-mn-after-lead');
    if (after) {
      setSentences(after, [
        firstName + ', as soon as you fill it out and submit, expect a confirmation shortly after.',
        'That email is your confirmation you are becoming a member of the fastest-growing health and family-oriented spot in the South Bay.'
      ]);
    }
  }

  /* Destination event: same URL for every joiner, so source has to travel
     as a parameter. Direct visits (no storage) never reach this push. */
  try {
    var src = (typeof data.membership_source === 'string') ? data.membership_source : '';
    if (src !== 'special_offer' && src !== 'memberships' && src !== 'other') src = 'unknown';
    var page = (typeof data.membership_page === 'string' && data.membership_page.charAt(0) === '/') ? data.membership_page.slice(0, 120) : null;
    var offerTag = (typeof data.offer === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(data.offer)) ? data.offer : null;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'membership_next_steps',
      membership_source: src,
      membership_page: page,
      membership_offer: offerTag,
      membership_type: type || null,
      membership_tier: /^[123]$/.test(tier) ? tier : null
    });
  } catch (e) { /* never let tracking break the page */ }
})();

/* "Message Us" → the site-wide Message Us modal (WPCode 8292). Falls
   back to the phone dialer if the snippet isn't on the page. */
(function(){
  'use strict';
  if (!document.getElementById('se-mn-page')) return;
  var btn = document.getElementById('se-mn-question-btn');
  if (!btn) return;
  btn.addEventListener('click', function(){
    var crm = document.getElementById('se-crm-btn');
    if (crm) { crm.click(); }
    else { window.location.href = 'tel:+13105300630'; }
  });
})();

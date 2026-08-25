/* Membership next-steps redirect — WPCode snippet (site-wide footer).
 *
 * Phase 2 of handoffs/build-membership-next-steps.md. Implemented
 * WITHOUT editing the membership builders: #9926, #7315, #7966 and the
 * inlined special-offer builder all POST to the same Heroku URL
 * /create-signature-request, so this wraps window.fetch and reacts to a
 * successful signature request from any of them. On success it hands
 * the first name to /membership-next-steps/ via sessionStorage (never
 * URL parameters) and redirects after 3 seconds so the builders' native
 * alert(), GA4 membership_requested push, and /notify-admin get out
 * first. alert() blocks the main thread, so the timer completes after
 * the visitor dismisses it.
 *
 * Source insight (join vs special-offer): writes membership_source into
 * sessionStorage and pushes membership_application (NOT membership_requested
 * — that would double-count the existing #9926 conversion). Special-offer
 * currently has no membership_requested push; this event is how GA4 sees
 * those clicks. No name, email, or phone ever goes to dataLayer.
 *
 * Removing this snippet reverts the site to the alert-only step —
 * the builders are untouched.
 */
(function(){
  'use strict';
  if (window.__seMembershipRedirectInstalled) return;
  window.__seMembershipRedirectInstalled = true;

  function firstNameFrom(name){
    var full = String(name || '').trim();
    if (!full) return '';
    return full.split(/\s+/)[0] || '';
  }

  function safePath(p){
    var s = String(p || '');
    var q = s.indexOf('?');
    if (q !== -1) s = s.slice(0, q);
    var h = s.indexOf('#');
    if (h !== -1) s = s.slice(0, h);
    if (s.charAt(0) !== '/') return '/';
    return s.slice(0, 120);
  }

  function sourceFromPath(p){
    var s = String(p || '').toLowerCase();
    if (s.indexOf('/special-offer') !== -1) return 'special_offer';
    if (s.indexOf('/memberships') !== -1) return 'memberships';
    return 'other';
  }

  function safeOffer(tag){
    var t = String(tag || '').trim();
    if (/^[a-z0-9][a-z0-9-]{0,79}$/i.test(t)) return t;
    return '';
  }

  function money(v){
    var n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, ''));
    return n || null;
  }

  function track(payload, source, page, offer){
    try {
      window.dataLayer = window.dataLayer || [];
      /* Sticky keys first so #9926's later membership_requested can pick
         them up once GTM maps membership_source on that tag. */
      window.dataLayer.push({
        membership_source: source,
        membership_page: page,
        membership_offer: offer || null
      });
      window.dataLayer.push({
        event: 'membership_application',
        membership_source: source,
        membership_page: page,
        membership_offer: offer || null,
        membership_type: payload.membershipType ? String(payload.membershipType) : null,
        membership_tier: payload.tier ? String(payload.tier) : null,
        membership_children: Number(payload.numberOfChildren) || 0,
        membership_enrollment_fee: money(payload.enrollmentFee),
        membership_monthly_due: money(payload.monthlyDue)
      });
    } catch (e) { /* never let tracking break the redirect */ }
  }

  function go(payload){
    var page = safePath((window.location && window.location.pathname) || '/');
    var source = sourceFromPath(page);
    var offer = safeOffer(payload && payload.offer);
    try {
      var type = payload.membershipType ? String(payload.membershipType) : '';
      var tier = payload.tier ? String(payload.tier) : '';
      sessionStorage.setItem('seMembershipRequest', JSON.stringify({
        firstName: firstNameFrom(payload.Name),
        membershipType: type,
        tier: tier,
        offer: offer,
        membership_source: source,
        membership_page: page
      }));
    } catch (e) { /* storage blocked: the page falls back to generic */ }
    track(payload || {}, source, page, offer);
    setTimeout(function(){ window.location.href = '/membership-next-steps/'; }, 3000);
  }
  window.__seMembershipRedirect = go; /* manual test hook — safe, no signature request */

  var origFetch = window.fetch;
  if (!origFetch) return;
  window.fetch = function(input, init){
    var url = (typeof input === 'string') ? input : ((input && input.url) || '');
    var isSign = url.indexOf('create-signature-request') !== -1;
    var payload = null;
    if (isSign && init && typeof init.body === 'string') {
      try { payload = JSON.parse(init.body); } catch (e) { payload = null; }
    }
    var p = origFetch.apply(this, arguments);
    if (isSign && payload) {
      p.then(function(res){
        if (!res || !res.ok) return;
        res.clone().json().then(function(d){
          if (d && !d.error) go(payload);
        }).catch(function(){});
      }).catch(function(){});
    }
    return p;
  };
})();

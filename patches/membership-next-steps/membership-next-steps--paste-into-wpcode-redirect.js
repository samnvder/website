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

  function go(payload){
    try {
      var type = payload.membershipType ? String(payload.membershipType) : '';
      var tier = payload.tier ? String(payload.tier) : '';
      var offer = payload.offer ? String(payload.offer) : '';
      sessionStorage.setItem('seMembershipRequest', JSON.stringify({
        firstName: firstNameFrom(payload.Name),
        membershipType: type,
        tier: tier,
        offer: offer
      }));
    } catch (e) { /* storage blocked: the page falls back to generic */ }
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

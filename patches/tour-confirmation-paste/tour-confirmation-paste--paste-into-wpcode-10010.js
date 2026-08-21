/* Tour-confirmation redirect — WPCode snippet (site-wide footer).
 *
 * Phase 2 of handoffs/build-tour-confirmation-page.md, implemented
 * WITHOUT editing the booking widgets: both se-bk-inline and se-cal
 * book through the same /functions/v1/book-tour endpoint, so this
 * wraps window.fetch and reacts to a successful booking from either
 * widget on any page. On success it hands the booking details to
 * /tour-confirmation/ via sessionStorage (never URL parameters) and
 * redirects after a short delay so the widgets' GA4 dataLayer push
 * and follow-up contact upsert get out first.
 *
 * Removing this snippet reverts the site to the inline success step —
 * the widgets are untouched.
 */
(function(){
  'use strict';
  if (window.__seTourRedirectInstalled) return;
  window.__seTourRedirectInstalled = true;

  /* The widgets submit CRM-facing interest names; the confirmation
     page matches on the visitor-facing checkbox values. */
  var CRM_TO_INTEREST = { "Kid's Club": 'Childcare' };

  function go(payload){
    try {
      var interests = [];
      if (payload.interests) {
        var parts = String(payload.interests).split(',');
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i].trim();
          if (p) interests.push(CRM_TO_INTEREST[p] || p);
        }
      }
      sessionStorage.setItem('seTourBooking', JSON.stringify({
        firstName: payload.first_name || '',
        tourDate: payload.preferred_date || '',
        tourTime: payload.preferred_time || '',
        interests: interests
      }));
    } catch (e) { /* storage blocked: the page falls back to generic */ }
    setTimeout(function(){ window.location.href = '/tour-confirmation/'; }, 1200);
  }
  window.__seTourRedirect = go; /* manual test hook — safe, no booking */

  var origFetch = window.fetch;
  if (!origFetch) return;
  window.fetch = function(input, init){
    var url = (typeof input === 'string') ? input : ((input && input.url) || '');
    var isBooking = url.indexOf('/functions/v1/book-tour') !== -1;
    var payload = null;
    if (isBooking && init && typeof init.body === 'string') {
      try { payload = JSON.parse(init.body); } catch (e) { payload = null; }
    }
    var p = origFetch.apply(this, arguments);
    if (isBooking && payload) {
      p.then(function(res){
        if (!res || !res.ok) return;
        res.clone().json().then(function(d){
          if (d && d.success) go(payload);
        }).catch(function(){});
      }).catch(function(){});
    }
    return p;
  };
})();

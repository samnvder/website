/**
 * Open Play — testing-mode cache gating.
 *
 * When active (see isTest below), sets window.SE_OPENPLAY_TESTING, injects
 * no-store meta hints, and for ?se_test=1 performs a one-time redirect that
 * adds se_cb= to the URL so the HTML document is fetched with a unique key.
 *
 * Production (no mirror path, no se_test=1, no localhost+opt-in): no-op.
 */
(function (global) {
  function isMirrorPath() {
    var p = global.location.pathname || '';
    return p.indexOf('/local-page') !== -1 || p.indexOf('testing/local-page') !== -1;
  }

  function isSeTestQuery() {
    return /(?:^|[?&])se_test=1(?:&|$)/.test(global.location.search || '');
  }

  function isLocalHost() {
    var h = global.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  }

  function localStorageOptIn() {
    try {
      return global.localStorage.getItem('se_openplay_test') === '1';
    } catch (e) {
      return false;
    }
  }

  var mirror = isMirrorPath();
  var seTest = isSeTestQuery();
  var isTest = seTest || mirror || (isLocalHost() && localStorageOptIn());

  if (!isTest) return;

  global.SE_OPENPLAY_TESTING = true;

  if (seTest && !/(?:^|[?&])se_cb=/.test(global.location.search || '')) {
    try {
      var u = new URL(global.location.href);
      u.searchParams.set('se_cb', String(Date.now()));
      global.location.replace(u.toString());
      return;
    } catch (e) {}
  }

  function injectMeta() {
    var head = document.head;
    if (!head) return;
    var pairs = [
      ['Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0'],
      ['Pragma', 'no-cache'],
      ['Expires', '0'],
    ];
    for (var i = 0; i < pairs.length; i++) {
      var m = document.createElement('meta');
      m.setAttribute('http-equiv', pairs[i][0]);
      m.setAttribute('content', pairs[i][1]);
      head.appendChild(m);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMeta);
  } else {
    injectMeta();
  }
})(typeof window !== 'undefined' ? window : this);

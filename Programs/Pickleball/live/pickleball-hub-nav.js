/**
 * Canonical Pickleball hub primary nav (Hub, League Play, Advanced Open Play, Message Board).
 * Deployed with Firebase Hosting public root (live/). Pages mount via <nav data-se-hub-nav>.
 */
(function () {
  var openPlayAccessState = 'pending';
  var authWatchStarted = false;

  function isHostedOpenPlaySite() {
    try {
      var h =
        typeof location !== 'undefined' && location.hostname
          ? String(location.hostname).toLowerCase()
          : '';
      return h.indexOf('web.app') !== -1 || h.indexOf('firebaseapp.com') !== -1;
    } catch (e) {
      return false;
    }
  }

  function detectContext() {
    var path = (typeof location !== 'undefined' && location.pathname ? location.pathname : '').replace(
      /\\/g,
      '/'
    );
    var parts = path.split('/').filter(Boolean);
    var idx = parts.lastIndexOf('league-play');
    if (idx === -1) {
      return isHostedOpenPlaySite() ? 'hosted-root' : 'openplay-root';
    }
    var prev = parts[idx - 1] || '';
    if (prev === 'staging') return 'openplay-league-staging';
    if (prev === 'live') return 'openplay-league-live';
    if (prev === 'local-page') return 'openplay-league-local';
    if (isHostedOpenPlaySite() && idx === 0) return 'hosted-league';
    return 'central-league';
  }

  function pathsFor(ctx) {
    if (ctx === 'hosted-root') {
      return {
        hub: '/hub',
        openplay: '/open-play/account',
        board: '/message-board',
        league: '/league-play',
      };
    }
    if (ctx === 'hosted-league') {
      return {
        hub: '/hub',
        openplay: '/open-play/account',
        board: '/message-board',
        league: '/league-play',
      };
    }
    if (ctx === 'openplay-league-staging') {
      // Same as openplay-league-live: file-based paths (staging/ mirrors live/ layout).
      // /hub and /account only exist on Firebase Hosting with rewrites; not on local static servers.
      return {
        hub: '../SouthEnd_Pickleball_Hub.html',
        openplay: '../SouthEnd_OpenPlay_Account.html',
        board: '../SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Overview.html',
      };
    }
    if (ctx === 'openplay-league-local') {
      return {
        hub: '../SouthEnd_Pickleball_Hub.html',
        openplay: '../SouthEnd_OpenPlay_Account.html',
        board: '../SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Overview.html',
      };
    }
    if (ctx === 'openplay-league-live') {
      return {
        hub: '../SouthEnd_Pickleball_Hub.html',
        openplay: '../SouthEnd_OpenPlay_Account.html',
        board: '../SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Overview.html',
      };
    }
    if (ctx === 'central-league') {
      var c = '../live/';
      return {
        hub: c + 'SouthEnd_Pickleball_Hub.html',
        openplay: c + 'SouthEnd_OpenPlay_Account.html',
        board: c + 'SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Overview.html',
      };
    }
    return {
      hub: 'SouthEnd_Pickleball_Hub.html',
      openplay: 'SouthEnd_OpenPlay_Account.html',
      board: 'SouthEnd_Message_Board.html',
      league: 'league-play/SouthEnd_League_Overview.html',
    };
  }

  function detectActive() {
    var path = (typeof location !== 'undefined' && location.pathname ? location.pathname : '')
      .replace(/\\/g, '/');
    if (!path || path === '/') return '';
    if (/^\/(hub|main)(\/|$)/i.test(path)) return 'hub';
    if (/^\/(open-play|account|signup|rsvp|advanced-open-play)(\/|$)/i.test(path)) return 'openplay';
    if (/^\/message-board(\/|$)/i.test(path)) return 'board';
    if (/^\/league-play(\/|$)/i.test(path)) return 'league';
    if (/^\/admin(\/|$)/i.test(path)) return 'admin';
    // Fallback for file:// local dev
    var name = path.split('/').filter(Boolean).pop() || '';
    name = (name.split('?')[0] || '').trim();
    if (/^SouthEnd_Pickleball_Hub\.html$/i.test(name)) return 'hub';
    if (/^SouthEnd_OpenPlay_Account\.html$/i.test(name)) return 'openplay';
    if (/^SouthEnd_Message_Board\.html$/i.test(name)) return 'board';
    if (/^SouthEnd_League_/i.test(name)) return 'league';
    if (/^SouthEnd_Admin_/i.test(name)) return 'admin';
    return '';
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function link(href, label, activeKey, key) {
    var isActive = activeKey === key;
    var cls = 'se-site-nav-link' + (isActive ? ' se-site-nav-link--active' : '');
    if (key === 'hub') cls += ' se-site-nav-link--hub';
    var attrs = 'class="' + cls + '" href="' + esc(href) + '"';
    if (isActive) attrs += ' aria-current="page"';
    return '<a ' + attrs + '>' + esc(label) + '</a>';
  }

  function buildCore(ctx, active, options) {
    options = options || {};
    var hideBoard = !!options.hideBoard;
    var p = pathsFor(ctx);
    var order = [
      ['hub', p.hub, 'Hub'],
      ['league', p.league, 'League Play'],
      ['openplay', p.openplay, 'Advanced Open Play'],
      ['board', p.board, 'Message Board'],
    ];
    return order
      .filter(function (row) {
        if (hideBoard && row[0] === 'board') return false;
        return row[0] !== 'openplay' || openPlayAccessState === 'allowed';
      })
      .map(function (row) {
        return link(row[1], row[2], active, row[0]);
      })
      .join('');
  }

  function setOpenPlayAccessState(state) {
    if (openPlayAccessState === state) return;
    openPlayAccessState = state;
    run();
  }

  function watchOpenPlayAccess() {
    if (authWatchStarted) return;
    if (typeof window === 'undefined' || !window.SEOpenPlay) return;
    var SE = window.SEOpenPlay;
    if (!SE.firebaseConfigured || !SE.firebaseConfigured() || !SE.initFirebase || !SE.onAuthStateChanged) {
      setOpenPlayAccessState('denied');
      authWatchStarted = true;
      return;
    }
    authWatchStarted = true;
    SE.initFirebase()
      .then(function () {
        SE.onAuthStateChanged(function (user) {
          if (!user || !SE.hasModuleAccess) {
            setOpenPlayAccessState('denied');
            return;
          }
          SE.hasModuleAccess(user.uid, SE.MODULE_ADVANCED_OPEN_PLAY || 'advanced_open_play')
            .then(function (allowed) {
              setOpenPlayAccessState(allowed ? 'allowed' : 'denied');
            })
            .catch(function () {
              setOpenPlayAccessState('denied');
            });
        });
      })
      .catch(function () {
        setOpenPlayAccessState('denied');
      });
  }

  function scheduleAccessWatch() {
    watchOpenPlayAccess();
    setTimeout(watchOpenPlayAccess, 0);
    setTimeout(watchOpenPlayAccess, 150);
    setTimeout(watchOpenPlayAccess, 500);
  }

  function run() {
    if (!document.getElementById('se-hub-nav-hub-styles')) {
      var s = document.createElement('style');
      s.id = 'se-hub-nav-hub-styles';
      s.textContent =
        '.se-site-nav-link--hub{font-weight:600;}' +
        'a.se-site-nav-link--admin{order:999;margin-left:auto;padding:10px 18px;border-radius:999px;font-weight:700;letter-spacing:.12em;}' +
        'a.se-site-nav-link--admin.se-site-nav-link--active,' +
        'a.se-site-nav-link--admin[aria-current="page"]{color:#0a0a1a;}';
      document.head.appendChild(s);
    }
    document.querySelectorAll('nav[data-se-hub-nav]').forEach(function (nav) {
      var ctxAttr = nav.getAttribute('data-se-hub-ctx');
      var ctx = ctxAttr || detectContext();
      var activeAttr = nav.getAttribute('data-se-hub-active');
      var active = activeAttr || detectActive();
      var hideBoard =
        nav.getAttribute('data-se-hide-message-board') === '1' ||
        nav.getAttribute('data-se-hide-message-board') === 'true';
      var tails = [];
      Array.prototype.slice.call(nav.querySelectorAll('[data-se-hub-tail]')).forEach(function (node) {
        tails.push(node);
        node.remove();
      });
      var hasAdminTail = tails.some(function (n) {
        var href = n.getAttribute('href') || '';
        return (
          n.id === 'admin-hub-nav-link' ||
          n.id === 'league-admin-nav-link' ||
          (n.hasAttribute('data-se-hub-tail') && /SouthEnd_Admin/i.test(href))
        );
      });
      if (!hasAdminTail) {
        var adminLink = document.createElement('a');
        adminLink.id = 'admin-hub-nav-link';
        adminLink.setAttribute('data-se-hub-tail', '');
        adminLink.className = 'se-site-nav-link se-site-nav-link--admin hidden';
        adminLink.href = '/admin';
        adminLink.textContent = 'Admin';
        tails.push(adminLink);
      }
      nav.innerHTML = buildCore(ctx, active, { hideBoard: hideBoard });
      tails.forEach(function (node) {
        nav.appendChild(node);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      run();
      scheduleAccessWatch();
    });
  } else {
    run();
    scheduleAccessWatch();
  }
})();

/**
 * Canonical Pickleball hub primary nav (League Play, Hub, Advanced Open Play, Message Board).
 * Deployed with Firebase Hosting public root (live/). Pages mount via <nav data-se-hub-nav>.
 */
(function () {
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
    if (isHostedOpenPlaySite() && idx === 0) return 'hosted-league';
    return 'central-league';
  }

  function pathsFor(ctx) {
    if (ctx === 'hosted-root') {
      return {
        hub: '/hub',
        openplay: '/account',
        board: '/message-board',
        league: '/league-play',
      };
    }
    if (ctx === 'hosted-league') {
      return {
        hub: '/hub',
        openplay: '/account',
        board: '/message-board',
        league: 'SouthEnd_League_Play_Hub.html',
      };
    }
    if (ctx === 'openplay-league-staging') {
      return {
        hub: '/hub',
        openplay: '/account',
        board: '../SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Play_Hub.html',
      };
    }
    if (ctx === 'openplay-league-live') {
      var st = '../advanced-open-play/staging/';
      return {
        hub: st + 'SouthEnd_Pickleball_Hub.html',
        openplay: st + 'SouthEnd_OpenPlay_Account.html',
        board: st + 'SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Play_Hub.html',
      };
    }
    if (ctx === 'central-league') {
      var c = '../advanced-open-play/staging/';
      return {
        hub: c + 'SouthEnd_Pickleball_Hub.html',
        openplay: c + 'SouthEnd_OpenPlay_Account.html',
        board: c + 'SouthEnd_Message_Board.html',
        league: 'SouthEnd_League_Play_Hub.html',
      };
    }
    return {
      hub: 'SouthEnd_Pickleball_Hub.html',
      openplay: 'SouthEnd_OpenPlay_Account.html',
      board: 'SouthEnd_Message_Board.html',
      league: '../../league-play/SouthEnd_League_Play_Hub.html',
    };
  }

  function detectActive() {
    var seg = (typeof location !== 'undefined' && location.pathname ? location.pathname : '')
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean);
    var name = seg.length ? seg[seg.length - 1] : '';
    name = (name.split('?')[0] || '').trim();
    if (!name) {
      if (seg.indexOf('hub') !== -1 || seg.indexOf('main') !== -1) return 'hub';
      if (seg.indexOf('account') !== -1 || seg.indexOf('advanced-open-play') !== -1) return 'openplay';
      if (seg.indexOf('message-board') !== -1) return 'board';
      if (seg.indexOf('league-play') !== -1) return 'league';
      return '';
    }
    if (/^hub$/i.test(name) || /^main$/i.test(name)) return 'hub';
    if (/^account$/i.test(name) || /^signup$/i.test(name) || /^advanced-open-play$/i.test(name)) return 'openplay';
    if (/^message-board$/i.test(name)) return 'board';
    if (/^league-play$/i.test(name)) return 'league';
    if (/^SouthEnd_Pickleball_Hub\.html$/i.test(name)) return 'hub';
    if (/^SouthEnd_OpenPlay_Account\.html$/i.test(name)) return 'openplay';
    if (/^SouthEnd_Message_Board\.html$/i.test(name)) return 'board';
    if (/^SouthEnd_League_Play_Hub\.html$/i.test(name)) return 'league';
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
    var attrs = 'class="' + cls + '" href="' + esc(href) + '"';
    if (isActive) attrs += ' aria-current="page"';
    return '<a ' + attrs + '>' + esc(label) + '</a>';
  }

  function buildCore(ctx, active) {
    var p = pathsFor(ctx);
    var order = [
      ['league', p.league, 'League Play'],
      ['hub', p.hub, 'Hub'],
      ['openplay', p.openplay, 'Advanced Open Play'],
      ['board', p.board, 'Message Board'],
    ];
    return order
      .map(function (row) {
        return link(row[1], row[2], active, row[0]);
      })
      .join('');
  }

  function run() {
    document.querySelectorAll('nav[data-se-hub-nav]').forEach(function (nav) {
      var ctxAttr = nav.getAttribute('data-se-hub-ctx');
      var ctx = ctxAttr || detectContext();
      var activeAttr = nav.getAttribute('data-se-hub-active');
      var active = activeAttr || detectActive();
      var tails = [];
      Array.prototype.slice.call(nav.querySelectorAll('[data-se-hub-tail]')).forEach(function (node) {
        tails.push(node);
        node.remove();
      });
      nav.innerHTML = buildCore(ctx, active);
      tails.forEach(function (node) {
        nav.appendChild(node);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

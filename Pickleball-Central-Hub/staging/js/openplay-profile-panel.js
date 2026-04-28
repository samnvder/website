/**
 * South End Open Play — header profile button + menu.
 * Replaces the old floating profile bubble.
 */
(function (global) {
  var NS = 'se-openplay-profile';
  var injected = false;
  var anchorEl = null;
  var btnEl = null;
  var adminQuickEl = null;
  var menuEl = null;
  var statusEl = null;
  var modalEl = null;
  var modalBodyEl = null;
  var currentUser = null;
  var currentProfile = null;
  var currentIsAdmin = false;
  var currentAdminScope = {};
  var notifyBtnEl = null;
  var notifyBadgeEl = null;
  var notificationPanelEl = null;
  var notificationRows = [];
  var notificationRef = null;
  var notificationListener = null;
  var ADMIN_MODULES = [
    {
      moduleKey: 'league_play',
      label: 'League Play',
      parentHref: 'SouthEnd_Admin_Hub.html',
      submodules: [
        { action: 'league-teams', href: 'SouthEnd_Admin_League_Play.html#team-management', label: 'League teams', subModuleKey: 'team_management' },
        { action: 'league-scores', href: 'SouthEnd_Admin_League_Play.html#schedule-scores', label: 'League schedule & scores', subModuleKey: 'schedule_scores' }
      ]
    },
    {
      moduleKey: 'open_play',
      label: 'Advanced Open Play',
      parentHref: 'SouthEnd_Admin_Hub.html',
      submodules: [
        { action: 'signups', href: 'SouthEnd_Open_Play_Signups.html', label: 'Signups', subModuleKey: 'signups' },
        { action: 'checkin', href: 'SouthEnd_Session_Checkin.html', label: 'Check-ins', subModuleKey: 'checkins' },
        { action: 'activity', href: 'SouthEnd_Admin_Activity.html', label: 'Activity', subModuleKey: 'activity' }
      ]
    }
  ];

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function pageFileName() {
    try {
      var seg = (global.location.pathname || '').split('/').filter(Boolean).pop();
      return seg || '';
    } catch (e) {
      return '';
    }
  }

  function isAdminPage() {
    try {
      var path = String((global.location && global.location.pathname) || '').replace(/\\/g, '/').toLowerCase();
      if (/^\/admin(\/|$)/.test(path)) return true;
    } catch (e) {}
    return /^SouthEnd_(?:Admin_(?:Hub|Activity|Module_Access|League_Play|User_Management)|Open_Play_Signups)\.html$/i.test(pageFileName());
  }

  function isLocalPreviewHost() {
    try {
      var host = String((global.location && global.location.hostname) || '').toLowerCase();
      return host === '127.0.0.1' || host === 'localhost' || host === '::1';
    } catch (e) {
      return false;
    }
  }

  function localHtmlRoutes(path) {
    var prefix = '';
    if (path.indexOf('/testing/local-page/league-play/') !== -1 || /^\/league-play\//i.test(path)) {
      prefix = '../';
    } else if (
      path.indexOf('/advanced-open-play/staging/league-play/') !== -1 ||
      path.indexOf('/advanced-open-play/live/league-play/') !== -1
    ) {
      // Same-folder parent as main pickleball-hub-nav (file paths, not Firebase /hub)
      prefix = '../';
    } else if (path.indexOf('/advanced-open-play/staging/') !== -1 || path.indexOf('/advanced-open-play/live/') !== -1) {
      prefix = '';
    } else if (path.indexOf('/Programs/Pickleball/live/') !== -1) {
      prefix = '/Programs/Pickleball/live/';
    } else if (path.indexOf('/testing/local-page/') === -1 && !/^\/(?:SouthEnd_|index\.html|$)/i.test(path)) {
      prefix = '/Programs/Pickleball/advanced-open-play/testing/local-page/';
    }
    return {
      SouthEnd_Admin_Hub: prefix + 'SouthEnd_Admin_Hub.html',
      SouthEnd_Admin_Activity: prefix + 'SouthEnd_Admin_Activity.html',
      SouthEnd_Admin_Advanced_Open_Play: prefix + 'SouthEnd_Admin_Advanced_Open_Play.html',
      SouthEnd_Admin_League_Play: prefix + 'SouthEnd_Admin_League_Play.html',
      SouthEnd_Admin_Module_Access: prefix + 'SouthEnd_Admin_Module_Access.html',
      SouthEnd_Admin_User_Management: prefix + 'SouthEnd_Admin_User_Management.html',
      SouthEnd_Open_Play_Signups: prefix + 'SouthEnd_Open_Play_Signups.html',
      SouthEnd_Session_Checkin: prefix + 'SouthEnd_Session_Checkin.html',
      SouthEnd_OpenPlay_Account: prefix + 'SouthEnd_OpenPlay_Account.html',
      SouthEnd_Pickleball_Hub: prefix + 'SouthEnd_Pickleball_Hub.html',
    };
  }

  function appendModuleQuery(href, moduleKey) {
    var base = String(href || '');
    var mod = String(moduleKey || '').trim();
    if (!mod) return base;
    var hash = '';
    var hashIdx = base.indexOf('#');
    if (hashIdx >= 0) {
      hash = base.slice(hashIdx);
      base = base.slice(0, hashIdx);
    }
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    return base + sep + 'module=' + encodeURIComponent(mod) + hash;
  }

  function inferModuleContextFromPath() {
    var path = String((global.location && global.location.pathname) || '').toLowerCase();
    if (path.indexOf('/league-play/') !== -1 || /southend_admin_league_play\.html$/.test(path)) return 'league_play';
    if (path.indexOf('/admin/') !== -1 || path === '/admin' || /southend_admin_(?:hub|module_access|user_management)\.html$/.test(path)) {
      return 'platform';
    }
    if (
      /southend_(?:open_play_signups|session_checkin|admin_activity|admin_advanced_open_play|session_rsvp|pickleball_hub|message_board)\.html$/.test(path)
      || /southend_openplay_account\.html$/.test(path)
      || path.indexOf('/hub') !== -1
      || path.indexOf('/open-play') !== -1
      || path.indexOf('/account') !== -1
    ) {
      return 'open_play';
    }
    return '';
  }

  function currentAdminContextModule() {
    try {
      var raw = String((global.location && global.location.search) || '');
      var q = new URLSearchParams(raw);
      var m = String(q.get('module') || '').trim();
      if (m) return m;
    } catch (e) {}
    return inferModuleContextFromPath();
  }

  function adminHubHrefForContext() {
    return appendModuleQuery(liveHref('SouthEnd_Admin_Hub.html'), currentAdminContextModule());
  }

  function hasScopedAdminAccess(moduleKey, subModuleKey) {
    var SE = global.SEOpenPlay;
    if (!moduleKey || !subModuleKey) return true;
    if (SE && typeof SE.isAdminScopeEnabled === 'function') {
      return SE.isAdminScopeEnabled(currentAdminScope, moduleKey, subModuleKey);
    }
    return !!(currentAdminScope && currentAdminScope[moduleKey] && currentAdminScope[moduleKey][subModuleKey] === true);
  }

  function allowedAdminModules() {
    return ADMIN_MODULES.map(function (mod) {
      var children = (mod.submodules || []).filter(function (sub) {
        return hasScopedAdminAccess(mod.moduleKey, sub.subModuleKey);
      });
      return {
        moduleKey: mod.moduleKey,
        label: mod.label,
        parentHref: mod.parentHref,
        submodules: children
      };
    }).filter(function (mod) {
      return mod.submodules.length > 0;
    });
  }

  function renderAdminMenuItems() {
    if (!anchorEl) return;
    var toggle = anchorEl.querySelector('[data-action="admin-toggle"]');
    var sub = anchorEl.querySelector('[data-role="admin-submenu"]');
    if (!toggle || !sub) return;
    var modules = allowedAdminModules();
    sub.innerHTML = modules.map(function (mod) {
      var parentHref = appendModuleQuery(liveHref(mod.parentHref || 'SouthEnd_Admin_Hub.html'), mod.moduleKey);
      var childHtml = mod.submodules.map(function (item) {
        var href = appendModuleQuery(liveHref(item.href), mod.moduleKey);
        return '<a class="' + NS + '-menu-item ' + NS + '-admin-sub-item" data-action="' + item.action + '" href="' + href + '">' + item.label + '</a>';
      }).join('');
      return (
        '<div class="' + NS + '-admin-module">' +
          '<a class="' + NS + '-menu-item ' + NS + '-admin-module-head" href="' + parentHref + '">' + mod.label + '</a>' +
          '<div class="' + NS + '-admin-module-sub">' + childHtml + '</div>' +
        '</div>'
      );
    }).join('');
    toggle.classList.toggle('hidden', modules.length === 0);
    sub.classList.toggle('hidden', modules.length === 0);
    toggle.disabled = modules.length === 0;
    if (modules.length === 0) {
      toggle.setAttribute('aria-expanded', 'false');
      sub.classList.remove('open');
    }
  }

  function liveHref(href) {
    var raw = String(href || '').trim();
    var path = String((global.location && global.location.pathname) || '').replace(/\\/g, '/');
    var isLocal = isLocalPreviewHost() || path.indexOf('/testing/local-page/') !== -1;
    if (!isLocal && /^\/[^/]/.test(raw)) return raw;
    var hashIdx0 = raw.indexOf('#');
    var pathPart = hashIdx0 >= 0 ? raw.slice(0, hashIdx0) : raw;
    var hashPart = hashIdx0 >= 0 ? raw.slice(hashIdx0) : '';
    var key = pathPart.replace(/\.html(?:\?.*)?$/i, '');
    if (isLocal) {
      var localRoutes = localHtmlRoutes(path);
      var resolvedLocal = localRoutes[key] || pathPart;
      if (!hashPart) return resolvedLocal;
      var baseLocal = resolvedLocal.split('#')[0];
      return baseLocal + hashPart;
    }
    var routes = {
      SouthEnd_Admin_Hub: '/admin?v=20260427-admin-hub',
      SouthEnd_Admin_Activity: '/admin/activity',
      SouthEnd_Admin_Advanced_Open_Play: '/admin/open-play',
      SouthEnd_Admin_League_Play: '/admin/league-play',
      SouthEnd_Admin_Module_Access: '/admin/module-access',
      SouthEnd_Admin_User_Management: '/admin/user-management',
      SouthEnd_Open_Play_Signups: '/signups',
      SouthEnd_Session_Checkin: '/checkin',
      SouthEnd_OpenPlay_Account: '/open-play/account',
      SouthEnd_Pickleball_Hub: '/hub',
      'league-play/SouthEnd_League_Teams': '/league-play/register',
      'league-play/SouthEnd_League_Overview': '/league-play',
      'league-play/SouthEnd_League_Schedule': '/league-play/schedule',
      'league-play/SouthEnd_League_Standings': '/league-play/standings',
      'league-play/SouthEnd_League_Payment': '/league-play/payment',
    };
    if (routes[key]) {
      var base = routes[key].split('#')[0];
      return base + hashPart;
    }
    return '/' + String(href || '').replace(/^\/+/, '');
  }

  function normalizeLegacyLiveUrl(rawHref) {
    if (!rawHref) return '';
    var path = String((global.location && global.location.pathname) || '').replace(/\\/g, '/');
    if (path.indexOf('/testing/') !== -1 || path.indexOf('/staging/') !== -1) return '';
    var href = String(rawHref);
    if (/advanced-open-play\/(?:staging|live)\/SouthEnd_Pickleball_Hub\.html/i.test(href)) return '/hub';
    if (/advanced-open-play\/(?:staging|live)\/SouthEnd_OpenPlay_Account\.html/i.test(href)) {
      var query = href.indexOf('?') >= 0 ? href.slice(href.indexOf('?')) : '';
      return '/open-play/account' + query;
    }
    return '';
  }

  function ensureDom() {
    if (injected) return;
    injected = true;

    var style = document.createElement('style');
    style.id = NS + '-css';
    style.textContent =
      ':root{--pp-accent:var(--neon,#00ff88);--pp-bg:var(--navy-lt,#111e35);--pp-ink:var(--ink,#0a1628);}' +
      '.header{position:relative;z-index:10;overflow:visible!important;}' +
      'nav.se-site-nav{position:relative;z-index:1;}' +
      '.' + NS + '-anchor{display:none;align-items:center;gap:8px;z-index:500;}' +
      '.header.' + NS + '-header-host{--se-profile-action-lane:0px;}' +
      '.header > .' + NS + '-anchor{' +
      'position:absolute;right:18px;top:12px;}' +
      '.topbar-right > .' + NS + '-anchor{' +
      'position:relative;}' +
      '.' + NS + '-anchor.has-external-notify .' + NS + '-notify{display:none!important;}' +
      '.' + NS + '-notify{' +
      'position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:38px;min-height:38px;padding:7px;border-radius:8px;' +
      'background:rgba(255,255,255,.08);border:1.5px solid color-mix(in srgb,var(--pp-accent) 32%,transparent);color:#fff;cursor:pointer;text-decoration:none;' +
      '}' +
      '.' + NS + '-notify:hover{border-color:var(--pp-accent);background:color-mix(in srgb,var(--pp-accent) 12%,transparent);color:#fff;}' +
      '.' + NS + '-notify-icon{width:21px;height:21px;display:block;}' +
      '.' + NS + '-notify-badge{position:absolute;top:1px;right:-3px;min-width:18px;height:18px;padding:0 5px;display:inline-flex;align-items:center;justify-content:center;' +
      'font-family:Barlow,sans-serif;font-size:10px;font-weight:700;line-height:1;color:var(--pp-ink);background:var(--pp-accent);border-radius:99px;box-shadow:0 1px 4px rgba(0,0,0,.35);}' +
      '.' + NS + '-admin-quick{' +
      'display:none;align-items:center;justify-content:center;min-height:48px;padding:12px 24px;border-radius:999px;' +
      'background:var(--pp-accent);border:1.5px solid color-mix(in srgb,var(--pp-accent) 45%,transparent);color:var(--pp-ink);text-decoration:none;' +
      'font-family:Oswald,sans-serif;font-size:15px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;cursor:pointer;' +
      'box-shadow:0 0 18px color-mix(in srgb,var(--pp-accent) 22%,transparent);}' +
      '.' + NS + '-btn{' +
      'display:flex;align-items:center;gap:8px;min-height:38px;padding:7px 12px;border-radius:8px;' +
      'background:rgba(255,255,255,.08);border:1.5px solid color-mix(in srgb,var(--pp-accent) 32%,transparent);color:#fff;cursor:pointer;text-decoration:none;' +
      'font-family:Oswald,sans-serif;font-size:13px;letter-spacing:.4px;text-transform:uppercase;}' +
      '.' + NS + '-btn:hover{border-color:var(--pp-accent);background:color-mix(in srgb,var(--pp-accent) 12%,transparent);color:#fff;}' +
      '.' + NS + '-icon{width:20px;height:20px;display:block;}' +
      '.' + NS + '-label{white-space:nowrap;line-height:1;}' +
      '.' + NS + '-menu{' +
      'position:absolute;right:0;top:44px;z-index:20;width:260px;background:var(--pp-bg);border:1.5px solid color-mix(in srgb,var(--pp-accent) 35%,transparent);' +
      'border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:8px;display:none;}' +
      '.' + NS + '-menu.open{display:block;}' +
      '.' + NS + '-menu-head{padding:8px 10px 10px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:6px;}' +
      '.' + NS + '-menu-status{font-size:10px;color:rgba(255,255,255,.58);line-height:1.4;word-break:break-word;}' +
      'a.' + NS + '-menu-item,button.' + NS + '-menu-item,.' + NS + '-menu .' + NS + '-menu-item{' +
      'display:block;width:100%;text-align:left;padding:9px 10px;border:none;background:transparent;border-radius:7px;' +
      'font-family:Barlow,sans-serif;font-size:12px;color:rgba(255,255,255,.88)!important;cursor:pointer;text-decoration:none!important;}' +
      'a.' + NS + '-menu-item:hover,button.' + NS + '-menu-item:hover,.' + NS + '-menu .' + NS + '-menu-item:hover{background:color-mix(in srgb,var(--pp-accent) 11%,transparent);color:var(--pp-accent)!important;}' +
      '.' + NS + '-menu-item.staff{color:#d8b4fe!important;}' +
      '.' + NS + '-admin-toggle{position:relative;}' +
      '.' + NS + '-admin-toggle .chevron{display:inline-block;margin-left:auto;font-size:10px;transition:transform .2s ease;color:rgba(255,255,255,.45);}' +
      '.' + NS + '-admin-toggle[aria-expanded="true"] .chevron{transform:rotate(180deg);}' +
      '.' + NS + '-admin-sub{overflow:hidden;max-height:0;transition:max-height .25s ease;padding-left:10px;border-left:2px solid color-mix(in srgb,var(--pp-accent) 30%,transparent);}' +
      '.' + NS + '-admin-sub.open{max-height:520px;}' +
      '.' + NS + '-admin-sub .' + NS + '-menu-item{font-size:11px;padding:7px 10px;}' +
      '.' + NS + '-admin-module{padding:6px 0 4px;}' +
      '.' + NS + '-admin-module + .' + NS + '-admin-module{border-top:1px solid rgba(255,255,255,.08);}' +
      '.' + NS + '-admin-module-head{font-family:Oswald,sans-serif;letter-spacing:.06em;text-transform:uppercase;font-size:12px;color:var(--pp-accent)!important;}' +
      '.' + NS + '-admin-module-sub{padding-left:10px;display:flex;flex-direction:column;gap:2px;}' +
      '.' + NS + '-admin-sub-item{font-size:11px;color:rgba(255,255,255,.9)!important;}' +
      '.se-site-nav-link--admin{margin-left:auto;color:var(--pp-accent);border-color:color-mix(in srgb,var(--pp-accent) 22%,transparent);}' +
      'a.se-site-nav-link--admin.se-site-nav-link--active,' +
      'a.se-site-nav-link--admin[aria-current="page"]{color:var(--pp-ink);}' +
      '.se-site-nav-link--admin.hidden{display:none!important;}' +
      '.' + NS + '-modal{position:fixed;inset:0;z-index:850;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;padding:16px;}' +
      '.' + NS + '-modal.open{display:flex;}' +
      '.' + NS + '-card{max-width:420px;width:100%;max-height:85vh;overflow:auto;background:var(--pp-bg);border:2px solid color-mix(in srgb,var(--pp-accent) 35%,transparent);border-radius:12px;padding:18px;}' +
      '.' + NS + '-title{font-family:Oswald,sans-serif;font-size:18px;color:var(--pp-accent);text-transform:uppercase;margin-bottom:10px;}' +
      '.' + NS + '-close{background:transparent;border:none;color:rgba(255,255,255,.65);font-size:22px;cursor:pointer;position:absolute;right:16px;top:10px;}' +
      '.' + NS + '-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);}' +
      '.' + NS + '-lbl{font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;}' +
      '.' + NS + '-val{font-size:12px;color:#fff;text-align:right;word-break:break-word;}' +
      '.' + NS + '-field{margin-top:10px;}' +
      '.' + NS + '-field.hidden{display:none;}' +
      '.' + NS + '-field label{display:block;font-size:10px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;}' +
      '.' + NS + '-input,.' + NS + '-textarea,.' + NS + '-select{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:6px;color:#fff;font-size:13px;padding:9px 10px;font-family:Barlow,sans-serif;}' +
      '.' + NS + '-textarea{resize:vertical;min-height:72px;}' +
      '.' + NS + '-input:focus,.' + NS + '-textarea:focus,.' + NS + '-select:focus{outline:none;border-color:var(--pp-accent);}' +
      '.' + NS + '-select option{background:var(--pp-bg);color:#fff;}' +
      '.' + NS + '-actions{display:flex;justify-content:flex-end;margin-top:14px;}' +
      '.' + NS + '-save{background:var(--pp-accent);color:var(--pp-ink);border:none;border-radius:7px;padding:9px 12px;font-family:Oswald,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;}' +
      '.' + NS + '-save[disabled]{opacity:.6;cursor:not-allowed;}' +
      '.' + NS + '-msg{margin-top:10px;font-size:11px;min-height:16px;color:rgba(255,255,255,.72);}' +
      '.' + NS + '-msg.error{color:#ff8a8a;}' +
      '.' + NS + '-msg.ok{color:var(--pp-accent);}' +
      '.' + NS + '-notify-panel{position:fixed;inset:0;z-index:900;pointer-events:none;}' +
      '.' + NS + '-notify-panel-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.62);opacity:0;transition:opacity .2s ease;}' +
      '.' + NS + '-notify-panel-drawer{position:absolute;top:0;right:0;width:min(420px,100%);height:100%;display:flex;flex-direction:column;background:var(--cream,#fafaf5);border-left:1px solid rgba(0,0,0,.12);box-shadow:-12px 0 40px rgba(0,0,0,.28);transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);}' +
      '.' + NS + '-notify-panel.open{pointer-events:auto;}' +
      '.' + NS + '-notify-panel.open .' + NS + '-notify-panel-backdrop{opacity:1;}' +
      '.' + NS + '-notify-panel.open .' + NS + '-notify-panel-drawer{transform:translateX(0);}' +
      '.' + NS + '-notify-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:24px;background:var(--green-dk,var(--pp-bg));color:#fff;border-bottom:3px solid var(--gold,var(--pp-accent));}' +
      '.' + NS + '-notify-panel-head h2{margin:0 0 4px;font-family:Oswald,sans-serif;font-size:26px;text-transform:uppercase;letter-spacing:.08em;color:#fff;}' +
      '.' + NS + '-notify-panel-head p{margin:0;color:rgba(255,255,255,.72);font-size:13px;}' +
      '.' + NS + '-notify-panel-close{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid rgba(255,255,255,.35);border-radius:8px;background:rgba(0,0,0,.18);color:#fff;font-size:28px;line-height:1;cursor:pointer;}' +
      '.' + NS + '-notify-panel-body{display:flex;flex-direction:column;gap:16px;padding:24px;overflow-y:auto;}' +
      '.' + NS + '-notify-empty,.' + NS + '-notify-card{padding:16px;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:16px;color:var(--muted,#5a6357);box-shadow:0 4px 18px rgba(0,0,0,.06);}' +
      '.' + NS + '-notify-card{display:flex;flex-direction:column;gap:8px;}' +
      '.' + NS + '-notify-card h3{margin:0;color:var(--green-dk,var(--pp-ink));font-family:Oswald,sans-serif;font-size:20px;text-transform:uppercase;letter-spacing:.06em;}' +
      '.' + NS + '-notify-card p{margin:0;color:var(--muted,#5a6357);font-size:14px;}' +
      '.' + NS + '-notify-card-status{font-weight:700;color:var(--green,var(--pp-accent));}' +
      '.' + NS + '-notify-card-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}' +
      '.' + NS + '-notify-card-actions .btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 14px;border-radius:8px;border:1px solid var(--green,var(--pp-accent));background:var(--green,var(--pp-accent));color:#fff;text-decoration:none;font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;}' +
      '.' + NS + '-notify-card-actions .btn--secondary{background:#fff;color:var(--green,var(--pp-accent));}' +
      '@media(max-width:680px){' +
      '.header.' + NS + '-header-host{--se-profile-action-lane:60px;min-height:clamp(104px,28vw,132px);padding-top:calc(var(--se-profile-action-lane) + env(safe-area-inset-top,0px))!important;}' +
      '.header.' + NS + '-header-host > .' + NS + '-anchor{right:max(10px,env(safe-area-inset-right));top:10px;}' +
      '.' + NS + '-admin-quick,' + '.' + NS + '-admin-quick.is-visible{display:none!important;}' +
      '.' + NS + '-btn{min-height:34px;padding:6px 10px;font-size:12px;}' +
      '.' + NS + '-menu{width:240px;top:40px;}' +
      '}';
    document.head.appendChild(style);

    anchorEl = document.createElement('div');
    anchorEl.className = NS + '-anchor';
    anchorEl.innerHTML =
      '<button type="button" class="' + NS + '-admin-quick" aria-haspopup="menu" aria-expanded="false">Admin Modules</button>' +
      '<button type="button" class="' + NS + '-notify" aria-label="Notifications" aria-haspopup="dialog" aria-expanded="false">' +
      '<svg class="' + NS + '-notify-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20h4a2 2 0 0 1-4 0"/>' +
      '</svg><span class="' + NS + '-notify-badge" hidden aria-hidden="true"></span></button>' +
      '<button type="button" class="' + NS + '-btn" aria-expanded="false" aria-haspopup="menu">' +
      '<svg class="' + NS + '-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>' +
      '<path d="M5 20.5c.8-3.2 3.4-5.5 7-5.5s6.2 2.3 7 5.5" stroke-linecap="round"/>' +
      '</svg>' +
      '<span class="' + NS + '-label">Sign in</span>' +
      '</button>' +
      '<div class="' + NS + '-menu" role="menu">' +
      '<div class="' + NS + '-menu-head"><div class="' + NS + '-menu-status">Not signed in</div></div>' +
      '<a class="' + NS + '-menu-item" data-action="account" href="/hub">Pickleball Hub</a>' +
      '<button class="' + NS + '-menu-item" type="button" data-action="view">View profile</button>' +
      '<button class="' + NS + '-menu-item staff hidden ' + NS + '-admin-toggle" type="button" data-action="admin-toggle" aria-expanded="false" style="display:flex;align-items:center;">' +
      'Admin <span class="chevron">&#9662;</span></button>' +
      '<div class="' + NS + '-admin-sub staff hidden" data-role="admin-submenu"></div>' +
      '<div data-pickleball-share data-share-context="pickleball"></div>' +
      '<button class="' + NS + '-menu-item" type="button" data-action="signout">Sign out</button>' +
      '</div>';
    document.body.appendChild(anchorEl);

    btnEl = anchorEl.querySelector('.' + NS + '-btn');
    notifyBtnEl = anchorEl.querySelector('.' + NS + '-notify');
    notifyBadgeEl = anchorEl.querySelector('.' + NS + '-notify-badge');
    adminQuickEl = anchorEl.querySelector('.' + NS + '-admin-quick');
    menuEl = anchorEl.querySelector('.' + NS + '-menu');
    statusEl = anchorEl.querySelector('.' + NS + '-menu-status');

    if (notifyBtnEl) {
      notifyBtnEl.addEventListener('click', function (e) {
        e.preventDefault();
        openNotificationPanel();
      });
    }

    modalEl = document.createElement('div');
    modalEl.className = NS + '-modal';
    modalEl.innerHTML =
      '<div class="' + NS + '-card">' +
      '<button type="button" class="' + NS + '-close" aria-label="Close">&times;</button>' +
      '<div class="' + NS + '-title">Edit profile</div>' +
      '<div class="' + NS + '-body"></div>' +
      '</div>';
    modalBodyEl = modalEl.querySelector('.' + NS + '-body');
    document.body.appendChild(modalEl);

    btnEl.addEventListener('click', function () {
      if (!currentUser) {
        global.location.href = getSignInHref();
        return;
      }
      var open = menuEl.classList.toggle('open');
      btnEl.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (adminQuickEl) adminQuickEl.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    if (adminQuickEl) {
      adminQuickEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
          global.location.href = getSignInHref();
          return;
        }
        if (!currentIsAdmin) return;
        var open = !menuEl.classList.contains('open');
        menuEl.classList.toggle('open', open);
        btnEl.setAttribute('aria-expanded', open ? 'true' : 'false');
        adminQuickEl.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          var sub = anchorEl.querySelector('.' + NS + '-admin-sub');
          var toggle = anchorEl.querySelector('[data-action="admin-toggle"]');
          if (toggle && !toggle.classList.contains('hidden')) {
            toggle.setAttribute('aria-expanded', 'true');
            if (sub) sub.classList.add('open');
          }
        }
      });
    }

    anchorEl.querySelector('[data-action="view"]').addEventListener('click', function () {
      closeMenu();
      openProfileModal();
    });
    anchorEl.querySelector('[data-action="admin-toggle"]').addEventListener('click', function (e) {
      e.stopPropagation();
      var sub = anchorEl.querySelector('.' + NS + '-admin-sub');
      var expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (sub) sub.classList.toggle('open', !expanded);
    });
    anchorEl.querySelector('[data-action="signout"]').addEventListener('click', function () {
      closeMenu();
      var SE = global.SEOpenPlay;
      if (!SE || !SE.signOutUser) return;
      SE.signOutUser().then(function () {
        global.location.href = '/account';
      });
    });

    modalEl.querySelector('.' + NS + '-close').addEventListener('click', closeProfileModal);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeProfileModal();
    });
    document.addEventListener('click', function (e) {
      if (!anchorEl.contains(e.target)) closeMenu();
      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      var fixedHref = link ? normalizeLegacyLiveUrl(link.getAttribute('href')) : '';
      if (fixedHref) {
        e.preventDefault();
        global.location.href = fixedHref;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMenu();
        closeProfileModal();
        closeNotificationPanel();
      }
    });
  }

  function closeMenu() {
    if (!menuEl || !btnEl) return;
    menuEl.classList.remove('open');
    btnEl.setAttribute('aria-expanded', 'false');
    if (adminQuickEl) adminQuickEl.setAttribute('aria-expanded', 'false');
  }

  function closeProfileModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
  }

  function externalNotificationBells() {
    return Array.prototype.slice.call(document.querySelectorAll('.league-header-notify'));
  }

  function allNotificationBadges() {
    var badges = [];
    if (notifyBadgeEl) badges.push(notifyBadgeEl);
    return badges.concat(Array.prototype.slice.call(document.querySelectorAll('.league-header-notify__badge')));
  }

  function allNotificationButtons() {
    var buttons = [];
    if (notifyBtnEl) buttons.push(notifyBtnEl);
    return buttons.concat(externalNotificationBells());
  }

  function closeNotificationPanel() {
    if (!notificationPanelEl) return;
    notificationPanelEl.classList.remove('open');
    notificationPanelEl.setAttribute('aria-hidden', 'true');
    allNotificationButtons().forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function ensureNotificationPanel() {
    if (notificationPanelEl) return notificationPanelEl;
    notificationPanelEl = document.createElement('div');
    notificationPanelEl.className = NS + '-notify-panel';
    notificationPanelEl.setAttribute('aria-hidden', 'true');
    notificationPanelEl.innerHTML =
      '<div class="' + NS + '-notify-panel-backdrop" data-notification-close></div>' +
      '<aside class="' + NS + '-notify-panel-drawer" role="dialog" aria-modal="true" aria-labelledby="' + NS + '-notify-title">' +
      '<div class="' + NS + '-notify-panel-head">' +
      '<div><h2 id="' + NS + '-notify-title">Notifications</h2><p>Invites and pickleball updates from every module.</p></div>' +
      '<button type="button" class="' + NS + '-notify-panel-close" data-notification-close aria-label="Close notifications">&times;</button>' +
      '</div>' +
      '<div class="' + NS + '-notify-panel-body"></div>' +
      '</aside>';
    notificationPanelEl.addEventListener('click', function (e) {
      if (e.target && e.target.getAttribute('data-notification-close') !== null) {
        closeNotificationPanel();
      }
    });
    document.body.appendChild(notificationPanelEl);
    return notificationPanelEl;
  }

  function renderNotificationEmpty(text) {
    var panel = ensureNotificationPanel();
    var body = panel.querySelector('.' + NS + '-notify-panel-body');
    if (!body) return;
    body.innerHTML = '<p class="' + NS + '-notify-empty">' + escapeHtml(text) + '</p>';
  }

  function notificationActionHref(row) {
    var data = (row && row.data) || {};
    if (data.actionHref) return data.actionHref;
    if (data.type === 'league_team_invite' && data.sourceId) {
      return liveHref('league-play/SouthEnd_League_Teams.html') + '?invite=' + encodeURIComponent(data.sourceId);
    }
    return '';
  }

  function renderNotificationRows() {
    if (!currentUser) {
      renderNotificationEmpty('Sign in to see your notifications.');
      return;
    }
    var panel = ensureNotificationPanel();
    var body = panel.querySelector('.' + NS + '-notify-panel-body');
    if (!body) return;
    body.innerHTML = '';
    if (!notificationRows.length) {
      renderNotificationEmpty('No notifications yet.');
      return;
    }
    notificationRows.forEach(function (row) {
      var data = row.data || {};
      var card = document.createElement('article');
      card.className = NS + '-notify-card';
      var title = document.createElement('h3');
      title.textContent = data.title || (data.type === 'league_team_invite' ? 'Team roster invite' : 'Notification');
      var copy = document.createElement('p');
      copy.textContent = data.body || 'Open this update for details.';
      card.appendChild(title);
      card.appendChild(copy);
      if (data.state !== 'pending_action' || data.status !== 'pending') {
        var status = document.createElement('p');
        status.className = NS + '-notify-card-status';
        status.textContent = data.status === 'accepted'
          ? 'Accepted'
          : data.status === 'declined'
            ? 'Declined'
            : data.status === 'canceled'
              ? 'Canceled'
              : 'Resolved';
        card.appendChild(status);
      }
      var href = notificationActionHref(row);
      var actions = document.createElement('div');
      actions.className = NS + '-notify-card-actions';
      if (
        data.type === 'league_team_invite' &&
        data.state === 'pending_action' &&
        data.status === 'pending' &&
        global.LeagueSync &&
        typeof global.LeagueSync.acceptOrDeclineInvite === 'function'
      ) {
        var accept = document.createElement('button');
        accept.type = 'button';
        accept.className = 'btn';
        accept.textContent = 'Accept';
        var decline = document.createElement('button');
        decline.type = 'button';
        decline.className = 'btn btn--secondary';
        decline.textContent = 'Decline';
        function resolveInvite(yes) {
          accept.disabled = true;
          decline.disabled = true;
          global.LeagueSync.acceptOrDeclineInvite(data.sourceId || row.id, currentUser.uid, yes).catch(function (e) {
            accept.disabled = false;
            decline.disabled = false;
            copy.textContent = (e && e.message) || 'Could not update this invite.';
          });
        }
        accept.addEventListener('click', function () { resolveInvite(true); });
        decline.addEventListener('click', function () { resolveInvite(false); });
        actions.appendChild(accept);
        actions.appendChild(decline);
      } else if (href) {
        var open = document.createElement('a');
        open.className = 'btn btn--secondary';
        open.href = href;
        open.textContent = 'Open';
        actions.appendChild(open);
      }
      if (actions.children.length) card.appendChild(actions);
      body.appendChild(card);
    });
  }

  function openNotificationPanel() {
    ensureNotificationPanel();
    renderNotificationRows();
    notificationPanelEl.classList.add('open');
    notificationPanelEl.setAttribute('aria-hidden', 'false');
    allNotificationButtons().forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'true');
    });
    var closeBtn = notificationPanelEl.querySelector('.' + NS + '-notify-panel-close');
    if (closeBtn) closeBtn.focus();
  }

  function updateNotificationBadges(count) {
    allNotificationBadges().forEach(function (badge) {
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.removeAttribute('hidden');
        badge.setAttribute('aria-hidden', 'false');
      } else {
        badge.textContent = '';
        badge.setAttribute('hidden', '');
        badge.setAttribute('aria-hidden', 'true');
      }
    });
    allNotificationButtons().forEach(function (btn) {
      btn.setAttribute('aria-label', count > 0 ? 'Notifications, ' + count + ' pending' : 'Notifications');
    });
  }

  function wireExternalNotificationBells() {
    if (!anchorEl) return;
    var external = externalNotificationBells();
    anchorEl.classList.toggle('has-external-notify', external.length > 0);
    external.forEach(function (bell) {
      if (bell.getAttribute('data-global-notification-wired') === '1') return;
      bell.setAttribute('data-global-notification-wired', '1');
      bell.setAttribute('aria-haspopup', 'dialog');
      bell.setAttribute('aria-expanded', 'false');
      bell.addEventListener('click', function (e) {
        e.preventDefault();
        openNotificationPanel();
      });
    });
  }

  function clearNotificationSubscription() {
    if (notificationRef && notificationListener) {
      notificationRef.off('value', notificationListener);
    }
    notificationRef = null;
    notificationListener = null;
    notificationRows = [];
    updateNotificationBadges(0);
  }

  function subscribeNotifications(user) {
    var SE = global.SEOpenPlay;
    clearNotificationSubscription();
    if (!user || !user.uid || !SE || !SE.getFirebaseDb) return;
    var db = SE.getFirebaseDb();
    if (!db) return;
    notificationRef = db.ref('openplay_se/user_notifications/' + user.uid).orderByChild('createdAt').limitToLast(50);
    notificationListener = function (snap) {
      var rows = [];
      var pending = 0;
      snap.forEach(function (c) {
        var data = c.val();
        rows.push({ id: c.key, data: data });
        if (data && (data.state === 'pending_action' || data.state === 'unread')) pending += 1;
      });
      rows.sort(function (a, b) {
        return ((b.data && b.data.createdAt) || 0) - ((a.data && a.data.createdAt) || 0);
      });
      notificationRows = rows;
      updateNotificationBadges(pending);
      if (notificationPanelEl && notificationPanelEl.classList.contains('open')) renderNotificationRows();
    };
    notificationRef.on('value', notificationListener);
  }

  function profileValue(v) {
    if (v == null) return '';
    return String(v);
  }

  function optionHtml(value, label, current) {
    var sel = profileValue(current) === profileValue(value) ? ' selected' : '';
    return '<option value="' + escapeHtml(value) + '"' + sel + '>' + escapeHtml(label) + '</option>';
  }

  function setProfileModalMessage(text, kind) {
    if (!modalBodyEl) return;
    var msgEl = modalBodyEl.querySelector('[data-role="profile-msg"]');
    if (!msgEl) return;
    msgEl.className = NS + '-msg' + (kind ? ' ' + kind : '');
    msgEl.textContent = text || '';
  }

  function toggleMemberCardField(form) {
    if (!form) return;
    var membership = form.querySelector('[name="membership"]');
    var memberCardWrap = form.querySelector('[data-role="member-card-wrap"]');
    if (!membership || !memberCardWrap) return;
    var show = membership.value === 'yes';
    memberCardWrap.classList.toggle('hidden', !show);
    if (!show) {
      var cardInput = form.querySelector('[name="memberCard"]');
      if (cardInput) cardInput.value = '';
    }
  }

  function renderProfileEditor() {
    if (!currentUser || !modalBodyEl) return;
    var p = currentProfile || {};
    modalBodyEl.innerHTML =
      '<div class="' + NS + '-row"><span class="' + NS + '-lbl">Email</span><span class="' + NS + '-val">' + escapeHtml(currentUser.email || '—') + '</span></div>' +
      '<form data-role="profile-form">' +
      '<div class="' + NS + '-field"><label>First name</label><input class="' + NS + '-input" name="firstName" value="' + escapeHtml(profileValue(p.firstName)) + '" maxlength="80" required></div>' +
      '<div class="' + NS + '-field"><label>Last name</label><input class="' + NS + '-input" name="lastName" value="' + escapeHtml(profileValue(p.lastName)) + '" maxlength="80" required></div>' +
      '<div class="' + NS + '-field"><label>Phone</label><input class="' + NS + '-input" name="phone" value="' + escapeHtml(profileValue(p.phone)) + '" maxlength="40" required></div>' +
      '<div class="' + NS + '-field"><label>Skill</label><select class="' + NS + '-select" name="skill" required>' +
      optionHtml('', 'Select level...', p.skill) +
      optionHtml('2.0 Beginner', '2.0 (Beginner)', p.skill) +
      optionHtml('2.5 Upper Beginner', '2.5 (Upper Beginner)', p.skill) +
      optionHtml('3.0 Lower Intermediate', '3.0 (Lower Intermediate)', p.skill) +
      optionHtml('3.5 Intermediate', '3.5 (Intermediate)', p.skill) +
      optionHtml('4.0 Advanced', '4.0 (Advanced)', p.skill) +
      optionHtml('4.5 Upper Advanced', '4.5 (Upper Advanced)', p.skill) +
      optionHtml('5.0 Open', '5.0 (Open)', p.skill) +
      '</select></div>' +
      '<div class="' + NS + '-field"><label>South End member?</label><select class="' + NS + '-select" name="membership" required>' +
      optionHtml('', 'Select...', p.membership) +
      optionHtml('yes', 'Yes — Member', p.membership) +
      optionHtml('no', 'No — Guest', p.membership) +
      '</select></div>' +
      '<div class="' + NS + '-field' + (p.membership === 'yes' ? '' : ' hidden') + '" data-role="member-card-wrap"><label>Member card</label><input class="' + NS + '-input" name="memberCard" value="' + escapeHtml(profileValue(p.memberCard)) + '" maxlength="6" placeholder="e.g. 212345"></div>' +
      '<div class="' + NS + '-field"><label>How did you hear?</label><select class="' + NS + '-select" name="hear">' +
      optionHtml('', 'Select...', p.hear) +
      optionHtml('Friend / Word of mouth', 'Friend / Word of mouth', p.hear) +
      optionHtml('Social media', 'Social media', p.hear) +
      optionHtml('South End member', 'South End member', p.hear) +
      optionHtml('Google / Search', 'Google / Search', p.hear) +
      optionHtml('Walk-in / Drove by', 'Walk-in / Drove by', p.hear) +
      optionHtml('Event / Tournament', 'Event / Tournament', p.hear) +
      optionHtml('Other', 'Other', p.hear) +
      '</select></div>' +
      '<div class="' + NS + '-field"><label>Notes (optional)</label><textarea class="' + NS + '-textarea" name="notes" maxlength="500">' + escapeHtml(profileValue(p.notes)) + '</textarea></div>' +
      '<div class="' + NS + '-actions"><button type="submit" class="' + NS + '-save">Save changes</button></div>' +
      '<div class="' + NS + '-msg" data-role="profile-msg"></div>' +
      '</form>';

    var form = modalBodyEl.querySelector('[data-role="profile-form"]');
    if (!form) return;

    var membershipSelect = form.querySelector('[name="membership"]');
    if (membershipSelect) {
      membershipSelect.addEventListener('change', function () {
        toggleMemberCardField(form);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var SE = global.SEOpenPlay;
      if (!SE || !SE.saveUserProfilePatch || !currentUser) return;

      var firstName = profileValue(form.querySelector('[name="firstName"]').value).trim();
      var lastName = profileValue(form.querySelector('[name="lastName"]').value).trim();
      var phone = profileValue(form.querySelector('[name="phone"]').value).trim();
      var skill = profileValue(form.querySelector('[name="skill"]').value).trim();
      var membership = profileValue(form.querySelector('[name="membership"]').value).trim();
      var memberCard = profileValue(form.querySelector('[name="memberCard"]').value).trim();
      var hear = profileValue(form.querySelector('[name="hear"]').value).trim();
      var notes = profileValue(form.querySelector('[name="notes"]').value).trim();

      if (!firstName || !lastName || !phone || !skill || !membership) {
        setProfileModalMessage('Please complete all required fields.', 'error');
        return;
      }
      if (membership === 'yes' && !/^[23][0-9]{5}$/.test(memberCard)) {
        setProfileModalMessage('Invalid Membership/Access Card #', 'error');
        return;
      }
      if (membership !== 'yes') memberCard = '';

      var patch = {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        skill: skill,
        membership: membership,
        memberCard: memberCard,
        hear: hear,
        notes: notes,
      };

      var saveBtn = form.querySelector('.' + NS + '-save');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }
      setProfileModalMessage('', '');

      SE.saveUserProfilePatch(currentUser.uid, patch)
        .then(function () {
          if (SE.loadUserProfile) {
            return SE.loadUserProfile(currentUser.uid).then(function (nextProfile) {
              currentProfile = nextProfile || patch;
            });
          }
          currentProfile = Object.assign({}, currentProfile || {}, patch);
        })
        .then(function () {
          refreshMenuStatus();
          setProfileModalMessage('Saved successfully.', 'ok');
        })
        .catch(function () {
          setProfileModalMessage('Could not save profile. Please try again.', 'error');
        })
        .finally(function () {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save changes';
          }
        });
    });
  }

  function openProfileModal() {
    if (!currentUser || !modalEl || !modalBodyEl) return;
    renderProfileEditor();
    modalEl.classList.add('open');
  }

  function getStaticLeagueLink() {
    return document.querySelector('.league-header-profile');
  }

  function mountAnchor() {
    if (!anchorEl) return;
    var leagueProfile = getStaticLeagueLink();
    if (leagueProfile && leagueProfile.parentNode) {
      leagueProfile.parentNode.insertBefore(anchorEl, leagueProfile.nextSibling);
      wireExternalNotificationBells();
      return;
    }
    var topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) {
      topbarRight.appendChild(anchorEl);
      wireExternalNotificationBells();
      return;
    }
    var header = document.querySelector('.header');
    if (header) {
      header.appendChild(anchorEl);
    }
    wireExternalNotificationBells();
  }

  function setHeaderActionLane(on) {
    if (!anchorEl || !anchorEl.parentNode || !anchorEl.parentNode.classList) return;
    if (!anchorEl.parentNode.classList.contains('header')) return;
    anchorEl.parentNode.classList.toggle(NS + '-header-host', !!on);
  }

  function setVisible(on) {
    if (!anchorEl) return;
    anchorEl.style.display = on ? 'flex' : 'none';
    setHeaderActionLane(on);
  }

  function setStaticLeagueLink(mode) {
    var staticEl = getStaticLeagueLink();
    if (!staticEl) return;
    if (mode === 'sign-in') {
      staticEl.style.display = '';
      staticEl.setAttribute('href', getSignInHref());
      var label = staticEl.querySelector('.league-header-profile__label');
      if (label) label.textContent = 'Sign in';
      else {
        var lastNode = staticEl.lastChild;
        if (lastNode && lastNode.nodeType === 3) lastNode.nodeValue = ' Sign in';
      }
      staticEl.setAttribute('aria-label', 'Sign in to your South End account');
    } else if (mode === 'hide') {
      staticEl.style.display = 'none';
    } else if (mode === 'profile') {
      staticEl.style.display = '';
      staticEl.setAttribute('href', liveHref('SouthEnd_OpenPlay_Account.html'));
      var label2 = staticEl.querySelector('.league-header-profile__label');
      if (label2) label2.textContent = 'Profile';
      else {
        var lastNode2 = staticEl.lastChild;
        if (lastNode2 && lastNode2.nodeType === 3) lastNode2.nodeValue = ' Profile';
      }
      staticEl.setAttribute('aria-label', 'Open your South End profile');
    }
  }

  function leagueReturnFilename() {
    try {
      var path = String((global.location && global.location.pathname) || '').toLowerCase();
      if (path.indexOf('/league-play') === -1) return '';
      var slug = path.split('/').filter(Boolean).pop() || '';
      slug = slug.replace(/\.html$/i, '').toLowerCase();
      var mapClean = {
        overview: '/league-play',
        schedule: '/league-play/schedule',
        standings: '/league-play/standings',
        register: '/league-play/register',
        invites: '/league-play/register',
        payment: '/league-play/payment',
        southend_league_overview: '/league-play',
        southend_league_schedule: '/league-play/schedule',
        southend_league_standings: '/league-play/standings',
        southend_league_teams: '/league-play/register',
        southend_league_invites: '/league-play/register',
        southend_league_payment: '/league-play/payment',
        southend_league_play_hub: '/league-play',
        'league-play': '/league-play',
        '': '/league-play'
      };
      var mapFile = {
        overview: 'SouthEnd_League_Overview.html',
        schedule: 'SouthEnd_League_Schedule.html',
        standings: 'SouthEnd_League_Standings.html',
        register: 'SouthEnd_League_Teams.html',
        invites: 'SouthEnd_League_Teams.html',
        payment: 'SouthEnd_League_Payment.html',
        southend_league_overview: 'SouthEnd_League_Overview.html',
        southend_league_schedule: 'SouthEnd_League_Schedule.html',
        southend_league_standings: 'SouthEnd_League_Standings.html',
        southend_league_teams: 'SouthEnd_League_Teams.html',
        southend_league_invites: 'SouthEnd_League_Teams.html',
        southend_league_payment: 'SouthEnd_League_Payment.html',
        southend_league_play_hub: 'SouthEnd_League_Overview.html',
        'league-play': 'SouthEnd_League_Overview.html',
        '': 'SouthEnd_League_Overview.html'
      };
      var accProbe = liveHref('SouthEnd_OpenPlay_Account.html');
      if (accProbe.indexOf('.html') !== -1) {
        return mapFile[slug] || 'SouthEnd_League_Overview.html';
      }
      return mapClean[slug] || '/league-play';
    } catch (e) {
      return '';
    }
  }

  function getSignInHref() {
    var base = liveHref('SouthEnd_OpenPlay_Account.html');
    var ret = leagueReturnFilename();
    if (!ret) return base;
    var sep = base.indexOf('?') !== -1 ? '&' : '?';
    return base + sep + 'return=' + encodeURIComponent(ret);
  }

  function setSignedOutMode(off) {
    if (!anchorEl) return;
    if (off) {
      anchorEl.classList.add('is-signed-out');
      anchorEl.style.display = 'flex';
      setHeaderActionLane(true);
      if (btnEl) {
        btnEl.setAttribute('aria-label', 'Sign in to your South End account');
        var signedOutLabel = btnEl.querySelector('.' + NS + '-label');
        if (signedOutLabel) signedOutLabel.textContent = 'Sign in';
      }
      if (notifyBtnEl) notifyBtnEl.style.display = 'none';
      if (adminQuickEl) adminQuickEl.style.display = 'none';
      setStaticLeagueLink('sign-in');
      externalNotificationBells().forEach(function (bell) {
        bell.style.display = 'none';
      });
      closeMenu();
    } else {
      anchorEl.classList.remove('is-signed-out');
      anchorEl.style.display = 'flex';
      setHeaderActionLane(true);
      if (btnEl) {
        btnEl.setAttribute('aria-label', 'Open your South End account menu');
        var signedInLabel = btnEl.querySelector('.' + NS + '-label');
        if (signedInLabel) signedInLabel.textContent = 'Account';
      }
      if (notifyBtnEl) notifyBtnEl.style.display = '';
      if (adminQuickEl) adminQuickEl.style.display = '';
      setStaticLeagueLink('hide');
      externalNotificationBells().forEach(function (bell) {
        bell.style.display = '';
      });
    }
  }

  function ensureAdminNavLink() {
    var nav = document.querySelector('.se-site-nav');
    if (!nav) return null;
    Array.prototype.slice.call(nav.querySelectorAll('a.se-site-nav-link')).forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (
        /SouthEnd_(?:Admin_(?:Activity|Module_Access|League_Play|User_Management)|Open_Play_Signups)\.html/i.test(href) ||
        /^\/admin\/(activity|module-access|open-play|user-management|league-play)(\?|#|$)/i.test(href) ||
        /^\/signups(\?|#|$)/i.test(href)
      ) {
        a.classList.remove('se-site-nav-link--active');
        a.removeAttribute('aria-current');
        a.style.display = 'none';
      }
    });
    var link = document.getElementById('league-admin-nav-link') || document.getElementById('admin-hub-nav-link');
    if (!link) {
      link = Array.prototype.slice.call(nav.querySelectorAll('a.se-site-nav-link')).filter(function (a) {
        return /(?:SouthEnd_Admin_Hub\.html|\/admin(?:$|[?#]))/i.test(a.getAttribute('href') || '');
      })[0] || null;
    }
    if (!link) {
      link = document.createElement('a');
      link.id = 'admin-hub-nav-link';
      link.href = adminHubHrefForContext();
      link.textContent = 'Admin';
      nav.appendChild(link);
    }
    link.classList.add('se-site-nav-link', 'se-site-nav-link--admin', 'hidden');
    link.setAttribute('href', adminHubHrefForContext());
    link.textContent = 'Admin';
    nav.appendChild(link);
    return link;
  }

  function setAdminNavVisible(on) {
    var link = ensureAdminNavLink();
    if (!link) return;
    link.classList.toggle('hidden', !on);
    link.classList.toggle('se-site-nav-link--active', !!on && isAdminPage());
    if (on && isAdminPage()) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  function setStaffMenuVisible(on) {
    if (!anchorEl) return;
    anchorEl.querySelectorAll('.staff').forEach(function (el) {
      el.classList.toggle('hidden', !on);
    });
    if (!on) {
      var sub = anchorEl.querySelector('.' + NS + '-admin-sub');
      var toggle = anchorEl.querySelector('[data-action="admin-toggle"]');
      if (sub) sub.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
    if (on) renderAdminMenuItems();
  }

  function refreshMenuStatus() {
    if (!statusEl) return;
    if (!currentUser) {
      statusEl.textContent = 'Not signed in';
      return;
    }
    var label = (currentProfile && currentProfile.firstName) ? currentProfile.firstName : (currentUser.email || 'Account');
    statusEl.innerHTML = 'Signed in as <strong>' + escapeHtml(label) + '</strong><br>' + escapeHtml(currentUser.email || '');
  }

  function refreshAccountLink() {
    if (!anchorEl) return;
    var accountLink = anchorEl.querySelector('[data-action="account"]');
    if (accountLink) accountLink.setAttribute('href', liveHref('SouthEnd_Pickleball_Hub.html'));
    ensureAdminNavLink();
    renderAdminMenuItems();
  }

  function updateUserState(user) {
    var SE = global.SEOpenPlay;
    currentUser = user || null;
    currentProfile = null;
    currentIsAdmin = false;
    currentAdminScope = {};
    setVisible(true);
    setSignedOutMode(!currentUser);
    refreshAccountLink();
    refreshMenuStatus();
    setStaffMenuVisible(false);
    setAdminNavVisible(false);
    subscribeNotifications(currentUser);
    if (!currentUser || !SE) return;
    if (SE.loadUserProfile) {
      SE.loadUserProfile(currentUser.uid).then(function (p) {
        currentProfile = p || {};
        refreshMenuStatus();
      });
    }
    if (SE.loadAdminUidFlag) {
      SE.loadAdminUidFlag(currentUser.uid).then(function (ok) {
        currentIsAdmin = !!ok;
        if (!currentIsAdmin) {
          currentAdminScope = {};
          renderAdminMenuItems();
          setStaffMenuVisible(false);
          setAdminNavVisible(false);
          return;
        }
        var scopePromise = SE.loadAdminScope ? SE.loadAdminScope(currentUser.uid) : Promise.resolve({});
        scopePromise
          .then(function (scope) {
            currentAdminScope = scope || {};
          })
          .catch(function () {
            currentAdminScope = {};
          })
          .then(function () {
            renderAdminMenuItems();
            setStaffMenuVisible(true);
            setAdminNavVisible(true);
          });
      });
    }
  }

  function init() {
    var SE = global.SEOpenPlay;
    ensureDom();
    mountAnchor();
    refreshAccountLink();
    ensureAdminNavLink();
    renderAdminMenuItems();
    setVisible(true);
    setSignedOutMode(true);
    if (!SE || !SE.firebaseConfigured || !SE.firebaseConfigured()) return;
    if (global.PickleballInviteShare && typeof global.PickleballInviteShare.refresh === 'function') {
      global.PickleballInviteShare.refresh();
    }
    SE.onAuthStateChanged(function (user) {
      updateUserState(user);
      if (!user) {
        closeMenu();
        closeProfileModal();
        closeNotificationPanel();
      }
    });
  }

  global.SEOpenPlayNotifications = {
    syncUser: function (user) {
      currentUser = user || currentUser;
      wireExternalNotificationBells();
      subscribeNotifications(user || null);
    },
    open: openNotificationPanel,
    close: closeNotificationPanel,
  };
  global.SEOpenPlayProfilePanel = { init: init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);

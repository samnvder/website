/**
 * SMS (phone only) + Email invite links for South End Pickleball.
 * Targets: [data-pickleball-share] — optional data-share-context="league"|"pickleball", data-share-url override.
 */
(function (global) {
  var STYLE_ID = 'pickleball-invite-share-css';
  var didStyle = false;
  var LIVE_ACCOUNT_URL = 'https://southend-pickleball-central.web.app/signup';
  var LIVE_LEAGUE_ACCOUNT_URL = LIVE_ACCOUNT_URL;

  function injectStyles() {
    if (didStyle) return;
    didStyle = true;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.pickleball-share{display:flex;flex-direction:column;gap:8px;}' +
      '.pickleball-share__label{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,.5);}' +
      '.pickleball-share__actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}' +
      '.pickleball-share__btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 14px;border-radius:8px;font-family:Oswald,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(0,255,136,.4);background:rgba(0,255,136,.12);color:#e8fff4;cursor:pointer;transition:background .15s,border-color .15s;}' +
      '.pickleball-share__btn:hover{background:rgba(0,255,136,.2);border-color:#00ff88;color:#fff;}' +
      '.pickleball-share__btn--secondary{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.88);}' +
      '.pickleball-share__btn--secondary:hover{background:rgba(255,255,255,.12);border-color:rgba(0,255,136,.35);}' +
      '.pickleball-share__btn--contact{border-color:rgba(135,90,255,.55);background:rgba(135,90,255,.16);color:#f4efff;}' +
      '.pickleball-share__btn--contact:hover{background:rgba(135,90,255,.26);border-color:rgba(180,145,255,.9);color:#fff;}' +
      '.pickleball-share-footer{margin-top:32px;padding:20px 24px 28px;border-top:1px solid rgba(0,255,136,.22);background:rgba(5,12,28,.5);}' +
      '.pickleball-share-footer .pickleball-share{display:inline-flex;align-items:center;}' +
      '.pickleball-share-footer .pickleball-share__label{margin-bottom:2px;}' +
      '.pickleball-share--inline{margin-top:12px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1);}' +
      '.league-page .pickleball-share-footer{margin-top:24px;border-color:rgba(0,255,136,.18);}' +
      '.se-openplay-profile-menu .pickleball-share{padding:10px 8px 8px;margin:6px 0 0;border-top:1px solid rgba(255,255,255,.1);}' +
      '.se-openplay-profile-menu .pickleball-share__btn{font-size:11px;min-height:36px;padding:6px 12px;}' +
      '@media(max-width:520px){.pickleball-share__actions{flex-direction:column;align-items:stretch;}.pickleball-share__btn{width:100%;}}';
    document.head.appendChild(s);
  }

  function isPhoneLike() {
    var ua = navigator.userAgent || '';
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
    if (navigator.maxTouchPoints > 0 && /Mobile/i.test(ua)) return true;
    return false;
  }

  function resolveUrl(el) {
    var attr = el.getAttribute('data-share-url');
    if (attr) {
      try {
        return new URL(attr, global.location.href).href;
      } catch (e) {
        return attr;
      }
    }
    var ctx = el.getAttribute('data-share-context') || 'pickleball';
    if (ctx === 'league') {
      return LIVE_LEAGUE_ACCOUNT_URL;
    }
    return LIVE_ACCOUNT_URL;
  }

  function payload(context, url) {
    if (context === 'league') {
      return {
        subject: "You're invited — South End Pickleball League",
        body:
          "Hi — I'm inviting you to South End Pickleball League Play at South End Racquet & Health Club. " +
          'Create your account and get started here:\n\n' +
          url +
          '\n\nHope to see you on the courts!',
      };
    }
    return {
      subject: 'South End Pickleball',
      body:
        "Hi — I'm sharing South End Pickleball at South End Racquet & Health Club " +
        '(league play, open play, and more). Take a look here:\n\n' +
        url,
    };
  }

  function renderOne(el) {
    if (!el || el.nodeType !== 1) return;
    injectStyles();
    var ctx = el.getAttribute('data-share-context') || 'pickleball';
    var url = resolveUrl(el);
    var p = payload(ctx, url);
    var mailto = 'mailto:?subject=' + encodeURIComponent(p.subject) + '&body=' + encodeURIComponent(p.body);
    var smsHref = 'sms:?body=' + encodeURIComponent(p.body);
    var showSms = isPhoneLike();

    el.textContent = '';
    var wrap = document.createElement('div');
    wrap.className = 'pickleball-share';
    if (el.hasAttribute('data-pickleball-share-inline')) {
      wrap.classList.add('pickleball-share--inline');
    }

    var lab = document.createElement('span');
    lab.className = 'pickleball-share__label';
    lab.textContent = el.classList.contains('pickleball-share-footer')
      ? 'Invite a Member to the South End Pickleball Program'
      : (ctx === 'league' ? 'Invite a friend' : 'Share Pickleball');

    var actions = document.createElement('div');
    actions.className = 'pickleball-share__actions';

    if (showSms) {
      var aSms = document.createElement('a');
      aSms.className = 'pickleball-share__btn';
      aSms.href = smsHref;
      aSms.textContent = 'Text invite';
      actions.appendChild(aSms);
    }

    var aMail = document.createElement('a');
    aMail.className = 'pickleball-share__btn pickleball-share__btn--secondary';
    aMail.href = mailto;
    aMail.textContent = 'Email invite';
    actions.appendChild(aMail);

    if (el.classList.contains('pickleball-share-footer')) {
      var aContact = document.createElement('a');
      aContact.className = 'pickleball-share__btn pickleball-share__btn--contact';
      aContact.href = 'mailto:Pickleball@southendclub.com';
      aContact.textContent = 'Questions? Email Pickleball@southendclub.com';
      actions.appendChild(aContact);
    }

    wrap.appendChild(lab);
    wrap.appendChild(actions);
    el.appendChild(wrap);
  }

  function refresh() {
    document.querySelectorAll('[data-pickleball-share]').forEach(renderOne);
  }

  global.PickleballInviteShare = {
    refresh: refresh,
    isPhoneLike: isPhoneLike,
  };

  function onReady() {
    refresh();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})(typeof window !== 'undefined' ? window : this);

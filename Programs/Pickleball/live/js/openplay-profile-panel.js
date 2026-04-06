/**
 * South End Open Play — signed-in profile viewer (read-only).
 * Shows RTDB profile + account email. Add entries to PROFILE_FIELD_DEFS when you add
 * new fields to saveUserProfile / openplay_se/user_profiles/{uid}.
 */
(function (global) {
  var NS = 'se-openplay-profile';

  /**
   * Declarative list for the profile modal. `key` matches RTDB (except email uses Firebase Auth).
   * Optional: format(value, profile, user) -> string for display.
   */
  var PROFILE_FIELD_DEFS = [
    { key: 'email', label: 'Account email', fromAuth: true },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'phone', label: 'Phone' },
    { key: 'skill', label: 'Skill level' },
    {
      key: 'membership',
      label: 'Member / guest',
      format: function (v) {
        if (v === 'yes') return 'Yes — South End member';
        if (v === 'no') return 'No — Guest';
        return v || '—';
      },
    },
    { key: 'hear', label: 'How did you hear about us?' },
    { key: 'notes', label: 'Notes' },
    {
      key: 'waiverLiabilityAccepted',
      label: 'Liability waiver (account)',
      format: function (v) {
        return v ? 'Yes' : 'No';
      },
    },
    {
      key: 'waiverCommunicationAccepted',
      label: 'Communications consent (account)',
      format: function (v) {
        return v ? 'Yes' : 'No';
      },
    },
    { key: 'rsvpWaiversSchema', label: 'Waiver schema version' },
    {
      key: 'updatedAt',
      label: 'Profile saved',
      format: function (v) {
        if (v == null || v === '') return '—';
        if (typeof v === 'number') {
          try {
            return new Date(v).toLocaleString();
          } catch (e) {
            return String(v);
          }
        }
        return String(v);
      },
    },
  ];

  var KNOWN_KEYS = {};
  PROFILE_FIELD_DEFS.forEach(function (d) {
    KNOWN_KEYS[d.key] = true;
  });

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function humanizeKey(k) {
    return k
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, function (c) {
        return c.toUpperCase();
      })
      .trim();
  }

  function valueForDef(def, profile, user) {
    if (def.fromAuth) return user && user.email ? user.email : '';
    if (!profile) return '';
    var raw = profile[def.key];
    if (def.format) return def.format(raw, profile, user);
    if (raw === true || raw === false) return raw ? 'Yes' : 'No';
    if (raw == null || raw === '') return '—';
    return String(raw);
  }

  function extraRowsHtml(profile) {
    if (!profile || typeof profile !== 'object') return '';
    var keys = Object.keys(profile).filter(function (k) {
      return !KNOWN_KEYS[k];
    });
    if (!keys.length) return '';
    var parts = ['<div class="' + NS + '-extras"><div class="' + NS + '-extras-title">Additional data</div>'];
    keys.sort().forEach(function (k) {
      var v = profile[k];
      var display =
        typeof v === 'object' ? JSON.stringify(v) : v === true ? 'Yes' : v === false ? 'No' : String(v);
      parts.push(
        '<div class="' + NS + '-row"><span class="' + NS + '-lbl">' +
          escapeHtml(humanizeKey(k)) +
          '</span><span class="' + NS + '-val">' +
          escapeHtml(display) +
          '</span></div>'
      );
    });
    parts.push('</div>');
    return parts.join('');
  }

  function buildBodyHtml(profile, user) {
    var rows = PROFILE_FIELD_DEFS.map(function (def) {
      var val = valueForDef(def, profile, user);
      return (
        '<div class="' +
        NS +
        '-row"><span class="' +
        NS +
        '-lbl">' +
        escapeHtml(def.label) +
        '</span><span class="' +
        NS +
        '-val">' +
        escapeHtml(val) +
        '</span></div>'
      );
    }).join('');
    return (
      rows +
      extraRowsHtml(profile) +
      '<p class="' +
      NS +
      '-hint">To update these fields, use <a href="SouthEnd_OpenPlay_Account.html">your account page</a>. Waivers are completed on the RSVP form. ' +
      'Your password is never stored in your profile or shown here.</p>'
    );
  }

  var injected = false;
  var btnEl = null;
  var modalEl = null;
  var contentEl = null;
  var unsub = null;

  function ensureDom() {
    if (injected) return;
    injected = true;

    var style = document.createElement('style');
    style.id = NS + '-css';
    style.textContent =
      '.' +
      NS +
      '-fab{position:fixed;bottom:20px;right:20px;z-index:470;width:48px;height:48px;border-radius:50%;' +
      'border:2px solid rgba(0,255,136,.45);background:rgba(10,22,40,.92);color:#00ff88;cursor:pointer;' +
      'display:none;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.35);' +
      'transition:transform .15s,border-color .15s,background .15s;padding:0;}' +
      '.' +
      NS +
      '-fab:hover{border-color:#00ff88;background:rgba(0,255,136,.12);transform:scale(1.04);}' +
      '.' +
      NS +
      '-fab svg{width:24px;height:24px;display:block;}' +
      '.' +
      NS +
      '-modal{position:fixed;inset:0;z-index:850;background:rgba(0,0,0,.82);display:none;' +
      'align-items:center;justify-content:center;padding:16px;}' +
      '.' +
      NS +
      '-modal.open{display:flex;}' +
      '.' +
      NS +
      '-card{max-width:420px;width:100%;max-height:85vh;overflow:auto;background:#111e35;' +
      'border:2px solid rgba(0,255,136,.35);border-radius:12px;padding:20px 18px 16px;' +
      'box-shadow:0 0 40px rgba(0,255,136,.12);}' +
      '.' +
      NS +
      '-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}' +
      '.' +
      NS +
      '-title{font-family:Oswald,sans-serif;font-size:18px;letter-spacing:.5px;text-transform:uppercase;color:#00ff88;}' +
      '.' +
      NS +
      '-close{background:transparent;border:none;color:rgba(255,255,255,.55);cursor:pointer;font-size:22px;line-height:1;padding:4px;}' +
      '.' +
      NS +
      '-close:hover{color:#fff;}' +
      '.' +
      NS +
      '-row{display:flex;flex-direction:column;gap:4px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);}' +
      '.' +
      NS +
      '-row:last-of-type{border-bottom:none;}' +
      '.' +
      NS +
      '-lbl{font-size:8px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,.5);}' +
      '.' +
      NS +
      '-val{font-size:13px;color:rgba(255,255,255,.92);line-height:1.4;word-break:break-word;}' +
      '.' +
      NS +
      '-extras{margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,255,136,.2);}' +
      '.' +
      NS +
      '-extras-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a855f7;margin-bottom:8px;}' +
      '.' +
      NS +
      '-hint{font-size:11px;color:rgba(255,255,255,.45);line-height:1.5;margin-top:14px;}' +
      '.' +
      NS +
      '-hint a{color:#a855f7;}' +
      '@media(max-width:520px){.' +
      NS +
      '-fab{bottom:14px;right:14px;width:44px;height:44px;}}';
    document.head.appendChild(style);

    btnEl = document.createElement('button');
    btnEl.type = 'button';
    btnEl.className = NS + '-fab';
    btnEl.setAttribute('aria-label', 'View your saved profile');
    btnEl.title = 'Your profile';
    btnEl.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>' +
      '<path d="M5 20.5c.8-3.2 3.4-5.5 7-5.5s6.2 2.3 7 5.5" stroke-linecap="round"/>' +
      '</svg>';

    modalEl = document.createElement('div');
    modalEl.className = NS + '-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', NS + '-title');
    modalEl.innerHTML =
      '<div class="' +
      NS +
      '-card">' +
      '<div class="' +
      NS +
      '-head">' +
      '<div id="' +
      NS +
      '-title" class="' +
      NS +
      '-title">Your profile</div>' +
      '<button type="button" class="' +
      NS +
      '-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="' +
      NS +
      '-body"></div>' +
      '</div>';

    contentEl = modalEl.querySelector('.' + NS + '-body');
    document.body.appendChild(btnEl);
    document.body.appendChild(modalEl);

    btnEl.addEventListener('click', function () {
      openModal();
    });
    modalEl.querySelector('.' + NS + '-close').addEventListener('click', closeModal);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('open')) closeModal();
    });
  }

  function closeModal() {
    if (modalEl) {
      modalEl.classList.remove('open');
      modalEl.setAttribute('aria-hidden', 'true');
    }
  }

  function openModal() {
    var SE = global.SEOpenPlay;
    if (!SE || !contentEl) return;
    var user = SE.getCurrentUser && SE.getCurrentUser();
    if (!user) return;
    contentEl.innerHTML = '<p class="' + NS + '-val" style="margin:8px 0;">Loading…</p>';
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    SE.loadUserProfile(user.uid).then(function (profile) {
      contentEl.innerHTML = buildBodyHtml(profile, user);
    });
  }

  function setFabVisible(on) {
    if (!btnEl) return;
    btnEl.style.display = on ? 'flex' : 'none';
  }

  function init() {
    var SE = global.SEOpenPlay;
    if (!SE || !SE.firebaseConfigured || !SE.firebaseConfigured()) return;
    ensureDom();

    SE.onAuthStateChanged(function (user) {
      setFabVisible(!!user);
      if (!user) closeModal();
    });
  }

  global.SEOpenPlayProfilePanel = {
    init: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);

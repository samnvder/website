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
  var ADMIN_ITEMS = [
    { action: 'admin-hub', href: 'SouthEnd_Admin_Hub.html', label: 'Admin Hub' },
    { action: 'league-admin', href: 'SouthEnd_Admin_League_Play.html', label: 'League Play' },
    { action: 'user-mgmt', href: 'SouthEnd_Admin_User_Management.html', label: 'User management' },
    { action: 'signups', href: 'SouthEnd_Open_Play_Signups.html', label: 'Signups' },
    { action: 'checkin', href: 'SouthEnd_Session_Checkin.html', label: 'Check-ins' },
    { action: 'activity', href: 'SouthEnd_Admin_Activity.html', label: 'Activity' },
    { action: 'module-admin', href: 'SouthEnd_Admin_Module_Access.html', label: 'Module access' },
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
    return /^SouthEnd_(?:Admin_(?:Hub|Activity|Module_Access|League_Play|User_Management)|Open_Play_Signups)\.html$/i.test(pageFileName());
  }

  function adminItemsHtml() {
    return ADMIN_ITEMS.map(function (item) {
      return '<a class="' + NS + '-menu-item" data-action="' + item.action + '" href="' + liveHref(item.href) + '">' + item.label + '</a>';
    }).join('');
  }

  function liveHref(href) {
    var routes = {
      SouthEnd_Admin_Hub: '/admin',
      SouthEnd_Admin_Activity: '/admin/activity',
      SouthEnd_Admin_Module_Access: '/admin/module-access',
      SouthEnd_OpenPlay_Account: '/account',
      SouthEnd_Pickleball_Hub: '/hub',
    };
    var key = String(href || '').replace(/\.html(?:\?.*)?$/i, '');
    return routes[key] || '/' + String(href || '').replace(/^\/+/, '');
  }

  function normalizeLegacyLiveUrl(rawHref) {
    if (!rawHref) return '';
    var href = String(rawHref);
    if (/advanced-open-play\/(?:staging|live)\/SouthEnd_Pickleball_Hub\.html/i.test(href)) return '/hub';
    if (/advanced-open-play\/(?:staging|live)\/SouthEnd_OpenPlay_Account\.html/i.test(href)) {
      var query = href.indexOf('?') >= 0 ? href.slice(href.indexOf('?')) : '';
      return '/account' + query;
    }
    return '';
  }

  function ensureDom() {
    if (injected) return;
    injected = true;

    var style = document.createElement('style');
    style.id = NS + '-css';
    style.textContent =
      '.header{position:relative;z-index:10;}' +
      'nav.se-site-nav{position:relative;z-index:1;}' +
      '.' + NS + '-anchor{display:none;align-items:center;gap:8px;z-index:500;}' +
      '.header > .' + NS + '-anchor{' +
      'position:absolute;right:18px;top:12px;}' +
      '.topbar-right > .' + NS + '-anchor{' +
      'position:relative;}' +
      '.' + NS + '-admin-quick{' +
      'display:none;align-items:center;justify-content:center;min-height:34px;padding:6px 10px;border-radius:8px;' +
      'background:#00ff88;border:1.5px solid rgba(0,255,136,.45);color:#0a1628;text-decoration:none;' +
      'font-family:Oswald,sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;' +
      'box-shadow:0 0 18px rgba(0,255,136,.22);}' +
      '.' + NS + '-btn{' +
      'display:flex;align-items:center;gap:8px;min-height:38px;padding:7px 12px;border-radius:8px;' +
      'background:rgba(255,255,255,.08);border:1.5px solid rgba(0,255,136,.32);color:#fff;cursor:pointer;' +
      'font-family:Oswald,sans-serif;font-size:13px;letter-spacing:.4px;text-transform:uppercase;}' +
      '.' + NS + '-btn:hover{border-color:#00ff88;background:rgba(0,255,136,.12);}' +
      '.' + NS + '-icon{width:20px;height:20px;display:block;}' +
      '.' + NS + '-label{white-space:nowrap;line-height:1;}' +
      '.' + NS + '-menu{' +
      'position:absolute;right:0;top:44px;z-index:20;width:260px;background:#111e35;border:1.5px solid rgba(0,255,136,.35);' +
      'border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:8px;display:none;}' +
      '.' + NS + '-menu.open{display:block;}' +
      '.' + NS + '-menu-head{padding:8px 10px 10px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:6px;}' +
      '.' + NS + '-menu-status{font-size:10px;color:rgba(255,255,255,.58);line-height:1.4;word-break:break-word;}' +
      '.' + NS + '-menu-item{' +
      'display:block;width:100%;text-align:left;padding:9px 10px;border:none;background:transparent;border-radius:7px;' +
      'font-family:Barlow,sans-serif;font-size:12px;color:rgba(255,255,255,.88);cursor:pointer;text-decoration:none;}' +
      '.' + NS + '-menu-item:hover{background:rgba(0,255,136,.11);color:#00ff88;}' +
      '.' + NS + '-menu-item.staff{color:#d8b4fe;}' +
      '.' + NS + '-admin-toggle{position:relative;}' +
      '.' + NS + '-admin-toggle .chevron{display:inline-block;margin-left:auto;font-size:10px;transition:transform .2s ease;color:rgba(255,255,255,.45);}' +
      '.' + NS + '-admin-toggle[aria-expanded="true"] .chevron{transform:rotate(180deg);}' +
      '.' + NS + '-admin-sub{overflow:hidden;max-height:0;transition:max-height .25s ease;padding-left:10px;border-left:2px solid rgba(168,85,247,.3);}' +
      '.' + NS + '-admin-sub.open{max-height:300px;}' +
      '.' + NS + '-admin-sub .' + NS + '-menu-item{font-size:11px;padding:7px 10px;}' +
      '.se-site-nav-link--admin{margin-left:auto;color:#00ff88;border-color:rgba(0,255,136,.22);}' +
      '.se-site-nav-link--admin.hidden{display:none!important;}' +
      '.' + NS + '-modal{position:fixed;inset:0;z-index:850;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;padding:16px;}' +
      '.' + NS + '-modal.open{display:flex;}' +
      '.' + NS + '-card{max-width:420px;width:100%;max-height:85vh;overflow:auto;background:#111e35;border:2px solid rgba(0,255,136,.35);border-radius:12px;padding:18px;}' +
      '.' + NS + '-title{font-family:Oswald,sans-serif;font-size:18px;color:#00ff88;text-transform:uppercase;margin-bottom:10px;}' +
      '.' + NS + '-close{background:transparent;border:none;color:rgba(255,255,255,.65);font-size:22px;cursor:pointer;position:absolute;right:16px;top:10px;}' +
      '.' + NS + '-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);}' +
      '.' + NS + '-lbl{font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;}' +
      '.' + NS + '-val{font-size:12px;color:#fff;text-align:right;word-break:break-word;}' +
      '.' + NS + '-field{margin-top:10px;}' +
      '.' + NS + '-field.hidden{display:none;}' +
      '.' + NS + '-field label{display:block;font-size:10px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;}' +
      '.' + NS + '-input,.' + NS + '-textarea,.' + NS + '-select{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:6px;color:#fff;font-size:13px;padding:9px 10px;font-family:Barlow,sans-serif;}' +
      '.' + NS + '-textarea{resize:vertical;min-height:72px;}' +
      '.' + NS + '-input:focus,.' + NS + '-textarea:focus,.' + NS + '-select:focus{outline:none;border-color:#00ff88;}' +
      '.' + NS + '-select option{background:#111e35;color:#fff;}' +
      '.' + NS + '-actions{display:flex;justify-content:flex-end;margin-top:14px;}' +
      '.' + NS + '-save{background:#00ff88;color:#0a1628;border:none;border-radius:7px;padding:9px 12px;font-family:Oswald,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;}' +
      '.' + NS + '-save[disabled]{opacity:.6;cursor:not-allowed;}' +
      '.' + NS + '-msg{margin-top:10px;font-size:11px;min-height:16px;color:rgba(255,255,255,.72);}' +
      '.' + NS + '-msg.error{color:#ff8a8a;}' +
      '.' + NS + '-msg.ok{color:#00ff88;}' +
      '@media(max-width:680px){' +
      '.header > .' + NS + '-anchor{right:10px;top:8px;}' +
      '.' + NS + '-admin-quick.is-visible{display:inline-flex;}' +
      '.' + NS + '-btn{min-height:34px;padding:6px 10px;font-size:12px;}' +
      '.' + NS + '-menu{width:240px;top:40px;}' +
      '.se-site-nav-link--admin{display:none!important;}' +
      '}';
    document.head.appendChild(style);

    anchorEl = document.createElement('div');
    anchorEl.className = NS + '-anchor';
    anchorEl.innerHTML =
      '<a class="' + NS + '-admin-quick" href="' + liveHref('SouthEnd_Admin_Hub.html') + '">Admin</a>' +
      '<button type="button" class="' + NS + '-btn" aria-expanded="false" aria-haspopup="menu">' +
      '<svg class="' + NS + '-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>' +
      '<path d="M5 20.5c.8-3.2 3.4-5.5 7-5.5s6.2 2.3 7 5.5" stroke-linecap="round"/>' +
      '</svg>' +
      '<span class="' + NS + '-label">Profile</span>' +
      '</button>' +
      '<div class="' + NS + '-menu" role="menu">' +
      '<div class="' + NS + '-menu-head"><div class="' + NS + '-menu-status">Not signed in</div></div>' +
      '<a class="' + NS + '-menu-item" data-action="account" href="/hub">Pickleball Hub</a>' +
      '<button class="' + NS + '-menu-item" type="button" data-action="view">View profile</button>' +
      '<button class="' + NS + '-menu-item staff hidden ' + NS + '-admin-toggle" type="button" data-action="admin-toggle" aria-expanded="false" style="display:flex;align-items:center;">' +
      'Admin <span class="chevron">&#9662;</span></button>' +
      '<div class="' + NS + '-admin-sub staff hidden">' +
      adminItemsHtml() +
      '</div>' +
      '<div data-pickleball-share data-share-context="pickleball"></div>' +
      '<button class="' + NS + '-menu-item" type="button" data-action="signout">Sign out</button>' +
      '</div>';
    document.body.appendChild(anchorEl);

    btnEl = anchorEl.querySelector('.' + NS + '-btn');
    adminQuickEl = anchorEl.querySelector('.' + NS + '-admin-quick');
    menuEl = anchorEl.querySelector('.' + NS + '-menu');
    statusEl = anchorEl.querySelector('.' + NS + '-menu-status');

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
      var open = menuEl.classList.toggle('open');
      btnEl.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

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
      }
    });
  }

  function closeMenu() {
    if (!menuEl || !btnEl) return;
    menuEl.classList.remove('open');
    btnEl.setAttribute('aria-expanded', 'false');
  }

  function closeProfileModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
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

  function mountAnchor() {
    if (!anchorEl) return;
    var leagueProfile = document.querySelector('.league-header-profile');
    if (leagueProfile && leagueProfile.parentNode) {
      leagueProfile.parentNode.replaceChild(anchorEl, leagueProfile);
      return;
    }
    var topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) {
      topbarRight.appendChild(anchorEl);
      return;
    }
    var header = document.querySelector('.header');
    if (header) {
      header.appendChild(anchorEl);
    }
  }

  function setVisible(on) {
    if (!anchorEl) return;
    anchorEl.style.display = on ? 'flex' : 'none';
  }

  function ensureAdminNavLink() {
    var nav = document.querySelector('.se-site-nav');
    if (!nav) return null;
    Array.prototype.slice.call(nav.querySelectorAll('a.se-site-nav-link')).forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/SouthEnd_(?:Admin_(?:Activity|Module_Access|League_Play|User_Management)|Open_Play_Signups)\.html/i.test(href)) {
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
      link.href = liveHref('SouthEnd_Admin_Hub.html');
      link.textContent = 'Admin';
      nav.appendChild(link);
    }
    link.classList.add('se-site-nav-link', 'se-site-nav-link--admin', 'hidden');
    link.setAttribute('href', liveHref('SouthEnd_Admin_Hub.html'));
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
    if (adminQuickEl) adminQuickEl.classList.toggle('is-visible', !!on);
    anchorEl.querySelectorAll('.staff').forEach(function (el) {
      el.classList.toggle('hidden', !on);
    });
    if (!on) {
      var sub = anchorEl.querySelector('.' + NS + '-admin-sub');
      var toggle = anchorEl.querySelector('[data-action="admin-toggle"]');
      if (sub) sub.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
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
  }

  function updateUserState(user) {
    var SE = global.SEOpenPlay;
    currentUser = user || null;
    currentProfile = null;
    currentIsAdmin = false;
    setVisible(!!currentUser);
    refreshAccountLink();
    refreshMenuStatus();
    setStaffMenuVisible(false);
    setAdminNavVisible(false);
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
        setStaffMenuVisible(currentIsAdmin);
        setAdminNavVisible(currentIsAdmin);
      });
    }
  }

  function init() {
    var SE = global.SEOpenPlay;
    if (!SE || !SE.firebaseConfigured || !SE.firebaseConfigured()) return;
    ensureDom();
    mountAnchor();
    ensureAdminNavLink();
    if (global.PickleballInviteShare && typeof global.PickleballInviteShare.refresh === 'function') {
      global.PickleballInviteShare.refresh();
    }
    SE.onAuthStateChanged(function (user) {
      updateUserState(user);
      if (!user) {
        closeMenu();
        closeProfileModal();
      }
    });
  }

  global.SEOpenPlayProfilePanel = { init: init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);

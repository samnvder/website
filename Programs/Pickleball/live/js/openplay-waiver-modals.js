/**
 * South End Open Play — shared liability + communications waiver UI (scroll, modal agree).
 * - "full" mode: checkboxes disabled until user agrees in modal (account page + RSVP without profile waivers).
 * - "confirm" mode: checkboxes enabled; modals are read-only "View full text" (RSVP when profile already has waivers).
 */
(function (global) {
  var RSVP_WAIVERS_SCHEMA = '2';
  var mode = 'full';

  function waiverScrollRefresh(which) {
    if (mode === 'confirm') return;
    var scrollEl = document.getElementById('waiver-scroll-' + which);
    var agree = document.getElementById('waiver-agree-' + which);
    if (!scrollEl || !agree) return;
    var threshold = 32;
    var atBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight <= threshold;
    agree.disabled = !atBottom;
  }

  function setupWaiverModalScroll(which) {
    var scrollEl = document.getElementById('waiver-scroll-' + which);
    if (!scrollEl || scrollEl.dataset.seWaiverBound) return;
    scrollEl.dataset.seWaiverBound = '1';
    var tick = function () {
      waiverScrollRefresh(which);
    };
    scrollEl.addEventListener('scroll', tick);
    scrollEl.addEventListener('touchmove', tick);
    window.addEventListener('resize', tick);
  }

  function openWaiverModal(which, viewOnly) {
    var view = !!viewOnly || mode === 'confirm';
    var overlay = document.getElementById('waiver-modal-' + which);
    var scrollEl = document.getElementById('waiver-scroll-' + which);
    var agree = document.getElementById('waiver-agree-' + which);
    var hint = document.getElementById('waiver-hint-' + which);
    if (!overlay) return;
    if (view) {
      overlay.classList.add('waiver-modal-overlay--view-only');
      if (agree) agree.style.display = 'none';
      if (hint) hint.style.display = 'none';
    } else {
      overlay.classList.remove('waiver-modal-overlay--view-only');
      if (agree) {
        agree.style.display = '';
        agree.disabled = true;
      }
      if (hint) hint.style.display = '';
    }
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (scrollEl) {
      scrollEl.scrollTop = 0;
      try {
        scrollEl.focus();
      } catch (e) {}
    }
    requestAnimationFrame(function () {
      waiverScrollRefresh(which);
    });
  }

  function closeWaiverModal(which) {
    var overlay = document.getElementById('waiver-modal-' + which);
    var agree = document.getElementById('waiver-agree-' + which);
    var hint = document.getElementById('waiver-hint-' + which);
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('waiver-modal-overlay--view-only');
    if (agree) agree.style.display = '';
    if (hint) hint.style.display = '';
  }

  function wire() {
    setupWaiverModalScroll('liability');
    setupWaiverModalScroll('communication');
    var btnL = document.getElementById('waiver-btn-open-liability');
    var btnC = document.getElementById('waiver-btn-open-communication');
    if (btnL)
      btnL.addEventListener('click', function () {
        openWaiverModal('liability', mode === 'confirm');
      });
    if (btnC)
      btnC.addEventListener('click', function () {
        openWaiverModal('communication', mode === 'confirm');
      });
    var clL = document.getElementById('waiver-modal-liability-close');
    var clC = document.getElementById('waiver-modal-communication-close');
    if (clL) clL.addEventListener('click', function () { closeWaiverModal('liability'); });
    if (clC) clC.addEventListener('click', function () { closeWaiverModal('communication'); });
    var ovL = document.getElementById('waiver-modal-liability');
    var ovC = document.getElementById('waiver-modal-communication');
    if (ovL) ovL.addEventListener('click', function (e) { if (e.target === ovL) closeWaiverModal('liability'); });
    if (ovC) ovC.addEventListener('click', function (e) { if (e.target === ovC) closeWaiverModal('communication'); });
    var agL = document.getElementById('waiver-agree-liability');
    var agC = document.getElementById('waiver-agree-communication');
    if (agL)
      agL.addEventListener('click', function () {
        if (mode === 'confirm') return;
        var cb = document.getElementById('waiver-liability');
        if (cb) {
          cb.disabled = false;
          cb.checked = true;
        }
        var it = document.getElementById('waiver-item-liability');
        if (it) it.classList.add('waiver-item--done');
        var b = document.getElementById('waiver-btn-open-liability');
        if (b) b.textContent = 'Re-read full text';
        closeWaiverModal('liability');
      });
    if (agC)
      agC.addEventListener('click', function () {
        if (mode === 'confirm') return;
        var cb = document.getElementById('waiver-communication');
        if (cb) {
          cb.disabled = false;
          cb.checked = true;
        }
        var it = document.getElementById('waiver-item-communication');
        if (it) it.classList.add('waiver-item--done');
        var b = document.getElementById('waiver-btn-open-communication');
        if (b) b.textContent = 'Re-read full text';
        closeWaiverModal('communication');
      });
    var cbL = document.getElementById('waiver-liability');
    var cbCo = document.getElementById('waiver-communication');
    if (cbL)
      cbL.addEventListener('change', function () {
        if (!this.checked) {
          if (mode === 'full') this.disabled = true;
          var it = document.getElementById('waiver-item-liability');
          if (it) it.classList.remove('waiver-item--done');
        }
      });
    if (cbCo)
      cbCo.addEventListener('change', function () {
        if (!this.checked) {
          if (mode === 'full') this.disabled = true;
          var it = document.getElementById('waiver-item-communication');
          if (it) it.classList.remove('waiver-item--done');
        }
      });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeWaiverModal('liability');
        closeWaiverModal('communication');
      }
    });
  }

  function setMode(m) {
    mode = m === 'confirm' ? 'confirm' : 'full';
    var intro = document.querySelector('#waiver-block .waiver-intro');
    if (intro) {
      if (mode === 'confirm') {
        intro.textContent =
          'You signed these agreements on your account. Check each box to confirm they apply to this reservation.';
      } else {
        intro.textContent =
          'Open each agreement below, read the full text, and sign electronically. The checkboxes are enabled only after you agree in the pop-up.';
      }
    }
    var btnL = document.getElementById('waiver-btn-open-liability');
    var btnC = document.getElementById('waiver-btn-open-communication');
    var cbL = document.getElementById('waiver-liability');
    var cbC = document.getElementById('waiver-communication');
    if (mode === 'confirm') {
      if (cbL) {
        cbL.disabled = false;
        cbL.checked = false;
      }
      if (cbC) {
        cbC.disabled = false;
        cbC.checked = false;
      }
      if (btnL) btnL.textContent = 'View full text';
      if (btnC) btnC.textContent = 'View full text';
      var il = document.getElementById('waiver-item-liability');
      var ic = document.getElementById('waiver-item-communication');
      if (il) il.classList.remove('waiver-item--done');
      if (ic) ic.classList.remove('waiver-item--done');
    } else {
      if (cbL) {
        cbL.checked = false;
        cbL.disabled = true;
      }
      if (cbC) {
        cbC.checked = false;
        cbC.disabled = true;
      }
      if (btnL) btnL.textContent = 'Read full text & sign';
      if (btnC) btnC.textContent = 'Read full text & sign';
    }
  }

  /**
   * Account page: restore waiver checkboxes from RTDB after load (full mode only).
   */
  function hydrateAccountWaivers(p) {
    if (!p) return;
    if (p.waiverLiabilityAccepted && p.rsvpWaiversSchema === RSVP_WAIVERS_SCHEMA) {
      var cb = document.getElementById('waiver-liability');
      if (cb) {
        cb.disabled = false;
        cb.checked = true;
      }
      var it = document.getElementById('waiver-item-liability');
      if (it) it.classList.add('waiver-item--done');
      var b = document.getElementById('waiver-btn-open-liability');
      if (b) b.textContent = 'Re-read full text';
    }
    if (p.waiverCommunicationAccepted && p.rsvpWaiversSchema === RSVP_WAIVERS_SCHEMA) {
      var cb2 = document.getElementById('waiver-communication');
      if (cb2) {
        cb2.disabled = false;
        cb2.checked = true;
      }
      var it2 = document.getElementById('waiver-item-communication');
      if (it2) it2.classList.add('waiver-item--done');
      var b2 = document.getElementById('waiver-btn-open-communication');
      if (b2) b2.textContent = 'Re-read full text';
    }
  }

  global.OpenPlayWaiverUI = {
    RSVP_WAIVERS_SCHEMA: RSVP_WAIVERS_SCHEMA,
    wire: wire,
    setMode: setMode,
    hydrateAccountWaivers: hydrateAccountWaivers,
    getMode: function () { return mode; },
  };
})(typeof window !== 'undefined' ? window : this);

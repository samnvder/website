/* =========================================================
   SOUTH END CLUB — REUSABLE COMPONENT
   Left Upper Smaller CTA (Floating Button)  — JavaScript
   =========================================================
   
   Drop-in script. Reads config from data-* attributes on any
   element with the class  .sec-float-cta .

   Behaviour
   ─────────────────────────────────────────────────────────
   • Hidden while the hero section is on-screen.
   • Slides in after the visitor scrolls past the hero.
   • Fades to "ghost" (is-idle) after [data-idle-delay] ms
     of no scrolling.
   • Wakes on scroll, touch, or hover.
   • Click smooth-scrolls to [data-float-target] (or href).
   ========================================================= */

(function initSecFloatCTA() {
  'use strict';

  var btn = document.querySelector('.sec-float-cta');
  if (!btn) return;

  /* ── Read config ─────────────────────────────── */
  var heroSelector   = btn.getAttribute('data-float-hero') || '.hero';
  var targetSelector = btn.getAttribute('data-float-target') || btn.getAttribute('href');
  var IDLE_DELAY     = parseInt(btn.getAttribute('data-idle-delay'), 10) || 2000;

  var heroEl = document.querySelector(heroSelector);
  if (!heroEl) {
    // No hero on this page → show immediately
    btn.classList.add('is-visible');
    return;
  }

  var idleTimer = null;

  /* ── Idle timer ──────────────────────────────── */
  function startIdleTimer() {
    clearTimeout(idleTimer);
    btn.classList.remove('is-idle');
    idleTimer = setTimeout(function () {
      if (btn.classList.contains('is-visible')) {
        btn.classList.add('is-idle');
      }
    }, IDLE_DELAY);
  }

  /* ── Show / Hide via IntersectionObserver ─────── */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          btn.classList.remove('is-visible');
          btn.classList.remove('is-idle');
          clearTimeout(idleTimer);
        } else {
          btn.classList.add('is-visible');
          startIdleTimer();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(heroEl);
  } else {
    btn.classList.add('is-visible');
  }

  /* ── Wake on scroll ──────────────────────────── */
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        if (btn.classList.contains('is-visible')) {
          startIdleTimer();
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ── Wake on hover ───────────────────────────── */
  btn.addEventListener('mouseenter', function () {
    clearTimeout(idleTimer);
  });
  btn.addEventListener('mouseleave', function () {
    startIdleTimer();
  });

  /* ── Click → smooth scroll ───────────────────── */
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    btn.classList.remove('is-idle');
    clearTimeout(idleTimer);

    var target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

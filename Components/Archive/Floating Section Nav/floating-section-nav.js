/* =========================================================
   SOUTH END CLUB — REUSABLE COMPONENT
   Floating Section Nav  (Desktop dots + Mobile accordion)
   — JavaScript
   =========================================================
   
   Drop-in script.  Reads config from data-* attributes.

   Behaviour
   ─────────────────────────────────────────────────────────
   • Desktop dot rail (right side) — hidden until hero scrolls
     out, fades to ghost after 750 ms idle, wakes on scroll
     or mouse-enter.
   • Mobile accordion (top-right) — same show/hide, fades
     after 1 000 ms idle, wakes on scroll / touch.
   • Both navs track the most-visible section and update
     the active dot + mobile toggle label in real time.
   • Smooth-scrolls on link click.

   Configuration  (data-* on #secFloatingNav)
   ─────────────────────────────────────────────────────────
   data-nav-hero        CSS selector for the hero section
                        (default ".hero")
   data-section-names   JSON map of section-id → display
                        name for the mobile toggle label
                        (e.g. '{"banquet-hall":"Banquet Hall"}')
                        Falls back to the link's own text.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ── DOM refs ────────────────────────────────── */
  var floatingNav     = document.getElementById('secFloatingNav');
  var mobileNav       = document.getElementById('secMobileNav');
  var mobileNavInner  = document.getElementById('secMobileNavInner');
  var mobileNavToggle = document.getElementById('secMobileNavToggle');
  if (!floatingNav && !mobileNav) return;

  var currentSectionText = mobileNavToggle
    ? mobileNavToggle.querySelector('.current-section')
    : null;

  /* ── Config from data-* ─────────────────────── */
  var heroSelector = (floatingNav && floatingNav.getAttribute('data-nav-hero'))
    || '.hero';
  var hero = document.querySelector(heroSelector);

  var sectionNames = {};
  try {
    sectionNames = JSON.parse(
      (floatingNav && floatingNav.getAttribute('data-section-names')) || '{}'
    );
  } catch (e) { /* ignore bad JSON */ }

  /* Build fallback names from link text if not provided */
  var allLinks = document.querySelectorAll('.sec-nav-link, .sec-mobile-nav-link');
  allLinks.forEach(function (link) {
    var id = link.getAttribute('data-section');
    if (id && !sectionNames[id]) {
      var textSpan = link.querySelector('span:not(.nav-dot)');
      if (textSpan) sectionNames[id] = textSpan.textContent.trim();
    }
  });

  var sections = document.querySelectorAll('.section[id]');
  var navLinks = document.querySelectorAll('.sec-nav-link, .sec-mobile-nav-link');

  /* ── Responsive check ───────────────────────── */
  var isMobile = window.innerWidth <= 1024;
  window.addEventListener('resize', function () {
    isMobile = window.innerWidth <= 1024;
  });

  /* ── Fade timers ────────────────────────────── */
  var mobileIdleTimer  = null;
  var desktopIdleTimer = null;

  // Mobile
  function showMobileNav() {
    if (mobileNav && mobileNav.classList.contains('visible')) {
      mobileNav.classList.remove('faded');
    }
  }
  function startMobileFadeTimer() {
    if (!isMobile) return;
    clearTimeout(mobileIdleTimer);
    showMobileNav();
    mobileIdleTimer = setTimeout(function () {
      if (mobileNav && mobileNav.classList.contains('visible')
          && mobileNavInner && !mobileNavInner.classList.contains('expanded')) {
        mobileNav.classList.add('faded');
      }
    }, 1000);
  }

  // Desktop
  function showDesktopNav() {
    if (floatingNav && floatingNav.classList.contains('visible')) {
      floatingNav.classList.remove('faded');
    }
  }
  function startDesktopFadeTimer() {
    if (isMobile) return;
    clearTimeout(desktopIdleTimer);
    showDesktopNav();
    desktopIdleTimer = setTimeout(function () {
      if (floatingNav && floatingNav.classList.contains('visible')) {
        floatingNav.classList.add('faded');
      }
    }, 750);
  }

  /* ── Mobile accordion toggle ────────────────── */
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', function () {
      mobileNavInner.classList.toggle('expanded');
      if (mobileNavInner.classList.contains('expanded')) {
        mobileNav.classList.remove('faded');
        clearTimeout(mobileIdleTimer);
      } else {
        startMobileFadeTimer();
      }
    });
  }

  // Close accordion when clicking outside
  document.addEventListener('click', function (e) {
    if (mobileNavInner && mobileNav && !mobileNav.contains(e.target)) {
      mobileNavInner.classList.remove('expanded');
    }
  });

  /* ── Show / Hide via hero IntersectionObserver ── */
  if (hero) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (floatingNav) floatingNav.classList.remove('visible', 'faded');
          if (mobileNav)   mobileNav.classList.remove('visible', 'faded');
          if (mobileNavInner) mobileNavInner.classList.remove('expanded');
          clearTimeout(mobileIdleTimer);
          clearTimeout(desktopIdleTimer);
        } else {
          if (floatingNav) floatingNav.classList.add('visible');
          if (mobileNav)   mobileNav.classList.add('visible');
          startMobileFadeTimer();
          startDesktopFadeTimer();
        }
      });
    }, { threshold: 0.5 });

    heroObserver.observe(hero);
  } else {
    // No hero → show immediately after short delay
    setTimeout(function () {
      if (floatingNav) floatingNav.classList.add('visible');
      if (mobileNav)   mobileNav.classList.add('visible');
      startMobileFadeTimer();
      startDesktopFadeTimer();
    }, 500);
  }

  /* ── Scroll / touch wake ────────────────────── */
  window.addEventListener('scroll', function () {
    if (isMobile) startMobileFadeTimer();
    else          startDesktopFadeTimer();
  }, { passive: true });

  if (isMobile) {
    window.addEventListener('touchstart', startMobileFadeTimer, { passive: true });
    window.addEventListener('touchmove',  startMobileFadeTimer, { passive: true });
  }

  /* ── Desktop: hover wakes nav ───────────────── */
  if (floatingNav) {
    floatingNav.addEventListener('mouseenter', function () {
      clearTimeout(desktopIdleTimer);
      showDesktopNav();
    }, { passive: true });
    floatingNav.addEventListener('mouseleave', function () {
      startDesktopFadeTimer();
    }, { passive: true });
  }

  /* ── Active section tracking ────────────────── */
  var currentSection = '';

  function updateActiveSection() {
    var maxVisibility    = 0;
    var mostVisibleId    = '';

    sections.forEach(function (section) {
      var rect         = section.getBoundingClientRect();
      var windowHeight = window.innerHeight;
      var visibleTop   = Math.max(0, rect.top);
      var visibleBottom = Math.min(windowHeight, rect.bottom);
      var visibleHeight = Math.max(0, visibleBottom - visibleTop);
      var centerOffset  = Math.abs((rect.top + rect.bottom) / 2 - windowHeight / 2);
      var visibility    = visibleHeight - centerOffset * 0.3;

      if (visibility > maxVisibility && rect.top < windowHeight * 0.6) {
        maxVisibility = visibility;
        mostVisibleId = section.id;
      }
    });

    if (mostVisibleId && mostVisibleId !== currentSection) {
      currentSection = mostVisibleId;
      navLinks.forEach(function (link) {
        var isActive = link.getAttribute('data-section') === currentSection;
        link.classList.toggle('active', isActive);
      });
      if (currentSectionText && sectionNames[currentSection]) {
        currentSectionText.textContent = sectionNames[currentSection];
      }
    }
  }

  // Throttled via rAF
  var scrollRAF = null;
  function throttledUpdate() {
    if (!scrollRAF) {
      scrollRAF = requestAnimationFrame(function () {
        updateActiveSection();
        scrollRAF = null;
      });
    }
  }

  window.addEventListener('scroll', throttledUpdate, { passive: true });
  updateActiveSection();

  /* ── Smooth scroll on link click ────────────── */
  document.querySelectorAll('.sec-nav-link, .sec-mobile-nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        });
        // Close mobile accordion
        if (mobileNavInner) {
          mobileNavInner.classList.remove('expanded');
        }
      }
    }, { passive: false });
  });
});

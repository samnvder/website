/* Tour-confirmation page JS — WPCode snippet 9998 (site-wide footer, guarded).
 * GENERATED from the script blocks in
 * Website/Pages/Tours (Category)/tour-confirmation/Tour Confirmation HTML.html
 * by patches/tour-confirmation-paste/generate.js — edit the page source, then
 * regenerate and re-paste; guard:tour-confirmation fails on drift.
 * WHY WPCode and not inline: WordPress content filters entity-encode
 * stray ampersands in post content on output (&& becomes &#038;&#038;),
 * which is a syntax error. WPCode injects raw. Discovered 2026-08-20.
 * Each IIFE no-ops unless #se-tc-page exists on the page. */

/* Tour-confirmation personalization.
   Reads sessionStorage key "seTourBooking":
     { "firstName": "John",
       "tourDate": "2026-08-22",          // YYYY-MM-DD
       "tourTime": "10:00 AM",            // h:mm AM/PM
       "interests": ["Tennis", "Swimming"] }
   Written by the booking widgets at confirm time (phase 2). Every field
   is optional; anything missing or malformed leaves the generic page
   as-is. All injection is via textContent — never innerHTML. */
(function(){
  'use strict';
  if (!document.getElementById('se-tc-page')) return;

  var data = null;
  try { data = JSON.parse(sessionStorage.getItem('seTourBooking') || 'null'); } catch (e) { data = null; }
  if (!data || typeof data !== 'object') return;

  /* ── First name ── */
  var firstName = null;
  if (typeof data.firstName === 'string') {
    var fn = data.firstName.trim();
    if (/^[A-Za-zÀ-ɏ' -]{1,30}$/.test(fn)) firstName = fn;
  }

  /* ── Date / time ── */
  var dateObj = null;
  if (typeof data.tourDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.tourDate)) {
    var dp = data.tourDate.split('-');
    var cand = new Date(+dp[0], +dp[1] - 1, +dp[2]);
    if (!isNaN(cand.getTime())) dateObj = cand;
  }
  var timeParts = null;
  if (typeof data.tourTime === 'string') {
    var tm = data.tourTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (tm) {
      var hh = +tm[1] % 12;
      if (/pm/i.test(tm[3])) hh += 12;
      if (+tm[1] >= 1 && +tm[1] <= 12 && +tm[2] <= 59) timeParts = { h: hh, m: +tm[2], label: tm[1] + ':' + tm[2] + ' ' + tm[3].toUpperCase() };
    }
  }

  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dayLabel = dateObj ? DAYS[dateObj.getDay()] : null;
  var dateLabel = dateObj ? DAYS[dateObj.getDay()] + ', ' + MONTHS[dateObj.getMonth()] + ' ' + dateObj.getDate() : null;

  /* ── Hero ── */
  if (firstName) {
    var title = document.getElementById('se-tc-hero-title');
    title.textContent = '';
    title.appendChild(document.createTextNode("You're all set, "));
    var nameSpan = document.createElement('span');
    nameSpan.textContent = firstName;
    title.appendChild(nameSpan);
    title.appendChild(document.createTextNode('!'));
  }
  /* Sentence-per-line helper: each sentence becomes an unbreakable
     block so lines break between sentences, never as runoffs. */
  function setSentences(el, sentences){
    el.textContent = '';
    for (var s = 0; s < sentences.length; s++) {
      if (s > 0) el.appendChild(document.createTextNode(' '));
      var sp = document.createElement('span');
      sp.className = 'se-tc-sent';
      sp.textContent = sentences[s];
      el.appendChild(sp);
    }
  }

  if (dateLabel || timeParts) {
    var sub = document.getElementById('se-tc-hero-sub');
    var when = dateLabel ? ('See you ' + dateLabel + (timeParts ? ' at ' + timeParts.label : '')) : ('See you at ' + timeParts.label);
    setSentences(sub, [when + '.', 'A confirmation email is on its way.']);
    var chipText = document.getElementById('se-tc-when-text');
    chipText.textContent = (dateLabel || '') + (dateLabel && timeParts ? ' · ' : '') + (timeParts ? timeParts.label : '');
    document.getElementById('se-tc-when-chip').style.display = 'inline-flex';
    var resched = document.getElementById('se-tc-resched');
    if (resched) resched.style.display = 'block';
  }

  /* ── Add-to-calendar (only when both date and time are known).
       Links carry the tour slot and club address only — never a name
       or any other personal data. ── */
  if (dateObj && timeParts) {
    var pad = function(n){ return (n < 10 ? '0' : '') + n; };
    var stampLocal = function(d, h, m){
      return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(h) + pad(m) + '00';
    };
    var endM = timeParts.m + 30;
    var endH = timeParts.h + Math.floor(endM / 60);
    endM = endM % 60;
    var start = stampLocal(dateObj, timeParts.h, timeParts.m);
    var end = stampLocal(dateObj, endH, endM);
    var evTitle = 'Tour — South End Racquet & Health Club';
    var evLoc = '2800 Skypark Dr, Torrance, CA 90505';
    var evDesc = 'Your club tour — check in at the front desk. Questions? (310) 530-0630';

    var gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(evTitle)
      + '&dates=' + start + '/' + end
      + '&location=' + encodeURIComponent(evLoc)
      + '&details=' + encodeURIComponent(evDesc);
    document.getElementById('se-tc-cal-google').setAttribute('href', gcal);

    var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//South End Club//Tour//EN\r\nBEGIN:VEVENT\r\n'
      + 'UID:se-tour-' + start + '@southendclub.com\r\n'
      + 'DTSTART:' + start + '\r\nDTEND:' + end + '\r\n'
      + 'SUMMARY:' + evTitle + '\r\n'
      + 'LOCATION:' + evLoc.replace(/,/g, '\\,') + '\r\n'
      + 'DESCRIPTION:' + evDesc.replace(/,/g, '\\,') + '\r\n'
      + 'END:VEVENT\r\nEND:VCALENDAR\r\n';
    document.getElementById('se-tc-cal-ics').setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics));
    document.getElementById('se-tc-cal-row').style.display = 'flex';
  }

  /* ── Interests ── */
  var interests = [];
  if (Array.isArray(data.interests)) {
    for (var i = 0; i < data.interests.length && interests.length < 12; i++) {
      if (typeof data.interests[i] === 'string' && data.interests[i].trim()) interests.push(data.interests[i].trim().slice(0, 40));
    }
  }
  if (interests.length) {
    var note = document.getElementById('se-tc-interest-note');
    note.textContent = "You told us you're interested in " + interests.join(', ') + " — we'll make sure your tour covers it.";
    note.style.display = 'block';

    /* Tier match: tennis needs Tier 1; other racquet sports Tier 2;
       gym/pool/classes are covered by Tier 3. Highest need wins. */
    var joined = interests.join('|').toLowerCase();
    var tierEl = null;
    if (/tennis/.test(joined)) {
      tierEl = document.getElementById('se-tc-tier-pinnacle');
    } else if (/(pickleball|padel|squash|racquetball)/.test(joined)) {
      tierEl = document.getElementById('se-tc-tier-elite');
    } else if (/(weight|resistance|swimming|cardio|group exercise|basketball)/.test(joined)) {
      tierEl = document.getElementById('se-tc-tier-vitality');
    }
    if (tierEl) tierEl.classList.add('se-tc-recommended');

    /* Float interest-matched quotes to the front of the rotation.
       Runs before the rotator script below, which starts from DOM order. */
    var qTrack = document.querySelector('#se-tc-quotes .se-qr-track');
    if (qTrack) {
      var qSlides = Array.prototype.slice.call(qTrack.querySelectorAll('.se-qr-slide'));
      var matched = [];
      var rest = [];
      for (var q = 0; q < qSlides.length; q++) {
        var tags = (qSlides[q].getAttribute('data-interests') || '').toLowerCase().split(',');
        var hit = false;
        for (var t = 0; t < tags.length; t++) {
          var tag = tags[t].trim();
          if (tag && joined.indexOf(tag) !== -1) { hit = true; break; }
        }
        (hit ? matched : rest).push(qSlides[q]);
      }
      if (matched.length) {
        var ordered = matched.concat(rest);
        for (var o = 0; o < ordered.length; o++) qTrack.appendChild(ordered[o]);
      }
    }
  }

  /* ── Pricing lead: fold the tour day in ── */
  if (dayLabel) {
    setSentences(document.getElementById('se-tc-pricing-lead'), [
      'Most people leave their tour ready to join.',
      "Here's what your options look like — so " + dayLabel + ' you can just say yes.'
    ]);
  }
})();

/* SE quote rotator — copy of Website/Components/quote-rotator/ (improve
   it there first, then re-copy here). Initializes every .se-qr on the
   page; runs after the personalization script so interest-reordered
   DOM order is what it starts from. */
(function(){
  'use strict';
  if (!document.getElementById('se-tc-page')) return;

  function initRotator(root){
    if (root.classList.contains('se-qr-ready')) return; /* double-init guard: the footer rotator's copy shares pages with this one */
    var track = root.querySelector('.se-qr-track');
    if (!track) return;
    var slides = track.querySelectorAll('.se-qr-slide');
    if (slides.length < 2) return;

    var dotsWrap = root.querySelector('.se-qr-dots');
    var interval = parseInt(root.getAttribute('data-interval') || '6500', 10);
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;
    var timer = null;
    var dots = [];

    function show(idx){
      current = (idx + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.toggle('se-qr-active', i === current);
      }
      for (var j = 0; j < dots.length; j++) {
        dots[j].classList.toggle('se-qr-dot-active', j === current);
        dots[j].setAttribute('aria-selected', j === current ? 'true' : 'false');
      }
    }

    function stop(){ if (timer) { clearInterval(timer); timer = null; } }
    function play(){
      stop();
      if (interval > 0 && !reduced) {
        timer = setInterval(function(){ show(current + 1); }, interval);
      }
    }
    function jump(idx){ show(idx); play(); }

    if (dotsWrap) {
      for (var d = 0; d < slides.length; d++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'se-qr-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Quote ' + (d + 1));
        (function(n, el){ el.addEventListener('click', function(){ jump(n); }); })(d, dot);
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    var prev = root.querySelector('.se-qr-prev');
    var next = root.querySelector('.se-qr-next');
    if (prev) prev.addEventListener('click', function(){ jump(current - 1); });
    if (next) next.addEventListener('click', function(){ jump(current + 1); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', play);

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft') { jump(current - 1); }
      else if (e.key === 'ArrowRight') { jump(current + 1); }
    });

    var touchX = null;
    root.addEventListener('touchstart', function(e){
      if (e.touches && e.touches.length === 1) touchX = e.touches[0].clientX;
      stop();
    }, { passive: true });
    root.addEventListener('touchend', function(e){
      if (touchX !== null && e.changedTouches && e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - touchX;
        if (dx > 40) { show(current - 1); }
        else if (dx < -40) { show(current + 1); }
      }
      touchX = null;
      play();
    }, { passive: true });

    root.classList.add('se-qr-ready');
    show(0);
    play();
  }

  var roots = document.querySelectorAll('.se-qr');
  for (var r = 0; r < roots.length; r++) initRotator(roots[r]);
})();

/* "Need to reschedule?" → the site-wide floating Book a Tour modal
   (WPCode 8309). Falls back to the schedule-a-tour page (the link's
   href) if the floating button isn't on the page. A rebooking flows
   through the redirect snippet again, landing back here with the new
   date. */
(function(){
  'use strict';
  if (!document.getElementById('se-tc-page')) return;
  var link = document.getElementById('se-tc-resched-link');
  if (!link) return;
  link.addEventListener('click', function(e){
    var fb = document.getElementById('se-bk-floating-btn');
    if (fb) { e.preventDefault(); fb.click(); }
  });
})();

/* "Message Us" → the site-wide Message Us modal (WPCode 8292). Falls
   back to the phone dialer if the snippet isn't on the page. */
(function(){
  'use strict';
  var btn = document.getElementById('se-tc-question-btn');
  if (!btn) return;
  btn.addEventListener('click', function(){
    var crm = document.getElementById('se-crm-btn');
    if (crm) { crm.click(); }
    else { window.location.href = 'tel:+13105300630'; }
  });
})();
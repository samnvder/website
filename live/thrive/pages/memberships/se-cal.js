(function(){
  var SE_URL = 'https://zngbawafqjntciafhxgr.supabase.co';
  var SE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZ2Jhd2FmcWpudGNpYWZoeGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODE3NTgsImV4cCI6MjA4NjI1Nzc1OH0.NtH0Cm6gENkkYki2LUMMYlPsFvrdg8CDt63iNP7Xi4o';

  var HOURS = {0:[8,16],1:[11,19],2:[11,19],3:[11,19],4:[11,19],5:[11,19],6:[8,16]};
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var SE_SELECTED_DATE = null, SE_SELECTED_TIME = null;
  var SE_REF_ID = null, SE_REF_REFID = null, SE_REF_NAME = '', SE_REF_EMAIL = null, SE_REF_PHONE = null;

  var today = new Date();
  var MIN_HOURS_AHEAD = 2;

  // Check if today still has bookable slots (2+ hours from now)
  function todayHasSlots(){
    var h = HOURS[today.getDay()];
    if(!h) return false;
    var cutoffHour = today.getHours() + MIN_HOURS_AHEAD;
    var cutoffMin = today.getMinutes();
    // Round up to next 30-min slot
    if(cutoffMin > 0){ cutoffMin = 30; }
    if(cutoffMin >= 60){ cutoffHour++; cutoffMin = 0; }
    return cutoffHour < h[1];
  }

  var firstAvailable = todayHasSlots() ? new Date(today) : (function(){ var t = new Date(today); t.setDate(t.getDate()+1); return t; })();

  var currentMonth = new Date(firstAvailable.getFullYear(), firstAvailable.getMonth(), 1);
  var selectedDate = firstAvailable;
  var weekStartDate = new Date(firstAvailable);

  var bookedSlotsCache = {};

  function pad2(n){ return n < 10 ? '0' + n : '' + n; }
  function dateKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }
  function isSameDay(a, b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  /* ── Mini Calendar ─────────────────────────────────────────────── */
  function renderMiniCalendar(){
    document.getElementById('se-cal-month-label').textContent = MONTHS[currentMonth.getMonth()] + ' ' + currentMonth.getFullYear();
    var grid = document.getElementById('se-cal-mini-grid');
    var dows = grid.querySelectorAll('.se-cal-mini-dow');
    while(grid.children.length > 7) grid.removeChild(grid.lastChild);

    var firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    var daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 0).getDate();

    for(var i = 0; i < firstDay; i++){
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:4px;';
      grid.appendChild(empty);
    }

    for(var d = 1; d <= daysInMonth; d++){
      var dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      var el = document.createElement('div');
      el.className = 'se-cal-mini-day';
      el.textContent = d;

      var isPast = isSameDay(dayDate, today) ? !todayHasSlots() : dayDate < today;
      if(isPast){
        el.classList.add('se-cal-past');
      } else {
        if(isSameDay(dayDate, today)) el.classList.add('se-cal-today');
        if(selectedDate && isSameDay(dayDate, selectedDate)) el.classList.add('se-cal-selected');
        el.dataset.date = dateKey(dayDate);
        el.addEventListener('click', function(){
          var parts = this.dataset.date.split('-');
          selectDate(new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2])));
        });
      }
      grid.appendChild(el);
    }
  }

  document.getElementById('se-cal-prev').addEventListener('click', function(){
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    var minMonth = new Date(firstAvailable.getFullYear(), firstAvailable.getMonth(), 1);
    if(currentMonth < minMonth) currentMonth = new Date(minMonth);
    renderMiniCalendar();
  });

  document.getElementById('se-cal-next').addEventListener('click', function(){
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderMiniCalendar();
  });

  /* ── Week View ─────────────────────────────────────────────────── */
  function renderWeekView(){
    var header = document.getElementById('se-cal-week-header');
    var slots = document.getElementById('se-cal-slots');
    header.innerHTML = '';
    slots.innerHTML = '';

    for(var i = 0; i < 7; i++){
      var date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);

      var dayHeader = document.createElement('div');
      dayHeader.className = 'se-cal-week-day';
      if(isSameDay(date, today)) dayHeader.classList.add('se-cal-week-day-today');
      if(selectedDate && isSameDay(date, selectedDate)) dayHeader.classList.add('se-cal-week-day-selected');
      dayHeader.innerHTML = '<div class="se-cal-week-dow">' + DAYS_SHORT[date.getDay()] + '</div>' +
        '<div class="se-cal-week-date">' + date.getDate() + '</div>';
      header.appendChild(dayHeader);

      var column = document.createElement('div');
      column.className = 'se-cal-day-column';
      column.dataset.date = dateKey(date);
      if(selectedDate && isSameDay(date, selectedDate)) column.classList.add('se-cal-active');

      var mobileLabel = document.createElement('div');
      mobileLabel.className = 'se-cal-mobile-date';
      mobileLabel.textContent = DAYS[date.getDay()] + ', ' + MONTHS[date.getMonth()] + ' ' + date.getDate();
      column.appendChild(mobileLabel);

      var dayIsPast = isSameDay(date, today) ? !todayHasSlots() : date < today;
      if(dayIsPast){
        var noSlots = document.createElement('div');
        noSlots.className = 'se-cal-no-slots';
        noSlots.textContent = '—';
        column.appendChild(noSlots);
      } else {
        var h = HOURS[date.getDay()];
        if(!h){
          var noSlots = document.createElement('div');
          noSlots.className = 'se-cal-no-slots';
          noSlots.textContent = 'Closed';
          column.appendChild(noSlots);
        } else {
          var loading = document.createElement('div');
          loading.className = 'se-cal-no-slots se-cal-loading';
          loading.textContent = 'Loading...';
          loading.id = 'se-cal-loading-' + dateKey(date);
          column.appendChild(loading);

          fetchAndRenderSlots(date, column, h);
        }
      }

      slots.appendChild(column);
    }
  }

  function fetchAndRenderSlots(date, column, h){
    var dk = dateKey(date);

    if(bookedSlotsCache[dk]){
      renderSlots(date, column, h, bookedSlotsCache[dk]);
      return;
    }

    fetch(SE_URL + '/functions/v1/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SE_KEY, 'Authorization': 'Bearer ' + SE_KEY },
      body: JSON.stringify({ date: dk })
    })
    .then(function(r){
      return r.json()
        .then(function(data){ return { ok: r.ok, data: data }; })
        .catch(function(){ return { ok: r.ok, data: null }; });
    })
    .then(function(res){
      var data = res.data || {};
      if(!res.ok || data.success !== true){
        throw new Error('availability_unavailable');
      }
      var booked = {};
      if(data.booked_slots){
        for(var i = 0; i < data.booked_slots.length; i++){
          booked[data.booked_slots[i]] = true;
        }
      }
      bookedSlotsCache[dk] = booked;
      renderSlots(date, column, h, booked);
    })
    .catch(function(){
      var loading = document.getElementById('se-cal-loading-' + dk);
      if(loading) loading.remove();
      var colLoading = column.querySelector('.se-cal-loading');
      if(colLoading) colLoading.remove();
      var msg = document.createElement('div');
      msg.className = 'se-cal-no-slots';
      msg.textContent = 'Live availability unavailable';
      column.appendChild(msg);
    });
  }

  function renderSlots(date, column, h, booked){
    var dk = dateKey(date);
    var loading = document.getElementById('se-cal-loading-' + dk);
    if(loading) loading.remove();
    var colLoading = column.querySelector('.se-cal-loading');
    if(colLoading) colLoading.remove();

    var isToday = isSameDay(date, today);
    var nowHour = today.getHours();
    var nowMin = today.getMinutes();

    for(var hr = h[0]; hr < h[1]; hr++){
      for(var min = 0; min < 60; min += 30){
        // Skip slots less than 2 hours from now if today
        if(isToday){
          var slotMinutes = hr * 60 + min;
          var nowMinutes = nowHour * 60 + nowMin;
          if(slotMinutes < nowMinutes + MIN_HOURS_AHEAD * 60) continue;
        }

        var ampm = hr >= 12 ? 'PM' : 'AM';
        var h12 = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
        var mStr = min === 0 ? '00' : '30';
        var label = h12 + ':' + mStr + ampm.toLowerCase();
        var labelFull = h12 + ':' + mStr + ' ' + ampm;

        var slot = document.createElement('div');
        slot.className = 'se-cal-slot';
        slot.textContent = label;
        slot.dataset.date = dk;
        slot.dataset.time = labelFull;

        if(booked[labelFull]){
          slot.classList.add('se-cal-slot-booked');
        } else {
          slot.addEventListener('click', function(){
            selectSlot(this.dataset.date, this.dataset.time);
          });
        }

        column.appendChild(slot);
      }
    }
  }

  /* ── Select Date ──────────────────────────────────────────────── */
  function selectDate(date){
    selectedDate = date;

    // Start week view from selected date so it's the first column
    weekStartDate = new Date(date);

    if(date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()){
      currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    renderMiniCalendar();
    renderWeekView();
  }

  /* ── Select Slot ──────────────────────────────────────────────── */
  function selectSlot(dateStr, time){
    document.querySelectorAll('.se-cal-slot-selected').forEach(function(s){
      s.classList.remove('se-cal-slot-selected');
    });

    var slot = document.querySelector('.se-cal-slot[data-date="' + dateStr + '"][data-time="' + time + '"]');
    if(slot) slot.classList.add('se-cal-slot-selected');

    var parts = dateStr.split('-');
    var date = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));

    SE_SELECTED_DATE = dateStr;
    SE_SELECTED_TIME = time;

    document.getElementById('se-cal-selected-date').textContent = DAYS[date.getDay()] + ', ' + MONTHS[date.getMonth()] + ' ' + date.getDate();
    document.getElementById('se-cal-selected-time-text').textContent = time + ' (30 min tour)';

    openFormPanel();
  }

  /* ── Form Panel ───────────────────────────────────────────────── */
  function openFormPanel(){
    document.getElementById('se-cal-overlay').classList.add('se-cal-open');
    document.getElementById('se-cal-form-panel').classList.add('se-cal-open');
    document.body.classList.add('se-cal-panel-open');
    document.body.style.overflow = 'hidden';
    var heardSelect = document.getElementById('se-cal-heard');
    heardSelect.selectedIndex = 0;
    document.getElementById('se-cal-page1').style.display = 'block';
    document.getElementById('se-cal-page2').style.display = 'none';
  }

  function closeFormPanel(){
    document.getElementById('se-cal-overlay').classList.remove('se-cal-open');
    document.getElementById('se-cal-form-panel').classList.remove('se-cal-open');
    document.body.classList.remove('se-cal-panel-open');
    document.body.style.overflow = '';
  }

  document.getElementById('se-cal-form-close').addEventListener('click', closeFormPanel);
  document.getElementById('se-cal-overlay').addEventListener('click', closeFormPanel);

  /* ── Phone auto-format ──────────────────────────────────────────── */
  var phoneInput = document.getElementById('se-cal-phone');
  phoneInput.addEventListener('input', function(){
    var v = this.value.replace(/\D/g, '');
    if(v.length >= 6) this.value = '(' + v.slice(0,3) + ') ' + v.slice(3,6) + '-' + v.slice(6,10);
    else if(v.length >= 3) this.value = '(' + v.slice(0,3) + ') ' + v.slice(3);
    else this.value = v;
  });

  /* ══════════════════════════════════════════════════════════════════ */
  /* INLINE FIELD-LEVEL VALIDATION HELPERS                            */
  /* ══════════════════════════════════════════════════════════════════ */
  function seFieldEl(ref){
    if(!ref) return null;
    if(typeof ref === 'string'){ return document.getElementById(ref); }
    return ref;
  }
  function seClearError(ref){
    var el = seFieldEl(ref);
    if(!el) return;
    el.classList.remove('se-invalid');
    el.removeAttribute('aria-invalid');
    if(el._seErrMsg && el._seErrMsg.parentNode){
      el._seErrMsg.parentNode.removeChild(el._seErrMsg);
    }
    el._seErrMsg = null;
  }
  function seShowError(ref, message, anchorRef){
    var el = seFieldEl(ref);
    if(!el) return;
    seClearError(el);
    el.classList.add('se-invalid');
    el.setAttribute('aria-invalid', 'true');
    var anchor = anchorRef ? seFieldEl(anchorRef) : el;
    if(!anchor) anchor = el;
    var msg = document.createElement('div');
    msg.className = 'se-field-error';
    msg.setAttribute('role', 'alert');
    msg.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
    msg.querySelector('span').textContent = message;
    if(anchor.parentNode){
      anchor.parentNode.insertBefore(msg, anchor.nextSibling);
    }
    el._seErrMsg = msg;
    var clear = function(){
      seClearError(el);
      el.removeEventListener('input', clear);
      el.removeEventListener('change', clear);
    };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  }
  function seFocusFirst(ref){
    var el = seFieldEl(ref);
    if(!el) return;
    try { el.focus({ preventScroll: true }); } catch(e){ el.focus(); }
    if(el.scrollIntoView){ el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  function seFail(ref, message, anchorRef){
    seShowError(ref, message, anchorRef);
    seFocusFirst(ref);
    return undefined;
  }

  /* ── How Heard → show/hide referral ─────────────────────────────── */
  document.getElementById('se-cal-heard').addEventListener('change', function(){
    document.getElementById('se-cal-ref-wrap').style.display = this.value === 'Friends/Family' ? 'block' : 'none';
  });

  /* ── Continue to Interests (Page 2) ──────────────────────────────── */
  document.getElementById('se-cal-continue').addEventListener('click', function(){
    var fn = document.getElementById('se-cal-fname').value.trim();
    var ln = document.getElementById('se-cal-lname').value.trim();
    var em = document.getElementById('se-cal-email').value.trim();
    var ph = document.getElementById('se-cal-phone').value.trim();
    var heard = document.getElementById('se-cal-heard').value;

    if(!fn){ return seFail('se-cal-fname', 'Please enter your first name'); }
    if(!ln){ return seFail('se-cal-lname', 'Please enter your last name'); }
    if(!em || em.indexOf('@') < 0){ return seFail('se-cal-email', 'Please enter a valid email'); }
    if(ph.replace(/\D/g,'').length !== 10){ return seFail('se-cal-phone', 'Please enter a valid 10-digit phone'); }
    if(!heard){ return seFail('se-cal-heard', 'Please select how you heard about us'); }

    document.getElementById('se-cal-page1').style.display = 'none';
    document.getElementById('se-cal-page2').style.display = 'block';
  });

  /* ── Back to Info (Page 1) ───────────────────────────────────────── */
  document.getElementById('se-cal-back').addEventListener('click', function(){
    document.getElementById('se-cal-page2').style.display = 'none';
    document.getElementById('se-cal-page1').style.display = 'block';
    document.getElementById('se-cal-error').style.display = 'none';
  });

  /* ── Referral Verification ──────────────────────────────────────── */
  document.getElementById('se-cal-ref-btn').addEventListener('click', function(){
    var input = document.getElementById('se-cal-referral');
    var status = document.getElementById('se-cal-ref-status');
    var btn = this;
    var val = input.value.trim();

    if (!val) {
      status.style.display = 'block';
      status.style.background = '#fef2f2';
      status.style.color = '#dc2626';
      status.textContent = "Please enter the member's email or phone.";
      return;
    }

    var origHtml = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;animation:seBkSpin 0.8s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="31" stroke-dashoffset="10"/></svg>';
    status.style.display = 'block';
    status.style.background = '#f8fafc';
    status.style.color = '#64748b';
    status.textContent = 'Searching...';

    var searchType = val.indexOf('@') >= 0 ? 'email' : (val.replace(/\D/g,'').length >= 7 ? 'phone' : 'name');
    var normalizedVal = searchType === 'email' ? val.trim().toLowerCase() : (searchType === 'phone' ? val.replace(/\D/g,'') : val.trim());

    fetch(SE_URL + '/functions/v1/validate-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SE_KEY, 'Authorization': 'Bearer ' + SE_KEY },
      body: JSON.stringify({ search_type: searchType, search_value: normalizedVal })
    })
    .then(function(r){
      return r.json()
        .then(function(data){ return { ok: r.ok, data: data }; })
        .catch(function(){ return { ok: r.ok, data: null }; });
    })
    .then(function(res){
      var d = res.data || {};
      btn.innerHTML = origHtml;
      if(!res.ok){
        SE_REF_ID = null; SE_REF_REFID = null; SE_REF_NAME = ''; SE_REF_EMAIL = null; SE_REF_PHONE = null;
        status.style.background = '#fffbeb'; status.style.color = '#b45309';
        status.textContent = d.message || 'Referral lookup unavailable right now.';
        input.style.borderColor = '#f59e0b';
        return;
      }
      if(d.found){
        SE_REF_ID = d.member.id;
        SE_REF_REFID = d.member.ref_id || null;
        SE_REF_NAME = (d.member.first_name || '') + ' ' + (d.member.last_name || '');
        SE_REF_EMAIL = d.member.email || null;
        SE_REF_PHONE = d.member.cell_phone || null;
        status.style.background = '#f0fdf4'; status.style.color = '#16a34a';
        status.innerHTML = '<span style="display:flex;align-items:center;gap:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Member matched: <strong>' + SE_REF_NAME.trim() + '</strong></span>';
        input.style.borderColor = '#22c55e';
      } else if(d.noted){
        SE_REF_ID = null; SE_REF_REFID = null; SE_REF_NAME = ''; SE_REF_EMAIL = null; SE_REF_PHONE = null;
        status.style.background = '#fef2f2'; status.style.color = '#dc2626';
        status.textContent = "Please enter the member's email or phone.";
        input.style.borderColor = '#e2e8f0';
      } else {
        SE_REF_ID = null; SE_REF_REFID = null; SE_REF_NAME = ''; SE_REF_EMAIL = null; SE_REF_PHONE = null;
        status.style.background = '#fffbeb'; status.style.color = '#b45309';
        status.textContent = 'No member found with that email or phone.';
        input.style.borderColor = '#f59e0b';
      }
    })
    .catch(function(){
      btn.innerHTML = origHtml;
      status.style.background = '#fffbeb'; status.style.color = '#b45309';
      status.textContent = "Could not verify right now — we'll follow up.";
    });
  });

  /* ── Submit ─────────────────────────────────────────────────────── */
  document.getElementById('se-cal-submit').addEventListener('click', function(){
    var fn = document.getElementById('se-cal-fname').value.trim();
    var ln = document.getElementById('se-cal-lname').value.trim();
    var em = document.getElementById('se-cal-email').value.trim();
    var ph = document.getElementById('se-cal-phone').value.trim();
    var heard = document.getElementById('se-cal-heard').value;
    var consent = document.getElementById('se-cal-consent');
    var errEl = document.getElementById('se-cal-error');
    var submitBtn = document.getElementById('se-cal-submit');

    if(!fn){ return seFail('se-cal-fname', 'Please enter your first name'); }
    if(!ln){ return seFail('se-cal-lname', 'Please enter your last name'); }
    if(!em || em.indexOf('@') < 0){ return seFail('se-cal-email', 'Please enter a valid email'); }
    if(ph.replace(/\D/g,'').length !== 10){ return seFail('se-cal-phone', 'Please enter a valid 10-digit phone'); }
    if(!heard){ return seFail('se-cal-heard', 'Please select how you heard about us'); }
    if(!consent.checked){ seShowError('se-cal-consent', 'Please accept the terms to continue', 'se-cal-consent-wrap'); seFocusFirst('se-cal-consent'); return; }
    errEl.style.display = 'none';

    submitBtn.style.pointerEvents = 'none'; submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;animation:seBkSpin 0.8s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="31" stroke-dashoffset="10"/></svg> Booking...';

    var refInput = document.getElementById('se-cal-referral');
    var interests = [];
    var interestEls = document.querySelectorAll('input[name="se-cal-interest"]:checked');
    for(var i = 0; i < interestEls.length; i++){
      var interestEl = interestEls[i];
      interests.push(interestEl.getAttribute('data-crm') || interestEl.value);
    }
    var interestOther = document.getElementById('se-cal-interest-other');
    if(interestOther && interestOther.value.trim()){
      var otherVals = interestOther.value.trim().split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      for(var j = 0; j < otherVals.length; j++){ interests.push(otherVals[j]); }
    }

    var payload = {
      first_name: fn,
      last_name: ln,
      email: em,
      cell_phone: ph,
      preferred_date: SE_SELECTED_DATE,
      preferred_time: SE_SELECTED_TIME,
      how_heard: heard || null,
      interests: interests.length > 0 ? interests.join(', ') : null,
      referral_member: (refInput && refInput.value.trim()) ? (SE_REF_NAME || refInput.value.trim()) : null,
      referral_member_id: SE_REF_ID || null,
      referral_member_ref_id: SE_REF_REFID || null,
      referral_member_email: SE_REF_EMAIL || null,
      referral_member_phone: SE_REF_PHONE || null,
      send_texts: '1',
      send_calls: '1',
      send_emails: 'now',
      source_page: window.location.href,
      device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
      utm_source: (new URLSearchParams(window.location.search)).get('utm_source'),
      utm_medium: (new URLSearchParams(window.location.search)).get('utm_medium'),
      utm_campaign: (new URLSearchParams(window.location.search)).get('utm_campaign')
    };

    fetch(SE_URL + '/functions/v1/book-tour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SE_KEY, 'Authorization': 'Bearer ' + SE_KEY },
      body: JSON.stringify(payload)
    })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, data: d }; }); })
    .then(function(res){
      if(res.ok && res.data.success){
        document.getElementById('se-cal-form-content').style.display = 'none';
        var parts = SE_SELECTED_DATE.split('-');
        var dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        document.getElementById('se-cal-success-detail').textContent = DAYS[dateObj.getDay()] + ', ' + MONTHS[dateObj.getMonth()] + ' ' + dateObj.getDate() + ' at ' + SE_SELECTED_TIME;
        var headingEl = document.querySelector('#se-cal-success h3');
        if(headingEl && res.data.appointment_rescheduled){
          headingEl.textContent = 'Rescheduled! See you then.';
        }
        document.getElementById('se-cal-success').style.display = 'block';
      } else {
        errEl.textContent = res.data.error || 'Something went wrong. Please try again.';
        errEl.style.display = 'block';
        resetBtn();
      }
    })
    .catch(function(){
      errEl.textContent = 'Network error — please check your connection.';
      errEl.style.display = 'block';
      resetBtn();
    });

    function resetBtn(){
      submitBtn.style.pointerEvents = ''; submitBtn.style.opacity = '1';
      submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><polyline points="20 6 9 17 4 12"/></svg> Confirm Tour';
    }
  });

  /* ── Initialize ───────────────────────────────────────────────── */
  renderMiniCalendar();
  renderWeekView();

})();

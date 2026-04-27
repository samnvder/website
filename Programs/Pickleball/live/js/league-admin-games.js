/**
 * League admin — weekly matchups + scores (openplay_se/league_games). Admin-only writes via RTDB rules.
 */
(function () {
  var NS = 'openplay_se';
  var gamesRef = null;
  var cache = {};
  var currentWeek = '1';
  var unsub = null;
  var wired = false;

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function db() {
    if (!window.SEOpenPlay || typeof SEOpenPlay.getFirebaseDb !== 'function') return null;
    return SEOpenPlay.getFirebaseDb();
  }

  function nowTs() {
    return window.firebase && window.firebase.database
      ? window.firebase.database.ServerValue.TIMESTAMP
      : Date.now();
  }

  function weekSelectEl() {
    return document.getElementById('league-admin-week');
  }

  function getWeek() {
    var el = weekSelectEl();
    return (el && el.value) || currentWeek || '1';
  }

  function setWeek(w) {
    currentWeek = w;
    var el = weekSelectEl();
    if (el) el.value = w;
  }

  function gamesForWeek() {
    var wk = getWeek();
    return Object.keys(cache)
      .map(function (id) {
        return { id: id, g: cache[id] || {} };
      })
      .filter(function (row) {
        return String(row.g.weekKey || '') === String(wk);
      })
      .sort(function (a, b) {
        return (a.g.updatedAt || 0) - (b.g.updatedAt || 0);
      });
  }

  function renderTable() {
    var host = document.getElementById('league-games-tbody');
    var empty = document.getElementById('league-games-empty');
    if (!host) return;
    var rows = gamesForWeek();
    host.innerHTML = '';
    if (!rows.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    rows.forEach(function (row) {
      var g = row.g;
      var tr = document.createElement('tr');
      tr.setAttribute('data-game-id', row.id);
      tr.innerHTML =
        '<td>' +
        esc(String(g.divisionKey || '')) +
        '</td><td>' +
        esc(String(g.draw || '')) +
        '</td><td>' +
        esc(String(g.homeTeam || '')) +
        '</td><td>' +
        esc(String(g.awayTeam || '')) +
        '</td><td><input type="number" class="league-g-score" data-field="homeScore" min="0" max="99" step="1" value="' +
        (typeof g.homeScore === 'number' ? esc(String(g.homeScore)) : '') +
        '" aria-label="Home score"></td><td><input type="number" class="league-g-score" data-field="awayScore" min="0" max="99" step="1" value="' +
        (typeof g.awayScore === 'number' ? esc(String(g.awayScore)) : '') +
        '" aria-label="Away score"></td><td><label class="league-g-final-lab"><input type="checkbox" class="league-g-final" data-field="final"' +
        (g.final ? ' checked' : '') +
        '> Final</label></td><td><button type="button" class="btn btn-neon league-g-save">Save</button> <button type="button" class="btn btn-ghost league-g-del">Delete</button></td>';
      tr.querySelector('.league-g-save').addEventListener('click', function () {
        saveRow(row.id, tr);
      });
      tr.querySelector('.league-g-del').addEventListener('click', function () {
        removeGame(row.id);
      });
      host.appendChild(tr);
    });
  }

  function readRow(tr) {
    var homeScore = tr.querySelector('[data-field="homeScore"]');
    var awayScore = tr.querySelector('[data-field="awayScore"]');
    var fin = tr.querySelector('.league-g-final');
    var hs = homeScore && homeScore.value !== '' ? parseInt(homeScore.value, 10) : null;
    var ase = awayScore && awayScore.value !== '' ? parseInt(awayScore.value, 10) : null;
    return {
      homeScore: typeof hs === 'number' && !isNaN(hs) ? hs : null,
      awayScore: typeof ase === 'number' && !isNaN(ase) ? ase : null,
      final: fin && fin.checked
    };
  }

  function saveRow(id, tr) {
    var extra = readRow(tr);
    var d = db();
    if (!d) return;
    var base = cache[id] || {};
    var patch = {
      homeScore: extra.homeScore,
      awayScore: extra.awayScore,
      final: !!extra.final,
      updatedAt: nowTs()
    };
    d.ref(NS + '/league_games/' + id)
      .update(patch)
      .then(function () {
        setMsg('Saved.', false);
      })
      .catch(function (e) {
        setMsg((e && e.message) || 'Save failed', true);
      });
  }

  function removeGame(id) {
    if (!confirm('Delete this matchup?')) return;
    var d = db();
    if (!d) return;
    d.ref(NS + '/league_games/' + id)
      .remove()
      .then(function () {
        setMsg('Deleted.', false);
      })
      .catch(function (e) {
        setMsg((e && e.message) || 'Delete failed', true);
      });
  }

  function setMsg(text, isErr) {
    var el = document.getElementById('league-games-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg' + (isErr ? ' err' : ' ok');
  }

  function addGame() {
    var div = document.getElementById('league-add-division');
    var draw = document.getElementById('league-add-draw');
    var home = document.getElementById('league-add-home');
    var away = document.getElementById('league-add-away');
    var d = db();
    if (!d) return;
    var divisionKey = div && div.value ? div.value : '3.0';
    var drawV = draw && draw.value ? draw.value : 'womens';
    var ht = home && home.value ? home.value.trim() : '';
    var at = away && away.value ? away.value.trim() : '';
    if (!ht || !at) {
      setMsg('Enter home and away team names.', true);
      return;
    }
    var wk = getWeek();
    var ref = d.ref(NS + '/league_games').push();
    var payload = {
      schemaVersion: 1,
      weekKey: wk,
      weekLabel: 'Week ' + wk,
      divisionKey: divisionKey,
      draw: drawV,
      homeTeam: ht,
      awayTeam: at,
      homeScore: null,
      awayScore: null,
      final: false,
      createdAt: nowTs(),
      updatedAt: nowTs()
    };
    ref
      .set(payload)
      .then(function () {
        if (home) home.value = '';
        if (away) away.value = '';
        setMsg('Matchup added.', false);
      })
      .catch(function (e) {
        setMsg((e && e.message) || 'Add failed', true);
      });
  }

  function wireListener() {
    if (unsub) {
      try {
        unsub();
      } catch (e) {}
      unsub = null;
    }
    var d = db();
    if (!d) return;
    var ref = d.ref(NS + '/league_games');
    unsub = ref.on('value', function (snap) {
      cache = snap.val() || {};
      renderTable();
    });
  }

  function showSection(which) {
    var teams = document.getElementById('admin-section-teams');
    var scores = document.getElementById('admin-section-scores');
    if (teams) teams.classList.toggle('hidden', which !== 'teams');
    if (scores) scores.classList.toggle('hidden', which !== 'scores');
    document.querySelectorAll('.sub-nav a[data-section]').forEach(function (a) {
      var on = a.getAttribute('data-section') === which;
      a.classList.toggle('active', on);
    });
  }

  function onHash() {
    var h = (window.location.hash || '').replace(/^#/, '') || 'team-management';
    if (h === 'schedule-scores' || h === 'scores') showSection('scores');
    else showSection('teams');
  }

  function init() {
    if (wired) return;
    wired = true;
    var wk = weekSelectEl();
    if (wk) {
      wk.addEventListener('change', function () {
        setWeek(wk.value);
        renderTable();
      });
    }
    var addBtn = document.getElementById('league-add-btn');
    if (addBtn) addBtn.addEventListener('click', addGame);
    document.querySelectorAll('.sub-nav a[data-section]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var sec = a.getAttribute('data-section');
        if (sec === 'scores') {
          window.location.hash = 'schedule-scores';
        } else {
          window.location.hash = 'team-management';
        }
        onHash();
      });
    });
    window.addEventListener('hashchange', onHash);
    onHash();
  }

  function startAfterAuth() {
    if (!db()) return;
    init();
    wireListener();
  }

  if (typeof window !== 'undefined') {
    window.LeagueAdminGames = { startAfterAuth: startAfterAuth };
  }
})(typeof window !== 'undefined' ? window : this);

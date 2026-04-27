/**
 * League standings — division + draw filters; data from openplay_se/league_games (admin-maintained).
 */
(function () {
  var NS = 'openplay_se';
  var DIVS = [
    { key: '3.0', label: '3.0', title: '3.0 division' },
    { key: '3.5', label: '3.5', title: '3.5 division' },
    { key: '4.0', label: '4.0', title: '4.0 division' },
    { key: 'open', label: 'Open', title: 'Open (5.0+)' }
  ];
  var CATS = [
    { key: 'all', label: 'All' },
    { key: 'womens', label: "Women's" },
    { key: 'mens', label: "Men's" },
    { key: 'mixed', label: 'Mixed' }
  ];

  var gamesVal = null;
  var aggregated = {};
  var authUser = null;
  var gamesUnsub = null;

  function standingsSignInHref() {
    try {
      var path = String(window.location && window.location.pathname ? window.location.pathname : '').replace(/\\/g, '/');
      if (
        /southend_league_standings\.html$/i.test(path) ||
        (path.indexOf('/Programs/Pickleball/live/league-play') !== -1 && /\.html$/i.test(path)) ||
        path.indexOf('/testing/local-page') !== -1
      ) {
        return '../SouthEnd_OpenPlay_Account.html?return=SouthEnd_League_Standings.html';
      }
    } catch (e) {}
    return '/open-play/account?return=' + encodeURIComponent('/league-play/standings');
  }

  function pct(w, l) {
    var g = w + l;
    if (!g) return '—';
    return (w / g).toFixed(3);
  }

  function sortRows(rows) {
    return rows
      .map(function (r, i) {
        return { i: i, r: r };
      })
      .sort(function (a, b) {
        var aw = a.r.w;
        var bw = b.r.w;
        var al = a.r.l;
        var bl = b.r.l;
        var ap = aw + al;
        var bp = bw + bl;
        var apct = ap ? aw / ap : 0;
        var bpct = bp ? bw / bp : 0;
        if (bpct !== apct) return bpct - apct;
        if (bw !== aw) return bw - aw;
        return (b.r.pd || 0) - (a.r.pd || 0);
      })
      .map(function (x) {
        return x.r;
      });
  }

  function withGamesBehind(sorted) {
    if (!sorted.length) return [];
    var leadW = sorted[0].w;
    var leadL = sorted[0].l;
    return sorted.map(function (row) {
      var gb = 0;
      if (row.w < leadW || row.l > leadL) {
        var half = (leadW - row.w + (row.l - leadL)) / 2;
        gb = Math.max(0, half);
      }
      var out = {
        team: row.team,
        w: row.w,
        l: row.l,
        strk: row.strk,
        pd: row.pd,
        pct: pct(row.w, row.l),
        gb: gb === 0 ? '—' : gb % 1 === 0 ? String(gb) : gb.toFixed(1)
      };
      if (row.draw) out.draw = row.draw;
      return out;
    });
  }

  /**
   * Build { divisionKey: { womens: Row[], mens, mixed } } from RTDB league_games.
   */
  function aggregateFromGames(val) {
    var maps = {};
    function ensureMap(div, draw) {
      var k = div + '|' + draw;
      if (!maps[k]) maps[k] = {};
      return maps[k];
    }
    Object.keys(val || {}).forEach(function (gid) {
      var g = val[gid];
      if (!g || g.schemaVersion !== 1) return;
      if (!g.final) return;
      var hs = g.homeScore;
      var as = g.awayScore;
      if (typeof hs !== 'number' || typeof as !== 'number') return;
      var div = String(g.divisionKey || '').trim();
      var draw = String(g.draw || '').trim();
      var ht = String(g.homeTeam || '').trim();
      var at = String(g.awayTeam || '').trim();
      if (!div || !draw || !ht || !at) return;
      if (draw !== 'womens' && draw !== 'mens' && draw !== 'mixed') return;
      var m = ensureMap(div, draw);
      [ht, at].forEach(function (nm) {
        if (!m[nm]) m[nm] = { w: 0, l: 0, pd: 0, games: [] };
      });
      var ts = typeof g.updatedAt === 'number' ? g.updatedAt : typeof g.playedAt === 'number' ? g.playedAt : 0;
      if (hs > as) {
        m[ht].w++;
        m[at].l++;
        m[ht].games.push({ t: ts, win: true });
        m[at].games.push({ t: ts, win: false });
      } else if (as > hs) {
        m[at].w++;
        m[ht].l++;
        m[at].games.push({ t: ts, win: true });
        m[ht].games.push({ t: ts, win: false });
      } else {
        m[ht].games.push({ t: ts, win: null });
        m[at].games.push({ t: ts, win: null });
      }
      m[ht].pd += hs - as;
      m[at].pd += as - hs;
    });

    var result = {};
    Object.keys(maps).forEach(function (mk) {
      var p = mk.split('|');
      var div = p[0];
      var draw = p[1];
      if (!result[div]) result[div] = { womens: [], mens: [], mixed: [] };
      var rows = Object.keys(maps[mk]).map(function (name) {
        var s = maps[mk][name];
        s.games.sort(function (a, b) {
          return b.t - a.t;
        });
        var strk = '—';
        if (s.games.length) {
          var bits = [];
          for (var i = 0; i < Math.min(5, s.games.length); i++) {
            var w = s.games[i].win;
            bits.push(w === true ? 'W' : w === false ? 'L' : 'T');
          }
          strk = bits.join('');
        }
        return { team: name, w: s.w, l: s.l, strk: strk, pd: s.pd };
      });
      result[div][draw] = rows;
    });
    return result;
  }

  function rawRowsFor(block, cat) {
    if (!block) block = { womens: [], mens: [], mixed: [] };
    if (cat === 'all') {
      return []
        .concat(
          (block.womens || []).map(function (r) {
            return { team: r.team, w: r.w, l: r.l, strk: r.strk, pd: r.pd, draw: "Women's" };
          })
        )
        .concat(
          (block.mens || []).map(function (r) {
            return { team: r.team, w: r.w, l: r.l, strk: r.strk, pd: r.pd, draw: "Men's" };
          })
        )
        .concat(
          (block.mixed || []).map(function (r) {
            return { team: r.team, w: r.w, l: r.l, strk: r.strk, pd: r.pd, draw: 'Mixed' };
          })
        );
    }
    return (block[cat] || []).map(function (r) {
      return { team: r.team, w: r.w, l: r.l, strk: r.strk, pd: r.pd };
    });
  }

  function parseParams() {
    var q = {};
    try {
      var s = (window.location && window.location.search) || '';
      s
        .replace(/^\?/, '')
        .split('&')
        .forEach(function (p) {
          var kv = p.split('=');
          if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
    } catch (e) {}
    return q;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setUrl(div, cat) {
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('div', div);
      u.searchParams.set('cat', cat);
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', u.pathname + u.search);
      }
    } catch (e) {}
  }

  function readState() {
    var q = parseParams();
    var div = q.div;
    var cat = (q.cat || 'womens').toLowerCase();
    if (!DIVS.some(function (d) { return d.key === div; })) div = '3.0';
    if (!CATS.some(function (c) { return c.key === cat; })) cat = 'womens';
    return { div: div, cat: cat };
  }

  function tableHtml(rows, showDraw) {
    if (!rows.length) {
      return '<p class="league-standings-empty">No completed matches for this division and draw yet.</p>';
    }
    var h =
      '<div class="league-standings-table-wrap" role="region" aria-label="Standings table" tabindex="0">' +
      '<table class="league-standings-table' +
      (showDraw ? ' league-standings-table--wide' : '') +
      '">' +
      '<thead><tr>' +
      '<th scope="col">#</th>' +
      (showDraw ? '<th scope="col">Draw</th>' : '') +
      '<th scope="col">Team</th>' +
      '<th scope="col">W</th>' +
      '<th scope="col">L</th>' +
      '<th scope="col">PCT</th>' +
      '<th scope="col">GB</th>' +
      '<th scope="col">STRK</th>' +
      '<th scope="col">PD</th>' +
      '</tr></thead><tbody>';
    rows.forEach(function (row, idx) {
      h +=
        '<tr><th scope="row" class="league-standings-rank">' +
        esc(String(idx + 1)) +
        '</th>' +
        (showDraw
          ? '<td class="league-standings-draw">' + esc(row.draw || '') + '</td>'
          : '') +
        '<td class="league-standings-team">' +
        esc(row.team) +
        '</td><td>' +
        esc(String(row.w)) +
        '</td><td>' +
        esc(String(row.l)) +
        '</td><td>' +
        esc(row.pct) +
        '</td><td>' +
        esc(row.gb) +
        '</td><td>' +
        esc(row.strk) +
        '</td><td>' +
        (row.pd > 0 ? '+' : '') +
        esc(String(row.pd)) +
        '</td></tr>';
    });
    h += '</tbody></table></div>';
    return h;
  }

  function renderTableOnly() {
    var st = readState();
    var out = document.getElementById('leagueStandingsTable');
    if (!out) return;

    if (!authUser) {
      out.innerHTML =
        '<p class="league-standings-hint">Sign in with your South End account to view standings. ' +
        '<a href="' + standingsSignInHref() + '">Open account / sign in</a></p>';
      return;
    }

    var block = aggregated[st.div] || { womens: [], mens: [], mixed: [] };
    var raw = rawRowsFor(block, st.cat);
    if (st.cat === 'all') {
      if (!raw.length) {
        out.innerHTML =
          '<p class="league-standings-empty">No data yet for any draw in this division. ' +
          'Staff can add matchups and scores in <strong>League Play Admin → Schedule &amp; scores</strong>.</p>';
        return;
      }
      out.innerHTML =
        '<p class="league-standings-hint">Combined list across <strong>Women&rsquo;s</strong>, <strong>Men&rsquo;s</strong>, and <strong>Mixed</strong> for this division. GB is relative to the #1 team in this view.</p>' +
        tableHtml(withGamesBehind(sortRows(raw)), true);
    } else {
      if (!raw.length) {
        out.innerHTML =
          '<p class="league-standings-empty">No completed matches for this draw yet. ' +
          'Results appear here after staff mark games final in <strong>League admin</strong>.</p>';
        return;
      }
      out.innerHTML = tableHtml(withGamesBehind(sortRows(raw)), false);
    }
  }

  function render() {
    var st = readState();
    var divEl = document.getElementById('leagueStandingsDivision');
    var catEl = document.getElementById('leagueStandingsCategory');
    var out = document.getElementById('leagueStandingsTable');

    if (divEl) {
      divEl.setAttribute('aria-label', 'Skill division');
      divEl.innerHTML = DIVS.map(function (d) {
        var sel = d.key === st.div;
        return (
          '<button type="button" role="tab" id="tab-div-' +
          d.key +
          '" aria-selected="' +
          (sel ? 'true' : 'false') +
          '" data-div="' +
          esc(d.key) +
          '" title="' +
          (d.key === 'open' ? 'Open (5.0+)' : d.title) +
          '">' +
          esc(d.key === 'open' ? 'Open' : d.label) +
          '</button>'
        );
      }).join('');

      divEl.querySelectorAll('button[data-div]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          st = readState();
          setUrl(btn.getAttribute('data-div') || '3.0', st.cat);
          render();
        });
      });
    }

    if (catEl) {
      catEl.setAttribute('aria-label', 'Match category');
      catEl.innerHTML = CATS.map(function (c) {
        var sel = c.key === st.cat;
        return (
          '<button type="button" role="tab" id="tab-cat-' +
          c.key +
          '" aria-selected="' +
          (sel ? 'true' : 'false') +
          '" data-cat="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          '</button>'
        );
      }).join('');

      catEl.querySelectorAll('button[data-cat]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          st = readState();
          setUrl(st.div, btn.getAttribute('data-cat') || 'womens');
          render();
        });
      });
    }

    if (out) {
      renderTableOnly();
    }
  }

  function wireGamesListener() {
    if (gamesUnsub) {
      try {
        gamesUnsub();
      } catch (e) {}
      gamesUnsub = null;
    }
    if (!window.firebase || !window.firebase.database) return;
    var ref = window.firebase.database().ref(NS + '/league_games');
    gamesUnsub = ref.on('value', function (snap) {
      gamesVal = snap.val() || {};
      aggregated = aggregateFromGames(gamesVal);
      renderTableOnly();
    });
  }

  function boot() {
    // Render the standings shell immediately so the page never appears blank
    // if Firebase/Auth scripts fail to initialize.
    render();

    if (!window.LEAGUE_FIREBASE_CONFIG || !window.LEAGUE_FIREBASE_CONFIG.apiKey) {
      var out = document.getElementById('leagueStandingsTable');
      if (out) {
        out.innerHTML = '<p class="league-standings-empty">League database is not configured on this build.</p>';
      }
      return;
    }
    if (!window.LeagueSync || !LeagueSync.init(window.LEAGUE_FIREBASE_CONFIG)) {
      var o2 = document.getElementById('leagueStandingsTable');
      if (o2) o2.innerHTML = '<p class="league-standings-empty">Could not start league data connection.</p>';
      return;
    }
    if (!window.firebase || !window.firebase.auth) {
      var o3 = document.getElementById('leagueStandingsTable');
      if (o3) {
        o3.innerHTML =
          '<p class="league-standings-empty">Standings service is temporarily unavailable. Please refresh and try again.</p>';
      }
      return;
    }
    window.firebase.auth().onAuthStateChanged(function (user) {
      authUser = user;
      if (user) {
        wireGamesListener();
      } else {
        if (gamesUnsub) {
          try {
            gamesUnsub();
          } catch (e) {}
          gamesUnsub = null;
        }
        aggregated = {};
      }
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

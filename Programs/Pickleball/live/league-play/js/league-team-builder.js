/**
 * Team creation + player lookup + invite UI (League).
 * Requires: league-firebase-config.js, south-end-league-sync.js, Firebase compat scripts (see HTML).
 */
(function (global) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? "#b00020" : "#1b5e20";
  }

  var TeamBuilder = {
    init: function (opts) {
      opts = opts || {};
      var L = global.LeagueSync;
      if (!L) {
        console.error("LeagueSync missing");
        return;
      }
      var teamId = opts.teamId;
      var teamName = opts.teamName || "your South End league team";
      if (!teamId) {
        setStatus(byId(opts.statusId), "Create a team first (fill form above).", true);
        return;
      }
      var searchInput = byId(opts.searchId);
      var results = byId(opts.resultsId);
      var inviteStatus = byId(opts.inviteStatusId);
      var emailInput = byId(opts.emailInputId);
      var emailBtn = byId(opts.emailBtnId);
      var emailStatus = byId(opts.emailStatusId);
      var lastLookup = null;

      function renderResults(rows) {
        if (!results) return;
        results.innerHTML = "";
        (rows || []).forEach(function (r) {
          if (L.getCurrentUser() && r.uid === L.getCurrentUser().uid) return;
          var li = document.createElement("li");
          li.className = "league-lookup__item";
          var name = (r.data && r.data.displayName) || "Unknown player";
          li.textContent = name;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn";
          btn.textContent = "Invite";
          btn.style.marginLeft = "0.5rem";
          btn.addEventListener("click", function () {
            doInvite(r.uid, btn);
          });
          li.appendChild(btn);
          results.appendChild(li);
        });
        if (results.children.length === 0) {
          var empty = document.createElement("p");
          empty.className = "help";
          empty.textContent = "No players found. They may not have set up a league profile yet.";
          results.appendChild(empty);
        }
      }

      function doSearch() {
        if (!searchInput) return;
        var q = searchInput.value;
        L.searchDirectoryByNameKey(q).then(renderResults).catch(function (e) {
          setStatus(inviteStatus, e && e.message ? e.message : "Search failed", true);
        });
      }

      function doInvite(targetUid, btn) {
        var u = L.getCurrentUser();
        if (!u) {
          setStatus(inviteStatus, "Sign in first.", true);
          return;
        }
        btn.disabled = true;
        btn.textContent = "Sending…";
        L.createInvite(u.uid, teamId, targetUid, null)
          .then(function (inviteId) {
            setStatus(inviteStatus, "Invite sent! The player will see it in their notifications (bell by their profile).");
            btn.disabled = false;
            btn.textContent = "Cancel invite";
            btn.className = "btn btn--secondary";
            btn.onclick = function () {
              btn.disabled = true;
              btn.textContent = "Canceling…";
              L.cancelInvite(inviteId, u.uid)
                .then(function () {
                  btn.textContent = "Canceled";
                  btn.disabled = true;
                  setStatus(inviteStatus, "Invite canceled.");
                })
                .catch(function (e) {
                  btn.disabled = false;
                  btn.textContent = "Cancel invite";
                  setStatus(inviteStatus, (e && e.message) || "Could not cancel.", true);
                });
            };
          })
          .catch(function (e) {
            setStatus(inviteStatus, e && e.message ? e.message : "Invite failed.", true);
            btn.disabled = false;
            btn.textContent = "Invite";
          });
      }

      function buildInviteUrl(inviteId) {
        var path = window.location.pathname.replace(/[^/]*$/, "SouthEnd_League_Overview.html");
        return window.location.origin + path + "?notifications=1&invite=" + encodeURIComponent(inviteId);
      }

      function openInviteEmail(toEmail, inviteId) {
        var url = buildInviteUrl(inviteId);
        var subject = "South End Pickleball League team invite";
        var body =
          "You have been invited to join " +
          teamName +
          " for South End Pickleball League Play.\n\n" +
          "Accept your invite here:\n" +
          url +
          "\n\nIf you do not have a South End Pickleball account yet, the link will take you through account setup first.";
        window.location.href =
          "mailto:" +
          encodeURIComponent(toEmail) +
          "?subject=" +
          encodeURIComponent(subject) +
          "&body=" +
          encodeURIComponent(body);
      }

      var pendingEmailInvite = null;

      function doEmailInvite() {
        var u = L.getCurrentUser();
        var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        if (!u) {
          setStatus(emailStatus, "Open your league account first.", true);
          return;
        }
        if (!email || email.indexOf("@") < 1) {
          setStatus(emailStatus, "Enter a valid player email.", true);
          return;
        }
        if (pendingEmailInvite && pendingEmailInvite === email) {
          pendingEmailInvite = null;
          emailBtn.textContent = "Send email invite";
          L.createInvite(u.uid, teamId, null, email)
            .then(function (id) {
              setStatus(emailStatus, "Invite created — opening your email with the link.");
              openInviteEmail(email, id);
            })
            .catch(function (e) {
              setStatus(emailStatus, e && e.message ? e.message : "Could not create invite.", true);
            });
          return;
        }
        pendingEmailInvite = email;
        emailBtn.textContent = "Confirm invite to " + email;
        setStatus(emailStatus, "Click again to confirm and open your email app.");
      }

      if (searchInput) {
        searchInput.addEventListener("input", function () {
          clearTimeout(lastLookup);
          lastLookup = setTimeout(doSearch, 300);
        });
        doSearch();
      }

      if (opts.syncBtnId) {
        var sb = byId(opts.syncBtnId);
        if (sb) {
          sb.addEventListener("click", function () {
            var u = L.getCurrentUser();
            if (!u) return;
            L.syncAcceptedInvitesToRoster(teamId, u.uid)
              .then(function (n) {
                setStatus(
                  byId(opts.rosterStatusId) || inviteStatus,
                  n ? "Roster updated (" + n + " player(s))." : "No new accepted players to add."
                );
              })
              .catch(function (e) {
                setStatus(
                  byId(opts.rosterStatusId) || inviteStatus,
                  e && e.message ? e.message : "Roster sync failed",
                  true
                );
              });
          });
        }
      }

      if (emailBtn) {
        emailBtn.addEventListener("click", doEmailInvite);
      }
      if (emailInput) {
        emailInput.addEventListener("input", function () {
          if (pendingEmailInvite) {
            pendingEmailInvite = null;
            if (emailBtn) emailBtn.textContent = "Send email invite";
            setStatus(emailStatus, "");
          }
        });
      }
    },
  };

  global.LeagueTeamBuilder = TeamBuilder;
})(window);

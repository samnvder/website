/**
 * South End League Play — Realtime DB + Auth helpers.
 * Namespace: openplay_se (shared with OpenPlay).
 */
(function (global) {
  "use strict";

  var NS = "openplay_se";
  var TERMS_VERSION = "league-2026-04-25";

  function rtdb() {
    if (!global.firebase || !global.firebase.database) {
      throw new Error("League is still loading. Try refreshing.");
    }
    return global.firebase.database();
  }

  function nowTs() {
    return Date.now();
  }

  function notificationStateForInviteStatus(status) {
    return status === "pending" ? "pending_action" : "resolved";
  }

  function notificationHrefForInvite(inviteId) {
    return "SouthEnd_League_Overview.html?notifications=1&invite=" + encodeURIComponent(inviteId);
  }

  function notificationRef(uid, notificationId) {
    return rtdb().ref(NS + "/user_notifications/" + uid + "/" + notificationId);
  }

  function buildLeagueInviteNotification(inviteId, invite, statusOverride) {
    var status = statusOverride || (invite && invite.status) || "pending";
    var ts = nowTs();
    return {
      schemaVersion: 1,
      type: "league_team_invite",
      state: notificationStateForInviteStatus(status),
      status: status,
      recipientUid: invite.toUid,
      actorUid: invite.fromUid,
      sourceType: "league_invite",
      sourceId: inviteId,
      teamId: invite.teamId,
      title: "Team roster invite",
      body: "You have a pending South End Pickleball League team invite.",
      actionHref: notificationHrefForInvite(inviteId),
      createdAt: invite.createdAt || ts,
      updatedAt: ts,
    };
  }

  function upsertLeagueInviteNotification(inviteId, invite, statusOverride) {
    if (!invite || !invite.toUid) return Promise.resolve();
    return notificationRef(invite.toUid, inviteId).update(buildLeagueInviteNotification(inviteId, invite, statusOverride));
  }

  function resolveLeagueInviteNotification(inviteId, invite, status) {
    if (!invite || !invite.toUid) return Promise.resolve();
    var ref = notificationRef(invite.toUid, inviteId);
    return ref.once("value").then(function (snap) {
      if (!snap.exists()) return null;
      return ref.update({
        state: "resolved",
        status: status,
        updatedAt: nowTs(),
        resolvedAt: nowTs(),
      });
    });
  }

  /** Mirror league milestones into openplay_se/users/{uid} when SEOpenPlay is loaded. */
  function syncOpenPlayUserAgg(uid, delta) {
    try {
      if (!uid || !global.SEOpenPlay || typeof global.SEOpenPlay.syncUserAggregateFromLeague !== "function") {
        return Promise.resolve();
      }
      return global.SEOpenPlay.syncUserAggregateFromLeague(uid, delta) || Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  }

  function toNameKey(displayName) {
    if (!displayName) return "";
    return String(displayName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function feeLabelForAllMembers(allMembers) {
    return allMembers
      ? "$200 — team is all members"
      : "$250 — team has any non-member";
  }

  function soloFeeLabelForMember(isMember) {
    return isMember
      ? "$50 — solo player member fee"
      : "$75 — solo player non-member fee";
  }

  /** League divisions — keep skill levels in ascending order, ending with Open (5.0+). */
  var DIVISIONS = [
    { id: "3.0-womens", label: "3.0 — Women's", category: "womens", day: "Monday", time: "10:00 AM – 12:00 PM" },
    { id: "3.0-mixed", label: "3.0 — Mixed (co-ed)", category: "coed", day: "Saturday", time: "2:00 PM – 4:00 PM" },
    { id: "3.5-womens", label: "3.5 — Women's", category: "womens", day: "Tuesday", time: "10:00 AM – 12:00 PM" },
    { id: "3.5-mixed", label: "3.5 — Mixed (co-ed)", category: "coed", day: "Saturday", time: "4:00 PM – 6:00 PM" },
    { id: "3.5-mens", label: "3.5 — Men's", category: "mens", day: "Sunday", time: "2:00 PM – 4:00 PM" },
    { id: "4.0-womens", label: "4.0 — Women's", category: "womens", day: "Wednesday", time: "10:00 AM – 12:00 PM" },
    { id: "4.0-mixed", label: "4.0 — Mixed (co-ed)", category: "coed", day: "Friday", time: "5:00 PM – 7:00 PM" },
    { id: "4.0-mens", label: "4.0 — Men's", category: "mens", day: "Sunday", time: "4:00 PM – 6:00 PM" },
    { id: "open-play-mixed", label: "Open (5.0+)", category: "coed", day: "Friday", time: "7:00 PM – 9:00 PM" },
  ];

  function formatDivisionSchedule(d) {
    if (!d) return "";
    return d.day + " · " + d.time;
  }

  /** local-page mirror: use sibling HTML files. Production: Hosting rewrites /account and /admin. */
  function isOpenPlayLocalMirror() {
    try {
      var p = global.location && global.location.pathname ? String(global.location.pathname) : "";
      return p.indexOf("/local-page/") !== -1 || p.indexOf("testing/local-page") !== -1;
    } catch (e) {
      return false;
    }
  }

  function adminHubHref() {
    return isOpenPlayLocalMirror() ? "../SouthEnd_Admin_Hub.html" : "/admin?v=20260427-admin-hub";
  }

  function mainPickleballAccountHrefWithReturn(returnHtml) {
    var ret = encodeURIComponent(returnHtml || "SouthEnd_Pickleball_Hub.html");
    if (isOpenPlayLocalMirror()) {
      return "../SouthEnd_OpenPlay_Account.html?return=" + ret;
    }
    return "/account?return=" + ret;
  }

  function mainPickleballAccountHref() {
    return mainPickleballAccountHrefWithReturn("SouthEnd_Pickleball_Hub.html");
  }

  function patchLeagueHeaderProfileHrefs() {
    if (!global.document) return;
    var url = mainPickleballAccountHref();
    var nodes = global.document.querySelectorAll("a.league-header-profile");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute("href", url);
    }
    var notice = global.document.querySelectorAll("a.league-header-notify");
    for (var j = 0; j < notice.length; j++) {
      notice[j].setAttribute("href", "#notifications");
    }
  }

  function loadLeagueAdminUidFlag(uid) {
    return rtdb()
      .ref(NS + "/admin_uids/" + uid)
      .once("value")
      .then(function (snap) {
        return snap.val() === true;
      })
      .catch(function () {
        return false;
      });
  }

  function ensureAdminNavLink() {
    var nav = global.document && global.document.querySelector("nav[data-se-hub-nav]");
    if (!nav) return null;
    var link = global.document.getElementById("league-admin-nav-link");
    if (!link) {
      link = global.document.createElement("a");
      link.id = "league-admin-nav-link";
      nav.appendChild(link);
    }
    link.className = "se-site-nav-link se-site-nav-link--admin hidden";
    link.href = adminHubHref();
    link.textContent = "Admin";
    return link;
  }

  function leagueRegisterLinks() {
    if (!global.document) return [];
    return Array.prototype.slice.call(
      global.document.querySelectorAll('.se-site-nav a[href="SouthEnd_League_Teams.html"]')
    );
  }

  var leagueNotifQueryRef = null;
  var leagueNotifValueListener = null;
  var leagueNotifRows = [];
  var leagueNotificationUser = null;
  var leagueNotificationPanel = null;

  function clearLeagueNotificationListener() {
    if (leagueNotifQueryRef && leagueNotifValueListener) {
      leagueNotifQueryRef.off("value", leagueNotifValueListener);
    }
    leagueNotifQueryRef = null;
    leagueNotifValueListener = null;
  }

  function closeLeagueNotificationPanel() {
    if (!leagueNotificationPanel) return;
    leagueNotificationPanel.classList.remove("is-open");
    leagueNotificationPanel.setAttribute("aria-hidden", "true");
    var bell = global.document.getElementById("league-header-notify");
    if (bell) bell.setAttribute("aria-expanded", "false");
  }

  function resolveTeamName(teamId) {
    if (!teamId || !LeagueSync || !LeagueSync.getTeam) return Promise.resolve("a league team");
    return LeagueSync.getTeam(teamId)
      .then(function (team) { return (team && team.name) || "a league team"; })
      .catch(function () { return "a league team"; });
  }

  function resolveCaptainName(uid) {
    if (!uid || !LeagueSync || !LeagueSync.getDirectoryEntry) return Promise.resolve("a captain");
    return LeagueSync.getDirectoryEntry(uid)
      .then(function (entry) {
        if (entry && entry.displayName) return entry.displayName;
        return LeagueSync.getUserProfile(uid).then(function (p) {
          return LeagueSync.buildDisplayName(p) || "a captain";
        });
      })
      .catch(function () { return "a captain"; });
  }

  function ensureLeagueNotificationPanel() {
    if (leagueNotificationPanel || !global.document) return leagueNotificationPanel;
    var wrap = global.document.createElement("div");
    wrap.className = "league-notification-panel";
    wrap.id = "league-notification-panel";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<div class="league-notification-panel__backdrop" data-notification-close></div>' +
      '<aside class="league-notification-panel__drawer" role="dialog" aria-modal="true" aria-labelledby="leagueNotificationTitle">' +
      '<div class="league-notification-panel__head">' +
      '<div><h2 id="leagueNotificationTitle">Notifications</h2>' +
      '<p>Invites and other pickleball updates will appear here.</p></div>' +
      '<button type="button" class="league-notification-panel__close" data-notification-close aria-label="Close notifications">&times;</button>' +
      '</div>' +
      '<div class="league-notification-panel__body" id="league-notification-panel-body"></div>' +
      '</aside>';
    wrap.addEventListener("click", function (e) {
      if (e.target && e.target.getAttribute("data-notification-close") !== null) {
        closeLeagueNotificationPanel();
      }
    });
    global.document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && wrap.classList.contains("is-open")) {
        closeLeagueNotificationPanel();
      }
    });
    global.document.body.appendChild(wrap);
    leagueNotificationPanel = wrap;
    return wrap;
  }

  function renderEmptyNotificationPanel(message) {
    var panel = ensureLeagueNotificationPanel();
    var body = panel && global.document.getElementById("league-notification-panel-body");
    if (!body) return;
    body.innerHTML = "";
    var empty = global.document.createElement("p");
    empty.className = "league-notification-empty";
    empty.textContent = message;
    body.appendChild(empty);
  }

  function renderGenericNotification(row, body) {
    var card = global.document.createElement("article");
    card.className = "league-notification-card";
    var title = global.document.createElement("h3");
    title.textContent = (row.data && row.data.title) || "Notification";
    var copy = global.document.createElement("p");
    copy.textContent = (row.data && row.data.body) || "Open this update for details.";
    card.appendChild(title);
    card.appendChild(copy);
    body.appendChild(card);
  }

  function renderInviteNotification(row, body) {
    var data = row.data || {};
    var card = global.document.createElement("article");
    card.className = "league-notification-card";
    var title = global.document.createElement("h3");
    title.textContent = "Team roster invite";
    var copy = global.document.createElement("p");
    copy.textContent = "Loading invite details...";
    card.appendChild(title);
    card.appendChild(copy);
    body.appendChild(card);
    Promise.all([resolveTeamName(data.teamId), resolveCaptainName(data.actorUid)]).then(function (results) {
      copy.textContent = results[0] + " invited you to join their league roster. Captain: " + results[1] + ".";
    });
    if (data.state !== "pending_action" || data.status !== "pending") {
      var status = global.document.createElement("p");
      status.className = "league-notification-card__status";
      status.textContent = data.status === "accepted"
        ? "Accepted"
        : data.status === "declined"
          ? "Declined"
          : data.status === "canceled"
            ? "Canceled"
            : "Resolved";
      card.appendChild(status);
      return;
    }
    var actions = global.document.createElement("div");
    actions.className = "league-notification-card__actions";
    var accept = global.document.createElement("button");
    accept.type = "button";
    accept.className = "btn";
    accept.textContent = "Accept";
    var decline = global.document.createElement("button");
    decline.type = "button";
    decline.className = "btn btn--secondary";
    decline.textContent = "Decline";
    actions.appendChild(accept);
    actions.appendChild(decline);
    card.appendChild(actions);
    function resolveInvite(shouldAccept) {
      if (!leagueNotificationUser || !leagueNotificationUser.uid) return;
      accept.disabled = true;
      decline.disabled = true;
      accept.textContent = shouldAccept ? "Accepting..." : "Accept";
      decline.textContent = shouldAccept ? "Decline" : "Declining...";
      LeagueSync.acceptOrDeclineInvite(data.sourceId || row.id, leagueNotificationUser.uid, shouldAccept)
        .catch(function (e) {
          accept.disabled = false;
          decline.disabled = false;
          accept.textContent = "Accept";
          decline.textContent = "Decline";
          copy.textContent = (e && e.message) || "Could not update this invite.";
        });
    }
    accept.addEventListener("click", function () { resolveInvite(true); });
    decline.addEventListener("click", function () { resolveInvite(false); });
  }

  function renderLeagueNotificationPanel() {
    if (!leagueNotificationUser || !leagueNotificationUser.uid) {
      renderEmptyNotificationPanel("Sign in to see your notifications.");
      return;
    }
    var panel = ensureLeagueNotificationPanel();
    var body = panel && global.document.getElementById("league-notification-panel-body");
    if (!body) return;
    body.innerHTML = "";
    if (!leagueNotifRows.length) {
      renderEmptyNotificationPanel("No notifications yet.");
      return;
    }
    leagueNotifRows.forEach(function (row) {
      if (row.data && row.data.type === "league_team_invite") {
        renderInviteNotification(row, body);
      } else {
        renderGenericNotification(row, body);
      }
    });
  }

  function openLeagueNotificationPanel() {
    var panel = ensureLeagueNotificationPanel();
    if (!panel) return;
    renderLeagueNotificationPanel();
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    var bell = global.document.getElementById("league-header-notify");
    if (bell) bell.setAttribute("aria-expanded", "true");
    var close = panel.querySelector(".league-notification-panel__close");
    if (close) close.focus();
  }

  function shouldOpenNotificationsFromLocation() {
    try {
      var q = new URLSearchParams(global.location.search || "");
      return q.get("notifications") === "1" || global.location.hash === "#notifications";
    } catch (e) {
      return global.location.hash === "#notifications";
    }
  }

  function wireLeagueNotificationBell(bell) {
    if (!bell || bell.getAttribute("data-notification-panel-wired") === "1") return;
    bell.setAttribute("data-notification-panel-wired", "1");
    bell.setAttribute("aria-haspopup", "dialog");
    bell.setAttribute("aria-expanded", "false");
    bell.addEventListener("click", function (e) {
      e.preventDefault();
      openLeagueNotificationPanel();
    });
  }

  function decorateLeagueNotificationBell(user) {
    if (
      global.SEOpenPlayNotifications &&
      typeof global.SEOpenPlayNotifications.syncUser === "function"
    ) {
      global.SEOpenPlayNotifications.syncUser(user || null);
      return;
    }
    if (!global.document) return;
    var bell = global.document.getElementById("league-header-notify");
    var badge = global.document.getElementById("league-header-notify-badge");
    leagueNotificationUser = user || null;
    clearLeagueNotificationListener();
    if (!bell) return;
    wireLeagueNotificationBell(bell);
    if (!user || !user.uid) {
      if (badge) {
        badge.textContent = "";
        badge.setAttribute("hidden", "");
        badge.setAttribute("aria-hidden", "true");
      }
      bell.setAttribute("aria-label", "Notifications — sign in to view invites");
      leagueNotifRows = [];
      if (leagueNotificationPanel && leagueNotificationPanel.classList.contains("is-open")) {
        renderLeagueNotificationPanel();
      }
      return;
    }
    var q = rtdb().ref(NS + "/user_notifications/" + user.uid).orderByChild("createdAt").limitToLast(50);
    leagueNotifValueListener = function (snap) {
      var n = 0;
      var rows = [];
      snap.forEach(function (c) {
        var d = c.val();
        rows.push({ id: c.key, data: d });
        if (d && (d.state === "pending_action" || d.state === "unread")) n += 1;
      });
      rows.sort(function (a, b) {
        return ((b.data && b.data.createdAt) || 0) - ((a.data && a.data.createdAt) || 0);
      });
      leagueNotifRows = rows;
      if (badge) {
        if (n > 0) {
          badge.textContent = n > 99 ? "99+" : String(n);
          badge.removeAttribute("hidden");
          badge.setAttribute("aria-hidden", "false");
        } else {
          badge.textContent = "";
          badge.setAttribute("hidden", "");
          badge.setAttribute("aria-hidden", "true");
        }
      }
      bell.setAttribute("aria-label", n > 0 ? "Notifications, " + n + " pending" : "Notifications");
      if (leagueNotificationPanel && leagueNotificationPanel.classList.contains("is-open")) {
        renderLeagueNotificationPanel();
      }
    };
    leagueNotifQueryRef = q;
    q.on("value", leagueNotifValueListener);
  }

  /** True once league_account has any registration or an assigned team. */
  function leagueAccountIsCommitted(account) {
    if (!account) return false;
    return !!(account.registrationStatus || account.teamId);
  }

  function applyLeagueRegisterNav(account) {
    var links = leagueRegisterLinks();
    links.forEach(function (link) {
      link.hidden = false;
      var onTeam = !!(account && account.teamId);
      var committed = leagueAccountIsCommitted(account);
      if (onTeam) {
        link.textContent = "View Team";
        link.href = "SouthEnd_League_Teams.html";
        link.setAttribute("aria-hidden", "false");
        link.tabIndex = 0;
        return;
      }
      if (committed) {
        link.hidden = true;
        link.setAttribute("aria-hidden", "true");
        link.tabIndex = -1;
        return;
      }
      link.textContent = "Register";
      link.href = "SouthEnd_League_Teams.html";
      link.setAttribute("aria-hidden", "false");
      link.tabIndex = 0;
    });
  }

  function decorateLeagueRegisterNav(user) {
    var links = leagueRegisterLinks();
    if (!user || !user.uid) {
      links.forEach(function (link) {
        link.hidden = false;
        link.textContent = "Register";
        link.href = "SouthEnd_League_Teams.html";
        link.setAttribute("aria-hidden", "false");
        link.tabIndex = 0;
      });
      return;
    }
    rtdb()
      .ref(NS + "/league_account/" + user.uid)
      .once("value")
      .then(function (snap) {
        applyLeagueRegisterNav(snap.val());
      })
      .catch(function () {
        links.forEach(function (link) {
          link.hidden = false;
          link.textContent = "Register";
          link.href = "SouthEnd_League_Teams.html";
        });
      });
  }

  function decorateLeagueAdminNav(user) {
    var navLink = ensureAdminNavLink();
    var oldMobileLink = global.document && global.document.getElementById("league-admin-mobile-link");
    if (oldMobileLink && oldMobileLink.parentNode) oldMobileLink.parentNode.removeChild(oldMobileLink);
    if (!user || !user.uid) {
      if (navLink) navLink.classList.add("hidden");
      return;
    }
    loadLeagueAdminUidFlag(user.uid).then(function (isAdmin) {
      if (navLink) {
        navLink.classList.toggle("hidden", !isAdmin);
        navLink.href = adminHubHref();
      }
    });
  }

  var LeagueSync = {
    NS: NS,
    TERMS_VERSION: TERMS_VERSION,
    DIVISIONS: DIVISIONS,
    toNameKey: toNameKey,
    feeLabelForAllMembers: feeLabelForAllMembers,
    soloFeeLabelForMember: soloFeeLabelForMember,
    formatDivisionSchedule: formatDivisionSchedule,

    getDivisionById: function (divisionId) {
      if (!divisionId) return null;
      var id = String(divisionId);
      for (var i = 0; i < DIVISIONS.length; i++) {
        if (DIVISIONS[i].id === id) return DIVISIONS[i];
      }
      return null;
    },

    init: function (config) {
      if (!global.firebase) {
        return false;
      }
      if (global.firebase.apps && global.firebase.apps.length > 0) {
        return true;
      }
      if (!config || !config.apiKey) {
        console.warn("League: missing LEAGUE_FIREBASE_CONFIG");
        return false;
      }
      global.firebase.initializeApp(config);
      return true;
    },

    onAuth: function (cb) {
      patchLeagueHeaderProfileHrefs();
      return global.firebase.auth().onAuthStateChanged(function (user) {
        patchLeagueHeaderProfileHrefs();
        decorateLeagueRegisterNav(user);
        decorateLeagueNotificationBell(user);
        if (user && shouldOpenNotificationsFromLocation()) {
          setTimeout(openLeagueNotificationPanel, 0);
        }
        decorateLeagueAdminNav(user);
        cb(user);
      });
    },

    leagueAccountIsCommitted: leagueAccountIsCommitted,
    isOpenPlayLocalMirror: isOpenPlayLocalMirror,
    adminHubHref: adminHubHref,
    mainPickleballAccountHrefWithReturn: mainPickleballAccountHrefWithReturn,
    mainPickleballAccountHref: mainPickleballAccountHref,
    redirectToMainPickleballAccount: function () {
      global.location.href = mainPickleballAccountHref();
    },
    redirectToMainPickleballAccountWithReturn: function (returnHtml) {
      global.location.href = mainPickleballAccountHrefWithReturn(returnHtml);
    },

    getCurrentUser: function () {
      return global.firebase.auth().currentUser;
    },

    signUp: function (email, password) {
      return global.firebase.auth().createUserWithEmailAndPassword(email, password);
    },

    signIn: function (email, password) {
      return global.firebase.auth().signInWithEmailAndPassword(email, password);
    },

    signOut: function () {
      return global.firebase.auth().signOut();
    },

    getLeagueAccount: function (uid) {
      return rtdb()
        .ref(NS + "/league_account/" + uid)
        .once("value")
        .then(function (s) { return s.val() || null; });
    },

    getUserProfile: function (uid) {
      return rtdb()
        .ref(NS + "/user_profiles/" + uid)
        .once("value")
        .then(function (s) { return s.val() || null; });
    },

    setTermsAccepted: function (uid) {
      var updates = {
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: nowTs(),
        updatedAt: nowTs(),
      };
      return rtdb()
        .ref(NS + "/league_account/" + uid)
        .update(updates);
    },

    saveSoloRegistration: function (uid, isMember, divisionId) {
      var div = this.getDivisionById(divisionId);
      if (!div) throw new Error("Choose a division.");
      var schedule = formatDivisionSchedule(div);
      return rtdb()
        .ref(NS + "/league_account/" + uid)
        .update({
          registrationType: "solo",
          registrationStatus: "registered",
          teamId: null,
          isMember: !!isMember,
          feeLabel: soloFeeLabelForMember(isMember),
          feeAmount: isMember ? 50 : 75,
          divisionId: div.id,
          divisionLabel: div.label,
          divisionDay: div.day,
          divisionTime: div.time,
          divisionSchedule: schedule,
          registeredAt: nowTs(),
          updatedAt: nowTs(),
        });
    },

    withdrawSoloRegistration: function (uid) {
      return this.getLeagueAccount(uid).then(function (acct) {
        if (!acct || acct.registrationType !== "solo" || acct.teamId) {
          throw new Error("No solo registration was found for this account.");
        }
        if (acct.adminMarkedPaid === true) {
          throw new Error("Contact league staff to change a registration after payment is recorded.");
        }
        return rtdb()
          .ref(NS + "/league_account/" + uid)
          .set(null);
      });
    },

    getDirectoryEntry: function (uid) {
      return rtdb()
        .ref(NS + "/league_directory/" + uid)
        .once("value")
        .then(function (s) { return s.val() || null; });
    },

    setDirectoryEntry: function (uid, displayName) {
      var nk = toNameKey(displayName);
      return rtdb()
        .ref(NS + "/league_directory/" + uid)
        .set({
          displayName: displayName,
          nameKey: nk,
          optInForSearch: true,
          updatedAt: nowTs(),
        });
    },

    buildDisplayName: function (profile) {
      if (!profile) return "";
      var first = String(profile.firstName || "").trim();
      var last = String(profile.lastName || "").trim();
      if (first || last) return [first, last].filter(Boolean).join(" ");
      return profile.displayName || profile.name || "";
    },

    syncProfileToDirectory: function (uid) {
      var self = this;
      return this.getDirectoryEntry(uid).then(function (existing) {
        if (existing && existing.displayName) return existing;
        return self.getUserProfile(uid).then(function (profile) {
          var name = self.buildDisplayName(profile);
          if (!name) {
            var u = global.firebase.auth().currentUser;
            if (u && u.uid === uid) name = u.displayName || "";
          }
          if (!name) return null;
          return self.setDirectoryEntry(uid, name);
        });
      }).catch(function () { return null; });
    },

    createTeam: function (captainUid, name, allMembers, divisionId) {
      var div = this.getDivisionById(divisionId);
      if (!div) throw new Error("Choose a division.");
      var schedule = formatDivisionSchedule(div);
      var teamId = "captain_" + captainUid;
      var teamRef = rtdb().ref(NS + "/league_teams/" + teamId);
      var feeLabel = feeLabelForAllMembers(allMembers);
      return this.getLeagueAccount(captainUid)
        .then(function (acct) {
          if (acct && acct.registrationStatus) {
            throw new Error("You're already signed up for league play.");
          }
          return teamRef.set({
            captainUid: captainUid,
            name: name,
            allMembers: !!allMembers,
            feeLabel: feeLabel,
            registrationType: "captain",
            status: "draft",
            createdAt: nowTs(),
            divisionId: div.id,
            divisionLabel: div.label,
            divisionDay: div.day,
            divisionTime: div.time,
            divisionSchedule: schedule,
          });
        })
        .then(function () {
          return rtdb()
            .ref(NS + "/league_account/" + captainUid)
            .update({
              registrationType: "captain",
              registrationStatus: "team_created",
              teamId: teamId,
              divisionId: div.id,
              divisionLabel: div.label,
              divisionDay: div.day,
              divisionTime: div.time,
              divisionSchedule: schedule,
              updatedAt: nowTs(),
            });
        })
        .then(function () {
          return syncOpenPlayUserAgg(captainUid, {
            teamId: teamId,
            registrationType: "captain",
            registrationStatus: "team_created",
          });
        })
        .then(function () {
          return { teamId: teamId, feeLabel: feeLabel };
        })
        .catch(function (err) {
          if (err && err.code === "PERMISSION_DENIED") {
            throw new Error("You're already signed up for league play.");
          }
          throw err;
        });
    },

    getTeam: function (teamId) {
      return rtdb()
        .ref(NS + "/league_teams/" + teamId)
        .once("value")
        .then(function (s) { return s.val(); });
    },

    /**
     * Listen for team changes (e.g. staff marking payment) — returns an unsubscribe.
     */
    subscribeTeam: function (teamId, onValue) {
      if (!teamId) {
        return function () {};
      }
      var r = rtdb().ref(NS + "/league_teams/" + teamId);
      function handler(snap) {
        onValue(snap.val() || null);
      }
      r.on("value", handler);
      return function () {
        r.off("value", handler);
      };
    },

    addPlayerToRoster: function (teamId, memberUid) {
      return rtdb()
        .ref(NS + "/league_teams/" + teamId + "/roster/" + memberUid)
        .set({
          joinedAt: nowTs(),
          role: "player",
        })
        .then(function () {
          return syncOpenPlayUserAgg(memberUid, {
            teamId: teamId,
            rosterRole: "player",
            registrationStatus: "on_roster",
          });
        });
    },

    deleteTeamAsCaptain: function (teamId, captainUid, confirmedTeamName) {
      var self = this;
      var teamRef = rtdb().ref(NS + "/league_teams/" + teamId);
      return teamRef.once("value").then(function (snap) {
        var team = snap.val();
        if (!team) throw new Error("Team not found.");
        if (team.captainUid !== captainUid) throw new Error("Only the captain can delete this team.");
        if (String(confirmedTeamName || "") !== String(team.name || "")) {
          throw new Error("Type the team name exactly to confirm deletion.");
        }
        var memberUids = {};
        memberUids[captainUid] = true;
        Object.keys(team.roster || {}).forEach(function (uid) {
          memberUids[uid] = true;
        });
        return self.listInvitesFromCaptain(captainUid).then(function (invites) {
          (invites || []).forEach(function (row) {
            if (!row.data || row.data.teamId !== teamId) return;
            if (row.data.toUid) {
              memberUids[row.data.toUid] = true;
            }
          });
          return Promise.all(
            Object.keys(memberUids).map(function (uid) {
              return self.getLeagueAccount(uid).then(function (account) {
                return { uid: uid, account: account };
              });
            })
          ).then(function (accounts) {
            var updates = {};
            updates[NS + "/league_teams/" + teamId] = null;
            accounts.forEach(function (row) {
              if (row.account && row.account.teamId === teamId) {
                updates[NS + "/league_account/" + row.uid] = null;
              }
            });
            (invites || []).forEach(function (row) {
              if (!row.data || row.data.teamId !== teamId) return;
              updates[NS + "/league_invites/" + row.id] = null;
              if (row.data.toUid) {
                updates[NS + "/user_notifications/" + row.data.toUid + "/" + row.id] = null;
              }
            });
            return rtdb().ref().update(updates);
          });
        });
      });
    },

    listTeamsForCaptain: function (captainUid) {
      return rtdb()
        .ref(NS + "/league_teams")
        .orderByChild("captainUid")
        .equalTo(captainUid)
        .once("value")
        .then(function (snap) {
          var out = [];
          snap.forEach(function (c) {
            out.push({ teamId: c.key, data: c.val() });
          });
          return out;
        });
    },

    searchDirectoryByNameKey: function (prefix) {
      var p = toNameKey(prefix);
      if (!p) return Promise.resolve([]);
      var end = p + "\uf8ff";
      return rtdb()
        .ref(NS + "/league_directory")
        .orderByChild("nameKey")
        .startAt(p)
        .endAt(end)
        .limitToFirst(20)
        .once("value")
        .then(function (snap) {
          var out = [];
          snap.forEach(function (c) {
            var v = c.val();
            if (v && v.nameKey) {
              out.push({ uid: c.key, data: v });
            }
          });
          return out;
        });
    },

    createInvite: function (fromUid, teamId, toUid, toEmail) {
      var ref = rtdb().ref(NS + "/league_invites").push();
      var normalizedEmail = toEmail ? String(toEmail).trim().toLowerCase() : null;
      var inviteData = null;
      return this.listInvitesFromCaptain(fromUid)
        .then(function (rows) {
          var sentForTeam = (rows || []).filter(function (row) {
            return row.data && row.data.teamId === teamId && row.data.status !== "canceled";
          });
          if (sentForTeam.length >= 5) {
            throw new Error("Max amount of invities permitted sent");
          }
          inviteData = {
            fromUid: fromUid,
            toUid: toUid || null,
            toEmail: normalizedEmail,
            teamId: teamId,
            status: "pending",
            createdAt: nowTs(),
          };
          return ref.set(inviteData);
        })
        .then(function () {
          return upsertLeagueInviteNotification(ref.key, inviteData, "pending");
        })
        .then(function () {
          return syncOpenPlayUserAgg(fromUid, {
            inviteId: ref.key,
            teamId: teamId,
            registrationStatus: "invite_sent",
          });
        })
        .then(function () {
          return ref.key;
        });
    },

    listNotificationsToUser: function (uid) {
      return rtdb()
        .ref(NS + "/user_notifications/" + uid)
        .orderByChild("createdAt")
        .limitToLast(50)
        .once("value")
        .then(function (snap) {
          var out = [];
          snap.forEach(function (c) {
            out.push({ id: c.key, data: c.val() });
          });
          out.sort(function (a, b) {
            return ((b.data && b.data.createdAt) || 0) - ((a.data && a.data.createdAt) || 0);
          });
          return out;
        });
    },

    markNotificationResolved: function (uid, notificationId, status) {
      return rtdb()
        .ref(NS + "/user_notifications/" + uid + "/" + notificationId)
        .update({
          state: "resolved",
          status: status || "resolved",
          updatedAt: nowTs(),
          resolvedAt: nowTs(),
        });
    },

    listInvitesToUser: function (toUid) {
      return rtdb()
        .ref(NS + "/league_invites")
        .orderByChild("toUid")
        .equalTo(toUid)
        .once("value")
        .then(function (snap) {
          var out = [];
          snap.forEach(function (c) {
            out.push({ id: c.key, data: c.val() });
          });
          return out;
        });
    },

    getInvite: function (inviteId) {
      return rtdb()
        .ref(NS + "/league_invites/" + inviteId)
        .once("value")
        .then(function (s) {
          return s.exists() ? { id: s.key, data: s.val() } : null;
        });
    },

    listInvitesFromCaptain: function (fromUid) {
      return rtdb()
        .ref(NS + "/league_invites")
        .orderByChild("fromUid")
        .equalTo(fromUid)
        .once("value")
        .then(function (snap) {
          var out = [];
          snap.forEach(function (c) {
            out.push({ id: c.key, data: c.val() });
          });
          return out;
        });
    },

    cancelInvite: function (inviteId, captainUid) {
      var ref = rtdb().ref(NS + "/league_invites/" + inviteId);
      return ref.once("value").then(function (s) {
        var v = s.val();
        if (!v) throw new Error("Invite not found.");
        if (v.fromUid !== captainUid) throw new Error("Only the captain can cancel this invite.");
        if (v.status !== "pending") throw new Error("This invite has already been resolved.");
        return ref.update({
          status: "canceled",
          canceledAt: nowTs(),
        }).then(function () {
          return resolveLeagueInviteNotification(inviteId, v, "canceled");
        });
      });
    },

    acceptOrDeclineInvite: function (inviteId, toUid, accept) {
      var self = this;
      var ref = rtdb().ref(NS + "/league_invites/" + inviteId);
      return ref
        .once("value")
        .then(function (s) {
          var v = s.val();
          if (!v) throw new Error("Invite not found");
          var currentEmail = global.firebase.auth().currentUser && global.firebase.auth().currentUser.email;
          var emailMatches = v.toEmail && currentEmail && String(v.toEmail).toLowerCase() === String(currentEmail).toLowerCase();
          if (v.toUid && v.toUid !== toUid) throw new Error("Not your invite");
          if (!v.toUid && !emailMatches) throw new Error("Use the invited email account to accept this invite");
          if (v.status !== "pending") throw new Error("Already resolved");
          var updates = {
            toUid: v.toUid || toUid,
            status: accept ? "accepted" : "declined",
            resolvedAt: nowTs(),
          };
          function applyAcceptanceToRoster() {
            return self.addPlayerToRoster(v.teamId, toUid).then(function () {
              return rtdb().ref(NS + "/league_account/" + toUid).update({
                registrationType: "team_member",
                registrationStatus: "invite_accepted",
                teamId: v.teamId,
                updatedAt: nowTs(),
              });
            });
          }
          function doUpdate() {
            return ref.update(updates).then(function () {
              var notificationSource = {
                toUid: v.toUid || toUid,
              };
              return resolveLeagueInviteNotification(inviteId, notificationSource, updates.status)
                .then(function () {
                  return syncOpenPlayUserAgg(toUid, {
                    inviteId: inviteId,
                    teamId: v.teamId,
                    registrationStatus: updates.status,
                  });
                })
                .then(function () {
                  if (!accept) return null;
                  return applyAcceptanceToRoster();
                });
            });
          }
          if (!accept) {
            return doUpdate();
          }
          return self.getLeagueAccount(toUid).then(function (acct) {
            if (
              acct &&
              acct.registrationType === "solo" &&
              !acct.teamId &&
              acct.adminMarkedPaid === true
            ) {
              throw new Error(
                "You have a paid solo registration. Ask league staff to move you to this team before accepting the invite online."
              );
            }
            return doUpdate();
          });
        });
    },

    /**
     * Captain-side: one-shot sync — add any accepted players not on roster.
     */
    syncAcceptedInvitesToRoster: function (teamId, captainUid) {
      var self = this;
      return this.listInvitesFromCaptain(captainUid).then(function (rows) {
        var pending = rows.filter(function (r) {
          return (
            r.data &&
            r.data.teamId === teamId &&
            r.data.status === "accepted" &&
            r.data.toUid
          );
        });
        if (!pending.length) return 0;
        return Promise.all(
          pending.map(function (r) {
            return self.addPlayerToRoster(teamId, r.data.toUid);
          })
        ).then(function () { return pending.length; });
      });
    },
  };

  global.LeagueSync = LeagueSync;

  function ensureOpenPlayProfileAdapter() {
    if (global.SEOpenPlay) return;

    function configReady() {
      return !!(global.LEAGUE_FIREBASE_CONFIG && global.LEAGUE_FIREBASE_CONFIG.apiKey);
    }

    function initFirebase() {
      if (!global.firebase) return Promise.resolve();
      if (global.firebase.apps && global.firebase.apps.length > 0) return Promise.resolve();
      LeagueSync.init(global.LEAGUE_FIREBASE_CONFIG);
      return Promise.resolve();
    }

    function dbRef(path) {
      return initFirebase().then(function () {
        if (!global.firebase || !global.firebase.database) throw new Error("Firebase unavailable");
        return global.firebase.database().ref(path);
      });
    }

    global.SEOpenPlay = {
      firebaseConfigured: function () {
        return configReady() || !!(global.firebase && global.firebase.apps && global.firebase.apps.length);
      },
      initFirebase: initFirebase,
      onAuthStateChanged: function (cb) {
        initFirebase().then(function () {
          if (!global.firebase || !global.firebase.auth) {
            cb(null);
            return;
          }
          global.firebase.auth().onAuthStateChanged(cb);
        });
      },
      signOutUser: function () {
        return initFirebase().then(function () {
          return global.firebase.auth().signOut();
        });
      },
      loadUserProfile: function (uid) {
        if (!uid) return Promise.resolve(null);
        return dbRef(NS + "/user_profiles/" + uid)
          .then(function (ref) { return ref.once("value"); })
          .then(function (snap) { return snap.val() || null; });
      },
      saveUserProfilePatch: function (uid, patch) {
        if (!uid) return Promise.reject(new Error("Missing user"));
        var updates = Object.assign({}, patch || {}, { updatedAt: nowTs() });
        return dbRef(NS + "/user_profiles/" + uid)
          .then(function (ref) { return ref.update(updates); })
          .then(function () {
            var displayName = LeagueSync.buildDisplayName(updates);
            if (!displayName) return null;
            return LeagueSync.setDirectoryEntry(uid, displayName);
          });
      },
      loadAdminUidFlag: function (uid) {
        if (!uid) return Promise.resolve(false);
        return dbRef(NS + "/admin_uids/" + uid)
          .then(function (ref) { return ref.once("value"); })
          .then(function (snap) { return !!snap.val(); })
          .catch(function () { return false; });
      },
    };
  }

  function loadSharedProfilePanel() {
    ensureOpenPlayProfileAdapter();
    if (global.SEOpenPlayProfilePanel && typeof global.SEOpenPlayProfilePanel.init === "function") {
      global.SEOpenPlayProfilePanel.init();
      return;
    }
    if (global.document.querySelector('script[data-league-profile-panel="1"]')) return;
    var script = global.document.createElement("script");
    script.src = "/js/openplay-profile-panel.js?v=20260426-adminnav";
    script.async = true;
    script.setAttribute("data-league-profile-panel", "1");
    global.document.head.appendChild(script);
  }

  if (global.document) {
    function onDomReady() {
      patchLeagueHeaderProfileHrefs();
      loadSharedProfilePanel();
    }
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", onDomReady);
    } else {
      onDomReady();
    }
  }
})(window);

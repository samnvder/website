/**
 * Pure RSVP validation helpers — shared by live RSVP HTML and Programs/Pickleball/testing/unit tests.
 */
(function (root, factory) {
  var exp = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exp;
  }
  if (typeof window !== 'undefined') {
    window.OpenPlayRsvpHelpers = exp;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function requiresAccessCard(memberValue) {
    return memberValue === 'yes';
  }

  /**
   * @param {string} memberValue - p-member value: '', 'yes', or 'no'
   * @param {string} accessCardRaw - raw input (trimmed inside)
   * @returns {{ ok: boolean, field?: string, message?: string }}
   */
  var ACCESS_CARD_RE = /^[23]\d{5}$/;

  function validateAccessCard(memberValue, accessCardRaw) {
    var t = (accessCardRaw || '').trim();
    if (!requiresAccessCard(memberValue)) return { ok: true };
    if (!t.length) {
      return {
        ok: false,
        field: 'member-card',
        message: 'Member access card # is required.',
      };
    }
    if (!ACCESS_CARD_RE.test(t)) {
      return {
        ok: false,
        field: 'member-card',
        message: 'Enter a 6-digit number starting with 2 or 3.',
      };
    }
    return { ok: true };
  }

  return {
    requiresAccessCard: requiresAccessCard,
    validateAccessCard: validateAccessCard,
  };
});

/**
 * Pure RSVP validation helpers — shared by live RSVP HTML and advanced-open-play/testing/unit tests.
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
  var PHONE_RE = /^\d{10}$/;

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

  /**
   * @param {string} phoneRaw - raw phone input
   * @returns {{ ok: boolean, field?: string, message?: string, normalized?: string }}
   */
  function validatePhone(phoneRaw) {
    var raw = (phoneRaw || '').trim();
    if (!raw.length) {
      return {
        ok: false,
        field: 'phone',
        message: 'Phone is required.',
      };
    }
    var digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
    if (!PHONE_RE.test(digits)) {
      return {
        ok: false,
        field: 'phone',
        message: 'Enter a valid 10-digit phone number.',
      };
    }
    return { ok: true, normalized: digits };
  }

  return {
    requiresAccessCard: requiresAccessCard,
    validateAccessCard: validateAccessCard,
    validatePhone: validatePhone,
  };
});

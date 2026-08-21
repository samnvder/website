/**
 * Proof harness: run the builders against a minimal fake DOM and count how many
 * click listeners land on #purchaseButton.
 *
 * Run: node patches/membership-builder-single-bind/membership-builder-single-bind--prove.js
 *
 * Three page shapes, two builder sets (live mirrors vs. patched pastes):
 *
 *   join page      -- the live /memberships/ markup: sticker builder elements,
 *                     NO #originalPrice/#discountedPrice/#limitedTimeText
 *   discount page  -- the Discounted Enrollment / special-offer markup
 *   join + promo   -- the hazard: join page AFTER someone adds the three discount
 *                     spans (what the task description warned about)
 *
 * Each shape is loaded with BOTH snippets in the order the live page renders
 * them (#9926 first, #7315 second), exactly as /memberships/ does today.
 *
 * Expected: the live mirrors bind 1 click listener on the join page ONLY because
 * #7315 throws a TypeError first (the accident), and 2 on both other shapes;
 * the patched pastes bind exactly 1 on every shape, with no exception thrown.
 *
 * Also reported: how many "change" listeners land on #membershipType. On the
 * live join page that is 2 -- #7315's change handlers DO bind before it throws,
 * so every select change re-throws the TypeError in the console. Harmless to
 * the visitor, but it is why "#7315 is inert on /memberships/" is only half true.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const BAR = '/* ' + '='.repeat(74) + ' */';
const body = (p) => {
  const s = fs.readFileSync(p, 'utf8');
  return s.includes(BAR) ? s.slice(s.lastIndexOf(BAR) + BAR.length + 1) : s;
};

const SETS = {
  'live mirrors': [
    body(path.join(root, 'live/wpcode/9926-build-your-membership-with-email-notification.js')),
    body(path.join(root, 'live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js')),
  ],
  'patched pastes': [
    body(path.join(__dirname, 'membership-builder-single-bind--paste-into-wpcode-9926.js')),
    body(path.join(__dirname, 'membership-builder-single-bind--paste-into-wpcode-7315.js')),
  ],
};

const CORE = ['membershipType', 'tier', 'familyOptions', 'numberOfChildren', 'childrenAgesContainer',
  'priceDisplay', 'minimumAmount', 'purchaseButton', 'name', 'email', 'phone',
  'enrollmentFee', 'monthlyDue', 'foodBeverageMinimum'];
const STICKER = ['enrollmentFeeDisplay'];
const DISCOUNT = ['originalPrice', 'discountedPrice', 'limitedTimeText'];

const SHAPES = {
  'join page (live /memberships/)': [...CORE, ...STICKER],
  'discount page': [...CORE, ...DISCOUNT],
  'join + promo spans added': [...CORE, ...STICKER, ...DISCOUNT],
};

function fakeDom(ids) {
  const els = {};
  ids.forEach((id) => {
    els[id] = {
      id,
      value: id === 'membershipType' ? 'single' : id === 'tier' ? '1' : id === 'numberOfChildren' ? '2' : '',
      textContent: '',
      innerHTML: '',
      style: {},
      dataset: {},
      listeners: {},
      addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
      appendChild() {},
      classList: { add() {}, remove() {} },
    };
  });
  const domListeners = {};
  const document = {
    getElementById: (id) => els[id] || null,
    addEventListener(type, fn) { (domListeners[type] = domListeners[type] || []).push(fn); },
    createElement: () => ({ classList: { add() {} }, appendChild() {}, addEventListener() {}, style: {} }),
  };
  return { els, document, domListeners };
}

let failed = false;
Object.entries(SETS).forEach(([setName, snippets]) => {
  Object.entries(SHAPES).forEach(([shapeName, ids]) => {
    const { els, document, domListeners } = fakeDom(ids);
    const warnings = [];
    const errors = [];
    const ctx = vm.createContext({
      document,
      console: { warn: (m) => warnings.push(String(m)), log() {}, error() {} },
      alert() {}, fetch() { return Promise.resolve({ json: () => ({}) }); },
    });
    snippets.forEach((code) => vm.runInContext(code, ctx));
    // Fire DOMContentLoaded in registration order, as the browser does.
    (domListeners.DOMContentLoaded || []).forEach((fn) => {
      try { fn(); } catch (e) { errors.push(e.constructor.name + ': ' + e.message); }
    });
    const clicks = (els.purchaseButton.listeners.click || []).length;
    const changes = (els.membershipType.listeners.change || []).length;
    const bound = els.purchaseButton.dataset.seBuilder || '-';
    const patched = setName === 'patched pastes';
    const expectClicks = patched ? 1 : (shapeName.startsWith('join page') ? 1 : 2);
    const expectThrown = patched ? 0 : (shapeName.startsWith('join page') ? 1 : 0);
    const ok = clicks === expectClicks && errors.length === expectThrown && (!patched || changes === 1);
    if (!ok) failed = true;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'}  ${setName.padEnd(15)} | ${shapeName.padEnd(32)} | click listeners: ${clicks}` +
        ` (expected ${expectClicks}) | change listeners: ${changes} | bound by: ${bound} | thrown: ${errors.length} | warns: ${warnings.length}`
    );
    errors.forEach((e) => console.log('        threw:', e));
    warnings.forEach((w) => console.log('        warn :', w));
  });
});
process.exit(failed ? 1 : 0);

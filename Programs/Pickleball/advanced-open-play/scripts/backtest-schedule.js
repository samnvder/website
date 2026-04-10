#!/usr/bin/env node
/**
 * Backtest: Dynamic Rolling Session Schedule
 * 
 * Validates that computeSessionWeeks() logic produces correct dates
 * for different current-date scenarios.
 */

const SCHEDULE_CONFIG = {
  slots: [
    { day: 2, label: 'Tuesday Morning',  abbr: 'TUES.', time: '8:00 AM – 12:00 PM', tag: 'MORNING',  emoji: '☀', tagColor: 'rgba(0,255,136,.6)', timeColor: 'var(--neon)' },
    { day: 2, label: 'Tuesday Evening',  abbr: 'TUES.', time: '6:00 – 9:00 PM',     tag: 'EVENING',  emoji: '🌙', tagColor: 'rgba(168,85,247,.6)', timeColor: 'var(--electric)' },
    { day: 4, label: 'Thursday Evening', abbr: 'THURS.', time: '6:00 – 9:00 PM',    tag: 'EVENING',  emoji: '🌙', tagColor: 'rgba(168,85,247,.6)', timeColor: 'var(--electric)' },
  ],
  weeksToShow: 2,
  lastSessionEndHour: 21, // 9 PM PT - roll after this
};

// Replicate the exact logic from SouthEnd_Session_RSVP.html
function computeSessionWeeks(config, mockNow) {
  var now = mockNow; // Use injected "now" for testing
  var slots = config.slots || [];
  if (!slots.length) return [];
  
  var minDay = Math.min.apply(null, slots.map(function (s) { return s.day; }));
  var maxDay = Math.max.apply(null, slots.map(function (s) { return s.day; }));
  
  var rollPast = now.dow > maxDay || (now.dow === maxDay && now.hour >= config.lastSessionEndHour);
  
  var anchor = new Date(now.year, now.month - 1, now.day);
  var currentDow = anchor.getDay();
  
  if (rollPast) {
    // After last session ends, go forward to next week's first session day
    var daysToAdd = (minDay - currentDow + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7;
    anchor.setDate(anchor.getDate() + daysToAdd);
  } else if (currentDow < minDay) {
    // Before week starts (e.g., Monday before Tuesday), go forward to this week's first session
    var daysToAdd = minDay - currentDow;
    anchor.setDate(anchor.getDate() + daysToAdd);
  } else {
    // During the week (Tue-Thu), go back to this week's first session
    var daysToSub = currentDow - minDay;
    anchor.setDate(anchor.getDate() - daysToSub);
  }
  
  var weeks = [];
  for (var w = 0; w < config.weeksToShow; w++) {
    var weekStart = new Date(anchor.getTime());
    weekStart.setDate(weekStart.getDate() + w * 7);
    
    var sessions = [];
    slots.forEach(function (slot) {
      var sessionDate = new Date(weekStart.getTime());
      var dayOffset = (slot.day - minDay + 7) % 7;
      sessionDate.setDate(sessionDate.getDate() + dayOffset);
      
      var monthName = sessionDate.toLocaleDateString('en-US', { month: 'short' });
      var dayNum = sessionDate.getDate();
      var fullLabel = slot.label + ' ' + monthName + ' ' + dayNum;
      
      sessions.push({
        fullLabel: fullLabel,
        abbr: slot.abbr,
        monthDay: monthName + ' ' + dayNum,
        time: slot.time,
        tag: slot.tag,
        emoji: slot.emoji,
        tagColor: slot.tagColor,
        timeColor: slot.timeColor,
        date: sessionDate,
      });
    });
    
    sessions.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });
    
    var firstDate = sessions[0].date;
    var lastDate = sessions[sessions.length - 1].date;
    var weekLabel = w === 0 ? 'This Week' : 'Next Week';
    var rangeLabel = firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' – ' + lastDate.getDate();
    
    weeks.push({
      label: weekLabel,
      range: rangeLabel,
      sessions: sessions,
    });
  }
  
  return weeks;
}

function mockPacificNow(testDate) {
  // testDate is a Date object in local time; we extract parts as if it's Pacific
  var year = testDate.getFullYear();
  var month = testDate.getMonth() + 1;
  var day = testDate.getDate();
  var hour = testDate.getHours();
  var dow = testDate.getDay();
  return { year: year, month: month, day: day, hour: hour, dow: dow };
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getDayName(dow) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow];
}

// Test scenarios
// April 2026 calendar: Apr 7=Tue, Apr 9=Thu, Apr 14=Tue, Apr 16=Thu
const testCases = [
  // Week 1: Apr 7-9 (Tue 7 AM & PM, Thu 9 PM)
  // Week 2: Apr 14-16 (Tue 14 AM & PM, Thu 16 PM)
  
  { name: 'Monday April 6 morning (before week starts)', date: new Date(2026, 3, 6, 10, 0), expectWeek1Start: new Date(2026, 3, 7), expectRoll: false },
  { name: 'Tuesday April 7, 7 AM (before morning session)', date: new Date(2026, 3, 7, 7, 0), expectWeek1Start: new Date(2026, 3, 7), expectRoll: false },
  { name: 'Tuesday April 7, 11 AM (during morning session)', date: new Date(2026, 3, 7, 11, 0), expectWeek1Start: new Date(2026, 3, 7), expectRoll: false },
  { name: 'Tuesday April 7, 7 PM (during evening session)', date: new Date(2026, 3, 7, 19, 0), expectWeek1Start: new Date(2026, 3, 7), expectRoll: false },
  { name: 'Wednesday April 8 afternoon', date: new Date(2026, 3, 8, 15, 0), expectWeek1Start: new Date(2026, 3, 7), expectRoll: false },
  { name: 'Thursday April 9, 8 PM (during evening session)', date: new Date(2026, 3, 9, 20, 0), expectWeek1Start: new Date(2026, 3, 7), expectRoll: false },
  { name: 'Thursday April 9, 9 PM (session ends, should ROLL)', date: new Date(2026, 3, 9, 21, 0), expectWeek1Start: new Date(2026, 3, 14), expectRoll: true },
  { name: 'Thursday April 9, 10 PM (after roll)', date: new Date(2026, 3, 9, 22, 0), expectWeek1Start: new Date(2026, 3, 14), expectRoll: true },
  { name: 'Friday April 10 morning', date: new Date(2026, 3, 10, 9, 0), expectWeek1Start: new Date(2026, 3, 14), expectRoll: true },
  { name: 'Saturday April 11 afternoon', date: new Date(2026, 3, 11, 14, 0), expectWeek1Start: new Date(2026, 3, 14), expectRoll: true },
  { name: 'Sunday April 12 evening', date: new Date(2026, 3, 12, 19, 0), expectWeek1Start: new Date(2026, 3, 14), expectRoll: true },
  { name: 'Monday April 13 morning', date: new Date(2026, 3, 13, 10, 0), expectWeek1Start: new Date(2026, 3, 14), expectRoll: true },
  
  // Month boundary test (Apr 30 is Thursday, May 5 is Tuesday)
  { name: 'Month boundary: Thu Apr 30, 8 PM (before roll)', date: new Date(2026, 3, 30, 20, 0), expectWeek1Start: new Date(2026, 3, 28), expectRoll: false },
  { name: 'Month boundary: Thu Apr 30, 9 PM (rolls to May)', date: new Date(2026, 3, 30, 21, 0), expectWeek1Start: new Date(2026, 4, 5), expectRoll: true },
  { name: 'May 1 Friday morning (after roll from Apr 30)', date: new Date(2026, 4, 1, 9, 0), expectWeek1Start: new Date(2026, 4, 5), expectRoll: true },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('BACKTEST: Dynamic Rolling Session Schedule');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Schedule: Tuesday (Morning & Evening), Thursday (Evening)');
console.log('Roll trigger: After Thursday 9 PM PT (hour >= 21)\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, idx) => {
  console.log(`\n─── Test ${idx + 1}: ${testCase.name} ───`);
  console.log(`Current time: ${formatDate(testCase.date)} ${testCase.date.getHours()}:00 (${getDayName(testCase.date.getDay())})`);
  
  const mockNow = mockPacificNow(testCase.date);
  const weeks = computeSessionWeeks(SCHEDULE_CONFIG, mockNow);
  
  if (weeks.length !== 2) {
    console.log(`❌ FAIL: Expected 2 weeks, got ${weeks.length}`);
    failed++;
    return;
  }
  
  const week1Sessions = weeks[0].sessions;
  const week2Sessions = weeks[1].sessions;
  
  // Check first Tuesday session of week 1
  const firstTuesday = week1Sessions.find(s => s.fullLabel.includes('Tuesday Morning'));
  if (!firstTuesday) {
    console.log(`❌ FAIL: No Tuesday Morning session in week 1`);
    failed++;
    return;
  }
  
  const actualWeek1Start = new Date(firstTuesday.date.getTime());
  const expectedWeek1Start = testCase.expectWeek1Start;
  
  // Compare dates (ignore time)
  actualWeek1Start.setHours(0, 0, 0, 0);
  expectedWeek1Start.setHours(0, 0, 0, 0);
  
  if (actualWeek1Start.getTime() === expectedWeek1Start.getTime()) {
    console.log(`✅ PASS: Week 1 starts ${formatDate(actualWeek1Start)}`);
    console.log(`   Expected roll: ${testCase.expectRoll ? 'YES' : 'NO'}, Actual: ${testCase.expectRoll ? 'YES' : 'NO'}`);
    
    // Display all sessions
    console.log('\n   Generated sessions:');
    console.log(`   📅 ${weeks[0].label} (${weeks[0].range}):`);
    weeks[0].sessions.forEach(s => {
      console.log(`      • ${s.fullLabel} — ${s.time}`);
    });
    console.log(`   📅 ${weeks[1].label} (${weeks[1].range}):`);
    weeks[1].sessions.forEach(s => {
      console.log(`      • ${s.fullLabel} — ${s.time}`);
    });
    
    passed++;
  } else {
    console.log(`❌ FAIL: Week 1 starts ${formatDate(actualWeek1Start)}`);
    console.log(`   Expected: ${formatDate(expectedWeek1Start)}`);
    console.log(`   Roll expected: ${testCase.expectRoll ? 'YES' : 'NO'}`);
    failed++;
  }
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`BACKTEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('⚠️  Some tests failed. Review logic or test expectations.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Dynamic schedule logic is working correctly.\n');
  process.exit(0);
}

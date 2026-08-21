/*
 * One-shot patch for live/wpcode/8309-floating-book-tour-button.html
 * (2026-08-20). Two changes:
 *   1. Fixes the id typo that has silently disabled Confirm Tour since
 *      the widget shipped: the handler looked up #se-bk-error but the
 *      markup's element is #se-bk-floating-error, so the first
 *      dereference threw and the click died before the fetch.
 *   2. Adds the Interests step (mirroring the inline widget) between
 *      Info and Confirm: markup, 4th progress dot, navigation, and the
 *      payload's `interests` field — which the tour-confirmation
 *      redirect (WPCode 10010) then uses for personalization.
 * Idempotence: refuses to run if already applied. Syntax-checks every
 * script block after patching.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, '..', '..', 'live', 'wpcode', '8309-floating-book-tour-button.html');
let h = fs.readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
if (h.indexOf('se-bk-floating-sint') !== -1) { console.log('already patched'); process.exit(0); }
const orig = h.length;

function rep(from, to, label) {
  if (h.indexOf(from) === -1) throw new Error('anchor not found: ' + label);
  h = h.replace(from, to);
}

// 1) THE BUG
rep("var errEl = document.getElementById('se-bk-error');",
    "var errEl = document.getElementById('se-bk-floating-error');", 'errEl id');

// 2) 4th progress dot
rep('<div id="se-bk-floating-d3" style="width:10px;height:10px;border-radius:50%;background:#e2e8f0;transition:all 0.3s ease;"></div>\n    </div>',
    '<div id="se-bk-floating-d3" style="width:10px;height:10px;border-radius:50%;background:#e2e8f0;transition:all 0.3s ease;"></div>\n      <div style="width:20px;height:2px;background:#e2e8f0;border-radius:1px;"></div>\n      <div id="se-bk-floating-d4" style="width:10px;height:10px;border-radius:50%;background:#e2e8f0;transition:all 0.3s ease;"></div>\n    </div>', 'dot 4');

// 3) showStep: interests = step 3, confirm = step 4
rep("    document.getElementById('se-bk-floating-s3').style.display = n===3 ? 'block' : 'none';",
    "    document.getElementById('se-bk-floating-sint').style.display = n===3 ? 'block' : 'none';\n    document.getElementById('se-bk-floating-s3').style.display = n===4 ? 'block' : 'none';", 'showStep steps');
rep("    document.getElementById('se-bk-floating-dots').style.display = (n >= 1 && n <= 3) ? 'flex' : 'none';",
    "    document.getElementById('se-bk-floating-dots').style.display = (n >= 1 && n <= 4) ? 'flex' : 'none';", 'dots range');
rep("    document.getElementById('se-bk-floating-d3').style.background = n>=3 ? '#0b468c' : '#e2e8f0';",
    "    document.getElementById('se-bk-floating-d3').style.background = n>=3 ? '#0b468c' : '#e2e8f0';\n    document.getElementById('se-bk-floating-d4').style.background = n>=4 ? '#0b468c' : '#e2e8f0';", 'dot 4 state');

// 4) interests step markup, inserted before the confirm step
const interestLabel = v =>
  '        <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-family:system-ui,sans-serif;font-size:14px;color:#475569;cursor:pointer;transition:all 0.2s ease;background:#fafbfc;"><input type="checkbox" name="se-bk-floating-interest" value="' + v + '" style="accent-color:#0b468c;width:18px;height:18px;"> ' + v + '</label>';
const INT = [
'',
'    <!-- STEP: Interests (added 2026-08-20, mirrors the inline widget) -->',
'    <style>#se-bk-floating-interests label:hover{border-color:#cbd5e1 !important;}#se-bk-floating-interests label:has(input:checked){border-color:#0b468c !important;background:#f0f4ff !important;color:#0b468c !important;}</style>',
'    <div id="se-bk-floating-sint" style="display:none;">',
'      <h4 style="margin:0 0 16px;font-family:Montserrat,system-ui,sans-serif;font-weight:700;font-size:16px;color:#1a1a2e;text-align:center;">What are you interested in?</h4>',
'      <p style="margin:0 0 20px;font-family:system-ui,sans-serif;font-size:14px;color:#64748b;line-height:1.4;text-align:center;">Select all that apply &mdash; helps us personalize your tour.</p>',
'      <div id="se-bk-floating-interests" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">',
interestLabel('Weight/Resistance Training'),
interestLabel('Swimming'),
interestLabel('Pickleball'),
interestLabel('Squash'),
interestLabel('Padel'),
interestLabel('Family Oriented Atmosphere'),
interestLabel('Cardio'),
interestLabel('Group Exercise Classes'),
interestLabel('Tennis'),
interestLabel('Racquetball'),
interestLabel('Social Community'),
'        <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-family:system-ui,sans-serif;font-size:14px;color:#475569;cursor:pointer;transition:all 0.2s ease;background:#fafbfc;"><input type="checkbox" name="se-bk-floating-interest" value="Childcare" data-crm="Kid\'s Club" style="accent-color:#0b468c;width:18px;height:18px;"> Childcare</label>',
'      </div>',
'      <div style="margin-bottom:16px;">',
'        <label style="display:block;font-family:Montserrat,system-ui,sans-serif;font-weight:600;font-size:11px;color:#64748b;margin-bottom:6px;">Other (comma-separated for multiple)</label>',
'        <input type="text" id="se-bk-floating-interest-other" placeholder="e.g. Yoga, Pilates" style="width:100%;padding:12px 14px;border:2px solid #e2e8f0;border-radius:10px;font-family:system-ui,sans-serif;font-size:14px;color:#1a1a2e;outline:none;box-sizing:border-box;background:#fafbfc;" onfocus="this.style.borderColor=\'#0b468c\';" onblur="this.style.borderColor=\'#e2e8f0\';">',
'      </div>',
'      <div style="display:flex;gap:10px;">',
'        <div id="se-bk-floating-sint-back" style="flex:0 0 auto;padding:16px 20px;border:2px solid #e2e8f0;border-radius:100px;color:#64748b;font-family:Montserrat,system-ui,sans-serif;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:border-color 0.15s ease,color 0.15s ease;box-sizing:border-box;" onmouseover="this.style.borderColor=\'#0b468c\';this.style.color=\'#0b468c\';" onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.color=\'#64748b\';" role="button" tabindex="0">',
'          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
'          Back',
'        </div>',
'        <div id="se-bk-floating-sint-next" style="flex:1;padding:16px;border:none;border-radius:100px;background:linear-gradient(135deg,#0b468c,#1a6dd4);color:#fff;font-family:Montserrat,system-ui,sans-serif;font-weight:700;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform 0.15s ease,box-shadow 0.15s ease;box-shadow:0 4px 16px rgba(11,70,140,0.25);box-sizing:border-box;" onmouseover="this.style.transform=\'translateY(-2px)\';" onmouseout="this.style.transform=\'\';" role="button" tabindex="0">',
'          Review &amp; Book',
'          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
'        </div>',
'      </div>',
'    </div>',
''].join('\n');
rep('\n    <!-- STEP 3: Confirm -->', INT + '\n    <!-- STEP 3: Confirm -->', 'interests markup');

// 5) s2-next label: "Review & Book" -> "Continue" (only the step-2 one)
rep('          Review &amp; Book\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>\n        </div>\n      </div>\n    </div>\n\n    <!-- STEP: Interests',
    '          Continue\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>\n        </div>\n      </div>\n    </div>\n\n    <!-- STEP: Interests', 's2-next label');

// 6) navigation wiring
rep("  document.getElementById('se-bk-floating-s3-back').addEventListener('click', function(){ showStep(2); });",
    "  document.getElementById('se-bk-floating-s3-back').addEventListener('click', function(){ showStep(3); });\n  document.getElementById('se-bk-floating-sint-back').addEventListener('click', function(){ showStep(2); });\n  document.getElementById('se-bk-floating-sint-next').addEventListener('click', function(){ showStep(4); });", 'sint nav');

// 7) submit: collect interests + payload field
rep("    var refInput = document.getElementById('se-bk-floating-referral');",
    "    var interests = [];\n    var intEls = document.querySelectorAll('input[name=\"se-bk-floating-interest\"]:checked');\n    for(var ii = 0; ii < intEls.length; ii++){ interests.push(intEls[ii].getAttribute('data-crm') || intEls[ii].value); }\n    var intOther = document.getElementById('se-bk-floating-interest-other');\n    if(intOther && intOther.value.trim()){\n      var otherVals = intOther.value.trim().split(',');\n      for(var jj = 0; jj < otherVals.length; jj++){ if(otherVals[jj].trim()) interests.push(otherVals[jj].trim()); }\n    }\n\n    var refInput = document.getElementById('se-bk-floating-referral');", 'interests collect');
rep("      how_heard: heardVal || null,\n      referral_member:",
    "      how_heard: heardVal || null,\n      interests: interests.length > 0 ? interests.join(', ') : null,\n      referral_member:", 'payload interests');

fs.writeFileSync(P, h);
console.log('patched:', orig, '->', h.length, 'bytes');
const blocks = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
blocks.forEach(b => { new Function(b); });
console.log('script blocks:', blocks.length, '- all compile');

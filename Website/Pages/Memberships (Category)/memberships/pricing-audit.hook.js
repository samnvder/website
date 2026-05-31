#!/usr/bin/env node
/*
 * pricing-audit.hook.js
 * ----------------------------------------------------------------------------
 * PostToolUse hook. Reads the hook payload (JSON on stdin), and if the tool
 * just edited "membership builder JS.js", runs pricing-audit.gen.js to
 * regenerate membership-pricing-audit.log and .pdf.
 *
 * Wired in .claude/settings.local.json under hooks.PostToolUse
 * (matcher "Edit|Write|MultiEdit"). For any other file it exits silently.
 * Never blocks the edit, even if regeneration fails.
 * ----------------------------------------------------------------------------
 */
'use strict';

const path = require('path');
const { execFileSync } = require('child_process');

const TARGET = 'membership builder js.js'; // compared case-insensitively

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const j = JSON.parse(input || '{}');
    filePath =
      (j.tool_input && (j.tool_input.file_path || j.tool_input.filePath)) ||
      (j.tool_response && (j.tool_response.filePath || j.tool_response.file_path)) ||
      '';
  } catch (_) {
    /* malformed payload -> treat as no-op */
  }

  const base = filePath ? path.basename(filePath).toLowerCase() : '';
  if (base !== TARGET) {
    process.exit(0); // not the pricing source; do nothing
  }

  try {
    execFileSync(process.execPath, [path.join(__dirname, 'pricing-audit.gen.js')], {
      stdio: 'ignore'
    });
    process.stdout.write(
      JSON.stringify({
        systemMessage: 'Pricing changed — regenerated membership-pricing-audit.log/.pdf.',
        suppressOutput: true
      })
    );
  } catch (e) {
    // Surface the failure but never block the edit.
    process.stdout.write(
      JSON.stringify({ systemMessage: 'Pricing audit regeneration FAILED: ' + e.message })
    );
  }
  process.exit(0);
});

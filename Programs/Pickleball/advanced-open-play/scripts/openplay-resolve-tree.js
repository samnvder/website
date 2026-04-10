/**
 * South End Open Play — which folder is the active dev tree (staging vs live).
 * Used by local-test mirror, deploy guards, and switch/promote scripts.
 */
const fs = require('fs');
const path = require('path');

/** This program’s root: Programs/Pickleball/advanced-open-play/ */
const PROGRAM_ROOT = path.join(__dirname, '..');
const MODE_FILE = path.join(PROGRAM_ROOT, 'openplay-mode.json');

const DEFAULTS = {
  activeTree: 'staging',
  allowProductionHostingDeploy: false,
};

function readMode() {
  try {
    if (!fs.existsSync(MODE_FILE)) {
      return { ...DEFAULTS };
    }
    const raw = fs.readFileSync(MODE_FILE, 'utf8');
    const j = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...j,
      activeTree: j.activeTree === 'live' ? 'live' : 'staging',
      allowProductionHostingDeploy: !!j.allowProductionHostingDeploy,
    };
  } catch (e) {
    console.warn('[openplay-mode] read failed, using defaults:', e.message);
    return { ...DEFAULTS };
  }
}

function getActiveTreeName() {
  return readMode().activeTree === 'live' ? 'live' : 'staging';
}

/** Absolute path to active HTML/JS source (staging or live). */
function getActiveSourceDir() {
  const name = getActiveTreeName();
  return path.join(PROGRAM_ROOT, name);
}

/** Absolute path to production deploy tree (always live/). */
function getProductionSourceDir() {
  return path.join(PROGRAM_ROOT, 'live');
}

function modeFilePath() {
  return MODE_FILE;
}

module.exports = {
  readMode,
  getActiveTreeName,
  getActiveSourceDir,
  getProductionSourceDir,
  modeFilePath,
  PROGRAM_ROOT,
  /** @deprecated use PROGRAM_ROOT */
  PICKLEBALL_ROOT: PROGRAM_ROOT,
  DEFAULTS,
};

/**
 * South End Open Play — which folder is the active dev tree (staging vs live).
 * Used by local-test mirror, deploy guards, and switch/promote scripts.
 */
const fs = require('fs');
const path = require('path');

/** This program's root: monorepo root (sibling of scripts/, staging/, live/). */
const PROGRAM_ROOT = path.join(__dirname, '..');
/** Same as PROGRAM_ROOT in the standalone monorepo layout — live/ is a direct child. */
const PICKLEBALL_PROGRAM_ROOT = PROGRAM_ROOT;
/** Override for unit tests: path to a temp mode JSON (absolute or relative to cwd). */
const MODE_FILE = process.env.OPENPLAY_MODE_FILE
  ? path.resolve(process.env.OPENPLAY_MODE_FILE)
  : path.join(PROGRAM_ROOT, 'openplay-mode.json');

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
  if (name === 'live') {
    return path.join(PICKLEBALL_PROGRAM_ROOT, 'live');
  }
  return path.join(PROGRAM_ROOT, 'staging');
}

/** Absolute path to production deploy tree (Programs/Pickleball/live/). */
function getProductionSourceDir() {
  return path.join(PICKLEBALL_PROGRAM_ROOT, 'live');
}

function modeFilePath() {
  return MODE_FILE;
}

/**
 * Merge updates into openplay-mode.json and write normalized values.
 * @param {Partial<{ activeTree: string, allowProductionHostingDeploy: boolean }>} updates
 */
function writeMode(updates) {
  const p = modeFilePath();
  let cur = { ...DEFAULTS };
  try {
    if (fs.existsSync(p)) {
      cur = { ...cur, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
    }
  } catch (e) {
    console.warn('[openplay-mode] writeMode read failed, using defaults:', e.message);
  }
  Object.assign(cur, updates);
  cur.activeTree = cur.activeTree === 'live' ? 'live' : 'staging';
  cur.allowProductionHostingDeploy = !!cur.allowProductionHostingDeploy;
  fs.writeFileSync(p, JSON.stringify(cur, null, 2) + '\n', 'utf8');
}

module.exports = {
  readMode,
  writeMode,
  getActiveTreeName,
  getActiveSourceDir,
  getProductionSourceDir,
  modeFilePath,
  PROGRAM_ROOT,
  PICKLEBALL_PROGRAM_ROOT,
  /** @deprecated use PROGRAM_ROOT */
  PICKLEBALL_ROOT: PROGRAM_ROOT,
  DEFAULTS,
};

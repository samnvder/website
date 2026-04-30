#!/usr/bin/env node
/**
 * Deterministic project + mode resolver.
 *
 * Usage:
 *   node scripts/resolve-project-mode.js [path]
 *
 * - If [path] is omitted, uses cwd.
 * - Prints JSON: { project, root, modeFile, activeMode, switchCommands, error }
 * - Exit 0 on success, 1 on ambiguous/unknown project.
 *
 * Add new projects to PROJECT_REGISTRY below.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * PROJECT_REGISTRY
 *
 * Each entry:
 *   key        — short project id (used in CLI, logs, agent reasoning)
 *   pathPrefix — relative to repo root; if the queried path starts here, this project matches
 *   modeFile   — relative to repo root; JSON file with mode state (or null if branch-based)
 *   modeField  — field inside modeFile that holds the active mode string
 *   modes      — array of valid mode names
 *   switchCommands — map mode → npm script (from repo root)
 *   syncFromLiveCommand — (optional) npm script to align staging/test with live
 */
const PROJECT_REGISTRY = [
  {
    key: 'openplay',
    name: 'Pickleball Central Hub',
    pathPrefix: 'Programs/Pickleball/advanced-open-play',
    modeFile: 'Programs/Pickleball/advanced-open-play/openplay-mode.json',
    modeField: 'activeTree',
    modes: ['staging', 'live'],
    switchCommands: {
      staging: 'npm run openplay:use-staging',
      live: 'npm run openplay:use-live',
    },
    syncFromLiveCommand: 'npm run openplay:sync-from-live',
  },
  // Add future projects here following the same shape.
];

function normalizeSlash(p) {
  return p.replace(/\\/g, '/');
}

function resolveProject(queryPath) {
  const abs = path.resolve(queryPath);
  const rel = normalizeSlash(path.relative(REPO_ROOT, abs));

  const matches = PROJECT_REGISTRY.filter((p) => {
    const prefix = normalizeSlash(p.pathPrefix);
    return rel === prefix || rel.startsWith(prefix + '/');
  });

  if (matches.length === 0) {
    return { error: 'no_match', message: `Path "${rel}" does not match any registered project.` };
  }
  if (matches.length > 1) {
    return {
      error: 'ambiguous',
      message: `Path "${rel}" matches multiple projects: ${matches.map((m) => m.key).join(', ')}`,
      candidates: matches.map((m) => m.key),
    };
  }
  return { project: matches[0] };
}

function readMode(project) {
  if (!project.modeFile) {
    return { activeMode: null, note: 'Project uses branch-based mode, not a mode file.' };
  }
  const fullPath = path.join(REPO_ROOT, project.modeFile);
  if (!fs.existsSync(fullPath)) {
    return { activeMode: null, note: `Mode file not found: ${project.modeFile}` };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const mode = raw[project.modeField];
    if (!project.modes.includes(mode)) {
      return { activeMode: mode, warning: `Mode "${mode}" not in known modes: ${project.modes.join(', ')}` };
    }
    return { activeMode: mode };
  } catch (e) {
    return { activeMode: null, error: `Failed to parse mode file: ${e.message}` };
  }
}

function main() {
  const queryPath = process.argv[2] || process.cwd();
  const result = resolveProject(queryPath);

  if (result.error) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const project = result.project;
  const modeInfo = readMode(project);

  const output = {
    project: project.key,
    name: project.name,
    root: path.join(REPO_ROOT, project.pathPrefix),
    modeFile: project.modeFile ? path.join(REPO_ROOT, project.modeFile) : null,
    activeMode: modeInfo.activeMode,
    modes: project.modes,
    switchCommands: project.switchCommands,
    syncFromLiveCommand: project.syncFromLiveCommand || null,
  };
  if (modeInfo.warning) output.warning = modeInfo.warning;
  if (modeInfo.note) output.note = modeInfo.note;

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

main();

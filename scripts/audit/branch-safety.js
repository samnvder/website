#!/usr/bin/env node
/**
 * Reports which branches are safe, which are unbacked-up, and which are done.
 *
 * Run:  npm run branches           (report; always exits 0)
 *       npm run branches:strict    (exit 1 if any branch exists only on this machine)
 *
 * Why this exists
 * ---------------
 * On 2026-08-19 two branches were found holding 1,399 lines of work that had
 * never been pushed -- a handoff and a prepared patch, each existing on exactly
 * one disk. Nothing looked wrong: they were properly committed, and GitHub
 * Desktop draws a local-only branch identically to a pushed one. The branches
 * most at risk looked exactly like the safe ones, which made "tidy up merged
 * branches" a genuinely dangerous operation.
 *
 * `git commit` is not a backup. It writes to .git/ on this machine. Ten commits
 * without a push are ten commits in one place.
 *
 * Two subtleties this encodes, because both were got wrong by hand first:
 *
 * 1. `git branch --merged` compares by COMMIT, so a branch whose work was
 *    cherry-picked into master still reads as unmerged and looks like it holds
 *    unique work. `git cherry` compares by PATCH-ID and gets it right. One
 *    branch was nearly kept on this basis, and another was nearly deleted.
 *
 * 2. A three-dot diff (master...branch) shows everything done on the branch
 *    since it forked -- including work that has since landed in master by
 *    another route. It answers "what did this branch do", not "what would be
 *    lost". Only the patch-id check answers the second question.
 */

const { execFileSync } = require('child_process');

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gitLines(args) {
  const out = git(args);
  return out ? out.split(/\r?\n/) : [];
}

function classify(branch, remotes, baseRef) {
  const remoteRef = `origin/${branch}`;
  const hasRemote = remotes.includes(remoteRef);

  // Commits whose PATCH is absent from master. Cherry-pick-aware, unlike
  // `git branch --merged`.
  const unique = gitLines(['cherry', baseRef, branch]).filter((l) => l.startsWith('+')).length;

  let ahead = 0;
  if (hasRemote) {
    ahead = gitLines(['log', '--oneline', `${remoteRef}..${branch}`]).length;
  }

  if (!hasRemote) {
    return {
      level: unique > 0 ? 'CRITICAL' : 'stale',
      state: unique > 0 ? 'LOCAL ONLY — never pushed' : 'local only, nothing unique',
      unique,
      note: unique > 0
        ? `${unique} commit(s) exist on this machine and nowhere else`
        : 'content is already in master; safe to delete',
    };
  }

  if (ahead > 0) {
    return {
      level: 'WARN',
      state: `${ahead} commit(s) not pushed`,
      unique,
      note: 'push before you switch branches or stop for the day',
    };
  }

  if (unique === 0) {
    return {
      level: 'ok',
      state: 'fully in master',
      unique,
      note: 'safe to delete (verified by patch-id, not by branch flag)',
    };
  }

  return {
    level: 'ok',
    state: `pushed · ${unique} commit(s) not yet in master`,
    unique,
    note: 'open a PR so it does not sit unnoticed',
  };
}

function main() {
  const strict = process.argv.slice(2).includes('--strict');

  const baseRef = gitLines(['rev-parse', '--verify', '--quiet', 'origin/master']).length
    ? 'origin/master'
    : 'master';

  const branches = gitLines(['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  const remotes = gitLines(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/']);
  const current = git(['branch', '--show-current']);

  console.log('');
  console.log(`[branch-safety] working tree is on: ${current || '(detached)'}`);
  console.log(`[branch-safety] comparing against:  ${baseRef}`);
  console.log('');

  const problems = [];

  branches.forEach((b) => {
    if (b === 'master') return;
    const r = classify(b, remotes, baseRef);
    const marker = r.level === 'CRITICAL' ? '!!' : r.level === 'WARN' ? ' !' : '  ';
    console.log(`${marker} ${b}`);
    console.log(`     ${r.state} — ${r.note}`);
    if (r.level === 'CRITICAL' || r.level === 'WARN') problems.push({ branch: b, ...r });
  });

  if (!branches.filter((b) => b !== 'master').length) {
    console.log('   no branches besides master.');
  }

  console.log('');

  if (problems.length) {
    console.log('[branch-safety] Unbacked-up work:');
    problems.forEach((p) => console.log(`   ${p.branch} — ${p.state}`));
    console.log('');
    console.log('   Fix with:  git push -u origin <branch>');
    console.log('   `git commit` writes to this machine only. A commit is not a backup.');
    console.log('');
    if (strict) process.exit(1);
  } else {
    console.log('[branch-safety] OK — every branch exists on origin.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { classify };

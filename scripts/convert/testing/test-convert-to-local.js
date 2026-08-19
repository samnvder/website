/**
 * Tests for convert-to-local.js
 *
 * The bug these exist to prevent is not a crash — it is silence. The script
 * scanned 'Pages', which does not exist (pages live at Website/Pages), so it
 * reported "0 of 0 files modified" and exited 0. That is indistinguishable
 * from "nothing needed changing", which is why it went unnoticed.
 *
 * Tests 3 and 4 are the load-bearing ones: they assert against the real repo,
 * so moving or renaming a page file fails here instead of silently producing
 * links that 404 locally.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'convert', 'convert-to-local.js');

// Load the module from a throwaway cwd, NEVER from the repo root.
//
// This is not paranoia — it happened. While these tests were being written the
// require.main guard was briefly absent, and requiring the module executed
// main() against the real tree, rewriting 10 files in Components/. If the guard
// ever regresses, the worst case must be a failing test, not a mutated repo:
// from a temp cwd, main() cannot resolve its paths and exits non-zero instead.
const originalCwd = process.cwd();
process.chdir(os.tmpdir());
const mod = require(SCRIPT);
process.chdir(originalCwd);

test('requiring the module does not execute main()', () => {
    // A bare `require` used to run main() as a side effect and rewrite every
    // scanned file. CLAUDE.md records the same defect in pricing:apply, where
    // importing the module rewrote every pricing file.
    assert.ok(mod.URL_MAPPINGS, 'module should export its config');
    assert.ok(mod.DIRECTORIES_TO_SCAN, 'module should export its scan list');

    // If require() had run main(), it would have printed its banner. Prove the
    // guard by requiring it in a clean child process and checking for silence.
    // Again from a temp cwd: if the guard regresses this must fail, not write.
    const out = execFileSync(process.execPath, ['-e', `require(${JSON.stringify(SCRIPT)})`], {
        cwd: os.tmpdir(),
        encoding: 'utf8',
    });
    assert.strictEqual(out.trim(), '', 'requiring the module must print nothing');
});

test('mappings are applied longest-first, so "/" cannot clobber the others', () => {
    const ordered = mod.mappingsLongestFirst().map(([url]) => url);

    assert.strictEqual(ordered[ordered.length - 1], '/',
        '"/" must be substituted last — it is a prefix of every other mapped URL');

    for (let i = 1; i < ordered.length; i++) {
        assert.ok(ordered[i - 1].length >= ordered[i].length,
            `mappings out of order at ${i}: ${ordered[i - 1]} before ${ordered[i]}`);
    }
});

test('every scan directory exists in this repo', () => {
    for (const dir of mod.DIRECTORIES_TO_SCAN) {
        assert.ok(fs.existsSync(path.join(REPO_ROOT, dir)),
            `DIRECTORIES_TO_SCAN entry does not exist: ${dir} — the script would silently skip it`);
    }
});

test('every URL mapping points at a file that exists', () => {
    const missing = [];

    for (const [liveUrl, localPath] of Object.entries(mod.URL_MAPPINGS)) {
        const onDisk = path.join(REPO_ROOT, localPath.replace(/^[/]/, ''));
        if (!fs.existsSync(onDisk)) {
            missing.push(`${liveUrl} -> ${localPath}`);
        }
    }

    assert.deepStrictEqual(missing, [],
        'these mappings would rewrite a live URL into a link that 404s locally');
});

test('the script refuses to run when a path does not resolve', () => {
    // Running from anywhere but the repo root is the realistic way to hit this.
    let threw = false;
    let stderr = '';

    try {
        execFileSync(process.execPath, [SCRIPT], {
            cwd: path.join(REPO_ROOT, 'scripts'),
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (err) {
        threw = true;
        stderr = String(err.stderr || '');
    }

    assert.ok(threw, 'expected a non-zero exit when run outside the repo root');
    assert.match(stderr, /Refusing to run/,
        'expected an explicit refusal, not a silent "0 of 0 files modified"');
});

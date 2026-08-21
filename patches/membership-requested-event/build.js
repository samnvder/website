#!/usr/bin/env node
/**
 * membership_requested patch generator — handoffs/site-wide-event-tracking.md Part A.
 *
 * Inserts one dataLayer push (no PII) immediately after the success alert
 * ("Thank you! A membership form has been sent…") in each membership builder,
 * preserving each file's own line endings and the alert line's indentation.
 *
 * Modes:
 *   node build.js             write patches/membership-requested-event/<id>.js + <id>.diff
 *   node build.js --verify    re-derive each patch from the current mirror; exit 1 on any diff
 *   node build.js --in-place  apply the insert to the live/wpcode mirrors AND the
 *                             Website/Pages paste-source copies (idempotent)
 *
 * Idempotent by design: a file already carrying the push is returned unchanged,
 * so --verify stays green after --in-place has run.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..");
const OUT_DIR = __dirname;

const ANCHOR = "Thank you! A membership form has been sent";
const EVENT = "membership_requested";

const BUILDERS = [
    {
        id: "9926",
        mirror: "live/wpcode/9926-build-your-membership-with-email-notification.js",
        source: "Website/Pages/Memberships (Category)/memberships/membership builder JS.js"
    },
    {
        id: "7315",
        mirror: "live/wpcode/7315-build-your-membership-discounted-enrollment-with-email-notification.js",
        source: "Website/Pages/Memberships (Category)/memberships/Discounted Enrollment/membership builder JS.js"
    },
    {
        id: "7966",
        mirror: "live/wpcode/7966-build-your-membership-discounted-enrollment-percent.js",
        source: "Website/Pages/Memberships (Category)/memberships/Discounted Enrollment/membership builder JS-discount-enrollment.js"
    }
];

// Variables the block reads — all must be in scope (declared earlier in the
// click handler) or the insert is wrong for that file.
const REQUIRED_VARS = ["membershipTypeValue", "tier", "numberOfChildrenValue", "enrollmentFee", "monthlyDue"];

function blockLines(builderId) {
    return [
        "/* --- conversion tracking: one push per successful signature request (no PII) --- */",
        "try {",
        "    window.dataLayer = window.dataLayer || [];",
        "    window.dataLayer.push({",
        "        event: 'membership_requested',",
        "        membership_type: membershipTypeValue || null,",
        "        membership_tier: tier || null,",
        "        membership_children: Number(numberOfChildrenValue) || 0,",
        "        membership_enrollment_fee: Number(String(enrollmentFee).replace(/[^0-9.]/g, '')) || null,",
        "        membership_monthly_due: Number(String(monthlyDue).replace(/[^0-9.]/g, '')) || null,",
        `        membership_builder: '${builderId}'`,
        "    });",
        "} catch (e) { /* never let tracking break the confirmation */ }",
        "/* --- end conversion tracking --- */"
    ];
}

function patchContent(content, builderId, label) {
    if (content.includes(EVENT)) return content; // already patched — idempotent

    const eol = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(eol);

    const anchorIdx = lines.reduce((acc, line, i) => {
        if (line.includes(ANCHOR)) acc.push(i);
        return acc;
    }, []);
    if (anchorIdx.length !== 1) {
        throw new Error(`${label}: expected exactly 1 anchor line, found ${anchorIdx.length}`);
    }

    for (const v of REQUIRED_VARS) {
        const before = lines.slice(0, anchorIdx[0]).join(eol);
        if (!before.includes(v)) {
            throw new Error(`${label}: variable "${v}" not found before the anchor — block would reference an undefined name`);
        }
    }

    const indent = (lines[anchorIdx[0]].match(/^\s*/) || [""])[0];
    const insert = ["", ...blockLines(builderId).map((l) => (l ? indent + l : l))];
    lines.splice(anchorIdx[0] + 1, 0, ...insert);
    return lines.join(eol);
}

function readRepoFile(rel) {
    const abs = path.join(REPO, rel);
    if (!fs.existsSync(abs)) throw new Error(`missing file: ${rel}`);
    return { abs, content: fs.readFileSync(abs, "utf8") };
}

function buildPatches({ verify }) {
    let ok = 0;
    for (const b of BUILDERS) {
        const { content } = readRepoFile(b.mirror);
        const patched = patchContent(content, b.id, b.mirror);
        const patchPath = path.join(OUT_DIR, `${b.id}.js`);

        if (verify) {
            if (!fs.existsSync(patchPath)) throw new Error(`--verify: ${b.id}.js does not exist — run build first`);
            const committed = fs.readFileSync(patchPath, "utf8");
            if (committed !== patched) throw new Error(`--verify: ${b.id}.js differs from what the current mirror derives — mirror drifted or patch was hand-edited`);
            ok++;
            continue;
        }

        fs.writeFileSync(patchPath, patched);
        writeDiff(b, patchPath);
        ok++;
        console.log(`wrote ${b.id}.js (+${patched.length - content.length} bytes) and ${b.id}.diff`);
    }
    if (verify) console.log(`${ok} patches verified`);
}

function writeDiff(b, patchPath) {
    // git diff --no-index exits 1 when files differ — that is the expected case.
    let out = "";
    try {
        out = execFileSync("git", ["diff", "--no-index", "--", path.join(REPO, b.mirror), patchPath], { encoding: "utf8" });
    } catch (e) {
        if (e.status === 1 && typeof e.stdout === "string") out = e.stdout;
        else throw e;
    }
    const diffPath = path.join(OUT_DIR, `${b.id}.diff`);
    // An empty diff means the mirror is already patched (post --in-place).
    // Keep the existing diff, which records the original insert, rather than
    // clobbering it with nothing.
    if (out === "" && fs.existsSync(diffPath) && fs.readFileSync(diffPath, "utf8") !== "") return;
    fs.writeFileSync(diffPath, out);
}

function applyInPlace() {
    for (const b of BUILDERS) {
        for (const rel of [b.mirror, b.source]) {
            const { abs, content } = readRepoFile(rel);
            const patched = patchContent(content, b.id, rel);
            if (patched === content) {
                console.log(`unchanged (already patched): ${rel}`);
            } else {
                fs.writeFileSync(abs, patched);
                console.log(`patched: ${rel}`);
            }
        }
    }
}

function main() {
    const args = process.argv.slice(2);
    if (args.includes("--in-place")) {
        buildPatches({ verify: false }); // derive patches + diffs from the unpatched state first
        applyInPlace();
    } else {
        buildPatches({ verify: args.includes("--verify") });
    }
}

if (require.main === module) {
    try {
        main();
    } catch (e) {
        console.error(`FAIL: ${e.message}`);
        process.exit(1);
    }
}

module.exports = { patchContent, BUILDERS };

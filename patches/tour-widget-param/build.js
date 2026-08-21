#!/usr/bin/env node
/**
 * tour_widget patch generator — owner-requested 2026-08-20.
 *
 * tour_source_page identifies the PAGE a booking came from but not the WIDGET:
 * the homepage serves both the inline widget and the floating button, and a
 * booking through either reads identically in GA4. This inserts one line,
 *     tour_widget: '<id>',
 * immediately after the `event: 'tour_booked',` line of every push, so the
 * widget is reportable. Ids are the widgets' own internal names:
 * se-bk-floating (WPCode #8309, sitewide) · se-bk-inline (homepage) ·
 * se-cal (calendar embeds).
 *
 * Modes (same contract as patches/membership-requested-event/build.js):
 *   node build.js             write paste artifacts + diffs from the live mirrors
 *   node build.js --verify    re-derive from current mirrors; exit 1 on drift
 *   node build.js --in-place  apply to ALL repo files (mirrors + page sources), idempotent
 *
 * GTM/GA4 side (container v8): dataLayer variable `tour_widget`, mapped on the
 * GA4 - tour_booked tag, registered as an event-scoped dimension.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..");
const OUT_DIR = __dirname;

const ANCHOR = "event: 'tour_booked',";
const PARAM = "tour_widget";

// Live surfaces get a paste artifact (out); page sources are repo-sync only.
const FILES = [
    { rel: "live/wpcode/8309-floating-book-tour-button.html", widget: "se-bk-floating", out: "8309-floating-book-tour-button.html" },
    { rel: "live/thrive/pages/index/se-bk-inline.html", widget: "se-bk-inline", out: "thrive-index--se-bk-inline.html" },
    { rel: "live/thrive/pages/schedule-a-tour/se-cal.html", widget: "se-cal", out: "thrive-schedule-a-tour--se-cal.html" },
    { rel: "live/thrive/pages/memberships/se-cal.html", widget: "se-cal", out: "thrive-memberships--se-cal.html" },
    { rel: "Website/Pages/index/Index.html", widget: "se-bk-inline", out: null },
    { rel: "Website/Pages/Tours (Category)/schedule-a-tour/Membership Tour Booking Page.html", widget: "se-cal", out: null },
    { rel: "Website/Pages/Memberships (Category)/memberships/Memberships Page HTML.html", widget: "se-cal", out: null },
    { rel: "Website/Pages/Memberships (Category)/special-offer/Special Offer.html", widget: "se-cal", out: null }
];

function patchContent(content, widget, label) {
    if (content.includes(`${PARAM}:`)) return content; // already patched — idempotent

    // String-level insertion: some of these files carry MIXED line endings
    // (mostly LF with stray CRLF), so a split/join on one EOL rewrites every
    // line in the file. Touch only the bytes around the anchor line instead.
    const count = content.split(ANCHOR).length - 1;
    if (count !== 1) {
        throw new Error(`${label}: expected exactly 1 anchor, found ${count}`);
    }

    const anchorPos = content.indexOf(ANCHOR);
    const lineStart = content.lastIndexOf("\n", anchorPos) + 1;
    const indent = (content.slice(lineStart).match(/^[ \t]*/) || [""])[0];
    const lfPos = content.indexOf("\n", anchorPos);
    if (lfPos === -1) throw new Error(`${label}: anchor line has no line ending`);
    const eol = content[lfPos - 1] === "\r" ? "\r\n" : "\n";

    const insertAt = lfPos + 1;
    return content.slice(0, insertAt) + `${indent}${PARAM}: '${widget}',${eol}` + content.slice(insertAt);
}

function readRepoFile(rel) {
    const abs = path.join(REPO, rel);
    if (!fs.existsSync(abs)) throw new Error(`missing file: ${rel}`);
    return { abs, content: fs.readFileSync(abs, "utf8") };
}

function writeDiff(name, mirrorAbs, patchPath) {
    let out = "";
    try {
        out = execFileSync("git", ["diff", "--no-index", "--", mirrorAbs, patchPath], { encoding: "utf8" });
    } catch (e) {
        if (e.status === 1 && typeof e.stdout === "string") out = e.stdout;
        else throw e;
    }
    const diffPath = path.join(OUT_DIR, `${name}.diff`);
    // Empty diff = mirror already patched (post --in-place); keep the recorded insert.
    if (out === "" && fs.existsSync(diffPath) && fs.readFileSync(diffPath, "utf8") !== "") return;
    fs.writeFileSync(diffPath, out);
}

function buildPatches({ verify }) {
    let ok = 0;
    for (const f of FILES) {
        if (!f.out) continue;
        const { abs, content } = readRepoFile(f.rel);
        const patched = patchContent(content, f.widget, f.rel);
        const patchPath = path.join(OUT_DIR, f.out);

        if (verify) {
            if (!fs.existsSync(patchPath)) throw new Error(`--verify: ${f.out} does not exist — run build first`);
            if (fs.readFileSync(patchPath, "utf8") !== patched) {
                throw new Error(`--verify: ${f.out} differs from what the current mirror derives`);
            }
            ok++;
            continue;
        }

        fs.writeFileSync(patchPath, patched);
        writeDiff(path.parse(f.out).name, abs, patchPath);
        const lineDelta = patched.split("\n").length - content.split("\n").length;
        console.log(`wrote ${f.out} (+${patched.length - content.length} chars, +${lineDelta} line)`);
        ok++;
    }
    if (verify) console.log(`${ok} patches verified`);
}

function applyInPlace() {
    for (const f of FILES) {
        const { abs, content } = readRepoFile(f.rel);
        const patched = patchContent(content, f.widget, f.rel);
        if (patched === content) {
            console.log(`unchanged (already patched): ${f.rel}`);
        } else {
            fs.writeFileSync(abs, patched);
            console.log(`patched [${f.widget}]: ${f.rel}`);
        }
    }
}

function main() {
    const args = process.argv.slice(2);
    if (args.includes("--in-place")) {
        buildPatches({ verify: false }); // derive artifacts + diffs from unpatched state first
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

module.exports = { patchContent, FILES };

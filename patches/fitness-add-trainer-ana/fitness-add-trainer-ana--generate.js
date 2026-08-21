/**
 * Regenerates the paste-ready artifacts for "add Ana Sampaio to the fitness
 * trainers grid".
 *
 * Source of truth is the repo page file. This script slices the personal
 * training section out of it, so the artifact can never drift from the source
 * that was reviewed and committed.
 *
 * Run: node patches/fitness-add-trainer-ana/fitness-add-trainer-ana--generate.js
 *
 * Emits, next to itself:
 *   fitness-add-trainer-ana--paste-into-thrive-section.html  the section to paste into Thrive
 *   fitness-add-trainer-ana--paste-into-thrive-card-ana.html           just Ana's card, if inserting one card
 *   fitness-add-trainer-ana--preview.html                    standalone render for eyeballing layout
 */

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const PAGE = path.join(REPO, 'Website', 'Pages', 'fitness', 'fitness HTML.html');
const CSS = path.join(REPO, 'Website', 'Pages', 'fitness', 'Fitness CSS.css');
const OUT = __dirname;

// Line-ending tolerant: the page file is CRLF in the working tree.
const SECTION_START = /<!-- =+\r?\n\s+PERSONAL TRAINING SECTION/;
const SECTION_END = /<!-- =+\r?\n\s+CTA SECTION/;
const CARD_START = /[ \t]*<!-- Ana Sampaio -->/;
// Ana's card is the last one, so it ends where the trainers grid closes.
const CARD_END = /\r?\n[ \t]*<\/div>\r?\n[ \t]*\r?\n[ \t]*<div class="thrv_wrapper thrv_text_element"><p class="trainer-note/;

function slice(html, startRe, endRe, label) {
    const a = html.search(startRe);
    if (a === -1) throw new Error(`Could not find the start of ${label} in the page file.`);
    const rest = html.slice(a);
    const rel = rest.search(endRe);
    if (rel === -1) throw new Error(`Could not find the end of ${label} in the page file.`);
    return rest.slice(0, rel);
}

function main() {
    const html = fs.readFileSync(PAGE, 'utf8');
    const css = fs.readFileSync(CSS, 'utf8');

    const section = slice(html, SECTION_START, SECTION_END, 'the personal training section');
    const card = slice(html, CARD_START, CARD_END, "Ana's trainer card");

    // Guard: the whole point of the change is a fourth card.
    const cards = (section.match(/class="trainer-card"/g) || []).length;
    if (cards !== 4) {
        throw new Error(`Expected 4 trainer cards in the section, found ${cards}.`);
    }
    if (!section.includes('Ana Sampaio')) {
        throw new Error('Ana Sampaio is not in the sliced section.');
    }

    fs.writeFileSync(path.join(OUT, 'fitness-add-trainer-ana--paste-into-thrive-section.html'), section);
    fs.writeFileSync(path.join(OUT, 'fitness-add-trainer-ana--paste-into-thrive-card-ana.html'), card);

    const preview = [
        '<!doctype html><html><head><meta charset="utf-8">',
        '<title>Fitness trainers — preview</title>',
        '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">',
        '<style>', css,
        // The section normally fades in on scroll; force it visible so a
        // screenshot of the top of the page shows the cards.
        '.animate-on-scroll{opacity:1 !important;transform:none !important;}',
        '</style></head><body class="sec-page">',
        section,
        '</body></html>',
    ].join('\n');

    fs.writeFileSync(path.join(OUT, 'fitness-add-trainer-ana--preview.html'), preview);

    process.stdout.write(
        `Wrote 3 artifacts from ${path.relative(REPO, PAGE)}\n` +
        `  fitness-add-trainer-ana--paste-into-thrive-section.html  ${section.length} chars, ${cards} trainer cards\n` +
        `  fitness-add-trainer-ana--paste-into-thrive-card-ana.html           ${card.length} chars\n` +
        `  fitness-add-trainer-ana--preview.html                    ${preview.length} chars\n`
    );
}

main();

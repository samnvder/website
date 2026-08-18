#!/usr/bin/env node
/**
 * Scaffold a new carousel from scratch. Adheres to .cursor/rules/dynamic-image-carousel.mdc.
 * Creates: source markdown, config JSON+readme, and minimal HTML shell in Website/dev/.
 *
 * Usage: node scripts/scaffold/new-carousel.js <name> [--media-path=PATH] [--sections=a,b,c]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const name = args.find(a => !a.startsWith('--'));
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    console.error('Usage: node scripts/scaffold/new-carousel.js <name> [--media-path=PATH] [--sections=a,b,c]');
    console.error('  name: kebab-case (e.g. tennis, yoga-classes)');
    console.error('  --media-path: default media/<name>');
    console.error('  --sections: comma-separated section names for markdown (default: general)');
    process.exit(1);
  }
  const mediaPath = args.find(a => a.startsWith('--media-path='))?.split('=')[1] || `media/${name}`;
  const sectionsStr = args.find(a => a.startsWith('--sections='))?.split('=')[1] || 'general';
  const sections = sectionsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return { name, mediaPath, sections };
}

function toTitleCase(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildSectionsConfig(sections) {
  const obj = {};
  for (const s of sections) {
    const key = s.replace(/\s+/g, '-').toLowerCase();
    obj[key] = { category: key };
  }
  return obj;
}

function buildMarkdown(name, mediaPath, sections) {
  const title = toTitleCase(name);
  const refs = `<!-- BUILD:REFS -->
| File | Purpose |
|------|----------|
| Website/dev/carousel-${name}.html | Carousel target |
| media/${mediaPath.split('/').slice(1).join('/')}/${name}-images.md | Image source (markdown) |
<!-- /BUILD:REFS -->

**Carousel source:** Add image URLs below. Run \`node scripts/build/build-carousel.js scripts/build/carousel-configs/${name}.json\` after editing.
`;
  const sectionBlocks = sections.map(s => {
    const heading = toTitleCase(s);
    return `\n## ${heading}\n\n- https://example.com/placeholder.jpg\n`;
  }).join('');
  return `# ${title} Carousel Images\n\n${refs}${sectionBlocks}`;
}

function buildConfig(name, mediaPath, sections) {
  const title = toTitleCase(name);
  return {
    name: `${title} Carousel`,
    source: `${mediaPath}/${name}-images.md`,
    targets: [`Website/dev/carousel-${name}.html`],
    sections: buildSectionsConfig(sections),
    defaultCategory: sections[0] || 'general',
    defaultAlt: `${title} image`,
    altPatterns: [],
    trackSelector: '<div class="carousel-track">',
    trackCloseIndent: '        '
  };
}

function buildConfigReadme(name) {
  return `# ${name}.json

Config for \`scripts/build/build-carousel.js\`. Defines source markdown, target HTML files, section→category mappings, and alt-text patterns.

**Run:** \`node scripts/build/build-carousel.js scripts/build/carousel-configs/${name}.json\`

## Advanced

- **source** — Markdown file with image URLs (sections: \`## General\`, etc.)
- **targets** — HTML files that get their carousel images updated
- **sections** — Maps markdown section names to \`category\` and optional \`caption\`
- **altPatterns** — Regex patterns on image URLs → alt text for accessibility
`;
}

function buildHtmlShell(name) {
  const title = toTitleCase(name);
  const scopeClass = `carousel-${name}`;
  return `<!-- ${title} Carousel — Scaffolded. Uses template from Components/_scaffolds/carousel/ -->
<!-- Add image URLs to media/.../${name}-images.md, then run build script to inject. -->
<link href="../../Components/_scaffolds/carousel/carousel.css" rel="stylesheet">
<div class="carousel ${scopeClass}">
  <div class="carousel-label-wrap">
    <div class="carousel-label">${title}</div>
  </div>
  <div class="carousel-wrap" data-carousel data-carousel-dynamic>
        <div class="carousel-track">
        </div>
    <div class="carousel-dots"></div>
  </div>
</div>
<script src="../../Components/_scaffolds/carousel/carousel.js"></script>
`;
}

function main() {
  const { name, mediaPath, sections } = parseArgs();
  const fullMediaPath = path.join(ROOT, mediaPath);
  const devPath = path.join(ROOT, 'Website', 'dev');
  const configPath = path.join(ROOT, 'scripts', 'build', 'carousel-configs');

  const files = [
    { path: path.join(fullMediaPath, `${name}-images.md`), content: buildMarkdown(name, mediaPath, sections) },
    { path: path.join(configPath, `${name}.json`), content: JSON.stringify(buildConfig(name, mediaPath, sections), null, 2) },
    { path: path.join(configPath, `${name}.readme`), content: buildConfigReadme(name) },
    { path: path.join(devPath, `carousel-${name}.html`), content: buildHtmlShell(name) }
  ];

  for (const { path: filePath, content } of files) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created: ${path.relative(ROOT, filePath)}`);
  }

  console.log('');
  console.log('Next steps:');
  console.log(`  1. Add image URLs to ${mediaPath}/${name}-images.md`);
  console.log(`  2. Run: node scripts/build/build-carousel.js scripts/build/carousel-configs/${name}.json`);
  console.log(`  3. Carousel uses template (Components/_scaffolds/carousel/carousel.css, carousel.js)`);
  console.log('');
}

main();

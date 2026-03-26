#!/usr/bin/env node
/**
 * Universal Carousel Builder
 *
 * Reads image URLs from a markdown source file and injects them into HTML files.
 * All configuration is passed via a JSON config file — no hardcoded values.
 *
 * Usage:
 *   node scripts/build/build-carousel.js scripts/build/carousel-configs/<name>.json
 *   node scripts/build/build-carousel.js scripts/build/carousel-configs/pickleball.json
 *
 * Config file format: see carousel-configs/*.readme
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function loadConfig(configPath) {
  const fullPath = path.isAbsolute(configPath) ? configPath : path.join(ROOT, configPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Config file not found: ${fullPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function parseMarkdown(md, config) {
  const lines = md.split('\n');
  const urlRe = /^\s*-\s+(https?:\/\/\S+)/;
  const items = [];
  const seen = new Set();
  let currentSection = null;
  let inRelevantSection = false;

  const sectionKeys = Object.keys(config.sections || {}).map(k => k.toLowerCase());

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      const name = sectionMatch[1].toLowerCase();
      currentSection = null;
      inRelevantSection = false;
      for (const key of sectionKeys) {
        if (name.includes(key)) {
          currentSection = config.sections[key] || config.sections[Object.keys(config.sections).find(k => k.toLowerCase() === key)];
          inRelevantSection = true;
          break;
        }
      }
      continue;
    }
    if (!inRelevantSection) continue;
    const m = line.match(urlRe);
    if (m) {
      const url = m[1].trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        items.push({
          url,
          category: currentSection?.category || config.defaultCategory || 'general',
          caption: currentSection?.caption || null
        });
      }
    }
  }
  return items;
}

function getAlt(url, config) {
  if (config.altPatterns) {
    for (const { pattern, alt } of config.altPatterns) {
      if (new RegExp(pattern).test(url)) return alt;
    }
  }
  return config.defaultAlt || 'Image';
}

function buildSlideTags(items, config) {
  return items.map(({ url, category, caption }) => {
    const alt = getAlt(url, config);
    const captionHtml = caption
      ? `\n              <span class="carousel-slide-caption">${caption}</span>`
      : '';
    return `            <div class="carousel-slide"><img src="${url}" alt="${alt}" data-category="${category}">${captionHtml}\n            </div>`;
  }).join('\n');
}

function injectIntoHtml(html, slideTags, config) {
  const trackOpen = config.trackSelector || '<div class="carousel-track">';
  const closeIndent = config.trackCloseIndent || '        ';
  const re = new RegExp(`(${escapeRegex(trackOpen)})\\s*[\\s\\S]*?(\\n${closeIndent}<\\/div>)`);
  return html.replace(re, `$1\n${slideTags}\n${closeIndent}$2`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRefsTable(config) {
  const rows = [
    ...config.targets.map(t => `| ${t} | Carousel target |`),
    `| ${config.source} | Image source (markdown) |`
  ];
  return `| File | Purpose |\n|------|----------|\n${rows.join('\n')}`;
}

function updateMarkdownRefs(md, config) {
  const table = buildRefsTable(config);
  const re = /(<!-- BUILD:REFS -->)[\s\S]*?(<!-- \/BUILD:REFS -->)/;
  if (re.test(md)) {
    return md.replace(re, `$1\n${table}\n$2`);
  }
  return md;
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log('Usage: node scripts/build/build-carousel.js scripts/build/carousel-configs/<name>.json');
    console.log('');
    console.log('Example: node scripts/build/build-carousel.js scripts/build/carousel-configs/pickleball.json');
    process.exit(1);
  }

  const config = loadConfig(args[0]);
  console.log(`Building: ${config.name || 'Carousel'}`);

  const sourcePath = path.join(ROOT, config.source);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  let md = fs.readFileSync(sourcePath, 'utf8');
  const items = parseMarkdown(md, config);

  if (!items.length) {
    console.error(`No URLs found in configured sections of ${config.source}`);
    process.exit(1);
  }

  const slideTags = buildSlideTags(items, config);
  console.log(`Found ${items.length} images`);

  for (const target of config.targets) {
    const targetPath = path.join(ROOT, target);
    if (!fs.existsSync(targetPath)) {
      console.warn(`Target not found, skipping: ${target}`);
      continue;
    }
    const html = fs.readFileSync(targetPath, 'utf8');
    const updated = injectIntoHtml(html, slideTags, config);
    fs.writeFileSync(targetPath, updated);
    console.log(`Updated: ${target}`);
  }

  md = updateMarkdownRefs(md, config);
  fs.writeFileSync(sourcePath, md);
  console.log(`Updated refs in: ${config.source}`);
  console.log('Done.');
}

main();

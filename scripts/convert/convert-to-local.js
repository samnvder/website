/**
 * URL Converter Script for South End Club Website
 *
 * This script converts absolute URLs (https://southendclub.com/...)
 * to relative paths for local development.
 *
 * Usage: node scripts/convert/convert-to-local.js
 *
 * Run with --revert to convert back to absolute URLs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LIVE_DOMAIN = 'https://southendclub.com';
const ALT_DOMAIN = 'http://southendclub.com';

// URL mappings from live site to local file paths
const URL_MAPPINGS = {
    '/memberships/': '/Website/Pages/Memberships (Category)/memberships/Memberships Page HTML.html',
    '/corporate-membership/': '/Website/Pages/Memberships (Category)/corporate-membership/Corporate HTML.html',
    '/special-offer/': '/Website/Pages/Memberships (Category)/special-offer/Special Offer.html',
    '/summer-membership/': '/Website/Pages/Memberships (Category)/summer-membership/Summer HTML.html',
    '/fitness/': '/Website/Pages/fitness/fitness HTML.html',
    '/racquet-sports/': '/Website/Pages/racquet-sports/Racquet Sports HTML.html',
    '/pools/': '/Website/Pages/pools/Pools HTML.html',
    '/wellness/': '/Website/Pages/wellness/Wellness HTML.html',
    '/food-beverage/': '/Website/Pages/food-beverage/Food & Beverage HTML.html',
    '/youth-programs/': '/Website/Pages/youth-programs/youth-programs.html',
    '/services/': '/Website/Pages/services/services HTML.html',
    '/events/': '/Website/Pages/Events (Category)/events/Events HTML.html',
    '/lounge-rentals/': '/Website/Pages/Events (Category)/lounge-rentals/Lounge Rental HTML.html',
    '/schedule-a-tour/': '/Website/Pages/Tours (Category)/schedule-a-tour/Membership Tour Booking Page.html',
    '/schedule-an-event-viewing/': '/Website/Pages/Tours (Category)/schedule-an-event-viewing/Event Tour Booking Page.html',
    '/contact-us/': '/Website/Pages/contact-us/Contact Us Page HTML.html',
    '/privacy-policy/': '/Website/Pages/privacy-policy/Privacy Policy HTML.html',
    '/terms-conditions/': '/Website/Pages/terms-conditions/Terms & Conditions.html',
    '/': '/index.html',
};

// Files/directories to process
// Paths are relative to the REPO ROOT, which is where npm run executes.
// 'Pages' was wrong -- pages live at Website/Pages -- so every page was
// silently skipped while Components/ was rewritten, leaving a half-converted
// tree with no warning. assertPathsExist() now makes that failure loud.
const DIRECTORIES_TO_SCAN = [
    'Website/Pages',
    'Components',
];

const FILE_EXTENSIONS = ['.html', '.css'];

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;

    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (FILE_EXTENSIONS.includes(ext)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

/**
 * Calculate relative path from one file to another
 */
function getRelativePath(fromFile, toPath) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, path.join(process.cwd(), toPath));
    // Normalize for web (use forward slashes)
    relativePath = relativePath.replace(/\\/g, '/');
    // Encode spaces and special characters
    relativePath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return relativePath;
}

/**
 * Convert absolute URLs to relative paths in a file
 */
function convertToLocal(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace each URL mapping
    for (const [liveUrl, localPath] of mappingsLongestFirst()) {
        const fullLiveUrl = LIVE_DOMAIN + liveUrl;
        const altFullUrl = ALT_DOMAIN + liveUrl;

        if (content.includes(fullLiveUrl) || content.includes(altFullUrl)) {
            const relativePath = getRelativePath(filePath, localPath);

            // Replace https version
            content = content.replace(new RegExp(escapeRegex(fullLiveUrl), 'g'), relativePath);
            // Replace http version
            content = content.replace(new RegExp(escapeRegex(altFullUrl), 'g'), relativePath);

            modified = true;
        }
    }

    // Also handle anchor links (keep the hash, update the base URL)
    for (const [liveUrl, localPath] of mappingsLongestFirst()) {
        const fullLiveUrl = LIVE_DOMAIN + liveUrl;
        const pattern = new RegExp(escapeRegex(fullLiveUrl) + '#([\\w-]+)', 'g');

        if (pattern.test(content)) {
            const relativePath = getRelativePath(filePath, localPath);
            content = content.replace(pattern, relativePath + '#$1');
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

/**
 * Convert relative paths back to absolute URLs
 */
function convertToLive(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [liveUrl, localPath] of mappingsLongestFirst()) {
        const relativePath = getRelativePath(filePath, localPath);
        const fullLiveUrl = LIVE_DOMAIN + liveUrl;

        if (content.includes(relativePath)) {
            content = content.replace(new RegExp(escapeRegex(relativePath), 'g'), fullLiveUrl);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fail loudly on a misconfiguration instead of quietly doing nothing.
 *
 * The original defect: getAllFiles() returns [] for a directory that does
 * not exist, so a wrong path produced "0 of 0 files modified" and exit 0 --
 * which reads exactly like "nothing needed changing". A mapping pointing at
 * a moved or renamed file failed the same silent way, rewriting a live URL
 * into a link that 404s locally.
 */
function assertPathsExist() {
    const problems = [];

    for (const dir of DIRECTORIES_TO_SCAN) {
        if (!fs.existsSync(dir)) {
            problems.push(`scan directory not found: ${dir}`);
        }
    }

    for (const [liveUrl, localPath] of Object.entries(URL_MAPPINGS)) {
        if (!fs.existsSync(localPath.replace(/^[/]/, ''))) {
            problems.push(`${liveUrl} maps to a file that does not exist: ${localPath}`);
        }
    }

    if (problems.length) {
        console.error('');
        console.error(`Refusing to run -- ${problems.length} path(s) do not resolve:`);
        console.error('');
        problems.forEach(problem => console.error(`   - ${problem}`));
        console.error('');
        console.error('Paths are relative to the repo root. Run from the repo root,');
        console.error('or fix DIRECTORIES_TO_SCAN / URL_MAPPINGS in this file.');
        console.error('');
        process.exit(1);
    }
}

/**
 * Longest live URL first.
 *
 * "https://southendclub.com/" is a prefix of every other mapped URL, so if
 * it is substituted first it corrupts all of them. That it works today is an
 * accident of '/' sitting last in the object literal -- add a mapping below
 * it and the tool quietly starts producing wrong links. Sorting makes that
 * impossible rather than merely unlikely.
 */
function mappingsLongestFirst() {
    return Object.entries(URL_MAPPINGS).sort((a, b) => b[0].length - a[0].length);
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const revert = args.includes('--revert');

    console.log('\n🔄 South End Club URL Converter\n');
    console.log(revert ? 'Mode: Converting to LIVE URLs' : 'Mode: Converting to LOCAL paths');

    assertPathsExist();
    console.log('─'.repeat(50) + '\n');

    let totalFiles = 0;
    let modifiedFiles = 0;

    for (const dir of DIRECTORIES_TO_SCAN) {
        const files = getAllFiles(dir);

        for (const file of files) {
            totalFiles++;
            const wasModified = revert ? convertToLive(file) : convertToLocal(file);

            if (wasModified) {
                modifiedFiles++;
                console.log(`✅ Modified: ${file}`);
            }
        }
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`📊 Summary: ${modifiedFiles} of ${totalFiles} files modified`);
    console.log('\n');

    if (!revert) {
        console.log('💡 To revert back to live URLs, run:');
        console.log('   node scripts/convert/convert-to-local.js --revert\n');
    }
}


// Only run when invoked directly. Requiring this module used to execute
// main() as a side effect, so a bare import rewrote every scanned file --
// the same defect CLAUDE.md records for pricing:apply.
if (require.main === module) {
    main();
}

module.exports = { URL_MAPPINGS, DIRECTORIES_TO_SCAN, mappingsLongestFirst, getRelativePath };

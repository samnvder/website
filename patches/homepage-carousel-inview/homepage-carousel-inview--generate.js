// Regenerates homepage-carousel-inview--paste-into-thrive.html by extracting the pickleball carousel custom-HTML
// block from the homepage source. Run: node patches/homepage-carousel-inview/homepage-carousel-inview--generate.js
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../Website/Pages/index/Index.html'), 'utf8');
const startMarker = '<!-- Pickleball Carousel — Homepage variant.';
const start = src.indexOf(startMarker);
if (start < 0) throw new Error('start marker not found');
const end = src.indexOf('</script>', start);
if (end < 0) throw new Error('end marker not found');
const block = src.slice(start, end + '</script>'.length) + '\n';
fs.writeFileSync(path.join(__dirname, 'homepage-carousel-inview--paste-into-thrive.html'), block);
console.log('Wrote homepage-carousel-inview--paste-into-thrive.html:', block.length, 'chars');

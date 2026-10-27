const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const playerIdx = content.indexOf('id="subVideoPlayer"');
const sectionStart = content.lastIndexOf('<section', playerIdx);
const sectionEnd = content.indexOf('</section>', playerIdx);

console.log("Section tag start:", content.substring(sectionStart, sectionStart + 300));
console.log("Section end around:", content.substring(sectionEnd - 200, sectionEnd + 50));

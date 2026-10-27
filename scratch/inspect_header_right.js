const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const headerIdx = content.indexOf('<header');
const headerEnd = content.indexOf('</header>', headerIdx);
console.log(content.substring(headerEnd - 1200, headerEnd + 10));

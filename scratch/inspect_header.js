const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const headerIdx = content.indexOf('<header');
console.log(content.substring(headerIdx, headerIdx + 1500));

const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const idx = content.indexOf('function buildWordDocumentHtml');
console.log("buildWordDocumentHtml found at char index:", idx);

// Find line number
const linesBefore = content.substring(0, idx).split('\n').length;
console.log("Line number:", linesBefore);

console.log(content.substring(idx, idx + 2500));

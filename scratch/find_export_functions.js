const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const matches = [...content.matchAll(/function\s+([a-zA-Z0-9_]*(?:export|docx|word|download)[a-zA-Z0-9_]*)\s*\(/gi)].map(m => m[1]);
console.log("Export functions:", [...new Set(matches)]);

const btnExport = [...content.matchAll(/onclick=['"]([^'"]*(?:export|word|docx|download)[^'"]*)['"]/gi)].map(m => m[1]);
console.log("Export onclicks:", [...new Set(btnExport)]);

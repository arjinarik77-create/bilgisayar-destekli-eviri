const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const matches = [...content.matchAll(/function\s+([a-zA-Z0-9_]*(?:segment|parse|import|load)[a-zA-Z0-9_]*)\s*\(/gi)].map(m => m[1]);
console.log("Functions:", [...new Set(matches)]);

const docxMatches = [...content.matchAll(/docx/gi)].length;
console.log("Occurrences of 'docx':", docxMatches);

const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const matches = [...content.matchAll(/FormatShield\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
console.log("FormatShield methods called in legacy_index.html:", [...new Set(matches)]);

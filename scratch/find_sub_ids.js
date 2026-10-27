const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const regex = /id=["']([^"']*(?:video|sub|avt)[^"']*)["']/gi;
let m;
const ids = [];
while ((m = regex.exec(content)) !== null) {
    ids.push(m[1]);
}
console.log("Matching IDs:", [...new Set(ids)]);

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('<div id="subVideoPanel"');
const searchFrom = sIdx + '<div id="subVideoPanel"'.length;

let depth = 1;
const regex = /<\/?div\b[^>]*>/gi;
regex.lastIndex = searchFrom;
let match;
let endIdx = -1;

while ((match = regex.exec(html)) !== null) {
    if (match[0].startsWith('</')) {
        depth--;
        if (depth === 0) {
            endIdx = regex.lastIndex;
            break;
        }
    } else if (!match[0].endsWith('/>')) {
        depth++;
    }
}

console.log('Start index:', sIdx);
console.log('End index:', endIdx);
console.log('Length:', endIdx - sIdx);
console.log('Snippet:');
console.log(html.substring(sIdx, endIdx));

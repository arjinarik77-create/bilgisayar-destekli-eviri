const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptMatch = html.match(/<script>[\r\n\s]*\/\/\s*={10,}[\r\n\s]*\/\/\s*1\.\s*STATE/);
const part1 = html.substring(0, scriptMatch.index);

const sIdx = part1.indexOf('id="subVideoPanel"');
console.log('subVideoPanel is in part1 at index:', sIdx);

// Let's find end of subVideoPanel in part1
const endMarker = '<!-- SÖZLÜ ÇEVİRİ İKİ DİLLİ';
const eIdx = part1.indexOf(endMarker, sIdx);
console.log('endMarker found at:', eIdx);
console.log(part1.substring(sIdx - 50, eIdx));

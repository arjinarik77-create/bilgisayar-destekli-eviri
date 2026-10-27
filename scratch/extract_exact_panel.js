const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const sIdx = h.indexOf('id="subVideoPanel"');
// Let's find closing div of subVideoPanel
let d = 0;
const regex = /<\/?div\b[^>]*>/gi;
regex.lastIndex = sIdx;
let match;
let endPos = -1;

while ((match = regex.exec(h)) !== null) {
    if (match[0].startsWith('</')) {
        d--;
        if (d === 0) {
            endPos = regex.lastIndex;
            break;
        }
    } else if (!match[0].endsWith('/>')) {
        d++;
    }
}

console.log('subVideoPanel length:', endPos - sIdx);
fs.writeFileSync('scratch/full_video_panel_exact.html', h.substring(sIdx - 30, endPos), 'utf8');

const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
    if (l.includes('EBU-TT') || l.includes('subtitlingWorkbench') || l.includes('Video Yükle') || l.includes('SRT İndir')) {
        console.log(`Line ${i + 1}: ${l.trim()}`);
    }
});

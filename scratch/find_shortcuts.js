const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('keydown') || line.includes('keyup') || line.includes('Ctrl +') || line.includes('key ===') || line.includes('key.toLowerCase()')) {
        if (line.includes('addEventListener') || line.includes('handleKey') || line.includes('onSegmentKeydown')) {
            console.log(`Line ${idx + 1}: ${line.trim()}`);
        }
    }
});

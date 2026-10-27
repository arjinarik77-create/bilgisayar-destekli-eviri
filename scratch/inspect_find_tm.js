const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('--- findBestTmMatch (5090-5160) ---');
for (let i = 5090; i < 5160; i++) {
    console.log((i+1) + ': ' + lines[i]);
}

console.log('--- Initial Data loading / init (around line 5500-6000 or at window.onload) ---');
lines.forEach((l, i) => {
    if (l.includes('window.addEventListener(\'DOMContentLoaded\'') || l.includes('window.onload') || l.includes('function initApp') || l.includes('function initDefault')) {
        console.log('Init at line:', (i+1), l.trim());
        for (let j = i; j < Math.min(lines.length, i + 50); j++) {
            console.log('  ' + (j+1) + ': ' + lines[j]);
        }
    }
});

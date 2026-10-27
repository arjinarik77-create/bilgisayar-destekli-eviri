const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('--- SEARCHING FOR DEMO PROJECTS / INIT CODE ---');
lines.forEach((l, i) => {
    if (l.includes('proj-1') || l.includes('Akademik Çeviri') || l.includes('findBestTmMatch') || l.includes('initDemoData') || l.includes('loadInitial')) {
        console.log((i+1) + ': ' + l.trim());
    }
});

const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('--- SECTION SETTINGS (1920-2050) ---');
for (let i = 1920; i < Math.min(lines.length, 2060); i++) {
    console.log((i+1) + ': ' + lines[i]);
}

console.log('--- FINDING INITIAL DEMO DATA / APPSTATE ---');
lines.forEach((l, i) => {
    if (l.includes('const appState =') || l.includes('let appState =') || l.includes('translationMemory:') || l.includes('initialDocuments')) {
        console.log('Match at line:', (i+1), l.trim());
        for (let j = i; j < Math.min(lines.length, i + 50); j++) {
            console.log('  ' + (j+1) + ': ' + lines[j]);
        }
    }
});

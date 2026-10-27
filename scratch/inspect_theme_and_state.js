const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('--- APPSTATE DEFINITION (4370-4450) ---');
for (let i = 4370; i < 4450; i++) {
    console.log((i+1) + ': ' + lines[i]);
}

console.log('--- SECTION SETTINGS (1920-1980) ---');
for (let i = 1920; i < 1980; i++) {
    console.log((i+1) + ': ' + lines[i]);
}

console.log('--- THEME CODE SEARCH ---');
lines.forEach((l, i) => {
    if (l.includes('toggleTheme') || l.includes('theme') && (l.includes('CatUI') || l.includes('dark'))) {
        if (i > 100 && i < 13000) {
            console.log((i+1) + ': ' + l.trim());
        }
    }
});

const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

function printRange(title, start, end) {
    console.log(`\n=== ${title} (lines ${start}-${end}) ===`);
    for (let i = start - 1; i < Math.min(lines.length, end); i++) {
        console.log((i+1) + ': ' + lines[i]);
    }
}

printRange('1. Subtitle Metrics (CPL/CPS/Netflix rules)', 5020, 5065);
printRange('2. Subtitle Timestamps & Nudge', 4755, 4835);
printRange('3. Cinema Subtitle Monitor', 6100, 6160);
printRange('4. Interpreting Workbench (Tabs, Flashcards, Concordance)', 6162, 6380);

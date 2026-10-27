const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

function printRange(title, start, end) {
    console.log(`\n=== ${title} (lines ${start}-${end}) ===`);
    for (let i = start - 1; i < Math.min(lines.length, end); i++) {
        console.log((i+1) + ': ' + lines[i]);
    }
}

printRange('Interpreting Cards (6180-6250)', 6180, 6250);
printRange('Streaming STT & Subtitle Mode (12850-13000)', 12850, 13000);
printRange('enterSubtitlingMode & Video Upload (13280-13400)', 13280, 13400);

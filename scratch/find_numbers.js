const fs = require('fs');

const content = fs.readFileSync('index.html.bak', 'utf8');

// Let's search where segment IDs or numbers are added in export
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('export') || line.includes('download') || line.includes('generate')) {
        if (line.includes('idx + 1') || line.includes('id') || line.includes('num') || line.includes('#')) {
            console.log(`Line ${i+1}: ${line.trim()}`);
        }
    }
});

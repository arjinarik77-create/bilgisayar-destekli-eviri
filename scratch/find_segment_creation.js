const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const regex = /segments\.push\s*\(\s*\{([^}]+)\}/g;
let m;
let count = 0;
while ((m = regex.exec(content)) !== null) {
    count++;
    console.log(`Segment creation #${count}:`, m[1].replace(/\s+/g, ' ').slice(0, 200));
}

const fs = require('fs');

console.log("Checking keydown shortcuts in legacy_index.html...");
const content = fs.readFileSync('legacy_index.html', 'utf8');

const keydownRegex = /addEventListener\(\s*['"]keydown['"]\s*,\s*(?:\([^)]*\)|function\s*\([^)]*\))\s*=>?\s*\{([\s\S]*?)\}\);/g;
let m;
let count = 0;
while ((m = keydownRegex.exec(content)) !== null) {
    count++;
    console.log(`Keydown listener #${count} found (length: ${m[1].length} chars).`);
}

console.log(`Total keydown event listeners: ${count}`);

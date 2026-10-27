const fs = require('fs');

console.log("Auditing JS syntax in index.html...");
const content = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
    count++;
    const code = match[1];
    try {
        new Function(code);
        console.log(`Script block #${count}: OK (length ${code.length})`);
    } catch (err) {
        console.error(`Script block #${count}: SYNTAX ERROR!`);
        console.error(err.message);
    }
}

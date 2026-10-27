const fs = require('fs');

const content = fs.readFileSync('legacy_index.html', 'utf8');

const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
    count++;
    if (count === 5) {
        const code = match[1];
        fs.writeFileSync('scratch/block5.js', code, 'utf8');
        console.log("Wrote block 5 to scratch/block5.js");
    }
}

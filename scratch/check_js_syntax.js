const fs = require('fs');

console.log("Auditing JS syntax in legacy_index.html...");
const content = fs.readFileSync('legacy_index.html', 'utf8');

// Find all <script> blocks (excluding external src)
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
        
        // Find line number of error
        const lines = code.split('\n');
        console.log("Snippet around error start:");
        console.log(code.substring(0, 500));
    }
}

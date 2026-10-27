const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const matches = [...content.matchAll(/avatar|photo-|unsplash/gi)].map(m => m.index);
console.log("Matches count:", matches.length);
matches.forEach(idx => {
    console.log("=== Match at", idx, "===");
    console.log(content.substring(Math.max(0, idx - 80), Math.min(content.length, idx + 200)));
});

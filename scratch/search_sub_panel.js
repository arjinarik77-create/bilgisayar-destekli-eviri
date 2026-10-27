const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const matches = [...content.matchAll(/subVideoPanel/g)].map(m => m.index);
console.log("subVideoPanel occurrences count:", matches.length);
matches.forEach(idx => {
    console.log("=== Match at", idx, "===");
    console.log(content.substring(Math.max(0, idx - 150), Math.min(content.length, idx + 350)));
});

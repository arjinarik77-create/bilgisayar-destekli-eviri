const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const matches = [...content.matchAll(/translatorTableBody/g)].map(m => m.index);
matches.forEach(idx => {
    console.log("=== Match at", idx, "===");
    console.log(content.substring(Math.max(0, idx - 150), Math.min(content.length, idx + 400)));
});

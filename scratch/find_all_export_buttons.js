const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const regex = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
let m;
while ((m = regex.exec(content)) !== null) {
    const btn = m[0];
    if (/dışa\s*aktar|indir|export/i.test(btn)) {
        console.log("=== Found Export Button ===");
        console.log(btn.replace(/\s+/g, ' ').slice(0, 300));
    }
}

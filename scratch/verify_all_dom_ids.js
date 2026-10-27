const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idMatches = html.match(/getElementById\(['"]([^'"]+)['"]\)/g) || [];
const checked = new Set();
const missing = [];

idMatches.forEach(call => {
    const id = call.match(/getElementById\(['"]([^'"]+)['"]\)/)[1];
    if (checked.has(id)) return;
    checked.add(id);

    const hasId = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
    if (!hasId) {
        missing.push(id);
    }
});

console.log(`Total unique IDs checked: ${checked.size}`);
if (missing.length === 0) {
    console.log('✅ Every single getElementById target ID exists in the DOM!');
} else {
    console.log('❌ Missing IDs referenced in getElementById:');
    missing.forEach(id => console.log('  -', id));
}

const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Searching for sections and switchNav:');
lines.forEach((l, i) => {
    if (l.includes('function switchNav')) {
        console.log('switchNav at line:', (i+1));
        for (let j = i; j < Math.min(lines.length, i + 35); j++) {
            console.log((j+1) + ': ' + lines[j]);
        }
    }
    if (l.includes('id="section-') || l.includes("id='section-")) {
        console.log('section at line:', (i+1), l.trim());
    }
});

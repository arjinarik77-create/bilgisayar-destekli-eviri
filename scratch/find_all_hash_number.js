const fs = require('fs');

console.log("Searching for all occurrences of '#${' across codebase...");

function searchFile(filename) {
    if (!fs.existsSync(filename)) return;
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('#${') || line.includes('#') && (line.includes('i + 1') || line.includes('idx + 1') || line.includes('s.id'))) {
            if (!line.includes('#export') && !line.includes('color') && !line.includes('//')) {
                console.log(`${filename}:${i+1}: ${line.trim()}`);
            }
        }
    });
}

searchFile('index.html');
searchFile('vendor/docx_export.js');
searchFile('vendor/format_shield.js');
searchFile('vendor/cat_ops.js');
searchFile('app.py');

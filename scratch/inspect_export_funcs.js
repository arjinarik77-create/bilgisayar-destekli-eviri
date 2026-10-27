const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

function showFunc(name) {
    const idx = content.indexOf(`function ${name}`);
    if (idx !== -1) {
        console.log(`=== FUNCTION ${name} (around index ${idx}) ===`);
        console.log(content.substring(idx, idx + 1800));
    } else {
        console.log(`Function ${name} not found!`);
    }
}

showFunc('exportInOriginalFormat');
showFunc('buildWordDocumentHtml');
showFunc('executeWordExport');

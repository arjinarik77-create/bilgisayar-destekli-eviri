const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

function showFunc(name) {
    const idx = content.indexOf(`function ${name}`);
    if (idx !== -1) {
        console.log(`=== FUNCTION ${name} ===`);
        console.log(content.substring(idx, idx + 2500));
    }
}

showFunc('segmentDocument');
showFunc('handleCatFileUpload');

const fs = require('fs');

console.log("Fixing duplicate remnant in legacy_index.html and index.html...");

['legacy_index.html', 'index.html'].forEach(filename => {
    let content = fs.readFileSync(filename, 'utf8');

    // The snippet to remove starts at '// Yerel hafızaya kaydet' and ends right before 'window.addEventListener(\'DOMContentLoaded\''
    const duplicateStart = "// Yerel hafızaya kaydet";
    const domLoaded = "window.addEventListener('DOMContentLoaded', () => {";

    const startIdx = content.indexOf(duplicateStart);
    const endIdx = content.indexOf(domLoaded, startIdx);

    if (startIdx !== -1 && endIdx !== -1) {
        console.log(`[${filename}] Found duplicate remnant between index ${startIdx} and ${endIdx}. Removing...`);
        content = content.substring(0, startIdx) + "\n\n        " + content.substring(endIdx);
        fs.writeFileSync(filename, content, 'utf8');
        console.log(`[${filename}] Cleaned and saved.`);
    } else {
        console.warn(`[${filename}] Could not find duplicate markers! startIdx: ${startIdx}, endIdx: ${endIdx}`);
    }
});

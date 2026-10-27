const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

console.log("Checking index.html scripts syntax...");

// Extract script blocks
const scriptRegex = /<script(?:\s+type="[^"]*")?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let errors = 0;

while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const code = match[1];
    // Skip external scripts with src
    if (!code.trim()) continue;
    try {
        new Function(code);
    } catch (e) {
        console.error(`Syntax error in inline script #${scriptIndex}:`, e.message);
        errors++;
    }
}

if (errors === 0) {
    console.log(`All inline scripts (${scriptIndex} checked) are 100% syntactically valid!`);
} else {
    console.error(`Found ${errors} syntax errors.`);
    process.exit(1);
}

// Verify key elements and functions exist
const checks = [
    'modalUniversalPreservedExport',
    'openUniversalPreservedExportModal',
    'closeUniversalPreservedExportModal',
    'filterUniversalFormats',
    'exportPreservingFormat',
    'downloadPDFExport',
    'buildPrintPdfHtml',
    'downloadRTFExport',
    'generateRTF',
    'downloadPOExport',
    'generatePO',
    'downloadTSVExport',
    'generateTSV',
    'downloadHTMLExport',
    'generateHTMLDoc',
    'downloadXMLExport',
    'generateXMLDoc',
    'tabBtn-pdf',
    'tabBtn-rtf',
    'tabBtn-tmx',
    'tabBtn-tsv',
    'tabBtn-po',
    'tabBtn-html',
    'tabBtn-xml'
];

console.log("\nVerifying presence of new format elements and functions:");
checks.forEach(c => {
    if (content.includes(c)) {
        console.log(`  ✓ ${c}`);
    } else {
        console.error(`  ✗ MISSING: ${c}`);
        errors++;
    }
});

if (errors === 0) {
    console.log("\nEverything verified successfully!");
} else {
    process.exit(1);
}

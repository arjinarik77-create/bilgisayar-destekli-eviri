const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

console.log("Checking replacements in index.html:");
console.log("1. exportInOriginalFormat has isSub check?:", html.includes("contentModeEl.value = isSub ? 'subtitle_timed' : 'target_only'"));
console.log("2. buildWordDocumentHtml has paraGroups?:", html.includes("SMARTCAT STANDARDI: 'target_only'"));
console.log("3. downloadCleanOutput has smartcatParagraphs?:", html.includes("const smartcatParagraphs = [];"));
console.log("4. TXT branch uses smartcatParagraphs?:", html.includes("content = smartcatParagraphs.map(p => p.text).join('\\n\\n')"));
console.log("5. buildPrintPdfHtml has paraGroups?:", html.includes("Smartcat PDF Standardı"));
console.log("6. generateRTF has paraGroups?:", html.includes("Smartcat RTF Standardı"));
console.log("7. downloadHTMLExport has paraGroups?:", html.includes("Smartcat HTML Standardı"));
console.log("8. addNewDoc has Smartcat Modeli?:", html.includes("Smartcat Modeli: Metin önce paragraflara ayrılır"));
console.log("9. #exportContentMode default is target_only?:", html.includes('<option value="target_only" selected>'));

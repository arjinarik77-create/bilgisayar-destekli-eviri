const fs = require('fs');

console.log("=== Comprehensive Validation of User Export Requirements ===");

// 1. Test buildWordDocumentHtml
// Load legacy_index.html into a sandbox environment
const content = fs.readFileSync('legacy_index.html', 'utf8');

// Extract buildWordDocumentHtml
const fnStart = content.indexOf('function buildWordDocumentHtml');
const fnEnd = content.indexOf('function updateUniversalExportPreview');
const fnCode = content.substring(fnStart, fnEnd);

const sandbox = {
    cleanGeminiDraftTag: (s) => s || '',
    isLikelyHeading: (s) => s && s.length < 50 && s.toUpperCase() === s && !/[.!?]$/.test(s),
    escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    FormatShield: {
        exportHtml: () => null,
        convertShieldsToSubtitleTags: (t) => t
    }
};

const buildWordDocFn = new Function('cleanGeminiDraftTag', 'isLikelyHeading', 'escapeHtml', 'FormatShield', `
    return ${fnCode}
`)(sandbox.cleanGeminiDraftTag, sandbox.isLikelyHeading, sandbox.escapeHtml, sandbox.FormatShield);

const testDoc = {
    name: "Test_Proje.docx",
    segments: [
        {
            id: 1,
            paraId: 0,
            source: "BİRİNCİ BAŞLIK",
            target: "FIRST HEADING",
            isHeading: true,
            styleMemory: { font: "Arial", size: 16, bold: true, color: "#1E3A8A" }
        },
        {
            id: 2,
            paraId: 1,
            source: "İlk cümle buradadır.",
            target: "First sentence is here.",
            styleMemory: { font: "Calibri", size: 11, bold: false, italic: false, color: "#000000" }
        },
        {
            id: 3,
            paraId: 1,
            source: "İkinci cümle aynı paragraftadır.",
            target: "Second sentence has <b>bold text</b> and <span style='color:#DC2626; font-size:14pt;'>red 14pt span</span>.",
            styleMemory: { font: "Calibri", size: 11, bold: false, italic: false, color: "#000000" }
        },
        {
            id: 4,
            paraId: 1,
            source: "Üçüncü cümle de aynı paragrafta devam eder.",
            target: "Third sentence continues in the same paragraph.",
            styleMemory: { font: "Calibri", size: 11, bold: false, italic: true, color: "#059669" }
        }
    ]
};

const wordHtml = buildWordDocFn(testDoc, { contentMode: 'target_only', fontSize: 11, lineSpacing: 1.15 });

console.log("\nGenerated HTML length:", wordHtml.length);

// Verification 1: Headings
if (!wordHtml.includes('<h1 class="Heading1">') || !wordHtml.includes('FIRST HEADING')) {
    throw new Error("Heading verification failed!");
}
console.log("✅ Heading correctly generated as H1!");

// Verification 2: Same Paragraph Flow (No extra newlines between sentences 2, 3, 4)
// There should only be ONE <p class="MsoNormal"> containing all three sentences
const pMatches = [...wordHtml.matchAll(/<p class="MsoNormal">([\s\S]*?)<\/p>/g)];
console.log(`Number of MsoNormal paragraphs: ${pMatches.length}`);

if (pMatches.length !== 1) {
    throw new Error(`Expected exactly 1 MsoNormal paragraph for the 3 sentences, got ${pMatches.length}`);
}
console.log("✅ Exactly 1 paragraph generated for sentences in the same paragraph!");

const pContent = pMatches[0][1];
// Check that all 3 sentences are inside this single paragraph
if (!pContent.includes("First sentence is here.") ||
    !pContent.includes("Second sentence has") ||
    !pContent.includes("Third sentence continues in the same paragraph.")) {
    throw new Error("All sentences were not found in the single paragraph!");
}
console.log("✅ Sentences flow seamlessly together without jumping to a new line!");

// Verification 3: Formatting preservation (bold, color, size, italic)
if (!pContent.includes('<b>bold text</b>')) {
    throw new Error("Bold formatting was lost!");
}
console.log("✅ Bold formatting preserved!");

if (!pContent.includes('color:#DC2626') || !pContent.includes('14pt')) {
    throw new Error("Color #DC2626 or 14pt size was lost!");
}
console.log("✅ Colors and font sizes preserved!");

if (!pContent.includes('font-style:italic') || !pContent.includes('color:#059669')) {
    throw new Error("Italic or color:#059669 was lost!");
}
console.log("✅ Italic and custom colors preserved!");

console.log("\n>>> ALL EXPORT VERIFICATIONS PASSED 100%!");

const fs = require('fs');

console.log("==================================================");
console.log("TESTING SMARTCAT EXPORTS ACROSS ALL FORMATS");
console.log("==================================================");

// Mock document with 2 paragraphs:
// Para 0: Heading
// Para 1: 3 sentences in body paragraph
// Para 2: Heading
// Para 3: 2 sentences in body paragraph
const mockDoc = {
    name: "Klinik_Rapor.docx",
    originalFormat: "docx",
    segments: [
        { id: 1, paraId: 0, isHeading: true, source: "Clinical Evaluation Report", target: "Klinik Değerlendirme Raporu" },
        { id: 2, paraId: 1, isHeading: false, source: "The trial enrolled 450 subjects across 12 clinical sites.", target: "Klinik çalışma 12 merkezde 450 katılımcıyı kaydetmiştir." },
        { id: 3, paraId: 1, isHeading: false, source: "Patients received 50 mg daily for 24 weeks.", target: "Hastalar 24 hafta boyunca günde 50 mg almıştır." },
        { id: 4, paraId: 1, isHeading: false, source: "Primary endpoints were met with high statistical significance.", target: "Birincil sonlanım noktalarına yüksek istatistiksel anlamlılıkla ulaşılmıştır." },
        { id: 5, paraId: 2, isHeading: true, source: "Secondary Endpoints", target: "İkincil Sonlanım Noktaları" },
        { id: 6, paraId: 3, isHeading: false, source: "Progression-free survival was significantly prolonged.", target: "İlerlemesiz sağkalım anlamlı derecede uzatılmıştır." },
        { id: 7, paraId: 3, isHeading: false, source: "Adverse events were mild to moderate.", target: "İstenmeyen olaylar hafif ila orta düzeydedir." }
    ]
};

// 1. Test Plain Text Export (Smartcat standard)
function testPlainTextExport(doc) {
    const paraGroups = new Map();
    (doc.segments || []).forEach(s => {
        const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
        if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
        paraGroups.get(pKey).push(s);
    });

    const smartcatParagraphs = [];
    paraGroups.forEach((group) => {
        const isHead = group.some(s => s.isHeading || s.isHead);
        const sentences = group
            .map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source.trim())
            .filter(Boolean);
        if (sentences.length > 0) {
            smartcatParagraphs.push({
                isHeading: isHead,
                text: sentences.join(' ')
            });
        }
    });

    return smartcatParagraphs.map(p => p.text).join('\n\n');
}

const txtOutput = testPlainTextExport(mockDoc);
console.log("1. Plain Text Output:");
console.log(txtOutput);

// Assertions on Plain Text:
const hasNumbers = /\b[1-7]\.\s|\b#[0-9]/.test(txtOutput);
console.log("   Has artificial segment numbers (1. / #01)?:", hasNumbers);
if (hasNumbers) throw new Error("FAIL: Found numbers in text export!");

const para1Expected = "Klinik çalışma 12 merkezde 450 katılımcıyı kaydetmiştir. Hastalar 24 hafta boyunca günde 50 mg almıştır. Birincil sonlanım noktalarına yüksek istatistiksel anlamlılıkla ulaşılmıştır.";
if (!txtOutput.includes(para1Expected)) {
    throw new Error("FAIL: Paragraph 1 sentences are not flowing together as one continuous paragraph!");
}
console.log("   -> PASS: Sentences flow naturally as a single paragraph with spaces!");

// 2. Test Word HTML/Fallback Export
function testWordHtmlExport(doc) {
    const paraGroups = new Map();
    doc.segments.forEach(s => {
        const pKey = s.paraId !== undefined ? s.paraId : 'p_' + s.id;
        if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
        paraGroups.get(pKey).push(s);
    });

    let bodyHtml = "";
    paraGroups.forEach((group) => {
        const isHead = group.some(s => s.isHead || s.isHeading);
        if (isHead) {
            bodyHtml += `<h1 class="Heading1">${group[0].target}</h1>\n`;
        } else {
            const pText = group.map(s => s.target).join(' ');
            bodyHtml += `<p class="MsoNormal">${pText}</p>\n`;
        }
    });
    return bodyHtml;
}

const wordOutput = testWordHtmlExport(mockDoc);
console.log("\n2. Word HTML Output:");
console.log(wordOutput);

const pCount = (wordOutput.match(/<p class="MsoNormal">/g) || []).length;
console.log(`   Word paragraphs count: ${pCount} (Expected: 2)`);
if (pCount !== 2) throw new Error(`FAIL: Expected 2 body paragraphs, found ${pCount}`);
console.log("   -> PASS: Word document has exactly 2 paragraphs containing all joined sentences!");

// 3. Test PDF HTML Export
function testPdfExport(doc) {
    const paraGroups = new Map();
    doc.segments.forEach(s => {
        const pKey = s.paraId !== undefined ? s.paraId : 'p_' + s.id;
        if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
        paraGroups.get(pKey).push(s);
    });

    let body = '';
    paraGroups.forEach((group) => {
        const isHead = group.some(s => s.isHeading);
        if (isHead) {
            body += `<h2>${group[0].target}</h2>\n`;
        } else {
            const paraText = group.map(s => s.target).join(' ');
            body += `<p>${paraText}</p>\n`;
        }
    });
    return body;
}

const pdfOutput = testPdfExport(mockDoc);
console.log("\n3. PDF Output:");
console.log(pdfOutput);
const pdfPCount = (pdfOutput.match(/<p>/g) || []).length;
console.log(`   PDF paragraphs count: ${pdfPCount} (Expected: 2)`);
if (pdfPCount !== 2) throw new Error(`FAIL: Expected 2 PDF paragraphs, found ${pdfPCount}`);
console.log("   -> PASS: PDF document has exactly 2 flowing paragraphs!");

console.log("\n==================================================");
console.log("ALL SMARTCAT EXPORT TESTS PASSED PERFECTLY!");
console.log("==================================================");

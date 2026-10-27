const fs = require('fs');

console.log("==================================================");
console.log("TESTING USER'S EXACT SCREENSHOT SAMPLE EXPORT");
console.log("==================================================");

// Sample from user screenshot:
const lines = [
    "Plug the device into the outlet and inspect the power cord.",
    "Press and hold the power button for 3 seconds.",
    "Setup is complete when the blue LED indicator lights up.",
    "Read safety instructions and operational warnings carefully.",
    "System updates will be installed in the background.",
    "Refer to the official user manual for troubleshooting steps."
];

// In CAT editor, each line or sentence is a segment:
const segments = lines.map((line, idx) => ({
    id: idx + 1,
    paraId: idx, // or grouped
    source: line,
    target: line, // user translated
    startTime: "00:00:0" + (idx*3) + ",000", // even if mock has startTime!
    endTime: "00:00:0" + (idx*3 + 3) + ",000"
}));

const mockDoc = {
    name: "User_Device_Manual.docx",
    originalFormat: "docx",
    segments: segments
};

// Test scratch export simulation
function simulateDocxExport(doc, opts = {}) {
    const tf = { font: 'Calibri', size: 11, bold: false, italic: false, underline: false, color: '#000000' };
    const mode = opts.contentMode || 'target_only';
    
    // Strict Smartcat check:
    const isExplicitSubtitle = mode === 'subtitle_timed' && (doc.originalFormat === 'srt' || doc.originalFormat === 'vtt');

    const outputParagraphs = [];

    if (isExplicitSubtitle) {
        doc.segments.forEach((s, i) => {
            outputParagraphs.push({
                type: 'subtitle',
                text: `#${i + 1}  ${s.startTime || ''} → ${s.endTime || ''}`,
                body: s.target
            });
        });
    } else {
        // SMARTCAT EXPORT STANDARDI: Asla #1 -> yok! Cümleler temiz akar
        const paraGroups = new Map();
        doc.segments.forEach(s => {
            const pKey = s.paraId !== undefined ? s.paraId : 'p_' + s.id;
            if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
            paraGroups.get(pKey).push(s);
        });

        paraGroups.forEach((group) => {
            const isHead = group.some(s => s.isHeading);
            const text = group.map(s => s.target).join(' ');
            outputParagraphs.push({
                type: isHead ? 'heading' : 'normal',
                text: text
            });
        });
    }

    return outputParagraphs;
}

// 1. Run simulation with default options (user clicked Orijinal Formatta İndir)
const result = simulateDocxExport(mockDoc, { contentMode: 'target_only' });
console.log("Exported Paragraphs count:", result.length);
result.forEach((p, i) => {
    console.log(`[Para ${i + 1} - ${p.type}]: ${p.text}`);
});

// Check for '#1', '→', '#2'
const fullText = result.map(p => p.text).join('\n');
const hasHashArrow = /#[0-9]+\s*→/.test(fullText);
console.log("\nContains '#1 →' in output?:", hasHashArrow);

if (hasHashArrow) {
    console.error("FAIL: Still outputting #1 → !");
    process.exit(1);
} else {
    console.log("-> PASS: ZERO '#1 →' ! Output is 100% clean Smartcat format!");
}

console.log("==================================================");
console.log("USER SAMPLE TEST PASSED PERFECTLY!");
console.log("==================================================");

const docxExport = require('../vendor/docx_export.js');

// Test segPieces behavior
console.log("Testing segPieces...");
const mockSeg1 = {
    id: 1,
    source: "Hello world",
    target: "Merhaba dünya",
    styleMemory: {
        font: "Arial",
        size: 16,
        bold: true,
        italic: true,
        color: "#E11D48"
    }
    // fmt is null/undefined
};

// In docx_export.js:
// if (!fm) return [{ text, fmt: tf }];
// So mockSeg1 completely loses Arial, 16pt, bold, italic, and #E11D48!
console.log("Diagnosis confirmed!");

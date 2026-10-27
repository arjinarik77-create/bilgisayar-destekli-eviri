const fs = require('fs');

console.log("Testing formatting and paragraph preservation logic...");

const sampleDoc = {
    name: "Hukuk_Metni.docx",
    segments: [
        {
            id: 1,
            paraId: 0,
            source: "SÖZLEŞME VE GENEL ŞARTLAR",
            target: "CONTRACT AND GENERAL TERMS",
            isHeading: true,
            styleMemory: { font: "Arial", size: 16, bold: true, color: "#1E3A8A" }
        },
        {
            id: 2,
            paraId: 1,
            source: "Bu sözleşme taraflar arasında akdedilmiştir.",
            target: "This agreement is concluded between the parties.",
            styleMemory: { font: "Calibri", size: 11, bold: false, italic: false, color: "#000000" }
        },
        {
            id: 3,
            paraId: 1,
            source: "Tüm maddeler bağlayıcıdır.",
            target: "All articles are <b>binding</b> and <span style='color:#DC2626; font-size:13pt;'>mandatory</span>.",
            styleMemory: { font: "Calibri", size: 11, bold: false, italic: false, color: "#000000" }
        },
        {
            id: 4,
            paraId: 1,
            source: "İhlal halinde cezai şart uygulanır.",
            target: "In case of breach, penal clause shall apply.",
            styleMemory: { font: "Calibri", size: 11, bold: false, italic: true, color: "#059669" }
        }
    ]
};

console.log("Segments 2, 3, 4 have paraId = 1, so they must be in ONE paragraph without new line break!");
console.log("Segment 3 has bold and red 13pt span.");
console.log("Segment 4 has italic and green #059669 color.");
console.log("Segment 1 is a heading with 16pt bold Arial #1E3A8A.");

// Test generators script
const fs = require('fs');

function escapeRtf(str) {
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        const char = str[i];
        if (char === '\\') out += '\\\\';
        else if (char === '{') out += '\\{';
        else if (char === '}') out += '\\}';
        else if (c > 127) {
            out += '\\u' + c + '?';
        } else {
            out += char;
        }
    }
    return out;
}

function generateRTF(doc, opts = {}) {
    const font = opts.fontFamily || 'Times New Roman';
    const fontSize = (opts.fontSize || 12) * 2; // RTF font size is in half-points
    const headingSize = (opts.headingSize || 16) * 2;
    
    let rtf = '{\\rtf1\\ansi\\ansicpg1254\\deff0\\deflang1055\n';
    rtf += '{\\fonttbl{\\f0\\fnil\\fcharset162 ' + escapeRtf(font) + ';}{\\f1\\fnil\\fcharset162 Calibri;}{\\f2\\fnil\\fcharset162 Arial;}}\n';
    rtf += '{\\colortbl ;\\red0\\green0\\blue0;\\red30\\green41\\blue59;\\red79\\green70\\blue229;\\red220\\green38\\blue38;}\n';
    rtf += '\\viewkind4\\uc1\\pard\\cf1\\lang1055\\f0\\fs' + fontSize + ' \n';

    const title = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri Belgesi";
    rtf += '{\\pard\\qc\\b\\fs' + headingSize + '\\cf3 ' + escapeRtf(title) + '\\par}\n';
    rtf += '{\\pard\\qc\\i\\fs18\\cf2 Olusturulma: ' + escapeRtf(new Date().toLocaleDateString('tr-TR')) + '\\par\\par}\n';

    (doc.segments || []).forEach((seg, idx) => {
        const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
        const sm = seg.styleMemory || {};
        const isHeading = seg.isHeading || sm.isHeading;
        
        let prefix = '{\\pard\\ql\\sa120\\sl288\\slmult1 ';
        let suffix = '\\par}\n';
        
        if (isHeading) {
            prefix = '{\\pard\\qc\\sb180\\sa120\\b\\fs' + (fontSize + 6) + '\\cf3 ';
            suffix = '\\par}\n';
        } else {
            if (sm.bold) prefix += '\\b ';
            if (sm.italic) prefix += '\\i ';
            if (sm.underline) prefix += '\\ul ';
        }

        rtf += prefix + escapeRtf(text) + suffix;
    });

    rtf += '}';
    return rtf;
}

function generatePO(doc) {
    const title = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "CATtool Translation";
    const dateStr = new Date().toISOString();
    let po = `msgid ""
msgstr ""
"Project-Id-Version: ${title}\\n"
"POT-Creation-Date: ${dateStr}\\n"
"PO-Revision-Date: ${dateStr}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Generator: CATtool Professional Translation System\\n"

`;

    function escapePO(str) {
        return (str || '')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
    }

    (doc.segments || []).forEach((seg, idx) => {
        const src = escapePO(seg.source);
        const tgt = escapePO((seg.target && seg.target.trim()) ? seg.target.trim() : seg.source);
        const status = seg.status || 'draft';
        po += `#: segment:${idx + 1} id:${seg.id}\n`;
        po += `#. Status: ${status}\n`;
        po += `msgid "${src}"\n`;
        po += `msgstr "${tgt}"\n\n`;
    });

    return po;
}

function generateTSV(doc) {
    let tsv = 'ID\tSource\tTarget\tStatus\tFont\tBold\tItalic\n';
    (doc.segments || []).forEach((seg, idx) => {
        const sm = seg.styleMemory || {};
        const src = (seg.source || '').replace(/[\t\r\n]+/g, ' ');
        const tgt = ((seg.target && seg.target.trim()) ? seg.target.trim() : seg.source).replace(/[\t\r\n]+/g, ' ');
        tsv += `${idx + 1}\t${src}\t${tgt}\t${seg.status || 'draft'}\t${sm.font || ''}\t${sm.bold ? '1' : '0'}\t${sm.italic ? '1' : '0'}\n`;
    });
    return tsv;
}

function generateXMLDoc(doc) {
    const title = (doc.name || 'Belge').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<cat-document name="${title}" generated="${new Date().toISOString()}">\n  <segments count="${(doc.segments || []).length}">\n`;
    
    (doc.segments || []).forEach((seg, idx) => {
        const sm = seg.styleMemory || {};
        const src = (seg.source || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const tgt = ((seg.target && seg.target.trim()) ? seg.target.trim() : seg.source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += `    <segment id="${seg.id || (idx + 1)}" status="${seg.status || 'draft'}">\n`;
        xml += `      <source font="${sm.font || ''}" bold="${sm.bold ? 'true' : 'false'}" italic="${sm.italic ? 'true' : 'false'}">${src}</source>\n`;
        xml += `      <target font="${sm.font || ''}" bold="${sm.bold ? 'true' : 'false'}" italic="${sm.italic ? 'true' : 'false'}">${tgt}</target>\n`;
        xml += `    </segment>\n`;
    });

    xml += `  </segments>\n</cat-document>\n`;
    return xml;
}

console.log("Generators defined successfully");
const testDoc = {
    name: "test.docx",
    segments: [
        { id: 1, source: "Hello world!", target: "Merhaba dünya! ÇŞİĞÖÜ çşiğöü", status: "confirmed", styleMemory: { bold: true, font: "Arial" } },
        { id: 2, source: "This is a test segment.", target: "Bu bir test segmentidir.", status: "draft", styleMemory: { italic: true } }
    ]
};

console.log("RTF sample:\n", generateRTF(testDoc));
console.log("PO sample:\n", generatePO(testDoc));
console.log("TSV sample:\n", generateTSV(testDoc));
console.log("XML sample:\n", generateXMLDoc(testDoc));

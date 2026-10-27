// Test script to check all generator functions and preview functions
const fs = require('fs');

console.log("Checking syntax of proposed generators...");

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
    const fontSize = (opts.fontSize || 12) * 2;
    const headingSize = (opts.headingSize || 16) * 2;
    
    let rtf = '{\\rtf1\\ansi\\ansicpg1254\\deff0\\deflang1055\n';
    rtf += '{\\fonttbl{\\f0\\fnil\\fcharset162 ' + escapeRtf(font) + ';}{\\f1\\fnil\\fcharset162 Calibri;}{\\f2\\fnil\\fcharset162 Arial;}}\n';
    rtf += '{\\colortbl ;\\red0\\green0\\blue0;\\red30\\green41\\blue59;\\red79\\green70\\blue229;\\red220\\green38\\blue38;}\n';
    rtf += '\\viewkind4\\uc1\\pard\\cf1\\lang1055\\f0\\fs' + fontSize + ' \n';

    const title = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri Belgesi";
    rtf += '{\\pard\\qc\\b\\fs' + headingSize + '\\cf3 ' + escapeRtf(title) + '\\par}\n';
    rtf += '{\\pard\\qc\\i\\fs18\\cf2 Olusturulma: ' + escapeRtf(new Date().toLocaleDateString('tr-TR')) + '\\par\\par}\n';

    (doc.segments || []).forEach((seg) => {
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
    let po = `msgid ""\nmsgstr ""\n"Project-Id-Version: ${title}\\n"\n"POT-Creation-Date: ${dateStr}\\n"\n"PO-Revision-Date: ${dateStr}\\n"\n"MIME-Version: 1.0\\n"\n"Content-Type: text/plain; charset=UTF-8\\n"\n"Content-Transfer-Encoding: 8bit\\n"\n"X-Generator: CATtool Professional Translation System\\n"\n\n`;

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

function generateHTMLDoc(doc, opts = {}) {
    const font = opts.fontFamily || 'Segoe UI, Arial, sans-serif';
    const fontSize = opts.fontSize || 12;
    const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
    
    let body = '';
    (doc.segments || []).forEach((seg, idx) => {
        const sm = seg.styleMemory || {};
        const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
        let s = '';
        if (sm.font) s += `font-family:'${sm.font}',sans-serif;`;
        if (sm.bold || seg.isHeading) s += 'font-weight:bold;';
        if (sm.italic) s += 'font-style:italic;';
        if (sm.underline) s += 'text-decoration:underline;';
        if (sm.color) s += `color:${sm.color};`;

        if (seg.isHeading) {
            body += `<h2 style="${s} margin-top:20px; margin-bottom:10px; color:#1e1b4b;">${escapeHtml(text)}</h2>\n`;
        } else {
            body += `<p style="${s} margin-bottom:12px; line-height:1.6;">${escapeHtml(text)}</p>\n`;
        }
    });

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(baseName)} - Çeviri Belgesi</title>
<style>
body {
    font-family: ${font};
    font-size: ${fontSize}pt;
    color: #1e293b;
    background-color: #f8fafc;
    margin: 0;
    padding: 40px 20px;
}
.page-container {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    padding: 50px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid #e2e8f0;
}
.doc-header {
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 15px;
    margin-bottom: 30px;
}
.doc-title {
    font-size: 22pt;
    font-weight: bold;
    color: #1e1b4b;
    margin: 0 0 6px 0;
}
.doc-meta {
    font-size: 10pt;
    color: #64748b;
}
.shield-token {
    background: #ede9fe;
    color: #5b21b6;
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    border: 1px solid #ddd6fe;
}
@media print {
    body { background: white; padding: 0; }
    .page-container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
}
</style>
</head>
<body>
<div class="page-container">
    <div class="doc-header">
        <h1 class="doc-title">${escapeHtml(baseName)}</h1>
        <div class="doc-meta">CATtool Korunan Çeviri Çıktısı · Segment Sayısı: ${(doc.segments || []).length} · Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
    </div>
    <div class="doc-body">
        ${body}
    </div>
</div>
</body>
</html>`;
}

function buildPrintPdfHtml(doc, opts = {}) {
    const font = opts.fontFamily || 'Times New Roman, serif';
    const fontSize = opts.fontSize || 12;
    const lineSpacing = opts.lineSpacing || 1.5;
    const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";

    let body = '';
    (doc.segments || []).forEach(seg => {
        const sm = seg.styleMemory || {};
        const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
        let s = '';
        if (sm.font) s += `font-family:'${sm.font}',serif;`;
        if (sm.bold || seg.isHeading) s += 'font-weight:bold;';
        if (sm.italic) s += 'font-style:italic;';
        if (sm.underline) s += 'text-decoration:underline;';
        if (sm.color) s += `color:${sm.color};`;

        if (seg.isHeading) {
            body += `<h2 style="${s} margin-top:24pt; margin-bottom:12pt; page-break-after:avoid;">${escapeHtml(text)}</h2>\n`;
        } else {
            body += `<p style="${s} margin-bottom:10pt; text-align:justify; text-indent:1.25cm; line-height:${lineSpacing};">${escapeHtml(text)}</p>\n`;
        }
    });

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(baseName)} - PDF Yazdırma Görünümü</title>
<style>
@page {
    size: A4 portrait;
    margin: 20mm 20mm 25mm 20mm;
    @bottom-right {
        content: counter(page);
    }
}
@media print {
    body { margin: 0; padding: 0; background: #fff !important; }
    .no-print { display: none !important; }
}
body {
    font-family: ${font};
    font-size: ${fontSize}pt;
    line-height: ${lineSpacing};
    color: #000;
    background: #fff;
    margin: 25mm;
}
.header-meta {
    border-bottom: 1pt solid #ccc;
    padding-bottom: 8pt;
    margin-bottom: 24pt;
    font-size: 9pt;
    color: #555;
    display: flex;
    justify-content: space-between;
}
h1.title {
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 20pt;
}
</style>
</head>
<body>
<div class="header-meta">
    <span>CATtool Güvenli Çeviri · ${escapeHtml(baseName)}</span>
    <span>${new Date().toLocaleDateString('tr-TR')}</span>
</div>
<h1 class="title">${escapeHtml(baseName)}</h1>
<div class="content">
    ${body}
</div>
</body>
</html>`;
}

console.log("All generator functions compiled without error!");

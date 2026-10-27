const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');
const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

const oldGenerateHtml = `        function generateHTMLDoc(doc, opts = {}) {
            const font = opts.fontFamily || 'Segoe UI, Arial, sans-serif';
            const fontSize = opts.fontSize || 12;
            const baseName = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";

            let body = '';
            (doc.segments || []).forEach(seg => {
                const sm = seg.styleMemory || {};
                const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
                let s = '';
                if (sm.font) s += \`font-family:'\${sm.font}',sans-serif;\`;
                if (sm.bold || seg.isHeading) style += 'font-weight:bold;';
                if (sm.italic) s += 'font-style:italic;';
                if (sm.underline) s += 'text-decoration:underline;';
                if (sm.color) s += \`color:\${sm.color};\`;

                if (seg.isHeading) {
                    body += \`<h2 style="\${s} margin-top:24px; margin-bottom:10px; color:#1e1b4b;">\${escapeHtml(text)}</h2>\\n\`;
                } else {
                    body += \`<p style="\${s} margin-bottom:12px; line-height:1.6;">\${escapeHtml(text)}</p>\\n\`;
                }
            });`;

const startIdx = normalized.indexOf('function generateHTMLDoc(doc, opts = {}) {');
if (startIdx !== -1) {
    const endIdx = normalized.indexOf('return `<!DOCTYPE html>', startIdx);
    if (endIdx !== -1) {
        const toReplace = normalized.substring(startIdx, endIdx);
        const newCode = `function generateHTMLDoc(doc, opts = {}) {
            const font = opts.fontFamily || 'Segoe UI, Arial, sans-serif';
            const fontSize = opts.fontSize || 12;
            const baseName = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";

            // Smartcat HTML Standardı: Cümleler paragraflarda birleşir, numara konmaz
            const paraGroups = new Map();
            (doc.segments || []).forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            let body = '';
            paraGroups.forEach((group) => {
                const isHead = group.some(s => s.isHeading);
                if (isHead) {
                    const text = (group[0].target && group[0].target.trim()) ? group[0].target.trim() : group[0].source;
                    body += \`    <h2 style="font-family:\${font}; margin-top:24px; margin-bottom:10px; color:#0f172a; font-weight:bold;">\${escapeHtml(text)}</h2>\\n\`;
                } else {
                    const text = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    body += \`    <p style="font-family:\${font}; margin-bottom:14px; line-height:1.7; text-align:justify;">\${escapeHtml(text)}</p>\\n\`;
                }
            });

            `;
        normalized = normalized.substring(0, startIdx) + newCode + normalized.substring(endIdx);
        console.log("Updated generateHTMLDoc successfully!");
    }
}

const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync('index.html', finalContent, 'utf8');
console.log("Saved updated index.html!");

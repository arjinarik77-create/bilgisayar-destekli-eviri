const fs = require('fs');

console.log("Preparing Smartcat Segmentation & Export Engine integration...");

// 1. UPDATE vendor/docx_export.js
let docxJs = fs.readFileSync('vendor/docx_export.js', 'utf8');

// Replace scratch paragraph splitting in docx_export.js
const targetDocxScratch = `        } else {
            if (mode === 'all_content' && doc.name) {
                body.appendChild(para([{ text: doc.name.replace(/\\.[^/.]+$/, ''), fmt: Object.assign({}, tf, { bold: true, size: opts.headingSize || 16, color: opts.headingColor || '#000000' }) }], { align: 'center', after: 14 }));
            }
            let group = [];
            const flush = () => {
                if (!group.length) return;
                const pieces = [];
                group.forEach((s, i) => { if (i) pieces.push({ text: ' ', fmt: tf }); segP(s).forEach(pc => pieces.push(pc)); });
                body.appendChild(para(pieces, { indent: true })); group = [];
            };
            const head = (s) => typeof global.isLikelyHeading === 'function' && global.isLikelyHeading((s.target || s.source || '').trim());
            segs.forEach(s => {
                if (head(s)) {
                    flush();
                    body.appendChild(para([{ text: (s.target && s.target.trim()) || s.source, fmt: Object.assign({}, tf, { bold: opts.headingBold !== false, size: opts.headingSize || 14, color: opts.headingColor || '#000000' }) }], { align: 'left', after: 8 }));
                } else {
                    group.push(s);
                    if (group.length >= 3 || (s.target || '').trim().endsWith('.')) flush();
                }
            });
            flush();
        }`;

const replacementDocxScratch = `        } else {
            // SMARTCAT EXPORT STANDARDI (TÜM CÜMLELER PARAGRAF AKIŞINDA BİRLEŞİR, NUMARA YOK)
            if (mode === 'all_content' && doc.name) {
                body.appendChild(para([{ text: doc.name.replace(/\\.[^/.]+$/, ''), fmt: Object.assign({}, tf, { bold: true, size: opts.headingSize || 16, color: opts.headingColor || '#000000' }) }], { align: 'center', after: 14 }));
            }
            const head = (s) => (s.isHeading || (typeof global.isLikelyHeading === 'function' && global.isLikelyHeading((s.target || s.source || '').trim())));

            // Paragraflara göre grupla (Smartcat Paragraf Modeli)
            const paraGroups = new Map();
            segs.forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            paraGroups.forEach(group => {
                const isHead = group.some(s => head(s));
                if (isHead) {
                    const first = group[0];
                    const text = (first.target && first.target.trim()) ? first.target.trim() : first.source;
                    body.appendChild(para([{ text, fmt: Object.assign({}, tf, { bold: opts.headingBold !== false, size: opts.headingSize || 14, color: opts.headingColor || '#000000' }) }], { align: 'left', after: 8 }));
                } else {
                    const pieces = [];
                    group.forEach((s, idx) => {
                        if (idx > 0) pieces.push({ text: ' ', fmt: tf });
                        segP(s).forEach(pc => pieces.push(pc));
                    });
                    body.appendChild(para(pieces, { indent: true }));
                }
            });
        }`;

if (docxJs.includes(targetDocxScratch)) {
    docxJs = docxJs.replace(targetDocxScratch, replacementDocxScratch);
    fs.writeFileSync('vendor/docx_export.js', docxJs, 'utf8');
    console.log("Updated vendor/docx_export.js with Smartcat paragraph flow.");
} else {
    console.warn("Target in docx_export.js not found exactly, will check manual replacement.");
}

// 2. UPDATE vendor/format_shield.js
let fsJs = fs.readFileSync('vendor/format_shield.js', 'utf8');
const targetFsNonDocx = `        // Eğer Word dışı bir format ise (Markdown, TXT, PDF vb.):
        // Satır bazlı Markdown ve Başlık Analizi
        const lines = rawText.split(/\\r?\\n/);
        for (let li = 0; li < lines.length; li++) {
            const line = lines[li].trim();
            if (!line) continue;

            const isMdHeading = /^#{1,6}\\s+/.test(line);
            const isAllCapsHeading = line.length > 3 && line.length < 90 && line === line.toUpperCase() && !/[.!?]$/.test(line);
            const isChapter = /^(bölüm|chapter|part|kısım|özet|abstract|giriş|introduction|sonuç|conclusion)\\b/i.test(line) && line.length < 110;

            if (isMdHeading || isAllCapsHeading || isChapter) {
                // Başlık İstisnası: Bölünmeden tek segment
                const cleanHead = isMdHeading ? line.replace(/^#{1,6}\\s+/, '') : line;
                let lvl = 1;
                if (isMdHeading) {
                    const hm = line.match(/^(#{1,6})/);
                    if (hm) lvl = hm[1].length;
                }
                results.push({
                    id: curId++,
                    source: cleanHead,
                    target: '',
                    status: 'empty',
                    isHeading: true,
                    headingLevel: lvl,
                    styleMemory: {
                        font: 'Segoe UI',
                        size: 16 - (lvl - 1) * 2,
                        bold: true,
                        italic: false,
                        underline: false,
                        color: '#000000',
                        isHeading: true,
                        headingLevel: lvl,
                        styleName: \`Heading \${lvl}\`
                    }
                });
            } else {
                const sents = (typeof segmentDocFn === 'function') ? segmentDocFn(line) : [line];
                for (const s of sents) {
                    if (!s.trim()) continue;
                    results.push({
                        id: curId++,
                        source: s.trim(),
                        target: '',
                        status: 'empty',
                        isHeading: false,
                        styleMemory: {
                            font: 'Segoe UI',
                            size: 11,
                            bold: false,
                            italic: false,
                            underline: false,
                            color: '#0f172a',
                            isHeading: false,
                            styleName: 'Normal'
                        }
                    });
                }
            }
        }`;

const replacementFsNonDocx = `        // Smartcat Modeli: Metin önce paragraflara (çift satır atlaması veya başlık) ayrılır
        const rawParas = rawText.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n').split(/\\n{2,}/);
        for (let pIdx = 0; pIdx < rawParas.length; pIdx++) {
            const pBlock = rawParas[pIdx].trim();
            if (!pBlock) continue;

            const isMdHeading = /^#{1,6}\\s+/.test(pBlock);
            const isAllCapsHeading = pBlock.length > 3 && pBlock.length < 120 && pBlock === pBlock.toUpperCase() && !/[.!?]$/.test(pBlock);
            const isChapter = /^(bölüm|chapter|part|kısım|özet|abstract|giriş|introduction|sonuç|conclusion)\\b/i.test(pBlock) && pBlock.length < 120;

            if (isMdHeading || isAllCapsHeading || isChapter) {
                const cleanHead = isMdHeading ? pBlock.replace(/^#{1,6}\\s+/, '') : pBlock;
                let lvl = 1;
                if (isMdHeading) {
                    const hm = pBlock.match(/^(#{1,6})/);
                    if (hm) lvl = hm[1].length;
                }
                results.push({
                    id: curId++,
                    paraId: pIdx,
                    source: cleanHead,
                    target: '',
                    status: 'empty',
                    isHeading: true,
                    headingLevel: lvl,
                    styleMemory: {
                        font: 'Segoe UI',
                        size: 16 - (lvl - 1) * 2,
                        bold: true,
                        italic: false,
                        underline: false,
                        color: '#000000',
                        isHeading: true,
                        headingLevel: lvl,
                        styleName: \`Heading \${lvl}\`
                    }
                });
            } else {
                // Gövde paragrafı: akıllı cümle kurallarıyla segmente edilir ama paraId korunur
                const sents = (typeof segmentDocFn === 'function') ? segmentDocFn(pBlock) : [pBlock];
                for (const s of sents) {
                    if (!s.trim()) continue;
                    results.push({
                        id: curId++,
                        paraId: pIdx,
                        source: s.trim(),
                        target: '',
                        status: 'empty',
                        isHeading: false,
                        styleMemory: {
                            font: 'Segoe UI',
                            size: 11,
                            bold: false,
                            italic: false,
                            underline: false,
                            color: '#0f172a',
                            isHeading: false,
                            styleName: 'Normal'
                        }
                    });
                }
            }
        }`;

if (fsJs.includes(targetFsNonDocx)) {
    fsJs = fsJs.replace(targetFsNonDocx, replacementFsNonDocx);
    fs.writeFileSync('vendor/format_shield.js', fsJs, 'utf8');
    console.log("Updated vendor/format_shield.js with Smartcat paragraph ID tracking.");
}

console.log("Ready for index.html updates.");

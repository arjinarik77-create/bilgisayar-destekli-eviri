const fs = require('fs');

console.log("Applying Smartcat engine with CRLF normalization...");

let content = fs.readFileSync('index.html', 'utf8');
const isCRLF = content.includes('\r\n');
console.log("File uses CRLF:", isCRLF);

// Standardize to \n for replacement, then restore if needed
let normalized = content.replace(/\r\n/g, '\n');

// 1. exportInOriginalFormat
const oldExport = `        function exportInOriginalFormat() {
            // 1. Önce DOM'daki aktif tüm segment çevirilerini hafızaya yaz
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak aktif belge veya segment bulunamadı.");
                return;
            }

            const fmt = getOriginalDocFormat();
            if (fmt === 'docx' || fmt === 'doc') {
                executeWordExport('docx');
            } else if (fmt === 'xliff' || fmt === 'sdlxliff') {
                if (typeof CatIO !== 'undefined' && typeof CatIO.exportXLIFF === 'function') {
                    CatIO.exportXLIFF();
                } else {
                    downloadCleanOutput('xliff');
                }
            } else {
                downloadCleanOutput(fmt);
            }
        }`;

const newExport = `        function exportInOriginalFormat() {
            // 1. Önce DOM'daki aktif tüm segment çevirilerini hafızaya yaz
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak aktif belge veya segment bulunamadı.");
                return;
            }

            // SMARTCAT EXPORT STANDARDI:
            // Orijinal formatta indirme her zaman temiz, akıcı paragraf modunu (target_only) kullanır.
            // Asla cümleleri 1 2 3 diye numaralandırmaz veya ayrı satırlara bölmez.
            const isSub = doc.originalFormat === 'srt' || doc.originalFormat === 'vtt' || 
                          ((getActiveProject()?.type === 'subtitling') && doc.segments.some(s => s.startTime));

            const contentModeEl = document.getElementById('exportContentMode');
            if (contentModeEl) {
                contentModeEl.value = isSub ? 'subtitle_timed' : 'target_only';
            }

            const fmt = getOriginalDocFormat();
            if (fmt === 'docx' || fmt === 'doc') {
                executeWordExport('docx', true);
            } else if (fmt === 'xliff' || fmt === 'sdlxliff') {
                if (typeof CatIO !== 'undefined' && typeof CatIO.exportXLIFF === 'function') {
                    CatIO.exportXLIFF();
                } else {
                    downloadCleanOutput('xliff');
                }
            } else {
                downloadCleanOutput(fmt);
            }
        }`;

if (normalized.includes(oldExport)) {
    normalized = normalized.replace(oldExport, newExport);
    console.log("1. Replaced exportInOriginalFormat: SUCCESS");
} else {
    console.error("1. Failed to find exportInOriginalFormat!");
}

// 2. buildWordDocumentHtml
const oldBuildWord = `            } else {
                // 'all_content' veya 'target_only': Tüm içerik, başlıklar ve paragraflar eksiksiz
                if (opts.contentMode === 'all_content' && cleanDocName) {
                    bodyHtml += \`<h1 class="Heading1" style="text-align:center; margin-bottom:18pt;">\${escapeHtml(cleanDocName)}</h1>\\n\`;
                }
                cleanSegments.forEach((seg, idx) => {
                    if (seg.isHead) {
                        flushParagraph();
                        bodyHtml += \`<h1 class="Heading1">\${seg.targetHtml || escapeHtml(seg.target)}</h1>\\n\`;
                    } else {
                        currentParagraph.push(seg.targetHtml || escapeHtml(seg.target));
                        if (currentParagraph.length >= 3 || seg.target.endsWith('.')) {
                            flushParagraph();
                        }
                    }
                });
                flushParagraph();
            }`;

const newBuildWord = `            } else {
                // SMARTCAT STANDARDI: Cümleler ait oldukları paragraflarda birleşir, asla 1 2 3 diye ayrılmaz
                if (opts.contentMode === 'all_content' && cleanDocName) {
                    bodyHtml += \`<h1 class="Heading1" style="text-align:center; margin-bottom:18pt;">\${escapeHtml(cleanDocName)}</h1>\\n\`;
                }

                const paraGroups = new Map();
                cleanSegments.forEach(s => {
                    const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                    if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                    paraGroups.get(pKey).push(s);
                });

                paraGroups.forEach((group) => {
                    const isHead = group.some(s => s.isHead || s.isHeading);
                    if (isHead) {
                        const headText = group[0].targetHtml || escapeHtml(group[0].target);
                        bodyHtml += \`<h1 class="Heading1">\${headText}</h1>\\n\`;
                    } else {
                        // Aynı paragrafın cümleleri tek boşlukla birleşir
                        const pText = group.map(s => s.targetHtml || escapeHtml(s.target)).join(' ');
                        bodyHtml += \`<p class="MsoNormal">\${pText}</p>\\n\`;
                    }
                });
            }`;

if (normalized.includes(oldBuildWord)) {
    normalized = normalized.replace(oldBuildWord, newBuildWord);
    console.log("2. Replaced buildWordDocumentHtml: SUCCESS");
} else {
    console.error("2. Failed to find oldBuildWord!");
}

// 3. downloadCleanOutput (TXT, MD, etc.)
const oldCleanOutput = `            // Metinleri temizle ([Gemini Türkçe Çeviri Taslağı] hiçbir yerde çıkmaz)
            const cleanSegments = doc.segments
                .map(s => cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()))
                .filter(Boolean);

            const merged = cleanSegments.join('\\n\\n');
            let mime = 'text/plain;charset=utf-8';
            let content = merged;
            const base = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";`;

const newCleanOutput = `            // SMARTCAT EXPORT STANDARDI: Cümleleri paragraflarına göre grupla
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
                    .map(s => cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()))
                    .filter(Boolean);
                if (sentences.length > 0) {
                    smartcatParagraphs.push({
                        isHeading: isHead,
                        text: sentences.join(' ')
                    });
                }
            });

            const merged = smartcatParagraphs.map(p => p.text).join('\\n\\n');
            let mime = 'text/plain;charset=utf-8';
            let content = merged;
            const base = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";`;

if (normalized.includes(oldCleanOutput)) {
    normalized = normalized.replace(oldCleanOutput, newCleanOutput);
    console.log("3. Replaced downloadCleanOutput: SUCCESS");
} else {
    console.error("3. Failed to find oldCleanOutput!");
}

// 4. Update TXT and MD in downloadCleanOutput
const oldTxtMd = `            } else if (ext === 'md') {
                mime = 'text/markdown;charset=utf-8';
                content = \`# \${doc.name || 'Çeviri Belgesi'}\\n\\n\${cleanSegments.join('\\n\\n')}\`;
            } else if (ext === 'srt') {
                content = generateSRT(doc);
                mime = 'text/plain;charset=utf-8';
            } else if (ext === 'vtt') {
                content = generateVTT(doc);
                mime = 'text/vtt;charset=utf-8';
            } else if (ext === 'csv') {
                content = generateCSV(doc);
                mime = 'text/csv;charset=utf-8';
            } else if (ext === 'json') {
                mime = 'application/json;charset=utf-8';
                content = JSON.stringify(doc.segments.map(s => ({
                    id: s.id,
                    source: s.source,
                    target: cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()),
                    status: s.status,
                    ...(s.startTime ? { startTime: s.startTime, endTime: s.endTime } : {})
                })), null, 2);
            } else if (ext === 'txt') {
                mime = 'text/plain;charset=utf-8';
                content = cleanSegments.join('\\n\\n');
            }`;

const newTxtMd = `            } else if (ext === 'md') {
                mime = 'text/markdown;charset=utf-8';
                content = \`# \${doc.name || 'Çeviri Belgesi'}\\n\\n\` + smartcatParagraphs.map(p => p.isHeading ? \`## \${p.text}\` : p.text).join('\\n\\n');
            } else if (ext === 'srt') {
                content = generateSRT(doc);
                mime = 'text/plain;charset=utf-8';
            } else if (ext === 'vtt') {
                content = generateVTT(doc);
                mime = 'text/vtt;charset=utf-8';
            } else if (ext === 'csv') {
                content = generateCSV(doc);
                mime = 'text/csv;charset=utf-8';
            } else if (ext === 'json') {
                mime = 'application/json;charset=utf-8';
                content = JSON.stringify(doc.segments.map(s => ({
                    id: s.id,
                    paraId: s.paraId,
                    source: s.source,
                    target: cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()),
                    status: s.status,
                    ...(s.startTime ? { startTime: s.startTime, endTime: s.endTime } : {})
                })), null, 2);
            } else if (ext === 'txt') {
                mime = 'text/plain;charset=utf-8';
                // Smartcat Düz Metin: Paragraf blokları \\n\\n ile ayrılır, cümleler paragraf içinde tek boşlukla akar
                content = smartcatParagraphs.map(p => p.text).join('\\n\\n');
            }`;

if (normalized.includes(oldTxtMd)) {
    normalized = normalized.replace(oldTxtMd, newTxtMd);
    console.log("4. Replaced TXT and MD branches: SUCCESS");
} else {
    console.error("4. Failed to find oldTxtMd!");
}

// 5. buildPrintPdfHtml
const oldPdf = `            let body = '';
            (doc.segments || []).forEach(seg => {
                const sm = seg.styleMemory || {};
                const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
                let s = '';
                if (sm.font) s += \`font-family:'\${sm.font}',serif;\`;
                if (sm.bold || seg.isHeading) s += 'font-weight:bold;';
                if (sm.italic) s += 'font-style:italic;';
                if (sm.underline) s += 'text-decoration:underline;';
                if (sm.color) s += \`color:\${sm.color};\`;

                if (seg.isHeading) {
                    body += \`<h2 style="\${s} margin-top:20pt; margin-bottom:10pt; page-break-after:avoid; color:#1e1b4b;">\${escapeHtml(text)}</h2>\\n\`;
                } else {
                    body += \`<p style="\${s} margin-bottom:8pt; text-align:justify; text-indent:1.25cm; line-height:\${lineSpacing};">\${escapeHtml(text)}</p>\\n\`;
                }
            });`;

const newPdf = `            // Smartcat PDF Standardı: Cümleler paragraflarda birleşir, asla her cümle ayrı satıra veya 1 2 3 diye ayrılmaz
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
                    const headText = (group[0].target && group[0].target.trim()) ? group[0].target.trim() : group[0].source;
                    body += \`<h2 style="font-family:\${font}; margin-top:22pt; margin-bottom:10pt; page-break-after:avoid; color:#0f172a; font-weight:bold;">\${escapeHtml(headText)}</h2>\\n\`;
                } else {
                    const paraText = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    body += \`<p style="font-family:\${font}; margin-bottom:10pt; text-align:justify; text-indent:1.25cm; line-height:\${lineSpacing};">\${escapeHtml(paraText)}</p>\\n\`;
                }
            });`;

if (normalized.includes(oldPdf)) {
    normalized = normalized.replace(oldPdf, newPdf);
    console.log("5. Replaced buildPrintPdfHtml: SUCCESS");
} else {
    console.error("5. Failed to find oldPdf!");
}

// 6. generateRTF
const oldRtf = `            (doc.segments || []).forEach(seg => {
                const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
                const sm = seg.styleMemory || {};
                const isHeading = seg.isHeading || sm.isHeading;

                let prefix = '{\\\\pard\\\\ql\\\\sa120\\\\sl288\\\\slmult1 ';
                let suffix = '\\\\par}\\n';

                if (isHeading) {
                    prefix = '{\\\\pard\\\\qc\\\\sb180\\\\sa120\\\\b\\\\fs' + (fontSize + 6) + '\\\\cf3 ';
                    suffix = '\\\\par}\\n';
                } else {
                    if (sm.bold) prefix += '\\\\b ';
                    if (sm.italic) prefix += '\\\\i ';
                    if (sm.underline) prefix += '\\\\ul ';
                }

                rtf += prefix + escapeRtf(text) + suffix;
            });`;

const newRtf = `            // Smartcat RTF Standardı: Cümleler \\pard paragraf bloğunda birleşir
            const paraGroups = new Map();
            (doc.segments || []).forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            paraGroups.forEach((group) => {
                const isHead = group.some(s => s.isHeading);
                if (isHead) {
                    const text = (group[0].target && group[0].target.trim()) ? group[0].target.trim() : group[0].source;
                    rtf += '{\\\\pard\\\\qc\\\\sb180\\\\sa120\\\\b\\\\fs' + (fontSize + 6) + '\\\\cf3 ' + escapeRtf(text) + '\\\\par}\\n';
                } else {
                    const text = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    rtf += '{\\\\pard\\\\ql\\\\sa120\\\\sl288\\\\slmult1 ' + escapeRtf(text) + '\\\\par}\\n';
                }
            });`;

if (normalized.includes(oldRtf)) {
    normalized = normalized.replace(oldRtf, newRtf);
    console.log("6. Replaced generateRTF: SUCCESS");
} else {
    console.error("6. Failed to find oldRtf!");
}

// 7. downloadHTMLExport
const oldHtmlExp = `        function downloadHTMLExport(doc) {
            const opts = getWordExportOptions();
            const baseName = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";
            const font = opts.fontFamily || 'Segoe UI, sans-serif';

            let body = '';
            (doc.segments || []).forEach(seg => {
                const text = (seg.target && seg.target.trim()) ? seg.target.trim() : seg.source;
                const sm = seg.styleMemory || {};
                let style = '';
                if (sm.bold || seg.isHeading) style += 'font-weight:bold;';
                if (sm.italic) style += 'font-style:italic;';
                if (sm.underline) style += 'text-decoration:underline;';
                if (sm.color) style += \`color:\${sm.color};\`;

                if (seg.isHeading) {
                    body += \`    <h2 style="\${style} margin-top:24px; margin-bottom:12px; color:#1e1b4b;">\${escapeHtml(text)}</h2>\\n\`;
                } else {
                    body += \`    <p style="\${style} margin-bottom:12px; line-height:1.6; text-align:justify;">\${escapeHtml(text)}</p>\\n\`;
                }
            });`;

const newHtmlExp = `        function downloadHTMLExport(doc) {
            const opts = getWordExportOptions();
            const baseName = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";
            const font = opts.fontFamily || 'Segoe UI, sans-serif';

            // Smartcat HTML Standardı: Cümleler <p> paragraf bloklarında birleşir
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
                    body += \`    <h2 style="font-family:\${font}; margin-top:24px; margin-bottom:12px; color:#0f172a; font-weight:bold;">\${escapeHtml(text)}</h2>\\n\`;
                } else {
                    const text = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    body += \`    <p style="font-family:\${font}; margin-bottom:14px; line-height:1.7; text-align:justify;">\${escapeHtml(text)}</p>\\n\`;
                }
            });`;

if (normalized.includes(oldHtmlExp)) {
    normalized = normalized.replace(oldHtmlExp, newHtmlExp);
    console.log("7. Replaced downloadHTMLExport: SUCCESS");
} else {
    console.error("7. Failed to find oldHtmlExp!");
}

// 8. addNewDoc fallback segmentation
const oldAddNewDoc = `                if (!newSegments || newSegments.length === 0) {
                    const s = segmentDocument(rawText);
                    if (s.length === 0) {
                        showToast("Segmente edilecek geçerli metin bulunamadı.");
                        return;
                    }
                    newSegments = s.map((txt, idx) => {
                        const seg = { id: idx + 1, source: txt, target: '', status: 'empty' };
                        if (isSubtitling) {
                            const start = idx * 3.5;
                            const end = start + 3.0;
                            seg.startTime = formatSecondsToSrtTimestamp(start);
                            seg.endTime = formatSecondsToSrtTimestamp(end);
                            seg.durationSec = 3.0;
                        }
                        return seg;
                    });
                }`;

const newAddNewDoc = `                if (!newSegments || newSegments.length === 0) {
                    // Smartcat Modeli: Metin önce paragraflara ayrılır, her paragraf kendi içinde cümlelere bölünür
                    const rawParagraphs = rawText.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n').split(/\\n{2,}/);
                    newSegments = [];
                    let curId = 1;

                    rawParagraphs.forEach((pText, pIdx) => {
                        const trimmedP = pText.trim();
                        if (!trimmedP) return;

                        const isHead = typeof isLikelyHeading === 'function' ? isLikelyHeading(trimmedP) : (trimmedP.length < 90 && !/[.!?]$/.test(trimmedP));
                        if (isHead) {
                            newSegments.push({
                                id: curId++,
                                paraId: pIdx,
                                source: trimmedP,
                                target: '',
                                status: 'empty',
                                isHeading: true,
                                styleMemory: { isHeading: true }
                            });
                        } else {
                            const sents = segmentDocument(trimmedP);
                            sents.forEach(sTxt => {
                                if (sTxt.trim()) {
                                    newSegments.push({
                                        id: curId++,
                                        paraId: pIdx,
                                        source: sTxt.trim(),
                                        target: '',
                                        status: 'empty',
                                        isHeading: false
                                    });
                                }
                            });
                        }
                    });

                    if (newSegments.length === 0) {
                        showToast("Segmente edilecek geçerli metin bulunamadı.");
                        return;
                    }

                    if (isSubtitling) {
                        newSegments.forEach((seg, idx) => {
                            const start = idx * 3.5;
                            const end = start + 3.0;
                            seg.startTime = formatSecondsToSrtTimestamp(start);
                            seg.endTime = formatSecondsToSrtTimestamp(end);
                            seg.durationSec = 3.0;
                        });
                    }
                }`;

if (normalized.includes(oldAddNewDoc)) {
    normalized = normalized.replace(oldAddNewDoc, newAddNewDoc);
    console.log("8. Replaced addNewDoc fallback: SUCCESS");
} else {
    console.error("8. Failed to find oldAddNewDoc!");
}

// 9. segmentDocument improvement (Smartcat sentence regex)
const oldSegmentDoc = `            // Cümle sonu noktalama işaretlerinden böl
            clean = clean.replace(/([.?!]+)([\\s\\n]+|$)/g, (match, punct) => {
                return punct + '\\n---CAT_SEG_BREAK---\\n';
            });

            clean = clean.replace(/\\n{2,}/g, '\\n---CAT_SEG_BREAK---\\n');`;

const newSegmentDoc = `            // Smartcat Cümle Bölme Kuralı: Noktalama işaretinden sonra boşluk ve büyük harf/tırnak/parantez gelirse böl
            clean = clean.replace(/([.?!]+)(?=[\\s\\n]+[A-Z0-9"“'«\\(\\[]|$)/g, (match, punct) => {
                return punct + '\\n---CAT_SEG_BREAK---\\n';
            });

            clean = clean.replace(/\\n{2,}/g, '\\n---CAT_SEG_BREAK---\\n');`;

if (normalized.includes(oldSegmentDoc)) {
    normalized = normalized.replace(oldSegmentDoc, newSegmentDoc);
    console.log("9. Replaced segmentDocument regex: SUCCESS");
} else {
    console.error("9. Failed to find oldSegmentDoc!");
}

// Write back preserving line endings
const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync('index.html', finalContent, 'utf8');
console.log("Completed write to index.html successfully.");

const fs = require('fs');

console.log("Updating index.html with Smartcat-grade Segmentation & Reassembly Engine...");

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update exportContentMode in HTML: default to 'target_only' (Smartcat clean paragraphs)
const targetContentModeSelect = `<option value="subtitle_timed" selected>⏱️ Zaman Damgalı Altyazı Satırları (Saniyeler & Alt Alta)</option>
                                    <option value="all_content">Tüm İçerik (Eksiksiz Metin & Başlıklar)</option>
                                    <option value="target_only">Yalnızca Saf Çeviri (Temiz Paragraflar)</option>`;

const replacementContentModeSelect = `<option value="target_only" selected>✨ Orijinal Format (Temiz Paragraflar - Smartcat Standardı)</option>
                                    <option value="all_content">Tüm İçerik (Eksiksiz Metin & Başlıklar)</option>
                                    <option value="subtitle_timed">⏱️ Zaman Damgalı Altyazı Satırları (Yalnızca Video/Altyazı İçin)</option>`;

if (html.includes(targetContentModeSelect)) {
    html = html.replace(targetContentModeSelect, replacementContentModeSelect);
    console.log("Updated #exportContentMode select options.");
} else {
    console.log("Finding #exportContentMode with regex...");
    html = html.replace(/<option value="subtitle_timed"\s*selected>[\s\S]*?<\/option>\s*<option value="all_content">[\s\S]*?<\/option>\s*<option value="target_only">[\s\S]*?<\/option>/, replacementContentModeSelect);
}

// 2. Update exportInOriginalFormat in index.html
const targetExportInOrig = `        function exportInOriginalFormat() {
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

const replacementExportInOrig = `        function exportInOriginalFormat() {
            // 1. Önce DOM'daki aktif tüm segment çevirilerini hafızaya yaz
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak aktif belge veya segment bulunamadı.");
                return;
            }

            // SMARTCAT KURALI: Orijinal formatta indirme temiz paragraf akışı standardını kullanır
            // Yalnızca belge gerçekten altyazı (SRT/VTT) ise zaman kodlu altyazı kullanılır
            const isSub = doc.originalFormat === 'srt' || doc.originalFormat === 'vtt' || 
                          ((getActiveProject()?.type === 'subtitling') && doc.segments.some(s => s.startTime));

            const contentModeEl = document.getElementById('exportContentMode');
            if (contentModeEl) {
                contentModeEl.value = isSub ? 'subtitle_timed' : 'target_only';
            }

            const fmt = getOriginalDocFormat();
            if (fmt === 'docx' || fmt === 'doc') {
                executeWordExport('docx', true); // Kalkanları koruyarak temiz Smartcat DOCX indir
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

if (html.includes(targetExportInOrig)) {
    html = html.replace(targetExportInOrig, replacementExportInOrig);
    console.log("Updated exportInOriginalFormat implementation.");
}

// 3. Update buildWordDocumentHtml in index.html to group by paragraphs (Smartcat Reassembly)
const targetBuildWordDoc = `            } else {
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

const replacementBuildWordDoc = `            } else {
                // SMARTCAT STANDARDI: 'target_only' veya 'all_content' modunda cümleler paragraflarda birleşir (1 2 3 numaraları KESİNLİKLE YOKTUR)
                if (opts.contentMode === 'all_content' && cleanDocName) {
                    bodyHtml += \`<h1 class="Heading1" style="text-align:center; margin-bottom:18pt;">\${escapeHtml(cleanDocName)}</h1>\\n\`;
                }

                // Paragraflara göre grupla
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
                        // Aynı paragrafın cümleleri boşlukla yan yana akar
                        const pText = group.map(s => s.targetHtml || escapeHtml(s.target)).join(' ');
                        bodyHtml += \`<p class="MsoNormal">\${pText}</p>\\n\`;
                    }
                });
            }`;

if (html.includes(targetBuildWordDoc)) {
    html = html.replace(targetBuildWordDoc, replacementBuildWordDoc);
    console.log("Updated buildWordDocumentHtml with Smartcat paragraph reassembly.");
}

// 4. Update downloadCleanOutput in index.html for TXT, MD, HTML
const targetDownloadClean = `            // Metinleri temizle ([Gemini Türkçe Çeviri Taslağı] hiçbir yerde çıkmaz)
            const cleanSegments = doc.segments
                .map(s => cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()))
                .filter(Boolean);

            const merged = cleanSegments.join('\\n\\n');
            let mime = 'text/plain;charset=utf-8';
            let content = merged;
            const base = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";`;

const replacementDownloadClean = `            // SMARTCAT MODELİ: Cümleleri paragraflara göre grupla ve doğal akışta birleştir
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

if (html.includes(targetDownloadClean)) {
    html = html.replace(targetDownloadClean, replacementDownloadClean);
    console.log("Updated downloadCleanOutput paragraph grouping.");
}

// Update TXT & MD branch in downloadCleanOutput
const targetTxtBranch = `            } else if (ext === 'md') {
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

const replacementTxtBranch = `            } else if (ext === 'md') {
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
                // Smartcat Düz Metin Standardı: Paragraflar \\n\\n ile ayrılır, cümleler paragrafta birleşir
                content = smartcatParagraphs.map(p => p.text).join('\\n\\n');
            }`;

if (html.includes(targetTxtBranch)) {
    html = html.replace(targetTxtBranch, replacementTxtBranch);
    console.log("Updated TXT & MD branches in downloadCleanOutput.");
}

// 5. Update buildPrintPdfHtml (PDF export)
const targetPdfBody = `            let body = '';
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

const replacementPdfBody = `            // Smartcat PDF Standardı: Cümleler paragraflarda birleşir, asla 1 2 3 diye ayrılmaz
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

if (html.includes(targetPdfBody)) {
    html = html.replace(targetPdfBody, replacementPdfBody);
    console.log("Updated buildPrintPdfHtml with Smartcat paragraph flow.");
}

// 6. Update generateRTF (RTF export)
const targetRtfBody = `            (doc.segments || []).forEach(seg => {
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

const replacementRtfBody = `            // Smartcat RTF Standardı: Cümleler \\pard paragraf bloğunda birleşir
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

if (html.includes(targetRtfBody)) {
    html = html.replace(targetRtfBody, replacementRtfBody);
    console.log("Updated generateRTF with Smartcat paragraph flow.");
}

// 7. Update downloadHTMLExport
const targetHtmlExport = `        function downloadHTMLExport(doc) {
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

const replacementHtmlExport = `        function downloadHTMLExport(doc) {
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

if (html.includes(targetHtmlExport)) {
    html = html.replace(targetHtmlExport, replacementHtmlExport);
    console.log("Updated downloadHTMLExport with Smartcat paragraph flow.");
}

// 8. Update addNewDoc segmentation logic to attach paraId to all segments
const targetAddNewDocFallback = `                if (!newSegments || newSegments.length === 0) {
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

const replacementAddNewDocFallback = `                if (!newSegments || newSegments.length === 0) {
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

if (html.includes(targetAddNewDocFallback)) {
    html = html.replace(targetAddNewDocFallback, replacementAddNewDocFallback);
    console.log("Updated addNewDoc with Smartcat paragraph segmentation.");
}

fs.writeFileSync('index.html', html, 'utf8');
console.log("Successfully wrote all updates to index.html!");

const fs = require('fs');

console.log("Upgrading buildWordDocumentHtml in legacy_index.html & index.html...");

const newBuildWordDocumentHtml = `function buildWordDocumentHtml(doc, opts) {
            const cleanDocName = doc.name ? doc.name.replace(/\\.[^/.]+$/, "") : "Ceviri";

            function renderFormattedSegHtml(s, side) {
                // 1. Biçim kalkanı çıktısı varsa öncelikle kullan
                let richHtml = (typeof FormatShield !== 'undefined' && typeof FormatShield.exportHtml === 'function') 
                    ? FormatShield.exportHtml(s, side) 
                    : null;

                const raw = side === 'target' ? ((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()) : s.source.trim();
                if (!raw) return '';

                let inner = richHtml || raw;

                // Kalkan badge etiketlerini (eğer metin içindeyse) temizle veya gerçek etiketlere çevir
                if (typeof FormatShield !== 'undefined' && typeof FormatShield.convertShieldsToSubtitleTags === 'function') {
                    inner = FormatShield.convertShieldsToSubtitleTags(inner, s);
                }

                // 2. styleMemory varsa yazı tipi, punto, kalınlık, italik ve renk stillerini uygula
                const sm = s.styleMemory;
                if (sm) {
                    const st = [];
                    if (sm.font) st.push(\`font-family:'\${sm.font}', sans-serif\`);
                    if (sm.size) st.push(\`font-size:\${sm.size}pt\`);
                    if (sm.bold || s.isHeading) st.push('font-weight:bold');
                    if (sm.italic) st.push('font-style:italic');
                    if (sm.underline) st.push('text-decoration:underline');
                    if (sm.color && sm.color !== '#000000' && sm.color !== '#0f172a' && sm.color !== 'auto') {
                        st.push(\`color:\${sm.color}\`);
                    }
                    if (st.length > 0) {
                        inner = \`<span style="\${st.join('; ')}">\${inner}</span>\`;
                    }
                }
                return inner;
            }

            // Segmentleri temizle ve hazırla
            const cleanSegments = doc.segments.map(s => {
                const src = cleanGeminiDraftTag(s.source);
                const trg = cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim());
                return {
                    id: s.id,
                    paraId: s.paraId,
                    docx: s.docx,
                    source: src,
                    target: trg,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    durationSec: s.durationSec,
                    isHead: isLikelyHeading(trg) || s.isHeading || (s.styleMemory && s.styleMemory.isHeading),
                    styleMemory: s.styleMemory,
                    targetHtml: renderFormattedSegHtml(s, (s.target && s.target.trim()) ? 'target' : 'source'),
                    sourceHtml: renderFormattedSegHtml(s, 'source')
                };
            }).filter(s => s.target.length > 0 || s.source.length > 0);

            // Paragrafları ve içeriği oluştur
            let bodyHtml = "";

            const isActualSub = (doc.originalFormat === 'srt' || doc.originalFormat === 'vtt');

            if (opts.contentMode === 'subtitle_timed' && isActualSub) {
                // Zaman damgalı altyazı görünümü
                bodyHtml += \`
                <div style="margin-bottom: 18pt; border-bottom: 2.5pt solid #6366f1; padding-bottom: 10pt;">
                    <h1 class="Heading1" style="color: #4338ca; font-size: 18pt; margin-bottom: 4pt; font-family:'Segoe UI', Arial, sans-serif;">
                        \${escapeHtml(cleanDocName)} - Zaman Damgalı Altyazı Çevirisi
                    </h1>
                    <p style="color: #64748b; font-size: 9.5pt; font-family:'Segoe UI', Arial, sans-serif; margin: 0;">
                        Tarih: \${new Date().toLocaleDateString('tr-TR')} · Toplam Altyazı Bloğu: \${cleanSegments.length} Segment
                    </p>
                </div>\\n\`;

                cleanSegments.forEach((seg, idx) => {
                    const startStr = seg.startTime || formatSecondsToSrtTimestamp(idx * 3.5);
                    const endStr = seg.endTime || formatSecondsToSrtTimestamp(idx * 3.5 + 3.0);
                    const durSec = seg.durationSec ? seg.durationSec.toFixed(1) : '3.0';

                    bodyHtml += \`
                    <div style="margin-bottom: 14pt; padding: 10pt 12pt; border: 1px solid #cbd5e1; border-left: 5pt solid #6366f1; background-color: #f8fafc; border-radius: 4pt; page-break-inside: avoid;">
                        <div style="margin-bottom: 7pt; font-family: 'Courier New', Consolas, monospace; font-size: 11pt; font-weight: bold; color: #4338ca;">
                            <span style="background-color: #ede9fe; padding: 2pt 6pt; border-radius: 3pt; border: 1px solid #ddd6fe; color:#5b21b6;">#\${String(idx + 1).padStart(2, '0')}</span>
                            &nbsp;&nbsp;
                            <span style="background-color: #e0f2fe; color: #0369a1; padding: 2pt 6pt; border-radius: 3pt; border: 1px solid #bae6fd;">⏱️ \${startStr} ➔ \${endStr}</span>
                            &nbsp;
                            <span style="color: #64748b; font-size: 9pt; font-family:'Segoe UI', sans-serif;">[Süre: \${durSec}s]</span>
                        </div>
                        <div style="margin-bottom: 7pt;">
                            <div style="font-weight: bold; color: #64748b; font-size: 8.5pt; text-transform: uppercase; font-family:'Segoe UI',sans-serif; margin-bottom: 2pt;">Kaynak Konuşma Bloğu:</div>
                            <div style="padding-left: 10pt; color:#475569; font-size: 10pt;">\${seg.sourceHtml}</div>
                        </div>
                        <div>
                            <div style="font-weight: bold; color: #0284c7; font-size: 9pt; text-transform: uppercase; font-family:'Segoe UI',sans-serif; margin-bottom: 2pt;">Hedef Altyazı Çevirisi:</div>
                            <div style="padding-left: 10pt; color:#0f172a; font-weight:bold; font-size: 11pt;">\${seg.targetHtml}</div>
                        </div>
                    </div>\\n\`;
                });
            } else if (opts.contentMode === 'table') {
                const hasTiming = cleanSegments.some(s => s.startTime);
                bodyHtml += \`
                <table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse:collapse; margin-bottom:14pt; border:1px solid #cbd5e1; font-size:\${opts.fontSize}pt;">
                    <thead>
                        <tr style="background-color:#f1f5f9; font-weight:bold;">
                            <th style="width:7%; border:1px solid #cbd5e1; text-align:center;">#</th>
                            \${hasTiming ? '<th style="width:23%; border:1px solid #cbd5e1; text-align:center;">Zaman Aralığı</th>' : ''}
                            <th style="width:\${hasTiming ? '35%' : '46%'}; border:1px solid #cbd5e1; text-align:left;">Kaynak Metin</th>
                            <th style="width:\${hasTiming ? '35%' : '46%'}; border:1px solid #cbd5e1; text-align:left;">Hedef Çeviri</th>
                        </tr>
                    </thead>
                    <tbody>\\n\`;
                cleanSegments.forEach((seg, idx) => {
                    bodyHtml += \`
                        <tr>
                            <td style="border:1px solid #cbd5e1; text-align:center; vertical-align:top; font-size:\${Math.max(9, opts.fontSize - 2)}pt; color:#64748b;">\${idx + 1}</td>
                            \${hasTiming ? \`<td style="border:1px solid #cbd5e1; text-align:center; vertical-align:top; font-family:monospace; font-size:9pt; color:#4338ca;">\${seg.startTime || ''}<br/>➔ \${seg.endTime || ''}</td>\` : ''}
                            <td style="border:1px solid #cbd5e1; vertical-align:top;">\${seg.sourceHtml}</td>
                            <td style="border:1px solid #cbd5e1; vertical-align:top; font-weight:500;">\${seg.targetHtml}</td>
                        </tr>\\n\`;
                });
                bodyHtml += \`</tbody></table>\\n\`;
            } else if (opts.contentMode === 'bilingual') {
                cleanSegments.forEach((seg, idx) => {
                    bodyHtml += \`
                        <div class="bilingual-box">
                            <div class="bilingual-source"><strong>[Kaynak \${idx + 1}]:</strong> \${seg.sourceHtml}</div>
                            <p class="MsoNormal" style="text-indent: 0cm;"><strong>[Çeviri]:</strong> \${seg.targetHtml}</p>
                        </div>\\n\`;
                });
            } else {
                // SMARTCAT KUSURSUZ AKIŞ: Cümleler paragraflarda tek boşlukla birleşir, asla her segmentten sonra alt satıra atlanmaz!
                if (opts.contentMode === 'all_content' && cleanDocName) {
                    bodyHtml += \`<h1 class="Heading1" style="text-align:center; margin-bottom:18pt;">\${escapeHtml(cleanDocName)}</h1>\\n\`;
                }

                // Paragraflara göre grupla
                const paragraphs = [];
                let curGroup = [];
                let curPid = null;

                cleanSegments.forEach((seg, idx) => {
                    if (seg.isHead) {
                        if (curGroup.length > 0) {
                            paragraphs.push({ isHead: false, segs: curGroup });
                            curGroup = [];
                            curPid = null;
                        }
                        paragraphs.push({ isHead: true, segs: [seg] });
                        return;
                    }

                    let pid = seg.paraId !== undefined ? seg.paraId : (seg.docx && seg.docx.p !== undefined ? seg.docx.p : null);

                    if (pid != null) {
                        if (curPid === null) {
                            curPid = pid;
                            curGroup.push(seg);
                        } else if (curPid === pid) {
                            curGroup.push(seg);
                        } else {
                            paragraphs.push({ isHead: false, segs: curGroup });
                            curGroup = [seg];
                            curPid = pid;
                        }
                    } else {
                        // paraId yoksa ardışık gövde cümleleri AYNI paragrafta birleşir, alt satıra atlamaz!
                        const prev = idx > 0 ? cleanSegments[idx - 1] : null;
                        const hardBreak = prev && (prev.endsParagraph || (prev.source && /\\n\\s*$/.test(prev.source)) || (prev.target && /\\n\\s*$/.test(prev.target)));
                        if (hardBreak && curGroup.length > 0) {
                            paragraphs.push({ isHead: false, segs: curGroup });
                            curGroup = [seg];
                        } else {
                            curGroup.push(seg);
                        }
                    }
                });

                if (curGroup.length > 0) {
                    paragraphs.push({ isHead: false, segs: curGroup });
                }

                paragraphs.forEach(pObj => {
                    if (pObj.isHead) {
                        const first = pObj.segs[0];
                        bodyHtml += \`<h1 class="Heading1">\${first.targetHtml}</h1>\\n\`;
                    } else {
                        // Paragraf içindeki tüm cümleler tek bir boşlukla yan yana akar, yeni satıra geçmez
                        const pText = pObj.segs.map(s => s.targetHtml).join(' ');
                        bodyHtml += \`<p class="MsoNormal">\${pText}</p>\\n\`;
                    }
                });
            }`;

function updateFiles() {
    ['legacy_index.html', 'index.html'].forEach(filename => {
        let content = fs.readFileSync(filename, 'utf8');

        const startMarker = 'function buildWordDocumentHtml(doc, opts) {';
        const startIdx = content.indexOf(startMarker);
        
        // Find where linePercent or return `<!DOCTYPE html> starts
        const endMarker = 'const linePercent = Math.round(opts.lineSpacing * 100);';
        const endIdx = content.indexOf(endMarker, startIdx);

        if (startIdx !== -1 && endIdx !== -1) {
            content = content.substring(0, startIdx) + newBuildWordDocumentHtml + "\n\n            " + content.substring(endIdx);
            fs.writeFileSync(filename, content, 'utf8');
            console.log(`[${filename}] Updated buildWordDocumentHtml successfully!`);
        } else {
            console.error(`[${filename}] Markers not found! start: ${startIdx}, end: ${endIdx}`);
        }
    });
}

updateFiles();

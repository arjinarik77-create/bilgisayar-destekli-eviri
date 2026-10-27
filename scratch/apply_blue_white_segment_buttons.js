const fs = require('fs');

function applyBlueWhiteStyling(filePath) {
    console.log(`Styling segment buttons to pure Blue & White in ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. UPDATE SUBTITLE HEADER HTML (Timing bar & buttons)
    const headerRegex = /subtitleHeaderHtml\s*=\s*`[\s\S]*?`\s*;/;
    
    const newHeaderHtml = `subtitleHeaderHtml = \`
                    <div class="cat-subtitle-header flex items-center justify-between px-3 py-1 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 text-[11px] font-sans select-none gap-2 flex-wrap sm:flex-nowrap">
                        <!-- Sol Bölüm: Zaman Kodları & İnce Ayar (Mavi ve Beyaz Standart Tuşlar) -->
                        <div class="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <span class="material-symbols-outlined text-[15px] text-blue-600 dark:text-blue-400" title="Zaman Kodları">schedule</span>
                            
                            <div class="flex items-center gap-1">
                                <input type="text"
                                       id="subStartTime-\${seg.id}"
                                       value="\${start}"
                                       onfocus="this.select()"
                                       onchange="updateSegmentTimestamp(\${seg.id}, 'start', this.value)"
                                       class="w-20 text-center text-[11px] font-sans font-medium text-slate-800 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                       title="Başlangıç zamanı (00:00:00,000)" />
                                <span class="text-blue-500 font-bold text-xs">➔</span>
                                <input type="text"
                                       id="subEndTime-\${seg.id}"
                                       value="\${end}"
                                       onfocus="this.select()"
                                       onchange="updateSegmentTimestamp(\${seg.id}, 'end', this.value)"
                                       class="w-20 text-center text-[11px] font-sans font-medium text-slate-800 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                       title="Bitiş zamanı (00:00:00,000)" />
                            </div>

                            <span id="subDurationLabel-\${seg.id}" class="text-[10px] font-sans font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                \${dur.toFixed(1)}s
                            </span>

                            <div class="flex items-center gap-1">
                                <button type="button" 
                                        onclick="setTimestampFromCurrentVideo(\${seg.id}, 'start')" 
                                        title="Videonun şu anki oynatma anını başlangıç zamanı yap" 
                                        class="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10.5px] font-sans font-medium cursor-pointer transition-colors flex items-center gap-1 shadow-xs">
                                    <span class="material-symbols-outlined text-[13px]">timer</span>
                                    <span>Şu An</span>
                                </button>
                                <button type="button" onclick="nudgeSegmentTime(\${seg.id}, -0.5)" title="0.5 saniye geriye kaydır" class="px-1.5 py-0.5 text-[10.5px] font-sans font-medium bg-white hover:bg-blue-50 text-blue-700 dark:bg-neutral-800 dark:text-blue-400 rounded border border-blue-200 dark:border-neutral-700 cursor-pointer transition-colors shadow-xs">-0.5s</button>
                                <button type="button" onclick="nudgeSegmentTime(\${seg.id}, 0.5)" title="0.5 saniye ileriye kaydır" class="px-1.5 py-0.5 text-[10.5px] font-sans font-medium bg-white hover:bg-blue-50 text-blue-700 dark:bg-neutral-800 dark:text-blue-400 rounded border border-blue-200 dark:border-neutral-700 cursor-pointer transition-colors shadow-xs">+0.5s</button>
                                <button type="button" onclick="splitSubtitleSegment(\${seg.id})" class="px-2 py-0.5 text-[10.5px] font-sans font-medium bg-white hover:bg-blue-50 text-blue-700 dark:bg-neutral-800 dark:text-blue-400 border border-blue-300 dark:border-neutral-700 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs" title="Cümleyi imleç noktasından ikiye böl">
                                    <span class="material-symbols-outlined text-[13px] text-blue-600 dark:text-blue-400">content_cut</span>
                                    <span>Böl</span>
                                </button>
                                <button type="button" onclick="mergeSegments(\${seg.id})" class="px-2 py-0.5 text-[10.5px] font-sans font-medium bg-white hover:bg-blue-50 text-blue-700 dark:bg-neutral-800 dark:text-blue-400 border border-blue-300 dark:border-neutral-700 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs" title="Bu segmenti sonrakiyle birleştir (Kısayol: Ctrl + M / Ctrl + Shift + M / Ctrl + J)">
                                    <span class="material-symbols-outlined text-[13px] text-blue-600 dark:text-blue-400">call_merge</span>
                                    <span>Birleştir</span>
                                </button>
                            </div>
                        </div>

                        <!-- Sağ Bölüm: CPL / CPS Metrikleri ve Kural Araçları (Mavi ve Beyaz Standart Tuşlar) -->
                        <div id="subMetricsBar-\${seg.id}" class="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                            <span id="subLine1Counter-\${seg.id}" class="\${subMetrics.isCpl1Exceeded ? 'text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium'}">
                                1: <span class="font-bold">\${subMetrics.cplLine1}</span>/42 CPL
                            </span>
                            <span id="subLine2Counter-\${seg.id}" class="\${subMetrics.isCpl2Exceeded ? 'text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium'}">
                                2: <span class="font-bold">\${subMetrics.cplLine2}</span>/42 CPL
                            </span>
                            <span id="subLineCountCounter-\${seg.id}" class="hidden">Satır: \${subMetrics.lineCount}/2</span>

                            <span id="subCpsCounter-\${seg.id}" class="px-1.5 py-0.5 rounded font-medium border text-[10px] \${cpsBadgeClass}">
                                \${subMetrics.cps} CPS (\${cpsLabel})
                            </span>

                            \${(subMetrics.cps > 17 || subMetrics.isCpl1Exceeded || subMetrics.isCpl2Exceeded) ? \`
                            <button type="button" onclick="CatAVT.AutoCondense.condenseSegment(\${seg.id})" class="text-[10.5px] font-sans font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-xs" title="Metni anlamı bozmadan ideal CPS sınırına sığdıracak şekilde AI ile kısalt">
                                <span class="material-symbols-outlined text-[13px] text-blue-600">auto_fix_high</span>
                                <span>AI Kısalt</span>
                            </button>
                            \` : ''}

                            <button type="button" onclick="CatAVT.SmartLineBreak.applyToSegment(\${seg.id})" class="text-[10.5px] font-sans font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-xs" title="Piramit Kuralına göre 2 satıra böl">
                                <span class="material-symbols-outlined text-[13px] text-blue-600">format_align_center</span>
                                <span>Piramit</span>
                            </button>

                            <button type="button" onclick="CatAVT.Placement.togglePlacement(\${seg.id})" class="text-[10.5px] font-sans font-medium \${seg.placement === 'top' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'} border px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-xs" title="Altyazıyı ekranın üstüne ({\\\\an8}) veya altına konumlandır">
                                <span class="material-symbols-outlined text-[13px]">\${seg.placement === 'top' ? 'vertical_align_top' : 'vertical_align_bottom'}</span>
                                <span>\${seg.placement === 'top' ? 'Üst' : 'Alt'}</span>
                            </button>

                            <button type="button" onclick="updateCinemaSubtitleMonitor(\${seg.id})" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center transition-colors" title="Videoda Bu Segmenti Oynat & Odaklan">
                                <span class="material-symbols-outlined text-[17px]">play_circle</span>
                            </button>
                        </div>
                    </div>
                \`;`;

    if (headerRegex.test(content)) {
        content = content.replace(headerRegex, newHeaderHtml);
        console.log(`  ✅ Replaced subtitleHeaderHtml with Blue & White standard buttons.`);
    }

    // 2. UPDATE CONFIRM CHECKBOX AND LQA BUTTON IN COLUMN 4
    const oldCol4 = `<!-- Kolon 4: Onay Durumu Kutucuğu, LQA Butonu ve Sağ Köşe Kompakt QA Rozeti -->
                        <div class="cat-segment-col-check w-14 shrink-0 flex flex-col items-center justify-start pt-2 px-1 border-l border-slate-200 dark:border-neutral-800 gap-2">
                            <!-- Onay Butonu -->
                            <button onclick="toggleConfirmSegment(\${seg.id})" 
                                    title="\${isConfirmed ? 'Onayı kaldır' : 'Onayla (Ctrl + Enter)'}" 
                                    class="cat-confirm-checkbox w-6 h-6 rounded border-2 transition-all flex items-center justify-center cursor-pointer \${isConfirmed ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs' : 'border-slate-300 dark:border-neutral-600 text-slate-300 dark:text-neutral-600 hover:border-slate-500 hover:text-slate-700'}">
                                <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                            </button>

                            <!-- Yorum & LQA Butonu -->
                            <button type="button" onclick="CatLSP.Review.openLqaDrawer(\${seg.id})" 
                                    class="w-7 h-7 rounded-md border border-slate-300 dark:border-neutral-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-500 hover:text-purple-600 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs relative"
                                    title="Yorumlar ve LQA Kalite Puanı Çekmecesini Aç">
                                <span class="material-symbols-outlined text-[15px]">rate_review</span>
                                \${(seg.comments?.length || 0) + (seg.lqaErrors?.length || 0) > 0 ? \`
                                    <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-600 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow-xs">
                                        \${(seg.comments?.length || 0) + (seg.lqaErrors?.length || 0)}
                                    </span>
                                \` : ''}
                            </button>`;

    const newCol4 = `<!-- Kolon 4: Onay Durumu Kutucuğu, LQA Butonu (Mavi ve Beyaz Standart Tuşlar) -->
                        <div class="cat-segment-col-check w-14 shrink-0 flex flex-col items-center justify-start pt-2 px-1 border-l border-slate-200 dark:border-neutral-800 gap-2">
                            <!-- Onay Butonu -->
                            <button onclick="toggleConfirmSegment(\${seg.id})" 
                                    title="\${isConfirmed ? 'Onayı kaldır' : 'Onayla (Ctrl + Enter)'}" 
                                    class="cat-confirm-checkbox w-6 h-6 rounded border transition-all flex items-center justify-center cursor-pointer \${isConfirmed ? 'border-blue-600 bg-blue-600 text-white shadow-xs' : 'border-blue-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-400 dark:text-neutral-500 hover:border-blue-600 hover:text-blue-600'}">
                                <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                            </button>

                            <!-- Yorum & LQA Butonu -->
                            <button type="button" onclick="CatLSP.Review.openLqaDrawer(\${seg.id})" 
                                    class="w-7 h-7 rounded-md border border-blue-200 hover:border-blue-500 hover:bg-blue-50 bg-white text-blue-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-blue-400 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs relative"
                                    title="Yorumlar ve LQA Kalite Puanı Çekmecesini Aç">
                                <span class="material-symbols-outlined text-[15px]">rate_review</span>
                                \${(seg.comments?.length || 0) + (seg.lqaErrors?.length || 0) > 0 ? \`
                                    <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-sans text-[8px] font-bold flex items-center justify-center shadow-xs">
                                        \${(seg.comments?.length || 0) + (seg.lqaErrors?.length || 0)}
                                    </span>
                                \` : ''}
                            </button>`;

    if (content.includes(oldCol4)) {
        content = content.replace(oldCol4, newCol4);
        console.log(`  ✅ Replaced Column 4 with Blue & White buttons.`);
    }

    // 3. UPDATE MT BUTTONS (DeepL & Gemini) IN COLUMN 3
    const oldDeeplGemini = `hover:bg-sky-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-600 hover:border-sky-400 dark:hover:border-sky-500`;
    const newDeeplGemini = `hover:bg-blue-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-blue-200 dark:border-neutral-600 hover:border-blue-400 dark:hover:border-blue-400`;
    content = content.replaceAll(oldDeeplGemini, newDeeplGemini);

    const oldGeminiBorder = `hover:bg-purple-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-600 hover:border-purple-400 dark:hover:border-purple-500`;
    content = content.replaceAll(oldGeminiBorder, newDeeplGemini);

    // 4. UPDATE TEXTAREA FOCUS RINGS TO BLUE
    content = content.replaceAll('focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:focus:border-purple-400 dark:focus:ring-purple-900/50', 'focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40');
    content = content.replaceAll('hover:bg-purple-50/20', 'hover:bg-blue-50/30');

    // 5. UPDATE TRACK CHANGES BUTTONS
    content = content.replaceAll(
        'class="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer shadow-xs"',
        'class="px-2 py-0.5 text-[10.5px] font-sans font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors cursor-pointer shadow-xs"'
    );
    content = content.replaceAll(
        'class="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer shadow-xs"',
        'class="px-2 py-0.5 text-[10.5px] font-sans font-medium bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded transition-colors cursor-pointer shadow-xs"'
    );

    // 6. CPS BADGE CALCULATION CLEANUP (NO NEON GLOW)
    content = content.replaceAll(
        "cpsBadgeClass = 'text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700';",
        "cpsBadgeClass = 'text-slate-800 bg-slate-100 border-slate-300 dark:bg-neutral-800 dark:text-slate-200 dark:border-neutral-700';"
    );
    content = content.replaceAll(
        "cpsBadgeClass = 'text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';",
        "cpsBadgeClass = 'text-blue-800 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';"
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saved ${filePath}\n`);
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(applyBlueWhiteStyling);

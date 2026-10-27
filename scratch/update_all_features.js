const fs = require('fs');

console.log("=== APPLYING USER ENHANCEMENTS ===");

// 1. Read index.html
let html = fs.readFileSync('index.html', 'utf8');

// 2. VIDEO PANEL THEME ADAPTATION
const oldPanelRegex = /<div id="subVideoPanel"[\s\S]*?<!-- Gizli Yerel Video Dosyası Seçici -->[\s\S]*?<input type="file" id="subVideoFileInput"[\s\S]*?<\/div>/;

const newThemeVideoPanel = `<div id="subVideoPanel"
                        class="hidden w-[420px] lg:w-[480px] xl:w-[560px] border-l border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] text-slate-800 dark:text-neutral-100 flex flex-col shrink-0 select-none shadow-xl z-20 overflow-hidden transition-colors">

                        <!-- Panel Üst Barı (Temaya Duyarlı) -->
                        <div class="p-2.5 px-3 bg-slate-50 dark:bg-neutral-900 border-b border-slate-300 dark:border-neutral-800 flex items-center justify-between font-sans transition-colors">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">movie</span>
                                <span class="text-xs font-semibold text-slate-800 dark:text-neutral-100 tracking-wide font-sans">Video & Altyazı Monitörü</span>
                            </div>
                            <div class="flex items-center gap-1.5 font-sans">
                                <button type="button" onclick="openSubtitleStyleModal()"
                                    class="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer font-sans shadow-2xs"
                                    title="Altyazı yazı tipi, boyutu, renkleri ve hazır şablonları özelleştir">
                                    <span class="material-symbols-outlined text-[15px] text-blue-600 dark:text-blue-400">palette</span>
                                    <span>Altyazı Stili & Şablonları</span>
                                </button>
                                <button type="button" onclick="document.getElementById('subVideoFileInput').click()"
                                    class="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer font-sans shadow-2xs"
                                    title="Yerel Video Yükle veya Değiştir">
                                    <span class="material-symbols-outlined text-[14px] text-blue-600 dark:text-blue-400">upload_file</span>
                                    <span>Video Seç</span>
                                </button>
                                <div class="relative inline-block text-left" id="subQuickExportDropdownWrap">
                                    <button type="button" onclick="const m=document.getElementById('subQuickExportMenu'); if(m) m.classList.toggle('hidden');"
                                        class="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer font-sans shadow-2xs"
                                        title="Altyazıyı format seçerek dışa aktar (.SRT, .VTT, Netflix TTML, .ASS)">
                                        <span class="material-symbols-outlined text-[14px] text-blue-600 dark:text-blue-400">download</span>
                                        <span>Dışa Aktar</span>
                                        <span class="material-symbols-outlined text-[12px]">expand_more</span>
                                    </button>
                                    <div id="subQuickExportMenu" class="hidden absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 py-1 text-xs font-sans select-none">
                                        <button type="button" onclick="downloadCleanOutput('srt'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-between cursor-pointer font-sans">
                                            <span>.SRT</span>
                                            <span class="text-[10px] text-slate-400">SubRip</span>
                                        </button>
                                        <button type="button" onclick="downloadCleanOutput('vtt'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-between cursor-pointer font-sans">
                                            <span>.VTT</span>
                                            <span class="text-[10px] text-slate-400">WebVTT</span>
                                        </button>
                                        <button type="button" onclick="downloadCleanOutput('ttml'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-between cursor-pointer font-sans">
                                            <span class="text-blue-600 dark:text-blue-400 font-medium">Netflix TTML</span>
                                            <span class="text-[10px] text-slate-400">IMSC 1.1</span>
                                        </button>
                                        <button type="button" onclick="downloadCleanOutput('ass'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-between cursor-pointer font-sans">
                                            <span class="font-medium text-slate-700 dark:text-neutral-300">.ASS / SSA</span>
                                            <span class="text-[10px] text-slate-400">{\\an8}</span>
                                        </button>
                                    </div>
                                </div>
                                <button type="button" onclick="exitSubtitlingMode()"
                                    class="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center cursor-pointer font-sans shadow-2xs"
                                    title="Altyazı çeviri modundan çık">
                                    <span class="material-symbols-outlined text-[15px]">close</span>
                                </button>
                            </div>
                        </div>

                        <!-- 1. Durum: Video Henüz Yüklenmediyse Yer Tutucu (Temaya Duyarlı Placeholder) -->
                        <div id="subVideoPlaceholderArea"
                            class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-blue-200 dark:border-neutral-800 m-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 transition-colors">
                            <div
                                class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-xs">
                                <span class="material-symbols-outlined text-4xl">movie</span>
                            </div>
                            <h4 class="text-sm font-bold text-slate-800 dark:text-neutral-100 mb-1">Geniş Video Önizleme Alanı</h4>
                            <p class="text-xs text-slate-500 dark:text-neutral-400 mb-4 max-w-xs leading-relaxed">
                                Çeviri yaparken çift yönlü canlı sinema altyazı önizlemesi ve zaman senkronizasyonu için video yükleyin.
                            </p>
                            <button type="button" onclick="document.getElementById('subVideoFileInput').click()"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-colors">
                                <span class="material-symbols-outlined text-[16px]">upload_file</span>
                                <span>Video Dosyası Yükle (.mp4, .webm, .mkv vb.)</span>
                            </button>
                        </div>

                        <!-- 2. Durum: Geniş & Responsive HTML5 Video Oynatıcı & Canlı Sinema Altyazı Katmanı -->
                        <div id="subVideoPlayerArea" class="hidden flex-1 flex flex-col overflow-hidden bg-black">
                            <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-slate-300 dark:border-neutral-800 shadow-inner">
                                <video id="avtVideoPlayer" class="w-full h-full object-contain" controls playsinline style="aspect-ratio: 16/9; max-height: 100%;"></video>
                                <!-- Canlı Sinema Altyazı Önizleme Katmanı (Subtitle Overlay) -->
                                <div id="avtSubtitleOverlay"
                                    class="absolute bottom-6 left-4 right-4 text-center pointer-events-none select-none px-3 py-1.5 transition-all z-10 font-bold max-w-full break-words"
                                    style="font-family: Arial, sans-serif; font-size: 24px; color: #ffeb3b; background-color: rgba(0,0,0,0.75); border-radius: 4px; display: inline-block;">
                                </div>
                            </div>
                            <!-- Sade Alt Durum Şeridi (Temaya Duyarlı) -->
                            <div class="px-3 py-2 bg-slate-50 dark:bg-neutral-900 border-t border-slate-300 dark:border-neutral-800 flex items-center justify-between text-xs font-sans text-slate-700 dark:text-neutral-300 transition-colors">
                                <div class="flex items-center gap-2 truncate font-sans">
                                    <span class="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse shrink-0"></span>
                                    <span id="subVideoTimecodeDisplay" class="font-medium text-slate-800 dark:text-neutral-200 font-mono">00:00:00,000</span>
                                    <span class="text-slate-300 dark:text-neutral-700">|</span>
                                    <span id="subVideoActiveSegDisplay" class="truncate text-slate-600 dark:text-neutral-400">Segment Seçilmedi</span>
                                </div>
                                <span class="text-[10px] font-sans font-medium text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-slate-300 dark:border-neutral-700 shrink-0">Canlı Senkron</span>
                            </div>
                        </div>

                        <!-- Gizli Yerel Video Dosyası Seçici -->
                        <input type="file" id="subVideoFileInput"
                            accept="video/*,.mp4,.mkv,.webm,.mov,.avi,.flv,.wmv,.m4v,.ts,.3gp,.ogg,.ogv,.m2ts,.mts"
                            class="hidden" onchange="handleSubVideoUpload(event)">
                    </div>`;

if (oldPanelRegex.test(html)) {
    html = html.replace(oldPanelRegex, newThemeVideoPanel);
    console.log("✅ Replaced subVideoPanel with theme-adaptive template");
} else {
    console.warn("⚠️ oldPanelRegex did not match directly");
}

// 3. Sepia theme CSS for Video Panel
const sepiaCss = `
        /* SEPIA THEME EXTENSIONS FOR VIDEO PANEL */
        html[data-theme='sepia'] #subVideoPanel {
            background-color: #fbf2db !important;
            border-color: #dfceb0 !important;
            color: #433422 !important;
        }
        html[data-theme='sepia'] #subVideoPanel .bg-slate-50,
        html[data-theme='sepia'] #subVideoPanel .bg-white {
            background-color: #f4e5c8 !important;
            border-color: #dfceb0 !important;
            color: #433422 !important;
        }
        html[data-theme='sepia'] #subVideoPlaceholderArea {
            background-color: #f0dfbf !important;
            border-color: #d8c39e !important;
        }
`;
if (!html.includes('/* SEPIA THEME EXTENSIONS FOR VIDEO PANEL */')) {
    html = html.replace('</style>', sepiaCss + '\n    </style>');
    console.log("✅ Added Sepia theme rules for video panel");
}

// 4. TM MATCH: Do not write directly underneath textarea; instead, put a green checkmark button on far right of textarea
// Replace tmSuggestionHtml assignment so it doesn't write underneath
const oldTmSuggRegex = /tmSuggestionHtml = `[\s\S]*?class="tm-suggestion-box[\s\S]*?<\/div>\s*`;/;
if (oldTmSuggRegex.test(html)) {
    html = html.replace(oldTmSuggRegex, "tmSuggestionHtml = ''; // Bellek önerisi metin kutusu altına yazılmaz, sağ köşedeki yeşil tik ile aktarılır");
    console.log("✅ Cleared tmSuggestionHtml under textarea");
}

// 5. In buildSingleSegmentCard: Add green checkmark button at far right of textarea if tmMatch exists
const oldTextareaCode = `<textarea id="targetInput-\${seg.id}" 
                                              \${seg.isLocked ? 'readonly="true"' : ''}
                                              onfocus="onSegmentClickOrFocus(\${seg.id})"
                                              oninput="onSegmentChange(\${seg.id}, this)"
                                              onkeydown="onSegmentKeydown(event, \${seg.id})"
                                              rows="\${isSubtitlingMode ? 2 : 2}"
                                              placeholder="\${seg.isLocked ? '🔒 Segment kilitli.' : 'Hedef çeviriyi girin veya DeepL / Gemini AI ile tek tıkla çevirin...'}"
                                              class="cat-target-textarea w-full px-3 py-2 text-[13px] text-slate-900 dark:text-neutral-100 rounded-lg border border-slate-300 dark:border-neutral-600 hover:border-slate-400 dark:hover:border-neutral-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40 bg-white dark:bg-[#121212] outline-none transition-all resize-none min-h-[46px] leading-relaxed font-sans shadow-2xs \${seg.isLocked ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-neutral-900' : ''} \${!isConfirmed && subMetrics && (subMetrics.isLineExceeded || subMetrics.isCplExceeded) ? 'border-rose-500 ring-2 ring-rose-200' : ''}">\${escapeHtml(seg.target)}</textarea>`;

const newTextareaWithGreenCheckmark = `<div class="relative w-full flex items-center">
                                        <textarea id="targetInput-\${seg.id}" 
                                                  \${seg.isLocked ? 'readonly="true"' : ''}
                                                  onfocus="onSegmentClickOrFocus(\${seg.id})"
                                                  oninput="onSegmentChange(\${seg.id}, this)"
                                                  onkeydown="onSegmentKeydown(event, \${seg.id})"
                                                  rows="\${isSubtitlingMode ? 2 : 2}"
                                                  placeholder="\${seg.isLocked ? '🔒 Segment kilitli.' : 'Hedef çeviriyi girin veya DeepL / Gemini AI ile tek tıkla çevirin...'}"
                                                  class="cat-target-textarea w-full pr-10 px-3 py-2 text-[13px] text-slate-900 dark:text-neutral-100 rounded-lg border border-slate-300 dark:border-neutral-600 hover:border-slate-400 dark:hover:border-neutral-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40 bg-white dark:bg-[#121212] outline-none transition-all resize-none min-h-[46px] leading-relaxed font-sans shadow-2xs \${seg.isLocked ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-neutral-900' : ''} \${!isConfirmed && subMetrics && (subMetrics.isLineExceeded || subMetrics.isCplExceeded) ? 'border-rose-500 ring-2 ring-rose-200' : ''}">\${escapeHtml(seg.target)}</textarea>
                                        \${(tmMatch && tmMatch.entry && tmMatch.entry.target) ? \`
                                            <button type="button" 
                                                    onclick="applyTmMatchToTarget(\${seg.id})" 
                                                    title="Bellekteki çeviriyi aktar (%\${tmMatch.similarity || 100} Eşleşme): \${escapeHtml(tmMatch.entry.target)}" 
                                                    class="absolute right-2 top-2 z-10 w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-xs cursor-pointer transition-all border border-emerald-600"
                                                    aria-label="Bellekteki çeviriyi kutuya aktar">
                                                <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                                            </button>
                                        \` : ''}
                                    </div>`;

if (html.includes(oldTextareaCode)) {
    html = html.replace(oldTextareaCode, newTextareaWithGreenCheckmark);
    console.log("✅ Injected green checkmark button at far right of textarea");
} else {
    console.warn("⚠️ oldTextareaCode did not match directly");
}

// 6. Define applyTmMatchToTarget function
const applyTmFunc = `
        function applyTmMatchToTarget(segId) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;
            const tm = seg.tmSuggestion || (typeof findBestTmMatch === 'function' ? findBestTmMatch(seg.source, seg.id) : null);
            if (!tm || !tm.entry || !tm.entry.target) return;

            const input = document.getElementById(\`targetInput-\${segId}\`);
            if (input) {
                input.value = tm.entry.target;
                onSegmentChange(segId, input);
                input.focus();
                if (typeof showToast === 'function') {
                    showToast(\`✓ Bellekteki çeviri aktarıldı (%\${tm.similarity || 100} eşleşme).\`);
                }
            }
        }

        function applyTmSuggestion(segId) {
            applyTmMatchToTarget(segId);
        }
`;
if (!html.includes('function applyTmMatchToTarget(')) {
    html = html.replace('function onSegmentChange(segId, el) {', applyTmFunc + '\n        function onSegmentChange(segId, el) {');
    console.log("✅ Added applyTmMatchToTarget function");
}

// 7. REMOVE CONSTRAINT ALERT TEXT FROM UNDER TEXTAREA
// In buildSingleSegmentCard:
const oldAlertAssignRegex = /subtitleConstraintAlertHtml = `[\s\S]*?<\/div>\s*`;/g;
html = html.replace(oldAlertAssignRegex, "subtitleConstraintAlertHtml = `<div id=\"subAlertContainer-\${seg.id}\"></div>`;");

// In updateSubtitleMetricsLive: clear alert text so it doesn't write underneath
const oldLiveAlertRegex = /alertContainer\.innerHTML = `[\s\S]*?<\/div>\s*`;/g;
html = html.replace(oldLiveAlertRegex, "alertContainer.innerHTML = '';");
console.log("✅ Removed constraint alert text banners from under target textarea");

// 8. Save updated HTML across all mirror files
const files = [
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/legacy_index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html.bak'
];

files.forEach(f => {
    fs.writeFileSync(f, html, 'utf8');
    console.log(`Saved ${f}`);
});

console.log("🎉 ALL ENHANCEMENTS APPLIED SUCCESSFULLY!");

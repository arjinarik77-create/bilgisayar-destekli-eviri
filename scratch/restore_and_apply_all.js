const fs = require('fs');

const currentHtml = fs.readFileSync('index.html', 'utf8');

// Match script opening tag before STATE
const scriptMatch = currentHtml.match(/<script>\s*\/\/\s*={10,}\s*\/\/\s*1\.\s*STATE/);
if (!scriptMatch) {
    console.error('Could not find script opening tag');
    process.exit(1);
}
const scriptStartIdx = scriptMatch.index + '<script>\n'.length;
let part1 = currentHtml.substring(0, scriptStartIdx);

// Match script closing tag before İLK GİRİŞ
const endMatch = currentHtml.match(/<\/script>\s*<!--\s*={10,}\s*-->\s*<!--\s*İLK GİRİŞ/);
if (!endMatch) {
    console.error('Could not find script closing tag');
    process.exit(1);
}
const part3 = currentHtml.substring(endMatch.index);

// Part 2: block5.js
let b5 = fs.readFileSync('scratch/block5.js', 'utf8');
console.log('Original b5 length:', b5.length);

// Normalize line endings in b5 if needed, or work with both
// === IN PART 1 (HTML) ===
// 1. Light Mode Borders
part1 = part1.replace('border-b border-sky-100', 'border-b border-slate-300 dark:border-neutral-800');
part1 = part1.replace('border-r border-slate-200 dark:border-neutral-800', 'border-r border-slate-300 dark:border-neutral-800');
part1 = part1.replace('border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#000000] shrink-0 select-none z-20', 'border-b border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#000000] shrink-0 select-none z-20');
part1 = part1.replace(/class="h-11 px-4 flex items-center justify-between border-b border-slate-\d+ dark:border-neutral-900 gap-3 text-xs">/, 'class="h-11 px-4 flex items-center justify-between border-b border-slate-300 dark:border-neutral-900 gap-3 text-xs">');
part1 = part1.replace(/class="h-10 px-4 flex items-center justify-between border-b border-slate-\d+ dark:border-neutral-900 gap-2">/, 'class="h-10 px-4 flex items-center justify-between border-b border-slate-300 dark:border-neutral-900 gap-2">');
part1 = part1.replace(/class="h-10 px-4 flex items-center justify-between border-b border-slate-\d+ dark:border-neutral-900 gap-3 text-xs">/, 'class="h-10 px-4 flex items-center justify-between border-b border-slate-300 dark:border-neutral-900 gap-3 text-xs">');
part1 = part1.replace('border-l border-slate-200 dark:border-neutral-800 bg-slate-950 text-white flex flex-col shrink-0 select-none shadow-2xl z-20 overflow-hidden', 'border-l border-slate-300 dark:border-neutral-800 bg-slate-950 text-white flex flex-col shrink-0 select-none shadow-2xl z-20 overflow-hidden');
part1 = part1.replace('border-t border-sky-100 bg-white/80', 'border-t border-slate-300 dark:border-neutral-800 bg-white/80');

// 2. Delete Netflix subtitle standard row in Part 1 while keeping hidden DOM hooks
const oldWbRegex = /<!-- ALTYAZI ÇEVİRİ MOTORU VE KOMPAKT KONTROL BARI \(SUBTITLING MODULE\) -->[\s\S]*?<div id="subtitlingWorkbench"[\s\S]*?<!-- Gizli Monitör DOM Elemanları[\s\S]*?<\/div>\s*<\/div>/;
const newHiddenWb = `<!-- Gizli Monitör DOM Elemanları (JS ve Test Uyumluluğu İçin - Netflix standardı satırı silindi) -->
                <div id="subtitlingWorkbench" class="hidden" aria-hidden="true" style="display:none;">
                    <span id="subMonitorTimecode">00:00:00,000 ➔ 00:00:03,000</span>
                    <span id="subMonitorDuration">3.0s</span>
                    <span id="subMonitorCpsBadge">14.2 CPS (İdeal)</span>
                    <div id="subMonitorLiveText">Altyazı önizlemesi</div>
                </div>`;
if (oldWbRegex.test(part1)) {
    part1 = part1.replace(oldWbRegex, newHiddenWb);
    console.log('✅ Deleted subtitlingWorkbench row from HTML');
} else {
    console.log('subtitlingWorkbench already replaced or regex not matched in part1');
}

// === IN B5 (SCRIPT) ===
// 1. Two-step merge and pending merge support
// A: Add pending merge selection border & click handler in buildSingleSegmentCard
const cardCreationRegex = /(const card = document\.createElement\('div'\);\s*card\.id = `segCard-\$\{seg\.id\}`;)\s*(const isEven[\s\S]*?card\.className = `cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 \$\{zebraBg\} hover:bg-blue-50\/30 dark:hover:bg-neutral-900\/70`;)/;
const cardReplacement = `const card = document.createElement('div');
            card.id = \`segCard-\${seg.id}\`;
            const isPendingMerge = (typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId === seg.id);
            const mergeBorderClass = isPendingMerge ? 'ring-2 ring-blue-600 bg-blue-50/70 border-l-4 border-l-blue-600 shadow-md' : '';
            card.className = \`cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 \${zebraBg} hover:bg-blue-50/30 dark:hover:bg-neutral-900/70 \${mergeBorderClass}\`;

            // 2. AŞAMA: Eğer 1. segment seçilmişse diğer karta tıklayınca iki cümleyi birleştir!
            if (typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId && !isPendingMerge) {
                card.classList.add('cursor-pointer');
                card.title = "2. segment olarak birleştirmek için tıklayın";
                card.onclick = (e) => {
                    const isInput = e.target.closest('input, textarea');
                    if (!isInput && window._pendingMergeSegId) {
                        handleMergeButtonClick(seg.id, e);
                    }
                };
            }`;

if (b5.includes('const isPendingMerge')) {
    console.log('b5 already has isPendingMerge');
} else {
    const targetIdx = b5.indexOf("const card = document.createElement('div');\r\n            card.id = `segCard-${seg.id}`;");
    const targetIdxLf = b5.indexOf("const card = document.createElement('div');\n            card.id = `segCard-${seg.id}`;");
    const foundIdx = targetIdx !== -1 ? targetIdx : targetIdxLf;
    if (foundIdx !== -1) {
        const afterCard = b5.indexOf('card.className =', foundIdx);
        const endOfLine = b5.indexOf(';', afterCard) + 1;
        b5 = b5.substring(0, foundIdx) + cardReplacement + b5.substring(endOfLine);
        console.log('✅ Injected 2-step card merge logic into b5');
    } else {
        console.warn('card target not found in b5');
    }
}

// B: Define handleMergeButtonClick and mergeSegments
const mergeSectionTarget = "        // ========================================================\r\n        // 7. SEGMENT AKSİYONLARI: BÖL / BİRLEŞTİR / ONAYLA";
const mergeSectionTargetLf = "        // ========================================================\n        // 7. SEGMENT AKSİYONLARI: BÖL / BİRLEŞTİR / ONAYLA";
const mIdx = b5.indexOf(mergeSectionTarget) !== -1 ? b5.indexOf(mergeSectionTarget) : b5.indexOf(mergeSectionTargetLf);

const mergeFunctionsDef = `        // ========================================================
        // 7. SEGMENT AKSİYONLARI: BÖL / BİRLEŞTİR / ONAYLA (2 AŞAMALI BİRLEŞTİRME & KISAYOL)
        // ========================================================
        window._pendingMergeSegId = null;

        function handleMergeButtonClick(segId, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (!window._pendingMergeSegId) {
                window._pendingMergeSegId = segId;
                renderActiveDocument();
                showToast(\`🔗 1. Segment (#\${segId}) seçildi. Lütfen birleştirmek istediğiniz 2. segmenti seçin veya "Birleştir"e tıklayın.\`);
                return;
            }

            if (window._pendingMergeSegId === segId) {
                window._pendingMergeSegId = null;
                renderActiveDocument();
                showToast("Segment birleştirme seçimi iptal edildi.");
                return;
            }

            const idA = window._pendingMergeSegId;
            const idB = segId;
            window._pendingMergeSegId = null;

            mergeSegments(idA, idB);
        }

        function mergeSegments(segIdA, segIdB) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length < 2) {
                showToast("Birleştirilecek yeterli segment yok.");
                return false;
            }

            let idxA = doc.segments.findIndex(s => s.id === segIdA);
            let idxB = doc.segments.findIndex(s => s.id === segIdB);

            if (idxA === -1 && idxB === -1) {
                const activeId = appState.activeSegmentId || 1;
                idxA = doc.segments.findIndex(s => s.id === activeId);
                idxB = idxA + 1;
            } else if (idxB === -1) {
                idxB = idxA + 1;
            }

            if (idxA > idxB) {
                const tmp = idxA; idxA = idxB; idxB = tmp;
            }

            if (idxA < 0 || idxB >= doc.segments.length) {
                showToast("Geçerli iki segment seçilemedi.");
                return false;
            }

            const segA = doc.segments[idxA];
            const segB = doc.segments[idxB];

            segA.source = (segA.source.trim() + ' ' + segB.source.trim()).trim();
            segA.target = (segA.target ? segA.target.trim() : '') + (segB.target ? ' ' + segB.target.trim() : '');
            segA.target = segA.target.trim();

            if (segB.endTime) {
                segA.endTime = segB.endTime;
            }
            if (typeof segA.durationSec === 'number' && typeof segB.durationSec === 'number') {
                segA.durationSec = parseFloat((segA.durationSec + segB.durationSec).toFixed(2));
            } else {
                segA.durationSec = 5.0;
            }

            doc.segments.splice(idxB, 1);

            doc.segments.forEach((s, i) => {
                s.id = i + 1;
            });

            appState.activeSegmentId = segA.id;
            window._pendingMergeSegId = null;

            renderActiveDocument();
            updateProgressStats();
            debouncedAutoSave(150);

            showToast(\`✅ Segment #\${segA.id} ve #\${segB.id || (segA.id + 1)} başarıyla birleştirildi!\`);
            return true;
        }
`;

if (mIdx !== -1 && !b5.includes('handleMergeButtonClick')) {
    const nextLine = b5.indexOf('\n', mIdx);
    const lineEnd = b5.indexOf('\n', nextLine + 1) + 1;
    b5 = b5.substring(0, mIdx) + mergeFunctionsDef + b5.substring(lineEnd);
    console.log('✅ Injected handleMergeButtonClick & mergeSegments');
}

// C: In selectProject and updateActiveProjectView: reset _pendingMergeSegId and handle video persistence
const selectTarget = "function selectProject(projId) {";
const selectReplacement = `function selectProject(projId) {
            window._pendingMergeSegId = null;
            const sBanner = document.getElementById('subStreamingStatusBanner');
            if (sBanner) {
                sBanner.classList.add('hidden');
                sBanner.style.display = 'none';
            }`;

if (b5.includes(selectTarget) && !b5.includes('window._pendingMergeSegId = null;\r\n            const sBanner') && !b5.includes('window._pendingMergeSegId = null;\n            const sBanner')) {
    b5 = b5.replace(selectTarget, selectReplacement);
    console.log('✅ Updated selectProject in b5');
}

// D: Video persistence in updateActiveProjectView
const subViewOldRegex = /if \(type === 'subtitling'\) \{[\s\S]*?if \(subVideoPanel\) subVideoPanel\.classList\.remove\('hidden'\);[\s\S]*?initSubVideoEventListeners\(\);/;
const subViewNewCode = `if (type === 'subtitling') {
                if (typeof collapseSidebarForSubtitling === 'function') collapseSidebarForSubtitling();
                window._pendingMergeSegId = null;
                const streamingBanner = document.getElementById('subStreamingStatusBanner');
                if (streamingBanner) {
                    if (type === 'subtitling' && typeof streamingTranscriptionActive !== 'undefined' && streamingTranscriptionActive) {
                        streamingBanner.classList.remove('hidden');
                        streamingBanner.style.display = 'flex';
                    } else {
                        streamingBanner.classList.add('hidden');
                        streamingBanner.style.display = 'none';
                    }
                }
                if (badgeEl) {
                    badgeEl.className = 'text-[10px] font-sans font-medium px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 shadow-2xs';
                    badgeEl.innerHTML = '<span class="material-symbols-outlined text-[13px] text-blue-600">subtitles</span><span>Altyazı Çevirisi (Netflix / EBU-TT)</span>';
                }
                if (docIcon) docIcon.innerText = 'subtitles';
                if (subBench) { subBench.classList.add('hidden'); subBench.style.display = 'none'; }
                if (interpBench) interpBench.classList.add('hidden');
                if (subVideoPanel) {
                    subVideoPanel.classList.remove('hidden');
                    subVideoPanel.style.display = 'flex';
                }

                // Video Oynatıcı Durumunu Koru (Kullanıcı Talebi: Projeye tekrar girince video kapanmasın)
                const player = document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer');
                const placeholder = document.getElementById('subVideoPlaceholderArea');
                const playerArea = document.getElementById('subVideoPlayerArea');
                const existingVideoUrl = (proj.videoUrl || (proj.videoFile ? URL.createObjectURL(proj.videoFile) : null) || (currentLoadedVideoFile ? URL.createObjectURL(currentLoadedVideoFile) : null));
                if (existingVideoUrl && player) {
                    if (!player.src || player.src !== existingVideoUrl) {
                        player.src = existingVideoUrl;
                        player.load();
                    }
                    if (placeholder) { placeholder.classList.add('hidden'); placeholder.style.display = 'none'; }
                    if (playerArea) { playerArea.classList.remove('hidden'); playerArea.style.display = 'flex'; }
                } else if (player && player.src && player.src.startsWith('blob:')) {
                    if (placeholder) { placeholder.classList.add('hidden'); placeholder.style.display = 'none'; }
                    if (playerArea) { playerArea.classList.remove('hidden'); playerArea.style.display = 'flex'; }
                }

                if (btnReturn) { btnReturn.classList.add('hidden'); btnReturn.classList.remove('flex'); }
                if (topBarReturn) { topBarReturn.classList.add('hidden'); topBarReturn.classList.remove('flex'); }
                if (collapsedBanner) { collapsedBanner.classList.add('hidden'); collapsedBanner.classList.remove('flex'); }
                initSubVideoEventListeners();`;

if (subViewOldRegex.test(b5)) {
    b5 = b5.replace(subViewOldRegex, subViewNewCode);
    console.log('✅ Updated subView in b5');
}

// E: Non-destructive handleSubVideoUpload
const oldUploadRegex = /function handleSubVideoUpload\(event\) \{[\s\S]*?startStreamingVideoTranscription\(file\);\s*\}/;
const newUploadFunc = `function handleSubVideoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            currentLoadedVideoFile = file;
            currentTranscribeVideoFile = file;

            let activeProj = getActiveProject();
            if (activeProj) {
                activeProj.videoFile = file;
                try {
                    activeProj.videoUrl = URL.createObjectURL(file);
                } catch(e) {}
            }

            collapseSidebarForSubtitling();

            const player = document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer');
            const placeholder = document.getElementById('subVideoPlaceholderArea');
            const playerArea = document.getElementById('subVideoPlayerArea');
            const videoPanel = document.getElementById('subVideoPanel');

            if (videoPanel) {
                videoPanel.classList.remove('hidden');
                videoPanel.style.display = 'flex';
            }

            const videoUrl = (activeProj && activeProj.videoUrl) ? activeProj.videoUrl : URL.createObjectURL(file);
            if (player) {
                player.src = videoUrl;
                player.style.aspectRatio = '16/9';
                player.currentTime = 0;
                player.load();
                player.play().then(() => player.pause()).catch(() => {});
                initSubVideoEventListeners();
            }

            if (placeholder) {
                placeholder.classList.add('hidden');
                placeholder.style.display = 'none';
            }
            if (playerArea) {
                playerArea.classList.remove('hidden');
                playerArea.style.display = 'flex';
            }

            applySubtitleStyles();

            if (!activeProj) {
                activeProj = {
                    id: 'proj-sub-' + Date.now(),
                    name: file.name.replace(/\\.[^/.]+$/, ''),
                    type: 'subtitling',
                    sourceLang: 'en',
                    targetLang: 'tr',
                    documents: [],
                    videoFile: file,
                    videoUrl: videoUrl
                };
                if (typeof appState !== 'undefined') {
                    if (!appState.projects) appState.projects = [];
                    appState.projects.push(activeProj);
                    appState.activeProjectId = activeProj.id;
                }
            } else if (activeProj.type !== 'subtitling') {
                activeProj.type = 'subtitling';
                updateActiveProjectView();
            }

            let doc = getActiveDoc();
            const srtDocName = \`\${file.name.replace(/\\.[^/.]+$/, '')}.srt\`;

            // KRİTİK KORUMA (Kullanıcı Talebi: "Daha önceden başlanan video dosyası projeye tekrar girince kapanıyor ve tekrar videoyu yüklemeye çalışırsak tekrar segmente ediyor.")
            // Eğer projede zaten segmentler varsa, video yüklendiğinde mevcut segmentleri ASLA SİLME ve TEKRAR SEGMENTE ETME!
            if (doc && doc.segments && doc.segments.length > 0) {
                renderActiveDocument();
                updateProgressStats();
                showToast(\`🎬 "\${file.name}" videoya bağlandı. Mevcut \${doc.segments.length} segment korundu.\`);
                return;
            }

            // Eğer hiç segment yoksa yeni altyazı belgesi başlat ve transkripsiyonu çalıştır
            if (!doc) {
                doc = {
                    id: 'doc-sub-' + Date.now(),
                    name: srtDocName,
                    originalFormat: 'srt',
                    segments: [],
                    currentPage: 1,
                    totalPages: 1
                };
                if (activeProj) {
                    activeProj.documents = [doc];
                    appState.documents = activeProj.documents;
                    appState.activeDocId = doc.id;
                }
            } else {
                doc.name = srtDocName;
                doc.segments = [];
                doc.currentPage = 1;
                doc.totalPages = 1;
            }

            renderActiveDocument();
            updateProgressStats();
            showToast(\`🎬 "\${file.name}" yüklendi. Konuşmalar otomatik çözümleniyor...\`);
            startStreamingVideoTranscription(file);
        }`;

if (oldUploadRegex.test(b5)) {
    b5 = b5.replace(oldUploadRegex, newUploadFunc);
    console.log('✅ Updated handleSubVideoUpload in b5');
}

// F: Keyboard Shortcuts: Disable Shift + ? from opening modal
b5 = b5.replace("if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {", "if (e.key === 'F1') {");

// G: Dark Mode Alerts & Badge Contrast in b5
// Subtitle Constraint Alert
b5 = b5.replace(
    '<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[10.5px] font-bold mt-1">\n                                <span class="material-symbols-outlined text-[15px] text-rose-600 shrink-0">highlight_off</span>',
    '<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[10.5px] font-bold mt-1">\n                                <span class="material-symbols-outlined text-[15px] text-rose-600 dark:text-rose-400 shrink-0">highlight_off</span>'
);
b5 = b5.replace(
    '<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[10.5px] font-bold mt-1">\r\n                                <span class="material-symbols-outlined text-[15px] text-rose-600 shrink-0">highlight_off</span>',
    '<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[10.5px] font-bold mt-1">\r\n                                <span class="material-symbols-outlined text-[15px] text-rose-600 dark:text-rose-400 shrink-0">highlight_off</span>'
);

// Term Violations Alert
b5 = b5.replace(
    '<div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-900 text-xs animate-fadeIn">\n                            <span class="material-symbols-outlined text-amber-600 text-[18px] shrink-0">warning</span>',
    '<div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs animate-fadeIn">\n                            <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px] shrink-0">warning</span>'
);
b5 = b5.replace(
    '<div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-900 text-xs animate-fadeIn">\r\n                            <span class="material-symbols-outlined text-amber-600 text-[18px] shrink-0">warning</span>',
    '<div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs animate-fadeIn">\r\n                            <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px] shrink-0">warning</span>'
);
b5 = b5.replace(
    'decoration-amber-500',
    'decoration-amber-500 dark:decoration-amber-400'
);

// Live update metrics alert
b5 = b5.replace(
    '<div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold mt-1.5 animate-fadeIn">\n                            <span class="material-symbols-outlined text-[16px] text-rose-600 shrink-0">highlight_off</span>',
    '<div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-bold mt-1.5 animate-fadeIn">\n                            <span class="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400 shrink-0">highlight_off</span>'
);
b5 = b5.replace(
    '<div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold mt-1.5 animate-fadeIn">\r\n                            <span class="material-symbols-outlined text-[16px] text-rose-600 shrink-0">highlight_off</span>',
    '<div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-bold mt-1.5 animate-fadeIn">\r\n                            <span class="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400 shrink-0">highlight_off</span>'
);

// Live update CPL & CPS classes
b5 = b5.replace(
    "line1El.className = m.isCpl1Exceeded\n                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'\n                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';",
    "line1El.className = m.isCpl1Exceeded\n                    ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'\n                    : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium';"
);
b5 = b5.replace(
    "line1El.className = m.isCpl1Exceeded\r\n                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'\r\n                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';",
    "line1El.className = m.isCpl1Exceeded\r\n                    ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'\r\n                    : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium';"
);

b5 = b5.replace(
    "line2El.className = m.isCpl2Exceeded\n                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'\n                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';",
    "line2El.className = m.isCpl2Exceeded\n                    ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'\n                    : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium';"
);
b5 = b5.replace(
    "line2El.className = m.isCpl2Exceeded\r\n                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'\r\n                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';",
    "line2El.className = m.isCpl2Exceeded\r\n                    ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'\r\n                    : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium';"
);

// Blue & White buttons in segment header:
// Böl button
const oldBolSnippet = '<button type="button" onclick="splitSubtitleSegment(${seg.id})" class="px-2 py-0.5 text-[10.5px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 rounded border border-sky-300 dark:border-sky-800 flex items-center gap-1 cursor-pointer shadow-2xs" title="Cümleyi imleç noktasından ikiye böl">\r\n                                    <span class="material-symbols-outlined text-[13px]">content_cut</span>\r\n                                    <span>Böl</span>\r\n                                </button>';
const oldBolSnippetLf = '<button type="button" onclick="splitSubtitleSegment(${seg.id})" class="px-2 py-0.5 text-[10.5px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 rounded border border-sky-300 dark:border-sky-800 flex items-center gap-1 cursor-pointer shadow-2xs" title="Cümleyi imleç noktasından ikiye böl">\n                                    <span class="material-symbols-outlined text-[13px]">content_cut</span>\n                                    <span>Böl</span>\n                                </button>';

const newBolSnippet = `<button type="button" onclick="splitSubtitleSegment(\${seg.id})" class="px-2 py-0.5 text-[10.5px] font-sans font-medium \${(typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId === seg.id) ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white hover:bg-blue-50 text-blue-700 dark:bg-neutral-800 dark:text-blue-400 border border-blue-300 dark:border-neutral-700'} rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs" title="Cümleyi imleç noktasından ikiye böl">
                                    <span class="material-symbols-outlined text-[13px] text-blue-600 dark:text-blue-400">content_cut</span>
                                    <span>Böl</span>
                                </button>
                                <button type="button" onclick="handleMergeButtonClick(\${seg.id}, event)" class="px-2 py-0.5 text-[10.5px] font-sans font-medium bg-white hover:bg-blue-50 text-blue-700 dark:bg-neutral-800 dark:text-blue-400 border border-blue-300 dark:border-neutral-700 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs" title="Bu segmenti sonrakiyle birleştir (Kısayol: Ctrl + M / Ctrl + Shift + M / Ctrl + J)">
                                    <span class="material-symbols-outlined text-[13px] text-blue-600 dark:text-blue-400">call_merge</span>
                                    <span>\${(typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId === seg.id) ? '1. Seçildi' : 'Birleştir'}</span>
                                </button>`;

if (b5.includes(oldBolSnippet)) {
    b5 = b5.replace(oldBolSnippet, newBolSnippet);
} else if (b5.includes(oldBolSnippetLf)) {
    b5 = b5.replace(oldBolSnippetLf, newBolSnippet);
}

// Clean up CPS and Duration in buildSingleSegmentCard
b5 = b5.replace(
    "let cpsBadgeClass = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';",
    "let cpsBadgeClass = 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700';"
);

// Assemble complete HTML
const fullHtml = part1 + b5 + part3;

console.log('Final fullHtml length:', fullHtml.length);

const targetFiles = [
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/legacy_index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html.bak'
];

targetFiles.forEach(file => {
    fs.writeFileSync(file, fullHtml, 'utf8');
    console.log(`Saved ${file}`);
});

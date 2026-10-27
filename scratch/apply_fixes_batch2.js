const fs = require('fs');
const path = require('path');

const targetFiles = [
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/legacy_index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html.bak'
];

targetFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.warn(`File does not exist: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const origLen = content.length;

    // 1. SHORTCUT: Remove Shift + ? trigger for shortcuts modal
    // Old: if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
    content = content.replace(
        "if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {",
        "if (e.key === 'F1') {"
    );

    // 2. LIGHT MODE BORDERS: Make separation lines between bars more prominent (border-slate-300)
    // A: Header bottom border
    content = content.replace(
        '<header id="fluentHeader"\n            class="fluent-header h-12 border-b border-sky-100 flex items-center justify-between px-4 z-40 select-none">',
        '<header id="fluentHeader"\n            class="fluent-header h-12 border-b border-slate-300 dark:border-neutral-800 flex items-center justify-between px-4 z-40 select-none">'
    );
    // B: Left sidebar border
    content = content.replace(
        '<aside id="sidebarNav"\n        class="w-14 hover:w-60 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#000000] flex flex-col justify-between py-3 z-30 shrink-0 select-none shadow-xs group/sidebar overflow-x-hidden overflow-y-auto">',
        '<aside id="sidebarNav"\n        class="w-14 hover:w-60 transition-all duration-300 ease-in-out border-r border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#000000] flex flex-col justify-between py-3 z-30 shrink-0 select-none shadow-xs group/sidebar overflow-x-hidden overflow-y-auto">'
    );
    // C: Main project header container border
    content = content.replace(
        '<div id="smartcatMainHeader"\n                    class="flex flex-col border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#000000] shrink-0 select-none z-20">',
        '<div id="smartcatMainHeader"\n                    class="flex flex-col border-b border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#000000] shrink-0 select-none z-20">'
    );
    // D: Row 1 of project header
    content = content.replace(
        'class="h-11 px-4 flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 gap-3 text-xs">',
        'class="h-11 px-4 flex items-center justify-between border-b border-slate-300 dark:border-neutral-900 gap-3 text-xs">'
    );
    // E: Row 2 of project header (toolbar ribbon)
    content = content.replace(
        'class="h-10 px-4 flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 gap-2">',
        'class="h-10 px-4 flex items-center justify-between border-b border-slate-300 dark:border-neutral-900 gap-2">'
    );
    // F: Row 3 of project header (filter ribbon)
    content = content.replace(
        'class="h-10 px-4 flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 gap-3 text-xs">',
        'class="h-10 px-4 flex items-center justify-between border-b border-slate-300 dark:border-neutral-900 gap-3 text-xs">'
    );
    // G: Right video panel border
    content = content.replace(
        '<div id="subVideoPanel"\n                        class="hidden w-[420px] lg:w-[480px] xl:w-[560px] border-l border-slate-200 dark:border-neutral-800 bg-slate-950 text-white flex flex-col shrink-0 select-none shadow-2xl z-20 overflow-hidden">',
        '<div id="subVideoPanel"\n                        class="hidden w-[420px] lg:w-[480px] xl:w-[560px] border-l border-slate-300 dark:border-neutral-800 bg-slate-950 text-white flex flex-col shrink-0 select-none shadow-2xl z-20 overflow-hidden">'
    );
    // H: Pagination bar container border
    content = content.replace(
        '<div id="paginationBarContainer"\n                    class="h-14 px-6 border-t border-sky-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 select-none">',
        '<div id="paginationBarContainer"\n                    class="h-14 px-6 border-t border-slate-300 dark:border-neutral-800 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 select-none">'
    );

    // 3. DELETE NETFLIX SUBTITLE STANDARD ROW (Kullanıcı Talebi: "Netflix altyazı standardı olan satırı da sil lütfen.")
    const oldWbBlockRegex = /<!-- ALTYAZI ÇEVİRİ MOTORU VE KOMPAKT KONTROL BARI \(SUBTITLING MODULE\) -->[\s\S]*?<div id="subtitlingWorkbench"[\s\S]*?<!-- Gizli Monitör DOM Elemanları \(JS ve Test Uyumluluğu İçin\) -->\s*<div class="hidden" aria-hidden="true" style="display:none;">[\s\S]*?<\/div>\s*<\/div>/;
    const newHiddenWbBlock = `<!-- Gizli Monitör DOM Elemanları (JS ve Test Uyumluluğu İçin - Netflix standardı satırı silindi) -->
                <div id="subtitlingWorkbench" class="hidden" aria-hidden="true" style="display:none;">
                    <span id="subMonitorTimecode">00:00:00,000 ➔ 00:00:03,000</span>
                    <span id="subMonitorDuration">3.0s</span>
                    <span id="subMonitorCpsBadge">14.2 CPS (İdeal)</span>
                    <div id="subMonitorLiveText">Altyazı önizlemesi</div>
                </div>`;

    if (oldWbBlockRegex.test(content)) {
        content = content.replace(oldWbBlockRegex, newHiddenWbBlock);
        console.log(`[${path.basename(filePath)}] subtitlingWorkbench row deleted cleanly.`);
    } else {
        console.warn(`[${path.basename(filePath)}] subtitlingWorkbench regex match FAILED.`);
    }

    // 4. VIDEO PERSISTENCE & PREVENTING RE-SEGMENTATION
    // A: In updateActiveProjectView(): restore video player when returning to subtitling project
    const oldUpdateViewSubRegex = /if \(type === 'subtitling'\) \{[\s\S]*?if \(subVideoPanel\) subVideoPanel\.classList\.remove\('hidden'\);[\s\S]*?initSubVideoEventListeners\(\);/;
    const newUpdateViewSub = `if (type === 'subtitling') {
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

    if (oldUpdateViewSubRegex.test(content)) {
        content = content.replace(oldUpdateViewSubRegex, newUpdateViewSub);
        console.log(`[${path.basename(filePath)}] updateActiveProjectView updated with video persistence.`);
    } else {
        console.warn(`[${path.basename(filePath)}] updateActiveProjectView regex match FAILED.`);
    }

    // B: In handleSubVideoUpload(event): PREVENT RE-SEGMENTING IF SEGMENTS EXIST
    const oldHandleSubUploadRegex = /function handleSubVideoUpload\(event\) \{[\s\S]*?startStreamingVideoTranscription\(file\);\s*\}/;
    const newHandleSubUpload = `function handleSubVideoUpload(event) {
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

    if (oldHandleSubUploadRegex.test(content)) {
        content = content.replace(oldHandleSubUploadRegex, newHandleSubUpload);
        console.log(`[${path.basename(filePath)}] handleSubVideoUpload updated with non-destructive loading.`);
    } else {
        console.warn(`[${path.basename(filePath)}] handleSubVideoUpload regex match FAILED.`);
    }

    // 5. DARK MODE SEGMENTATION ALERTS & BADGES CONTRAST (Kullanıcı Talebi: "Dark mode da segmentatiın kısımlarındaki uyarılar renklerden dolayı görünmüyor temaya uygun hale getşr")
    // A: In buildSingleSegmentCard: subtitleConstraintAlertHtml
    content = content.replace(
        '<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[10.5px] font-bold mt-1">\n                                <span class="material-symbols-outlined text-[15px] text-rose-600 shrink-0">highlight_off</span>',
        '<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[10.5px] font-bold mt-1">\n                                <span class="material-symbols-outlined text-[15px] text-rose-600 dark:text-rose-400 shrink-0">highlight_off</span>'
    );

    // B: In buildSingleSegmentCard: termViolationsHtml
    content = content.replace(
        '<div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-900 text-xs animate-fadeIn">\n                            <span class="material-symbols-outlined text-amber-600 text-[18px] shrink-0">warning</span>',
        '<div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs animate-fadeIn">\n                            <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px] shrink-0">warning</span>'
    );
    content = content.replace(
        '${termViolations.map(v => `<span class="font-bold underline decoration-amber-500">"${escapeHtml(v.source)}" ➔ "${escapeHtml(v.target)}"</span>`).join(\', \')}',
        '${termViolations.map(v => `<span class="font-bold underline decoration-amber-500 dark:decoration-amber-400">"${escapeHtml(v.source)}" ➔ "${escapeHtml(v.target)}"</span>`).join(\', \')}'
    );

    // C: In updateLiveSegmentSubtitleMetrics: live alert box
    content = content.replace(
        '<div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold mt-1.5 animate-fadeIn">\n                            <span class="material-symbols-outlined text-[16px] text-rose-600 shrink-0">highlight_off</span>',
        '<div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-bold mt-1.5 animate-fadeIn">\n                            <span class="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400 shrink-0">highlight_off</span>'
    );

    // D: In updateLiveSegmentSubtitleMetrics: CPL exceeded classes
    content = content.replace(
        "line1El.className = m.isCpl1Exceeded\n                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'\n                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';",
        "line1El.className = m.isCpl1Exceeded\n                    ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'\n                    : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium';"
    );
    content = content.replace(
        "line2El.className = m.isCpl2Exceeded\n                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'\n                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';",
        "line2El.className = m.isCpl2Exceeded\n                    ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'\n                    : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium';"
    );

    // E: In updateLiveSegmentSubtitleMetrics: CPS speed badge in live update
    content = content.replace(
        "let cpsClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';\n                if (m.cpsStatus === 'fast') cpsClass = 'text-amber-800 bg-amber-50 border-amber-300';\n                else if (m.cpsStatus === 'over') cpsClass = 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse';",
        "let cpsClass = 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700';\n                if (m.cpsStatus === 'fast') cpsClass = 'text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700';\n                else if (m.cpsStatus === 'over') cpsClass = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 animate-pulse';"
    );

    // F: In buildSingleSegmentCard: CPL lines in initial card render
    content = content.replace(
        "<span id=\"subLine1Counter-${seg.id}\" class=\"${subMetrics.isCpl1Exceeded ? 'text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium'}\">",
        "<span id=\"subLine1Counter-${seg.id}\" class=\"${subMetrics.isCpl1Exceeded ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]' : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium'}\">"
    );
    content = content.replace(
        "<span id=\"subLine2Counter-${seg.id}\" class=\"${subMetrics.isCpl2Exceeded ? 'text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium'}\">",
        "<span id=\"subLine2Counter-${seg.id}\" class=\"${subMetrics.isCpl2Exceeded ? 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]' : 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[10px] font-medium'}\">"
    );

    // Save file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[${path.basename(filePath)}] Batch 2 applied. Original: ${origLen}, New: ${content.length}`);
});
console.log("Batch 2 completed successfully.");

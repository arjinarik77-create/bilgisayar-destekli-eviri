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
    const originalLen = content.length;

    // 1. REVISE subtitlingWorkbench (DE-AI)
    const oldWbRegex = /<!-- ALTYAZI ÇEVİRİ MOTORU VE KOMPAKT KONTROL BARI \(SUBTITLING MODULE\) -->[\s\S]*?<div id="subtitlingWorkbench"[\s\S]*?<!-- Gizli Monitör DOM Elemanları/;
    const newWb = `<!-- ALTYAZI ÇEVİRİ MOTORU VE KOMPAKT KONTROL BARI (SUBTITLING MODULE) -->
                <div id="subtitlingWorkbench"
                    class="hidden px-5 py-2 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none font-sans">
                    <div class="flex items-center gap-2">
                        <span
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-800 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 shadow-xs font-sans">
                            <span class="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">subtitles</span>
                            <span>Netflix & EBU-TT Altyazı Standartları</span>
                        </span>
                        <div class="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 font-sans">
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-medium">Max 2 Satır</span>
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-medium">Max 42 CPL</span>
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-medium">17 CPS İdeal</span>
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-medium">1s - 7s Blok</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="document.getElementById('subVideoFileInput').click()"
                            class="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 flex items-center gap-1.5 shadow-xs cursor-pointer font-sans transition-colors"
                            title="Yerel video dosyasını oynatıcıya yükle">
                            <span class="material-symbols-outlined text-[15px]">videocam</span>
                            <span>Video Yükle</span>
                        </button>
                        <button onclick="downloadCleanOutput('srt')"
                            class="px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 dark:text-blue-400 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-neutral-700 border border-blue-300 dark:border-neutral-700 flex items-center gap-1.5 shadow-xs cursor-pointer font-sans transition-colors"
                            title="Hazır altyazıyı .SRT olarak indir">
                            <span class="material-symbols-outlined text-[15px]">download</span>
                            <span>.SRT İndir</span>
                        </button>
                    </div>

                    <!-- Gizli Monitör DOM Elemanları`;

    if (oldWbRegex.test(content)) {
        content = content.replace(oldWbRegex, newWb);
        console.log(`[${path.basename(filePath)}] subtitlingWorkbench replaced successfully.`);
    } else {
        console.warn(`[${path.basename(filePath)}] subtitlingWorkbench regex match FAILED.`);
    }

    // 2. REVISE subStreamingStatusBanner (DE-AI)
    const oldBannerRegex = /<!-- Canlı Akış Transkripsiyon Bilgi ve İlerleme Paneli \(Eski Progress Line & Bilgilendirme\) -->[\s\S]*?<div id="subStreamingStatusBanner"[\s\S]*?<span>Bu biraz zaman alabilir\.\.\.<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/;
    const newBanner = `<!-- Canlı Akış Transkripsiyon Bilgi ve İlerleme Paneli (Eski Progress Line & Bilgilendirme) -->
                    <div id="subStreamingStatusBanner"
                        class="hidden p-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shadow-xl transition-all font-sans">
                        <div class="flex items-center gap-3">
                            <span class="relative flex h-3.5 w-3.5 shrink-0">
                                <span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                            </span>
                            <div class="flex flex-col gap-0.5">
                                <div class="flex items-center gap-2">
                                    <span class="font-semibold text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm font-sans">
                                        <span
                                            class="material-symbols-outlined text-[17px] text-blue-400">record_voice_over</span>
                                        <span id="subStreamingStatusTitle">Videonun Sesi Dönüştürülüyor & Transkript Çıkarılıyor...</span>
                                    </span>
                                    <span id="subStreamingProgressBadge"
                                        class="text-xs font-sans font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                                        İşleniyor...
                                    </span>
                                </div>
                                <span id="subStreamingStatusSubtitle" class="text-xs text-slate-400 font-sans">Ses kanalı taranıyor ve zaman kodlu konuşma transkripti çıkarılıyor...</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <div class="flex items-center gap-2.5 w-full md:w-auto">
                                <div class="w-48 sm:w-64 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 shadow-inner relative">
                                    <div id="subStreamingProgressBar"
                                        class="bg-blue-600 h-2 w-1/4 rounded-full transition-all duration-300">
                                    </div>
                                </div>
                                <button type="button" onclick="stopStreamingTranscription()"
                                    class="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded cursor-pointer transition-colors shadow-xs font-sans">
                                    Durdur
                                </button>
                            </div>
                            <!-- KULLANICI TALEBİ: "altına da bu biraz zaman alabilir yazılması lazım" -->
                            <div class="text-xs text-slate-400 font-sans font-normal flex items-center gap-1 self-start md:self-end">
                                <span class="material-symbols-outlined text-[14px] text-blue-400">hourglass_empty</span>
                                <span>Bu biraz zaman alabilir...</span>
                            </div>
                        </div>
                    </div>`;

    if (oldBannerRegex.test(content)) {
        content = content.replace(oldBannerRegex, newBanner);
        console.log(`[${path.basename(filePath)}] subStreamingStatusBanner replaced successfully.`);
    } else {
        console.warn(`[${path.basename(filePath)}] subStreamingStatusBanner regex match FAILED.`);
    }

    // 3. REVISE subVideoPanel Header & Footer (DE-AI)
    const oldVpHeaderRegex = /<!-- Panel Üst Barı -->[\s\S]*?<div class="p-2\.5 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">[\s\S]*?title="Altyazı çeviri modundan çık">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;
    const newVpHeader = `<!-- Panel Üst Barı -->
                        <div class="p-2.5 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between font-sans">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-blue-400 text-[18px]">movie</span>
                                <span class="text-xs font-semibold text-white tracking-wide font-sans">Video & Altyazı Monitörü</span>
                            </div>
                            <div class="flex items-center gap-1.5 font-sans">
                                <button onclick="openSubtitleStyleModal()"
                                    class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
                                    title="Altyazı yazı tipi, boyutu, renkleri ve hazır şablonları özelleştir">
                                    <span class="material-symbols-outlined text-[15px] text-blue-400">palette</span>
                                    <span>Altyazı Stili & Şablonları</span>
                                </button>
                                <button onclick="document.getElementById('subVideoFileInput').click()"
                                    class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                                    title="Yerel Video Yükle veya Değiştir">
                                    <span class="material-symbols-outlined text-[14px] text-blue-400">upload_file</span>
                                    <span>Video Seç</span>
                                </button>
                                <div class="relative inline-block text-left" id="subQuickExportDropdownWrap">
                                    <button type="button" onclick="const m=document.getElementById('subQuickExportMenu'); if(m) m.classList.toggle('hidden');"
                                        class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                                        title="Altyazıyı format seçerek dışa aktar (.SRT, .VTT, Netflix TTML, .ASS)">
                                        <span class="material-symbols-outlined text-[14px] text-blue-400">download</span>
                                        <span>Dışa Aktar</span>
                                        <span class="material-symbols-outlined text-[12px]">expand_more</span>
                                    </button>
                                    <div id="subQuickExportMenu" class="hidden absolute right-0 mt-1 w-40 bg-slate-900 border border-slate-700 rounded-md shadow-2xl z-50 py-1 text-xs font-sans select-none">
                                        <button onclick="downloadCleanOutput('srt'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between cursor-pointer font-sans">
                                            <span>.SRT</span>
                                            <span class="text-[10px] text-slate-400">SubRip</span>
                                        </button>
                                        <button onclick="downloadCleanOutput('vtt'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between cursor-pointer font-sans">
                                            <span>.VTT</span>
                                            <span class="text-[10px] text-slate-400">WebVTT</span>
                                        </button>
                                        <button onclick="downloadCleanOutput('ttml'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between cursor-pointer font-sans">
                                            <span class="text-blue-300 font-medium">Netflix TTML</span>
                                            <span class="text-[10px] text-slate-400">IMSC 1.1</span>
                                        </button>
                                        <button onclick="downloadCleanOutput('ass'); document.getElementById('subQuickExportMenu').classList.add('hidden');" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between cursor-pointer font-sans">
                                            <span class="text-slate-200 font-medium">.ASS / SSA</span>
                                            <span class="text-[10px] text-slate-400">{\\an8}</span>
                                        </button>
                                    </div>
                                </div>
                                <button onclick="exitSubtitlingMode()"
                                    class="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center cursor-pointer font-sans"
                                    title="Altyazı çeviri modundan çık">
                                    <span class="material-symbols-outlined text-[15px]">close</span>
                                </button>
                            </div>
                        </div>`;

    if (oldVpHeaderRegex.test(content)) {
        content = content.replace(oldVpHeaderRegex, newVpHeader);
        console.log(`[${path.basename(filePath)}] subVideoPanel Header replaced successfully.`);
    } else {
        console.warn(`[${path.basename(filePath)}] subVideoPanel Header regex match FAILED.`);
    }

    // Video Panel Footer Status
    const oldVpFooterRegex = /<!-- Sade Alt Durum Şeridi -->[\s\S]*?<div class="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">[\s\S]*?Canlı Senkron<\/span>\s*<\/div>/;
    const newVpFooter = `<!-- Sade Alt Durum Şeridi -->
                            <div class="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-sans text-slate-300">
                                <div class="flex items-center gap-2 truncate font-sans">
                                    <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"></span>
                                    <span id="subVideoTimecodeDisplay" class="font-medium text-slate-200">00:00:00,000</span>
                                    <span class="text-slate-600">|</span>
                                    <span id="subVideoActiveSegDisplay" class="truncate text-slate-300">Segment Seçilmedi</span>
                                </div>
                                <span class="text-[10px] font-sans text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">Canlı Senkron</span>
                            </div>`;

    if (oldVpFooterRegex.test(content)) {
        content = content.replace(oldVpFooterRegex, newVpFooter);
        console.log(`[${path.basename(filePath)}] subVideoPanel Footer replaced successfully.`);
    } else {
        console.warn(`[${path.basename(filePath)}] subVideoPanel Footer regex match FAILED.`);
    }

    // 4. REVISE Table Header Labels (DE-AI font-mono -> font-sans)
    content = content.replace(
        '<span class="text-[10px] font-mono font-normal text-slate-400 dark:text-neutral-500">Orijinal</span>',
        '<span class="text-[10px] font-sans font-normal text-slate-400 dark:text-neutral-500">Orijinal</span>'
    );
    content = content.replace(
        '<span\n                                    class="text-[10px] font-mono font-normal text-slate-400 dark:text-neutral-500">Orijinal</span>',
        '<span class="text-[10px] font-sans font-normal text-slate-400 dark:text-neutral-500">Orijinal</span>'
    );
    content = content.replace(
        '<span class="text-[10px] font-mono font-normal text-slate-400 dark:text-neutral-500">DeepL / Gemini AI</span>',
        '<span class="text-[10px] font-sans font-normal text-slate-400 dark:text-neutral-500">DeepL / Gemini AI</span>'
    );
    content = content.replace(
        '<span\n                                    class="text-[10px] font-mono font-normal text-slate-400 dark:text-neutral-500">DeepL\n                                    / Gemini AI</span>',
        '<span class="text-[10px] font-sans font-normal text-slate-400 dark:text-neutral-500">DeepL / Gemini AI</span>'
    );

    // 5. REVISE Top Navbar Badges (DE-AI)
    content = content.replace(
        'class="text-[9px] font-mono font-bold bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded border border-sky-200">CAT\n                            TOOL</span>',
        'class="text-[9px] font-sans font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-300">CAT TOOL</span>'
    );
    content = content.replace(
        'class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold"',
        'class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 text-xs font-sans font-medium"'
    );
    content = content.replace(
        'class="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">?</span>',
        'class="text-[9px] font-sans text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-300">?</span>'
    );

    // 6. REVISE buildSingleSegmentCard: CPS Badge, Duration Badge, TM and Status Badges
    // A: CPS Badges in buildSingleSegmentCard
    const oldCpsLogicRegex = /let cpsBadgeClass = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950\/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';[\s\S]*?let cpsLabel = subMetrics\.cpsLabel \|\| 'İdeal';[\s\S]*?if \(subMetrics\.cpsStatus === 'fast'\) \{[\s\S]*?\} else if \(subMetrics\.cpsStatus === 'over'\) \{[\s\S]*?\}/;
    const newCpsLogic = `let cpsBadgeClass = 'text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700';
                let cpsLabel = subMetrics.cpsLabel || 'İdeal';
                if (subMetrics.cpsStatus === 'fast') {
                    cpsBadgeClass = 'text-slate-700 bg-slate-100 border-slate-300 dark:bg-neutral-800 dark:text-slate-300 dark:border-neutral-700';
                } else if (subMetrics.cpsStatus === 'over') {
                    cpsBadgeClass = 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse';
                }`;

    if (oldCpsLogicRegex.test(content)) {
        content = content.replace(oldCpsLogicRegex, newCpsLogic);
        console.log(`[${path.basename(filePath)}] CPS badge logic revised to clean enterprise neutral.`);
    }

    // B: Duration Label Badge in buildSingleSegmentCard
    content = content.replace(
        `<span id="subDurationLabel-\${seg.id}" class="text-[10px] font-sans font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">`,
        `<span id="subDurationLabel-\${seg.id}" class="text-[10px] font-sans font-medium text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700">`
    );

    // C: Status Badges in buildSingleSegmentCard (remove font-mono)
    content = content.replace(
        `statusBadgeHtml = \`<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">L2 Onaylı</span>\`;`,
        `statusBadgeHtml = \`<span class="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-100 text-slate-800 border border-slate-300">L2 Onaylı</span>\`;`
    );
    content = content.replace(
        `statusBadgeHtml = \`<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300">L1 Çevrildi</span>\`;`,
        `statusBadgeHtml = \`<span class="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-100 text-slate-800 border border-slate-300">L1 Çevrildi</span>\`;`
    );

    // D: TM Match Badges in buildSingleSegmentCard
    const oldTmBadgeBlock = content.indexOf('if (tmMatch.similarity === 102 || tmMatch.isDoubleContext) {');
    if (oldTmBadgeBlock !== -1) {
        const endTmBadgeBlock = content.indexOf('// ARAYÜZ ENTEGRASYONU: "BELLEKTEN BENZER CÜMLE', oldTmBadgeBlock);
        if (endTmBadgeBlock !== -1) {
            const newTmBadgeSection = `if (tmMatch.similarity === 102 || tmMatch.isDoubleContext) {
                    tmBadgeHtml = \`
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-sans bg-slate-100 text-blue-800 border border-slate-300 dark:bg-neutral-800 dark:text-blue-300 dark:border-neutral-700" title="102% In-Context Exact Match">
                                <span class="material-symbols-outlined text-[13px] text-blue-600">verified</span>
                                <span>%102 ICE Match</span>
                            </span>
                        \`;
                } else if (tmMatch.similarity === 101 || tmMatch.isIce) {
                    tmBadgeHtml = \`
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-sans bg-slate-100 text-blue-800 border border-slate-300 dark:bg-neutral-800 dark:text-blue-300 dark:border-neutral-700" title="101% In-Context Match">
                                <span class="material-symbols-outlined text-[13px] text-blue-600">verified</span>
                                <span>%101 ICE Match</span>
                            </span>
                        \`;
                } else if (tmMatch.isExact || tmMatch.similarity === 100) {
                    tmBadgeHtml = \`
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-sans bg-slate-100 text-blue-800 border border-slate-300 dark:bg-neutral-800 dark:text-blue-300 dark:border-neutral-700">
                                <span class="material-symbols-outlined text-[13px] text-blue-600">check_circle</span>
                                <span>%100 Exact Match</span>
                            </span>
                        \`;
                } else if (tmMatch.isFuzzy || (tmMatch.similarity >= 50 && tmMatch.similarity < 100)) {
                    tmBadgeHtml = \`
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-sans bg-slate-100 text-slate-700 border border-slate-300 dark:bg-neutral-800 dark:text-slate-300 dark:border-neutral-700">
                                <span class="material-symbols-outlined text-[12px] text-slate-500">history</span>
                                <span>%\${tmMatch.similarity} Fuzzy Match</span>
                            </span>
                        \`;
                }
                `;
            content = content.substring(0, oldTmBadgeBlock) + newTmBadgeSection + content.substring(endTmBadgeBlock);
            console.log(`[${path.basename(filePath)}] tmBadgeHtml revised.`);
        }
    }

    // E: Terms Badges in buildSingleSegmentCard
    content = content.replace(
        `tbBadgeHtml = \`\n                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-sky-800 border border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800 shadow-2xs" title="\${matchedTerms.length} Terim Tabanı (TB) Eşleşmesi Tespit Edildi">\n                        <span class="material-symbols-outlined text-[12px] text-sky-600">bookmark</span>\n                        <span>\${matchedTerms.length} Eşleşen Terim</span>\n                    </span>\n                \`;`,
        `tbBadgeHtml = \`\n                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-sans bg-slate-100 text-slate-700 border border-slate-300 dark:bg-neutral-800 dark:text-slate-300 dark:border-neutral-700" title="\${matchedTerms.length} Terim Tabanı (TB) Eşleşmesi Tespit Edildi">\n                        <span class="material-symbols-outlined text-[12px] text-blue-600">bookmark</span>\n                        <span>\${matchedTerms.length} Eşleşen Terim</span>\n                    </span>\n                \`;`
    );

    // Save file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[${path.basename(filePath)}] Saved. Original: ${originalLen}, New: ${content.length}`);
});
console.log("De-AI replacement script completed.");

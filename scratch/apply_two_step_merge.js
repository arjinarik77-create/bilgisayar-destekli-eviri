const fs = require('fs');

function applyTwoStepMergeAndProjectBannerFix(filePath) {
    console.log(`Applying 2-step merge & project switch banner fix to ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. FIX BANNER REMAINING ON PROJECT SWITCH in updateActiveProjectView
    const oldStreamingBannerBlock = `            const streamingBanner = document.getElementById('subStreamingStatusBanner');
            if (streamingBanner) {
                streamingBanner.classList.remove('hidden');
                streamingBanner.style.display = 'flex';
            }`;

    const newStreamingBannerBlock = `            // Başka projeye geçildiğinde transkripsiyon banner'ı ve bekleyen birleştirme durumunu temizle
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
            }`;

    if (content.includes(oldStreamingBannerBlock)) {
        content = content.replace(oldStreamingBannerBlock, newStreamingBannerBlock);
        console.log(`  ✅ Fixed subStreamingStatusBanner in updateActiveProjectView.`);
    }

    // Also hide streaming banner in interpreting and text branches of updateActiveProjectView
    const interpBranchOld = `if (subVideoPanel) subVideoPanel.classList.add('hidden');`;
    const interpBranchNew = `if (subVideoPanel) subVideoPanel.classList.add('hidden');
                if (streamingBanner) { streamingBanner.classList.add('hidden'); streamingBanner.style.display = 'none'; }`;
    if (content.includes(interpBranchOld) && !content.includes('if (streamingBanner) { streamingBanner.classList.add(\'hidden\'); streamingBanner.style.display = \'none\'; }')) {
        content = content.replace(interpBranchOld, interpBranchNew);
        console.log(`  ✅ Added banner hiding to interpreting & text project view.`);
    }

    // 2. ALSO HIDE BANNER IN selectProject
    const selectProjectTarget = `function selectProject(projId) {`;
    const selectProjectReplacement = `function selectProject(projId) {
            window._pendingMergeSegId = null;
            const sBanner = document.getElementById('subStreamingStatusBanner');
            if (sBanner) {
                sBanner.classList.add('hidden');
                sBanner.style.display = 'none';
            }`;
    if (content.includes(selectProjectTarget) && !content.includes('window._pendingMergeSegId = null;\n            const sBanner')) {
        content = content.replace(selectProjectTarget, selectProjectReplacement);
        console.log(`  ✅ Added banner hiding to selectProject.`);
    }

    // 3. DEFINE handleMergeButtonClick AND UPDATE mergeSegments
    const mergeEngineTarget = `// ========================================================
        // SEGMENT BİRLEŞTİRME (MERGE) VE ÇOKLU SEÇİM MOTORU (Ctrl + M / Ctrl + Shift + M / Ctrl + J)
        // ========================================================`;

    const newMergeEngine = `// ========================================================
        // 2 AŞAMALI İNTERAKTİF SEGMENT BİRLEŞTİRME (MERGE) MOTORU
        // (1. Segmenti Seç -> "2. Segmenti Seçin" Uyarısı -> 2. Segmenti Seçince Birleştir)
        // ========================================================
        window._pendingMergeSegId = null;

        function handleMergeButtonClick(segId, event) {
            if (event) {
                event.stopPropagation();
            }
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length < 2) {
                if (typeof showToast === 'function') showToast("Birleştirilecek yeterli segment yok.");
                return;
            }

            if (!window._pendingMergeSegId) {
                // 1. ADIM: İlk segmenti hafızaya al ve kullanıcıyı 2. segment için uyar
                window._pendingMergeSegId = segId;
                renderSegments();
                if (typeof showToast === 'function') {
                    showToast(\`🔗 Segment #\${segId} seçildi! Şimdi birleştirmek istediğiniz 2. segmenti seçin.\`);
                }
            } else if (window._pendingMergeSegId === segId) {
                // Aynı segmente tekrar basıldı: İptal et
                window._pendingMergeSegId = null;
                renderSegments();
                if (typeof showToast === 'function') {
                    showToast("Segment birleştirme seçimi iptal edildi.");
                }
            } else {
                // 2. ADIM: İkinci segment seçildi, iki cümleyi birleştir!
                const firstId = window._pendingMergeSegId;
                window._pendingMergeSegId = null;
                mergeSegments(firstId, segId);
            }
        }`;

    if (content.includes(mergeEngineTarget) && !content.includes('function handleMergeButtonClick(')) {
        content = content.replace(mergeEngineTarget, newMergeEngine);
        console.log(`  ✅ Added handleMergeButtonClick.`);
    }

    // 4. IN buildSingleSegmentCard: SUPPORT PENDING MERGE HIGHLIGHT & BUTTON
    const oldMergeBtnCall = `onclick="mergeSegments(\${seg.id})"`;
    const newMergeBtnCall = `onclick="handleMergeButtonClick(\${seg.id}, event)"`;
    content = content.replaceAll(oldMergeBtnCall, newMergeBtnCall);

    // Update button text & icon based on pending merge state
    const oldBtnMarkup = `<span>Birleştir</span>\n                                </button>`;
    const newBtnMarkup = `<span>\${(typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId === seg.id) ? '1. Seçildi' : 'Birleştir'}</span>\n                                </button>`;
    if (content.includes(oldBtnMarkup)) {
        content = content.replaceAll(oldBtnMarkup, newBtnMarkup);
        console.log(`  ✅ Updated Birleştir button text to reflect 1. Seçildi.`);
    }

    // Make segment card clickable to select as 2nd merge candidate
    const cardClassLine = `card.className = \`cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 \${zebraBg} hover:bg-blue-50/25\`;`;
    const newCardClassLine = `const isPendingMerge = (typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId === seg.id);
            const mergeBorderClass = isPendingMerge ? 'ring-2 ring-blue-600 bg-blue-50/60 border-l-4 border-l-blue-600 shadow-md' : '';
            card.className = \`cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 \${zebraBg} hover:bg-blue-50/25 \${mergeBorderClass}\`;
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

    if (content.includes(cardClassLine)) {
        content = content.replace(cardClassLine, newCardClassLine);
        console.log(`  ✅ Added interactive card click to merge 2nd segment.`);
    }

    // 5. UPDATE onSegmentKeydown SHORTCUT TO USE handleMergeButtonClick
    const onKeydownMergeOld = `mergeSegments(segId, segB);`;
    const onKeydownMergeNew = `handleMergeButtonClick(segId, e);`;
    content = content.replaceAll(onKeydownMergeOld, onKeydownMergeNew);

    // 6. UPDATE GLOBAL KEYDOWN SHORTCUT TO USE handleMergeButtonClick
    const globalKeydownMergeOld = `mergeSegments(idA, idB);`;
    const globalKeydownMergeNew = `handleMergeButtonClick(idA, e);`;
    content = content.replaceAll(globalKeydownMergeOld, globalKeydownMergeNew);

    // 7. ESCAPE CANCELS MERGE MODE
    const escTarget = `if (e.key === 'Escape') {`;
    const escReplacement = `if (e.key === 'Escape') {
                if (typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId) {
                    window._pendingMergeSegId = null;
                    renderSegments();
                    if (typeof showToast === 'function') showToast("Segment birleştirme iptal edildi.");
                    return;
                }`;
    if (content.includes(escTarget) && !content.includes('if (typeof window._pendingMergeSegId !== \'undefined\' && window._pendingMergeSegId) {')) {
        content = content.replace(escTarget, escReplacement);
        console.log(`  ✅ Added Escape key support to cancel pending merge.`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saved ${filePath}\n`);
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(applyTwoStepMergeAndProjectBannerFix);

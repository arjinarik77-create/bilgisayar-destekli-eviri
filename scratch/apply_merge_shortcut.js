const fs = require('fs');

function applyMergeFeature(filePath) {
    console.log(`Applying merge shortcut feature to ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. ADD mergeSegments and toggleSelectSegment FUNCTIONS
    const mergeFunctionsCode = `
        // ========================================================
        // SEGMENT BİRLEŞTİRME (MERGE) VE ÇOKLU SEÇİM MOTORU (Ctrl + M / Ctrl + Shift + M / Ctrl + J)
        // ========================================================
        if (typeof appState !== 'undefined' && !appState.selectedSegmentIds) {
            appState.selectedSegmentIds = [];
        }

        function toggleSelectSegment(segId, event) {
            if (event) {
                event.stopPropagation();
            }
            if (!appState.selectedSegmentIds) appState.selectedSegmentIds = [];
            const idx = appState.selectedSegmentIds.indexOf(segId);
            if (idx >= 0) {
                appState.selectedSegmentIds.splice(idx, 1);
            } else {
                appState.selectedSegmentIds.push(segId);
                if (appState.selectedSegmentIds.length > 2) {
                    appState.selectedSegmentIds.shift();
                }
            }

            document.querySelectorAll('.cat-segment-row').forEach(row => {
                row.classList.remove('ring-2', 'ring-purple-500', 'bg-purple-100/40');
            });

            appState.selectedSegmentIds.forEach(id => {
                const card = document.getElementById(\`segCard-\${id}\`);
                if (card) {
                    card.classList.add('ring-2', 'ring-purple-500', 'bg-purple-100/40');
                }
            });

            if (appState.selectedSegmentIds.length === 2) {
                showToast(\`💡 2 segment seçildi (#\${appState.selectedSegmentIds[0]} ve #\${appState.selectedSegmentIds[1]}). Birleştirmek için Ctrl + M tuşuna basın.\`);
            }
        }

        function mergeSegments(segIdA, segIdB) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length < 2) {
                if (typeof showToast === 'function') showToast("Birleştirilecek yeterli segment yok.");
                return false;
            }

            let idxA = doc.segments.findIndex(s => s.id === segIdA);
            if (idxA === -1) {
                const activeId = (typeof appState !== 'undefined') ? (appState.activeSegmentId || appState.activeSubtitleSegmentId || window._lastHoveredSegId) : null;
                idxA = doc.segments.findIndex(s => s.id === activeId);
            }
            if (idxA === -1) idxA = 0;

            let idxB = -1;
            if (typeof segIdB === 'number') {
                idxB = doc.segments.findIndex(s => s.id === segIdB);
            }
            if (idxB === -1 || idxB === idxA) {
                idxB = idxA + 1;
            }

            if (idxA > idxB) {
                const temp = idxA;
                idxA = idxB;
                idxB = temp;
            }

            if (idxB >= doc.segments.length) {
                if (typeof showToast === 'function') showToast("Birleştirilecek sonraki segment bulunamadı.");
                return false;
            }

            const a = doc.segments[idxA];
            const b = doc.segments[idxB];

            if (a.docx && b.docx && a.docx.p !== b.docx.p) {
                if (typeof showToast === 'function') showToast("⚠️ Farklı DOCX paragraflarındaki segmentler birleştirilemez (belge yapısı korunur).");
                return false;
            }

            if (typeof recordUndoState === 'function') recordUndoState();

            // Kaynak Metinleri Birleştir
            const aSrc = (a.source || a.sourceText || '').trim();
            const bSrc = (b.source || b.sourceText || '').trim();
            const mergedSrc = aSrc ? (bSrc ? \`\${aSrc} \${bSrc}\` : aSrc) : bSrc;
            a.source = mergedSrc;
            a.sourceText = mergedSrc;

            // Hedef Çevirileri Birleştir
            const aTgt = (a.target || a.targetText || '').trim();
            const bTgt = (b.target || b.targetText || '').trim();
            const mergedTgt = aTgt ? (bTgt ? \`\${aTgt} \${bTgt}\` : aTgt) : bTgt;
            a.target = mergedTgt;
            a.targetText = mergedTgt;

            // Altyazı Zaman Damgalarını Birleştir (Bitiş zamanı B'nin bitişi olur)
            if (b.end !== undefined || b.endTime) {
                const bEndSec = (typeof b.end === 'number') ? b.end : (typeof parseSrtTimestampToSeconds === 'function' ? parseSrtTimestampToSeconds(b.endTime || '0') : 0);
                a.end = bEndSec;
                a.endTime = b.endTime || (typeof formatSecondsToSrtTimestamp === 'function' ? formatSecondsToSrtTimestamp(bEndSec) : String(bEndSec));
                const aStartSec = (typeof a.start === 'number') ? a.start : (typeof parseSrtTimestampToSeconds === 'function' ? parseSrtTimestampToSeconds(a.startTime || '0') : 0);
                a.durationSec = Number(Math.max(0.5, bEndSec - aStartSec).toFixed(2));
            }

            if (typeof CatOps !== 'undefined' && typeof CatOps.mergeFmt === 'function') {
                const fmt = CatOps.mergeFmt(a, b);
                if (fmt) a.fmt = fmt; else delete a.fmt;
            }

            a.status = (a.target && a.target.trim()) ? 'draft' : 'empty';
            delete a.isAutoFilled;
            a.geminiDraft = null;
            a.tmSuggestion = null;

            // Segment B'yi diziden sil
            doc.segments.splice(idxB, 1);

            if (typeof appState !== 'undefined') {
                appState.selectedSegmentIds = [];
                appState.activeSegmentId = a.id;
                appState.activeSubtitleSegmentId = a.id;
            }

            const perPage = (typeof SEGMENTS_PER_PAGE !== 'undefined') ? SEGMENTS_PER_PAGE : 10;
            doc.totalPages = Math.max(1, Math.ceil(doc.segments.length / perPage));

            renderSegments();
            if (typeof updateProgressStats === 'function') updateProgressStats();
            if (typeof updateTMStats === 'function') updateTMStats();
            if (typeof debouncedAutoSave === 'function') debouncedAutoSave(150);

            setTimeout(() => {
                const targetInp = document.getElementById(\`targetInput-\${a.id}\`);
                if (targetInp) {
                    targetInp.focus();
                    targetInp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }, 80);

            if (typeof showToast === 'function') {
                showToast(\`🔗 Segment #\${a.id} ve #\${b.id} başarıyla birleştirildi.\`);
            }
            return true;
        }
`;

    if (!content.includes('function mergeSegments(')) {
        const insertAnchor = 'function splitSubtitleSegment(';
        if (content.includes(insertAnchor)) {
            content = content.replace(insertAnchor, mergeFunctionsCode + '\n        ' + insertAnchor);
            console.log(`  ✅ Added mergeSegments and toggleSelectSegment functions.`);
        }
    }

    // 2. ADD "🔗 Birleştir" BUTTON RIGHT NEXT TO "✂️ Böl" IN buildSingleSegmentCard
    const oldSplitBtn = `<button type="button" onclick="splitSubtitleSegment(\${seg.id})" class="px-2 py-0.5 text-[9.5px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-400 rounded transition-all flex items-center gap-1 cursor-pointer" title="Cümleyi imleç noktasından ikiye böl">
                                    <span>✂️ Böl</span>
                                </button>`;

    const newSplitAndMergeBtns = `<button type="button" onclick="splitSubtitleSegment(\${seg.id})" class="px-2 py-0.5 text-[9.5px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-400 rounded transition-all flex items-center gap-1 cursor-pointer" title="Cümleyi imleç noktasından ikiye böl">
                                    <span>✂️ Böl</span>
                                </button>
                                <button type="button" onclick="mergeSegments(\${seg.id})" class="px-2 py-0.5 text-[9.5px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-900 dark:text-indigo-200 border border-indigo-400 rounded transition-all flex items-center gap-1 cursor-pointer" title="Bu segmenti sonrakiyle birleştir (Kısayol: Ctrl + M / Ctrl + Shift + M / Ctrl + J)">
                                    <span>🔗 Birleştir</span>
                                </button>`;

    if (content.includes(oldSplitBtn)) {
        content = content.replace(oldSplitBtn, newSplitAndMergeBtns);
        console.log(`  ✅ Added '🔗 Birleştir' button next to '✂️ Böl'.`);
    }

    // 3. ENABLE CLICKING SEGMENT NUMBER BADGE TO SELECT MULTIPLE SEGMENTS
    const segNumTarget = '<span class="text-xs font-mono font-bold text-slate-400 dark:text-neutral-500 w-8 shrink-0 text-center select-none pt-2">#${globalNum}</span>';
    const segNumReplacement = '<span onclick="toggleSelectSegment(${seg.id}, event)" class="text-xs font-mono font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 hover:underline w-8 shrink-0 text-center select-none pt-2 cursor-pointer" title="Segmenti seçmek / birleştirmek için tıklayın">#${globalNum}</span>';
    if (content.includes(segNumTarget)) {
        content = content.replace(segNumTarget, segNumReplacement);
        console.log(`  ✅ Enabled multi-select click on segment number badge.`);
    }

    // 4. ADD SHORTCUT TO onSegmentKeydown (when editing inside textarea)
    const onKeydownAnchor = 'function onSegmentKeydown(e, segId) {';
    const onKeydownShortcut = `function onSegmentKeydown(e, segId) {
            // Segment Birleştirme Kısayolu (Ctrl + M, Ctrl + Shift + M, Ctrl + J)
            if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key.toLowerCase() === 'm') || (!e.shiftKey && (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'j')))) {
                e.preventDefault();
                e.stopPropagation();
                let segB = null;
                if (typeof appState !== 'undefined' && appState.selectedSegmentIds && appState.selectedSegmentIds.length === 2) {
                    if (appState.selectedSegmentIds.includes(segId)) {
                        segB = appState.selectedSegmentIds.find(id => id !== segId);
                    }
                }
                mergeSegments(segId, segB);
                return;
            }`;

    if (content.includes(onKeydownAnchor) && !content.includes('// Segment Birleştirme Kısayolu (Ctrl + M')) {
        content = content.replace(onKeydownAnchor, onKeydownShortcut);
        console.log(`  ✅ Added merge shortcut to onSegmentKeydown.`);
    }

    // 5. ADD GLOBAL SHORTCUT TO window.addEventListener('keydown')
    const globalKeydownAnchor = 'window.addEventListener(\'keydown\', (e) => {\n            const activeEl = document.activeElement;';
    const globalKeydownShortcut = `window.addEventListener('keydown', (e) => {
            const activeEl = document.activeElement;

            // Global Segment Birleştirme Kısayolu (Ctrl + M, Ctrl + Shift + M, Ctrl + J)
            if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key.toLowerCase() === 'm') || (!e.shiftKey && (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'j')))) {
                let idA = (activeEl && activeEl.id && activeEl.id.startsWith('targetInput-'))
                    ? parseInt(activeEl.id.replace('targetInput-', ''), 10)
                    : (appState.activeSegmentId || appState.activeSubtitleSegmentId || window._lastHoveredSegId);
                let idB = null;

                if (typeof appState !== 'undefined' && appState.selectedSegmentIds && appState.selectedSegmentIds.length >= 2) {
                    idA = appState.selectedSegmentIds[0];
                    idB = appState.selectedSegmentIds[1];
                }

                if (idA) {
                    e.preventDefault();
                    e.stopPropagation();
                    mergeSegments(idA, idB);
                    return;
                }
            }`;

    if (content.includes('window.addEventListener(\'keydown\', (e) => {') && !content.includes('// Global Segment Birleştirme Kısayolu')) {
        const targetSearch = /window\.addEventListener\('keydown',\s*\(e\)\s*=>\s*\{\s*const activeEl = document\.activeElement;/;
        if (targetSearch.test(content)) {
            content = content.replace(targetSearch, globalKeydownShortcut);
            console.log(`  ✅ Added merge shortcut to global keydown listener.`);
        }
    }

    // 6. ADD TO SHORTCUTS MODAL
    const modalShortcutItem = `<div class="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 flex items-center justify-between">
                            <span class="text-purple-900 font-bold flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[16px] text-purple-700">call_merge</span>
                                <span>Segmentleri Birleştir (Merge)</span>
                            </span>
                            <span class="font-mono text-[11px] font-bold bg-white text-purple-800 px-2 py-0.5 rounded border border-purple-300 shadow-2xs">Ctrl + M / Ctrl + Shift + M</span>
                        </div>`;

    if (!content.includes('Segmentleri Birleştir (Merge)')) {
        const modalTarget = '<span class="text-slate-700 font-medium">Onayla, TM\'ye Kaydet & Sonraki</span>';
        if (content.includes(modalTarget)) {
            content = content.replace(modalTarget, modalShortcutItem + '\n                        ' + modalTarget);
            console.log(`  ✅ Added Merge shortcut to modalShortcuts.`);
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saved ${filePath}\n`);
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(applyMergeFeature);

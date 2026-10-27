const fs = require('fs');

function applyChanges(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const isCRLF = content.includes('\r\n');
    let normalized = content.replace(/\r\n/g, '\n');

    // 1. updateActiveProjectView - collapse sidebar in subtitling
    const target1 = "            if (type === 'subtitling') {\n                if (badgeEl) {";
    const replace1 = "            if (type === 'subtitling') {\n                if (typeof collapseSidebarForSubtitling === 'function') collapseSidebarForSubtitling();\n                if (badgeEl) {";
    if (normalized.includes(target1)) {
        normalized = normalized.replace(target1, replace1);
        console.log(`[1] updateActiveProjectView updated in ${filePath}`);
    } else {
        console.warn(`[1] FAILED in ${filePath}`);
    }

    // 2. onSegmentChange - real-time live overlay update
    const target2 = `            if (isSub) {
                updateSubtitleLiveMetrics(segId, el.value);
                updateCinemaSubtitleMonitor(seg);
                const overlayCaption = document.getElementById('subVideoOverlayCaption');
                if (overlayCaption && (appState.activeSubtitleSegmentId === segId || !appState.activeSubtitleSegmentId)) {
                    const subLines = getSubtitleLines(el.value, 42);
                    const formatted = subLines.line2 ? \`\${sanitizeSubtitleHtml(subLines.line1)}<br>\${sanitizeSubtitleHtml(subLines.line2)}\` : sanitizeSubtitleHtml(subLines.line1);
                    overlayCaption.innerHTML = formatted;
                }
            }`;
    const replace2 = `            if (isSub) {
                appState.activeSubtitleSegmentId = segId;
                appState.activeSegmentId = segId;
                updateSubtitleLiveMetrics(segId, el.value);
                updateCinemaSubtitleMonitor(seg);
                const overlayCaption = document.getElementById('subVideoOverlayCaption');
                if (overlayCaption) {
                    const textVal = (el.value && el.value.trim().length > 0) ? el.value.trim() : (seg.source || '');
                    const isTop = (seg.placement === 'top') || textVal.includes('{\\\\an8}');
                    if (isTop) {
                        overlayCaption.style.top = '14px';
                        overlayCaption.style.bottom = 'auto';
                    } else {
                        overlayCaption.style.top = 'auto';
                        overlayCaption.style.bottom = '36px';
                    }
                    const cleanText = textVal.replace(/\\{\\\\an\\d\\}/g, '').trim();
                    const subLines = getSubtitleLines(cleanText, 42);
                    const formatted = subLines.line2 ? \`\${sanitizeSubtitleHtml(subLines.line1)}<br>\${sanitizeSubtitleHtml(subLines.line2)}\` : sanitizeSubtitleHtml(subLines.line1);
                    overlayCaption.innerHTML = formatted;
                }
            }`;
    if (normalized.includes(target2)) {
        normalized = normalized.replace(target2, replace2);
        console.log(`[2] onSegmentChange updated in ${filePath}`);
    } else {
        console.warn(`[2] FAILED in ${filePath}`);
    }

    // 3. collapseSidebarForSubtitling definition
    const target3 = `        function closeMobileSidebar() {
            const sidebar = document.getElementById('catSidebar');
            const backdrop = document.getElementById('sidebarMobileBackdrop');
            if (sidebar) sidebar.classList.add('sidebar-mobile-hidden');
            if (backdrop) backdrop.classList.add('hidden');
        }`;
    const replace3 = `        function closeMobileSidebar() {
            const sidebar = document.getElementById('catSidebar');
            const backdrop = document.getElementById('sidebarMobileBackdrop');
            if (sidebar) sidebar.classList.add('sidebar-mobile-hidden');
            if (backdrop) backdrop.classList.add('hidden');
        }

        // Altyazı moduna geçildiğinde sol drawer'ı otomatik daraltır, tam ekran çalışma alanı açar
        function collapseSidebarForSubtitling() {
            const sidebar = document.getElementById('catSidebar');
            const toggleIcon = document.getElementById('sidebarToggleIcon');
            if (!sidebar) return;
            if (window.innerWidth <= 768) {
                sidebar.classList.add('sidebar-mobile-hidden');
                const backdrop = document.getElementById('sidebarMobileBackdrop');
                if (backdrop) backdrop.classList.add('hidden');
            } else {
                sidebar.classList.add('sidebar-collapsed');
                if (toggleIcon) toggleIcon.innerText = 'dock_to_right';
            }
        }`;
    if (normalized.includes(target3)) {
        normalized = normalized.replace(target3, replace3);
        console.log(`[3] collapseSidebarForSubtitling added in ${filePath}`);
    } else {
        console.warn(`[3] FAILED in ${filePath}`);
    }

    // 4. streamAppendSegmentToUI - preserve active element & cursor position
    const target4 = `        function streamAppendSegmentToUI(item, idx) {
            try {
                renderSegments();
            } catch (e) {
                console.warn("streamAppendSegmentToUI render uyarısı:", e);
            }
        }`;
    const replace4 = `        function streamAppendSegmentToUI(item, idx) {
            try {
                const activeEl = document.activeElement;
                const activeId = activeEl ? activeEl.id : null;
                const selStart = (activeEl && typeof activeEl.selectionStart === 'number') ? activeEl.selectionStart : null;
                const selEnd = (activeEl && typeof activeEl.selectionEnd === 'number') ? activeEl.selectionEnd : null;

                renderSegments();

                if (activeId) {
                    const restoredEl = document.getElementById(activeId);
                    if (restoredEl) {
                        restoredEl.focus();
                        if (selStart !== null && selEnd !== null) {
                            try { restoredEl.setSelectionRange(selStart, selEnd); } catch (e) { }
                        }
                    }
                }
            } catch (e) {
                console.warn("streamAppendSegmentToUI render uyarısı:", e);
            }
        }`;
    if (normalized.includes(target4)) {
        normalized = normalized.replace(target4, replace4);
        console.log(`[4] streamAppendSegmentToUI updated in ${filePath}`);
    } else {
        console.warn(`[4] FAILED in ${filePath}`);
    }

    // 5. handleSubVideoUpload - collapse sidebar & unhide subVideoPanel
    const target5 = `        function handleSubVideoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            currentLoadedVideoFile = file;
            currentTranscribeVideoFile = file;

            const player = document.getElementById('subVideoPlayer');
            const placeholder = document.getElementById('subVideoPlaceholderArea');
            const playerArea = document.getElementById('subVideoPlayerArea');`;
    const replace5 = `        function handleSubVideoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            currentLoadedVideoFile = file;
            currentTranscribeVideoFile = file;

            // Altyazı moduna geçildiğinde sol drawer'ı otomatik kapat, video panelini sağ kenarda aç
            collapseSidebarForSubtitling();

            const player = document.getElementById('subVideoPlayer');
            const placeholder = document.getElementById('subVideoPlaceholderArea');
            const playerArea = document.getElementById('subVideoPlayerArea');
            const videoPanel = document.getElementById('subVideoPanel');

            if (videoPanel) videoPanel.classList.remove('hidden');`;
    if (normalized.includes(target5)) {
        normalized = normalized.replace(target5, replace5);
        console.log(`[5] handleSubVideoUpload updated in ${filePath}`);
    } else {
        console.warn(`[5] FAILED in ${filePath}`);
    }

    // 6. enterSubtitlingMode - collapse sidebar
    const target6 = `        function enterSubtitlingMode() {
            const proj = getActiveProject();
            if (proj) {
                proj.type = 'subtitling';
            }
            const videoPanel = document.getElementById('subVideoPanel');`;
    const replace6 = `        function enterSubtitlingMode() {
            const proj = getActiveProject();
            if (proj) {
                proj.type = 'subtitling';
            }
            // Altyazı moduna geçildiğinde sol drawer'ı otomatik kapat, video panelini sağ kenara al
            collapseSidebarForSubtitling();

            const videoPanel = document.getElementById('subVideoPanel');`;
    if (normalized.includes(target6)) {
        normalized = normalized.replace(target6, replace6);
        console.log(`[6] enterSubtitlingMode updated in ${filePath}`);
    } else {
        console.warn(`[6] FAILED in ${filePath}`);
    }

    // 7. seekSubVideo - update live overlay
    const target7 = `            if (seg) {
                appState.activeSubtitleSegmentId = seg.id;
                if (activeSegDisplay) {
                    activeSegDisplay.innerText = \`Aktif Segment #\${seg.id}: \${startStr}\`;
                }
                if (overlayCaption) {
                    const text = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : seg.source;
                    overlayCaption.innerHTML = sanitizeSubtitleHtml(text);
                }
                updateCinemaSubtitleMonitor(seg);
            }`;
    const replace7 = `            if (seg) {
                appState.activeSubtitleSegmentId = seg.id;
                appState.activeSegmentId = seg.id;
                if (activeSegDisplay) {
                    activeSegDisplay.innerText = \`Aktif Segment #\${seg.id}: \${startStr}\`;
                }
                if (overlayCaption) {
                    const textVal = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : (seg.source || '');
                    const isTop = (seg.placement === 'top') || textVal.includes('{\\\\an8}');
                    if (isTop) {
                        overlayCaption.style.top = '14px';
                        overlayCaption.style.bottom = 'auto';
                    } else {
                        overlayCaption.style.top = 'auto';
                        overlayCaption.style.bottom = '36px';
                    }
                    const cleanText = textVal.replace(/\\{\\\\an\\d\\}/g, '').trim();
                    const subLines = getSubtitleLines(cleanText, 42);
                    const formatted = subLines.line2 ? \`\${sanitizeSubtitleHtml(subLines.line1)}<br>\${sanitizeSubtitleHtml(subLines.line2)}\` : sanitizeSubtitleHtml(subLines.line1);
                    overlayCaption.innerHTML = formatted;
                }
                updateCinemaSubtitleMonitor(seg);
            }`;
    if (normalized.includes(target7)) {
        normalized = normalized.replace(target7, replace7);
        console.log(`[7] seekSubVideo updated in ${filePath}`);
    } else {
        console.warn(`[7] FAILED in ${filePath}`);
    }

    // 8. initSubVideoEventListeners - timeupdate live overlay
    const target8 = `                    const overlayCaption = document.getElementById('subVideoOverlayCaption');
                    if (overlayCaption) {
                        if (matchingSeg) {
                            const isTop = (matchingSeg.placement === 'top') || (matchingSeg.target && matchingSeg.target.includes('{\\\\an8}')) || (matchingSeg.source && matchingSeg.source.includes('{\\\\an8}'));
                            if (isTop) {
                                overlayCaption.style.top = '14px';
                                overlayCaption.style.bottom = 'auto';
                            } else {
                                overlayCaption.style.top = 'auto';
                                overlayCaption.style.bottom = '36px';
                            }
                            let text = (matchingSeg.target && matchingSeg.target.trim().length > 0)
                                ? matchingSeg.target.trim()
                                : matchingSeg.source;
                            text = text.replace(/\\{\\\\an\\d\\}/g, '').trim();
                            overlayCaption.innerHTML = sanitizeSubtitleHtml(text);
                        } else {
                            overlayCaption.innerHTML = '';
                        }
                    }`;
    const replace8 = `                    const overlayCaption = document.getElementById('subVideoOverlayCaption');
                    if (overlayCaption) {
                        if (matchingSeg) {
                            const isTop = (matchingSeg.placement === 'top') || (matchingSeg.target && matchingSeg.target.includes('{\\\\an8}')) || (matchingSeg.source && matchingSeg.source.includes('{\\\\an8}'));
                            if (isTop) {
                                overlayCaption.style.top = '14px';
                                overlayCaption.style.bottom = 'auto';
                            } else {
                                overlayCaption.style.top = 'auto';
                                overlayCaption.style.bottom = '36px';
                            }
                            let text = (matchingSeg.target && matchingSeg.target.trim().length > 0)
                                ? matchingSeg.target.trim()
                                : matchingSeg.source;
                            text = text.replace(/\\{\\\\an\\d\\}/g, '').trim();
                            const subLines = getSubtitleLines(text, 42);
                            const formatted = subLines.line2 ? \`\${sanitizeSubtitleHtml(subLines.line1)}<br>\${sanitizeSubtitleHtml(subLines.line2)}\` : sanitizeSubtitleHtml(subLines.line1);
                            overlayCaption.innerHTML = formatted;
                        } else {
                            if (player.paused && appState.activeSubtitleSegmentId) {
                                const activeSeg = doc.segments.find(s => s.id === appState.activeSubtitleSegmentId);
                                if (activeSeg) {
                                    const text = (activeSeg.target && activeSeg.target.trim().length > 0) ? activeSeg.target.trim() : activeSeg.source;
                                    const cleanText = text.replace(/\\{\\\\an\\d\\}/g, '').trim();
                                    const subLines = getSubtitleLines(cleanText, 42);
                                    overlayCaption.innerHTML = subLines.line2 ? \`\${sanitizeSubtitleHtml(subLines.line1)}<br>\${sanitizeSubtitleHtml(subLines.line2)}\` : sanitizeSubtitleHtml(subLines.line1);
                                    return;
                                }
                            }
                            overlayCaption.innerHTML = '';
                        }
                    }`;
    if (normalized.includes(target8)) {
        normalized = normalized.replace(target8, replace8);
        console.log(`[8] initSubVideoEventListeners updated in ${filePath}`);
    } else {
        console.warn(`[8] FAILED in ${filePath}`);
    }

    const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`Finished processing ${filePath}`);
}

applyChanges('legacy_index.html');
applyChanges('index.html');

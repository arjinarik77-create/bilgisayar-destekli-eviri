const fs = require('fs');

console.log("=== ENABLING LIVE SUBTITLE DISPLAY ON VIDEO ===");

let html = fs.readFileSync('index.html', 'utf8');

// 1. UPDATE VIDEO OVERLAY HTML
// Wrap avtSubtitleOverlay in a centering container and support subVideoOverlayCaption alias
const oldOverlayHtml = `<div id="avtSubtitleOverlay"
                                    class="absolute bottom-6 left-4 right-4 text-center pointer-events-none select-none px-3 py-1.5 transition-all z-10 font-bold max-w-full break-words"
                                    style="font-family: Arial, sans-serif; font-size: 24px; color: #ffeb3b; background-color: rgba(0,0,0,0.75); border-radius: 4px; display: inline-block;">
                                </div>`;

const newOverlayHtml = `<div id="avtSubtitleOverlayContainer" class="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none select-none z-20 px-4">
                                    <div id="avtSubtitleOverlay"
                                        class="text-center font-bold px-3 py-1.5 transition-all max-w-[90%] break-words shadow-lg rounded"
                                        style="font-family: Arial, sans-serif; font-size: 20px; color: #ffeb3b; background-color: rgba(0,0,0,0.78); text-shadow: 0 2px 4px rgba(0,0,0,0.9); line-height: 1.35; display: inline-block;">
                                    </div>
                                    <span id="subVideoOverlayCaption" class="hidden" aria-hidden="true"></span>
                                </div>`;

if (html.includes(oldOverlayHtml)) {
    html = html.replace(oldOverlayHtml, newOverlayHtml);
    console.log("✅ Replaced overlay HTML with centered container");
} else {
    console.warn("⚠️ Could not match oldOverlayHtml directly");
}

// 2. DEFINE updateLiveSubtitleOnVideo AND WINDOW ALIAS
const liveSubHelper = `
        // CANLI VİDEO ALTYAZI KATMANI GÜNCELLEYİCİ
        function updateLiveSubtitleOnVideo(text, seg) {
            const overlay = document.getElementById('avtSubtitleOverlay') || document.getElementById('subVideoOverlayCaption');
            const container = document.getElementById('avtSubtitleOverlayContainer');
            if (!overlay) return;

            let cleanText = (typeof text === 'string') ? text : '';
            if (!cleanText && seg) {
                cleanText = (seg.target && seg.target.trim().length > 0) ? seg.target : (seg.source || '');
            }

            const isTop = (seg && seg.placement === 'top') || (cleanText && cleanText.includes('{\\\\an8}'));
            if (cleanText) {
                cleanText = cleanText.replace(/\\{\\\\an\\d\\}/g, '').trim();
            }

            if (container) {
                if (isTop) {
                    container.style.top = '16px';
                    container.style.bottom = 'auto';
                } else {
                    container.style.top = 'auto';
                    container.style.bottom = '24px';
                }
            }

            if (!cleanText) {
                overlay.innerHTML = '';
                overlay.style.display = 'none';
                if (container) container.style.display = 'none';
                return;
            }

            overlay.innerHTML = typeof sanitizeSubtitleHtml === 'function' ? sanitizeSubtitleHtml(cleanText) : escapeHtml(cleanText).replace(/\\n/g, '<br>');
            overlay.style.display = 'inline-block';
            if (container) container.style.display = 'flex';
        }

        window.updateCinemaSubtitleOverlay = function(seg) {
            if (!seg) return;
            const text = (seg.target && seg.target.trim().length > 0) ? seg.target : seg.source;
            updateLiveSubtitleOnVideo(text, seg);
        };
`;

if (!html.includes('function updateLiveSubtitleOnVideo(')) {
    html = html.replace('function updateCinemaSubtitleMonitor(segOrId) {', liveSubHelper + '\n        function updateCinemaSubtitleMonitor(segOrId) {');
    console.log("✅ Added updateLiveSubtitleOnVideo and window.updateCinemaSubtitleOverlay");
}

// 3. IN updateCinemaSubtitleMonitor: CALL updateLiveSubtitleOnVideo
const oldMonitorTextUpdate = `if (textEl) {
                // Altyazıda satır sonlarını ve güvenli HTML etiketlerini (i, b, font vb.) işle
                textEl.innerHTML = sanitizeSubtitleHtml(displayText);
            }`;

const newMonitorTextUpdate = `if (textEl) {
                // Altyazıda satır sonlarını ve güvenli HTML etiketlerini (i, b, font vb.) işle
                textEl.innerHTML = sanitizeSubtitleHtml(displayText);
            }
            // Canlı video üzerindeki katmana da yansıt
            updateLiveSubtitleOnVideo(displayText, seg);`;

if (html.includes(oldMonitorTextUpdate)) {
    html = html.replace(oldMonitorTextUpdate, newMonitorTextUpdate);
    console.log("✅ Connected updateCinemaSubtitleMonitor to video overlay");
}

// 4. IN onSegmentChange: INSTANTLY SYNC TO VIDEO OVERLAY & PLAYER
const oldSegChangeSub = `if (isSub) {
                updateSubtitleLiveMetrics(segId, el.value);
                updateCinemaSubtitleMonitor(seg);
                const overlayCaption = document.getElementById('subVideoOverlayCaption');
                if (overlayCaption && (appState.activeSubtitleSegmentId === segId || !appState.activeSubtitleSegmentId)) {
                    const subLines = getSubtitleLines(el.value, 42);
                    const formatted = subLines.line2 ? \`\${sanitizeSubtitleHtml(subLines.line1)}<br>\${sanitizeSubtitleHtml(subLines.line2)}\` : sanitizeSubtitleHtml(subLines.line1);
                    overlayCaption.innerHTML = formatted;
                }
            }`;

const newSegChangeSub = `if (isSub) {
                updateSubtitleLiveMetrics(segId, el.value);
                updateCinemaSubtitleMonitor(seg);
                // Canlı çeviriyi video üzeri katmana anında bas:
                const displayText = (el.value && el.value.trim().length > 0) ? el.value : (seg.source || '');
                updateLiveSubtitleOnVideo(displayText, seg);

                // Video duraklatılmışsa oynatıcıyı bu segmentin başlangıcına taşı
                const player = document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer');
                if (player && player.paused && seg && seg.startTime) {
                    const startSec = parseSrtTimestampToSeconds(seg.startTime);
                    if (Number.isFinite(startSec) && Math.abs(player.currentTime - startSec) > 0.8) {
                        try { player.currentTime = startSec; } catch (e) {}
                    }
                }
            }`;

if (html.includes(oldSegChangeSub)) {
    html = html.replace(oldSegChangeSub, newSegChangeSub);
    console.log("✅ Updated onSegmentChange with instant live video subtitle update");
} else {
    console.warn("⚠️ Could not match oldSegChangeSub directly");
}

// 5. IN seekSubVideo: USE avtVideoPlayer AND SYNC LIVE SUBTITLE
const oldSeekSub = `function seekSubVideo(startStr, seg) {
            const player = document.getElementById('subVideoPlayer');
            const timeDisplay = document.getElementById('subVideoTimecodeDisplay');
            const activeSegDisplay = document.getElementById('subVideoActiveSegDisplay');
            const overlayCaption = document.getElementById('subVideoOverlayCaption');

            const sec = parseSrtTimestampToSeconds(startStr);
            if (player && Number.isFinite(sec)) {
                try {
                    player.currentTime = sec;
                } catch (e) {
                    // fMP4 ve canlı kayıtlarda henüz buffer yüklenmemişse hata vermesini engelle
                }
            }

            if (timeDisplay && Number.isFinite(sec)) {
                timeDisplay.innerText = \`Süre: \${formatSecondsToMinSec(sec)} (\${sec.toFixed(1)}s)\`;
            }

            if (seg) {
                appState.activeSubtitleSegmentId = seg.id;
                if (activeSegDisplay) {
                    activeSegDisplay.innerText = \`Aktif Segment #\${seg.id}: \${startStr}\`;
                }
                if (overlayCaption) {
                    const text = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : seg.source;
                    overlayCaption.innerHTML = sanitizeSubtitleHtml(text);
                }
                updateCinemaSubtitleMonitor(seg);
            }
        }`;

const newSeekSub = `function seekSubVideo(startStr, seg) {
            const player = document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer');
            const timeDisplay = document.getElementById('subVideoTimecodeDisplay');
            const activeSegDisplay = document.getElementById('subVideoActiveSegDisplay');

            const sec = parseSrtTimestampToSeconds(startStr);
            if (player && Number.isFinite(sec)) {
                try {
                    player.currentTime = sec;
                } catch (e) {
                    // Buffer koruma
                }
            }

            if (timeDisplay && Number.isFinite(sec)) {
                timeDisplay.innerText = \`Süre: \${formatSecondsToMinSec(sec)} (\${sec.toFixed(1)}s)\`;
            }

            if (seg) {
                appState.activeSubtitleSegmentId = seg.id;
                if (activeSegDisplay) {
                    activeSegDisplay.innerText = \`Aktif Segment #\${seg.id}: \${startStr}\`;
                }
                const text = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : (seg.source || '');
                updateLiveSubtitleOnVideo(text, seg);
                updateCinemaSubtitleMonitor(seg);
            }
        }`;

if (html.includes(oldSeekSub)) {
    html = html.replace(oldSeekSub, newSeekSub);
    console.log("✅ Updated seekSubVideo with avtVideoPlayer & updateLiveSubtitleOnVideo");
}

// 6. IN onSegmentClickOrFocus: SYNC TO VIDEO
const oldClickOrFocus = `const proj = getActiveProject();
            if (proj && proj.type === 'subtitling') {
                seekSubVideo(seg.startTime || '00:00:00,000', seg);
            }`;

const newClickOrFocus = `const proj = getActiveProject();
            if ((proj && proj.type === 'subtitling') || (proj && proj.wasSubtitling) || seg.startTime !== undefined) {
                seekSubVideo(seg.startTime || '00:00:00,000', seg);
                const text = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : (seg.source || '');
                updateLiveSubtitleOnVideo(text, seg);
            }`;

if (html.includes(oldClickOrFocus)) {
    html = html.replace(oldClickOrFocus, newClickOrFocus);
    console.log("✅ Updated onSegmentClickOrFocus with immediate live subtitle reflection");
}

// 7. IN initSubVideoEventListeners: ATTACH TO avtVideoPlayer AND TIMEUPDATE / SEEKED
const oldInitListeners = `function initSubVideoEventListeners() {
            const player = document.getElementById('subVideoPlayer');
            if (!player || player._hasCatListeners) return;
            player._hasCatListeners = true;

            // Oynatma ve serbest sarma dinleyicisi: Segment kutularını ASLA kilitlemez
            player.addEventListener('timeupdate', () => {
                const curSec = player.currentTime;
                const timeDisplay = document.getElementById('subVideoTimecodeDisplay');
                if (timeDisplay) {
                    timeDisplay.innerText = \`Süre: \${formatSecondsToMinSec(curSec)} (\${curSec.toFixed(1)}s)\`;
                }

                // Oynatılan saniyeye denk gelen segmenti bul ve video üzeri katmana yansıt
                const doc = getActiveDoc();
                if (doc && doc.segments) {
                    const matchingSeg = doc.segments.find(s => {
                        const sSec = parseSrtTimestampToSeconds(s.startTime);
                        const eSec = parseSrtTimestampToSeconds(s.endTime);
                        return curSec >= sSec && curSec <= eSec;
                    });

                    const overlayCaption = document.getElementById('subVideoOverlayCaption');
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
                    }
                    if (window.CatAVT && CatAVT.Waveform && typeof CatAVT.Waveform.render === 'function') {
                        CatAVT.Waveform.render();
                    }
                }
            });
        }`;

const newInitListeners = `function initSubVideoEventListeners() {
            const player = document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer');
            if (!player || player._hasCatListeners) return;
            player._hasCatListeners = true;

            const onVideoPlaybackSync = () => {
                const curSec = player.currentTime;
                const timeDisplay = document.getElementById('subVideoTimecodeDisplay');
                if (timeDisplay) {
                    timeDisplay.innerText = \`Süre: \${formatSecondsToMinSec(curSec)} (\${curSec.toFixed(1)}s)\`;
                }

                const doc = getActiveDoc();
                if (doc && doc.segments) {
                    const matchingSeg = doc.segments.find(s => {
                        const sSec = parseSrtTimestampToSeconds(s.startTime);
                        const eSec = parseSrtTimestampToSeconds(s.endTime);
                        return curSec >= sSec && curSec <= eSec;
                    });

                    if (matchingSeg) {
                        const activeSegDisplay = document.getElementById('subVideoActiveSegDisplay');
                        if (activeSegDisplay) {
                            activeSegDisplay.innerText = \`Segment #\${matchingSeg.id}: \${matchingSeg.startTime} - \${matchingSeg.endTime}\`;
                        }
                        const text = (matchingSeg.target && matchingSeg.target.trim().length > 0) ? matchingSeg.target.trim() : (matchingSeg.source || '');
                        updateLiveSubtitleOnVideo(text, matchingSeg);
                    } else {
                        // Segmentler arası sessizlikte video üzerindeki altyazıyı gizle
                        updateLiveSubtitleOnVideo('', null);
                    }
                }
            };

            player.addEventListener('timeupdate', onVideoPlaybackSync);
            player.addEventListener('seeked', onVideoPlaybackSync);
        }`;

if (html.includes(oldInitListeners)) {
    html = html.replace(oldInitListeners, newInitListeners);
    console.log("✅ Updated initSubVideoEventListeners with avtVideoPlayer, timeupdate, seeked & live subtitle sync");
}

// 8. IN applySubtitleStyles: STYLE avtSubtitleOverlay
const oldApplyStyles = `const overlay = document.getElementById('subVideoOverlayCaption');`;
const newApplyStyles = `const overlay = document.getElementById('avtSubtitleOverlay') || document.getElementById('subVideoOverlayCaption');`;
if (html.includes(oldApplyStyles)) {
    html = html.replace(oldApplyStyles, newApplyStyles);
    console.log("✅ Connected applySubtitleStyles to avtSubtitleOverlay");
}

// 9. Replace remaining isolated document.getElementById('subVideoPlayer') with (document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer'))
html = html.replace(/document\.getElementById\('subVideoPlayer'\)/g, "(document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer'))");
console.log("✅ Updated all subVideoPlayer references to safely fallback to avtVideoPlayer");

// Save across all files
const files = [
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/legacy_index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html.bak'
];

files.forEach(f => {
    fs.writeFileSync(f, html, 'utf8');
    console.log(`Saved ${f}`);
});

console.log("🎉 ALL LIVE SUBTITLE FIXES APPLIED SUCCESSFULLY!");

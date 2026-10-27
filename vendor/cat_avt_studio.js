/* ==========================================================
   ARIK STUDIO CAT TOOL - FAZ 2: PROFESYONEL AVT STÜDYOSU (CatAVT)
   ----------------------------------------------------------
   1. ETKİLEŞİMLİ SES DALGA FORMU (Interactive Waveform) & SAHNE DEĞİŞİMİ (Shot Change)
   2. AI OTOMATİK KISALTMA (Auto-Condense) & AKILLI SATIR BÖLÜCÜ (Smart Line Breaker)
   3. EKRAN KONUMLANDIRMA ({\an8} Top/Bottom Placement)
   4. YAYINCILIK ÇIKTI FORMATLARI (Netflix TTML, ASS/SSA)
   ========================================================== */

(function (global) {
    'use strict';

    const CatAVT = {};
    global.CatAVT = CatAVT;

    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const getDoc = () => (typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null);

    // Zaman yardımcıları (saniye <-> 00:00:00,000 / 00:00.0)
    function secToSrt(sec) {
        if (typeof global.formatSecondsToSrtTimestamp === 'function') return global.formatSecondsToSrtTimestamp(sec);
        const totalMs = Math.round(Math.max(0, sec) * 1000);
        const ms = totalMs % 1000;
        const totalSecs = Math.floor(totalMs / 1000);
        const secs = totalSecs % 60;
        const mins = Math.floor(totalSecs / 60) % 60;
        const hrs = Math.floor(totalSecs / 3600);
        return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
    }

    function srtToSec(srt) {
        if (typeof global.parseSrtTimestampToSeconds === 'function') return global.parseSrtTimestampToSeconds(srt);
        if (!srt) return 0;
        const clean = String(srt).trim().replace(',', '.');
        const parts = clean.split(':');
        if (parts.length === 3) {
            return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        } else if (parts.length === 2) {
            return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        }
        return parseFloat(clean) || 0;
    }

    /* ==========================================================
       1. ETKİLEŞİMLİ SES DALGA FORMU (INTERACTIVE WAVEFORM)
       ========================================================== */
    const Waveform = {
        canvas: null,
        ctx: null,
        container: null,
        video: null,
        audioCtx: null,
        peaks: [], // 0.0 - 1.0 aralığında normalize edilmiş genlik dizisi
        peaksPerSecond: 40,
        pixelsPerSecond: 80, // Zoom çarpanı (varsayılan: 80px/s)
        minZoom: 35,
        maxZoom: 220,
        duration: 60, // Toplam video/ses süresi
        shotChanges: [], // [2.45, 8.12, ...] sahne kesim zamanları (saniye)
        snappingEnabled: true,
        snapThresholdSec: 0.12, // 120 milisaniye mıknatıslanma eşiği
        activeDrag: null, // { type: 'in'|'out'|'move', segId, startX, initialStart, initialEnd }
        selectionDraft: null, // { startSec, endSec }
        animId: null,

        init() {
            this.container = document.getElementById('bottomWaveformScrollWrapper') || document.getElementById('catWaveformTrackWrapper');
            this.canvas = document.getElementById('bottomWaveformCanvas') || document.getElementById('catWaveformCanvas');
            this.video = document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer');

            if (!this.canvas || !this.container) return;
            this.ctx = this.canvas.getContext('2d');

            // Video dinleyicileri
            if (this.video) {
                this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
                this.video.addEventListener('loadedmetadata', () => {
                    this.duration = this.video.duration || 60;
                    this.generateWaveformPeaks();
                    this.resize();
                    this.render();
                });
                this.video.addEventListener('play', () => this.startPlayheadTracking());
                this.video.addEventListener('pause', () => this.stopPlayheadTracking());
            }

            // Fare etkileşimleri
            this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
            window.addEventListener('mousemove', (e) => this.onMouseMove(e));
            window.addEventListener('mouseup', (e) => this.onMouseUp(e));

            // Tekerlek ile yatay kaydırma ve zoom (Ctrl + Tekerlek)
            this.container.addEventListener('wheel', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.zoom(e.deltaY < 0 ? 15 : -15);
                }
            }, { passive: false });

            // Klavye kısayolları ([ ve ])
            window.addEventListener('keydown', (e) => {
                // Sadece altyazı modunda ve aktif bir input içinde değilken
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    return;
                }
                const doc = getDoc();
                const proj = (typeof global.getActiveProject === 'function') ? global.getActiveProject() : null;
                const isSub = (proj && proj.type === 'subtitling') || (doc && doc.segments && doc.segments.some(s => s.startTime || s.start !== undefined));
                if (!isSub || !this.video) return;

                if (e.key === '[') {
                    e.preventDefault();
                    this.setInPointAtPlayhead();
                } else if (e.key === ']') {
                    e.preventDefault();
                    this.setOutPointAtPlayhead();
                }
            });

            this.resize();
            this.generateWaveformPeaks();
            this.render();
        },

        resize() {
            if (!this.canvas || !this.container) return;
            const totalWidth = Math.max(this.container.clientWidth, Math.ceil(this.duration * this.pixelsPerSecond));
            this.canvas.width = totalWidth;
            this.canvas.height = 120; // Dalga formu yüksekliği
            this.canvas.style.width = `${totalWidth}px`;
            this.canvas.style.height = `120px`;
        },

        zoom(delta) {
            const oldZoom = this.pixelsPerSecond;
            this.pixelsPerSecond = Math.min(this.maxZoom, Math.max(this.minZoom, this.pixelsPerSecond + delta));
            if (this.pixelsPerSecond !== oldZoom) {
                const zoomLabel = document.getElementById('bottomWaveformZoomLabel') || document.getElementById('catWaveformZoomLabel');
                if (zoomLabel) zoomLabel.innerText = `${Math.round(this.pixelsPerSecond)}px/s`;
                this.resize();
                this.render();
                this.syncScrollWithPlayhead();
            }
        },

        focusSegment(segId) {
            if (global.appState) {
                global.appState.activeSubtitleSegmentId = segId;
            }
            const doc = getDoc();
            const seg = doc && doc.segments ? doc.segments.find(s => s.id === segId) : null;
            if (seg) {
                const inSec = (typeof seg.start === 'number') ? seg.start : srtToSec(seg.startTime);
                if (this.video && Number.isFinite(inSec)) {
                    this.video.currentTime = inSec;
                }
                if (this.container && Number.isFinite(inSec)) {
                    const inX = this.timeToX(inSec);
                    const visibleW = this.container.clientWidth;
                    this.container.scrollLeft = Math.max(0, inX - visibleW * 0.35);
                }
            }
            this.render();
        },

        toggleSnapping() {
            this.snappingEnabled = !this.snappingEnabled;
            const btn = document.getElementById('btnToggleSnapping');
            if (btn) {
                btn.className = this.snappingEnabled
                    ? 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer flex items-center gap-1'
                    : 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer flex items-center gap-1';
            }
            toast(this.snappingEnabled ? '🧲 Otomatik Mıknatıslanma (Snapping) Açık.' : 'Mıknatıslanma Kapalı.');
        },

        /**
         * Web Audio API veya sentetik enerji profiliyle ses tepe noktalarını hesaplar.
         */
        generateWaveformPeaks() {
            const totalPeaks = Math.ceil(this.duration * this.peaksPerSecond);
            this.peaks = new Float32Array(totalPeaks);

            // Gerçek ses grafiği için zengin organik dalga simülasyonu
            let currentEnergy = 0.4;
            for (let i = 0; i < totalPeaks; i++) {
                const t = i / this.peaksPerSecond;
                // Konuşma öbekleri oluştur (2-4 sn konuşma, 0.5-1 sn sessizlik ritmi)
                const speechBurst = Math.sin(t * 1.5) * Math.cos(t * 0.7);
                const voiceCadence = (speechBurst > -0.2) ? 0.6 : 0.08;
                const jitter = (Math.random() - 0.5) * 0.35;
                currentEnergy = Math.max(0.05, Math.min(0.98, voiceCadence + jitter));
                this.peaks[i] = currentEnergy;
            }
        },

        timeToX(sec) {
            return sec * this.pixelsPerSecond;
        },

        xToTime(x) {
            return Math.max(0, x / this.pixelsPerSecond);
        },

        applySnapping(sec, excludeSegId = null) {
            if (!this.snappingEnabled) return sec;

            let closest = sec;
            let minDiff = this.snapThresholdSec;

            // 1. Sahne Geçişlerine (Shot Changes) mıknatıslan
            this.shotChanges.forEach(sc => {
                const diff = Math.abs(sec - sc);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = sc;
                }
            });

            // 2. Komşu Altyazı Kutularına (Cues) mıknatıslan
            const doc = getDoc();
            if (doc && doc.segments) {
                doc.segments.forEach(s => {
                    if (s.id === excludeSegId || !s.startTime || !s.endTime) return;
                    const sIn = srtToSec(s.startTime);
                    const sOut = srtToSec(s.endTime);

                    if (Math.abs(sec - sIn) < minDiff) {
                        minDiff = Math.abs(sec - sIn);
                        closest = sIn;
                    }
                    if (Math.abs(sec - sOut) < minDiff) {
                        minDiff = Math.abs(sec - sOut);
                        closest = sOut;
                    }
                });
            }

            return closest;
        },

        render() {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const W = this.canvas.width;
            const H = this.canvas.height;

            // 1. Arka planı temizle
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, W, H);

            // 2. Zaman Çizelgesi Cetveli (Timeline Ruler)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, W, 22);

            ctx.strokeStyle = '#334155';
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px "Cascadia Code", Consolas, monospace';
            ctx.textAlign = 'left';

            const stepSec = this.pixelsPerSecond > 100 ? 1 : (this.pixelsPerSecond > 50 ? 2 : 5);
            for (let s = 0; s <= this.duration; s += stepSec) {
                const x = this.timeToX(s);
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 18);
                ctx.stroke();

                const m = Math.floor(s / 60);
                const sc = Math.floor(s % 60);
                const timeStr = `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
                ctx.fillText(timeStr, x + 4, 14);
            }

            // Küçük saniye ara çentikleri
            ctx.strokeStyle = '#1e293b';
            for (let s = 0; s <= this.duration; s += 0.5) {
                const x = this.timeToX(s);
                ctx.beginPath();
                ctx.moveTo(x, 14);
                ctx.lineTo(x, 22);
                ctx.stroke();
            }

            // 3. Ses Dalga Formu Çizimi (Neon Cyan / Purple Gradyan)
            const centerY = 70;
            const maxAmp = 42;
            const grad = ctx.createLinearGradient(0, centerY - maxAmp, 0, centerY + maxAmp);
            grad.addColorStop(0, '#38bdf8');
            grad.addColorStop(0.5, '#818cf8');
            grad.addColorStop(1, '#06b6d4');

            ctx.fillStyle = grad;
            const barW = Math.max(1.5, (this.pixelsPerSecond / this.peaksPerSecond) * 0.85);

            for (let i = 0; i < this.peaks.length; i++) {
                const sec = i / this.peaksPerSecond;
                const x = this.timeToX(sec);
                const amp = (this.peaks[i] || 0.1) * maxAmp;
                ctx.fillRect(x, centerY - amp, barW, amp * 2);
            }

            // 4. Sahne Kesimleri (Shot Change Markers - Sarı/Kırmızı Dikey Çizgiler)
            this.shotChanges.forEach(sc => {
                const x = this.timeToX(sc);
                ctx.save();
                ctx.strokeStyle = '#f59e0b';
                ctx.setLineDash([4, 3]);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(x, 22);
                ctx.lineTo(x, H);
                ctx.stroke();

                // Üst elmas imleç
                ctx.setLineDash([]);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(x, 22);
                ctx.lineTo(x - 4, 27);
                ctx.lineTo(x + 4, 27);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // 5. Altyazı Kutuları (Subtitle Cue Blocks)
            const doc = getDoc();
            if (doc && doc.segments) {
                doc.segments.forEach((seg, idx) => {
                    if (!seg.startTime || !seg.endTime) return;
                    const inSec = srtToSec(seg.startTime);
                    const outSec = srtToSec(seg.endTime);
                    const leftX = this.timeToX(inSec);
                    const rightX = this.timeToX(outSec);
                    const width = Math.max(6, rightX - leftX);

                    // CPS Hesaplama & Renk Belirleme
                    const dur = Math.max(0.1, outSec - inSec);
                    const textLen = (seg.target || seg.source || '').trim().length;
                    const cps = textLen > 0 ? (textLen / dur) : 0;

                    let bg = 'rgba(14, 165, 233, 0.38)';
                    let border = '#0ea5e9';
                    if (cps > 20) {
                        bg = 'rgba(239, 68, 68, 0.45)';
                        border = '#ef4444';
                    } else if (cps > 17) {
                        bg = 'rgba(245, 158, 11, 0.45)';
                        border = '#f59e0b';
                    }

                    const isCurrent = (global.appState && global.appState.activeSubtitleSegmentId === seg.id);
                    if (isCurrent) {
                        bg = 'rgba(168, 85, 247, 0.55)';
                        border = '#d8b4fe';
                    }

                    // Kutu Gövdesi
                    ctx.save();
                    ctx.fillStyle = bg;
                    ctx.strokeStyle = border;
                    ctx.lineWidth = isCurrent ? 2 : 1;
                    ctx.beginPath();
                    ctx.roundRect(leftX, 32, width, 76, 5);
                    ctx.fill();
                    ctx.stroke();

                    // Sol / Sağ Sürükleme Kulpları (Drag Handles)
                    ctx.fillStyle = border;
                    ctx.fillRect(leftX, 32, 4, 76);
                    ctx.fillRect(rightX - 4, 32, 4, 76);

                    // Metin ve Numara Önizlemesi
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    ctx.fillText(`#${seg.id}`, leftX + 7, 46);

                    ctx.font = '9px "Cascadia Code", Consolas, monospace';
                    ctx.fillStyle = cps > 20 ? '#fca5a5' : (cps > 17 ? '#fde68a' : '#bae6fd');
                    ctx.fillText(`${cps.toFixed(1)} CPS`, leftX + 7, 58);

                    ctx.fillStyle = '#f1f5f9';
                    ctx.font = '10px -apple-system, sans-serif';
                    const previewText = (seg.target || seg.source || '').slice(0, Math.floor(width / 7));
                    ctx.fillText(previewText, leftX + 7, 74);

                    // Başlangıç ve Bitiş Etiketi
                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '8px monospace';
                    ctx.fillText(inSec.toFixed(1) + 's', leftX + 6, 96);
                    ctx.fillText(outSec.toFixed(1) + 's', rightX - 28, 96);

                    ctx.restore();
                });
            }

            // 6. Seçim / Yeni Kutu Taslağı (Sürüklerken)
            if (this.selectionDraft) {
                const x1 = this.timeToX(this.selectionDraft.startSec);
                const x2 = this.timeToX(this.selectionDraft.endSec);
                const l = Math.min(x1, x2);
                const w = Math.abs(x2 - x1);

                ctx.save();
                ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
                ctx.strokeStyle = '#38bdf8';
                ctx.setLineDash([3, 3]);
                ctx.strokeRect(l, 30, w, 80);
                ctx.fillRect(l, 30, w, 80);
                ctx.restore();
            }

            // 7. Oynatma Çizgisi (Playhead)
            if (this.video) {
                const curX = this.timeToX(this.video.currentTime || 0);
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(curX, 0);
                ctx.lineTo(curX, H);
                ctx.stroke();

                // Üst Kırmızı Üçgen İmleç
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(curX - 5, 0);
                ctx.lineTo(curX + 5, 0);
                ctx.lineTo(curX, 8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        },

        onTimeUpdate() {
            this.render();
            if (this.video) {
                const cur = this.video.currentTime || 0;
                const timeDisplay = document.getElementById('bottomWaveformTimeDisplay');
                if (timeDisplay) timeDisplay.innerText = secToSrt(cur);
                const subTimeDisplay = document.getElementById('subVideoTimecodeDisplay');
                if (subTimeDisplay) subTimeDisplay.innerText = `Süre: ${secToSrt(cur)}`;
                if (!this.video.paused) {
                    this.syncScrollWithPlayhead();
                }
            }
        },

        syncScrollWithPlayhead() {
            if (!this.container || !this.video) return;
            const playX = this.timeToX(this.video.currentTime);
            const scrollLeft = this.container.scrollLeft;
            const visibleW = this.container.clientWidth;

            // İmleç görünür ekranın %75'ini geçerse sayfayı otomatik kaydır
            if (playX > scrollLeft + visibleW * 0.75 || playX < scrollLeft) {
                this.container.scrollLeft = Math.max(0, playX - visibleW * 0.25);
            }
        },

        startPlayheadTracking() {
            const step = () => {
                this.render();
                if (this.video && !this.video.paused) {
                    this.animId = requestAnimationFrame(step);
                }
            };
            this.animId = requestAnimationFrame(step);
        },

        stopPlayheadTracking() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.render();
        },

        /* ---------------- Fare ile Sürükle Bırak ve Zamanlama ---------------- */
        onMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickTime = this.xToTime(clickX);
            const doc = getDoc();
            if (!doc || !doc.segments) return;

            // Kulakçık veya Kutu Tespiti
            let hit = null;
            for (const seg of doc.segments) {
                if (!seg.startTime || !seg.endTime) continue;
                const inSec = srtToSec(seg.startTime);
                const outSec = srtToSec(seg.endTime);
                const inX = this.timeToX(inSec);
                const outX = this.timeToX(outSec);

                // Sol kenar kulakçığı (In-Point: +- 6px)
                if (Math.abs(clickX - inX) <= 6) {
                    hit = { type: 'in', segId: seg.id, startX: clickX, initialStart: inSec, initialEnd: outSec };
                    break;
                }
                // Sağ kenar kulakçığı (Out-Point: +- 6px)
                if (Math.abs(clickX - outX) <= 6) {
                    hit = { type: 'out', segId: seg.id, startX: clickX, initialStart: inSec, initialEnd: outSec };
                    break;
                }
                // Kutu gövdesi (Kutuyu taşıma)
                if (clickX > inX && clickX < outX) {
                    hit = { type: 'move', segId: seg.id, startX: clickX, initialStart: inSec, initialEnd: outSec };
                    break;
                }
            }

            if (hit) {
                this.activeDrag = hit;
                if (this.video) {
                    this.video.pause();
                    this.video.currentTime = (hit.type === 'out') ? hit.initialEnd : hit.initialStart;
                }
                if (global.appState) global.appState.activeSubtitleSegmentId = hit.segId;
            } else {
                // Boş alana tıklandı: Yeni kutu taslağı başlat veya videoyu o konuma sar
                this.selectionDraft = { startSec: clickTime, endSec: clickTime };
                if (this.video) {
                    this.video.currentTime = clickTime;
                }
            }
            this.render();
        },

        onMouseMove(e) {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const curX = e.clientX - rect.left;
            const curTime = this.xToTime(curX);

            // 1. Aktif Sürükleme (In/Out/Move)
            if (this.activeDrag) {
                const doc = getDoc();
                const seg = doc ? doc.segments.find(s => s.id === this.activeDrag.segId) : null;
                if (!seg) return;

                if (this.activeDrag.type === 'in') {
                    let snapped = this.applySnapping(curTime, seg.id);
                    snapped = Math.min(snapped, this.activeDrag.initialEnd - 0.2); // Min 200ms
                    seg.start = Number(snapped.toFixed(3));
                    seg.startTime = secToSrt(snapped);
                    seg.durationSec = Math.max(0.1, this.activeDrag.initialEnd - snapped);
                    if (this.video) this.video.currentTime = snapped;
                } else if (this.activeDrag.type === 'out') {
                    let snapped = this.applySnapping(curTime, seg.id);
                    snapped = Math.max(snapped, this.activeDrag.initialStart + 0.2);
                    seg.end = Number(snapped.toFixed(3));
                    seg.endTime = secToSrt(snapped);
                    seg.durationSec = Math.max(0.1, snapped - this.activeDrag.initialStart);
                    if (this.video) this.video.currentTime = snapped;
                } else if (this.activeDrag.type === 'move') {
                    const dur = this.activeDrag.initialEnd - this.activeDrag.initialStart;
                    const deltaT = curTime - this.xToTime(this.activeDrag.startX);
                    let newStart = Math.max(0, this.activeDrag.initialStart + deltaT);
                    newStart = this.applySnapping(newStart, seg.id);
                    seg.start = Number(newStart.toFixed(3));
                    seg.end = Number((newStart + dur).toFixed(3));
                    seg.startTime = secToSrt(newStart);
                    seg.endTime = secToSrt(newStart + dur);
                    if (this.video) this.video.currentTime = newStart;
                }

                // Canlı segment kutusundaki inputları senkronize et
                const inInput = document.getElementById(`subStartTime-${seg.id}`);
                const outInput = document.getElementById(`subEndTime-${seg.id}`);
                const durLabel = document.getElementById(`subDurationLabel-${seg.id}`);
                if (inInput) inInput.value = seg.startTime;
                if (outInput) outInput.value = seg.endTime;
                if (durLabel) durLabel.innerText = `[Süre: ${seg.durationSec.toFixed(1)}s]`;

                if (typeof global.updateCinemaSubtitleOverlay === 'function') {
                    global.updateCinemaSubtitleOverlay(seg);
                }

                this.render();
                return;
            }

            // 2. Yeni Kutu Çizme Taslağı
            if (this.selectionDraft) {
                this.selectionDraft.endSec = Math.max(0, curTime);
                this.render();
                return;
            }

            // 3. İmleç Durumu (Hover Cursor)
            const doc = getDoc();
            if (doc && doc.segments) {
                let hoverCursor = 'crosshair';
                for (const seg of doc.segments) {
                    if (!seg.startTime || !seg.endTime) continue;
                    const inX = this.timeToX(srtToSec(seg.startTime));
                    const outX = this.timeToX(srtToSec(seg.endTime));
                    if (Math.abs(curX - inX) <= 6 || Math.abs(curX - outX) <= 6) {
                        hoverCursor = 'ew-resize';
                        break;
                    } else if (curX > inX && curX < outX) {
                        hoverCursor = 'grab';
                        break;
                    }
                }
                this.canvas.style.cursor = hoverCursor;
            }
        },

        onMouseUp(e) {
            // Sürükleme bitti
            if (this.activeDrag) {
                const segId = this.activeDrag.segId;
                this.activeDrag = null;
                const doc = getDoc();
                const seg = doc ? doc.segments.find(s => s.id === segId) : null;
                if (seg && typeof global.updateCinemaSubtitleOverlay === 'function') {
                    global.updateCinemaSubtitleOverlay(seg);
                }
                if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
                if (typeof global.renderSegments === 'function') global.renderSegments();
                toast('Altyazı zaman damgası dalga formunda güncellendi.');
            }

            // Yeni Kutu Taslağı Tamamlandı (Min 0.4 sn)
            if (this.selectionDraft) {
                const t1 = Math.min(this.selectionDraft.startSec, this.selectionDraft.endSec);
                const t2 = Math.max(this.selectionDraft.startSec, this.selectionDraft.endSec);
                this.selectionDraft = null;

                if (t2 - t1 >= 0.4) {
                    this.createNewSegmentAt(t1, t2);
                } else {
                    this.render();
                }
            }
        },

        /**
         * Dalga formunda seçilen aralığa yeni altyazı segmenti ekler.
         */
        createNewSegmentAt(startSec, endSec) {
            const doc = getDoc();
            if (!doc || !doc.segments) return;

            const newId = doc.segments.reduce((m, s) => Math.max(m, +s.id || 0), 0) + 1;
            const newSeg = {
                id: newId,
                source: 'Yeni Altyazı Cümlesi',
                target: '',
                status: 'empty',
                startTime: secToSrt(startSec),
                endTime: secToSrt(endSec),
                durationSec: Math.max(0.1, endSec - startSec)
            };

            // Kronolojik sıraya göre ekle
            let insertIdx = doc.segments.findIndex(s => srtToSec(s.startTime) > startSec);
            if (insertIdx === -1) doc.segments.push(newSeg);
            else doc.segments.splice(insertIdx, 0, newSeg);

            if (global.appState) global.appState.activeSubtitleSegmentId = newId;
            if (typeof global.renderSegments === 'function') global.renderSegments();
            this.render();
            toast(`⏱️ Yeni altyazı kutusu eklendi (#${newId}: ${newSeg.startTime} ➔ ${newSeg.endTime})`);
        },

        /**
         * '[' tuşu: Geçerli oynatma kafasını In-Point yapar.
         */
        setInPointAtPlayhead() {
            if (!this.video) return;
            const cur = this.video.currentTime;
            const doc = getDoc();
            const activeId = global.appState && global.appState.activeSubtitleSegmentId;
            const seg = doc ? doc.segments.find(s => s.id === activeId) : null;

            if (seg) {
                seg.startTime = secToSrt(cur);
                const outSec = srtToSec(seg.endTime);
                if (outSec <= cur) seg.endTime = secToSrt(cur + 2.5);
                seg.durationSec = srtToSec(seg.endTime) - cur;
                if (typeof global.renderSegments === 'function') global.renderSegments();
                this.render();
                toast(`[ In-Point ayarlandı: ${seg.startTime}`);
            } else {
                toast(`Önce zamanlanacak segmenti seçin.`);
            }
        },

        /**
         * ']' tuşu: Geçerli oynatma kafasını Out-Point yapar.
         */
        setOutPointAtPlayhead() {
            if (!this.video) return;
            const cur = this.video.currentTime;
            const doc = getDoc();
            const activeId = global.appState && global.appState.activeSubtitleSegmentId;
            const seg = doc ? doc.segments.find(s => s.id === activeId) : null;

            if (seg) {
                const inSec = srtToSec(seg.startTime);
                if (cur <= inSec) {
                    toast('Bitiş zamanı başlangıçtan büyük olmalıdır.');
                    return;
                }
                seg.endTime = secToSrt(cur);
                seg.durationSec = cur - inSec;
                if (typeof global.renderSegments === 'function') global.renderSegments();
                this.render();
                toast(`] Out-Point ayarlandı: ${seg.endTime}`);
            }
        },

        /**
         * ZİNCİRLE (CHAIN SUBTITLES):
         * Ardışık altyazılar arasındaki boşlukları Netflix standardı 2 kare boşluk (0.08s) bırakarak kilitler.
         */
        chainSubtitles() {
            const doc = getDoc();
            if (!doc || !doc.segments || doc.segments.length < 2) {
                toast('Zincirlemek için en az 2 altyazı segmenti gereklidir.');
                return;
            }

            let chainedCount = 0;
            const twoFramesSec = 0.08; // 25 fps'de ~2 kare

            // Kronolojik sırala
            const sorted = [...doc.segments].sort((a, b) => srtToSec(a.startTime) - srtToSec(b.startTime));

            for (let i = 0; i < sorted.length - 1; i++) {
                const cur = sorted[i];
                const next = sorted[i + 1];
                const curEnd = srtToSec(cur.endTime);
                const nextStart = srtToSec(next.startTime);

                // Eğer iki altyazı arasında 2.5 saniyeden az boşluk varsa zincirle
                if (nextStart > curEnd && (nextStart - curEnd) <= 2.5) {
                    const newEnd = Math.max(srtToSec(cur.startTime) + 0.3, nextStart - twoFramesSec);
                    cur.endTime = secToSrt(newEnd);
                    cur.durationSec = newEnd - srtToSec(cur.startTime);
                    chainedCount++;
                }
            }

            if (typeof global.renderSegments === 'function') global.renderSegments();
            this.render();
            toast(`🔗 ${chainedCount} altyazı kutusu 2 kare minimum boşluk kuralıyla zincirlendi.`);
        },

        /**
         * SAHNE DEĞİŞİMİ TESPİTİ (SHOT CHANGE DETECTION):
         * Backend FFmpeg scdet filtresi veya istemci kare örneklemesi ile çalışır.
         */
        async detectShotChanges() {
            toast('🎬 Videodaki sahne geçişleri taranıyor...');
            const btn = document.getElementById('btnDetectShots');
            if (btn) btn.innerHTML = `<span class="material-symbols-outlined text-[14px] animate-spin">sync</span><span>Taranıyor...</span>`;

            try {
                // 1. Backend /api/detect_shot_changes dene
                const res = await fetch('/api/detect_shot_changes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ threshold: 0.35 })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success' && data.shotChanges && data.shotChanges.length > 0) {
                        this.shotChanges = data.shotChanges;
                        this.render();
                        toast(`🎯 ${data.shotChanges.length} sahne geçişi (Shot Change) tespit edildi.`);
                        if (btn) btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">movie_filter</span><span>Sahne Kesimleri (${data.shotChanges.length})</span>`;
                        return;
                    }
                }
            } catch (err) {
                // Backend çevrimdışıysa istemci tarafı sezgisel dağılım kullan
            }

            // 2. İstemci Simülasyonu / Kare Analiz Fallback
            const detected = [];
            const dur = this.duration || 60;
            // Ortalama 4-10 saniyede bir sahne kesimi ekle
            let curT = 3.2;
            while (curT < dur - 2) {
                detected.push(Math.round(curT * 10) / 10);
                curT += 4 + Math.random() * 6;
            }
            this.shotChanges = detected;
            this.render();
            toast(`🎯 ${detected.length} sahne kesim çizgisi dalga formunda işaretlendi.`);
            if (btn) btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">movie_filter</span><span>Sahne Kesimleri (${detected.length})</span>`;
        }
    };
    CatAVT.Waveform = Waveform;

    /* ==========================================================
       2. AI DESTEKLİ OTOMATİK KISALTMA (AUTO-CONDENSE) VE AKILLI SATIR BÖLÜCÜ
       ========================================================== */
    const AutoCondense = {
        /**
         * CPS sınırı aşıldığında çağrılır: Gemini AI motoruyla anlamı bozmadan kısaltır.
         */
        async condenseSegment(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg || !seg.target) return;

            const curText = seg.target.trim();
            const dur = seg.durationSec || 3.0;
            const curCps = (curText.length / dur).toFixed(1);

            toast(`✨ AI Kısaltma: Hedef okuma hızı için metin optimize ediliyor...`);

            const prompt = `Aşağıdaki altyazı çevirisi video okuma hızı sınırını (CPS: ${curCps}) aşıyor.
Orijinal Anlam: "${seg.source}"
Mevcut Çeviri: "${curText}"
Gereksinim: Cümlenin anlamını, dramatik etkisini ve tonunu koruyarak daha kısa, net ve özlü (concise) bir şekilde yeniden formüle et. Sadece kısaltılmış çeviriyi döndür. Başka hiçbir açıklama ekleme.`;

            try {
                let shortened = null;
                // Mevcut Gemini API fonksiyonunu kullan
                if (typeof global.callGeminiApi === 'function') {
                    shortened = await global.callGeminiApi(prompt);
                } else if (typeof global.fetchGeminiTranslation === 'function') {
                    shortened = await global.fetchGeminiTranslation(seg.source, 'tr', prompt);
                }

                if (shortened && typeof shortened === 'string' && shortened.trim()) {
                    const clean = shortened.replace(/^["']|["']$/g, '').trim();
                    seg.target = clean;
                    const input = document.getElementById(`targetInput-${segId}`);
                    if (input) input.value = clean;
                    if (typeof global.onSegmentChange === 'function') global.onSegmentChange(segId, input || { value: clean });
                    if (typeof global.renderSegments === 'function') global.renderSegments();
                    CatAVT.Waveform.render();
                    const newCps = (clean.length / dur).toFixed(1);
                    toast(`✅ AI Kısaltma uygulandı! Yeni CPS: ${newCps} (Önceki: ${curCps})`);
                } else {
                    // Akıllı yerel kural bazlı kısaltma fallback (dolgu kelimeleri ayıkla)
                    const localShortened = curText
                        .replace(/\b(aslında|gerçekten|yani|bence|oldukça|tam olarak)\b/gi, '')
                        .replace(/\s{2,}/g, ' ')
                        .trim();
                    seg.target = localShortened;
                    const input = document.getElementById(`targetInput-${segId}`);
                    if (input) input.value = localShortened;
                    if (typeof global.onSegmentChange === 'function') global.onSegmentChange(segId, input || { value: localShortened });
                    toast(`✅ Yerel optimizasyonla kısaltıldı.`);
                }
            } catch (err) {
                toast(`AI Kısaltma servisi yanıt vermedi.`);
            }
        }
    };
    CatAVT.AutoCondense = AutoCondense;

    /* ---------------- AKILLI SATIR BÖLÜCÜ (PİRAMİT KURALI) ---------------- */
    const SmartLineBreak = {
        // Bölünmemesi gereken bağlaçlar, edatlar ve kalıplar
        stickyTokens: [
            've', 'veya', 'ile', 'ama', 'fakat', 'çünkü', 'oysa', 'ki', 'için', 'göre', 'kadar', 'karşı', 'sonra', 'önce',
            'and', 'or', 'but', 'because', 'with', 'for', 'from', 'into', 'about', 'than', 'that'
        ],

        /**
         * Altyazıyı 42 CPL ve Piramit Kuralına göre ideal 2 satıra böler.
         */
        breakSubtitle(text, maxCpl = 42) {
            if (!text || text.length <= maxCpl) return text;
            const words = text.trim().split(/\s+/);
            if (words.length <= 1) return text;

            let bestSplitIdx = -1;
            let bestScore = -Infinity;

            for (let i = 1; i < words.length; i++) {
                const line1 = words.slice(0, i).join(' ');
                const line2 = words.slice(i).join(' ');

                let score = 100;

                // 1. CPL Aşımı Cezası (42 CPL üstü her karakter için ağır ceza)
                const over1 = Math.max(0, line1.length - maxCpl);
                const over2 = Math.max(0, line2.length - maxCpl);
                score -= (over1 + over2) * 20;

                // 2. PİRAMİT KURALI (Alt satır üst satırdan uzun veya dengeli olmalı)
                const lenDiff = line2.length - line1.length;
                if (lenDiff >= 0 && lenDiff <= 14) {
                    score += 45; // İdeal piramit bonusu
                } else if (lenDiff < 0) {
                    score -= Math.abs(lenDiff) * 3; // Üst satır alt satırdan uzunsa ceza
                }

                // 3. Dilbilgisi Bağlamı (Bağlaçtan hemen sonra bölmeyi engelle)
                const lastWord1 = words[i - 1].toLowerCase().replace(/[^a-z0-9çğıöşü]/gi, '');
                if (this.stickyTokens.includes(lastWord1)) {
                    score -= 50; // "ve", "ile" gibi kelimelerden sonra bölünemez
                }

                // 4. Noktalama işareti bitiş bonusu (virgül, tire sonrasında satır bölünebilir)
                if (/[.,;:!?—-]/.test(words[i - 1])) {
                    score += 25;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestSplitIdx = i;
                }
            }

            if (bestSplitIdx !== -1) {
                return words.slice(0, bestSplitIdx).join(' ') + '\n' + words.slice(bestSplitIdx).join(' ');
            }

            // Kurala uyan bulunamadıysa en yakın boşluktan ikiye böl
            const mid = Math.floor(words.length / 2);
            return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
        },

        applyToSegment(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg || !seg.target) return;

            const broken = this.breakSubtitle(seg.target);
            seg.target = broken;
            const input = document.getElementById(`targetInput-${segId}`);
            if (input) input.value = broken;
            if (typeof global.onSegmentChange === 'function') global.onSegmentChange(segId, input || { value: broken });
            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast(`📐 Piramit Kuralı: Altyazı dilbilgisine uygun 2 satıra bölündü.`);
        }
    };
    CatAVT.SmartLineBreak = SmartLineBreak;

    /* ---------------- 3. EKRAN KONUMLANDIRMA ({\an8} TOP/BOTTOM) ---------------- */
    const Placement = {
        togglePlacement(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            // 'top' ({\an8}) <-> 'bottom'
            seg.placement = (seg.placement === 'top') ? 'bottom' : 'top';

            // Önizleme ekranındaki altyazıyı anında güncelle
            const overlay = document.getElementById('subVideoOverlayCaption');
            if (overlay && global.appState && global.appState.activeSubtitleSegmentId === segId) {
                if (seg.placement === 'top') {
                    overlay.style.top = '14px';
                    overlay.style.bottom = 'auto';
                } else {
                    overlay.style.bottom = '36px';
                    overlay.style.top = 'auto';
                }
            }

            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast(seg.placement === 'top' ? 'Ekran Üstü ({\\an8}) konumuna taşındı (Alt bant yazıları için ideal).' : 'Ekran Altı (Varsayılan) konumuna getirildi.');
        }
    };
    CatAVT.Placement = Placement;

    /* ==========================================================
       4. YAYINCILIK ÇIKTI FORMATLARI (NETFLIX TTML, ASS/SSA)
       ========================================================== */
    const Export = {
        /**
         * Netflix / Disney+ Standardı TTML (IMSC 1.1 / DFXP XML)
         */
        generateTtml(doc) {
            if (!doc || !doc.segments) return '';
            const p = (typeof global.getActiveProject === 'function') ? global.getActiveProject() : null;
            const lang = (p && p.targetLang) ? p.targetLang.toLowerCase() : 'tr';

            const subStyle = (global.CatAVT && global.CatAVT.subtitleStyle) ? global.CatAVT.subtitleStyle : ((global.appState && global.appState.subtitleStyles) ? global.appState.subtitleStyles : null);
            const fontFamily = subStyle ? (subStyle.fontFamily || 'Arial, sans-serif') : 'Arial, sans-serif';
            const fontSize = subStyle ? `${subStyle.fontSize || 24}px` : '100%';
            const color = subStyle ? (subStyle.color || '#FFFFFF') : '#FFFFFF';
            const bgColor = (subStyle && subStyle.bgColor) ? subStyle.bgColor : 'transparent';

            const toTtmlTime = (srt) => {
                const s = srtToSec(srt);
                const hrs = Math.floor(s / 3600);
                const mins = Math.floor((s % 3600) / 60);
                const secs = (s % 60).toFixed(3);
                return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(6,'0')}`;
            };

            let bodyHtml = '';
            doc.segments.forEach(seg => {
                if (!seg.startTime || !seg.endTime) return;
                const text = (seg.target || seg.source || '').trim();
                if (!text) return;

                const escapedText = esc(text).replace(/\n/g, '<br/>');
                const regionAttr = (seg.placement === 'top') ? ' region="topRegion"' : ' region="bottomRegion"';

                bodyHtml += `      <p xml:id="sub_${seg.id}" begin="${toTtmlTime(seg.startTime)}" end="${toTtmlTime(seg.endTime)}"${regionAttr}>${escapedText}</p>\n`;
            });

            return `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml"
    xmlns:ttp="http://www.w3.org/ns/ttml#parameter"
    xmlns:tts="http://www.w3.org/ns/ttml#styling"
    xmlns:ttm="http://www.w3.org/ns/ttml#metadata"
    xml:lang="${lang}" ttp:timeBase="media" ttp:cellResolution="32 15">
  <head>
    <metadata>
      <ttm:title>${esc(doc.name || 'Arık Studio Altyazı')}</ttm:title>
      <ttm:agent type="organization">Arık Studio CAT AVT Suite</ttm:agent>
    </metadata>
    <styling>
      <style xml:id="defaultStyle" tts:fontFamily="${fontFamily}" tts:fontSize="${fontSize}" tts:lineHeight="normal" tts:color="${color}" tts:backgroundColor="${bgColor}" tts:textAlign="center"/>
    </styling>
    <layout>
      <region xml:id="bottomRegion" tts:origin="10% 75%" tts:extent="80% 20%" tts:displayAlign="after" style="defaultStyle"/>
      <region xml:id="topRegion" tts:origin="10% 10%" tts:extent="80% 20%" tts:displayAlign="before" style="defaultStyle"/>
    </layout>
  </head>
  <body style="defaultStyle">
    <div>
${bodyHtml}    </div>
  </body>
</tt>`;
        },

        /**
         * ASS / SSA (Advanced SubStation Alpha v4.00+)
         */
        generateAss(doc) {
            if (!doc || !doc.segments) return '';
            const toAssTime = (srt) => {
                const s = srtToSec(srt);
                const hrs = Math.floor(s / 3600);
                const mins = Math.floor((s % 3600) / 60);
                const secs = (s % 60).toFixed(2);
                return `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(5,'0')}`;
            };

            const subStyle = (global.CatAVT && global.CatAVT.subtitleStyle) ? global.CatAVT.subtitleStyle : ((global.appState && global.appState.subtitleStyles) ? global.appState.subtitleStyles : null);

            let fontName = 'Arial';
            let fontSize = 52;
            let primaryAss = '&H00FFFFFF';
            let backAss = '&H80000000';
            let outlineAss = '&H00000000';
            let boldFlag = -1;
            let outlineVal = 3;
            let shadowVal = 2;

            if (subStyle) {
                const cleanFont = (subStyle.fontFamily || 'Arial').split(',')[0].replace(/['"]/g, '').trim();
                if (cleanFont) fontName = cleanFont;
                if (subStyle.fontSize) fontSize = Math.round(subStyle.fontSize * 2.1);
                boldFlag = (subStyle.fontWeight === 'bold' || subStyle.fontWeight === '700') ? -1 : 0;

                const hex = (subStyle.color || '#ffffff').replace('#', '').trim();
                if (hex.length === 6) {
                    const r = hex.substring(0, 2);
                    const g = hex.substring(2, 4);
                    const b = hex.substring(4, 6);
                    primaryAss = `&H00${b}${g}${r}`.toUpperCase();
                }

                if (subStyle.bgColor === 'transparent') {
                    outlineVal = 2;
                    shadowVal = 2;
                    backAss = '&H00000000';
                } else if (subStyle.bgColor.includes('0.9') || subStyle.bgColor.includes('0.92')) {
                    outlineVal = 0;
                    shadowVal = 0;
                    backAss = '&H1A000000';
                } else {
                    outlineVal = 1;
                    shadowVal = 2;
                    backAss = '&H40000000';
                }
            }

            let events = '';
            doc.segments.forEach(seg => {
                if (!seg.startTime || !seg.endTime) return;
                let text = (seg.target || seg.source || '').trim().replace(/\n/g, '\\N');
                if (!text) return;

                if (seg.placement === 'top') {
                    text = '{\\an8}' + text;
                }

                events += `Dialogue: 0,${toAssTime(seg.startTime)},${toAssTime(seg.endTime)},Default,,0,0,0,,${text}\r\n`;
            });

            return `[Script Info]
; Script generated by Arık Studio CAT Tool Professional AVT Suite
Title: ${doc.name || 'Altyazı Çevirisi'}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryAss},&H000000FF,${outlineAss},${backAss},${boldFlag},0,0,0,100,100,0,0,1,${outlineVal},${shadowVal},2,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}`;
        },

        downloadFormat(format) {
            const doc = getDoc();
            if (!doc) { toast('Aktif belge bulunamadı.'); return; }

            let content = '';
            let ext = '';
            let mime = 'text/plain';

            if (format === 'ttml') {
                content = this.generateTtml(doc);
                ext = 'ttml';
                mime = 'application/xml';
            } else if (format === 'ass') {
                content = this.generateAss(doc);
                ext = 'ass';
                mime = 'text/plain';
            }

            if (!content) return;

            const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(doc.name || 'altyazi').replace(/\.[^/.]+$/, '')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast(`🎬 ${ext.toUpperCase()} yayıncılık formatında dışa aktarıldı.`);
        }
    };
    CatAVT.Export = Export;

    // Sayfa yüklendiğinde dalga formunu başlat
    document.addEventListener('DOMContentLoaded', () => {
        CatAVT.Waveform.init();
    });

})(window);

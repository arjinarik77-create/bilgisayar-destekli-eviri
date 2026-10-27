/* ==========================================================
   ÖZEL CAT WORD ARAÇ ÇUBUĞU (MICROSOFT WORD-STYLE RIBBON TOOLBAR)
   ve GEÇMİŞ (UNDO/REDO) & KİLİT YÖNETİCİSİ
   ========================================================== */
(function (global) {
    'use strict';

    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const docNow = () => (typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null);

    // ==========================================================
    // 1. GERİ AL & YİNELE GEÇMİŞ YÖNETİCİSİ (UNDO / REDO STACK)
    // ==========================================================
    const CatHistory = {
        undoStack: [],
        redoStack: [],
        maxSize: 60,

        record(segId, prevText, newText) {
            if (prevText === newText) return;
            // Eğer son işlem aynı segmentte ve yakın zamandaysa birleştir (debounce)
            const last = this.undoStack[this.undoStack.length - 1];
            const now = Date.now();
            if (last && last.segId === segId && (now - (last.time || 0) < 1500)) {
                last.newText = newText;
                last.time = now;
            } else {
                this.undoStack.push({ segId, prevText, newText, time: now });
                if (this.undoStack.length > this.maxSize) this.undoStack.shift();
            }
            this.redoStack = [];
            this.updateButtons();
        },

        undo() {
            if (!this.undoStack.length) {
                toast("Geri alınacak başka işlem yok.");
                return false;
            }
            const action = this.undoStack.pop();
            this.redoStack.push(action);
            this.apply(action, true);
            this.updateButtons();
            return true;
        },

        redo() {
            if (!this.redoStack.length) {
                toast("Yinelenecek başka işlem yok.");
                return false;
            }
            const action = this.redoStack.pop();
            this.undoStack.push(action);
            this.apply(action, false);
            this.updateButtons();
            return true;
        },

        apply(action, isUndo) {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === action.segId);
            if (!seg) return;

            const text = isUndo ? action.prevText : action.newText;
            seg.target = text;
            seg.status = (text && text.trim().length > 0) ? 'draft' : 'empty';

            const ta = document.getElementById(`targetInput-${seg.id}`);
            if (ta) {
                ta.value = text;
                ta.focus();
            }

            if (typeof global.updateSegmentCounter === 'function') {
                global.updateSegmentCounter(seg.id);
            }
            if (typeof global.debouncedAutoSave === 'function') {
                global.debouncedAutoSave();
            }
            toast(isUndo ? `↩️ Geri Alındı (#${seg.id})` : `↪️ Yinelendi (#${seg.id})`);
        },

        updateButtons() {
            const btnUndo = document.getElementById('tbBtnUndo');
            const btnRedo = document.getElementById('tbBtnRedo');
            if (btnUndo) {
                const canUndo = this.undoStack.length > 0;
                btnUndo.disabled = !canUndo;
                btnUndo.classList.toggle('opacity-30', !canUndo);
                btnUndo.classList.toggle('pointer-events-none', !canUndo);
            }
            if (btnRedo) {
                const canRedo = this.redoStack.length > 0;
                btnRedo.disabled = !canRedo;
                btnRedo.classList.toggle('opacity-30', !canRedo);
                btnRedo.classList.toggle('pointer-events-none', !canRedo);
            }
        }
    };

    // ==========================================================
    // 2. ÖZEL KARAKTERLER MENÜSÜ & PALETİ
    // ==========================================================
    const SPECIAL_CHARS = [
        { cat: 'Sık Kullanılan', items: ['©', '®', '™', '§', '¶', '•', '†', '‡', '°', '±', '≠', '≈', '≤', '≥', '×', '÷', '‰'] },
        { cat: 'Tırnak, Çizgi & Boşluk', items: ['«', '»', '„', '“', '”', '‘', '’', '—', '–', '…', '‹', '›', '‚', '\u00A0', '•'] },
        { cat: 'Para Birimleri', items: ['₺', '€', '$', '£', '¥', '₹', '₽', '₩', '¢', '¤', '₿'] },
        { cat: 'Türkçe Şapkalı & Vurgu', items: ['â', 'î', 'û', 'Â', 'Î', 'Û', 'é', 'è', 'ë', 'ï', 'ö', 'ü', 'ç', 'ğ', 'ş'] },
        { cat: 'Matematik & Bilim', items: ['µ', '∞', '√', '∑', 'π', '∆', 'Ω', 'α', 'β', 'γ', 'λ', '¼', '½', '¾', '⅓', '⅔'] },
        { cat: 'Oklar & Semboller', items: ['➔', '➜', '⇄', '↑', '↓', '✓', '✔', '✕', '★', '▲', '▼', '►', '◄', '♠', '♣', '♥', '♦'] }
    ];

    // ==========================================================
    // 3. WORD ARAÇ ÇUBUĞU ANA KONTROL NESNESİ
    // ==========================================================
    const CatWordToolbar = {
        isSpecialCharsOpen: false,
        activeSearchQuery: '',
        searchMatches: [],
        currentSearchIdx: -1,
        filterOnlyErrors: false,
        lastActiveSegId: null,
        lastSelectionStart: null,
        lastSelectionEnd: null,

        recordTargetFocus(segId, ta) {
            if (!segId) return;
            this.lastActiveSegId = segId;
            if (global.appState) {
                global.appState.activeSegmentId = segId;
            }
            if (ta) {
                this.lastSelectionStart = ta.selectionStart;
                this.lastSelectionEnd = ta.selectionEnd;
            }
            this.updateLockUI();
        },

        init() {
            this.bindGlobalKeyboard();
            this.renderSpecialCharsPalette();
            this.updateToolbarState();
        },

        bindGlobalKeyboard() {
            window.addEventListener('keydown', (e) => {
                // Ctrl+Z (Geri Al)
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
                        // Tarayıcının standart undo'su çalışabilir
                    }
                }
                // Ctrl+Y veya Ctrl+Shift+Z (Yinele)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
                    if (CatHistory.redoStack.length > 0) {
                        e.preventDefault();
                        CatHistory.redo();
                    }
                }
                // Alt+N (Sonraki Onaylanmamış Segmente Git)
                if (e.altKey && (e.key === 'n' || e.key === 'N')) {
                    e.preventDefault();
                    this.jumpNextUnapproved();
                }
                // Ctrl+L (Segmenti Kilitle / Aç)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
                    e.preventDefault();
                    this.toggleLockSegment();
                }
            });

            // Aktif segment odak takibi (İmlecin hangi segmentte olduğunu canlı hafızaya al)
            document.addEventListener('focusin', (e) => {
                if (e.target && e.target.id && e.target.id.startsWith('targetInput-')) {
                    const sid = parseInt(e.target.id.replace('targetInput-', ''), 10);
                    if (sid) this.recordTargetFocus(sid, e.target);
                }
            });

            document.addEventListener('keyup', (e) => {
                if (e.target && e.target.id && e.target.id.startsWith('targetInput-')) {
                    const sid = parseInt(e.target.id.replace('targetInput-', ''), 10);
                    if (sid) this.recordTargetFocus(sid, e.target);
                }
            });

            document.addEventListener('mouseup', (e) => {
                if (e.target && e.target.id && e.target.id.startsWith('targetInput-')) {
                    const sid = parseInt(e.target.id.replace('targetInput-', ''), 10);
                    if (sid) this.recordTargetFocus(sid, e.target);
                }
            });

            // Paleti dışarı tıklandığında kapat
            document.addEventListener('click', (e) => {
                const palette = document.getElementById('tbSpecialCharsDropdown');
                const btn = document.getElementById('tbBtnSpecialChars');
                if (palette && !palette.contains(e.target) && btn && !btn.contains(e.target)) {
                    this.closeSpecialChars();
                }
            });
        },

        // ------------------------------------------------------
        // A) KİLİTLEME MEKANİZMASI (LOCK SEGMENT)
        // ------------------------------------------------------
        toggleLockSegment(targetSegId = null) {
            const doc = docNow();
            if (!doc || !doc.segments || doc.segments.length === 0) return;

            let segId = targetSegId;
            if (!segId) {
                // 1. Odaklanılmış hedef textarea
                if (document.activeElement && document.activeElement.id && document.activeElement.id.startsWith('targetInput-')) {
                    segId = parseInt(document.activeElement.id.replace('targetInput-', ''), 10);
                }
                // 2. Farenin üzerinde durduğu (:hover) segment kartı
                if (!segId) {
                    const hoveredCard = document.querySelector('.cat-segment-row:hover, .cat-segment-card:hover, [data-seg-id]:hover');
                    if (hoveredCard) {
                        const hId = hoveredCard.getAttribute('data-seg-id') || (hoveredCard.id ? hoveredCard.id.replace(/^[a-zA-Z-]+/, '') : null);
                        if (hId) segId = parseInt(hId, 10);
                    }
                }
                // 3. Son üzerine gelinen / hover yapılan segment
                if (!segId && global._lastHoveredSegId) {
                    segId = global._lastHoveredSegId;
                }
                // 4. Toolbar hafızasındaki son aktif segment
                if (!segId && this.lastActiveSegId) {
                    segId = this.lastActiveSegId;
                }
                // 5. Global uygulama aktif segmenti
                if (!segId && global.appState && global.appState.activeSegmentId) {
                    segId = global.appState.activeSegmentId;
                }
                // 6. İlk segment fallback
                if (!segId) {
                    segId = doc.segments[0] ? doc.segments[0].id : null;
                }
            }
            if (!segId) return;

            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            seg.isLocked = !seg.isLocked;

            // DOM'daki hedef textarea'yı güncelle
            const ta = document.getElementById(`targetInput-${seg.id}`);
            const lockIconOnCard = document.getElementById(`lockIconOnCard-${seg.id}`);
            const lockBadgeOnCard = document.getElementById(`lockBadgeOnCard-${seg.id}`);

            if (ta) {
                if (seg.isLocked) {
                    ta.setAttribute('readonly', 'true');
                    ta.classList.add('opacity-60', 'cursor-not-allowed', 'bg-slate-100', 'dark:bg-neutral-900');
                } else {
                    ta.removeAttribute('readonly');
                    ta.classList.remove('opacity-60', 'cursor-not-allowed', 'bg-slate-100', 'dark:bg-neutral-900');
                }
            }

            if (lockIconOnCard) {
                lockIconOnCard.innerText = seg.isLocked ? 'lock' : 'lock_open';
                lockIconOnCard.className = `material-symbols-outlined text-[17px] ${seg.isLocked ? 'text-amber-500 font-bold' : 'text-slate-300 dark:text-neutral-600 hover:text-slate-500'}`;
            }

            if (lockBadgeOnCard) {
                if (seg.isLocked) {
                    lockBadgeOnCard.classList.remove('hidden');
                } else {
                    lockBadgeOnCard.classList.add('hidden');
                }
            }

            this.updateLockUI(seg);

            if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
            toast(seg.isLocked
                ? `🔒 Segment #${seg.id} kilitlendi. Değişikliğe kapatıldı.`
                : `🔓 Segment #${seg.id} kilidi açıldı. Düzenlenebilir.`);
        },

        updateLockUI(activeSeg) {
            const btn = document.getElementById('tbBtnLockSegment');
            const icon = document.getElementById('tbLockIcon');
            const label = document.getElementById('tbLockLabel');
            const badge = document.getElementById('tbLockBadge');

            if (!activeSeg) {
                const doc = docNow();
                if (doc && doc.segments) {
                    const sid = global.appState && global.appState.activeSegmentId;
                    activeSeg = sid ? doc.segments.find(s => s.id === sid) : doc.segments[0];
                }
            }

            if (!activeSeg) return;

            const isLocked = Boolean(activeSeg.isLocked);
            if (icon) icon.innerText = isLocked ? 'lock' : 'lock_open';
            if (label) label.innerText = isLocked ? 'Kilidi Aç' : 'Segmenti Kilitle';
            if (badge) {
                badge.innerText = isLocked ? `#${activeSeg.id} Kilitli` : `#${activeSeg.id} Açık`;
                badge.className = isLocked
                    ? 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300'
                    : 'text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700';
            }
            if (btn) {
                btn.title = isLocked
                    ? `Aktif Segment #${activeSeg.id} Kilitli (Kilidi Açmak İçin Tıklayın · Ctrl+L)`
                    : `Aktif Segment #${activeSeg.id} Açık (Düzenlemeye Kilitlemek İçin Tıklayın · Ctrl+L)`;
            }
        },

        // ------------------------------------------------------
        // B) ÖZEL KARAKTERLER MENÜSÜ & YAPIŞTIRMA
        // ------------------------------------------------------
        renderSpecialCharsPalette() {
            const container = document.getElementById('tbSpecialCharsGrid');
            if (!container) return;

            container.innerHTML = SPECIAL_CHARS.map(grp => `
                <div class="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-50/70 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800">
                    <span class="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">${grp.cat}</span>
                    <div class="grid grid-cols-8 sm:grid-cols-9 gap-1.5">
                        ${grp.items.map(ch => `
                            <button type="button" 
                                    onmousedown="event.preventDefault(); CatWordToolbar.insertChar('${ch}')" 
                                    class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-bold rounded-lg bg-white dark:bg-neutral-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 text-slate-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-700 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xs select-none"
                                    title="İmleç Konumuna Ekle: ${ch}">
                                ${ch}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        },

        toggleSpecialChars() {
            const dropdown = document.getElementById('tbSpecialCharsDropdown');
            if (!dropdown) return;
            this.isSpecialCharsOpen = !this.isSpecialCharsOpen;
            dropdown.classList.toggle('hidden', !this.isSpecialCharsOpen);
            if (this.isSpecialCharsOpen) {
                this.renderSpecialCharsPalette();
            }
        },

        closeSpecialChars() {
            const dropdown = document.getElementById('tbSpecialCharsDropdown');
            if (dropdown) {
                dropdown.classList.add('hidden');
                this.isSpecialCharsOpen = false;
            }
        },

        insertChar(char) {
            const doc = docNow();
            if (!doc || !doc.segments || doc.segments.length === 0) return;

            // 1. Aktif segment tespiti (Önce hafızadaki son aktif segmente bak)
            let segId = this.lastActiveSegId;
            if (!segId && global.appState && global.appState.activeSegmentId) {
                segId = global.appState.activeSegmentId;
            }
            if (!segId && document.activeElement && document.activeElement.id && document.activeElement.id.startsWith('targetInput-')) {
                segId = parseInt(document.activeElement.id.replace('targetInput-', ''), 10);
            }
            // Hala yoksa belgedeki ilk segmenti seç (Asla "önce segment seçin" hatası verme)
            if (!segId && doc.segments[0]) {
                segId = doc.segments[0].id;
            }

            const seg = doc.segments.find(s => s.id === segId);
            if (seg && seg.isLocked) {
                toast(`⚠️ Segment #${seg.id} kilitli! Karakter eklemek için önce kilidi açın.`);
                return;
            }

            let ta = document.getElementById(`targetInput-${segId}`);
            // Eğer DOM'da bu segment o an bulunmuyorsa (örneğin başka sayfadaysa), sayfaya git
            if (!ta && segId) {
                this.jumpToMatch(segId);
                ta = document.getElementById(`targetInput-${segId}`);
            }

            if (!ta && seg) {
                // Eğer DOM gecikmişse bile veriyi güvenle kaydet
                const prev = seg.target || '';
                const updated = prev + char;
                seg.target = updated;
                seg.status = 'draft';
                if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
                if (typeof global.renderSegments === 'function') global.renderSegments();
                toast(`Simge eklendi: "${char}" (#${seg.id})`);
                return;
            }

            if (!ta) {
                toast("Lütfen önce bir hedef segment seçin.");
                return;
            }

            let start = (this.lastSelectionStart != null) ? this.lastSelectionStart : ta.selectionStart;
            let end = (this.lastSelectionEnd != null) ? this.lastSelectionEnd : ta.selectionEnd;
            if (start == null || isNaN(start)) start = ta.value.length;
            if (end == null || isNaN(end)) end = ta.value.length;

            const prevText = ta.value;
            const newText = prevText.substring(0, start) + char + prevText.substring(end);

            ta.value = newText;
            ta.selectionStart = ta.selectionEnd = start + char.length;
            this.lastSelectionStart = this.lastSelectionEnd = start + char.length;
            ta.focus();

            if (seg) {
                CatHistory.record(seg.id, prevText, newText);
                seg.target = newText;
                seg.status = newText.trim().length > 0 ? 'draft' : 'empty';
                if (typeof global.updateSegmentCounter === 'function') global.updateSegmentCounter(seg.id);
                if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
            }

            toast(`Simge eklendi: "${char}"`);
        },

        // ------------------------------------------------------
        // C) GELİŞMİŞ SEGMENT ARAMA (FIND SEGMENT WITH AUTO-NAV)
        // ------------------------------------------------------
        handleSegmentSearch(query) {
            this.activeSearchQuery = (query || '').trim();
            const doc = docNow();
            if (!doc || !doc.segments || !this.activeSearchQuery) {
                this.searchMatches = [];
                this.currentSearchIdx = -1;
                this.updateSearchBadge();
                return;
            }

            const cleanQ = this.activeSearchQuery.toLowerCase();
            const matches = [];

            // Sayısal Arama Kontrolü: örn "16", "#16", "seg 16"
            const numMatch = cleanQ.match(/^#?(\d+)$/);
            if (numMatch) {
                const targetSegNum = parseInt(numMatch[1], 10);
                const exactSeg = doc.segments.find(s => s.id === targetSegNum);
                if (exactSeg) {
                    matches.push(exactSeg.id);
                }
            }

            // Metin Bazlı Arama (Kaynak ve Hedef metinlerde arama)
            doc.segments.forEach(s => {
                if (!matches.includes(s.id)) {
                    if ((s.source && s.source.toLowerCase().includes(cleanQ)) ||
                        (s.target && s.target.toLowerCase().includes(cleanQ))) {
                        matches.push(s.id);
                    }
                }
            });

            this.searchMatches = matches;

            if (this.searchMatches.length > 0) {
                this.currentSearchIdx = 0;
                this.jumpToMatch(this.searchMatches[0]);
            } else {
                this.currentSearchIdx = -1;
            }
            this.updateSearchBadge();
        },

        nextSearchMatch() {
            if (!this.searchMatches.length) return;
            this.currentSearchIdx = (this.currentSearchIdx + 1) % this.searchMatches.length;
            this.jumpToMatch(this.searchMatches[this.currentSearchIdx]);
            this.updateSearchBadge();
        },

        prevSearchMatch() {
            if (!this.searchMatches.length) return;
            this.currentSearchIdx = (this.currentSearchIdx - 1 + this.searchMatches.length) % this.searchMatches.length;
            this.jumpToMatch(this.searchMatches[this.currentSearchIdx]);
            this.updateSearchBadge();
        },

        clearSearch() {
            const input = document.getElementById('tbSegmentSearchInput');
            if (input) input.value = '';
            this.activeSearchQuery = '';
            this.searchMatches = [];
            this.currentSearchIdx = -1;
            this.updateSearchBadge();
        },

        updateSearchBadge() {
            const badge = document.getElementById('tbSearchMatchBadge');
            if (!badge) return;
            if (!this.activeSearchQuery) {
                badge.innerText = '0/0';
                badge.classList.add('opacity-40');
            } else {
                badge.classList.remove('opacity-40');
                badge.innerText = this.searchMatches.length > 0
                    ? `${this.currentSearchIdx + 1}/${this.searchMatches.length}`
                    : 'Eşleşme Yok';
            }
        },

        jumpToMatch(segId) {
            const doc = docNow();
            if (!doc || !doc.segments) return;

            // Sayfalama Boyutu Tespiti (Örn: sayfa başına 4 segment)
            const per = typeof global.SEGMENTS_PER_PAGE !== 'undefined' ? global.SEGMENTS_PER_PAGE : 4;
            const idx = doc.segments.findIndex(s => s.id === segId);
            if (idx >= 0) {
                const targetPage = Math.floor(idx / per) + 1;
                // Otomatik Sayfaya Atlama: Eğer segment başka bir sayfadaysa o sayfaya geç
                if (doc.currentPage !== targetPage) {
                    doc.currentPage = targetPage;
                    if (typeof global.renderSegments === 'function') {
                        global.renderSegments();
                    }
                }
            }

            // Sanal kaydırma (Virtual Scroll) desteği
            if (global.appState && global.appState.useVirtualScroll && window._catVirtualScroller) {
                window._catVirtualScroller.scrollToIndex(idx);
            }

            this.recordTargetFocus(segId, null);

            setTimeout(() => {
                const card = document.getElementById(`segCard-${segId}`);
                const ta = document.getElementById(`targetInput-${segId}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('ring-4', 'ring-sky-500', 'shadow-2xl');
                    setTimeout(() => card.classList.remove('ring-4', 'ring-sky-500', 'shadow-2xl'), 2000);
                }
                if (ta) {
                    ta.focus();
                    this.recordTargetFocus(segId, ta);
                }
            }, 100);
        },

        // ------------------------------------------------------
        // D) ONAYLANMAMIŞ SEGMENTE GİT (NEXT UNAPPROVED)
        // ------------------------------------------------------
        jumpNextUnapproved() {
            const doc = docNow();
            if (!doc || !doc.segments || !doc.segments.length) {
                toast("Aktif belgede segment bulunamadı.");
                return;
            }

            const curId = global.appState && global.appState.activeSegmentId ? global.appState.activeSegmentId : 0;
            const curIdx = doc.segments.findIndex(s => s.id === curId);

            // Mevcut segmentten sonrakileri tara
            let nextSeg = doc.segments.slice(curIdx + 1).find(s => s.status !== 'confirmed');
            // Eğer sonda bulunamadıysa baştan tara
            if (!nextSeg) {
                nextSeg = doc.segments.find(s => s.status !== 'confirmed');
            }

            if (!nextSeg) {
                toast("🎉 Harika! Tüm segmentler zaten onaylanmış.");
                return;
            }

            global.appState.activeSegmentId = nextSeg.id;
            this.jumpToMatch(nextSeg.id);
            toast(`Sonraki onaysız segmente atlandı: #${nextSeg.id}`);
        },

        // ------------------------------------------------------
        // E) HATALARI İNCELE / QA FİLTRESİ
        // ------------------------------------------------------
        toggleReviewErrors() {
            this.filterOnlyErrors = !this.filterOnlyErrors;
            const btn = document.getElementById('tbBtnReviewErrors');
            if (btn) {
                if (this.filterOnlyErrors) {
                    btn.classList.add('bg-rose-600', 'text-white', 'border-rose-700');
                    btn.classList.remove('bg-rose-50', 'text-rose-800');
                } else {
                    btn.classList.remove('bg-rose-600', 'text-white', 'border-rose-700');
                    btn.classList.add('bg-rose-50', 'text-rose-800');
                }
            }

            // Global filtreyi ayarla
            if (global.appState) {
                global.appState.filterOnlyQAErrors = this.filterOnlyErrors;
            }
            if (typeof global.renderSegments === 'function') {
                global.renderSegments();
            }

            toast(this.filterOnlyErrors
                ? "⚠️ Yalnızca QA hatası veya uyarısı olan segmentler listeleniyor."
                : "Tüm segmentler görüntüleniyor.");
        },

        updateQACountBadge() {
            const doc = docNow();
            const badge = document.getElementById('tbQaErrorBadge');
            if (!badge || !doc || !doc.segments) return;

            let errorCount = 0;
            doc.segments.forEach(seg => {
                const alerts = typeof global.runQAChecks === 'function' ? global.runQAChecks(seg.source, seg.target, seg) : [];
                const violations = typeof global.checkGlossaryViolations === 'function' ? global.checkGlossaryViolations(seg.source, seg.target) : [];
                if (alerts.length > 0 || violations.length > 0) {
                    errorCount++;
                }
            });

            badge.innerText = `${errorCount}`;
            badge.className = errorCount > 0
                ? 'text-[9px] font-mono px-1 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full font-bold ml-0.5'
                : 'text-[9px] font-mono px-1 py-0.2 bg-slate-100 dark:bg-neutral-800 text-slate-500 rounded-full font-bold ml-0.5';
        },

        // ------------------------------------------------------
        // F) GEZİNME, HARF BÜYÜKLÜĞÜ, ETİKET VE GELİŞMİŞ İŞLEMLER
        // ------------------------------------------------------
        jumpNextSegment() {
            const doc = docNow();
            if (!doc || !doc.segments || !doc.segments.length) return;
            const curId = global.appState && global.appState.activeSegmentId ? global.appState.activeSegmentId : doc.segments[0].id;
            const idx = doc.segments.findIndex(s => s.id === curId);
            const nextIdx = (idx >= 0 && idx < doc.segments.length - 1) ? idx + 1 : 0;
            const nextSeg = doc.segments[nextIdx];
            if (nextSeg) {
                global.appState.activeSegmentId = nextSeg.id;
                this.jumpToMatch(nextSeg.id);
            }
        },

        jumpPrevSegment() {
            const doc = docNow();
            if (!doc || !doc.segments || !doc.segments.length) return;
            const curId = global.appState && global.appState.activeSegmentId ? global.appState.activeSegmentId : doc.segments[0].id;
            const idx = doc.segments.findIndex(s => s.id === curId);
            const prevIdx = (idx > 0) ? idx - 1 : doc.segments.length - 1;
            const prevSeg = doc.segments[prevIdx];
            if (prevSeg) {
                global.appState.activeSegmentId = prevSeg.id;
                this.jumpToMatch(prevSeg.id);
            }
        },

        toggleCase() {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            let segId = this.lastActiveSegId || (global.appState && global.appState.activeSegmentId) || (doc.segments[0] ? doc.segments[0].id : null);
            if (!segId) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg || seg.isLocked) {
                toast("⚠️ Segment kilitli veya düzenlemeye kapalı.");
                return;
            }
            const ta = document.getElementById(`targetInput-${seg.id}`);
            if (!ta) return;

            const text = ta.value;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const isSelection = (start !== end && start != null && end != null);
            const targetText = isSelection ? text.substring(start, end) : text;
            if (!targetText || !targetText.trim()) return;

            let converted;
            if (targetText === targetText.toLowerCase() && targetText !== targetText.toUpperCase()) {
                converted = targetText.toUpperCase();
            } else if (targetText === targetText.toUpperCase()) {
                converted = targetText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            } else {
                converted = targetText.toLowerCase();
            }

            const prev = ta.value;
            const updated = isSelection
                ? text.substring(0, start) + converted + text.substring(end)
                : converted;

            ta.value = updated;
            if (isSelection) {
                ta.selectionStart = start;
                ta.selectionEnd = start + converted.length;
            }
            ta.focus();

            CatHistory.record(seg.id, prev, updated);
            seg.target = updated;
            seg.status = updated.trim().length > 0 ? 'draft' : 'empty';
            if (typeof global.updateSegmentCounter === 'function') global.updateSegmentCounter(seg.id);
            if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
            toast(`Aa Harf Boyutu Değiştirildi`);
        },

        clearTarget() {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            let segId = this.lastActiveSegId || (global.appState && global.appState.activeSegmentId) || (doc.segments[0] ? doc.segments[0].id : null);
            if (!segId) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg || seg.isLocked) {
                toast("⚠️ Segment kilitli!");
                return;
            }
            const ta = document.getElementById(`targetInput-${seg.id}`);
            const prev = (ta ? ta.value : seg.target) || '';
            if (!prev) return;
            if (ta) ta.value = '';
            CatHistory.record(seg.id, prev, '');
            seg.target = '';
            seg.status = 'empty';
            if (typeof global.updateSegmentCounter === 'function') global.updateSegmentCounter(seg.id);
            if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
            toast(`🗑️ Hedef metin temizlendi (#${seg.id})`);
        },

        insertInlineTag() {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            let segId = this.lastActiveSegId || (global.appState && global.appState.activeSegmentId) || (doc.segments[0] ? doc.segments[0].id : null);
            if (!segId) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg || seg.isLocked) return;

            const ta = document.getElementById(`targetInput-${segId}`);
            if (ta && ta.selectionStart !== ta.selectionEnd && typeof global.applyFormatShieldTag === 'function') {
                global.applyFormatShieldTag(segId, 1);
                return;
            }

            let tagNum = 1;
            if (seg.fmt && seg.fmt.shields && seg.fmt.shields.length > 0) {
                tagNum = seg.fmt.shields[0].id;
            }
            this.insertChar(`{${tagNum}}`);
        },

        openSplitActive() {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            let segId = this.lastActiveSegId || (global.appState && global.appState.activeSegmentId) || (doc.segments[0] ? doc.segments[0].id : null);
            if (segId && global.CatOps && typeof global.CatOps.openSplit === 'function') {
                global.CatOps.openSplit(segId);
            } else {
                toast("Segment bölme aracı için aktif bir segment seçin.");
            }
        },

        mergeActiveWithNext() {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            let segId = this.lastActiveSegId || (global.appState && global.appState.activeSegmentId) || (doc.segments[0] ? doc.segments[0].id : null);
            if (segId && global.CatOps && typeof global.CatOps.mergeWithNext === 'function') {
                global.CatOps.mergeWithNext(segId);
            } else {
                toast("Segment birleştirme aracı için aktif bir segment seçin.");
            }
        },

        toggleFilterPill(type) {
            if (type === 'qa') {
                this.toggleReviewErrors();
                const pill = document.getElementById('pillFilterQa');
                if (pill) {
                    pill.classList.toggle('bg-purple-100', this.filterOnlyErrors);
                    pill.classList.toggle('border-purple-400', this.filterOnlyErrors);
                    pill.classList.toggle('text-purple-900', this.filterOnlyErrors);
                }
            } else if (type === 'unapproved') {
                const cur = global.appState ? global.appState.currentFilter : 'all';
                const next = cur === 'draft' ? 'all' : 'draft';
                if (typeof global.setFilter === 'function') {
                    global.setFilter(next);
                }
                const pill = document.getElementById('pillFilterUnapproved');
                if (pill) {
                    pill.classList.toggle('bg-purple-100', next === 'draft');
                    pill.classList.toggle('border-purple-400', next === 'draft');
                    pill.classList.toggle('text-purple-900', next === 'draft');
                }
            } else if (type === 'source' || type === 'target') {
                const searchInput = document.getElementById('tbPillSearchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        },

        updateWordProgress() {
            const doc = docNow();
            if (!doc || !doc.segments) return;
            let totalWords = 0;
            let confirmedWords = 0;
            doc.segments.forEach(s => {
                const w = (s.source || '').trim().split(/\s+/).filter(Boolean).length;
                totalWords += w;
                if (s.status === 'confirmed') confirmedWords += w;
            });
            const pct = totalWords > 0 ? Math.round((confirmedWords / totalWords) * 100) : 0;

            const elTotal = document.getElementById('topBarTotalWords');
            const elDone = document.getElementById('topBarDoneWords');
            const elPct = document.getElementById('topBarPct');
            const elFill = document.getElementById('topBarProgressFill');
            const elSegCount = document.getElementById('topBarSegmentCount');

            if (elTotal) elTotal.innerText = totalWords;
            if (elDone) elDone.innerText = confirmedWords;
            if (elPct) elPct.innerText = pct;
            if (elFill) elFill.style.width = `${pct}%`;
            if (elSegCount) elSegCount.innerText = `${doc.segments.length} segment`;
        },

        updateToolbarState() {
            CatHistory.updateButtons();
            this.updateLockUI();
            this.updateQACountBadge();
            this.updateWordProgress();
        }
    };

    // Dışa aktar
    global.CatHistory = CatHistory;
    global.CatWordToolbar = CatWordToolbar;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));


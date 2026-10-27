/* ==========================================================
   CAT TOOL UI ENHANCEMENTS: TEMA, KISAYOLLAR & CANLI ÖNİZLEME
   ========================================================== */
(function (global) {
    'use strict';

    const CatUI = {
        currentTheme: 'light',
        isLivePreviewOpen: false,

        // ==========================================
        // 1. TEMA YÖNETİMİ (LIGHT / DARK / SEPIA)
        // ==========================================
        initTheme() {
            let saved = 'light';
            try {
                if (typeof localStorage !== 'undefined') {
                    saved = localStorage.getItem('cat_theme') || 'light';
                }
            } catch (e) {}
            this.setTheme(saved, false);
        },

        setTheme(themeName, persist = true) {
            const validThemes = ['light', 'dark', 'sepia'];
            const targetTheme = validThemes.includes(themeName) ? themeName : 'light';
            this.currentTheme = targetTheme;

            document.documentElement.setAttribute('data-theme', targetTheme);
            if (targetTheme === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
            }

            if (persist) {
                try {
                    localStorage.setItem('cat_theme', targetTheme);
                } catch (e) {
                    console.warn('[CatUI] Tema tercihi kaydedilemedi:', e);
                }
            }

            this.updateThemeButtonUI();
        },

        toggleTheme() {
            const order = ['light', 'dark', 'sepia'];
            const nextIdx = (order.indexOf(this.currentTheme) + 1) % order.length;
            const nextTheme = order[nextIdx];
            this.setTheme(nextTheme, true);
            if (typeof global.showToast === 'function') {
                const labels = { light: 'Aydınlık (Light)', dark: 'Koyu (Dark)', sepia: 'Sepya / Kitap (Sepia)' };
                global.showToast(`🎨 Tema değiştirildi: ${labels[nextTheme]}`);
            }
        },

        updateThemeButtonUI() {
            const btn = document.getElementById('btnThemeToggle');
            if (!btn) return;
            const icon = btn.querySelector('.material-symbols-outlined') || btn.querySelector('span');
            if (icon) {
                if (this.currentTheme === 'dark') {
                    icon.innerText = 'dark_mode';
                    btn.title = 'Mevcut: Koyu Tema (Tıklayınca Sepya)';
                } else if (this.currentTheme === 'sepia') {
                    icon.innerText = 'auto_stories';
                    btn.title = 'Mevcut: Sepya Tema (Tıklayınca Aydınlık)';
                } else {
                    icon.innerText = 'light_mode';
                    btn.title = 'Mevcut: Aydınlık Tema (Tıklayınca Koyu)';
                }
            }
        },

        // ==========================================
        // 2. KLAVYE KISAYOL REHBERİ MODALİ
        // ==========================================
        shortcuts: [
            { cat: 'Segment & Çeviri', key: 'Ctrl + Enter', desc: 'Segmenti onayla, TM bellek veritabanına kaydet ve sonraki segmente geç.' },
            { cat: 'Segment & Çeviri', key: 'Ctrl + Insert', desc: 'Sol paneldeki kaynak metni birebir hedef kutusuna kopyala.' },
            { cat: 'Segment & Çeviri', key: 'Alt + 1..9', desc: 'Kaynakta tespit edilen numaralı terimce önerisini imlece ekle.' },
            { cat: 'Segment & Çeviri', key: 'Ctrl + 1', desc: 'Bellekten (%100 veya Fuzzy) önerilen çeviriyi anında hedef kutusuna aktar.' },
            { cat: 'Segment & Çeviri', key: 'Alt + M', desc: 'Google Gemini Pro / MT sinirsel çeviri motoruyla segmenti otomatik çevir.' },
            { cat: 'Segmentasyon', key: 'Ctrl + Shift + S', desc: 'İmleç konumundaki cümleden segmenti ikiye böl (Split).' },
            { cat: 'Segmentasyon', key: 'Ctrl + Shift + M', desc: 'Mevcut segmenti bir sonraki segment ile birleştir (Merge).' },
            { cat: 'Biçimlendirme & Kalkan', key: 'Ctrl + B', desc: 'Seçili metne Kalın (Bold) kalkanı uygula.' },
            { cat: 'Biçimlendirme & Kalkan', key: 'Ctrl + I', desc: 'Seçili metne İtalik (Italic) kalkanı uygula.' },
            { cat: 'Biçimlendirme & Kalkan', key: 'Ctrl + U', desc: 'Seçili metne Altçizgi (Underline) kalkanı uygula.' },
            { cat: 'Biçimlendirme & Kalkan', key: 'Ctrl + Shift + F', desc: 'Akıllı Biçimlendirme Kalkanı etiketlerini kaynağa göre otomatik senkronize et.' },
            { cat: 'Gezinme & QA', key: 'Alt + Aşağı', desc: 'Bir sonraki segmente odaklan.' },
            { cat: 'Gezinme & QA', key: 'Alt + Yukarı', desc: 'Bir önceki segmente odaklan.' },
            { cat: 'Gezinme & QA', key: 'Ctrl + Shift + Q / F7', desc: 'Kapsamlı Kalite Güvence (QA) analiz modalini aç.' },
            { cat: 'Gezinme & QA', key: 'Ctrl + P', desc: 'Canlı Belge Önizleme (Live Preview) çekmecesini aç / kapat.' },
            { cat: 'Gezinme & QA', key: '?', desc: 'Bu klavye kısayolları rehberini aç.' }
        ],

        openShortcutsModal() {
            let modal = document.getElementById('catShortcutsModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'catShortcutsModal';
                modal.className = 'fixed inset-0 z-99990 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all select-none';
                modal.innerHTML = `
                    <div class="fluent-card w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
                        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                            <div class="flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
                                    <span class="material-symbols-outlined text-lg">keyboard</span>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-slate-900">Klavye Kısayolları ve Hızlı Komutlar</h3>
                                    <p class="text-[11px] text-slate-500">Endüstri standardı CAT editör klavye kombinasyonları</p>
                                </div>
                            </div>
                            <button onclick="CatUI.closeShortcutsModal()" class="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                                <span class="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div class="p-4 border-b border-slate-100 bg-white">
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                                <input type="text" id="shortcutSearchInput" oninput="CatUI.filterShortcuts(this.value)" placeholder="Kısayol veya komut ara (örn: onay, böl, kalkan, tm)..." class="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 transition-colors" />
                            </div>
                        </div>

                        <div class="p-6 overflow-y-auto space-y-4" id="shortcutListContainer">
                            <!-- Kısayollar JS tarafından doldurulacak -->
                        </div>

                        <div class="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500">
                            <span>İpucu: Herhangi bir zamanda <strong class="cat-kbd">?</strong> tuşuna basarak bu pencereyi açabilirsiniz.</span>
                            <button onclick="CatUI.closeShortcutsModal()" class="fluent-btn px-4 py-1.5 rounded-lg text-xs font-semibold">Kapat</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            this.renderShortcutsList(this.shortcuts);
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            setTimeout(() => {
                const input = document.getElementById('shortcutSearchInput');
                if (input) {
                    input.value = '';
                    input.focus();
                }
            }, 50);
        },

        closeShortcutsModal() {
            const modal = document.getElementById('catShortcutsModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        },

        filterShortcuts(query) {
            const q = (query || '').toLowerCase().trim();
            if (!q) {
                this.renderShortcutsList(this.shortcuts);
                return;
            }
            const filtered = this.shortcuts.filter(s => 
                s.key.toLowerCase().includes(q) || 
                s.desc.toLowerCase().includes(q) || 
                s.cat.toLowerCase().includes(q)
            );
            this.renderShortcutsList(filtered);
        },

        renderShortcutsList(items) {
            const container = document.getElementById('shortcutListContainer');
            if (!container) return;

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-xs text-slate-400">
                        <span class="material-symbols-outlined text-3xl mb-1">search_off</span>
                        <p>Eşleşen klavye kısayolu bulunamadı.</p>
                    </div>
                `;
                return;
            }

            // Kategoriye göre grupla
            const groups = {};
            items.forEach(item => {
                if (!groups[item.cat]) groups[item.cat] = [];
                groups[item.cat].push(item);
            });

            let html = '';
            for (const [catName, list] of Object.entries(groups)) {
                html += `
                    <div class="space-y-2">
                        <div class="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            <span>${catName}</span>
                        </div>
                        <div class="grid grid-cols-1 gap-2">
                `;
                list.forEach(s => {
                    const keys = s.key.split('+').map(k => `<span class="cat-kbd">${k.trim()}</span>`).join(' <span class="text-slate-400 font-mono text-[10px]">+</span> ');
                    html += `
                        <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 transition-colors border border-slate-200/60">
                            <span class="text-xs text-slate-700 leading-snug pr-4">${s.desc}</span>
                            <div class="flex items-center gap-1 shrink-0 select-text">${keys}</div>
                        </div>
                    `;
                });
                html += `
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        },

        // ==========================================
        // 3. CANLI BELGE ÖNİZLEME (LIVE PREVIEW DRAWER)
        // ==========================================
        toggleLivePreview() {
            let drawer = document.getElementById('livePreviewDrawer');
            if (!drawer) {
                this.setupLivePreviewDrawer();
                drawer = document.getElementById('livePreviewDrawer');
            }

            this.isLivePreviewOpen = !this.isLivePreviewOpen;
            if (this.isLivePreviewOpen) {
                drawer.classList.add('drawer-open');
                this.refreshLivePreview();
                if (typeof global.showToast === 'function') {
                    global.showToast('📄 Canlı belge önizleme paneli açıldı.');
                }
            } else {
                drawer.classList.remove('drawer-open');
            }
        },

        setupLivePreviewDrawer() {
            let drawer = document.getElementById('livePreviewDrawer');
            if (drawer) return;

            drawer = document.createElement('aside');
            drawer.id = 'livePreviewDrawer';
            drawer.innerHTML = `
                <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sky-600 text-lg">chrome_reader_mode</span>
                        <div>
                            <h4 class="text-xs font-bold text-slate-800" id="previewDocTitle">Canlı Belge Önizleme</h4>
                            <span class="text-[10px] text-slate-400 font-mono" id="previewStats">0 Segment</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="CatUI.refreshLivePreview()" class="w-7 h-7 rounded hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors" title="Önizlemeyi Yenile">
                            <span class="material-symbols-outlined text-sm">refresh</span>
                        </button>
                        <button onclick="CatUI.printPreview()" class="w-7 h-7 rounded hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors" title="Yazdır / PDF Olarak Kaydet">
                            <span class="material-symbols-outlined text-sm">print</span>
                        </button>
                        <button onclick="CatUI.toggleLivePreview()" class="w-7 h-7 rounded hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors" title="Kapat">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-6 bg-slate-100/60" id="previewContentArea">
                    <div class="preview-sheet max-w-full mx-auto" id="previewSheet">
                        <!-- Çevrilmiş hedef metin canlı akacak -->
                    </div>
                </div>

                <div class="px-4 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
                    <span>Paragrafa tıklayarak ilgili segmente gidebilirsiniz.</span>
                    <span class="font-mono text-emerald-600 font-bold" id="previewSyncBadge">● Senkronize</span>
                </div>
            `;
            document.body.appendChild(drawer);
        },

        refreshLivePreview() {
            const sheet = document.getElementById('previewSheet');
            const titleEl = document.getElementById('previewDocTitle');
            const statsEl = document.getElementById('previewStats');
            if (!sheet) return;

            const getActiveDocFn = global.getActiveDoc;
            if (typeof getActiveDocFn !== 'function') return;

            const doc = getActiveDocFn();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                sheet.innerHTML = '<p class="text-slate-400 italic text-center py-10">Görüntülenecek segment bulunamadı.</p>';
                return;
            }

            if (titleEl) titleEl.innerText = doc.name || 'Belge Önizleme';
            if (statsEl) statsEl.innerText = `${doc.segments.length} Segment | %${Math.round((doc.segments.filter(s => s.status === 'confirmed').length / doc.segments.length) * 100)} Tamamlandı`;

            let html = '';
            doc.segments.forEach((seg, idx) => {
                const targetText = seg.target && seg.target.trim().length > 0 ? seg.target : `<span class="text-slate-300 italic">[Henüz çevrilmedi: ${escapeHtml(seg.source)}]</span>`;
                
                // Format Kalkanı etiketlerini HTML olarak render et
                let formattedHtml = targetText;
                if (global.FormatShield && typeof global.FormatShield.shieldToHtml === 'function') {
                    formattedHtml = global.FormatShield.shieldToHtml(formattedHtml);
                }

                const isConfirmed = seg.status === 'confirmed';
                const statusDot = isConfirmed ? 'border-l-2 border-emerald-500 pl-2' : 'border-l-2 border-slate-200 pl-2 opacity-85';

                html += `
                    <div class="mb-3.5 leading-relaxed cursor-pointer hover:bg-sky-50/50 rounded transition-colors ${statusDot}" 
                         onclick="CatUI.jumpToSegment(${seg.id})" 
                         title="Segment #${idx + 1} (${seg.status || 'taslak'}) - Tıklayınca editörde odaklanır">
                        <span class="text-[10px] font-mono text-slate-400 mr-1 select-none">#${idx + 1}</span>
                        ${formattedHtml}
                    </div>
                `;
            });

            sheet.innerHTML = html;
        },

        jumpToSegment(segId) {
            const card = document.getElementById(`segCard-${segId}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('ring-2', 'ring-sky-500');
                setTimeout(() => card.classList.remove('ring-2', 'ring-sky-500'), 1500);
            }
            const textarea = document.getElementById(`targetArea-${segId}`);
            if (textarea) textarea.focus();
        },

        printPreview() {
            const sheet = document.getElementById('previewSheet');
            if (!sheet) return;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Belge Önizleme Çıktısı</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; padding: 40px; color: #111; }
                        p { margin-bottom: 14px; }
                        .text-slate-300 { color: #999; }
                    </style>
                </head>
                <body>
                    ${sheet.innerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 300);
        },

        // ==========================================
        // 4. SANAL KAYDIRMA MODU AÇ/KAPA (VIRTUAL SCROLL)
        // ==========================================
        toggleVirtualScrollMode() {
            if (!global.appState) return;
            global.appState.useVirtualScroll = !global.appState.useVirtualScroll;
            if (typeof global.saveAppStateToLocal === 'function') {
                global.saveAppStateToLocal();
            }
            if (typeof global.renderSegments === 'function') {
                global.renderSegments();
            }
            if (typeof global.showToast === 'function') {
                const status = global.appState.useVirtualScroll ? 'Aktif (60 FPS Akıcı Bellek Korumalı)' : 'Pasif (Sayfalı Mod)';
                global.showToast(`🚀 Sanal Kaydırma (Virtual Scrolling): ${status}`);
            }
        },

        // ==========================================
        // 5. GENİŞLETİLEBİLİR ARAÇ ÇUBUĞU (TOOLBAR OVERFLOW)
        // ==========================================
        isToolbarOverflowOpen: false,

        initToolbarOverflow() {
            let saved = null;
            try {
                if (typeof localStorage !== 'undefined') {
                    saved = localStorage.getItem('cat_toolbar_overflow');
                }
            } catch (e) {}
            const row = typeof document !== 'undefined' ? document.getElementById('toolbarOverflowRow') : null;
            if (!row) return;

            // Varsayılan: Geniş ekranda açık veya son tercihe göre
            const isWide = typeof window !== 'undefined' && window.innerWidth >= 1200;
            const shouldOpen = saved !== null ? saved === 'true' : isWide;
            this.setToolbarOverflow(shouldOpen, false);
        },

        setToolbarOverflow(isOpen, persist = true) {
            this.isToolbarOverflowOpen = !!isOpen;
            const row = document.getElementById('toolbarOverflowRow');
            const chevron = document.getElementById('toolbarOverflowChevron');
            const btn = document.getElementById('btnToggleToolbarOverflow');
            if (row) {
                if (isOpen) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            }
            if (chevron) {
                chevron.innerText = isOpen ? 'expand_less' : 'expand_more';
            }
            if (btn) {
                if (isOpen) {
                    btn.classList.add('bg-purple-200', 'border-purple-400');
                    btn.classList.remove('bg-purple-50');
                } else {
                    btn.classList.remove('bg-purple-200', 'border-purple-400');
                    btn.classList.add('bg-purple-50');
                }
            }
            if (persist) {
                try {
                    localStorage.setItem('cat_toolbar_overflow', String(isOpen));
                } catch (e) {}
            }
        },

        toggleToolbarOverflow() {
            this.setToolbarOverflow(!this.isToolbarOverflowOpen, true);
        },

        // İndirme / Dışa Aktarma Fonksiyonu (Orijinal Formatta veya Word Belgesi)
        exportDocxWithStyles() {
            if (typeof global.exportInOriginalFormat === 'function') {
                global.exportInOriginalFormat();
            } else if (typeof global.executeWordExport === 'function') {
                global.executeWordExport('docx');
            }
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Global klavye kısayol dinleyicisi
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', function (e) {
            // Eğer modal açıksa Escape ile kapat
            if (e.key === 'Escape') {
                CatUI.closeShortcutsModal();
                if (CatUI.isLivePreviewOpen) CatUI.toggleLivePreview();
            }

            // Soru işareti (?) kısayolu kaldırıldı - sadece F1 veya menü butonu modalı açar

            // Ctrl + P: Canlı Önizleme Aç/Kapat
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P') && !e.shiftKey) {
                e.preventDefault();
                CatUI.toggleLivePreview();
            }

            // Alt + Aşağı: Sonraki Segmente Odaklan
            if (e.altKey && e.key === 'ArrowDown') {
                if (typeof global.focusFirstOrActiveSegment === 'function') {
                    e.preventDefault();
                    global.focusFirstOrActiveSegment(1);
                }
            }

            // Alt + Yukarı: Önceki Segmente Odaklan
            if (e.altKey && e.key === 'ArrowUp') {
                if (typeof global.focusFirstOrActiveSegment === 'function') {
                    e.preventDefault();
                    global.focusFirstOrActiveSegment(-1);
                }
            }

            // F7 veya Ctrl+Shift+Q: Toplu QA
            if (e.key === 'F7' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Q' || e.key === 'q'))) {
                e.preventDefault();
                if (typeof global.CatQA !== 'undefined' && typeof global.CatQA.openBatchQAModal === 'function') {
                    global.CatQA.openBatchQAModal();
                }
            }

            // Ctrl + G: Terim Sözlüğü Geçişi
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'g' || e.key === 'G') && !isTyping) {
                e.preventDefault();
                if (typeof global.switchNav === 'function') {
                    const current = global.appState?.currentNav;
                    global.switchNav(current === 'glossary' ? 'editor' : 'glossary');
                }
            }
        });
    }

    global.CatUI = CatUI;
    global.toggleToolbarOverflow = function () {
        CatUI.toggleToolbarOverflow();
    };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                CatUI.initTheme();
                CatUI.initToolbarOverflow();
            });
        } else {
            CatUI.initTheme();
            CatUI.initToolbarOverflow();
        }
    }
})(window);


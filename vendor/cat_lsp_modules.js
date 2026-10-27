/* ==========================================================
   ARIK STUDIO CAT TOOL - KURUMSAL LİSANSLI ÇEVİRİ BÜROSU MODÜLLERİ (LSP ENTERPRISE SUITE)
   ----------------------------------------------------------
   1. PROJE KELİME ANALİZİ VE MALİYET / HAKEDİŞ MATRİSİ (8 Dilimli Fuzzy Match & Word Count Engine)
   2. EDİTÖR (L2) MODU, SEGMENT YAŞAM DÖNGÜSÜ, TRACK CHANGES (Fark Takibi) & LQA KALİTE PUANLAMA
   3. TÜRKÇE MORFOLOJİK KÖK EŞLEŞTİRİCİ (Stemmer & Yumuşama Kuralları) & DİNAMİK VİDEO FİLİGRANI (DRM)
   ========================================================== */

(function (global) {
    'use strict';

    const CatLSP = {};
    global.CatLSP = CatLSP;

    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const getDoc = () => (typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null);
    const getProj = () => (typeof global.getActiveProject === 'function' ? global.getActiveProject() : null);

    /* ==========================================================
       MODÜL 3.1: TÜRKÇE MORFOLOJİK KÖK VE ÇEKİM EKİ AYIKLAYICI (STEMMER)
       ========================================================== */
    const Stemmer = {
        // Yumuşama dönüşüm haritası (Son harf yumuşamışsa kökteki sert sessize dönüştür)
        softeningMap: {
            'b': 'p',
            'c': 'ç',
            'd': 't',
            'ğ': 'k'
        },

        // Türkçe çekim ekleri (uzundan kısaya sıralı)
        suffixes: [
            // Çoğul + Hal / İyelik
            'lerinden', 'larından', 'lerine', 'larına', 'lerinde', 'larında',
            'lerini', 'larını', 'lerin', 'ların',
            // İyelik + Hal
            'imizden', 'ımızdan', 'ümüzden', 'umuzdan',
            'inizden', 'ınızdan', 'ünüzden', 'unuzdan',
            'imizin', 'ımızın', 'ümüzün', 'umuzun',
            'imize', 'ımıza', 'ümüze', 'umuza',
            'imizi', 'ımızı', 'ümüzü', 'umuzu',
            'inizde', 'ınızda', 'ünüzde', 'unuzda',
            'sinden', 'sından', 'sinde', 'sında', 'sine', 'sına', 'sini', 'sını',
            // Ayrılma / Bulunma / Yönelme / Belirtme
            'lerden', 'lardan', 'lerde', 'larda',
            'den', 'dan', 'ten', 'tan',
            'de', 'da', 'te', 'ta',
            'ye', 'ya', 'e', 'a',
            'yi', 'yı', 'yu', 'yü', 'i', 'ı', 'u', 'ü',
            // Tamlayan / İyelik
            'nin', 'nın', 'nun', 'nün',
            'in', 'ın', 'un', 'ün',
            'ler', 'lar',
            'imiz', 'ımız', 'ümüz', 'umuz',
            'iniz', 'ınız', 'ünüz', 'unuz',
            'im', 'ım', 'um', 'üm',
            'si', 'sı', 'su', 'sü',
            // Yapım / Ek Fiil / Sıfatlaştıran
            'lik', 'lık', 'luk', 'lük',
            'ci', 'cı', 'cü', 'cu',
            'li', 'lı', 'lu', 'lü',
            'siz', 'sız', 'suz', 'süz',
            'dir', 'dır', 'dur', 'dür', 'tir', 'tır', 'tur', 'tür',
            'ce', 'ca', 'ken', 'ceye', 'caya'
        ],

        /**
         * Kelimeyi temizler, küçük harfe ve Türkçe standartlara dönüştürür.
         */
        cleanWord(w) {
            return String(w || '').toLowerCase()
                .replace(/['’´`][a-zA-ZçğıöşüÇĞİÖŞÜ]*/g, '') // Kesme işareti ve sonrasını at (örn: Türkiye'nin -> türkiye)
                .replace(/[^a-z0-9çğıöşü]/gi, '')
                .trim();
        },

        /**
         * Tek bir kelimenin olası Türkçe kök alternatiflerini üretir.
         * Örnek: "mahkemesinden" -> ["mahkeme", "mahkemesi"]
         * Örnek: "sağlığına" -> ["sağlık", "sağlığ"]
         */
        candidateRoots(rawWord) {
            const word = this.cleanWord(rawWord);
            if (!word || word.length <= 2) return [word];

            const candidates = new Set();
            candidates.add(word);

            // Ekleri sırayla dene ve soy
            for (const suf of this.suffixes) {
                if (word.length > suf.length + 2 && word.endsWith(suf)) {
                    const stem = word.slice(0, -suf.length);
                    candidates.add(stem);

                    // Yumuşama kuralını tersine çevir (ör. sağlığ -> sağlık, kitab -> kitap)
                    const lastChar = stem[stem.length - 1];
                    if (this.softeningMap[lastChar]) {
                        const unsoftened = stem.slice(0, -1) + this.softeningMap[lastChar];
                        candidates.add(unsoftened);
                    }

                    // Bir kat daha ek soyma (ör: kitap - lar - ında)
                    for (const suf2 of this.suffixes) {
                        if (stem.length > suf2.length + 2 && stem.endsWith(suf2)) {
                            const stem2 = stem.slice(0, -suf2.length);
                            candidates.add(stem2);
                            const lastChar2 = stem2[stem2.length - 1];
                            if (this.softeningMap[lastChar2]) {
                                candidates.add(stem2.slice(0, -1) + this.softeningMap[lastChar2]);
                            }
                        }
                    }
                }
            }

            // Doğrudan yumuşama tersine çevirme (ek soyulmamışsa bile)
            const last = word[word.length - 1];
            if (this.softeningMap[last]) {
                candidates.add(word.slice(0, -1) + this.softeningMap[last]);
            }

            return Array.from(candidates);
        },

        /**
         * Metin içinde verilen terimi (kök ve çekim ekleri esnekliğiyle) arar.
         * Terim: "mahkeme" -> Metin: "Bu olay ceza mahkemesinde görüldü" -> TRUE döner!
         */
        termMatchesText(term, fullText) {
            if (!term || !fullText) return false;
            const cleanT = this.cleanWord(term);
            const cleanF = String(fullText).toLowerCase();

            // 1. Doğrudan alt metin eşleşmesi
            if (cleanF.includes(cleanT)) return true;

            // 2. Kelime bazlı morfolojik kök eşleşmesi
            const textWords = cleanF.split(/\s+/).map(w => this.cleanWord(w)).filter(Boolean);
            const termRoots = this.candidateRoots(cleanT);

            for (const word of textWords) {
                const wordRoots = this.candidateRoots(word);
                // Kök kümelerinde kesişim var mı?
                for (const tr of termRoots) {
                    if (wordRoots.includes(tr) || word.startsWith(tr)) {
                        return true;
                    }
                }
            }

            return false;
        }
    };
    CatLSP.Stemmer = Stemmer;

    /* ==========================================================
       MODÜL 3.2: DİNAMİK VİDEO FİLİGRANI (FORENSIC DRM WATERMARK)
       ========================================================== */
    const DRM = {
        enabled: false,
        intervalId: null,
        watermarkEl: null,

        init() {
            // Video oynatıcı sağ tıkını engelleme ve DRM başlangıcı
            const video = document.getElementById('subVideoPlayer');
            if (video) {
                video.setAttribute('controlsList', 'nodownload');
                video.setAttribute('oncontextmenu', 'return false;');
                video.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    toast('🔒 Güvenlik: Altyazılı video telif koruması ve DRM nedeniyle indirilemez.');
                    return false;
                });
            }
        },

        createOverlay() {
            if (this.watermarkEl) return this.watermarkEl;
            const playerArea = document.getElementById('subVideoPlayerArea');
            const videoWrapper = playerArea ? playerArea.querySelector('.aspect-video') : null;
            if (!videoWrapper) return null;

            const el = document.createElement('div');
            el.id = 'catDrmWatermarkOverlay';
            el.style.cssText = `
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 25;
                overflow: hidden;
                display: none;
            `;

            el.innerHTML = `
                <div id="catDrmFloatingBadge" style="
                    position: absolute;
                    top: 15%;
                    left: 20%;
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: rgba(15, 23, 42, 0.42);
                    backdrop-filter: blur(2px);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    color: rgba(255, 255, 255, 0.72);
                    font-family: 'Cascadia Code', Consolas, monospace;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                    transition: top 3.5s ease-in-out, left 3.5s ease-in-out, opacity 1s ease;
                    user-select: none;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                ">
                    <div class="flex items-center gap-1.5">
                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>
                        <span id="catDrmUserLabel">ARIK CAT • OPERATÖR</span>
                    </div>
                    <div id="catDrmTimeLabel" style="font-size: 9px; opacity: 0.85;">2026-10-18 00:00:00 • SEC-99120</div>
                </div>
            `;

            videoWrapper.appendChild(el);
            this.watermarkEl = el;
            return el;
        },

        drift() {
            const badge = document.getElementById('catDrmFloatingBadge');
            if (!badge) return;

            // Rastgele güvenli koordinatlar (%10 - %75)
            const top = Math.floor(10 + Math.random() * 65);
            const left = Math.floor(8 + Math.random() * 65);
            badge.style.top = `${top}%`;
            badge.style.left = `${left}%`;

            // Bilgileri güncelle
            const role = (global.appState && global.appState.userRole === 'L2') ? 'Editör / L2' : 'Çevirmen / L1';
            const user = (global.appState && global.appState.userName) || 'Arık Studio Profesyonel';
            const userLabel = document.getElementById('catDrmUserLabel');
            if (userLabel) userLabel.innerText = `${user.toUpperCase()} [${role}]`;

            const timeLabel = document.getElementById('catDrmTimeLabel');
            if (timeLabel) {
                const now = new Date().toLocaleString('tr-TR');
                const session = (global.appState && global.appState.activeProjectId) || 'SEC-SESSION-' + Math.floor(10000 + Math.random() * 90000);
                timeLabel.innerText = `${now} • ${session}`;
            }
        },

        toggle() {
            this.enabled = !this.enabled;
            const overlay = this.createOverlay();
            if (!overlay) {
                toast('Video oynatıcı henüz yüklenmedi.');
                this.enabled = false;
                return;
            }

            const btnText = document.getElementById('btnToggleVideoDrmText');

            if (this.enabled) {
                overlay.style.display = 'block';
                this.drift();
                this.intervalId = setInterval(() => this.drift(), 4500);
                if (btnText) btnText.innerText = 'DRM Açık (Aktif)';
                toast('🛡️ DRM Adli Filigran (Forensic Watermark) videoda aktif edildi.');
            } else {
                overlay.style.display = 'none';
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                if (btnText) btnText.innerText = 'DRM Filigran';
                toast('DRM Filigran devre dışı bırakıldı.');
            }
        }
    };
    CatLSP.DRM = DRM;

    /* ==========================================================
       MODÜL 1: PROJE KELİME ANALİZİ VE MALİYET / HAKEDİŞ MATRİSİ
       ========================================================== */
    const Analysis = {
        // Standart endüstri ağırlık oranları (varsayılan %)
        defaultWeights: {
            ice: 0,        // %101 Bağlamsal Eşleşme (ICE)
            exact: 20,     // %100 Birebir Eşleşme
            fuzzy95: 30,   // %95 - %99 Bulanık
            fuzzy85: 50,   // %85 - %94 Bulanık
            fuzzy75: 70,   // %75 - %84 Bulanık
            fuzzy50: 80,   // %50 - %74 Bulanık
            reps: 30,      // Belge İçi Tekrarlar
            newWords: 100  // Yeni Kelimeler
        },

        currentUnitRate: 0.50, // Birim kelime fiyatı (TL/USD/EUR)
        currentCurrency: 'TL', // TL / USD / EUR
        subtitleRatePerMinute: 25.0, // Altyazı dakika fiyatı
        subtitleRatePerCue: 0.75,    // Altyazı kutu fiyatı

        countWords(str) {
            if (!str) return 0;
            const w = String(str).trim().replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean);
            return w.length;
        },

        countChars(str) {
            if (!str) return 0;
            return String(str).replace(/<[^>]*>/g, '').length;
        },

        /**
         * Aktif projedeki veya belgedeki tüm segmentleri analiz eder.
         */
        runFullAnalysis() {
            const proj = getProj();
            const docs = (proj && proj.documents && proj.documents.length) ? proj.documents : [getDoc()].filter(Boolean);

            const matrix = {
                ice: { label: '%101 Bağlam İçi Eşleşme (ICE)', segs: 0, words: 0, chars: 0, badge: 'purple' },
                exact: { label: '%100 Tam Eşleşme (Exact Match)', segs: 0, words: 0, chars: 0, badge: 'emerald' },
                fuzzy95: { label: '%95 - %99 Bulanık Eşleşme', segs: 0, words: 0, chars: 0, badge: 'teal' },
                fuzzy85: { label: '%85 - %94 Bulanık Eşleşme', segs: 0, words: 0, chars: 0, badge: 'sky' },
                fuzzy75: { label: '%75 - %84 Bulanık Eşleşme', segs: 0, words: 0, chars: 0, badge: 'amber' },
                fuzzy50: { label: '%50 - %74 Bulanık Eşleşme', segs: 0, words: 0, chars: 0, badge: 'orange' },
                reps: { label: 'Belge İçi Tekrarlar (Repetitions)', segs: 0, words: 0, chars: 0, badge: 'blue' },
                newWords: { label: 'Yeni Kelimeler (No Match / New)', segs: 0, words: 0, chars: 0, badge: 'slate' }
            };

            const seenSources = new Set();
            let totalSegs = 0;
            let totalWords = 0;
            let totalChars = 0;
            let totalSubMinutes = 0;

            docs.forEach(doc => {
                if (!doc || !doc.segments) return;
                doc.segments.forEach((seg, sIdx) => {
                    const src = (seg.source || '').trim();
                    if (!src) return;

                    totalSegs++;
                    const words = this.countWords(src);
                    const chars = this.countChars(src);
                    totalWords += words;
                    totalChars += chars;

                    // Altyazı süresi
                    if (seg.durationSec) {
                        totalSubMinutes += (seg.durationSec / 60);
                    }

                    const normSrc = (typeof global.normalizeString === 'function')
                        ? global.normalizeString(src)
                        : src.toLowerCase().trim();

                    // 1. Belge İçi Tekrar Kontrolü
                    if (seenSources.has(normSrc)) {
                        matrix.reps.segs++;
                        matrix.reps.words += words;
                        matrix.reps.chars += chars;
                        return;
                    }
                    seenSources.add(normSrc);

                    // 2. Çeviri Belleği (TM) Eşleşme Kontrolü
                    let match = null;
                    if (typeof global.findBestTmMatch === 'function') {
                        match = global.findBestTmMatch(src, seg.id);
                    }

                    if (match) {
                        const sim = match.similarity || 0;
                        if (sim === 101 || match.isIce) {
                            matrix.ice.segs++;
                            matrix.ice.words += words;
                            matrix.ice.chars += chars;
                        } else if (sim >= 100 || match.isExact) {
                            matrix.exact.segs++;
                            matrix.exact.words += words;
                            matrix.exact.chars += chars;
                        } else if (sim >= 95) {
                            matrix.fuzzy95.segs++;
                            matrix.fuzzy95.words += words;
                            matrix.fuzzy95.chars += chars;
                        } else if (sim >= 85) {
                            matrix.fuzzy85.segs++;
                            matrix.fuzzy85.words += words;
                            matrix.fuzzy85.chars += chars;
                        } else if (sim >= 75) {
                            matrix.fuzzy75.segs++;
                            matrix.fuzzy75.words += words;
                            matrix.fuzzy75.chars += chars;
                        } else if (sim >= 50) {
                            matrix.fuzzy50.segs++;
                            matrix.fuzzy50.words += words;
                            matrix.fuzzy50.chars += chars;
                        } else {
                            matrix.newWords.segs++;
                            matrix.newWords.words += words;
                            matrix.newWords.chars += chars;
                        }
                    } else {
                        // Hiçbir TM kaydıyla eşleşmedi
                        matrix.newWords.segs++;
                        matrix.newWords.words += words;
                        matrix.newWords.chars += chars;
                    }
                });
            });

            return {
                matrix,
                totalSegs,
                totalWords,
                totalChars,
                totalSubMinutes: Math.max(1, Math.round(totalSubMinutes * 10) / 10),
                docCount: docs.length
            };
        },

        /**
         * Modalı açar ve verileri hesaplayarak ekrana basar.
         */
        openModal() {
            const data = this.runFullAnalysis();
            this.lastAnalysisData = data;

            let backdrop = document.getElementById('modalProjectAnalysisBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'modalProjectAnalysisBackdrop';
                backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none';
                document.body.appendChild(backdrop);
            }

            backdrop.innerHTML = `
                <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
                    <!-- Modal Başlık -->
                    <div class="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50/70 dark:bg-neutral-800/50">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                                <span class="material-symbols-outlined text-[22px]">calculate</span>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Proje Kelime Analizi ve Maliyet / Hakediş Matrisi</span>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-bold">LSP Standart</span>
                                </h3>
                                <p class="text-xs text-slate-500 dark:text-neutral-400">8 Dilimli Bulanık Eşleşme (Fuzzy Match), Belge İçi Tekrarlar ve Altyazı Hakediş Raporu</p>
                            </div>
                        </div>
                        <button onclick="CatLSP.Analysis.closeModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    <!-- Fiyat ve Para Birimi Üst Barı -->
                    <div class="px-6 py-3 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div class="flex items-center gap-4 flex-wrap">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-slate-700 dark:text-neutral-300">Birim Kelime Fiyatı:</span>
                                <input type="number" id="lspUnitWordRateInput" step="0.01" min="0" value="${this.currentUnitRate}"
                                    onchange="CatLSP.Analysis.updateCalculations()"
                                    class="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="font-semibold text-slate-700 dark:text-neutral-300">Para Birimi:</span>
                                <select id="lspCurrencySelect" onchange="CatLSP.Analysis.updateCalculations()"
                                    class="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none">
                                    <option value="TL" ${this.currentCurrency === 'TL' ? 'selected' : ''}>₺ TL</option>
                                    <option value="USD" ${this.currentCurrency === 'USD' ? 'selected' : ''}>$ USD</option>
                                    <option value="EUR" ${this.currentCurrency === 'EUR' ? 'selected' : ''}>€ EUR</option>
                                </select>
                            </div>
                        </div>

                        <!-- Sekme Seçici: Yazılı Çeviri vs Altyazı/AVT -->
                        <div class="flex items-center p-1 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                            <button id="tabBtnDocAnalysis" onclick="CatLSP.Analysis.switchTab('doc')" class="px-3 py-1 rounded-md font-bold text-xs bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-xs cursor-pointer transition-all">
                                Doküman Matrisi
                            </button>
                            <button id="tabBtnSubAnalysis" onclick="CatLSP.Analysis.switchTab('sub')" class="px-3 py-1 rounded-md font-bold text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 cursor-pointer transition-all">
                                Altyazı / AVT Hakediş
                            </button>
                        </div>
                    </div>

                    <!-- Modal Gövdesi (Scroll Edilebilir Tablo) -->
                    <div class="flex-1 overflow-y-auto p-6" id="lspAnalysisModalBody">
                        <!-- Doküman Matrisi Tablosu -->
                        <div id="lspTabDocContent">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 font-mono text-[11px]">
                                        <th class="py-2.5 px-3">Eşleşme Dilimi</th>
                                        <th class="py-2.5 px-3 text-center">Segment</th>
                                        <th class="py-2.5 px-3 text-right">Kelime</th>
                                        <th class="py-2.5 px-3 text-right">Karakter</th>
                                        <th class="py-2.5 px-3 text-center">Ağırlık %</th>
                                        <th class="py-2.5 px-3 text-right">Ağırlıklı Kelime</th>
                                        <th class="py-2.5 px-3 text-right">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody id="lspAnalysisTableBody" class="divide-y divide-slate-100 dark:divide-neutral-800 font-sans">
                                    <!-- JS ile doldurulacak -->
                                </tbody>
                                <tfoot id="lspAnalysisTableFoot" class="border-t-2 border-slate-300 dark:border-neutral-600 font-bold bg-slate-50/80 dark:bg-neutral-800/80">
                                    <!-- JS ile doldurulacak -->
                                </tfoot>
                            </table>
                        </div>

                        <!-- Altyazı / AVT Hakediş Sekmesi (Gizli) -->
                        <div id="lspTabSubContent" class="hidden flex flex-col gap-5">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col gap-3">
                                    <div class="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm">
                                        <span class="material-symbols-outlined text-[20px] text-purple-600">timer</span>
                                        <span>Video Dakikası Bazlı Hesaplama</span>
                                    </div>
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-slate-600 dark:text-neutral-400">Toplam Süre:</span>
                                        <span class="font-mono font-bold text-slate-900 dark:text-white" id="subTotalMinutesLabel">${data.totalSubMinutes} Dakika</span>
                                    </div>
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-slate-600 dark:text-neutral-400">Dakika Birim Fiyatı:</span>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="subMinuteRateInput" value="${this.subtitleRatePerMinute}" step="1" min="0" onchange="CatLSP.Analysis.updateCalculations()" class="w-20 px-2 py-1 text-xs font-mono font-bold rounded border border-purple-300 dark:border-purple-700 bg-white dark:bg-neutral-800">
                                            <span class="font-bold text-purple-800 dark:text-purple-300 subCurrencyLabel">TL</span>
                                        </div>
                                    </div>
                                    <div class="pt-2 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between font-bold text-sm text-purple-900 dark:text-purple-200">
                                        <span>Dakika Bazlı Hakediş:</span>
                                        <span id="subMinuteTotalLabel" class="font-mono">0.00 TL</span>
                                    </div>
                                </div>

                                <div class="p-4 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 flex flex-col gap-3">
                                    <div class="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-bold text-sm">
                                        <span class="material-symbols-outlined text-[20px] text-sky-600">subtitles</span>
                                        <span>Altyazı Kutu Sayısı (Cue Count) Bazlı</span>
                                    </div>
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-slate-600 dark:text-neutral-400">Toplam Altyazı Segmenti:</span>
                                        <span class="font-mono font-bold text-slate-900 dark:text-white">${data.totalSegs} Kutu</span>
                                    </div>
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-slate-600 dark:text-neutral-400">Kutu Başı Fiyat:</span>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="subCueRateInput" value="${this.subtitleRatePerCue}" step="0.05" min="0" onchange="CatLSP.Analysis.updateCalculations()" class="w-20 px-2 py-1 text-xs font-mono font-bold rounded border border-sky-300 dark:border-sky-700 bg-white dark:bg-neutral-800">
                                            <span class="font-bold text-sky-800 dark:text-sky-300 subCurrencyLabel">TL</span>
                                        </div>
                                    </div>
                                    <div class="pt-2 border-t border-sky-200 dark:border-sky-800 flex items-center justify-between font-bold text-sm text-sky-900 dark:text-sky-200">
                                        <span>Kutu Bazlı Hakediş:</span>
                                        <span id="subCueTotalLabel" class="font-mono">0.00 TL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Altı (Özet ve Dışa Aktarım Butonları) -->
                    <div class="px-6 py-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-4 text-xs font-mono">
                            <div class="flex flex-col">
                                <span class="text-slate-400 text-[10px]">AĞIRLIKLI KELİME:</span>
                                <span id="summaryWeightedWords" class="text-sm font-bold text-slate-900 dark:text-white">0</span>
                            </div>
                            <div class="w-[1px] h-6 bg-slate-300 dark:bg-neutral-700"></div>
                            <div class="flex flex-col">
                                <span class="text-slate-400 text-[10px]">TOPLAM TEKLİF:</span>
                                <span id="summaryTotalCost" class="text-base font-extrabold text-emerald-600 dark:text-emerald-400">0.00 TL</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <button onclick="CatLSP.Analysis.exportCSV()" class="fluent-btn px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
                                <span class="material-symbols-outlined text-[16px] text-emerald-600">table_view</span>
                                <span>CSV İndir</span>
                            </button>
                            <button onclick="CatLSP.Analysis.printQuoteReport()" class="fluent-btn-primary px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md cursor-pointer transition-all">
                                <span class="material-symbols-outlined text-[16px]">print</span>
                                <span>Teklif Raporu (PDF / Yazdır)</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this.updateCalculations();
        },

        switchTab(tab) {
            const docTab = document.getElementById('lspTabDocContent');
            const subTab = document.getElementById('lspTabSubContent');
            const btnDoc = document.getElementById('tabBtnDocAnalysis');
            const btnSub = document.getElementById('tabBtnSubAnalysis');

            if (tab === 'doc') {
                docTab.classList.remove('hidden');
                subTab.classList.add('hidden');
                btnDoc.className = 'px-3 py-1 rounded-md font-bold text-xs bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-xs cursor-pointer transition-all';
                btnSub.className = 'px-3 py-1 rounded-md font-bold text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 cursor-pointer transition-all';
            } else {
                docTab.classList.add('hidden');
                subTab.classList.remove('hidden');
                btnSub.className = 'px-3 py-1 rounded-md font-bold text-xs bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-xs cursor-pointer transition-all';
                btnDoc.className = 'px-3 py-1 rounded-md font-bold text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 cursor-pointer transition-all';
            }
        },

        closeModal() {
            const b = document.getElementById('modalProjectAnalysisBackdrop');
            if (b) b.remove();
        },

        updateCalculations() {
            const rateInput = document.getElementById('lspUnitWordRateInput');
            if (rateInput) this.currentUnitRate = parseFloat(rateInput.value) || 0;

            const currSelect = document.getElementById('lspCurrencySelect');
            if (currSelect) {
                this.currentCurrency = currSelect.value;
                document.querySelectorAll('.subCurrencyLabel').forEach(el => el.innerText = this.currentCurrency);
            }

            const subMinRateInput = document.getElementById('subMinuteRateInput');
            if (subMinRateInput) this.subtitleRatePerMinute = parseFloat(subMinRateInput.value) || 0;

            const subCueRateInput = document.getElementById('subCueRateInput');
            if (subCueRateInput) this.subtitleRatePerCue = parseFloat(subCueRateInput.value) || 0;

            const data = this.lastAnalysisData || this.runFullAnalysis();
            const tbody = document.getElementById('lspAnalysisTableBody');
            const tfoot = document.getElementById('lspAnalysisTableFoot');
            if (!tbody || !tfoot) return;

            let totalWeightedWords = 0;
            let totalCost = 0;
            let rowsHtml = '';

            const keys = ['ice', 'exact', 'fuzzy95', 'fuzzy85', 'fuzzy75', 'fuzzy50', 'reps', 'newWords'];
            const weightInputs = {};

            keys.forEach(key => {
                const item = data.matrix[key];
                const weightInputId = `weightInput_${key}`;
                const existingInput = document.getElementById(weightInputId);
                const weight = existingInput ? (parseFloat(existingInput.value) || 0) : this.defaultWeights[key];
                weightInputs[key] = weight;

                const weightedWords = Math.round(item.words * (weight / 100));
                const cost = weightedWords * this.currentUnitRate;
                totalWeightedWords += weightedWords;
                totalCost += cost;

                rowsHtml += `
                    <tr class="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                        <td class="py-2.5 px-3 font-medium text-slate-800 dark:text-neutral-200 flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-${item.badge}-500 shrink-0"></span>
                            <span>${esc(item.label)}</span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-neutral-400">${item.segs}</td>
                        <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-neutral-200">${item.words.toLocaleString('tr-TR')}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-neutral-400">${item.chars.toLocaleString('tr-TR')}</td>
                        <td class="py-2.5 px-3 text-center">
                            <div class="inline-flex items-center gap-1">
                                <input type="number" id="${weightInputId}" value="${weight}" min="0" max="100" step="5"
                                    onchange="CatLSP.Analysis.updateCalculations()"
                                    class="w-14 text-center px-1.5 py-0.5 rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 font-mono font-bold text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500">
                                <span class="text-slate-400 font-mono">%</span>
                            </div>
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono font-bold text-sky-700 dark:text-sky-300">${weightedWords.toLocaleString('tr-TR')}</td>
                        <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">${cost.toFixed(2)} ${this.currentCurrency}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = rowsHtml;

            tfoot.innerHTML = `
                <tr>
                    <td class="py-3 px-3 text-slate-900 dark:text-white">TOPLAM / GENEL TOPLAM</td>
                    <td class="py-3 px-3 text-center font-mono">${data.totalSegs}</td>
                    <td class="py-3 px-3 text-right font-mono">${data.totalWords.toLocaleString('tr-TR')}</td>
                    <td class="py-3 px-3 text-right font-mono">${data.totalChars.toLocaleString('tr-TR')}</td>
                    <td class="py-3 px-3 text-center font-mono text-slate-400">—</td>
                    <td class="py-3 px-3 text-right font-mono text-sky-700 dark:text-sky-300 text-sm">${totalWeightedWords.toLocaleString('tr-TR')}</td>
                    <td class="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">${totalCost.toFixed(2)} ${this.currentCurrency}</td>
                </tr>
            `;

            // Altyazı sekmesi toplamları
            const subMinTotal = (data.totalSubMinutes * this.subtitleRatePerMinute);
            const subCueTotal = (data.totalSegs * this.subtitleRatePerCue);
            const subMinEl = document.getElementById('subMinuteTotalLabel');
            if (subMinEl) subMinEl.innerText = `${subMinTotal.toFixed(2)} ${this.currentCurrency}`;
            const subCueEl = document.getElementById('subCueTotalLabel');
            if (subCueEl) subCueEl.innerText = `${subCueTotal.toFixed(2)} ${this.currentCurrency}`;

            // Alt Bar Özetini Güncelle
            const sww = document.getElementById('summaryWeightedWords');
            if (sww) sww.innerText = totalWeightedWords.toLocaleString('tr-TR') + ' Kelime';
            const stc = document.getElementById('summaryTotalCost');
            if (stc) stc.innerText = `${totalCost.toFixed(2)} ${this.currentCurrency}`;

            this.calculatedSummary = {
                data,
                totalWeightedWords,
                totalCost,
                currency: this.currentCurrency,
                unitRate: this.currentUnitRate,
                weights: weightInputs,
                subMinTotal,
                subCueTotal
            };
        },

        exportCSV() {
            if (!this.calculatedSummary) this.updateCalculations();
            const sum = this.calculatedSummary;
            const data = sum.data;

            let csv = '\uFEFF'; // UTF-8 BOM
            csv += 'Eşleşme Dilimi,Segment Sayısı,Ham Kelime,Karakter Sayısı,Ağırlık Yüzdesi (%),Ağırlıklı Kelime,Birim Fiyat,Tutar (' + sum.currency + ')\r\n';

            const keys = ['ice', 'exact', 'fuzzy95', 'fuzzy85', 'fuzzy75', 'fuzzy50', 'reps', 'newWords'];
            keys.forEach(k => {
                const item = data.matrix[k];
                const w = sum.weights[k] || 0;
                const ww = Math.round(item.words * (w / 100));
                const cost = (ww * sum.unitRate).toFixed(2);
                csv += `"${item.label}",${item.segs},${item.words},${item.chars},${w}%,${ww},${sum.unitRate},${cost}\r\n`;
            });

            csv += `\r\n"TOPLAM",${data.totalSegs},${data.totalWords},${data.totalChars},-,${sum.totalWeightedWords},${sum.unitRate},${sum.totalCost.toFixed(2)} ${sum.currency}\r\n`;

            if (data.totalSubMinutes > 0) {
                csv += `\r\n"ALTYAZI HAKEDİŞ RAPORU"\r\n`;
                csv += `"Toplam Video Süresi (Dakika)",${data.totalSubMinutes},"Dakika Başı Fiyat",${this.subtitleRatePerMinute},"Dakika Bazlı Tutar",${sum.subMinTotal.toFixed(2)} ${sum.currency}\r\n`;
                csv += `"Toplam Kutu Sayısı (Cue)",${data.totalSegs},"Kutu Başı Fiyat",${this.subtitleRatePerCue},"Kutu Bazlı Tutar",${sum.subCueTotal.toFixed(2)} ${sum.currency}\r\n`;
            }

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Proje_Maliyet_ve_Kelime_Analizi_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast('📊 Kelime analizi ve hakediş tablosu CSV olarak indirildi.');
        },

        printQuoteReport() {
            if (!this.calculatedSummary) this.updateCalculations();
            const sum = this.calculatedSummary;
            const data = sum.data;
            const proj = getProj();
            const projTitle = proj ? proj.title : 'Standart Çeviri Projesi';
            const srcLang = (proj ? proj.sourceLang : 'EN').toUpperCase();
            const tgtLang = (proj ? proj.targetLang : 'TR').toUpperCase();
            const dateStr = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast('Yazdırma penceresi engellendi. Lütfen tarayıcı açılır pencere iznini verin.');
                return;
            }

            const keys = ['ice', 'exact', 'fuzzy95', 'fuzzy85', 'fuzzy75', 'fuzzy50', 'reps', 'newWords'];
            let rowsHtml = '';
            keys.forEach(k => {
                const item = data.matrix[k];
                const w = sum.weights[k] || 0;
                const ww = Math.round(item.words * (w / 100));
                const cost = (ww * sum.unitRate).toFixed(2);
                rowsHtml += `
                    <tr>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${esc(item.label)}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${item.segs}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${item.words.toLocaleString('tr-TR')}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">%${w}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 600;">${ww.toLocaleString('tr-TR')}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 700;">${cost} ${sum.currency}</td>
                    </tr>
                `;
            });

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Resmi Fiyat ve Hakediş Teklifi - Arık Studio CAT</title>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Segoe UI', -apple-system, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; }
                        .logo { font-size: 22px; font-weight: 800; color: #0369a1; }
                        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
                        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
                        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
                        .total-row { background: #f8fafc; font-weight: 700; font-size: 13px; border-top: 2px solid #0284c7; }
                        .signature-block { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 30px; }
                        .sig-line { width: 220px; border-top: 1px solid #94a3b8; text-align: center; font-size: 12px; color: #64748b; padding-top: 8px; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="logo">ARIK STUDIO LINGUISTIC SERVICES</div>
                            <div class="subtitle">Dil Hizmetleri Sağlayıcısı (LSP) Kurumsal Fiyat Teklifi ve Analiz Raporu</div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #475569;">
                            <div><b>Tarih:</b> ${dateStr}</div>
                            <div><b>Teklif No:</b> PROP-${Date.now().toString().slice(-6)}</div>
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div><b>Proje Başlığı:</b> ${esc(projTitle)}</div>
                        <div><b>Dil Yönü:</b> ${srcLang} ➔ ${tgtLang}</div>
                        <div><b>Birim Kelime Fiyatı:</b> ${sum.unitRate} ${sum.currency}</div>
                        <div><b>Toplam Doküman / İş Boyutu:</b> ${data.docCount} Dosya / ${data.totalWords} Kelime</div>
                    </div>

                    <h3>Fuzzy Match & Ağırlıklı Kelime Maliyet Tablosu</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Eşleşme Kategorisi</th>
                                <th style="text-align: center;">Segment</th>
                                <th style="text-align: right;">Ham Kelime</th>
                                <th style="text-align: center;">Ağırlık</th>
                                <th style="text-align: right;">Ağırlıklı Kelime</th>
                                <th style="text-align: right;">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td style="padding: 12px;">GENEL TOPLAM</td>
                                <td style="padding: 12px; text-align: center; font-family: monospace;">${data.totalSegs}</td>
                                <td style="padding: 12px; text-align: right; font-family: monospace;">${data.totalWords.toLocaleString('tr-TR')}</td>
                                <td style="padding: 12px; text-align: center;">—</td>
                                <td style="padding: 12px; text-align: right; font-family: monospace; color: #0284c7;">${sum.totalWeightedWords.toLocaleString('tr-TR')}</td>
                                <td style="padding: 12px; text-align: right; font-family: monospace; color: #059669; font-size: 14px;">${sum.totalCost.toFixed(2)} ${sum.currency}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="signature-block">
                        <div class="sig-line">Hazırlayan / Çeviri Mimarı<br><b>Arık Studio Project Office</b></div>
                        <div class="sig-line">Müşteri / Kurum Onayı<br><b>Yetkili Kaşe & İmza</b></div>
                    </div>

                    <script>
                        window.onload = function() { window.print(); };
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };
    CatLSP.Analysis = Analysis;

    /* ==========================================================
       MODÜL 2: EDİTÖR (REVIEWER / L2) MODU, TRACK CHANGES & LQA KALİTE PUANLAMA
       ========================================================== */
    const Review = {
        /**
         * Kelime bazlı görsel fark (Diff) üretir:
         * Silinen kelimeleri <del>, eklenen kelimeleri <ins> ile işaretler.
         */
        generateWordDiff(oldText, newText) {
            if (!oldText && !newText) return '';
            if (!oldText) return `<ins class="bg-emerald-100 text-emerald-800 underline px-1 py-0.5 rounded font-medium">${esc(newText)}</ins>`;
            if (!newText) return `<del class="bg-rose-100 text-rose-700 line-through px-1 py-0.5 rounded font-medium">${esc(oldText)}</del>`;

            const oldWords = oldText.trim().split(/\s+/);
            const newWords = newText.trim().split(/\s+/);

            // Basit ve güvenilir kelime dizilim diff algoritması (LCS tabanlı)
            const m = oldWords.length, n = newWords.length;
            const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    if (oldWords[i] === newWords[j]) {
                        dp[i + 1][j + 1] = dp[i][j] + 1;
                    } else {
                        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                    }
                }
            }

            let i = m, j = n;
            const diffParts = [];

            while (i > 0 || j > 0) {
                if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
                    diffParts.unshift({ type: 'same', text: oldWords[i - 1] });
                    i--; j--;
                } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                    diffParts.unshift({ type: 'ins', text: newWords[j - 1] });
                    j--;
                } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
                    diffParts.unshift({ type: 'del', text: oldWords[i - 1] });
                    i--;
                }
            }

            return diffParts.map(p => {
                if (p.type === 'same') return `<span>${esc(p.text)} </span>`;
                if (p.type === 'ins') return `<ins class="bg-emerald-100 text-emerald-800 underline decoration-emerald-500 font-bold px-1 py-0.5 rounded mr-1">${esc(p.text)}</ins> `;
                if (p.type === 'del') return `<del class="bg-rose-100 text-rose-700 line-through decoration-rose-500 font-semibold px-1 py-0.5 rounded mr-1">${esc(p.text)}</del> `;
                return '';
            }).join('');
        },

        /**
         * Kullanıcı rolünü değiştirir: L1 (Çevirmen) <-> L2 (Editör)
         */
        setUserRole(role) {
            if (!global.appState) global.appState = {};
            global.appState.userRole = role; // 'L1' or 'L2'

            const pillL1 = document.getElementById('rolePillL1');
            const pillL2 = document.getElementById('rolePillL2');

            if (role === 'L2') {
                if (pillL1) pillL1.className = 'px-2.5 py-1 text-xs font-semibold rounded-md text-slate-500 hover:text-slate-800 cursor-pointer transition-all';
                if (pillL2) pillL2.className = 'px-2.5 py-1 text-xs font-bold rounded-md bg-purple-600 text-white shadow-sm cursor-pointer transition-all';
                toast('🔍 Editör / Düzeltmen (L2) moduna geçildi. Yapılan düzenlemeler Değişiklik Takibi (Track Changes) ile kaydedilecek.');
            } else {
                if (pillL1) pillL1.className = 'px-2.5 py-1 text-xs font-bold rounded-md bg-sky-600 text-white shadow-sm cursor-pointer transition-all';
                if (pillL2) pillL2.className = 'px-2.5 py-1 text-xs font-semibold rounded-md text-slate-500 hover:text-slate-800 cursor-pointer transition-all';
                toast('👨‍💻 Çevirmen (L1) moduna geçildi.');
            }

            if (typeof global.renderSegments === 'function') global.renderSegments();
        },

        /**
         * Editör modunda segment düzenlendiğinde tetiklenir.
         */
        handleTargetEdit(seg, prevTarget, newTarget) {
            const role = (global.appState && global.appState.userRole) || 'L1';
            if (role === 'L2') {
                // Eğer orijinal çevirmen metni henüz saklanmadıysa kaydet
                if (!seg.original_target && prevTarget && prevTarget.trim().length > 0) {
                    seg.original_target = prevTarget;
                }
            }
        },

        /**
         * Değişikliği Kabul Et (Accept)
         */
        acceptTrackChange(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            delete seg.original_target;
            seg.status = 'reviewed';
            if (typeof global.renderSegments === 'function') global.renderSegments();
            if (typeof global.updateProgressStats === 'function') global.updateProgressStats();
            toast(`Segment #${segId}: Editör değişikliği kabul edildi (Onaylandı/Reviewed).`);
        },

        /**
         * Değişikliği Reddet ve Geri Al (Reject)
         */
        rejectTrackChange(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg || !seg.original_target) return;

            seg.target = seg.original_target;
            delete seg.original_target;
            if (typeof global.renderSegments === 'function') global.renderSegments();
            if (typeof global.updateProgressStats === 'function') global.updateProgressStats();
            toast(`Segment #${segId}: Değişiklik reddedildi, orijinal çevirmen metnine geri dönüldü.`);
        },

        /**
         * Segment Yaşam Döngüsü:
         * Boş (draft) -> Çevrildi (translated) -> Onaylandı (reviewed) -> Kilitli (locked)
         */
        markAsTranslated(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            seg.status = 'translated';
            if (typeof global.saveSegmentToTM === 'function') {
                global.saveSegmentToTM(seg.source, seg.target, seg.id);
            }
            if (typeof global.renderSegments === 'function') global.renderSegments();
            if (typeof global.updateProgressStats === 'function') global.updateProgressStats();
            toast(`Segment #${segId}: Çevrildi (L1 Çevirmen Onayı).`);
        },

        markAsReviewed(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            seg.status = 'reviewed';
            if (seg.original_target) delete seg.original_target;
            if (typeof global.saveSegmentToTM === 'function') {
                global.saveSegmentToTM(seg.source, seg.target, seg.id);
            }
            if (typeof global.renderSegments === 'function') global.renderSegments();
            if (typeof global.updateProgressStats === 'function') global.updateProgressStats();
            toast(`Segment #${segId}: İncelendi ve Tam Onaylandı (L2 Editör Onayı).`);
        },

        /* ---------------- LQA VE YORUM ÇEKMECESİ ---------------- */
        openLqaDrawer(segId) {
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            this.activeSegId = segId;
            let drawer = document.getElementById('catLqaDrawer');
            if (!drawer) {
                drawer = document.createElement('div');
                drawer.id = 'catLqaDrawer';
                drawer.className = 'fixed inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-neutral-900 border-l border-slate-200 dark:border-neutral-700 shadow-2xl z-50 flex flex-col transition-transform duration-300 transform select-none';
                document.body.appendChild(drawer);
            }

            const comments = seg.comments || [];
            const lqaErrors = seg.lqaErrors || [];
            const mqmScore = this.calculateMqmScore(doc);

            drawer.innerHTML = `
                <!-- Çekmece Başlık -->
                <div class="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-850">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-purple-600">rate_review</span>
                        <div class="flex flex-col">
                            <h4 class="text-xs font-bold text-slate-900 dark:text-white">Segment #${seg.id} - İnceleme & LQA</h4>
                            <span class="text-[10px] text-slate-500 font-mono">MQM Kalite Skoru: <b class="text-emerald-600">${mqmScore.score}/100 (${mqmScore.grade})</b></span>
                        </div>
                    </div>
                    <button onclick="CatLSP.Review.closeLqaDrawer()" class="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <!-- Segment Metin Özeti -->
                <div class="p-3 bg-slate-50/50 dark:bg-neutral-800/40 border-b border-slate-200 dark:border-neutral-800 text-xs flex flex-col gap-1.5 font-sans">
                    <div class="text-[11px] text-slate-500 font-bold uppercase">Kaynak Cümle:</div>
                    <div class="text-slate-800 dark:text-neutral-200 line-clamp-2">${esc(seg.source)}</div>
                    <div class="text-[11px] text-slate-500 font-bold uppercase pt-1">Hedef Çeviri:</div>
                    <div class="text-slate-900 dark:text-white font-medium line-clamp-2">${esc(seg.target || '(Boş)')}</div>
                </div>

                <!-- Sekmeler: Yorumlar vs LQA Hata Etiketleri -->
                <div class="flex border-b border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800 text-xs">
                    <button id="lqaTabCommentsBtn" onclick="CatLSP.Review.switchDrawerTab('comments')" class="flex-1 py-2 text-center font-bold text-sky-700 bg-white dark:bg-neutral-900 border-b-2 border-sky-600 cursor-pointer">
                        Yorumlar (${comments.length})
                    </button>
                    <button id="lqaTabErrorsBtn" onclick="CatLSP.Review.switchDrawerTab('errors')" class="flex-1 py-2 text-center font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
                        LQA Hataları (${lqaErrors.length})
                    </button>
                </div>

                <!-- Çekmece Gövdesi -->
                <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs" id="lqaDrawerBody">
                    <!-- YORUMLAR SEKMESİ -->
                    <div id="lqaCommentsSection" class="flex flex-col gap-3">
                        <div class="flex flex-col gap-2" id="lqaCommentsList">
                            ${comments.length === 0 ? `
                                <div class="text-center py-8 text-slate-400 font-mono text-xs">Bu segmente henüz yorum yazılmadı.</div>
                            ` : comments.map(c => `
                                <div class="p-2.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col gap-1 shadow-2xs">
                                    <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                        <span class="font-bold text-slate-700 dark:text-neutral-300">${esc(c.author)} (${c.role})</span>
                                        <span>${c.date}</span>
                                    </div>
                                    <div class="text-slate-800 dark:text-neutral-100 leading-relaxed">${esc(c.text)}</div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Yeni Yorum Yaz -->
                        <div class="pt-2 flex flex-col gap-2 border-t border-slate-200 dark:border-neutral-800">
                            <textarea id="lqaCommentInput" rows="2" placeholder="Segment hakkında çevirmene / editöre not bırakın..." class="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"></textarea>
                            <button onclick="CatLSP.Review.addComment()" class="fluent-btn-primary py-1.5 px-3 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer">
                                <span class="material-symbols-outlined text-[15px]">send</span>
                                <span>Yorum Gönder</span>
                            </button>
                        </div>
                    </div>

                    <!-- LQA HATA ETİKETLERİ SEKMESİ (Gizli) -->
                    <div id="lqaErrorsSection" class="hidden flex flex-col gap-3">
                        <div class="flex flex-col gap-2" id="lqaErrorsList">
                            ${lqaErrors.length === 0 ? `
                                <div class="text-center py-8 text-slate-400 font-mono text-xs">Bu segmentte LQA kalite hatası bulunmuyor.</div>
                            ` : lqaErrors.map((err, eIdx) => `
                                <div class="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col gap-1">
                                    <div class="flex items-center justify-between">
                                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${err.severity === 'critical' ? 'bg-rose-600 text-white' : (err.severity === 'major' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800')}">
                                            ${err.severity.toUpperCase()} (${err.penalty} Ceza Puanı)
                                        </span>
                                        <button onclick="CatLSP.Review.removeLqaError(${eIdx})" class="text-slate-400 hover:text-rose-600 cursor-pointer">
                                            <span class="material-symbols-outlined text-[15px]">delete</span>
                                        </button>
                                    </div>
                                    <div class="font-bold text-slate-800 dark:text-neutral-200 pt-0.5">${esc(err.categoryTitle)}</div>
                                    <div class="text-slate-600 dark:text-neutral-400 text-[11px]">${esc(err.note || 'Not girilmedi')}</div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Yeni LQA Hata Etiketi Ekle -->
                        <div class="pt-2 flex flex-col gap-2 border-t border-slate-200 dark:border-neutral-800">
                            <div class="font-bold text-slate-700 dark:text-neutral-300">Yeni Hata Kaydı (MQM):</div>
                            <div class="flex gap-2">
                                <select id="lqaCategorySelect" class="flex-1 p-1.5 text-xs rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800">
                                    <option value="accuracy">Doğruluk (Accuracy / Anlam Hatası)</option>
                                    <option value="fluency">Akıcılık (Fluency / Dilbilgisi / İmla)</option>
                                    <option value="terminology">Terminoloji (Terminology / Sözlük İhlali)</option>
                                    <option value="style">Biçem & Stil (Style / Kural Uyumsuzluğu)</option>
                                </select>
                            </div>
                            <div class="flex gap-2">
                                <select id="lqaSeveritySelect" class="flex-1 p-1.5 text-xs rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800">
                                    <option value="minor">Düşük (Minor - 1 Puan)</option>
                                    <option value="major">Orta (Major - 5 Puan)</option>
                                    <option value="critical">Kritik (Critical - 25 Puan)</option>
                                </select>
                            </div>
                            <input type="text" id="lqaNoteInput" placeholder="Hata detayı veya düzeltme önerisi..." class="p-1.5 text-xs rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800">
                            <button onclick="CatLSP.Review.addLqaError()" class="fluent-btn-primary py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-1.5 cursor-pointer">
                                <span class="material-symbols-outlined text-[15px]">add_alert</span>
                                <span>Hata Etiketi Ekle</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        switchDrawerTab(tab) {
            const comSection = document.getElementById('lqaCommentsSection');
            const errSection = document.getElementById('lqaErrorsSection');
            const btnCom = document.getElementById('lqaTabCommentsBtn');
            const btnErr = document.getElementById('lqaTabErrorsBtn');

            if (tab === 'comments') {
                comSection.classList.remove('hidden');
                errSection.classList.add('hidden');
                btnCom.className = 'flex-1 py-2 text-center font-bold text-sky-700 bg-white dark:bg-neutral-900 border-b-2 border-sky-600 cursor-pointer';
                btnErr.className = 'flex-1 py-2 text-center font-bold text-slate-500 hover:text-slate-800 cursor-pointer';
            } else {
                comSection.classList.add('hidden');
                errSection.classList.remove('hidden');
                btnErr.className = 'flex-1 py-2 text-center font-bold text-rose-700 bg-white dark:bg-neutral-900 border-b-2 border-rose-600 cursor-pointer';
                btnCom.className = 'flex-1 py-2 text-center font-bold text-slate-500 hover:text-slate-800 cursor-pointer';
            }
        },

        closeLqaDrawer() {
            const d = document.getElementById('catLqaDrawer');
            if (d) d.remove();
            this.activeSegId = null;
        },

        addComment() {
            const input = document.getElementById('lqaCommentInput');
            if (!input || !input.value.trim() || !this.activeSegId) return;

            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === this.activeSegId) : null;
            if (!seg) return;

            if (!seg.comments) seg.comments = [];
            const role = (global.appState && global.appState.userRole) || 'L1';
            seg.comments.push({
                id: 'com-' + Date.now(),
                author: (global.appState && global.appState.userName) || 'Kullanıcı',
                role: role === 'L2' ? 'Editör' : 'Çevirmen',
                text: input.value.trim(),
                date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            });

            this.openLqaDrawer(this.activeSegId);
            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast('Yorum kaydedildi.');
        },

        addLqaError() {
            if (!this.activeSegId) return;
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === this.activeSegId) : null;
            if (!seg) return;

            const catEl = document.getElementById('lqaCategorySelect');
            const sevEl = document.getElementById('lqaSeveritySelect');
            const noteEl = document.getElementById('lqaNoteInput');

            const category = catEl ? catEl.value : 'accuracy';
            const severity = sevEl ? sevEl.value : 'minor';
            const note = noteEl ? noteEl.value.trim() : '';

            const penaltyMap = { minor: 1, major: 5, critical: 25 };
            const catTitleMap = {
                accuracy: 'Doğruluk (Accuracy)',
                fluency: 'Akıcılık (Fluency)',
                terminology: 'Terminoloji (Terminology)',
                style: 'Biçem & Stil (Style)'
            };

            if (!seg.lqaErrors) seg.lqaErrors = [];
            seg.lqaErrors.push({
                id: 'lqa-' + Date.now(),
                category,
                categoryTitle: catTitleMap[category] || category,
                severity,
                penalty: penaltyMap[severity] || 1,
                note,
                date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            });

            this.openLqaDrawer(this.activeSegId);
            this.switchDrawerTab('errors');
            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast('LQA Hata kaydı eklendi.');
        },

        removeLqaError(idx) {
            if (!this.activeSegId) return;
            const doc = getDoc();
            const seg = doc ? doc.segments.find(s => s.id === this.activeSegId) : null;
            if (!seg || !seg.lqaErrors) return;

            seg.lqaErrors.splice(idx, 1);
            this.openLqaDrawer(this.activeSegId);
            this.switchDrawerTab('errors');
            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast('LQA Hata kaydı silindi.');
        },

        calculateMqmScore(doc) {
            if (!doc || !doc.segments) return { score: 100, grade: 'A+' };
            let totalWords = 0;
            let totalPenalties = 0;

            doc.segments.forEach(s => {
                const words = (s.source || '').trim().split(/\s+/).filter(Boolean).length;
                totalWords += words;
                if (s.lqaErrors && s.lqaErrors.length) {
                    s.lqaErrors.forEach(e => totalPenalties += (e.penalty || 0));
                }
            });

            if (totalWords === 0) return { score: 100, grade: 'A+' };

            // MQM Formülü: 100 - (Ceza Puanı / (Toplam Kelime / 1000) * K)
            // Ölçeklendirilmiş puan hesabı
            const wordUnits = Math.max(1, totalWords / 1000);
            const rawScore = 100 - (totalPenalties / wordUnits);
            const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

            let grade = 'A+ (Mükemmel)';
            if (score < 70) grade = 'F (Kusurlu / Red)';
            else if (score < 85) grade = 'C (Revizyon Şart)';
            else if (score < 95) grade = 'B (Başarılı / Geçer)';

            return { score, grade, totalPenalties };
        }
    };
    CatLSP.Review = Review;

    /* ==========================================================
       MODÜL 3.3: TERİM BANKASI TBX (TBX-BASIC ISO 30042) MOTORU
       ========================================================== */
    const TBX = {
        /**
         * Terim Bankasını (Glossary) TBX-Basic standardında XML olarak dışa aktarır.
         */
        exportTbx() {
            const st = global.appState;
            const terms = (st && st.glossary) ? st.glossary : [];
            const proj = getProj();
            const srcLang = (proj && proj.sourceLang) ? proj.sourceLang.toLowerCase() : 'en';
            const tgtLang = (proj && proj.targetLang) ? proj.targetLang.toLowerCase() : 'tr';

            let entriesXml = '';
            terms.forEach((t, idx) => {
                const src = esc(t.source || '');
                const tgt = esc(t.target || '');
                const note = esc(t.note || t.cat || 'General Terminology');

                entriesXml += `      <termEntry id="term_${t.id || (idx + 1)}">
        <descrip type="subjectField">${note}</descrip>
        <langSet xml:lang="${srcLang}">
          <tig>
            <term>${src}</term>
          </tig>
        </langSet>
        <langSet xml:lang="${tgtLang}">
          <tig>
            <term>${tgt}</term>
          </tig>
        </langSet>
      </termEntry>\n`;
            });

            const tbxXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE martif SYSTEM "TBXcoreStructV02.dtd">
<martif type="TBX-Basic" xml:lang="${tgtLang}">
  <martifHeader>
    <fileDesc>
      <titleStmt>
        <title>${esc(proj ? proj.title : 'Arık Studio')} Terim Bankası (TBX-Basic)</title>
      </titleStmt>
      <sourceDesc>
        <p>Arık Studio CAT Tool Kurumsal TBX Standardı</p>
      </sourceDesc>
    </fileDesc>
  </martifHeader>
  <text>
    <body>
${entriesXml}    </body>
  </text>
</martif>`;

            const blob = new Blob([tbxXml], { type: 'application/x-tbx+xml;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Terimce_TBX_${Date.now()}.tbx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast('📚 Terim Bankası TBX-Basic (.tbx) formatında dışa aktarıldı.');
        },

        /**
         * TBX-Basic XML dosyasını ayrıştırır ve sözlüğe ekler.
         */
        importTbxText(xmlString) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xmlString, 'application/xml');
                const termEntries = doc.querySelectorAll('termEntry');

                if (!termEntries || termEntries.length === 0) {
                    toast('Geçerli bir TBX terim girişi bulunamadı.');
                    return false;
                }

                if (!global.appState) global.appState = {};
                if (!global.appState.glossary) global.appState.glossary = [];

                let addedCount = 0;
                termEntries.forEach((entry, idx) => {
                    const langSets = entry.querySelectorAll('langSet');
                    if (langSets.length >= 2) {
                        const term1El = langSets[0].querySelector('term');
                        const term2El = langSets[1].querySelector('term');
                        const descEl = entry.querySelector('descrip');

                        if (term1El && term2El) {
                            const src = term1El.textContent.trim();
                            const tgt = term2El.textContent.trim();
                            const note = descEl ? descEl.textContent.trim() : 'TBX Import';

                            if (src && tgt) {
                                global.appState.glossary.unshift({
                                    id: 'tbx-' + Date.now() + '-' + idx,
                                    source: src,
                                    target: tgt,
                                    cat: note,
                                    date: 'TBX İçe Aktarım'
                                });
                                addedCount++;
                            }
                        }
                    }
                });

                if (typeof global.renderGlossaryDrawer === 'function') global.renderGlossaryDrawer();
                if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
                toast(`✅ TBX Dosyası Başarıyla Yüklendi: ${addedCount} yeni terim eklendi.`);
                return true;
            } catch (err) {
                toast('TBX XML ayrıştırma hatası.');
                return false;
            }
        },

        pickAndImport() {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.tbx,.xml';
            inp.style.display = 'none';
            inp.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    CatLSP.TBX.importTbxText(reader.result);
                };
                reader.readAsText(file, 'utf-8');
            };
            document.body.appendChild(inp);
            inp.click();
            setTimeout(() => inp.remove(), 1000);
        }
    };
    CatLSP.TBX = TBX;

    /* ==========================================================
       MODÜL 4.1: ÇEVİRİ BÜROSU İŞBİRLİĞİ PAKETİ (.catpkg)
       ========================================================== */
    const Package = {
        /**
         * Aktif projeyi tüm detaylarıyla (biçim kalkanları, L1/L2 statüleri,
         * Track Changes original_target, LQA kayıtları, TM ve Terimce dahil)
         * tek bir .catpkg dosyası olarak paketler.
         */
        exportPackage() {
            const st = global.appState;
            const proj = getProj();
            if (!proj) {
                toast('Dışa aktarılacak aktif proje bulunamadı.');
                return;
            }

            const currentProjId = proj.id;
            const projTm = (st.translationMemory || []).filter(t => !t.projectId || t.projectId === currentProjId);
            const projGlossary = (st.glossary || []);

            const packageData = {
                catpkg_version: '2.0-enterprise',
                exported_at: new Date().toISOString(),
                generator: 'Arık Studio CAT Tool Collaboration Suite',
                user_role: st.userRole || 'L1',
                activeProjectId: currentProjId,
                project: proj,
                translationMemory: projTm,
                glossary: projGlossary
            };

            const jsonStr = JSON.stringify(packageData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanTitle = (proj.title || 'Proje').replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, '_');
            a.download = `${cleanTitle}_Isbirligi_Paketi.catpkg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast(`📦 Çeviri İşbirliği Paketi (.catpkg) başarıyla indirildi. L2 Editöre veya PM'e gönderebilirsiniz.`);
        },

        /**
         * .catpkg dosyasını içe aktarır ve çalışma alanını geri yükler.
         */
        importPackageText(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                if (!data.catpkg_version || !data.project) {
                    toast('Geçersiz .catpkg paketi.');
                    return false;
                }

                if (!global.appState) global.appState = {};
                if (!global.appState.projects) global.appState.projects = [];

                // Projeyi ekle veya güncelle
                const existingIdx = global.appState.projects.findIndex(p => p.id === data.project.id);
                if (existingIdx !== -1) {
                    global.appState.projects[existingIdx] = data.project;
                } else {
                    global.appState.projects.unshift(data.project);
                }

                global.appState.activeProjectId = data.project.id;
                if (data.project.documents && data.project.documents.length > 0) {
                    global.appState.activeDocId = data.project.documents[0].id;
                }

                // TM Havuzunu Birleştir
                if (data.translationMemory && Array.isArray(data.translationMemory)) {
                    if (!global.appState.translationMemory) global.appState.translationMemory = [];
                    data.translationMemory.forEach(tm => {
                        if (!global.appState.translationMemory.some(t => t.id === tm.id)) {
                            global.appState.translationMemory.unshift(tm);
                        }
                    });
                }

                // Terim Bankasını Birleştir
                if (data.glossary && Array.isArray(data.glossary)) {
                    if (!global.appState.glossary) global.appState.glossary = [];
                    data.glossary.forEach(g => {
                        if (!global.appState.glossary.some(gl => gl.id === g.id)) {
                            global.appState.glossary.unshift(g);
                        }
                    });
                }

                // UI Yenilemeleri
                if (typeof global.renderSegments === 'function') global.renderSegments();
                if (typeof global.updateProgressStats === 'function') global.updateProgressStats();
                if (typeof global.renderProjectsList === 'function') global.renderProjectsList();
                if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();

                toast(`🎉 .catpkg Paketi Başarıyla Yüklendi: "${data.project.title}" projesi ve tüm statüler açıldı!`);
                return true;
            } catch (err) {
                toast('.catpkg paketi okunurken hata oluştu.');
                return false;
            }
        },

        pickAndImport() {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.catpkg,.json';
            inp.style.display = 'none';
            inp.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    CatLSP.Package.importPackageText(reader.result);
                };
                reader.readAsText(file, 'utf-8');
            };
            document.body.appendChild(inp);
            inp.click();
            setTimeout(() => inp.remove(), 1000);
        }
    };
    CatLSP.Package = Package;

    /* ==========================================================
       MODÜL 4.2: CANLI BELGE ÖNİZLEME (WYSIWYG IN-CONTEXT PREVIEW)
       ========================================================== */
    const LivePreview = {
        openModal() {
            const doc = getDoc();
            if (!doc) {
                toast('Önizleme için aktif bir belge bulunamadı.');
                return;
            }

            let backdrop = document.getElementById('modalLiveDocumentPreviewBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'modalLiveDocumentPreviewBackdrop';
                backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none';
                document.body.appendChild(backdrop);
            }

            backdrop.innerHTML = `
                <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-scaleUp">
                    <!-- Modal Başlık -->
                    <div class="px-6 py-3.5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-800/60">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                                <span class="material-symbols-outlined text-[20px]">preview</span>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Canlı Belge Önizleme (WYSIWYG In-Context Preview)</span>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 font-bold">Sayfa Düzeni</span>
                                </h3>
                                <p class="text-[11px] text-slate-500 font-mono">${esc(doc.name || 'Belge')} • ${doc.segments ? doc.segments.length : 0} Segment</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="window.print()" class="fluent-btn px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-300 dark:border-neutral-700 cursor-pointer">
                                <span class="material-symbols-outlined text-[15px]">print</span>
                                <span>Yazdır</span>
                            </button>
                            <button onclick="CatLSP.LivePreview.closeModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
                                <span class="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    <!-- İki Sütunlu Yan Yana Canlı Sayfa Düzeni -->
                    <div class="flex-1 overflow-y-auto p-6 flex gap-6 bg-slate-100 dark:bg-neutral-950 font-sans select-text" id="livePreviewContainer">
                        <!-- Sol Sayfa: Kaynak Doküman (Orijinal Biçimlendirme) -->
                        <div class="flex-1 bg-white dark:bg-neutral-900 p-8 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4 overflow-y-auto">
                            <div class="text-[11px] font-bold font-mono uppercase text-slate-400 border-b border-slate-100 dark:border-neutral-800 pb-2 flex items-center justify-between">
                                <span>KAYNAK DOKÜMAN</span>
                                <span class="text-slate-300">Orijinal Format</span>
                            </div>
                            <div class="flex flex-col gap-3 text-[13px] leading-relaxed text-slate-800 dark:text-neutral-200" id="livePreviewSourceBody">
                                <!-- JS ile doldurulacak -->
                            </div>
                        </div>

                        <!-- Sağ Sayfa: Hedef Çeviri Dokümanı (Canlı Biçimlendirme Kalkanı) -->
                        <div class="flex-1 bg-white dark:bg-neutral-900 p-8 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4 overflow-y-auto">
                            <div class="text-[11px] font-bold font-mono uppercase text-slate-400 border-b border-slate-100 dark:border-neutral-800 pb-2 flex items-center justify-between">
                                <span>HEDEF ÇEVİRİ DOKÜMANI</span>
                                <span class="text-emerald-500 font-bold">Canlı Önizleme</span>
                            </div>
                            <div class="flex flex-col gap-3 text-[13px] leading-relaxed text-slate-900 dark:text-white font-medium" id="livePreviewTargetBody">
                                <!-- JS ile doldurulacak -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.renderPreviewContent(doc);
        },

        closeModal() {
            const b = document.getElementById('modalLiveDocumentPreviewBackdrop');
            if (b) b.remove();
        },

        focusSegmentFromPreview(segId) {
            this.closeModal();
            if (typeof global.focusSegment === 'function') {
                global.focusSegment(segId);
            }
        },

        renderPreviewContent(doc) {
            const srcBody = document.getElementById('livePreviewSourceBody');
            const tgtBody = document.getElementById('livePreviewTargetBody');
            if (!srcBody || !tgtBody || !doc || !doc.segments) return;

            // Paragraflara göre grupla
            const paras = new Map();
            doc.segments.forEach(seg => {
                const pIdx = (seg.docx && seg.docx.p !== undefined) ? seg.docx.p : Math.floor(seg.id / 3);
                if (!paras.has(pIdx)) paras.set(pIdx, []);
                paras.get(pIdx).push(seg);
            });

            let srcHtml = '';
            let tgtHtml = '';

            paras.forEach((segs, pIdx) => {
                srcHtml += `<p class="p-2 rounded hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">`;
                tgtHtml += `<p class="p-2 rounded hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">`;

                segs.forEach(s => {
                    const srcText = esc(s.source || '');
                    const tgtText = s.target ? esc(s.target) : `<span class="italic text-slate-400 font-normal">[Segment #${s.id} çevrilmedi]</span>`;

                    srcHtml += `<span class="cursor-pointer hover:bg-sky-100/70 dark:hover:bg-sky-950/40 rounded px-0.5" onclick="CatLSP.LivePreview.focusSegmentFromPreview(${s.id})" title="Segmente gitmek için tıklayın (#${s.id})">${srcText} </span>`;
                    tgtHtml += `<span class="cursor-pointer hover:bg-purple-100/70 dark:hover:bg-purple-950/40 rounded px-0.5" onclick="CatLSP.LivePreview.focusSegmentFromPreview(${s.id})" title="Segmente gitmek için tıklayın (#${s.id})">${tgtText} </span>`;
                });

                srcHtml += `</p>`;
                tgtHtml += `</p>`;
            });

            srcBody.innerHTML = srcHtml;
            tgtBody.innerHTML = tgtHtml;
        }
    };
    CatLSP.LivePreview = LivePreview;

    // Sayfa yüklendiğinde DRM ve Rol başlatıcıları
    document.addEventListener('DOMContentLoaded', () => {
        CatLSP.DRM.init();
    });

})(window);

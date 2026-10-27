/* ==========================================================
   GELİŞMİŞ KALİTE GÜVENCE (QA) MOTORU VE ÇÖZÜM DİYALOĞU
   ----------------------------------------------------------
   - Sayı uyuşmazlığı (1.000 vs 1,000 / 1.5 vs 1,5 sayı biçimlerini anlayan gelişmiş parser)
   - Noktalama uyuşmazlığı
   - Çevrilmemiş segment (untranslated)
   - Çift boşluk (double space)
   - Kaynak = Hedef kopyası (source equals target)
   - Tutarsız çeviri (inconsistent translation: aynı kaynak farklı hedef)
   - Terimce ihlalleri (glossary violations)
   - Akıllı Biçimlendirme Kalkanı çakışmaları (eksik kalkan, kalkana bağlı olmayan biçim)
   - Toplu QA Raporu ve Çözüm Diyaloğu
   ========================================================== */
(function (global) {
    'use strict';

    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const norm = (s) => (typeof global.normalizeString === 'function' ? global.normalizeString(s) : String(s).trim().toLowerCase());

    /**
     * Sayıları kültürden bağımsız olarak normalleştirir.
     * Ör: "1.000" (TR binlik) -> "1000", "1,000" (EN binlik) -> "1000"
     * "1.5" (EN ondalık) -> "1.5", "1,5" (TR ondalık) -> "1.5"
     */
    function extractNormalizedNumbers(text) {
        if (!text) return [];
        // Sayı öbeklerini yakala: 1.000.000, 1,000,000, 3.14, 3,14, 42 vb.
        const matches = text.match(/\b\d+(?:[.,]\d+)*\b/g) || [];
        return matches.map(raw => {
            let clean = raw;
            // Eğer hem nokta hem virgül varsa (örn 1,000.50 veya 1.000,50)
            if (clean.includes('.') && clean.includes(',')) {
                const lastDot = clean.lastIndexOf('.');
                const lastComma = clean.lastIndexOf(',');
                if (lastDot > lastComma) {
                    // 1,000.50 -> virgülleri at
                    clean = clean.replace(/,/g, '');
                } else {
                    // 1.000,50 -> noktaları at, virgülü nokta yap
                    clean = clean.replace(/\./g, '').replace(',', '.');
                }
            } else if (clean.includes('.') || clean.includes(',')) {
                // Sadece nokta veya sadece virgül var
                const sep = clean.includes('.') ? '.' : ',';
                const parts = clean.split(sep);
                if (parts.length > 2) {
                    // 1.000.000 veya 1,000,000 -> binlik ayırıcı, hepsini birleştir
                    clean = parts.join('');
                } else if (parts.length === 2) {
                    // 1.000 mi yoksa 1.5 mi? Son grup tam 3 basamaklı ve baştaki kısım 1-3 basamaksa binlik olabilir
                    if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
                        // Çift olasılık: Hem 1000 hem 1.000 olarak kaydedelim
                        clean = parts.join('');
                    } else {
                        // Ondalık sayı kabul et
                        clean = parts[0] + '.' + parts[1];
                    }
                }
            }
            const numVal = parseFloat(clean);
            return {
                raw,
                normalized: isNaN(numVal) ? raw : String(numVal)
            };
        });
    }

    /**
     * Tek bir segment için tüm QA kurallarını çalıştırır
     */
    function checkSegmentQA(seg, doc) {
        const issues = [];
        const src = (seg.source || '').trim();
        const tgt = (seg.target || '').trim();
        const isConfirmed = seg.status === 'confirmed';

        // 1. Çevrilmemiş Segment Denetimi
        if (!tgt && src) {
            issues.push({
                type: 'untranslated',
                level: isConfirmed ? 'error' : 'warn',
                icon: 'edit_note',
                title: 'Çevrilmemiş Segment',
                msg: 'Hedef çeviri alanı henüz doldurulmadı.'
            });
            return issues; // Metin yoksa diğer metin kontrollerini atla
        }

        // 2. Kaynak = Hedef Kopyası Denetimi
        if (src.length > 4 && src.toLowerCase() === tgt.toLowerCase()) {
            issues.push({
                type: 'source_equals_target',
                level: 'warn',
                icon: 'content_copy',
                title: 'Kaynakla Birebir Aynı',
                msg: 'Hedef metin, kaynak metin ile harfi harfine aynı görünüyor. Çevrilmemiş olabilir.'
            });
        }

        // 3. Çift Boşluk Denetimi
        if (/\s{2,}/.test(seg.target || '')) {
            issues.push({
                type: 'double_space',
                level: 'warn',
                icon: 'space_bar',
                title: 'Çift Boşluk Hatası',
                msg: 'Hedef metin içerisinde ardışık iki veya daha fazla boşluk tespit edildi.'
            });
        }

        // 4. Akıllı Sayı Eşleşmesi Denetimi (Binlik ve Ondalık Normalizasyonlu)
        const srcNums = extractNormalizedNumbers(src);
        if (srcNums.length > 0) {
            const tgtNums = extractNormalizedNumbers(tgt);
            const tgtNorms = new Set(tgtNums.map(n => n.normalized));
            const tgtRaws = new Set(tgtNums.map(n => n.raw));

            const missingNums = srcNums.filter(sn => !tgtNorms.has(sn.normalized) && !tgtRaws.has(sn.raw));
            if (missingNums.length > 0) {
                const uniqueMissing = Array.from(new Set(missingNums.map(n => n.raw)));
                issues.push({
                    type: 'number',
                    level: 'error',
                    icon: 'pin',
                    title: 'Sayı / Değer Uyuşmazlığı',
                    msg: `Kaynaktaki [${uniqueMissing.join(', ')}] sayısı hedef metinde eşleşmedi (1.000/1,000 biçimleri dahil).`
                });
            }
        }

        // 5. Noktalama Eşleşmesi Denetimi (. ? ! : ;)
        const punctChars = ['.', '?', '!', ':', ';'];
        const lastSrc = src.slice(-1);
        const lastTgt = tgt.slice(-1);

        if (punctChars.includes(lastSrc)) {
            if (!punctChars.includes(lastTgt)) {
                issues.push({
                    type: 'punct',
                    level: 'warn',
                    icon: 'edit_attributes',
                    title: 'Eksik Noktalama',
                    msg: `Kaynak '${lastSrc}' ile biterken hedefte bitiş noktalama işareti eksik!`
                });
            } else if (lastSrc !== lastTgt) {
                issues.push({
                    type: 'punct',
                    level: 'warn',
                    icon: 'edit_attributes',
                    title: 'Farklı Noktalama',
                    msg: `Kaynak '${lastSrc}' ile biterken hedef '${lastTgt}' ile bitiyor.`
                });
            }
        }

        // 6. Terimce (Glossary) İhlali Denetimi
        if (typeof global.checkGlossaryViolations === 'function') {
            const termViolations = global.checkGlossaryViolations(src, tgt);
            if (termViolations && termViolations.length > 0) {
                issues.push({
                    type: 'glossary',
                    level: 'error',
                    icon: 'warning',
                    title: 'Zorunlu Terim İhlali',
                    msg: `Terimce eşleşmeleri hedefte bulunamadı: ${termViolations.map(v => `"${v.source}" ➔ "${v.target}"`).join(', ')}`
                });
            }
        }

        // 7. Tutarsız Çeviri Denetimi (Inconsistent Translation)
        if (doc && doc.segments) {
            const srcNorm = norm(src);
            const otherSameSrc = doc.segments.find(s => s.id !== seg.id && s.target && s.target.trim() && norm(s.source) === srcNorm);
            if (otherSameSrc && norm(otherSameSrc.target) !== norm(tgt)) {
                issues.push({
                    type: 'inconsistent',
                    level: 'warn',
                    icon: 'sync_problem',
                    title: 'Tutarsız Çeviri',
                    msg: `Aynı kaynak cümle Segment #${otherSameSrc.id} içinde farklı çevrildi: "${otherSameSrc.target.slice(0, 40)}..."`
                });
            }
        }

        // 8. Akıllı Biçimlendirme Kalkanı Çakışmaları
        if (global.FormatShield && typeof global.FormatShield.qa === 'function') {
            const shieldIssues = global.FormatShield.qa(seg);
            shieldIssues.forEach(si => {
                issues.push({
                    type: 'shield_' + si.type,
                    level: si.level || 'error',
                    icon: 'shield',
                    title: 'Biçim Kalkanı Hatası',
                    msg: si.msg,
                    shieldId: si.shieldId,
                    runIdx: si.runIdx
                });
            });
        }

        // 9. Türkçe İmla, Yazım ve Dilbilgisi Kuralları (de/da, ki, mi, şey vb.)
        const trIssues = checkTurkishGrammarAndSpelling(tgt);
        trIssues.forEach(ti => issues.push(ti));

        return issues;
    }

    /**
     * Tüm aktif belge için toplu QA taraması gerçekleştirir
     */
    function runBatchQA(doc) {
        if (!doc) doc = global.getActiveDoc();
        if (!doc || !doc.segments) return { totalIssues: 0, errorCount: 0, warnCount: 0, results: [] };

        const results = [];
        let errorCount = 0;
        let warnCount = 0;

        doc.segments.forEach(seg => {
            const segIssues = checkSegmentQA(seg, doc);
            if (segIssues.length > 0) {
                segIssues.forEach(is => {
                    if (is.level === 'error') errorCount++;
                    else warnCount++;
                });
                results.push({
                    seg,
                    issues: segIssues
                });
            }
        });

        return {
            totalIssues: errorCount + warnCount,
            errorCount,
            warnCount,
            results
        };
    }

    /**
     * Toplu QA Raporu ve Çözüm Diyaloğu Modalı
     */
    function openBatchQAModal() {
        const doc = global.getActiveDoc();
        if (!doc) return toast('Aktif belge bulunamadı.');

        const qaReport = runBatchQA(doc);
        const existing = document.getElementById('modalQAReportBackdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'modalQAReportBackdrop';
        backdrop.style.cssText = 'position:fixed;inset:0;z-index:99995;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;';

        let contentHtml = '';
        if (qaReport.totalIssues === 0) {
            contentHtml = `
                <div class="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
                        <span class="material-symbols-outlined text-[36px]">verified</span>
                    </div>
                    <h3 class="text-base font-bold text-slate-800">Tebrikler! Sıfır QA Hatası</h3>
                    <p class="text-xs text-slate-500 max-w-sm">
                        Belgedeki tüm segmentler sayı, noktalama, terimce, kalkan stilleri ve tutarlılık açısından kusursuz bir şekilde doğrulandı.
                    </p>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full ${qaReport.errorCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-600'}">
                        ${qaReport.errorCount} Kritik Hata
                    </span>
                    <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full ${qaReport.warnCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'}">
                        ${qaReport.warnCount} Uyarı
                    </span>
                    <span class="text-xs text-slate-500 ml-auto font-medium">Toplam ${qaReport.results.length} segmentte sorun var</span>
                </div>
                <div class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1 pt-2">
                    ${qaReport.results.map(({ seg, issues }) => `
                        <div class="p-3 rounded-xl border ${issues.some(i => i.level === 'error') ? 'border-rose-200 bg-rose-50/30' : 'border-amber-200 bg-amber-50/30'} flex flex-col gap-2 transition-all">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
                                    <span class="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">#${seg.id}</span>
                                    <span>Segment #${seg.id}</span>
                                </span>
                                <button type="button" onclick="CatQA.jumpToSegment(${seg.id})" class="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-0.5 rounded border border-sky-200 transition-all cursor-pointer">
                                    Editörde Git ➔
                                </button>
                            </div>
                            <div class="text-[11px] text-slate-600 line-clamp-1 italic bg-white/70 p-1.5 rounded border border-slate-200/60 font-sans">
                                <strong>Kaynak:</strong> ${esc(seg.source)}
                            </div>
                            ${seg.target ? `
                                <div class="text-[11px] text-slate-800 line-clamp-1 bg-white/90 p-1.5 rounded border border-slate-200/80 font-medium">
                                    <strong>Hedef:</strong> ${esc(seg.target)}
                                </div>
                            ` : '<span class="text-[11px] font-mono text-rose-600 italic">[Hedef Çeviri Boş]</span>'}
                            
                            <!-- Hata Listesi -->
                            <div class="flex flex-col gap-1.5 pt-1">
                                ${issues.map(is => `
                                    <div class="flex items-start gap-1.5 text-xs ${is.level === 'error' ? 'text-rose-800' : 'text-amber-800'}">
                                        <span class="material-symbols-outlined text-[15px] shrink-0 mt-0.5 ${is.level === 'error' ? 'text-rose-600' : 'text-amber-600'}">${is.icon || 'warning'}</span>
                                        <div class="flex-1 leading-snug">
                                            <strong>${esc(is.title)}:</strong> ${esc(is.msg)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            ${issues.some(i => i.type.startsWith('shield_')) ? `
                                <div class="pt-1 flex justify-end">
                                    <button type="button" onclick="CatQA.resolveShieldForSeg(${seg.id})" class="text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded-md border border-purple-300 transition-all cursor-pointer flex items-center gap-1">
                                        <span>Kalkan Çakışmasını Çöz</span>
                                        <span class="material-symbols-outlined text-[13px]">tune</span>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        backdrop.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden animate-fadeIn" onclick="event.stopPropagation()">
                <div class="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-400 text-[22px]">policy</span>
                        <h2 class="text-sm font-bold tracking-wide">Gelişmiş Kalite Güvencesi (QA) Denetim Raporu</h2>
                    </div>
                    <button type="button" onclick="CatQA.closeModal()" class="w-7 h-7 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors">
                        ✕
                    </button>
                </div>
                <div class="p-5 flex flex-col gap-3">
                    ${contentHtml}
                </div>
                <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span class="text-[11px] text-slate-500 font-medium">Hataları düzeltmeden teslimat veya onay yapılması önerilmez.</span>
                    <button type="button" onclick="CatQA.closeModal()" class="fluent-btn px-4 h-8 text-xs font-bold rounded-lg text-slate-700 bg-white border-slate-300 hover:bg-slate-100">
                        Kapat
                    </button>
                </div>
            </div>
        `;

        backdrop.onclick = () => CatQA.closeModal();
        document.body.appendChild(backdrop);
    }

    /**
     * TÜRKÇE YAZIM, İMLA VE DİLBİLGİSİ DENETLEYİCİSİ
     * - de / da bağlacı ayrımı ve te/ta sertleşme hatası
     * - ki bağlacı ayrımı
     * - mi / mı / mu / mü soru eki ayrımı
     * - "şey" sözcüğünün ayrı yazımı
     * - Yaygın yazım yanlışları (herkez, yanlız, orjinal, süpriz vb.)
     * - Noktalama öncesi/sonrası boşluk kuralları
     */
    function checkTurkishGrammarAndSpelling(tgt) {
        if (!tgt || typeof tgt !== 'string') return [];
        const issues = [];

        // 1. "de / da" Bağlacı Bitişik Yazım Hataları
        const deDaMatches = [
            { rx: /\b(bende)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(gele|gide|bili|yap|et|ol|sev|iste|gör|duy|al|ver|çalış|ara|düşün|katıl|katkı|anla|oku|yaz)/i, wrong: 'bende', fix: 'ben de', msg: "Bağlaç olan 'de' ayrı yazılmalıdır: 'ben de'." },
            { rx: /\b(sende)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(gele|gide|bili|yap|et|ol|sev|iste|gör|duy|al|ver|çalış|ara|düşün|katıl|katkı|anla|oku|yaz)/i, wrong: 'sende', fix: 'sen de', msg: "Bağlaç olan 'de' ayrı yazılmalıdır: 'sen de'." },
            { rx: /\b(oda)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(gele|gide|bili|yap|et|ol|sev|iste|gör|duy|al|ver|çalış|ara|düşün|katıl|bizimle|onunla|böyle|şöyle)/i, wrong: 'oda', fix: 'o da', msg: "Bağlaç olan 'da' ayrı yazılmalıdır: 'o da'." },
            { rx: /\b(bizde)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(gele|gide|bili|yap|et|ol|sev|iste|gör|duy|al|ver|çalış|ara|düşün|katıl)/i, wrong: 'bizde', fix: 'biz de', msg: "Bağlaç olan 'de' ayrı yazılmalıdır: 'biz de'." },
            { rx: /\b(sizde)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(gele|gide|bili|yap|et|ol|sev|iste|gör|duy|al|ver|çalış|ara|düşün|katıl)/i, wrong: 'sizde', fix: 'siz de', msg: "Bağlaç olan 'de' ayrı yazılmalıdır: 'siz de'." },
            { rx: /\b(onlarda)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(gele|gide|bili|yap|et|ol|sev|iste|gör|duy|al|ver|çalış|ara|düşün|katıl)/i, wrong: 'onlarda', fix: 'onlar da', msg: "Bağlaç olan 'da' ayrı yazılmalıdır: 'onlar da'." },
            { rx: /\b(herkeste)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü]+\s+)*(bunu|bili|görü|anla|sev|iste|farkında)/i, wrong: 'herkeste', fix: 'herkes de', msg: "Bağlaç olan 'de' ayrı yazılmalıdır: 'herkes de'." }
        ];

        deDaMatches.forEach(rule => {
            const m = tgt.match(rule.rx);
            if (m) {
                issues.push({
                    type: 'tr_grammar_deda',
                    level: 'error',
                    icon: 'spellcheck',
                    title: "Türkçe Yazım Kuralı: 'de/da' Ayrımı",
                    wrongText: rule.wrong,
                    suggestedFix: rule.fix,
                    msg: rule.msg
                });
            }
        });

        // 2. Bağlaç Olan "de/da"nın Sertleşme (te/ta) Hatası
        const teTaMatch = tgt.match(/\b([A-ZÇĞİÖŞÜa-zçğıöşü]+)\s+(te|ta)\b/);
        if (teTaMatch) {
            const word = teTaMatch[1];
            const conj = teTaMatch[2];
            const fix = conj === 'te' ? 'de' : 'da';
            issues.push({
                type: 'tr_grammar_teta',
                level: 'error',
                icon: 'spellcheck',
                title: "Türkçe Yazım Kuralı: Sertleşme Hatası ('te/ta')",
                wrongText: `${word} ${conj}`,
                suggestedFix: `${word} ${fix}`,
                msg: `Bağlaç olan 'de/da' asla sertleşmez ve 'te/ta' olarak yazılmaz. Doğrusu: '${word} ${fix}'.`
            });
        }

        // 3. "ki" Bağlacının Bitişik Yazım Hataları
        const kiMatches = [
            { rx: /\b(bilmemki)\b/i, wrong: 'bilmemki', fix: 'bilmem ki' },
            { rx: /\b(demekki)\b/i, wrong: 'demekki', fix: 'demek ki' },
            { rx: /\b(kaldıki)\b/i, wrong: 'kaldıki', fix: 'kaldı ki' },
            { rx: /\b(öyleki)\b/i, wrong: 'öyleki', fix: 'öyle ki' },
            { rx: /\b(anladımki)\b/i, wrong: 'anladımki', fix: 'anladım ki' },
            { rx: /\b(yeterki)\b/i, wrong: 'yeterki', fix: 'yeter ki' },
            { rx: /\b(gördümki)\b/i, wrong: 'gördümki', fix: 'gördüm ki' }
        ];
        kiMatches.forEach(rule => {
            if (rule.rx.test(tgt)) {
                issues.push({
                    type: 'tr_grammar_ki',
                    level: 'error',
                    icon: 'spellcheck',
                    title: "Türkçe Yazım Kuralı: 'ki' Bağlacı",
                    wrongText: rule.wrong,
                    suggestedFix: rule.fix,
                    msg: `Bağlaç olan 'ki' ayrı yazılmalıdır. Doğrusu: '${rule.fix}'.`
                });
            }
        });

        // 4. "mi / mı / mu / mü" Soru Ekinin Bitişik Yazımı
        const miRegex = /\b([a-zçğıöşüA-ZÇĞİÖŞÜ]+)(mi|mı|mu|mü)\b/gi;
        let mm;
        while ((mm = miRegex.exec(tgt)) !== null) {
            const whole = mm[0];
            const root = mm[1];
            const particle = mm[2];
            const exceptions = ['cami', 'samimi', 'resmi', 'azami', 'acemi', 'mimar', 'harami', 'şahsi', 'primi', 'hakemi', 'sistemi', 'ekonomi'];
            if (!exceptions.includes(whole.toLowerCase()) && root.length >= 3) {
                issues.push({
                    type: 'tr_grammar_mi',
                    level: 'error',
                    icon: 'help',
                    title: "Türkçe Yazım Kuralı: Soru Eki ('mi/mı/mu/mü')",
                    wrongText: whole,
                    suggestedFix: `${root} ${particle}`,
                    msg: `Soru eki ('${particle}') her zaman sözcükten ayrı yazılmalıdır: '${root} ${particle}'.`
                });
                break;
            }
        }

        // 5. "Şey" Sözcüğünün Bitişik Yazımı
        const seyMatches = [
            { rx: /\b(birşey)\b/i, wrong: 'birşey', fix: 'bir şey' },
            { rx: /\b(herşey)\b/i, wrong: 'herşey', fix: 'her şey' },
            { rx: /\b(hiçbirşey)\b/i, wrong: 'hiçbirşey', fix: 'hiçbir şey' },
            { rx: /\b(çokşey)\b/i, wrong: 'çokşey', fix: 'çok şey' }
        ];
        seyMatches.forEach(rule => {
            if (rule.rx.test(tgt)) {
                issues.push({
                    type: 'tr_grammar_sey',
                    level: 'error',
                    icon: 'spellcheck',
                    title: "Türkçe Yazım Kuralı: 'Şey' Sözcüğü",
                    wrongText: rule.wrong,
                    suggestedFix: rule.fix,
                    msg: `'Şey' sözcüğü daima ayrı yazılır. Doğrusu: '${rule.fix}'.`
                });
            }
        });

        // 6. Yaygın İmla & Yazım Hataları
        const commonSpellingMistakes = [
            { rx: /\b(herkez)\b/i, wrong: 'herkez', fix: 'herkes', msg: "Doğrusu 'herkes' olmalıdır ('z' yerine 's')." },
            { rx: /\b(yanlız)\b/i, wrong: 'yanlız', fix: 'yalnız', msg: "Doğrusu 'yalnız' olmalıdır ('yalın' kökünden)." },
            { rx: /\b(yalnış)\b/i, wrong: 'yalnış', fix: 'yanlış', msg: "Doğrusu 'yanlış' olmalıdır ('yanılmak' kökünden)." },
            { rx: /\b(orjinal)\b/i, wrong: 'orjinal', fix: 'orijinal', msg: "Doğrusu 'orijinal' olmalıdır." },
            { rx: /\b(laboratuar)\b/i, wrong: 'laboratuar', fix: 'laboratuvar', msg: "Doğrusu 'laboratuvar' olmalıdır." },
            { rx: /\b(döküman)\b/i, wrong: 'döküman', fix: 'doküman', msg: "Doğrusu 'doküman' olmalıdır ('o' ile)." },
            { rx: /\b(süpriz)\b/i, wrong: 'süpriz', fix: 'sürpriz', msg: "Doğrusu 'sürpriz' olmalıdır." },
            { rx: /\b(şöför)\b/i, wrong: 'şöför', fix: 'şoför', msg: "Doğrusu 'şoför' olmalıdır." },
            { rx: /\b(kıravat)\b/i, wrong: 'kıravat', fix: 'kravat', msg: "Doğrusu 'kravat' olmalıdır." },
            { rx: /\b(traş)\b/i, wrong: 'traş', fix: 'tıraş', msg: "Doğrusu 'tıraş' olmalıdır ('ı' ile)." },
            { rx: /\b(tabiki)\b/i, wrong: 'tabiki', fix: 'tabii ki', msg: "Doğrusu 'tabii ki' olmalıdır." }
        ];
        commonSpellingMistakes.forEach(rule => {
            if (rule.rx.test(tgt)) {
                issues.push({
                    type: 'tr_spelling',
                    level: 'error',
                    icon: 'spellcheck',
                    title: "Türkçe İmla Hatası",
                    wrongText: rule.wrong,
                    suggestedFix: rule.fix,
                    msg: rule.msg
                });
            }
        });

        // 7. Noktalama Boşluk Kuralı: Noktalamadan önce boşluk bırakılması
        const punctBeforeSpace = tgt.match(/\s+([.,!?:;])/);
        if (punctBeforeSpace) {
            issues.push({
                type: 'tr_punct_space',
                level: 'warn',
                icon: 'space_bar',
                title: 'Noktalama Öncesi Fazla Boşluk',
                wrongText: punctBeforeSpace[0],
                suggestedFix: punctBeforeSpace[1],
                msg: `Noktalama işaretinden ('${punctBeforeSpace[1]}') önce boşluk bırakılmamalıdır.`
            });
        }

        return issues;
    }

    /**
     * TEKİL SEGMENT QA DETAY AÇILIR KUTUSU (POPOVER / MODAL)
     * Ünlem işaretine tıklandığında açılır; hataları ve tek tıkla düzeltme butonunu gösterir.
     */
    function openSegmentQAPopover(segId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const doc = typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null;
        if (!doc || !doc.segments) return;
        const seg = doc.segments.find(s => s.id === segId);
        if (!seg) return;

        const issues = checkSegmentQA(seg, doc);
        closeSegmentQAPopover();

        if (issues.length === 0) {
            toast(`Segment #${segId} için herhangi bir kalite veya imla hatası bulunamadı.`);
            return;
        }

        const popover = document.createElement('div');
        popover.id = 'segmentQAPopoverModal';
        popover.className = 'fixed inset-0 z-[99996] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn select-none';

        const issueCards = issues.map((is, i) => {
            const hasFix = is.wrongText && is.suggestedFix;
            return `
                <div class="p-3 rounded-xl border ${is.level === 'error' ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'} flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 font-bold text-xs ${is.level === 'error' ? 'text-rose-900 dark:text-rose-200' : 'text-amber-900 dark:text-amber-200'}">
                            <span class="material-symbols-outlined text-[17px] ${is.level === 'error' ? 'text-rose-600' : 'text-amber-600'}">${is.icon || 'report_problem'}</span>
                            <span>${esc(is.title || 'Kalite / İmla Uyarısı')}</span>
                        </div>
                        <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${is.level === 'error' ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}">
                            ${is.level === 'error' ? 'Hata' : 'Uyarı'}
                        </span>
                    </div>

                    <p class="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-sans">
                        ${esc(is.msg)}
                    </p>

                    ${hasFix ? `
                        <div class="flex items-center justify-between pt-1 border-t border-rose-200/60 dark:border-rose-900/60 flex-wrap gap-2">
                            <div class="flex items-center gap-2 text-xs font-mono">
                                <span class="line-through text-rose-600 dark:text-rose-400 font-bold bg-white/70 dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-rose-300">
                                    ${esc(is.wrongText)}
                                </span>
                                <span class="text-slate-400">➔</span>
                                <span class="text-emerald-700 dark:text-emerald-400 font-bold bg-white/70 dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-emerald-300">
                                    ${esc(is.suggestedFix)}
                                </span>
                            </div>
                            <button type="button" 
                                    onclick="CatQA.applyQAFix(${seg.id}, '${esc(is.wrongText)}', '${esc(is.suggestedFix)}')"
                                    class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95">
                                <span class="material-symbols-outlined text-[14px]">auto_fix_high</span>
                                <span>Düzeltmeyi Uygula</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        popover.innerHTML = `
            <div class="relative w-full max-w-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
                <!-- Başlık -->
                <div class="px-5 py-3.5 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                            !
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-800 dark:text-white">Segment #${seg.id} Kalite ve İmla Denetimi</h3>
                            <p class="text-[11px] text-slate-500 dark:text-neutral-400">Toplam ${issues.length} hata / uyarı tespit edildi</p>
                        </div>
                    </div>
                    <button type="button" onclick="CatQA.closeSegmentQAPopover()" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <!-- Gövde -->
                <div class="p-5 overflow-y-auto flex flex-col gap-3">
                    <div class="text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 font-sans">
                        <span class="text-[10px] font-mono font-bold text-slate-400 block mb-0.5 uppercase">Mevcut Hedef Çeviri:</span>
                        “${esc(seg.target || '(Boş)')}”
                    </div>
                    ${issueCards}
                </div>

                <!-- Alt Bar -->
                <div class="px-5 py-3 bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end">
                    <button type="button" onclick="CatQA.closeSegmentQAPopover()" class="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 cursor-pointer">
                        Kapat
                    </button>
                </div>
            </div>
        `;

        // Dışarı tıklayınca kapat
        popover.addEventListener('click', (e) => {
            if (e.target === popover) closeSegmentQAPopover();
        });

        document.body.appendChild(popover);
    }

    function closeSegmentQAPopover() {
        const el = document.getElementById('segmentQAPopoverModal');
        if (el) el.remove();
    }

    function applyQAFix(segId, wrongText, fixText) {
        const doc = typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null;
        if (!doc || !doc.segments) return;
        const seg = doc.segments.find(s => s.id === segId);
        if (!seg || !seg.target) return;

        const prevTarget = seg.target;
        // Regex ile büyük-küçük harf duyarlı tam kelime değişimi
        const escWrong = wrongText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(escWrong, 'g');
        const newTarget = seg.target.replace(rx, fixText);

        if (prevTarget !== newTarget) {
            seg.target = newTarget;
            const ta = document.getElementById(`targetInput-${segId}`);
            if (ta) ta.value = newTarget;

            if (global.CatHistory && typeof global.CatHistory.record === 'function') {
                global.CatHistory.record(segId, prevTarget, newTarget);
            }
            if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast(`Segment #${segId} düzeltildi: "${fixText}"`);
        }

        // Popover'ı güncelle veya kapat
        setTimeout(() => {
            const remaining = checkSegmentQA(seg, doc);
            if (remaining.length === 0) {
                closeSegmentQAPopover();
                toast(`Tebrikler! Segment #${segId} tüm hatalardan arındırıldı.`);
            } else {
                openSegmentQAPopover(segId, null);
            }
        }, 120);
    }

    function closeModal() {
        const el = document.getElementById('modalQAReportBackdrop');
        if (el) el.remove();
    }

    function jumpToSegment(segId) {
        closeModal();
        if (typeof global.focusSegment === 'function') {
            global.focusSegment(segId);
        }
    }

    function resolveShieldForSeg(segId) {
        closeModal();
        if (global.FormatShield && typeof global.FormatShield.openResolveDialog === 'function') {
            global.FormatShield.openResolveDialog([segId]);
        }
    }

    global.CatQA = {
        checkSegmentQA,
        checkTurkishGrammarAndSpelling,
        openSegmentQAPopover,
        closeSegmentQAPopover,
        applyQAFix,
        runBatchQA,
        openBatchQAModal,
        closeModal,
        jumpToSegment,
        resolveShieldForSeg
    };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));


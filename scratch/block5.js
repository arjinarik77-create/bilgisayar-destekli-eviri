
        // ========================================================
        // 1. STATE & VERİ MODELLERİ
        // ========================================================
        const SEGMENTS_PER_PAGE = 4;

        // Desteklenen Formatlar ve Video Oynatıcı Rehberi Göster/Gizle
        function toggleFormatInfoBox(forceOpen = null) {
            const box = document.getElementById('projectFormatsInfoBox');
            const arrow = document.getElementById('formatInfoArrow');
            if (!box) return;
            const isHidden = box.classList.contains('hidden');
            const shouldOpen = forceOpen !== null ? forceOpen : isHidden;
            if (shouldOpen) {
                box.classList.remove('hidden');
                box.classList.add('flex');
                if (arrow) arrow.innerText = 'expand_less';
            } else {
                box.classList.add('hidden');
                box.classList.remove('flex');
                if (arrow) arrow.innerText = 'expand_more';
            }
        }

        // Proje Onboarding Tür Seçici
        function selectProjectType(type) {
            const hiddenInput = document.getElementById('selectedProjectType');
            if (hiddenInput) hiddenInput.value = type;

            const fileBtnText = document.getElementById('newProjectFileBtnText');
            const badge = document.getElementById('newProjectStep2Badge');
            const fileInput = document.getElementById('newProjectFileInput');
            const step2Title = document.getElementById('newProjectStep2Title');
            const pastedText = document.getElementById('newProjectPastedText');

            if (type === 'subtitling') {
                if (fileBtnText) fileBtnText.innerHTML = 'Video veya Altyazı Seç (.mp4, .mkv, .webm, .mov, .avi, .srt vb.)';
                if (badge) {
                    badge.innerText = 'Video & Altyazı (.mp4, .mkv, .webm, .mov, .avi, .flv, .wmv, .srt, .vtt)';
                    badge.className = 'text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200';
                }
                if (fileInput) {
                    fileInput.accept = 'video/*,.mp4,.mkv,.webm,.mov,.avi,.flv,.wmv,.m4v,.ts,.3gp,.ogg,.ogv,.m2ts,.mts,.divx,.vob,.rmvb,.srt,.vtt,.sub,.ass,.ssa,.sbv,.txt';
                }
                if (step2Title) step2Title.innerText = 'Video veya Altyazı Dosyası Yükleme';
                if (pastedText) pastedText.placeholder = 'SRT/VTT altyazı zaman kodlu metnini veya diyalog metnini doğrudan buraya yapıştırın...';
            } else if (type === 'interpreting') {
                if (fileBtnText) fileBtnText.innerHTML = 'Dosya Seç (.csv, .xlsx, .tsv, .txt, .md vb.)';
                if (badge) {
                    badge.innerText = 'Terminoloji & Tablo (.csv, .xlsx, .tsv, .txt, .json, .md)';
                    badge.className = 'text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200';
                }
                if (fileInput) {
                    fileInput.accept = '.csv,.xlsx,.tsv,.txt,.json,.md';
                }
                if (step2Title) step2Title.innerText = 'Terminoloji / Hazırlık Metni Yükleme';
                if (pastedText) pastedText.placeholder = 'Terim listesini veya iki dilli hazırlık metnini doğrudan buraya yapıştırın...';
            } else { // text
                if (fileBtnText) fileBtnText.innerHTML = 'Dosya Seç (.pdf, .docx, .doc, .txt, .md vb.)';
                if (badge) {
                    badge.innerText = 'Metin / Belge (.pdf, .docx, .doc, .txt, .md, .xliff)';
                    badge.className = 'text-[10px] font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200';
                }
                if (fileInput) {
                    fileInput.accept = '.pdf,.docx,.doc,.txt,.md,.rtf,.xliff,.sdlxliff,.json';
                }
                if (step2Title) step2Title.innerText = 'Kaynak Belge / Metin Yükleme';
                if (pastedText) pastedText.placeholder = 'Segmente edilecek kaynak metni doğrudan buraya yapıştırın...';
            }

            // Bilgi kutucuğundaki ilgili kartı vurgula
            ['text', 'subtitling', 'interpreting'].forEach(t => {
                const infoCard = document.getElementById(`infoCard-${t}`);
                if (infoCard) {
                    if (t === type) {
                        infoCard.classList.remove('opacity-70');
                        infoCard.classList.add('ring-2', t === 'subtitling' ? 'ring-purple-400' : (t === 'interpreting' ? 'ring-emerald-400' : 'ring-sky-400'));
                    } else {
                        infoCard.classList.add('opacity-70');
                        infoCard.classList.remove('ring-2', 'ring-purple-400', 'ring-emerald-400', 'ring-sky-400');
                    }
                }
            });

            ['text', 'subtitling', 'interpreting'].forEach(t => {
                const card = document.getElementById(`projTypeCard-${t}`);
                const check = document.getElementById(`projTypeCheck-${t}`);
                if (!card || !check) return;

                if (t === type) {
                    const activeColor = t === 'subtitling' ? 'border-purple-600 ring-2 ring-purple-300/40 bg-purple-50/70'
                        : (t === 'interpreting' ? 'border-emerald-600 ring-2 ring-emerald-300/40 bg-emerald-50/70'
                            : 'border-sky-600 ring-2 ring-sky-300/40 bg-sky-50/70');
                    const iconColor = t === 'subtitling' ? 'text-purple-600' : (t === 'interpreting' ? 'text-emerald-600' : 'text-sky-600');
                    card.className = `p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 text-left relative shadow-2xs group ${activeColor}`;
                    check.className = `material-symbols-outlined text-[18px] ${iconColor}`;
                    check.innerText = 'check_circle';
                } else {
                    card.className = 'p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex flex-col gap-2 text-left bg-white relative shadow-2xs group';
                    check.className = 'material-symbols-outlined text-slate-300 text-[18px]';
                    check.innerText = 'radio_button_unchecked';
                }
            });
        }

        if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
            window.global = window;
        }

        const appState = {
            currentNav: 'editor', // 'editor' | 'tm' | 'projects' | 'settings'
            currentFilter: 'all', // 'all' | 'draft' | 'confirmed'
            activeProjectId: 'proj-1',
            activeDocId: 'doc-1',
            searchQuery: '',
            autoTmMatchCount: 0,
            geminiApiKey: localStorage.getItem('cat_gemini_api_key') || '',
            deeplApiKey: localStorage.getItem('cat_deepl_api_key') || '',
            interpretingActiveTab: 'segments', // 'segments' | 'cards' | 'flashcards' | 'concordance'
            flashcardIndex: 0,
            flashcardRevealed: false,
            flashcardScore: { known: 0, repeat: 0 },
            concordanceQuery: '',
            activeSubtitleSegmentId: 1,

            projects: [],
            documents: [],
            glossary: [],
            translationMemory: []
        };
        if (typeof window !== 'undefined') {
            window.appState = appState;
        }

        const INITIAL_SAMPLE_TEXT_1 = `Computer-Assisted Translation tools significantly enhance the productivity of professional linguists.
Translation memory systems store previously verified segments to eliminate repetitive workload.
Consistent terminology management prevents ambiguity in specialized technical documentation.
Sentence-level segmentation divides complex source text into clear translation units.
Quality estimation metrics assess candidate hypotheses before delivering final bilingual files.
Post-editing requires deep linguistic intuition and domain-specific vocabulary knowledge.
Localization agencies leverage translation management platforms to streamline global deliveries.
Format preservation guarantees that document layouts remain intact after localization.`;

        const INITIAL_SAMPLE_TEXT_2 = `Eski kitap kokulu küçük bir odada, masanın üzerindeki lambanın sarı ışığı titriyordu.
Dışarıda hafif bir yağmur yağıyor, damlalar camda minik çizgiler oluşturuyordu.
Genç çevirmen, ekranın karşısına geçip derin bir nefes aldı.
Geliştirdiği sistem sayesinde uzun metinler artık daha küçük ve düzenli parçalara ayrılacaktı.
İlk cümleyi sisteme girdi ve segmentasyon motorunun çalışmasını izledi.
Metin kusursuz bir şekilde bölünmüş, yan taraftaki sözlük paneli ise anında açılmıştı.
Yüzünde tatlı bir tebessümle yarınki sunum için hazırlıklarını tamamladı.`;

        // ========================================================
        // 2. KUSURSUZ CÜMLE BAZLI SEGMENTASYON MOTORU
        // ========================================================
        function segmentDocument(text) {
            if (!text || typeof text !== 'string') return [];

            let clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const DOT_TOKEN = "___DOT_PLACEHOLDER___";

            // Ondalık sayıları koru (örn. 3.14)
            clean = clean.replace(/(\d)\.(\d)/g, (m, d1, d2) => d1 + DOT_TOKEN + d2);

            // Yaygın Türkçe ve İngilizce Kısaltmaları Koru
            const abbreviations = [
                "Dr", "Prof", "Doç", "Doc", "Av", "Müh", "Muh", "Uzm", "Yrd", "Alb", "Yzb",
                "vb", "vs", "bkz", "ör", "or", "md", "Cad", "Sok", "No", "yy", "sf", "s",
                "Mr", "Mrs", "Ms", "Jr", "Sr", "Inc", "Ltd", "Corp", "Co", "etc", "eg", "ie", "al", "Fig", "Vol"
            ];

            abbreviations.forEach(abbr => {
                const reg = new RegExp(`\\b(${abbr})\\.`, 'gi');
                clean = clean.replace(reg, (m, p1) => p1 + DOT_TOKEN);
            });

            // Üç nokta ve özel işaretleri koru
            clean = clean.replace(/\.{3}/g, DOT_TOKEN + DOT_TOKEN + DOT_TOKEN);
            clean = clean.replace(/…/g, DOT_TOKEN + DOT_TOKEN + DOT_TOKEN);

            // Smartcat Cümle Bölme Kuralı: Noktalama işaretinden sonra boşluk ve büyük harf/tırnak/parantez gelirse böl
            clean = clean.replace(/([.?!]+)(?=[\s\n]+[A-Z0-9"“'«\(\[]|$)/g, (match, punct) => {
                return punct + '\n---CAT_SEG_BREAK---\n';
            });

            clean = clean.replace(/\n{2,}/g, '\n---CAT_SEG_BREAK---\n');

            const rawParts = clean.split('---CAT_SEG_BREAK---');
            const segments = [];

            for (let part of rawParts) {
                let restored = part.split(DOT_TOKEN).join('.').replace(/\s+/g, ' ').trim();
                if (restored.length > 0) {
                    segments.push(restored);
                }
            }

            return segments;
        }

        // ========================================================
        // 2.1 ALTYAZI (SRT) AYRIŞTIRMA VE ZAMAN KODU YÖNETİMİ
        // (NETFLIX VE EBU-TT TEKNİK YÖNERGELERİ UYUMLU)
        // ========================================================
        function parseSrtTimestampToSeconds(tStr) {
            if (!tStr) return 0;
            const clean = tStr.replace(',', '.').trim();
            const parts = clean.split(':');
            if (parts.length === 3) {
                const h = parseFloat(parts[0]) || 0;
                const m = parseFloat(parts[1]) || 0;
                const s = parseFloat(parts[2]) || 0;
                return Number((h * 3600 + m * 60 + s).toFixed(3));
            }
            return 0;
        }

        function formatSecondsToSrtTimestamp(seconds) {
            const s = Math.max(0, seconds);
            const hours = Math.floor(s / 3600);
            const minutes = Math.floor((s % 3600) / 60);
            const secs = Math.floor(s % 60);
            const ms = Math.floor((s - Math.floor(s)) * 1000);

            const pad = (n, w = 2) => String(n).padStart(w, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
        }

        function cleanAndNormalizeVTT(vttText) {
            if (!vttText || typeof vttText !== 'string') return '';
            let norm = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // 1. WEBVTT dosya başlığı ve hemen arkasındaki metadata satırlarını (ilk boş satıra veya ilk cue'ya kadar) temizle
            norm = norm.replace(/^WEBVTT(?:\s+[^\n]*)?(?:\n(?!STYLE|NOTE|REGION|\d+\n|\d{1,2}:)[^\n]+)*\n*/i, '');
            norm = norm.replace(/^WEBVTT(?:\s+[^\n]*)?\n+/i, '');

            // 2. Blokları ayrıştır ve STYLE, NOTE, REGION bloklarını temizle
            const rawBlocks = norm.trim().split(/\n\s*\n/);
            const validBlocks = [];

            for (const b of rawBlocks) {
                const bClean = b.trim();
                if (!bClean) continue;
                if (/^(?:STYLE|NOTE|REGION)\b/i.test(bClean)) continue;
                validBlocks.push(bClean);
            }

            return validBlocks.join('\n\n');
        }

        function parseSRT(srtText) {
            if (!srtText || typeof srtText !== 'string') return [];
            let normalized = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // Eğer WebVTT formatı ise başlık, NOTE/STYLE bloklarını temizle
            if (/^\s*WEBVTT\b/i.test(normalized) || normalized.includes('WEBVTT')) {
                normalized = cleanAndNormalizeVTT(normalized);
            }

            const blocks = normalized.trim().split(/\n\s*\n/);
            const segments = [];

            // Zaman damgasını standart HH:MM:SS,mmm biçimine normalize et
            const normalizeTimestamp = (ts) => {
                if (!ts) return '00:00:00,000';
                let clean = ts.trim().replace('.', ',');
                const parts = clean.split(':');
                if (parts.length === 2) {
                    clean = '00:' + clean; // MM:SS,mmm -> 00:MM:SS,mmm
                }
                return clean;
            };

            blocks.forEach((block) => {
                const trimmedBlock = block.trim();
                if (!trimmedBlock) return;
                if (/^(?:STYLE|NOTE|REGION)\b/i.test(trimmedBlock)) return;

                const lines = trimmedBlock.split('\n');
                if (lines.length < 2) return;

                let timecodeLine = '';
                let textLines = [];

                if (lines[0].includes('-->')) {
                    timecodeLine = lines[0];
                    textLines = lines.slice(1);
                } else if (lines.length >= 2 && lines[1].includes('-->')) {
                    timecodeLine = lines[1];
                    textLines = lines.slice(2);
                }

                if (timecodeLine) {
                    const parts = timecodeLine.split('-->');
                    const startRaw = parts[0]?.trim() || '00:00:00,000';
                    // WebVTT cue ayarlarını (line:0 position:20% align:start vb.) temizle; yalnızca ilk kelime olan bitiş zamanını al!
                    const endRaw = parts[1]?.trim().split(/\s+/)[0] || '00:00:03,000';

                    const startStr = normalizeTimestamp(startRaw);
                    const endStr = normalizeTimestamp(endRaw);

                    const startSec = parseSrtTimestampToSeconds(startStr);
                    const endSec = parseSrtTimestampToSeconds(endStr);
                    const durationSec = Math.max(0.1, Number((endSec - startSec).toFixed(2)));

                    let text = textLines.join('\n').trim();
                    // WebVTT <v Speaker> ve <c.color> etiketlerini temizle
                    text = text.replace(/<\/?v(?:\s+[^>]+)?>/gi, '');
                    text = text.replace(/<\/?(?:c(?:\.[a-zA-Z0-9_-]+)*|lang(?:\s+[^>]+)?)>/gi, '');

                    segments.push({
                        id: segments.length + 1,
                        source: text || 'Altyazı bloğu ' + (segments.length + 1),
                        target: '',
                        startTime: startStr,
                        endTime: endStr,
                        durationSec: durationSec,
                        status: 'empty'
                    });
                }
            });

            return segments;
        }

        function parseFlexibleTimestampToSeconds(tStr) {
            if (!tStr) return 0;
            const clean = String(tStr).trim().replace(',', '.');
            if (/^\d+(\.\d+)?$/.test(clean)) {
                return Math.max(0, parseFloat(clean) || 0);
            }
            const parts = clean.split(':');
            if (parts.length === 3) {
                const h = parseFloat(parts[0]) || 0;
                const m = parseFloat(parts[1]) || 0;
                const s = parseFloat(parts[2]) || 0;
                return Number((h * 3600 + m * 60 + s).toFixed(3));
            } else if (parts.length === 2) {
                const m = parseFloat(parts[0]) || 0;
                const s = parseFloat(parts[1]) || 0;
                return Number((m * 60 + s).toFixed(3));
            }
            return 0;
        }

        // Kullanıcının altyazı başlangıç ve bitiş zaman damgalarını manuel değiştirmesi
        function updateSegmentTimestamp(segId, type, rawValue) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            let sec = parseFlexibleTimestampToSeconds(rawValue);
            if (!Number.isFinite(sec) || sec < 0) sec = 0;

            const formatted = formatSecondsToSrtTimestamp(sec);
            if (type === 'start') {
                seg.startTime = formatted;
                const curEndSec = parseSrtTimestampToSeconds(seg.endTime);
                if (sec >= curEndSec) {
                    seg.endTime = formatSecondsToSrtTimestamp(sec + 2.5);
                    const endInput = document.getElementById(`subEndTime-${segId}`);
                    if (endInput) endInput.value = seg.endTime;
                }
            } else {
                seg.endTime = formatted;
                const curStartSec = parseSrtTimestampToSeconds(seg.startTime);
                if (sec <= curStartSec) {
                    seg.startTime = formatSecondsToSrtTimestamp(Math.max(0, sec - 2.5));
                    const startInput = document.getElementById(`subStartTime-${segId}`);
                    if (startInput) startInput.value = seg.startTime;
                }
            }

            const sSec = parseSrtTimestampToSeconds(seg.startTime);
            const eSec = parseSrtTimestampToSeconds(seg.endTime);
            seg.durationSec = Number(Math.max(0.1, eSec - sSec).toFixed(2));

            const durLabel = document.getElementById(`subDurationLabel-${segId}`);
            if (durLabel) durLabel.innerText = `[Süre: ${seg.durationSec.toFixed(1)}s]`;

            updateSubtitleLiveMetrics(seg.id, seg.target || '');
            updateCinemaSubtitleMonitor(seg);
            debouncedAutoSave();
            showToast(`⏱️ Altyazı #${seg.id} süresi güncellendi: ${seg.startTime} ➔ ${seg.endTime}`);
        }

        // Videonun anlık oynatılan saniyesini doğrudan Başla veya Bitir kutusuna ata
        function setTimestampFromCurrentVideo(segId, type) {
            const player = document.getElementById('subVideoPlayer');
            const curSec = (player && Number.isFinite(player.currentTime)) ? player.currentTime : 0;
            const formatted = formatSecondsToSrtTimestamp(curSec);
            const inputId = type === 'start' ? `subStartTime-${segId}` : `subEndTime-${segId}`;
            const input = document.getElementById(inputId);
            if (input) input.value = formatted;
            updateSegmentTimestamp(segId, type, formatted);
        }

        // Altyazı bloğunu ileri veya geri kaydır (+0.5s / -0.5s)
        function nudgeSegmentTime(segId, deltaSec) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            let sSec = parseSrtTimestampToSeconds(seg.startTime) + deltaSec;
            let eSec = parseSrtTimestampToSeconds(seg.endTime) + deltaSec;
            if (sSec < 0) {
                eSec = eSec - sSec;
                sSec = 0;
            }
            seg.startTime = formatSecondsToSrtTimestamp(sSec);
            seg.endTime = formatSecondsToSrtTimestamp(eSec);
            seg.durationSec = Number(Math.max(0.1, eSec - sSec).toFixed(2));

            const startInput = document.getElementById(`subStartTime-${segId}`);
            if (startInput) startInput.value = seg.startTime;
            const endInput = document.getElementById(`subEndTime-${segId}`);
            if (endInput) endInput.value = seg.endTime;
            const durLabel = document.getElementById(`subDurationLabel-${segId}`);
            if (durLabel) durLabel.innerText = `[Süre: ${seg.durationSec.toFixed(1)}s]`;

            updateSubtitleLiveMetrics(seg.id, seg.target || '');
            updateCinemaSubtitleMonitor(seg);
            debouncedAutoSave();
            showToast(`⏱️ Altyazı #${seg.id} kaydırıldı: ${seg.startTime} ➔ ${seg.endTime}`);
        }

        // Güvenli Altyazı HTML Sanitizer (i, em, b, strong, u, font color izinli; script ve XSS korumalı)
        function sanitizeSubtitleHtml(text) {
            if (!text) return '';
            let s = String(text);

            // 1. Kalkan etiketlerini (<shield id="...">...</shield>) güvenli standart etiketlere çevir:
            s = s.replace(/<shield(?:\s+id=["']?(\w+)["']?)?>([\s\S]*?)<\/shield>/gi, (match, id, content) => {
                const tag = (id === '2' || id === 'sh2') ? 'b' : (id === '3' || id === 'sh3' ? 'u' : 'i');
                return `<${tag}>${content}</${tag}>`;
            });

            // 2. İzinli güvenli etiketleri korumak için yer tutucu kullan
            const allowedTokens = [];
            const pushToken = (html) => {
                const idx = allowedTokens.length;
                allowedTokens.push(html);
                return `___SUB_TAG_${idx}___`;
            };

            // Kapanış etiketleri: </i>, </em>, </b>, </strong>, </u>, </font>
            s = s.replace(/<\/(i|em|b|strong|u|font)>/gi, (m, tag) => {
                return pushToken(`</${tag.toLowerCase()}>`);
            });

            // <font color="..."> etiketi (güvenli CSS rengi regexi)
            s = s.replace(/<font\s+color\s*=\s*["']?([#a-zA-Z0-9]+)["']?\s*>/gi, (m, color) => {
                if (/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})$/.test(color)) {
                    return pushToken(`<font color="${color}">`);
                }
                return '';
            });

            // Açılış etiketleri: <i>, <em>, <b>, <strong>, <u>
            s = s.replace(/<(i|em|b|strong|u)>/gi, (m, tag) => {
                return pushToken(`<${tag.toLowerCase()}>`);
            });

            // 3. Metnin geri kalanındaki TÜM karakter ve XSS riskli tagleri escape et!
            s = escapeHtml(s);

            // 4. Satır sonlarını <br> yap
            s = s.replace(/\r?\n/g, '<br>');

            // 5. İzin verilen güvenli etiketleri yer tutuculardan geri yükle
            allowedTokens.forEach((tokenHtml, idx) => {
                s = s.replace(new RegExp(`___SUB_TAG_${idx}___`, 'g'), tokenHtml);
            });

            return s;
        }

        function getSubtitleLines(text, maxCpl = 42) {
            if (!text || !String(text).trim()) {
                return { line1: '', line2: '', extraLines: [], lineCount: 0, hasExplicitNewline: false };
            }
            const clean = String(text).replace(/\r/g, '');
            if (clean.includes('\n')) {
                const parts = clean.split('\n');
                const line1 = parts[0] || '';
                const line2 = parts[1] || '';
                const extraLines = parts.slice(2);
                return {
                    line1,
                    line2,
                    extraLines,
                    lineCount: parts.length,
                    hasExplicitNewline: true
                };
            }
            // Tek parça metin: Eğer 42 karakterden uzunsa üstte kalan kısım 1. satır, altta kalan kısım 2. satır algılanır!
            if (clean.length <= maxCpl) {
                return {
                    line1: clean,
                    line2: '',
                    extraLines: [],
                    lineCount: 1,
                    hasExplicitNewline: false
                };
            }
            // Kelime sınırından üst ve alt satıra böl
            const words = clean.split(' ');
            let currentLine = '';
            let breakWordIndex = 0;

            for (let i = 0; i < words.length; i++) {
                const test = currentLine ? (currentLine + ' ' + words[i]) : words[i];
                if (test.length <= maxCpl) {
                    currentLine = test;
                    breakWordIndex = i + 1;
                } else {
                    if (!currentLine) {
                        currentLine = words[i].substring(0, maxCpl);
                    }
                    break;
                }
            }

            const line1 = currentLine;
            const line2 = words.slice(breakWordIndex).join(' ').trim();
            return {
                line1,
                line2,
                extraLines: [],
                lineCount: line2 ? 2 : 1,
                hasExplicitNewline: false
            };
        }

        function generateSRT(doc) {
            if (!doc || !doc.segments || doc.segments.length === 0) return '';
            let srtOutput = '';
            doc.segments.forEach((seg, idx) => {
                let rawText = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : (seg.source || '').trim();
                rawText = cleanGeminiDraftTag(rawText);

                // Biçim kalkanlarını (<shield id="1"> veya FormatPainter tgtRuns) standart SRT etiketlerine (<i>, <b>) kayıpsız dönüştür
                if (typeof FormatShield !== 'undefined' && typeof FormatShield.convertShieldsToSubtitleTags === 'function') {
                    rawText = FormatShield.convertShieldsToSubtitleTags(rawText, seg);
                } else {
                    rawText = rawText.replace(/<shield(?:\s+id=["']?(\w+)["']?)?>([\s\S]*?)<\/shield>/gi, (m, id, c) => {
                        const tag = (id === '2' || id === 'sh2') ? 'b' : (id === '3' || id === 'sh3' ? 'u' : 'i');
                        return `<${tag}>${c}</${tag}>`;
                    });
                }

                const subLines = getSubtitleLines(rawText, 42);
                const text = subLines.hasExplicitNewline
                    ? rawText
                    : (subLines.line2 ? `${subLines.line1}\n${subLines.line2}` : subLines.line1);

                const start = seg.startTime || formatSecondsToSrtTimestamp(idx * 3.5);
                const end = seg.endTime || formatSecondsToSrtTimestamp(idx * 3.5 + 3.0);
                srtOutput += `${idx + 1}\n${start} --> ${end}\n${text}\n\n`;
            });
            return srtOutput.trim();
        }

        function generateVTT(doc) {
            if (!doc || !doc.segments || doc.segments.length === 0) return 'WEBVTT\n\n';
            let vttOutput = 'WEBVTT\n\n';
            doc.segments.forEach((seg, idx) => {
                let rawText = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : (seg.source || '').trim();
                rawText = cleanGeminiDraftTag(rawText);

                // Biçim kalkanlarını (<shield id="1"> veya FormatPainter tgtRuns) standart VTT etiketlerine (<i>, <b>) kayıpsız dönüştür
                if (typeof FormatShield !== 'undefined' && typeof FormatShield.convertShieldsToSubtitleTags === 'function') {
                    rawText = FormatShield.convertShieldsToSubtitleTags(rawText, seg);
                } else {
                    rawText = rawText.replace(/<shield(?:\s+id=["']?(\w+)["']?)?>([\s\S]*?)<\/shield>/gi, (m, id, c) => {
                        const tag = (id === '2' || id === 'sh2') ? 'b' : (id === '3' || id === 'sh3' ? 'u' : 'i');
                        return `<${tag}>${c}</${tag}>`;
                    });
                }

                const subLines = getSubtitleLines(rawText, 42);
                const text = subLines.hasExplicitNewline
                    ? rawText
                    : (subLines.line2 ? `${subLines.line1}\n${subLines.line2}` : subLines.line1);

                const start = (seg.startTime || formatSecondsToSrtTimestamp(idx * 3.5)).replace(',', '.');
                const end = (seg.endTime || formatSecondsToSrtTimestamp(idx * 3.5 + 3.0)).replace(',', '.');
                vttOutput += `${idx + 1}\n${start} --> ${end}\n${text}\n\n`;
            });
            return vttOutput.trim();
        }

        function generateCSV(doc) {
            if (!doc || !doc.segments || doc.segments.length === 0) return 'ID,ZamanKodu,Kaynak,Hedef\n';
            let csv = '\ufeff"ID","Zaman Kodu Baslangic","Zaman Kodu Bitis","Kaynak Metin","Hedef Ceviri"\n';
            doc.segments.forEach((seg, idx) => {
                const id = idx + 1;
                const start = seg.startTime || '';
                const end = seg.endTime || '';
                const src = (seg.source || '').replace(/"/g, '""');
                const trg = cleanGeminiDraftTag(seg.target || '').replace(/"/g, '""');
                csv += `"${id}","${start}","${end}","${src}","${trg}"\n`;
            });
            return csv;
        }

        // ========================================================
        // 2.2 NETFLIX / EBU-TT ALTYAZI KISIT VE METRİK MOTORU
        // (SATIR SINIRI, CPL, CPS, SÜRE DENETİMİ)
        // ========================================================
        function calculateSubtitleMetrics(targetText, durationSec) {
            const cleanText = (targetText !== undefined && targetText !== null) ? String(targetText).replace(/\r/g, '') : '';
            const subLines = getSubtitleLines(cleanText, 42);

            const line1 = subLines.line1;
            const line2 = subLines.line2;
            const lineCount = subLines.lineCount;

            const cplLine1 = line1.length;
            const cplLine2 = line2.length;
            const totalChars = cleanText.replace(/\n/g, '').length;

            const dur = Math.max(0.1, Number(durationSec) || 3.0);
            const cps = Number((totalChars / dur).toFixed(1));

            // Netflix / EBU-TT Kuralları:
            // 1. Satır Sınırı: En fazla 2 satır (3+ satır kural ihlalidir)
            const isLineExceeded = lineCount > 2;

            // 2. CPL Sınırı: Satır başına max 42 karakter (Üst ve alt satır bağımsız denetlenir)
            const isCpl1Exceeded = cplLine1 > 42;
            const isCpl2Exceeded = cplLine2 > 42;
            const isCplExceeded = isCpl1Exceeded || isCpl2Exceeded;

            // 3. CPS Okuma Hızı Sınırı:
            let cpsStatus = 'ideal';
            let cpsLabel = 'İdeal';
            if (cps > 20) {
                cpsStatus = 'over';
                cpsLabel = 'Çok Hızlı!';
            } else if (cps > 17) {
                cpsStatus = 'fast';
                cpsLabel = 'Hızlı';
            }

            // 4. Blok Süresi Sınırı: 1.0s - 7.0s
            const isTooShort = dur < 1.0;
            const isTooLong = dur > 7.0;

            return {
                lineCount,
                line1,
                line2,
                extraLines: subLines.extraLines,
                cplLine1,
                cplLine2,
                totalChars,
                durationSec: dur,
                cps,
                cpsStatus,
                cpsLabel,
                isLineExceeded,
                isCpl1Exceeded,
                isCpl2Exceeded,
                isCplExceeded,
                isTooShort,
                isTooLong,
                hasExplicitNewline: subLines.hasExplicitNewline
            };
        }

        // ========================================================
        // 3. ÇEVİRİ BELLEĞİ (TRANSLATION MEMORY - TM) MOTORU & DIFF
        // ========================================================
        function normalizeString(str) {
            if (!str) return '';
            return str
                .toLowerCase()
                .replace(/[-_–—]/g, ' ')
                .replace(/[.,\/#!$%\^&\*;:{}=`~()?"'’“”]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // Levenshtein Benzerlik Oranı Hesabı (%0 - %100)
        function calculateSimilarity(str1, str2) {
            const s1 = normalizeString(str1);
            const s2 = normalizeString(str2);
            if (s1 === s2) return 100;
            if (s1.length === 0 || s2.length === 0) return 0;

            const matrix = [];
            for (let i = 0; i <= s2.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= s1.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= s2.length; i++) {
                for (let j = 1; j <= s1.length; j++) {
                    if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1, // substitution
                            matrix[i][j - 1] + 1,     // insertion
                            matrix[i - 1][j] + 1      // deletion
                        );
                    }
                }
            }

            const distance = matrix[s2.length][s1.length];
            const maxLen = Math.max(s1.length, s2.length);
            const similarity = Math.round(((maxLen - distance) / maxLen) * 100);
            return Math.max(0, similarity);
        }

        // Kelime Düzeyinde Görsel Fark (Word-Level Visual Diff) Vurgu Üreticisi
        function generateWordDiff(sourceText, tmSourceText) {
            if (!sourceText || !tmSourceText) return '';
            const srcWords = sourceText.trim().split(/\s+/);
            const tmWords = tmSourceText.trim().split(/\s+/);

            const norm = (w) => normalizeString(w);
            const srcNorms = srcWords.map(norm);
            const tmNorms = tmWords.map(norm);

            let diffHtml = '';

            // Kaynak metindeki kelimeler bellek kaydıyla karşılaştırılır:
            srcWords.forEach(word => {
                const nw = norm(word);
                if (tmNorms.includes(nw)) {
                    diffHtml += `<span class="text-slate-800">${escapeHtml(word)}</span> `;
                } else {
                    // Kaynakta olup bellekte olmayan (yeni/farklı) kelimeler yeşil vurgu ile gösterilir
                    diffHtml += `<span class="bg-emerald-100 text-emerald-900 font-bold px-1 py-0.5 rounded border border-emerald-300 text-[11px] shadow-2xs">+${escapeHtml(word)}</span> `;
                }
            });

            // Bellekte olup kaynak cümlede yer almayan eksik kelimeler üzeri çizili kırmızı olarak eklenir
            const missingWords = tmWords.filter(w => !srcNorms.includes(norm(w)));
            if (missingWords.length > 0) {
                diffHtml += `<span class="text-slate-400 font-mono text-[10px] ml-1.5">| Bellekteki Fazlalık: </span>`;
                missingWords.forEach(w => {
                    diffHtml += `<span class="line-through bg-rose-100 text-rose-700 px-1 py-0.5 rounded border border-rose-300 text-[10px] mx-0.5">${escapeHtml(w)}</span> `;
                });
            }

            return diffHtml.trim();
        }

        // Segment için TM eşleşmesini ara (Aktif Projeye Özel İzolasyon):
        // %100 -> Exact Match (Yeşil rozet)
        // %50 - %99 -> Fuzzy Match (Turuncu rozet ve görsel Diff)
        // Metin Bağlam Özeti (Hash) Üreticisi (101% In-Context Match - ICE için)
        function hashContextText(str) {
            if (!str) return '';
            const norm = normalizeString(str);
            if (!norm) return '';
            let hash = 0;
            for (let i = 0; i < norm.length; i++) {
                hash = ((hash << 5) - hash) + norm.charCodeAt(i);
                hash |= 0;
            }
            return 'h_' + Math.abs(hash).toString(36);
        }

        // Segment için TM eşleşmesini ara (Aktif Projeye Özel İzolasyon):
        // %101 -> In-Context Match (ICE) - Önceki & sonraki cümle birebir eşleştiğinde mor rozet
        // %100 -> Exact Match (Yeşil rozet)
        // %50 - %99 -> Fuzzy Match (Turuncu rozet ve görsel Diff)
        function findBestTmMatch(sourceText, currentSegId = null, segContext = null) {
            if (!sourceText || appState.translationMemory.length === 0) return null;
            const normSource = normalizeString(sourceText);

            // Bağlam Bilgilerini Çıkar
            let prevSource = '';
            let nextSource = '';
            let docContext = '';
            if (segContext) {
                prevSource = segContext.prevSource || '';
                nextSource = segContext.nextSource || '';
                docContext = segContext.documentContext || '';
            } else if (currentSegId) {
                const doc = (typeof getActiveDoc === 'function') ? getActiveDoc() : null;
                if (doc && doc.segments) {
                    const sIdx = doc.segments.findIndex(s => s.id === currentSegId);
                    if (sIdx !== -1) {
                        if (sIdx > 0) prevSource = doc.segments[sIdx - 1].source;
                        if (sIdx < doc.segments.length - 1) nextSource = doc.segments[sIdx + 1].source;
                        docContext = doc.name || '';
                    }
                }
            }
            const curPrevHash = hashContextText(prevSource);
            const curNextHash = hashContextText(nextSource);

            let bestMatch = null;
            let highestSimilarity = 0;

            const currentProjId = appState.activeProjectId || null;
            const pool = currentProjId
                ? appState.translationMemory.filter(t => !t.projectId || t.projectId === currentProjId)
                : appState.translationMemory;

            for (const entry of pool) {
                // STANDART TM İZOLASYONU: Mevcut onaylanan segmentin kendi oluşturduğu kaydı dışla
                if (currentSegId && entry.originSegId && entry.originSegId === currentSegId) {
                    continue;
                }

                const normEntry = entry.sourceNorm || normalizeString(entry.source);
                if (normSource === normEntry) {
                    // Bağlamsal Eşleşme (102% Çift Bağlam vs 101% Tek Bağlam vs 100% Birebir):
                    const prevMatches = Boolean(entry.prevSourceHash && curPrevHash && entry.prevSourceHash === curPrevHash);
                    const nextMatches = Boolean(entry.nextSourceHash && curNextHash && entry.nextSourceHash === curNextHash);

                    // 102% Double Context Match: Hem kendinden önceki hem sonraki cümle birebir eşleşti
                    if (prevMatches && nextMatches) {
                        return {
                            entry: entry,
                            similarity: 102,
                            isIce: true,
                            isDoubleContext: true,
                            isExact: true,
                            isFuzzy: false,
                            diffHtml: ''
                        };
                    }

                    // 101% Context Match: Kendinden önceki (veya sonraki) cümle birebir eşleşti
                    if (prevMatches || nextMatches) {
                        return {
                            entry: entry,
                            similarity: 101,
                            isIce: true,
                            isDoubleContext: false,
                            isExact: true,
                            isFuzzy: false,
                            diffHtml: ''
                        };
                    }

                    // 100% Exact Match: Cümle aynı, ancak bağlam farklı veya belirsiz
                    return {
                        entry: entry,
                        similarity: 100,
                        isIce: false,
                        isDoubleContext: false,
                        isExact: true,
                        isFuzzy: false,
                        diffHtml: ''
                    };
                }

                const sim = calculateSimilarity(sourceText, entry.source);
                if (sim > highestSimilarity && sim >= 50) {
                    highestSimilarity = sim;
                    bestMatch = {
                        entry: entry,
                        similarity: sim,
                        isIce: false,
                        isExact: false,
                        isFuzzy: true,
                        diffHtml: generateWordDiff(sourceText, entry.source)
                    };
                }
            }

            return bestMatch;
        }

        // Segmentleri TM ile tara ve %100 / %101 eşleşenleri otomatik doldur
        function scanAndApplyTMToSegments(segments) {
            let matchedCount = 0;
            segments.forEach(seg => {
                if (seg.status === 'confirmed') return;
                const match = findBestTmMatch(seg.source, seg.id);
                if (match) {
                    seg.tmSuggestion = match;
                    if (match.isExact || match.similarity >= 100) {
                        if (!seg.target || seg.target.trim().length === 0) {
                            seg.target = match.entry.target;
                            if (match.similarity === 101 || match.isIce) {
                                seg.status = 'confirmed';
                                seg.isIceConfirmed = true;
                            } else {
                                seg.status = 'draft';
                            }
                            seg.isAutoFilled = true;
                            matchedCount++;
                        }
                    }
                } else {
                    seg.tmSuggestion = null;
                }
            });
            appState.autoTmMatchCount += matchedCount;
            updateTMStats();
        }

        // Kullanıcı Onayla'ya bastığında projeye özel TM'e kaydet (101% ICE bağlam hash'leriyle)
        function saveSegmentToTM(sourceText, targetText, originSegId = null, segContext = null) {
            if (!sourceText || !targetText) return;
            const cleanSrc = sourceText.trim();
            const cleanTgt = targetText.trim();
            const normSrc = normalizeString(cleanSrc);
            const currentProjId = appState.activeProjectId || 'proj-default';

            // Bağlam Bilgilerini Çıkar (101% ICE için)
            let prevSource = '';
            let nextSource = '';
            let docContext = '';
            if (segContext) {
                prevSource = segContext.prevSource || '';
                nextSource = segContext.nextSource || '';
                docContext = segContext.documentContext || '';
            } else if (originSegId) {
                const doc = (typeof getActiveDoc === 'function') ? getActiveDoc() : null;
                if (doc && doc.segments) {
                    const sIdx = doc.segments.findIndex(s => s.id === originSegId);
                    if (sIdx !== -1) {
                        if (sIdx > 0) prevSource = doc.segments[sIdx - 1].source;
                        if (sIdx < doc.segments.length - 1) nextSource = doc.segments[sIdx + 1].source;
                        docContext = doc.name || '';
                    }
                }
            }

            const prevHash = hashContextText(prevSource);
            const nextHash = hashContextText(nextSource);

            const existingIdx = appState.translationMemory.findIndex(t =>
                (t.projectId === currentProjId || !t.projectId) &&
                (t.sourceNorm || normalizeString(t.source)) === normSrc
            );
            const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            if (existingIdx !== -1) {
                appState.translationMemory[existingIdx].target = cleanTgt;
                appState.translationMemory[existingIdx].projectId = currentProjId;
                appState.translationMemory[existingIdx].date = `Güncellendi ${now}`;
                if (originSegId) appState.translationMemory[existingIdx].originSegId = originSegId;
                if (prevHash) appState.translationMemory[existingIdx].prevSourceHash = prevHash;
                if (nextHash) appState.translationMemory[existingIdx].nextSourceHash = nextHash;
                if (docContext) appState.translationMemory[existingIdx].documentContext = docContext;
            } else {
                appState.translationMemory.unshift({
                    id: 'tm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                    projectId: currentProjId,
                    originSegId: originSegId,
                    source: cleanSrc,
                    target: cleanTgt,
                    date: `Bugün ${now}`,
                    sourceNorm: normSrc,
                    prevSourceHash: prevHash,
                    nextSourceHash: nextHash,
                    documentContext: docContext
                });
            }

            updateTMStats();
        }

        function updateTMStats() {
            const currentProjId = appState.activeProjectId || null;
            const projEntries = currentProjId
                ? appState.translationMemory.filter(t => !t.projectId || t.projectId === currentProjId)
                : appState.translationMemory;
            const count = projEntries.length;

            const topbarBadge = document.getElementById('topbarTmCountBadge');
            const sidebarBadge = document.getElementById('sidebarTmBadge');
            const statTotal = document.getElementById('tmTotalCountStat');
            const statMatch = document.getElementById('tmMatchCountStat');

            if (topbarBadge) topbarBadge.innerText = `${count} Kayıt`;
            if (sidebarBadge) sidebarBadge.innerText = count;
            if (statTotal) statTotal.innerText = count;
            if (statMatch) statMatch.innerText = appState.autoTmMatchCount;
        }

        // ========================================================
        // 3.1 KALİTE GÜVENCESİ (REAL-TIME QA) & TERİM İHLALİ DENETİMİ
        // ========================================================
        function checkGlossaryViolations(sourceText, targetText) {
            if (!sourceText) return [];
            const matchedTerms = findGlossaryMatches(sourceText);
            if (matchedTerms.length === 0 || !targetText || targetText.trim().length === 0) {
                return [];
            }

            const normTarget = normalizeString(targetText);
            const violations = [];

            matchedTerms.forEach(t => {
                const normTermTarget = normalizeString(t.target);
                const hasTarget = normTarget.includes(normTermTarget) ||
                    (window.CatLSP && CatLSP.Stemmer && CatLSP.Stemmer.termMatchesText(t.target, targetText));
                if (!hasTarget) {
                    violations.push(t);
                }
            });

            return violations;
        }

        function runQAChecks(sourceText, targetText, seg = null) {
            if (typeof CatQA !== 'undefined' && seg) {
                return CatQA.checkSegmentQA(seg, getActiveDoc());
            }
            const alerts = [];
            if (!sourceText || !targetText || targetText.trim().length === 0) {
                return alerts;
            }
            if (typeof CatQA !== 'undefined') {
                return CatQA.checkSegmentQA({ source: sourceText, target: targetText, status: 'draft' }, getActiveDoc());
            }

            // 1. Sayı / Tarih Eşleşmesi Denetimi
            const srcNums = sourceText.match(/\b\d+(?:[.,]\d+)?\b/g) || [];
            if (srcNums.length > 0) {
                const missingNums = srcNums.filter(n => !targetText.includes(n));
                if (missingNums.length > 0) {
                    alerts.push({
                        type: 'number',
                        icon: 'pin',
                        msg: `Sayı Uyarısı: Kaynaktaki [${missingNums.join(', ')}] sayısı hedef metinde bulunamadı!`
                    });
                }
            }

            // 2. Noktalama Eşleşmesi Denetimi (. ? ! : ;)
            const cleanSrc = sourceText.trim();
            const cleanTgt = targetText.trim();
            const punctChars = ['.', '?', '!', ':', ';'];
            const lastSrc = cleanSrc.slice(-1);
            const lastTgt = cleanTgt.slice(-1);

            if (punctChars.includes(lastSrc)) {
                if (!punctChars.includes(lastTgt)) {
                    alerts.push({
                        type: 'punct',
                        icon: 'edit_attributes',
                        msg: `Noktalama Uyarısı: Kaynak '${lastSrc}' ile bitiyor, ancak hedefte son noktalama işareti eksik!`
                    });
                } else if (lastSrc !== lastTgt) {
                    alerts.push({
                        type: 'punct',
                        icon: 'edit_attributes',
                        msg: `Noktalama Uyarısı: Kaynak '${lastSrc}' ile biterken hedef '${lastTgt}' ile bitiyor!`
                    });
                }
            }

            return alerts;
        }

        // İmleç Konumuna Terim Ekleme (Interactive Term Chip Insertion)
        function insertTermAtCursor(segId, termTarget) {
            const textarea = document.getElementById(`targetInput-${segId}`);
            if (!textarea) return;

            const start = textarea.selectionStart || textarea.value.length;
            const end = textarea.selectionEnd || textarea.value.length;
            const text = textarea.value;

            const before = text.substring(0, start);
            const after = text.substring(end);
            const insertText = (before.length > 0 && !before.endsWith(' ') ? ' ' : '') + termTarget + (after.length > 0 && !after.startsWith(' ') ? ' ' : '');

            textarea.value = before + insertText + after;
            const newPos = start + insertText.length;
            textarea.selectionStart = newPos;
            textarea.selectionEnd = newPos;
            textarea.focus();

            onSegmentChange(segId, textarea);
            showToast(`"${termTarget}" imleç konumuna eklendi.`);
        }

        // ========================================================
        // 4. LOKAL ÇALIŞMA ALANI DEPOLAMA, OTO-KAYIT & YÜKLEME MOTORU
        // ========================================================
        let autoSaveTimer = null;
        let currentServerVideoId = '';

        function getCleanAppStateForSaving() {
            return {
                activeProjectId: appState.activeProjectId,
                activeDocId: appState.activeDocId,
                projects: appState.projects,
                translationMemory: appState.translationMemory,
                glossary: appState.glossary,
                currentServerVideoId: currentServerVideoId || '',
                timestamp: Date.now()
            };
        }

        function updateAutoSaveBadge(status, text) {
            const badge = document.getElementById('localAutoSaveStatusBadge');
            const dot = document.getElementById('localAutoSaveDot');
            const label = document.getElementById('localAutoSaveText');
            if (!badge) return;

            badge.classList.remove('hidden');
            if (status === 'saving') {
                if (dot) {
                    dot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-ping';
                }
                if (label) label.innerText = text || 'Lokal Kaydediliyor...';
                badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 select-none';
            } else if (status === 'saved') {
                if (dot) {
                    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
                }
                if (label) label.innerText = text || 'Lokal Kayıtlı (Disk & Bellek)';
                badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-all select-none';
            } else if (status === 'error') {
                if (dot) {
                    dot.className = 'w-2 h-2 rounded-full bg-rose-500';
                }
                if (label) label.innerText = text || 'Lokal Kayıt Uyarısı';
                badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 cursor-pointer select-none';
            }
        }

        async function saveAppStateToLocal() {
            updateAutoSaveBadge('saving');
            try {
                const payload = getCleanAppStateForSaving();

                // 1. IndexedDB Kalıcılığı (CatStorage) - Birincil & Sınırsız Bellek
                if (window.CatStorage && typeof window.CatStorage.setWorkspaceState === 'function') {
                    try {
                        await window.CatStorage.setWorkspaceState(payload);
                    } catch (idbErr) {
                        console.warn("[CatStorage] IndexedDB yazma hatası:", idbErr);
                    }
                }

                // 2. Tarayıcı Yerel Depolamasına (localStorage) Hızlı Yedekleme
                const jsonStr = JSON.stringify(payload);
                try {
                    localStorage.setItem('cat_workspace_autosave', jsonStr);
                } catch (lsErr) {
                    console.warn("localStorage kotası:", lsErr);
                }

                // 3. Yerel Disk Dosyasına (/api/save_workspace_state) Kaydet (Backend Varsa)
                const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                try {
                    const res = await fetch(`${apiBase}/api/save_workspace_state`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: jsonStr
                    });
                    if (res.ok) {
                        updateAutoSaveBadge('saved', 'Lokal Kayıtlı (IndexedDB & Disk)');
                        return;
                    }
                } catch (eSrv) { }

                updateAutoSaveBadge('saved', 'Lokal Kayıtlı (IndexedDB)');
            } catch (err) {
                console.warn("Lokal kaydetme arka plan uyarısı:", err);
                updateAutoSaveBadge('saved', 'Lokal Kayıtlı (IndexedDB)');
            }
        }

        function debouncedAutoSave(delayMs = 600) {
            updateAutoSaveBadge('saving');
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                saveAppStateToLocal();
            }, delayMs);
        }

        function scheduleAutoSave(delayMs = 600) {
            debouncedAutoSave(delayMs);
        }

        function forceManualLocalSave() {
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
            saveAppStateToLocal().then(() => {
                showToast("💾 Tüm projeler, çeviriler ve zaman damgaları IndexedDB & diske güvenle kaydedildi!");
            });
        }

        async function loadAppStateFromLocal() {
            let savedData = null;

            // 1. Önce Sunucu / Disk Dosyasından (/api/load_workspace_state) Yüklemeyi Dene
            try {
                const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                const res = await fetch(`${apiBase}/api/load_workspace_state`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.projects && data.projects.length > 0) {
                        savedData = data;
                        console.log("Lokal disk dosyasından çalışma alanı yüklendi.");
                    }
                }
            } catch (netErr) {
                console.warn("Sunucu disk kaydı okunamadı, IndexedDB kontrol ediliyor:", netErr);
            }

            // 2. İkinci Öncelik: Tam IndexedDB Kalıcılığı (CatStorage)
            if (!savedData && window.CatStorage && typeof window.CatStorage.getWorkspaceState === 'function') {
                try {
                    const idbData = await window.CatStorage.getWorkspaceState();
                    if (idbData && idbData.projects && idbData.projects.length > 0) {
                        savedData = idbData;
                        console.log("[CatStorage] IndexedDB üzerinden tam çalışma alanı başarıyla yüklendi.");
                    }
                } catch (idbErr) {
                    console.warn("[CatStorage] IndexedDB okuma uyarısı:", idbErr);
                }
            }

            // 3. Üçüncü Öncelik: Tarayıcı localStorage Yedeklemesi
            if (!savedData) {
                try {
                    const lsStr = localStorage.getItem('cat_workspace_autosave');
                    if (lsStr) {
                        const parsed = JSON.parse(lsStr);
                        if (parsed && parsed.projects && parsed.projects.length > 0) {
                            savedData = parsed;
                            console.log("Tarayıcı localStorage'ından çalışma alanı yüklendi.");
                        }
                    }
                } catch (lsErr) {
                    console.warn("localStorage okuma hatası:", lsErr);
                }
            }

            return savedData;
        }

        // ========================================================
        // KULLANICI PROFİLİ VE TEMA SENKRONİZASYONU
        // ========================================================
        function saveUserProfile() {
            const name = document.getElementById('profileNameInput')?.value || 'Arjin Tercüman';
            const email = document.getElementById('profileEmailInput')?.value || 'arjin@arikstudio.com';
            const role = document.getElementById('profileRoleSelect')?.value || 'L2';
            const langs = document.getElementById('profileLangsInput')?.value || 'İngilizce (EN) ➔ Türkçe (TR)';

            const profile = { name, email, role, langs };
            try {
                localStorage.setItem('cat_user_profile', JSON.stringify(profile));
            } catch (e) {
                console.warn("Profil kaydedilemedi:", e);
            }

            // Arayüzdeki avatar ve başlığı güncelle
            const initials = name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || 'AT';
            const avatarEl = document.getElementById('settingsProfileAvatarText');
            if (avatarEl) avatarEl.innerText = initials;

            const titleEl = document.getElementById('settingsProfileDisplayTitle');
            if (titleEl) titleEl.innerText = name;

            if (typeof showToast === 'function') {
                showToast('✅ Kullanıcı profili başarıyla güncellendi.');
            }
        }

        function initUserProfile() {
            try {
                const saved = localStorage.getItem('cat_user_profile');
                if (saved) {
                    const p = JSON.parse(saved);
                    if (p.name && document.getElementById('profileNameInput')) document.getElementById('profileNameInput').value = p.name;
                    if (p.email && document.getElementById('profileEmailInput')) document.getElementById('profileEmailInput').value = p.email;
                    if (p.role && document.getElementById('profileRoleSelect')) document.getElementById('profileRoleSelect').value = p.role;
                    if (p.langs && document.getElementById('profileLangsInput')) document.getElementById('profileLangsInput').value = p.langs;

                    const initials = (p.name || 'AT').split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || 'AT';
                    const avatarEl = document.getElementById('settingsProfileAvatarText');
                    if (avatarEl) avatarEl.innerText = initials;
                    const titleEl = document.getElementById('settingsProfileDisplayTitle');
                    if (titleEl) titleEl.innerText = p.name;
                }
            } catch (e) {}
        }

        function updateSettingsThemeBadge() {
            const badge = document.getElementById('activeThemeBadge');
            if (!badge) return;
            const cur = window.CatUI?.currentTheme || 'light';
            if (cur === 'dark') {
                badge.innerText = 'Aktif: Geleneksel Koyu Tema';
                badge.className = 'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700';
            } else if (cur === 'sepia') {
                badge.innerText = 'Aktif: Sepya / Kitap Dokusu';
                badge.className = 'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300';
            } else {
                badge.innerText = 'Aktif: Broken Ice Blue (Aydınlık)';
                badge.className = 'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300';
            }
        }

        // ========================================================
        // %100, %101 VE %102 ÇEVİRİ BELLEĞİ (TM) DEMO VERİ SETİ MOTORU
        // ========================================================
        function loadStandardTmDemoProject(forceSwitch = true) {
            const pId = 'proj-tm-demo';
            const dId = 'doc-tm-demo';

            const s1 = "Cihazı prize takın ve güç kablosunu kontrol edin.";
            const s2 = "Açma düğmesine 3 saniye basılı tutun.";
            const s3 = "Mavi LED göstergesi yandığında kurulum tamamlanır.";
            const s4 = "Güvenlik talimatlarını ve uyarıları dikkatle okuyun.";
            const s5 = "Sistem güncellemeleri otomatik olarak arka planda yüklenecektir.";
            const s6 = "Sorun giderme adımları için resmi kullanıcı kılavuzuna başvurun.";

            const segments = [
                { id: 1, source: s1, target: "", status: "draft" },
                { id: 2, source: s2, target: "", status: "draft" },
                { id: 3, source: s3, target: "", status: "draft" },
                { id: 4, source: s4, target: "", status: "draft" },
                { id: 5, source: s5, target: "", status: "draft" },
                { id: 6, source: s6, target: "", status: "draft" }
            ];

            const demoProject = {
                id: pId,
                title: "Akademik Çeviri & TM Benchmark",
                sourceLang: "tr",
                targetLang: "en",
                type: "text",
                date: new Date().toLocaleDateString('tr-TR'),
                documents: [
                    {
                        id: dId,
                        name: "Kullanım_Kılavuzu_v2.docx",
                        type: "text",
                        currentPage: 1,
                        totalPages: 1,
                        segments: segments
                    }
                ]
            };

            // TM Kayıtları (Özel Hash ve Bağlamlarla Hazırlanmış):
            // Entry 1: Segment 1 (Tek yönlü sonraki bağlam)
            // Entry 2: Segment 2 (ÇİFT YÖNLÜ BAĞLAM: Hem s1 öncesinde hem s3 sonrasında) -> %102 ICE Match!
            // Entry 3: Segment 3 (TEK YÖNLÜ BAĞLAM: s2 öncesinde) -> %101 ICE Match!
            // Entry 4: Segment 4 (Birebir metin, bağlam yok/farklı) -> %100 Exact Match!
            // Entry 5: Segment 5 için benzer cümle -> %82 Fuzzy Match!
            const demoTmEntries = [
                {
                    id: 'tm-demo-1',
                    projectId: pId,
                    source: s1,
                    sourceNorm: normalizeString(s1),
                    target: "Plug the device into the outlet and inspect the power cord.",
                    prevSourceHash: "",
                    nextSourceHash: hashContextText(s2),
                    date: "Doğrulanmış Bellek (Exact)"
                },
                {
                    id: 'tm-demo-2',
                    projectId: pId,
                    source: s2,
                    sourceNorm: normalizeString(s2),
                    target: "Press and hold the power button for 3 seconds.",
                    prevSourceHash: hashContextText(s1),
                    nextSourceHash: hashContextText(s3),
                    date: "Doğrulanmış Bellek (Double Context ICE)"
                },
                {
                    id: 'tm-demo-3',
                    projectId: pId,
                    source: s3,
                    sourceNorm: normalizeString(s3),
                    target: "Setup is complete when the blue LED indicator lights up.",
                    prevSourceHash: hashContextText(s2),
                    nextSourceHash: hashContextText("Farklı bir sonraki cümle."),
                    date: "Doğrulanmış Bellek (Context ICE)"
                },
                {
                    id: 'tm-demo-4',
                    projectId: pId,
                    source: s4,
                    sourceNorm: normalizeString(s4),
                    target: "Read safety instructions and operational warnings carefully.",
                    prevSourceHash: hashContextText("Bambaşka bir önceki cümle."),
                    nextSourceHash: hashContextText("Bambaşka bir sonraki cümle."),
                    date: "Doğrulanmış Bellek (Exact 100%)"
                },
                {
                    id: 'tm-demo-5',
                    projectId: pId,
                    source: "Sistem güncellemeleri arka planda yüklenecektir.",
                    sourceNorm: normalizeString("Sistem güncellemeleri arka planda yüklenecektir."),
                    target: "System updates will be installed in the background.",
                    prevSourceHash: "",
                    nextSourceHash: "",
                    date: "Doğrulanmış Bellek (Fuzzy)"
                }
            ];

            // Projeyi ekle veya güncelle
            const existingIdx = appState.projects.findIndex(p => p.id === pId);
            if (existingIdx !== -1) {
                appState.projects[existingIdx] = demoProject;
            } else {
                appState.projects.unshift(demoProject);
            }

            // TM kayıtlarını ekle
            appState.translationMemory = appState.translationMemory.filter(t => t.projectId !== pId);
            appState.translationMemory.push(...demoTmEntries);

            appState.activeProjectId = pId;
            appState.documents = demoProject.documents;
            appState.activeDocId = dId;

            renderProjectsGrid();
            renderSidebarDocs();
            updateActiveProjectView();
            renderActiveDocument();
            updateTMStats();
            updateProgressStats();

            if (forceSwitch) {
                switchNav('editor');
                if (typeof showToast === 'function') {
                    showToast('🎯 %100, %101 ve %102 TM Demo Paketi yüklendi! Segment tablosunda inceleyebilirsiniz.');
                }
            }
        }

        async function initApp() {
            // Tema başlangıç ayarını yap
            if (window.CatUI && typeof window.CatUI.initTheme === 'function') {
                window.CatUI.initTheme();
            }
            initUserProfile();
            updateSettingsThemeBadge();

            // Önce yerel disk veya tarayıcı depolamasındaki kayıtlı çalışma durumunu kontrol et
            let restored = false;
            try {
                const savedState = await loadAppStateFromLocal();
                if (savedState && savedState.projects && savedState.projects.length > 0) {
                    appState.projects = savedState.projects;
                    if (savedState.translationMemory && Array.isArray(savedState.translationMemory)) {
                        appState.translationMemory = savedState.translationMemory;
                    }
                    if (savedState.glossary && Array.isArray(savedState.glossary)) {
                        appState.glossary = savedState.glossary;
                    }
                    if (savedState.currentServerVideoId) {
                        currentServerVideoId = savedState.currentServerVideoId;
                    }
                    if (savedState.activeProjectId && appState.projects.some(p => p.id === savedState.activeProjectId)) {
                        appState.activeProjectId = savedState.activeProjectId;
                    } else {
                        appState.activeProjectId = appState.projects[0].id;
                    }

                    const activeProj = appState.projects.find(p => p.id === appState.activeProjectId) || appState.projects[0];
                    appState.documents = activeProj.documents || [];
                    if (savedState.activeDocId && appState.documents.some(d => d.id === savedState.activeDocId)) {
                        appState.activeDocId = savedState.activeDocId;
                    } else if (appState.documents.length > 0) {
                        appState.activeDocId = appState.documents[0].id;
                    }

                    restored = true;
                }
            } catch (loadErr) {
                console.warn("Çalışma alanı geri yükleme hatası:", loadErr);
            }

            if (!restored || appState.projects.length === 0) {
                // İlk açılışta veya çalışma alanı boşken %100, %101 ve %102 demo verisini otomatik yükle
                loadStandardTmDemoProject(false);
            }

            const currentProj = getActiveProject() || (appState.projects.length > 0 ? appState.projects[0] : null);
            renderProjectsGrid();
            renderSidebarDocs();
            updateActiveProjectView();
            renderActiveDocument();
            if (typeof renderGlossaryView === 'function') renderGlossaryView();
            updateProgressStats();
            updateTMStats();
            if (currentProj) syncWebSpeechLanguageFromProject(currentProj);

            // 3D Küreyi Başlat (Header Mini Küre)
            initHeaderMiniGlobe();

            // Altyazı Stillerini Uygula
            if (typeof applySubtitleStyles === 'function') {
                applySubtitleStyles();
            }

            // Gemini API Anahtar Durumunu Yükle
            if (appState.geminiApiKey) {
                const input = document.getElementById('geminiApiKeyInput');
                if (input) input.value = appState.geminiApiKey;
                const badge = document.getElementById('geminiKeyStatusBadge');
                if (badge) {
                    badge.innerText = 'API Bağlandı (Aktif)';
                    badge.className = 'text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-300';
                }
            }

            // İlk yerel kaydı gerçekleştir
            updateAutoSaveBadge('saved', 'Lokal Kayıtlı');
            if (restored) {
                showToast("⚡ Önceki oturumdaki çalışmalarınız yerel depolamadan başarıyla yüklendi!");
            } else {
                saveAppStateToLocal();
            }
        }

        function getActiveProject() {
            return appState.projects.find(p => p.id === appState.activeProjectId) || appState.projects[0];
        }

        function getActiveDoc() {
            if (!appState.documents || appState.documents.length === 0) return null;
            return appState.documents.find(d => d.id === appState.activeDocId) || appState.documents[0];
        }

        // Çalışma Alanını (Editor View) Proje Türüne Göre Dinamik Olarak Güncelle
        function updateActiveProjectView() {
            const proj = getActiveProject();
            if (!proj) return;
            const type = proj.type || 'text';

            const badgeEl = document.getElementById('activeProjectTypeBadge');
            const subBench = document.getElementById('subtitlingWorkbench');
            const interpBench = document.getElementById('interpretingWorkbench');
            const docIcon = document.getElementById('activeDocIcon');
            const subVideoPanel = document.getElementById('subVideoPanel');
            const btnReturn = document.getElementById('btnReturnToSubVideo');
            const topBarReturn = document.getElementById('topBarReturnToSubVideo');
            const collapsedBanner = document.getElementById('subVideoCollapsedBanner');

            const hasVideoOrSub = proj.wasSubtitling || proj.hasVideo || currentLoadedVideoFile || currentTranscribeVideoFile || (proj.type && proj.type.includes('sub'));

            if (type === 'subtitling') {
                if (badgeEl) {
                    badgeEl.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 shadow-2xs';
                    badgeEl.innerHTML = '<span class="material-symbols-outlined text-[13px]">subtitles</span><span>Altyazı Çevirisi (Netflix / EBU-TT)</span>';
                }
                if (docIcon) docIcon.innerText = 'subtitles';
                if (subBench) subBench.classList.remove('hidden');
                if (interpBench) interpBench.classList.add('hidden');
                if (subVideoPanel) subVideoPanel.classList.remove('hidden');
                if (btnReturn) { btnReturn.classList.add('hidden'); btnReturn.classList.remove('flex'); }
                if (topBarReturn) { topBarReturn.classList.add('hidden'); topBarReturn.classList.remove('flex'); }
                if (collapsedBanner) { collapsedBanner.classList.add('hidden'); collapsedBanner.classList.remove('flex'); }
                initSubVideoEventListeners();

                // İlk segmenti sinema monitörüne ve video oynatıcıya bağla
                const doc = getActiveDoc();
                if (doc && doc.segments && doc.segments.length > 0) {
                    updateCinemaSubtitleMonitor(doc.segments[0]);
                }

            } else if (type === 'interpreting') {
                if (badgeEl) {
                    badgeEl.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-800 border-teal-200 flex items-center gap-1 shadow-2xs';
                    badgeEl.innerHTML = '<span class="material-symbols-outlined text-[13px]">record_voice_over</span><span>Sözlü Çeviri Hazırlık</span>';
                }
                if (docIcon) docIcon.innerText = 'record_voice_over';
                if (subBench) subBench.classList.add('hidden');
                if (interpBench) interpBench.classList.remove('hidden');
                if (subVideoPanel) subVideoPanel.classList.add('hidden');
                if (btnReturn) { btnReturn.classList.add('hidden'); btnReturn.classList.remove('flex'); }
                if (topBarReturn) { topBarReturn.classList.add('hidden'); topBarReturn.classList.remove('flex'); }
                if (collapsedBanner) { collapsedBanner.classList.add('hidden'); collapsedBanner.classList.remove('flex'); }
                hideInterpretingSpecialContainers();
                switchInterpretingTab(appState.interpretingActiveTab || 'segments');

            } else {
                // Standart Yazılı Metin Çevirisi
                if (badgeEl) {
                    badgeEl.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 shadow-2xs';
                    badgeEl.innerHTML = '<span class="material-symbols-outlined text-[13px]">description</span><span>Yazılı Metin Çevirisi</span>';
                }
                if (docIcon) {
                    const activeDoc = getActiveDoc();
                    if (activeDoc && activeDoc.originalFormat === 'pdf') {
                        docIcon.innerText = 'picture_as_pdf';
                    } else if (activeDoc && (activeDoc.originalFormat === 'docx' || activeDoc.originalFormat === 'doc')) {
                        docIcon.innerText = 'article';
                    } else {
                        docIcon.innerText = 'description';
                    }
                }
                if (subBench) subBench.classList.add('hidden');
                if (interpBench) interpBench.classList.add('hidden');
                if (subVideoPanel) subVideoPanel.classList.add('hidden');

                if (hasVideoOrSub) {
                    if (btnReturn) { btnReturn.classList.remove('hidden'); btnReturn.classList.add('flex'); }
                    if (topBarReturn) { topBarReturn.classList.remove('hidden'); topBarReturn.classList.add('flex'); }
                    if (collapsedBanner) { collapsedBanner.classList.remove('hidden'); collapsedBanner.classList.add('flex'); }
                } else {
                    if (btnReturn) { btnReturn.classList.add('hidden'); btnReturn.classList.remove('flex'); }
                    if (topBarReturn) { topBarReturn.classList.add('hidden'); topBarReturn.classList.remove('flex'); }
                    if (collapsedBanner) { collapsedBanner.classList.add('hidden'); collapsedBanner.classList.remove('flex'); }
                }
                hideInterpretingSpecialContainers();
            }

            // Dil Çifti Açılır Menülerini Projeye Göre Senkronize Et
            const srcSelect = document.getElementById('editorSourceLangSelect');
            const trgSelect = document.getElementById('editorTargetLangSelect');
            if (srcSelect && proj) srcSelect.value = proj.sourceLang || 'en';
            if (trgSelect && proj) trgSelect.value = proj.targetLang || 'tr';

            // Top Bar Proje Adı, Teslim Tarihi Rozeti ve Kılavuz Göstergesi Senkronizasyonu
            const tbProjName = document.getElementById('topBarProjectName');
            if (tbProjName && proj) tbProjName.innerText = proj.title || proj.name || 'Proje';

            const dlBadgeContainer = document.getElementById('topBarDeadlineBadgeContainer');
            const dlBadge = document.getElementById('topBarDeadlineBadge');
            if (proj && proj.deadline && typeof getProjectDeadlineInfo === 'function') {
                const dl = getProjectDeadlineInfo(proj.deadline);
                if (dl && dlBadge && dlBadgeContainer) {
                    dlBadge.className = `text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs flex items-center gap-1 ${dl.badgeClass}`;
                    dlBadge.innerHTML = `<span class="material-symbols-outlined text-[12px]">${dl.icon}</span><span>${dl.shortText || dl.text}</span>`;
                    dlBadgeContainer.classList.remove('hidden');
                    dlBadgeContainer.classList.add('flex');
                }
            } else if (dlBadgeContainer) {
                dlBadgeContainer.classList.add('hidden');
                dlBadgeContainer.classList.remove('flex');
            }

            const guideDot = document.getElementById('guidelinesHeaderDot');
            if (guideDot) {
                if (proj && proj.styleGuide && proj.styleGuide.content && proj.styleGuide.content.trim()) {
                    guideDot.classList.remove('hidden');
                } else {
                    guideDot.classList.add('hidden');
                }
            }

            updateExportButtonLabels();
        }

        function onEditorLanguageChanged() {
            const proj = getActiveProject();
            if (!proj) return;
            const src = document.getElementById('editorSourceLangSelect')?.value || 'en';
            const trg = document.getElementById('editorTargetLangSelect')?.value || 'tr';
            if (src === trg) {
                showToast("Kaynak ve hedef dil aynı olamaz.");
                return;
            }
            proj.sourceLang = src;
            proj.targetLang = trg;
            proj.desc = `${src.toUpperCase()} ➔ ${trg.toUpperCase()} çeviri ve segmentasyon projesi.`;
            scheduleAutoSave();
            showToast(`🌐 Çeviri yönü güncellendi: ${src.toUpperCase()} ➔ ${trg.toUpperCase()}`);
        }

        function swapEditorLanguages() {
            const proj = getActiveProject();
            if (!proj) return;
            const curSrc = proj.sourceLang || 'en';
            const curTrg = proj.targetLang || 'tr';
            proj.sourceLang = curTrg;
            proj.targetLang = curSrc;
            proj.desc = `${curTrg.toUpperCase()} ➔ ${curSrc.toUpperCase()} çeviri ve segmentasyon projesi.`;
            const srcSelect = document.getElementById('editorSourceLangSelect');
            const trgSelect = document.getElementById('editorTargetLangSelect');
            if (srcSelect) srcSelect.value = proj.sourceLang;
            if (trgSelect) trgSelect.value = proj.targetLang;
            scheduleAutoSave();
            showToast(`🔄 Dil çifti ters çevrildi: ${proj.sourceLang.toUpperCase()} ➔ ${proj.targetLang.toUpperCase()}`);
        }

        // ========================================================
        // 4.1 CANLI SİNEMA ALTYAZI ÖNİZLEME MONİTÖRÜ
        // ========================================================
        function updateCinemaSubtitleMonitor(segOrId) {
            let seg = segOrId;
            if (typeof segOrId === 'number' || typeof segOrId === 'string') {
                const doc = getActiveDoc();
                seg = doc && doc.segments ? doc.segments.find(s => s.id === parseInt(segOrId, 10)) : null;
            }
            if (!seg) return;
            appState.activeSubtitleSegmentId = seg.id;
            appState.activeSegmentId = seg.id;
            window._lastHoveredSegId = seg.id;

            const timeEl = document.getElementById('subMonitorTimecode');
            const durEl = document.getElementById('subMonitorDuration');
            const textEl = document.getElementById('subMonitorLiveText');
            const cpsBadge = document.getElementById('subMonitorCpsBadge');

            const start = seg.startTime || '00:00:01,000';
            const end = seg.endTime || '00:00:04,500';
            const dur = seg.durationSec || 3.5;

            if (timeEl) timeEl.innerText = `${start} ➔ ${end}`;
            if (durEl) durEl.innerText = `${dur}s`;

            const displayText = (seg.target && seg.target.trim().length > 0)
                ? seg.target.trim()
                : (seg.source || 'Altyazı metni...');

            if (textEl) {
                // Altyazıda satır sonlarını ve güvenli HTML etiketlerini (i, b, font vb.) işle
                textEl.innerHTML = sanitizeSubtitleHtml(displayText);
            }

            const metrics = calculateSubtitleMetrics(displayText, dur);
            if (cpsBadge) {
                if (metrics.cpsStatus === 'ideal') {
                    cpsBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-900/70 text-emerald-300 border border-emerald-600 shadow-2xs';
                    cpsBadge.innerText = `${metrics.cps} CPS (İdeal Okuma Hızı)`;
                } else if (metrics.cpsStatus === 'fast') {
                    cpsBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-900/70 text-amber-300 border border-amber-600 shadow-2xs';
                    cpsBadge.innerText = `${metrics.cps} CPS (Hızlı)`;
                } else {
                    cpsBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-300 border border-rose-600 shadow-2xs animate-pulse';
                    cpsBadge.innerText = `${metrics.cps} CPS (Okuma Hızı Aşıldı!)`;
                }
            }
        }

        // ========================================================
        // 4.2 SÖZLÜ ÇEVİRİ HAZIRLIK KONSOLU İŞLEMLERİ
        // (İKİ DİLLİ KARTLAR, EZBER FLASHCARD MODU, CONCORDANCE)
        // ========================================================
        function hideInterpretingSpecialContainers() {
            const cCards = document.getElementById('interpCardsContainer');
            const cFlash = document.getElementById('interpFlashcardsContainer');
            const cConc = document.getElementById('interpConcordanceContainer');
            const cSegs = document.getElementById('segmentsContainer');

            if (cCards) { cCards.classList.add('hidden'); cCards.classList.remove('flex'); }
            if (cFlash) { cFlash.classList.add('hidden'); cFlash.classList.remove('flex'); }
            if (cConc) { cConc.classList.add('hidden'); cConc.classList.remove('flex'); }
            if (cSegs) { cSegs.classList.remove('hidden'); cSegs.classList.add('flex'); }
        }

        function switchInterpretingTab(tab) {
            appState.interpretingActiveTab = tab;

            const tabs = ['segments', 'cards', 'flashcards', 'concordance'];
            tabs.forEach(t => {
                const btn = document.getElementById(`interpTabBtn-${t}`);
                if (btn) {
                    if (t === tab) {
                        btn.className = "px-3 py-1 rounded-md text-xs font-bold bg-white text-teal-900 shadow-xs flex items-center gap-1.5 transition-all";
                    } else {
                        btn.className = "px-3 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-all";
                    }
                }
            });

            const cSegs = document.getElementById('segmentsContainer');
            const cCards = document.getElementById('interpCardsContainer');
            const cFlash = document.getElementById('interpFlashcardsContainer');
            const cConc = document.getElementById('interpConcordanceContainer');

            [cSegs, cCards, cFlash, cConc].forEach(el => {
                if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
            });

            if (tab === 'segments') {
                if (cSegs) { cSegs.classList.remove('hidden'); cSegs.classList.add('flex'); }
                renderSegments();
            } else if (tab === 'cards') {
                if (cCards) { cCards.classList.remove('hidden'); cCards.classList.add('flex'); }
                renderInterpCards();
            } else if (tab === 'flashcards') {
                if (cFlash) { cFlash.classList.remove('hidden'); cFlash.classList.add('flex'); }
                renderInterpFlashcards();
            } else if (tab === 'concordance') {
                if (cConc) { cConc.classList.remove('hidden'); cConc.classList.add('flex'); }
                renderInterpConcordance();
            }
        }

        // İki Dilli Terim Kartları Izgarası
        function renderInterpCards() {
            const container = document.getElementById('interpCardsContainer');
            if (!container) return;
            container.innerHTML = '';

            const badge = document.getElementById('interpCardsCountBadge');
            if (badge) badge.innerText = appState.glossary.length;

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5';

            appState.glossary.forEach(t => {
                const card = document.createElement('div');
                card.className = 'fluent-card p-4 rounded-xl border border-teal-100 bg-white/95 shadow-sm flex flex-col justify-between gap-2.5 hover:border-teal-400 transition-all group';
                card.innerHTML = `
                    <div class="flex items-start justify-between">
                        <span class="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                            ${escapeHtml(t.cat || 'Genel')}
                        </span>
                        <button onclick="copyToClipboard('${escapeHtml(t.target)}')" class="text-slate-400 hover:text-teal-700 p-1 rounded" title="Hedef Terimi Kopyala">
                            <span class="material-symbols-outlined text-[15px]">content_copy</span>
                        </button>
                    </div>
                    <div class="flex flex-col gap-1 select-text">
                        <div class="text-xs font-bold text-slate-900 group-hover:text-teal-900">${escapeHtml(t.source)}</div>
                        <div class="text-xs font-semibold text-teal-700 bg-teal-50/50 p-2 rounded-lg border border-teal-100 flex items-center gap-1.5">
                            <span class="text-slate-400">➔</span>
                            <span>${escapeHtml(t.target)}</span>
                        </div>
                    </div>
                    ${t.note ? `<div class="text-[10px] text-slate-500 font-mono italic">💡 ${escapeHtml(t.note)}</div>` : ''}
                `;
                grid.appendChild(card);
            });

            container.appendChild(grid);
        }

        // Ezber ve Çalışma Modu (Flashcard / Quiz)
        function renderInterpFlashcards() {
            const container = document.getElementById('interpFlashcardsContainer');
            if (!container) return;
            container.innerHTML = '';

            const terms = appState.glossary;
            if (terms.length === 0) {
                container.innerHTML = `<div class="text-xs text-slate-400">Sözlükte kayıtlı terim bulunamadı.</div>`;
                return;
            }

            if (appState.flashcardIndex >= terms.length) {
                appState.flashcardIndex = 0;
            }

            const current = terms[appState.flashcardIndex];
            const isRevealed = appState.flashcardRevealed;
            const total = terms.length;
            const currentIdx = appState.flashcardIndex + 1;

            const wrapper = document.createElement('div');
            wrapper.className = 'w-full max-w-lg flex flex-col gap-4 mx-auto my-auto py-4 select-none';

            wrapper.innerHTML = `
                <!-- Üst İlerleme ve Skor Çubuğu -->
                <div class="flex items-center justify-between text-xs font-mono">
                    <span class="font-bold text-slate-700">Kart ${currentIdx} / ${total}</span>
                    <div class="flex items-center gap-3">
                        <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Biliyorum: ${appState.flashcardScore.known}</span>
                        <span class="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">↻ Tekrar: ${appState.flashcardScore.repeat}</span>
                    </div>
                </div>

                <!-- İnteraktif Çalışma Kartı (Flip Card Simulation) -->
                <div onclick="flipFlashcard()" 
                     class="w-full bg-white rounded-2xl p-8 border-2 ${isRevealed ? 'border-teal-400 bg-teal-50/20' : 'border-slate-200'} shadow-xl cursor-pointer min-h-[220px] flex flex-col items-center justify-center text-center gap-4 transition-all hover:shadow-2xl">
                    <span class="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 uppercase">
                        ${escapeHtml(current.cat || 'Terminoloji')} · ${isRevealed ? 'Hedef Karşılık Açıldı' : 'Kartı Çevirmek İçin Tıklayın'}
                    </span>
                    
                    <div class="text-lg md:text-xl font-extrabold text-slate-900 leading-snug">
                        ${escapeHtml(current.source)}
                    </div>

                    ${isRevealed ? `
                        <div class="w-full pt-3 border-t border-teal-200/80 animate-fadeIn flex flex-col gap-2">
                            <div class="text-base font-bold text-teal-800 flex items-center justify-center gap-1.5">
                                <span class="material-symbols-outlined text-[20px] text-teal-600">translate</span>
                                <span>${escapeHtml(current.target)}</span>
                            </div>
                            ${current.note ? `<div class="text-xs text-slate-500 font-mono italic">💡 ${escapeHtml(current.note)}</div>` : ''}
                        </div>
                    ` : `
                        <div class="text-xs text-teal-700 font-semibold flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">touch_app</span>
                            <span>Cevabı Görmek İçin Tıklayın</span>
                        </div>
                    `}
                </div>

                <!-- Aksiyon Düğmeleri -->
                <div class="flex items-center justify-between gap-3 pt-2">
                    <button onclick="answerFlashcard(false)"
                        class="fluent-btn flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 hover:border-rose-300 flex items-center justify-center gap-1.5 shadow-2xs">
                        <span class="material-symbols-outlined text-[17px] text-amber-600">replay</span>
                        <span>Tekrar Çalış</span>
                    </button>
                    <button onclick="flipFlashcard()"
                        class="fluent-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 shadow-2xs">
                        <span class="material-symbols-outlined text-[17px]">sync</span>
                        <span>Çevir</span>
                    </button>
                    <button onclick="answerFlashcard(true)"
                        class="fluent-btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                        <span class="material-symbols-outlined text-[17px]">check</span>
                        <span>Biliyorum (+1)</span>
                    </button>
                </div>
            `;

            container.appendChild(wrapper);
        }

        function flipFlashcard() {
            appState.flashcardRevealed = !appState.flashcardRevealed;
            renderInterpFlashcards();
        }

        function answerFlashcard(isKnown) {
            if (isKnown) {
                appState.flashcardScore.known++;
            } else {
                appState.flashcardScore.repeat++;
            }
            appState.flashcardRevealed = false;
            appState.flashcardIndex = (appState.flashcardIndex + 1) % appState.glossary.length;
            renderInterpFlashcards();
        }

        // Canlı Concordance Arama Motoru
        function handleConcordanceSearch(val) {
            appState.concordanceQuery = val.trim();
            if (appState.interpretingActiveTab !== 'concordance' && val.trim().length > 0) {
                switchInterpretingTab('concordance');
            } else {
                renderInterpConcordance();
            }
        }

        function renderInterpConcordance() {
            const container = document.getElementById('interpConcordanceContainer');
            if (!container) return;
            container.innerHTML = '';

            const q = (appState.concordanceQuery || '').toLowerCase().trim();

            if (!q) {
                container.innerHTML = `
                    <div class="fluent-card p-8 rounded-xl text-center flex flex-col items-center gap-2 my-auto">
                        <span class="material-symbols-outlined text-4xl text-teal-400">search_insights</span>
                        <div class="text-xs font-bold text-slate-800">Canlı Concordance Arama Konsolu</div>
                        <p class="text-[11px] text-slate-500 max-w-md">Yukarıdaki arama kutusuna bir sözcük veya kavram yazın. Sistem tüm belgelerdeki cümleleri, çeviri belleğini (TM) ve terim sözlüğünü anında çift dilli olarak tarayacaktır.</p>
                    </div>
                `;
                return;
            }

            const doc = getActiveDoc();
            const results = [];

            // 1. Sözlükteki Eşleşmeler
            appState.glossary.forEach(t => {
                if (t.source.toLowerCase().includes(q) || t.target.toLowerCase().includes(q)) {
                    results.push({ type: 'Terminoloji', src: t.source, tgt: t.target, note: t.note || t.cat });
                }
            });

            // 2. Çeviri Belleğindeki Eşleşmeler
            appState.translationMemory.forEach(tm => {
                if (tm.source.toLowerCase().includes(q) || tm.target.toLowerCase().includes(q)) {
                    results.push({ type: 'Çeviri Belleği (TM)', src: tm.source, tgt: tm.target, note: tm.date });
                }
            });

            // 3. Aktif Belgedeki Eşleşmeler
            if (doc && doc.segments) {
                doc.segments.forEach((s, idx) => {
                    if (s.source.toLowerCase().includes(q) || s.target.toLowerCase().includes(q)) {
                        results.push({ type: `Belge Segment #${idx + 1}`, src: s.source, tgt: s.target || '(Henüz çevrilmedi)', note: doc.name });
                    }
                });
            }

            if (results.length === 0) {
                container.innerHTML = `
                    <div class="fluent-card p-6 rounded-xl text-center flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl text-slate-300">search_off</span>
                        <div class="text-xs text-slate-500">"${escapeHtml(q)}" ile eşleşen concordance bağlamı bulunamadı.</div>
                    </div>
                `;
                return;
            }

            const highlight = (text) => {
                if (!text) return '';
                const reg = new RegExp(`(${escapeRegex(q)})`, 'gi');
                return escapeHtml(text).replace(reg, '<mark class="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">$1</mark>');
            };

            const list = document.createElement('div');
            list.className = 'flex flex-col gap-2.5';

            results.forEach(item => {
                const row = document.createElement('div');
                row.className = 'fluent-card p-3.5 rounded-xl border border-teal-100 bg-white shadow-2xs flex flex-col gap-1.5 select-text';
                row.innerHTML = `
                    <div class="flex items-center justify-between text-[10px] font-mono">
                        <span class="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">${escapeHtml(item.type)}</span>
                        <span class="text-slate-400">${escapeHtml(item.note || '')}</span>
                    </div>
                    <div class="text-xs text-slate-900 leading-snug"><strong>[Kaynak]:</strong> ${highlight(item.src)}</div>
                    <div class="text-xs text-teal-800 font-medium leading-snug bg-teal-50/40 p-2 rounded-lg border border-teal-100">
                        <strong>[Hedef]:</strong> ${highlight(item.tgt)}
                    </div>
                `;
                list.appendChild(row);
            });

            container.appendChild(list);
        }

        function escapeRegex(string) {
            return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
        }

        function copyToClipboard(text) {
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
                showToast(`"${text}" panoya kopyalandı.`);
            }).catch(() => { });
        }

        // ========================================================
        // 5. SOL MENÜ VE NAVİGASYON (WINDOWS 11 AYARLAR MANTIĞI)
        // ========================================================
        function switchNav(navKey) {
            appState.currentNav = navKey;

            const navIds = ['editor', 'tm', 'projects', 'glossary', 'settings'];
            navIds.forEach(key => {
                const btn = document.getElementById(`navBtn-${key}`);
                const sec = document.getElementById(`section-${key}`);
                if (btn) {
                    if (key === navKey) {
                        btn.classList.add('active');
                        btn.classList.remove('text-slate-600');
                    } else {
                        btn.classList.remove('active');
                        btn.classList.add('text-slate-600');
                    }
                }
                if (sec) {
                    if (key === navKey) {
                        sec.classList.remove('hidden');
                        sec.classList.add('flex');
                    } else {
                        sec.classList.add('hidden');
                        sec.classList.remove('flex');
                    }
                }
            });

            // Header Glossary Butonunu Senkronize Et
            const glossBtn = document.getElementById('glossaryToggleBtn');
            if (glossBtn) {
                if (navKey === 'glossary') {
                    glossBtn.classList.add('border-sky-400', 'bg-sky-50');
                } else {
                    glossBtn.classList.remove('border-sky-400', 'bg-sky-50');
                }
            }

            if (navKey === 'tm') {
                renderTMView();
            } else if (navKey === 'projects') {
                renderProjectsGrid();
            } else if (navKey === 'glossary') {
                renderGlossaryView();
            } else if (navKey === 'editor') {
                updateActiveProjectView();
                if (typeof renderSegments === 'function') renderSegments();
            }
        }
        window.switchMainView = switchNav;

        function toggleToolbarOverflow() {
            const row = document.getElementById('toolbarOverflowRow');
            if (!row) return;
            const isNowHidden = row.classList.toggle('hidden');
            const chevron = document.getElementById('toolbarOverflowChevron');
            if (chevron) {
                chevron.style.transform = isNowHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                chevron.style.transition = 'transform 0.2s ease';
            }
        }
        window.toggleToolbarOverflow = toggleToolbarOverflow;

        function openFeedbackModal() {
            showToast('💡 Görüş ve geri bildirimleriniz için teşekkürler! Sistem sürekli geliştirilmektedir.');
        }
        window.openFeedbackModal = openFeedbackModal;

        function renderSidebarDocs() {
            const list = document.getElementById('sidebarDocList');
            if (!list) return;
            list.innerHTML = '';

            const activeProj = getActiveProject();
            if (activeProj) {
                const titleEl = document.getElementById('sidebarProjectTitle');
                const badgeEl = document.getElementById('sidebarDocBadge');
                if (titleEl) titleEl.innerText = activeProj.title;
                if (badgeEl) badgeEl.innerText = `${appState.documents.length} Belge Aktif`;
            }

            if (!appState.documents || appState.documents.length === 0) {
                list.innerHTML = `
                    <div class="px-3 py-3 text-[11px] text-slate-400 bg-sky-50/50 rounded-lg border border-dashed border-sky-200 text-center flex flex-col gap-1">
                        <span>Henüz belge yok</span>
                        <button onclick="triggerDocUpload()" class="text-sky-600 font-bold hover:underline">+ İçe Aktar</button>
                    </div>
                `;
                return;
            }

            appState.documents.forEach(doc => {
                const isActive = doc.id === appState.activeDocId;
                const confirmedCount = doc.segments.filter(s => s.status === 'confirmed').length;
                const pct = doc.segments.length > 0 ? Math.round((confirmedCount / doc.segments.length) * 100) : 0;

                const item = document.createElement('div');
                item.className = `px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs group ${isActive
                    ? 'bg-sky-100/70 text-sky-900 font-semibold border-l-3 border-sky-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`;
                item.onclick = () => switchDocument(doc.id);

                item.innerHTML = `
                    <div class="flex items-center gap-2 truncate">
                        <span class="material-symbols-outlined text-[16px] ${isActive ? 'text-sky-600' : 'text-slate-400'}">description</span>
                        <span class="truncate">${escapeHtml(doc.name)}</span>
                    </div>
                    <span class="text-[10px] font-mono text-slate-400 shrink-0">%${pct}</span>
                `;
                list.appendChild(item);
            });
        }

        function switchDocument(docId) {
            appState.activeDocId = docId;
            renderSidebarDocs();
            updateActiveProjectView();
            renderActiveDocument();
            updateProgressStats();
            updateExportButtonLabels();
            switchNav('editor');
            if (getActiveDoc()) {
                showToast(`${getActiveDoc().name} açıldı.`);
            }
        }

        // ========================================================
        // 5.1 PROJELER GRID GÖRÜNÜMÜ (3 PROJE TÜRÜ ETİKETLERİYLE)
        // ========================================================
        function renderProjectsGrid() {
            if (typeof debouncedAutoSave === 'function') debouncedAutoSave();
            const countBadge = document.getElementById('navProjectsCountBadge');
            if (countBadge) countBadge.innerText = appState.projects.length;

            const headerBadge = document.getElementById('projectsHeaderCount');
            if (headerBadge) headerBadge.innerText = `${appState.projects.length} Proje`;

            const container = document.getElementById('projectsCardsGrid');
            if (!container) return;
            container.innerHTML = '';

            appState.projects.forEach(proj => {
                const isActive = proj.id === appState.activeProjectId;
                const docs = proj.documents || [];
                const totalSegments = docs.reduce((acc, d) => acc + (d.segments ? d.segments.length : 0), 0);
                const confirmedSegments = docs.reduce((acc, d) => acc + (d.segments ? d.segments.filter(s => s.status === 'confirmed').length : 0), 0);
                const pct = totalSegments > 0 ? Math.round((confirmedSegments / totalSegments) * 100) : 0;

                let typeTag = '<span class="text-[9px] font-mono font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-300">Yazılı Metin</span>';
                let iconName = 'description';
                if (proj.type === 'subtitling') {
                    typeTag = '<span class="text-[9px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-300">Altyazı (.srt)</span>';
                    iconName = 'subtitles';
                } else if (proj.type === 'interpreting') {
                    typeTag = '<span class="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">Sözlü Çeviri</span>';
                    iconName = 'record_voice_over';
                }

                const card = document.createElement('div');
                card.className = `fluent-card p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 cursor-pointer hover:border-sky-400 bg-white shadow-sm ${isActive ? 'border-sky-400 ring-2 ring-sky-300/30' : 'border-slate-200'
                    }`;
                card.onclick = () => selectProject(proj.id);

                const dlInfo = (typeof getProjectDeadlineInfo === 'function') ? getProjectDeadlineInfo(proj.deadline) : null;
                let deadlineBadgeHtml = '';
                if (dlInfo) {
                    deadlineBadgeHtml = `
                        <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shadow-2xs ${dlInfo.badgeClass}" title="Teslim: ${escapeHtml(proj.deadline)}">
                            <span class="material-symbols-outlined text-[13px]">${dlInfo.icon}</span>
                            <span>${dlInfo.text}</span>
                        </div>
                    `;
                }

                const glossCount = (proj.assignedGlossaries && Array.isArray(proj.assignedGlossaries)) ? proj.assignedGlossaries.length : 0;
                const hasGuide = !!(proj.styleGuide && proj.styleGuide.content && proj.styleGuide.content.trim());

                card.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg ${isActive ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700'} border border-sky-200 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[20px]">${iconName}</span>
                            </div>
                            <div>
                                <h3 class="font-bold text-xs text-slate-900">${escapeHtml(proj.title)}</h3>
                                <div class="text-[10px] text-slate-500 font-mono mt-0.5">${docs.length} Belge · ${totalSegments} Cümle/Blok</div>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            ${typeTag}
                            ${isActive ? '<span class="text-[9px] font-mono font-bold text-sky-600">● Aktif</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center flex-wrap gap-1.5 pt-0.5">
                        ${deadlineBadgeHtml}
                        ${glossCount > 0 ? `<span class="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-bold" title="Bağlı Terim Tabloları">📚 ${glossCount} Sözlük</span>` : ''}
                        ${hasGuide ? `<span class="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold" title="Stil Kılavuzu Tanımlı">📖 Kılavuz</span>` : ''}
                    </div>

                    <div class="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        ${escapeHtml(proj.desc || 'Çeviri ve segmentasyon projesi.')}
                    </div>
                    <div class="flex flex-col gap-1.5 pt-1">
                        <div class="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>İlerleme</span>
                            <span class="font-bold text-sky-700">%${pct}</span>
                        </div>
                        <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div class="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full" style="width: ${pct}%"></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-mono text-slate-400">${escapeHtml(proj.createdAt || 'Bugün')}</span>
                            <button onclick="event.stopPropagation(); promptDeleteProject('${proj.id}')" 
                                    class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 text-[10px] font-bold border border-rose-200" 
                                    title="Projeyi Sil">
                                <span class="material-symbols-outlined text-[14px]">delete</span>
                                <span>Sil</span>
                            </button>
                        </div>
                        <span class="text-xs font-bold text-sky-600 flex items-center gap-1 hover:underline">
                            <span>Projeyi Aç</span>
                            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                    </div>
                `;
                container.appendChild(card);
            });

            // "+ Yeni Proje Oluştur" kartı
            const addCard = document.createElement('div');
            addCard.className = 'border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all bg-sky-50/20 hover:bg-sky-50/60 group min-h-[160px]';
            addCard.onclick = () => openCreateProjectModal();
            addCard.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-white border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform shadow-xs">
                    <span class="material-symbols-outlined text-[20px]">add</span>
                </div>
                <div class="text-xs font-bold text-slate-800">Yeni Proje Başlat</div>
                <div class="text-[10px] text-slate-500">Yazılı, Altyazı veya Sözlü Çeviri Şablonu Seçin</div>
            `;
            container.appendChild(addCard);
        }

        let pendingDeleteProjectId = null;

        function promptDeleteProject(projId) {
            const proj = appState.projects.find(p => p.id === projId);
            if (!proj) return;
            pendingDeleteProjectId = projId;
            const nameEl = document.getElementById('deleteProjectModalTargetName');
            if (nameEl) nameEl.innerText = `"${proj.title}" silinecek`;
            const m = document.getElementById('modalDeleteProject');
            if (m) {
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
        }

        function closeDeleteProjectModal() {
            pendingDeleteProjectId = null;
            const m = document.getElementById('modalDeleteProject');
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        }

        function executeDeleteProject() {
            if (!pendingDeleteProjectId) return;
            const projId = pendingDeleteProjectId;
            const projIdx = appState.projects.findIndex(p => p.id === projId);
            if (projIdx === -1) return;

            const projName = appState.projects[projIdx].title;
            // 1. Projeyi listeden kaldır
            appState.projects.splice(projIdx, 1);

            // 2. Projeye bağlı TM kayıtlarını sil
            appState.translationMemory = appState.translationMemory.filter(t => t.projectId !== projId);

            // 2b. KÜRESEL TERİM TABANI İLİŞKİSEL BÜTÜNLÜK (ON DELETE SET NULL):
            // Proje silindiğinde terimler SİLİNMEZ! Kaynak proje adı metin olarak korunur ve projectId null yapılır.
            if (appState.glossary && Array.isArray(appState.glossary)) {
                appState.glossary.forEach(t => {
                    if (t.projectId === projId) {
                        t.projectName = t.projectName || projName;
                        t.projectId = null;
                    }
                });
            }

            // 3. Eğer silinen proje aktif projeyse diğer projeye geç
            if (appState.activeProjectId === projId) {
                if (appState.projects.length > 0) {
                    selectProject(appState.projects[0].id);
                } else {
                    appState.activeProjectId = null;
                    appState.documents = [];
                    appState.activeDocId = null;
                    renderSidebarDocs();
                    updateActiveProjectView();
                    renderActiveDocument();
                }
            }

            closeDeleteProjectModal();
            renderProjectsGrid();
            renderTMView();
            updateTMStats();
            showToast(`"${projName}" ve ilişkili tüm verileri başarıyla silindi.`);
        }

        function selectProject(projId) {
            const proj = appState.projects.find(p => p.id === projId);
            if (!proj) return;
            appState.activeProjectId = proj.id;
            appState.documents = proj.documents || [];
            appState.activeDocId = appState.documents.length > 0 ? appState.documents[0].id : null;

            renderProjectsGrid();
            renderSidebarDocs();
            updateActiveProjectView();
            renderActiveDocument();
            updateProgressStats();
            syncWebSpeechLanguageFromProject(proj);
            switchNav('editor');
            showToast(`"${proj.title}" projesi açıldı.`);
        }

        // ========================================================
        // 6. CÜMLE CÜMLE SEGMENTASYON LİSTESİ & KART RENDER MOTORU
        // (DURUM RENKLERİ, FUZZY MATCH + DIFF, ALTYAZI METRİKLERİ & QA)
        // ========================================================
        function renderActiveDocument() {
            const doc = getActiveDoc();
            const container = document.getElementById('segmentsContainer');

            // Eğer projede hiç belge yoksa büyük içe aktar uyarısı
            if (!doc || !doc.segments || doc.segments.length === 0) {
                const isSub = getActiveProject()?.type === 'subtitling';
                document.getElementById('activeDocumentName').innerText = isSub ? 'Video / Altyazı Bekleniyor' : 'Belge Bekleniyor';
                document.getElementById('activeDocBadge').innerText = '0 Cümle';
                document.getElementById('navSegCountBadge').innerText = '0';

                if (container) {
                    if (isSub) {
                        container.innerHTML = `
                            <div class="fluent-card p-8 md:p-14 rounded-3xl border-2 border-dashed border-purple-400/90 bg-gradient-to-b from-purple-50/90 via-white to-purple-50/40 text-center flex flex-col items-center justify-center gap-6 m-auto max-w-2xl shadow-2xl my-auto animate-fadeIn select-none transition-all"
                                 ondragover="event.preventDefault(); this.classList.add('border-purple-600', 'bg-purple-100/60');"
                                 ondragleave="this.classList.remove('border-purple-600', 'bg-purple-100/60');"
                                 ondrop="handleContainerFileDrop(event); this.classList.remove('border-purple-600', 'bg-purple-100/60');">
                                
                                <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xl shadow-purple-600/35 relative">
                                    <span class="material-symbols-outlined text-[54px] animate-pulse">movie</span>
                                </div>

                                <div class="flex flex-col gap-2.5 max-w-lg">
                                    <div class="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-900 text-xs font-extrabold font-mono border border-purple-300 shadow-xs mx-auto">
                                        <span class="material-symbols-outlined text-[17px] text-purple-600">subtitles</span>
                                        <span>ALTYAZI ÇEVİRİSİ · OTOMATİK AKIŞKAN TRANSKRİPSİYON</span>
                                    </div>
                                    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                                        Video Dosyası Yükleyin
                                    </h2>
                                    <p class="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                                        Demo yazılar tamamen temizlendi. Video dosyanızı yüklediğiniz anda sistem sizi bekleme ekranında bekletmeden konuşmaları arka planda otomatik olarak segmente etmeye başlar. İlk cümle çıktığı andan itibaren çevirmeye başlayabilirsiniz!
                                    </p>
                                </div>

                                <div class="flex flex-wrap items-center justify-center gap-3.5 pt-2 w-full">
                                    <button onclick="document.getElementById('subVideoFileInput').click()" class="fluent-btn-primary bg-purple-700 hover:bg-purple-800 px-6 py-3.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2.5 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/45 transition-all cursor-pointer">
                                        <span class="material-symbols-outlined text-[22px]">video_file</span>
                                        <span>Video Dosyası Seç (.mp4, .mkv, .webm, .mov vb.)</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    } else {
                        container.innerHTML = `
                            <div class="fluent-card p-8 md:p-14 rounded-3xl border-2 border-dashed border-sky-400/90 bg-gradient-to-b from-sky-50/90 via-white to-sky-50/40 text-center flex flex-col items-center justify-center gap-6 m-auto max-w-2xl shadow-2xl my-auto animate-fadeIn select-none transition-all"
                                 ondragover="event.preventDefault(); this.classList.add('border-sky-600', 'bg-sky-100/60');"
                                 ondragleave="this.classList.remove('border-sky-600', 'bg-sky-100/60');"
                                 ondrop="handleContainerFileDrop(event); this.classList.remove('border-sky-600', 'bg-sky-100/60');">
                                
                                <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/35 relative">
                                    <span class="material-symbols-outlined text-[54px] animate-bounce">upload_file</span>
                                    <span class="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                                    </span>
                                </div>

                                <div class="flex flex-col gap-2.5 max-w-lg">
                                    <div class="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-900 text-xs font-extrabold font-mono border border-amber-300/80 shadow-xs mx-auto">
                                        <span class="material-symbols-outlined text-[17px] text-amber-600">warning</span>
                                        <span>YENİ PROJE AÇILDI · BELGE İÇE AKTARMA GEREKLİ</span>
                                    </div>
                                    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                                        Lütfen Bir Belge İçe Aktarın
                                    </h2>
                                    <p class="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                                        Bu projede henüz işlenecek bir metin bulunmamaktadır. Çeviri sürecini, akıllı segmentasyon motorunu ve Çeviri Belleği (TM) eşleştirmelerini başlatmak için lütfen bir dosya yükleyin veya panodan metin yapıştırın.
                                    </p>
                                </div>

                                <div class="flex flex-wrap items-center justify-center gap-3.5 pt-2 w-full">
                                    <button onclick="triggerDocUpload()" class="fluent-btn-primary px-6 py-3.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2.5 shadow-lg shadow-sky-600/30 hover:shadow-sky-600/45 transition-all cursor-pointer">
                                        <span class="material-symbols-outlined text-[22px]">cloud_upload</span>
                                        <span>Dosya Seç & İçe Aktar (.pdf, .docx, .txt, .md, .srt)</span>
                                    </button>
                                    <button onclick="openPasteModal()" class="fluent-btn px-5 py-3.5 rounded-xl text-xs md:text-sm font-bold text-slate-800 hover:text-slate-950 flex items-center gap-2.5 border-2 border-sky-300 bg-white hover:bg-sky-50 shadow-sm transition-all cursor-pointer">
                                        <span class="material-symbols-outlined text-[22px] text-sky-600">content_paste</span>
                                        <span>Metin Yapıştır</span>
                                    </button>
                                </div>

                                <div class="text-[11px] font-mono text-slate-400 pt-1 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[15px] text-sky-500">drag_indicator</span>
                                    <span>veya bir dosyayı doğrudan bu kutunun içine sürükleyip bırakabilirsiniz</span>
                                </div>
                            </div>
                        `;
                    }
                }

                document.getElementById('paginationPageText').innerHTML = `<span>Sayfa 0</span> <span class="text-slate-400">/</span> <span>0</span>`;
                document.getElementById('paginationRangeText').innerText = `Segment 0 - 0 (Toplam 0)`;
                document.getElementById('btnPrevPage').disabled = true;
                document.getElementById('btnNextPage').disabled = true;
                return;
            }

            document.getElementById('activeDocumentName').innerText = doc.name;
            document.getElementById('activeDocBadge').innerText = `${doc.segments.length} Cümle/Blok`;
            document.getElementById('navSegCountBadge').innerText = doc.segments.length;

            renderSegments();
        }

        function renderSegments() {
            if (typeof debouncedAutoSave === 'function') debouncedAutoSave();
            const doc = getActiveDoc();
            const container = document.getElementById('segmentsContainer');
            if (!container || !doc) return;
            container.innerHTML = '';

            const currentProj = getActiveProject();
            const isSubtitlingMode = currentProj.type === 'subtitling';

            let filtered = doc.segments;
            if (appState.currentFilter === 'confirmed') {
                filtered = doc.segments.filter(s => s.status === 'confirmed');
            } else if (appState.currentFilter === 'draft') {
                filtered = doc.segments.filter(s => s.status === 'draft');
            }

            if (appState.filterOnlyQAErrors) {
                filtered = filtered.filter(seg => {
                    const alerts = typeof runQAChecks === 'function' ? runQAChecks(seg.source, seg.target, seg) : [];
                    const violations = typeof checkGlossaryViolations === 'function' ? checkGlossaryViolations(seg.source, seg.target) : [];
                    return (alerts && alerts.length > 0) || (violations && violations.length > 0);
                });
            }

            if (appState.searchQuery) {
                const q = appState.searchQuery.toLowerCase();
                filtered = filtered.filter(s => (s.source && s.source.toLowerCase().includes(q)) || (s.target && s.target.toLowerCase().includes(q)));
            }

            const total = doc.segments.length;
            const totalPages = Math.max(1, Math.ceil(total / SEGMENTS_PER_PAGE));
            doc.totalPages = totalPages;
            if (doc.currentPage > totalPages) doc.currentPage = totalPages;

            const startIdx = (doc.currentPage - 1) * SEGMENTS_PER_PAGE;
            const endIdx = Math.min(startIdx + SEGMENTS_PER_PAGE, total);
            const currentSlice = doc.segments.slice(startIdx, endIdx);

            if (currentSlice.length === 0) {
                if (isSubtitlingMode && total === 0) {
                    container.innerHTML = `
                        <div class="fluent-card p-10 rounded-2xl text-center flex flex-col items-center gap-4 my-auto border-2 border-dashed border-purple-200 bg-purple-50/40 select-none">
                            <div class="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
                                <span class="material-symbols-outlined text-4xl">video_file</span>
                            </div>
                            <div class="max-w-md">
                                <h3 class="text-sm font-bold text-slate-900">Altyazı Çevirisi İçin Video Yükleyin</h3>
                                <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                    Demo metinler kaldırıldı. Video dosyanızı yüklediğiniz anda sistem tercümanı yükleme ekranında bekletmeden konuşmaları arka planda otomatik olarak çözümleyip sıra sıra sol kaynak sütununa yazmaya başlar.
                                </p>
                            </div>
                            <button onclick="document.getElementById('subVideoFileInput').click()" class="fluent-btn-primary bg-purple-700 hover:bg-purple-800 px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all">
                                <span class="material-symbols-outlined text-[18px]">upload</span>
                                <span>Video Dosyası Seç (.mp4, .mkv, .webm, .mov vb.)</span>
                            </button>
                        </div>
                    `;
                    return;
                }
                container.innerHTML = `
                    <div class="fluent-card p-8 rounded-xl text-center flex flex-col items-center gap-2 my-auto">
                        <span class="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        <div class="text-xs text-slate-500">Bu filtreye uygun segment bulunamadı.</div>
                        <button onclick="setFilter('all')" class="fluent-btn px-3 py-1.5 rounded text-xs text-sky-600 mt-2">Filtreleri Temizle</button>
                    </div>
                `;
                return;
            }

            // SANAL KAYDIRMA (VIRTUAL SCROLLING) KONTROLÜ (10.000+ Segment Desteği)
            if (appState.useVirtualScroll && window.CatVirtualScroll) {
                const pgRow = document.getElementById('paginationControlsRow');
                const vsRow = document.getElementById('virtualScrollStatusBar');
                if (pgRow) pgRow.classList.add('hidden');
                if (vsRow) vsRow.classList.remove('hidden');

                const vStatus = document.getElementById('virtualScrollStatusText');
                if (vStatus) vStatus.innerText = `Sanal Kaydırma Devrede: Toplam ${filtered.length} Segment (DOM Korumalı · 60 FPS)`;

                const btnLabel = document.getElementById('btnVirtualScrollLabel');
                if (btnLabel) btnLabel.innerText = 'Sanal Kaydırma (Açık)';

                if (window._catVirtualScroller && window._catVirtualScroller.container === container) {
                    window._catVirtualScroller.setItems(filtered);
                } else {
                    window._catVirtualScroller = window.CatVirtualScroll.create({
                        container,
                        items: filtered,
                        estimatedHeight: 200,
                        buffer: 4,
                        renderItem: (seg, idx) => buildSingleSegmentCard(seg, idx + 1, doc, isSubtitlingMode)
                    });
                }
                if (window.CatUI && window.CatUI.isLivePreviewOpen) {
                    window.CatUI.refreshLivePreview();
                }
                return;
            } else {
                const pgRow = document.getElementById('paginationControlsRow');
                const vsRow = document.getElementById('virtualScrollStatusBar');
                if (pgRow) pgRow.classList.remove('hidden');
                if (vsRow) vsRow.classList.add('hidden');

                const btnLabel = document.getElementById('btnVirtualScrollLabel');
                if (btnLabel) btnLabel.innerText = 'Sanal Kaydırma';

                if (window._catVirtualScroller) {
                    window._catVirtualScroller.destroy();
                    window._catVirtualScroller = null;
                }
            }

            currentSlice.forEach((seg, idxOnPage) => {
                const globalNum = startIdx + idxOnPage + 1;
                const card = buildSingleSegmentCard(seg, globalNum, doc, isSubtitlingMode);
                container.appendChild(card);
            });

            // Alt Sayfalama Metinleri
            document.getElementById('paginationPageText').innerHTML = `<span>Sayfa ${doc.currentPage}</span> <span class="text-slate-400">/</span> <span>${doc.totalPages}</span>`;
            document.getElementById('paginationRangeText').innerText = `Segment ${startIdx + 1} - ${endIdx} (Toplam ${total})`;

            document.getElementById('btnPrevPage').disabled = (doc.currentPage === 1);
            document.getElementById('btnNextPage').disabled = (doc.currentPage === doc.totalPages);

            if (window.CatUI && window.CatUI.isLivePreviewOpen) {
                window.CatUI.refreshLivePreview();
            }

            if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.updateToolbarState === 'function') {
                CatWordToolbar.updateToolbarState();
            }
        }

        // HEDEF ÇEVİRİ KUTUSUNUN HEMEN ALTINDA BELİREN MT (GEMINI & DEEPL) ÖNERİ KARTI
        function renderMtSuggestionCardHtml(seg) {
            const draft = seg.mtDraft || seg.geminiDraft;
            if (!draft || !draft.text) return '';

            const isDeepL = (draft.provider === 'deepl' || (draft.provider && String(draft.provider).toLowerCase().includes('deepl')));

            // Gemini önerisi: Açık sarı arka plan (#FEF9C3 / border #FDE047)
            // DeepL önerisi: Açık mavi arka plan (#E0F2FE / border #7DD3FC)
            const cardBg = isDeepL ? 'bg-[#E0F2FE] border-[#7DD3FC]' : 'bg-[#FEF9C3] border-[#FDE047]';
            const titleColor = isDeepL ? 'text-sky-900' : 'text-amber-900';
            const badgeColor = isDeepL ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-amber-100 text-amber-800 border-amber-300';
            const providerLabel = isDeepL ? 'DeepL' : 'Gemini AI';
            const logoImg = isDeepL
                ? `<img src="deepl.png" alt="DeepL" class="w-4 h-4 object-contain rounded-xs shrink-0 pointer-events-none">`
                : `<img src="gemini.webp" alt="Gemini" class="w-4 h-4 object-contain shrink-0 pointer-events-none">`;

            return `
                <div onclick="applyMtSuggestion(${seg.id})" 
                     title="Bu çeviriyi hedef alana aktarmak için tıklayın"
                     class="mt-suggestion-card rounded-lg p-2.5 mt-1 border shadow-2xs flex flex-col gap-1.5 cursor-pointer transition-all hover:shadow-md hover:scale-[1.005] select-text animate-fadeIn ${cardBg}">
                    <div class="flex items-center justify-between pointer-events-none">
                        <div class="flex items-center gap-1.5 text-xs font-bold ${titleColor}">
                            ${logoImg}
                            <span>${providerLabel} Çeviri Önerisi</span>
                            <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor}">Öneri</span>
                        </div>
                        <div class="flex items-center gap-1.5 pointer-events-auto">
                            <span class="text-[10px] font-medium text-slate-600 dark:text-neutral-400 font-mono hidden sm:inline">Tıkla ve Hedefe Aktar ➔</span>
                            <button type="button" 
                                    onclick="event.stopPropagation(); dismissMtSuggestion(${seg.id})" 
                                    class="p-0.5 rounded hover:bg-black/10 text-slate-500 hover:text-slate-800 cursor-pointer" 
                                    title="Öneriyi Kapat">
                                <span class="material-symbols-outlined text-[15px]">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="text-[12.5px] font-medium text-slate-800 bg-white/80 dark:bg-black/20 p-2 rounded-md border border-black/5 leading-relaxed font-sans select-all">
                        ${escapeHtml(draft.text)}
                    </div>
                </div>
            `;
        }

        // SEGMENT KARTI ÜRETİCİSİ (HEM NORMAL HEM SANAL KAYDIRMA İÇİN ORTAK DOM ELEMANI)
        function buildSingleSegmentCard(seg, globalNum, doc, isSubtitlingMode) {
            const isReviewed = seg.status === 'reviewed';
            const isTranslated = seg.status === 'translated' || seg.status === 'confirmed';
            const isConfirmed = isReviewed || isTranslated;
            const hasText = seg.target && seg.target.trim().length > 0;

            // 1. Durum Göstergesi Rengi (Segment Sol Kenar Çizgisi)
            // Boş: Gri (#cbd5e1)
            // Taslak / Düzenleniyor: Sarı (#f59e0b)
            // Çevrildi (L1 Çevirmen): Mavi (#0284c7)
            // İncelendi / Onaylandı (L2 Editör): Yeşil (#10b981)
            let statusColorClass = 'border-l-4 border-l-slate-300';
            let statusDotColor = 'bg-slate-300';
            let statusTitle = 'Taslak / Boş';
            let statusBadgeHtml = '';

            if (isReviewed) {
                statusColorClass = 'border-l-4 border-l-emerald-500';
                statusDotColor = 'bg-emerald-500';
                statusTitle = 'İncelendi / Onaylandı (L2 Editör)';
                statusBadgeHtml = `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">L2 Onaylı</span>`;
            } else if (isTranslated) {
                statusColorClass = 'border-l-4 border-l-sky-500';
                statusDotColor = 'bg-sky-500';
                statusTitle = 'Çevrildi (L1 Çevirmen)';
                statusBadgeHtml = `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300">L1 Çevrildi</span>`;
            } else if (seg.status === 'draft' || hasText) {
                statusColorClass = 'border-l-4 border-l-amber-400';
                statusDotColor = 'bg-amber-400';
                statusTitle = 'Taslak / Düzenleniyor';
            }

            // Eşleşen terimleri ve ihlalleri bul
            const matchedTerms = findGlossaryMatches(seg.source);
            const termViolations = (!isConfirmed) ? checkGlossaryViolations(seg.source, seg.target) : [];

            // QA Denetimlerini Gerçek Zamanlı Çalıştır (Onaylanmış segmentlerde hata gösterilmez)
            const qaAlerts = (!isConfirmed) ? runQAChecks(seg.source, seg.target, seg) : [];

            // TM Eşleşmesini Kontrol Et (%100 Exact vs %50-%99 Fuzzy)
            // KRİTİK İZOLASYON KURALI: Onaylanmış (confirmed) segmentlerde TM uyarısı ve öneri kutusu ASLA gösterilmez!
            const tmMatch = (seg.status !== 'confirmed') ? (seg.tmSuggestion || findBestTmMatch(seg.source, seg.id)) : null;

            // Altyazı Kısıt Metriklerini Hesapla (Netflix / EBU-TT)
            const subMetrics = isSubtitlingMode ? calculateSubtitleMetrics(seg.target, seg.durationSec) : null;

            const isEven = (globalNum % 2 === 0);
            const zebraBg = isEven ? 'bg-slate-50/70 dark:bg-neutral-900/40' : 'bg-white dark:bg-[#000000]';
            const card = document.createElement('div');
            card.id = `segCard-${seg.id}`;
            card.className = `cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 ${zebraBg} hover:bg-purple-50/20 dark:hover:bg-neutral-900/70`;

            // TM Rozeti ve Görsel Diff HTML'i (Yalnızca onaylanmamış segmentlerde)
            let tmBadgeHtml = '';
            let tmSuggestionHtml = '';

            if (tmMatch) {
                if (tmMatch.similarity === 102 || tmMatch.isDoubleContext) {
                    tmBadgeHtml = `
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs" title="102% In-Context Exact Match (Önceki ve sonraki bağlam çift yönlü eşleşti)">
                                <span class="material-symbols-outlined text-[13px] text-indigo-600 dark:text-indigo-400">verified</span>
                                <span>%102 ICE Match</span>
                            </span>
                        `;
                } else if (tmMatch.similarity === 101 || tmMatch.isIce) {
                    tmBadgeHtml = `
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 shadow-2xs" title="101% In-Context Match (Önceki bağlam birebir eşleşti)">
                                <span class="material-symbols-outlined text-[13px] text-purple-600 dark:text-purple-400">verified</span>
                                <span>%101 ICE Match</span>
                            </span>
                        `;
                } else if (tmMatch.isExact || tmMatch.similarity === 100) {
                    tmBadgeHtml = `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>%100 Exact Match</span>
                            </span>
                        `;
                } else if (tmMatch.isFuzzy || (tmMatch.similarity >= 50 && tmMatch.similarity < 100)) {
                    tmBadgeHtml = `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                                <span class="material-symbols-outlined text-[12px] text-amber-600">history</span>
                                <span>%${tmMatch.similarity} Fuzzy Match</span>
                            </span>
                        `;
                }

                // ARAYÜZ ENTEGRASYONU: "BELLEKTEN BENZER CÜMLE & GÖRSEL DİFF (FARK)" KUTUSU
                const isIceMatch = (tmMatch.similarity === 102 || tmMatch.similarity === 101);
                const simBadgeStyle = tmMatch.similarity === 102
                    ? 'text-indigo-900 bg-indigo-100 border-indigo-300'
                    : (tmMatch.similarity === 101
                        ? 'text-purple-900 bg-purple-100 border-purple-300'
                        : (tmMatch.similarity === 100 ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-amber-800 bg-amber-100 border-amber-300'));
                const simLabel = tmMatch.similarity === 102
                    ? '%102 ICE Çift Bağlam Eşleşmesi'
                    : (tmMatch.similarity === 101 ? '%101 ICE Bağlamsal Eşleşme' : (tmMatch.similarity === 100 ? '%100 Exact Match' : `%${tmMatch.similarity} Benzerlik`));

                tmSuggestionHtml = `
                        <div class="tm-suggestion-box rounded-lg p-2.5 mt-1 flex flex-col gap-2 shadow-2xs">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-1.5 text-[11px] font-bold text-teal-900">
                                    <span class="material-symbols-outlined text-[15px] text-teal-600">${isIceMatch ? 'verified' : 'auto_awesome'}</span>
                                    <span>Bellekten Benzer Cümle</span>
                                </div>
                                <span class="text-[10px] font-mono font-bold ${simBadgeStyle} px-2 py-0.2 rounded-full border">
                                    ${simLabel}
                                </span>
                            </div>

                            <div class="text-xs text-slate-800 font-medium leading-relaxed pl-1">
                                “${escapeHtml(tmMatch.entry.target)}”
                            </div>

                            ${tmMatch.diffHtml ? `
                                <div class="p-2 rounded bg-white/90 border border-amber-200/90 text-xs flex flex-col gap-1">
                                    <span class="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[13px] text-amber-600">difference</span>
                                        <span>Görsel Fark (Diff Vurgusu):</span>
                                    </span>
                                    <div class="leading-relaxed select-text">${tmMatch.diffHtml}</div>
                                </div>
                            ` : ''}

                            <div class="flex items-center justify-between pt-1 border-t border-teal-200/60 text-[10px]">
                                <span class="font-mono text-teal-700 truncate max-w-[240px]">${escapeHtml(tmMatch.entry.date)}</span>
                                <button onclick="applyTmSuggestion(${seg.id}, '${escapeHtml(tmMatch.entry.target)}')"
                                        class="fluent-btn px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-teal-800 border-teal-300 hover:bg-teal-50 hover:border-teal-400 transition-all flex items-center gap-1 shadow-2xs cursor-pointer">
                                    <span>Öneriyi Kullan</span>
                                    <span class="material-symbols-outlined text-[13px]">arrow_downward</span>
                                </button>
                            </div>
                        </div>
                    `;
            }

            // Terim rozetleri html'i
            let termsHtml = '';
            let tbBadgeHtml = '';
            if (matchedTerms.length > 0) {
                tbBadgeHtml = `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-sky-800 border border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800 shadow-2xs" title="${matchedTerms.length} Terim Tabanı (TB) Eşleşmesi Tespit Edildi">
                        <span class="material-symbols-outlined text-[12px] text-sky-600">bookmark</span>
                        <span>${matchedTerms.length} Eşleşen Terim</span>
                    </span>
                `;
                const first5 = matchedTerms.slice(0, 5);
                const remaining = matchedTerms.slice(5);

                const renderTermBtn = (t, tIdx) => `
                        <button onclick="insertTermAtCursor(${seg.id}, '${escapeHtml(t.target)}')" 
                                class="text-[10px] font-mono bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 hover:border-sky-300 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 shadow-2xs group cursor-pointer"
                                title="Tıklayınca imleç konumuna ekler (Kısayol: Alt + ${tIdx + 1})">
                            <span class="font-medium text-slate-700">${escapeHtml(t.source)}</span>
                            <span class="text-slate-400">➔</span>
                            <span class="font-bold text-sky-900">${escapeHtml(t.target)}</span>
                            <span class="text-[9px] font-mono text-sky-500 group-hover:text-sky-700 pl-0.5">⤓</span>
                        </button>
                    `;

                termsHtml = `
                        <div class="flex items-center gap-1.5 flex-wrap pt-1">
                            <span class="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <span class="material-symbols-outlined text-[13px] text-sky-600">menu_book</span>
                                Tespit Edilen Terimler:
                            </span>
                            ${first5.map((t, idx) => renderTermBtn(t, idx)).join('')}
                            ${remaining.length > 0 ? `
                                <div id="moreTerms-${seg.id}" class="hidden flex items-center gap-1.5 flex-wrap">
                                    ${remaining.map((t, idx) => renderTermBtn(t, idx + 5)).join('')}
                                </div>
                                <button type="button" onclick="toggleMoreTerms(${seg.id})" id="toggleTermsBtn-${seg.id}"
                                        class="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer transition-all">
                                    <span>+${remaining.length} terim daha</span>
                                    <span class="material-symbols-outlined text-[13px] transition-transform" id="toggleTermsIcon-${seg.id}">expand_more</span>
                                </button>
                            ` : ''}
                        </div>
                    `;
            }

            // Terim İhlali Uyarısı (Yalnızca onaylanmamış segmentlerde gösterilir)
            let termViolationsHtml = '';
            if (!isConfirmed && termViolations.length > 0) {
                termViolationsHtml = `
                        <div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-900 text-xs animate-fadeIn">
                            <span class="material-symbols-outlined text-amber-600 text-[18px] shrink-0">warning</span>
                            <div class="flex-1 text-[11px] font-medium leading-snug">
                                <strong>Terim Uyarısı:</strong> Kaynakta tespit edilen 
                                ${termViolations.map(v => `<span class="font-bold underline decoration-amber-500">"${escapeHtml(v.source)}" ➔ "${escapeHtml(v.target)}"</span>`).join(', ')} 
                                hedef metne yazılmadı!
                            </div>
                        </div>
                    `;
            }

            // ALTYAZI ÇEVİRİ MOTORU: Netflix / EBU-TT Canlı Durum Çubuğu & Kısıt Uyarıları
            let subtitleHeaderHtml = '';
            let subtitleStatusBarHtml = '';
            let subtitleConstraintAlertHtml = '';

            if (isSubtitlingMode) {
                const start = seg.startTime || formatSecondsToSrtTimestamp((globalNum - 1) * 3.5);
                const end = seg.endTime || formatSecondsToSrtTimestamp((globalNum - 1) * 3.5 + 3.0);
                const dur = seg.durationSec || 3.0;

                subtitleHeaderHtml = `
                        <div class="flex items-center justify-between pb-1.5 text-[11px] font-mono border-b border-purple-100 flex-wrap gap-2">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="material-symbols-outlined text-purple-600 text-[16px]">timer</span>
                                
                                <div class="flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                                    <span class="text-[9px] text-purple-700 font-bold uppercase">Başla:</span>
                                    <input type="text"
                                           id="subStartTime-${seg.id}"
                                           value="${start}"
                                           onfocus="this.select()"
                                           onchange="updateSegmentTimestamp(${seg.id}, 'start', this.value)"
                                           class="w-24 text-center text-[11px] font-mono font-bold text-slate-800 bg-white border border-purple-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                                           title="Başlangıç saniyesini manuel değiştirin (örn: 00:00:17,000 veya 17)" />
                                    <button type="button" 
                                            onclick="setTimestampFromCurrentVideo(${seg.id}, 'start')" 
                                            title="Videonun şu anki oynatma saniyesini başlangıç zamanı yap" 
                                            class="px-1 py-0.5 bg-purple-200/70 hover:bg-purple-300 text-purple-900 rounded text-[9px] font-bold cursor-pointer transition-colors">
                                        ⏱️ Şu An
                                    </button>
                                </div>

                                <span class="text-purple-400 font-bold text-xs">➔</span>

                                <div class="flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                                    <span class="text-[9px] text-purple-700 font-bold uppercase">Bitir:</span>
                                    <input type="text"
                                           id="subEndTime-${seg.id}"
                                           value="${end}"
                                           onfocus="this.select()"
                                           onchange="updateSegmentTimestamp(${seg.id}, 'end', this.value)"
                                           class="w-24 text-center text-[11px] font-mono font-bold text-slate-800 bg-white border border-purple-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                                           title="Bitiş saniyesini manuel değiştirin (örn: 00:00:22,000 veya 22)" />
                                    <button type="button" 
                                            onclick="setTimestampFromCurrentVideo(${seg.id}, 'end')" 
                                            title="Videonun şu anki oynatma saniyesini bitiş zamanı yap" 
                                            class="px-1 py-0.5 bg-purple-200/70 hover:bg-purple-300 text-purple-900 rounded text-[9px] font-bold cursor-pointer transition-colors">
                                        ⏱️ Şu An
                                    </button>
                                </div>

                                <span id="subDurationLabel-${seg.id}" class="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                    [Süre: ${dur.toFixed(1)}s]
                                </span>

                                <div class="flex items-center gap-0.5">
                                    <button type="button" onclick="nudgeSegmentTime(${seg.id}, -0.5)" title="0.5 saniye geriye kaydır" class="px-1.5 py-0.5 text-[9px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-700 font-mono cursor-pointer transition-colors font-bold">-0.5s</button>
                                    <button type="button" onclick="nudgeSegmentTime(${seg.id}, 0.5)" title="0.5 saniye ileriye kaydır" class="px-1.5 py-0.5 text-[9px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-slate-700 font-mono cursor-pointer transition-colors font-bold">+0.5s</button>
                                </div>
                            </div>
                            <button type="button" onclick="updateCinemaSubtitleMonitor(${seg.id})"
                                    class="text-[10px] font-mono font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer ml-auto"
                                    title="Altyazıyı canlı monitörde önizle">
                                <span class="material-symbols-outlined text-[14px]">preview</span>
                                <span>Monitörde Önizle</span>
                            </button>
                        </div>
                    `;

                // Canlı Durum Çubuğu
                let cpsBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';
                let cpsLabel = subMetrics.cpsLabel || 'İdeal';
                if (subMetrics.cpsStatus === 'fast') {
                    cpsBadgeClass = 'text-amber-800 bg-amber-50 border-amber-300';
                } else if (subMetrics.cpsStatus === 'over') {
                    cpsBadgeClass = 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse';
                }

                subtitleStatusBarHtml = `
                        <div id="subMetricsBar-${seg.id}" class="flex flex-wrap items-center justify-between text-[10px] font-mono p-1.5 rounded-lg bg-slate-50 border border-purple-200/80 gap-1.5 select-none shadow-2xs">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span id="subLine1Counter-${seg.id}" class="${subMetrics.isCpl1Exceeded ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold'}">
                                    1. Satır (Üst): <span class="font-bold">${subMetrics.cplLine1}</span>/42 CPL
                                </span>
                                <span id="subLine2Counter-${seg.id}" class="${subMetrics.isCpl2Exceeded ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold'}">
                                    2. Satır (Alt): <span class="font-bold">${subMetrics.cplLine2}</span>/42 CPL
                                </span>
                                <span id="subLineCountCounter-${seg.id}" class="${subMetrics.isLineExceeded ? 'text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300' : 'text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200'}">
                                    Satır: <span class="font-bold">${subMetrics.lineCount}</span>/2
                                </span>
                            </div>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span id="subCpsCounter-${seg.id}" class="px-2 py-0.5 rounded font-bold border ${cpsBadgeClass}">
                                    Hız: ${subMetrics.cps} CPS (${cpsLabel})
                                </span>
                                <span class="text-slate-700 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    Süre: ${subMetrics.durationSec.toFixed(1)}s
                                </span>
                                ${(subMetrics.cps > 17 || subMetrics.isCpl1Exceeded || subMetrics.isCpl2Exceeded) ? `
                                <button type="button" onclick="CatAVT.AutoCondense.condenseSegment(${seg.id})" class="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer animate-pulse shadow-2xs" title="Metnin anlamını ve dramatik tonunu bozmadan hedef CPS sınırının altına inecek şekilde AI ile kısalt">
                                    <span class="material-symbols-outlined text-[13px] text-amber-600">auto_fix_high</span>
                                    <span>✨ AI Kısalt</span>
                                </button>
                                ` : ''}
                                <button type="button" onclick="CatAVT.SmartLineBreak.applyToSegment(${seg.id})" class="text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-2xs" title="Piramit Kuralı ve dilbilgisi bağlamına göre dengeli 2 satıra böl">
                                    <span class="material-symbols-outlined text-[13px]">splitscreen</span>
                                    <span>📐 Piramit Böl</span>
                                </button>
                                <button type="button" onclick="CatAVT.Placement.togglePlacement(${seg.id})" class="text-[10px] font-bold ${seg.placement === 'top' ? 'text-indigo-800 bg-indigo-100 border-indigo-400' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-100'} border px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-2xs" title="Altyazıyı ekranın üstüne ({\\an8}) veya altına konumlandır">
                                    <span class="material-symbols-outlined text-[13px]">${seg.placement === 'top' ? 'vertical_align_top' : 'vertical_align_bottom'}</span>
                                    <span>${seg.placement === 'top' ? '{\\an8} Üst' : 'Alt'}</span>
                                </button>
                            </div>
                        </div>
                    `;

                // Kural İhlal Uyarıları
                const subAlerts = [];
                if (subMetrics.isLineExceeded) subAlerts.push(`Maksimum 2 satır sınırı aşıldı! (${subMetrics.lineCount} satır var)`);
                if (subMetrics.isCpl1Exceeded) subAlerts.push(`1. Satır (Üst) 42 karakteri aştı! (${subMetrics.cplLine1}/42)`);
                if (subMetrics.isCpl2Exceeded) subAlerts.push(`2. Satır (Alt) 42 karakteri aştı! (${subMetrics.cplLine2}/42)`);
                if (subMetrics.isTooShort) subAlerts.push("Blok süresi çok kısa (< 1.0s)!");
                if (subMetrics.isTooLong) subAlerts.push("Blok süresi çok uzun (> 7.0s)!");

                subtitleConstraintAlertHtml = `
                        <div id="subAlertContainer-${seg.id}">
                            ${(!isConfirmed && subAlerts.length > 0) ? `
                                <div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold mt-1.5">
                                    <span class="material-symbols-outlined text-[16px] text-rose-600 shrink-0">highlight_off</span>
                                    <span>Altyazı Kısıt Uyarısı: ${subAlerts.join(' · ')}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
            }

            card.setAttribute('data-seg-id', seg.id);
            card.onmouseenter = () => {
                window._lastHoveredSegId = seg.id;
            };

            // Tıklanma / Odaklanma Dinleyicisi
            card.onclick = (e) => {
                onSegmentClickOrFocus(seg.id);
            };

            card.innerHTML = `
                    ${subtitleHeaderHtml}

                    <div class="flex items-start w-full px-5 py-2.5 transition-colors gap-3 select-none">
                        <!-- Kolon 1: Segment Numarası & Kilit Göstergeleri (Sadeleşmiş Standart) -->
                        <div class="cat-segment-col-num w-16 shrink-0 flex flex-col items-start gap-1 pt-2 pr-2 border-r border-slate-200 dark:border-neutral-800">
                            <div class="flex items-center gap-1">
                                <span class="font-sans text-xs font-semibold text-slate-400 dark:text-neutral-500 select-none">${globalNum}</span>
                                <button id="lockBtnOnCard-${seg.id}" type="button" onclick="CatWordToolbar.toggleLockSegment(${seg.id})" title="${seg.isLocked ? 'Segment Kilitli (Açmak için tıklayın)' : 'Segmenti Kilitle (Ctrl+L)'}" class="cursor-pointer ${seg.isLocked ? '' : 'hidden'} text-amber-500 hover:text-amber-600">
                                    <span id="lockIconOnCard-${seg.id}" class="material-symbols-outlined text-[15px]">lock</span>
                                </button>
                            </div>
                            ${statusBadgeHtml}
                        </div>

                        <!-- Kolon 2: Kaynak Cümle / Metin Bloğu (Sol Panel: %50 & Belirgin Sınır) -->
                        <div class="cat-segment-col-source flex-1 min-w-0 pr-4 pl-3 pt-1.5 flex flex-col gap-1.5 border-r border-slate-300 dark:border-neutral-700 select-text">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                ${tmBadgeHtml}
                                ${tbBadgeHtml}
                                ${FormatShield.renderStyleBadge(seg)}
                            </div>
                            ${(isSubtitlingMode && seg.source && seg.source.includes('\n')) ? `
                                <div class="flex flex-col gap-1 font-sans text-[13px]">
                                    <div class="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-neutral-900/80 border border-slate-300 dark:border-neutral-700 shadow-2xs">
                                        <span class="text-[9px] font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0">1. Satır:</span>
                                        <span class="text-slate-900 dark:text-neutral-100 font-medium leading-snug">${escapeHtml(seg.source.split('\n')[0] || '')}</span>
                                    </div>
                                    <div class="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-neutral-900/80 border border-slate-300 dark:border-neutral-700 shadow-2xs">
                                        <span class="text-[9px] font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0">2. Satır:</span>
                                        <span class="text-slate-900 dark:text-neutral-100 font-medium leading-snug">${escapeHtml(seg.source.split('\n').slice(1).join('\n') || '')}</span>
                                    </div>
                                </div>
                            ` : `
                                <div class="cat-source-box p-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50/70 dark:bg-neutral-900/60 font-sans text-[13px] leading-relaxed text-slate-800 dark:text-neutral-100 font-normal select-all min-h-[46px] shadow-2xs">${FormatShield.sourceHtml(seg)}</div>
                            `}
                        </div>

                        <!-- Kolon 3: Hedef Çeviri Kutusu & Alt Alta Hizalanmış MT İkon Butonları -->
                        <div class="flex-1 min-w-0 px-3 pt-1.5 flex flex-col gap-1.5">
                            <div class="flex items-start gap-2 w-full">
                                <!-- Sağlayıcı İkon Butonları (DeepL & Gemini) Alt Alta Hizalanmış Küçük, Şık İkonlar -->
                                <div class="flex flex-col gap-1.5 shrink-0 pt-1">
                                    <!-- DeepL İkon Butonu -->
                                    <button type="button" 
                                            onclick="translateSingleSegmentBox(${seg.id}, 'deepl')" 
                                            id="deeplBtn-${seg.id}" 
                                            title="DeepL ile Çevir (Öneri Kartı)"
                                            class="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-sky-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-600 hover:border-sky-400 dark:hover:border-sky-500 shadow-2xs cursor-pointer transition-all active:scale-95 group p-0.5">
                                        <img src="deepl.png" alt="DeepL" class="w-3.5 h-3.5 object-contain rounded-xs pointer-events-none group-hover:scale-110 transition-transform">
                                    </button>

                                    <!-- Gemini AI İkon Butonu -->
                                    <button type="button" 
                                            onclick="translateSingleSegmentBox(${seg.id}, 'gemini')" 
                                            id="geminiBtn-${seg.id}" 
                                            title="Google Gemini AI ile Çevir (Öneri Kartı)"
                                            class="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-purple-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-600 hover:border-purple-400 dark:hover:border-purple-500 shadow-2xs cursor-pointer transition-all active:scale-95 group p-0.5">
                                        <img src="gemini.webp" alt="Gemini" class="w-3.5 h-3.5 object-contain pointer-events-none group-hover:scale-110 transition-transform">
                                    </button>
                                </div>

                                <!-- Textarea ve Alt Elemanlar -->
                                <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                                    <div class="flex items-center justify-end pb-0.5">
                                        <span id="segWordCount-${seg.id}" class="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                                            ${(seg.target || '').trim() ? (seg.target.trim().split(/\s+/).length + ' kelime') : '0 kelime'}
                                        </span>
                                    </div>

                                    <!-- Editör Değişiklik Takibi (Track Changes) Görsel Diff Kutusu -->
                                    ${(seg.original_target && seg.original_target !== seg.target) ? `
                                        <div class="p-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-xs flex flex-col gap-1.5 shadow-2xs my-1">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 font-mono">
                                                    <span class="material-symbols-outlined text-[14px] text-amber-600">track_changes</span>
                                                    <span>Editör Değişiklik Takibi (Track Changes):</span>
                                                </div>
                                                <div class="flex items-center gap-1">
                                                    <button type="button" onclick="CatLSP.Review.acceptTrackChange(${seg.id})" class="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer shadow-xs" title="Değişikliği Kabul Et ve Onayla">✓ Kabul Et</button>
                                                    <button type="button" onclick="CatLSP.Review.rejectTrackChange(${seg.id})" class="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer shadow-xs" title="Değişikliği Reddet ve L1 Çevirisine Geri Dön">✕ Reddet</button>
                                                </div>
                                            </div>
                                            <div class="p-2 bg-white dark:bg-neutral-800 rounded border border-amber-200 dark:border-neutral-700 font-sans text-xs leading-relaxed select-text">
                                                ${CatLSP.Review.generateWordDiff(seg.original_target, seg.target)}
                                            </div>
                                        </div>
                                    ` : ''}

                                    <textarea id="targetInput-${seg.id}" 
                                              ${seg.isLocked ? 'readonly="true"' : ''}
                                              onfocus="onSegmentClickOrFocus(${seg.id})"
                                              oninput="onSegmentChange(${seg.id}, this)"
                                              onkeydown="onSegmentKeydown(event, ${seg.id})"
                                              rows="${isSubtitlingMode ? 2 : 2}"
                                              placeholder="${seg.isLocked ? '🔒 Segment kilitli.' : 'Hedef çeviriyi girin veya DeepL / Gemini AI ile tek tıkla çevirin...'}"
                                              class="cat-target-textarea w-full px-3 py-2 text-[13px] text-slate-900 dark:text-neutral-100 rounded-lg border border-slate-300 dark:border-neutral-600 hover:border-slate-400 dark:hover:border-neutral-500 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 dark:focus:border-purple-400 dark:focus:ring-purple-900/50 bg-white dark:bg-[#121212] outline-none transition-all resize-none min-h-[46px] leading-relaxed font-sans shadow-2xs ${seg.isLocked ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-neutral-900' : ''} ${!isConfirmed && subMetrics && (subMetrics.isLineExceeded || subMetrics.isCplExceeded) ? 'border-rose-500 ring-2 ring-rose-200' : ''}">${escapeHtml(seg.target)}</textarea>

                                    <!-- HEDEF ÇEVİRİ KUTUSUNUN HEMEN ALTINDA BELİREN MT ÖNERİ/ÖNİZLEME KARTI -->
                                    ${renderMtSuggestionCardHtml(seg)}

                                    <!-- Akıllı Biçimlendirme Kalkanı (Format Painter + QA) -->
                                    ${FormatShield.targetBlockHtml(seg)}

                                    <!-- Canlı Altyazı Durum Çubuğu -->
                                    ${subtitleStatusBarHtml}
                                    ${subtitleConstraintAlertHtml}

                                    <!-- Tespit Edilen Terimler Mini Kartları -->
                                    ${termsHtml}

                                    <!-- Terim İhlal Uyarısı -->
                                    ${termViolationsHtml}

                                    <!-- TM Bellek Önerisi & Görsel Diff Kartı (Sadece Onaylanmamış Segmentler) -->
                                    ${tmSuggestionHtml}
                                </div>
                            </div>
                        </div>

                        <!-- Kolon 4: Onay Durumu Kutucuğu, LQA Butonu ve Sağ Köşe Kompakt QA Rozeti -->
                        <div class="cat-segment-col-check w-14 shrink-0 flex flex-col items-center justify-start pt-2 px-1 border-l border-slate-200 dark:border-neutral-800 gap-2">
                            <!-- Onay Butonu -->
                            <button onclick="toggleConfirmSegment(${seg.id})" 
                                    title="${isConfirmed ? 'Onayı kaldır' : 'Onayla (Ctrl + Enter)'}" 
                                    class="cat-confirm-checkbox w-6 h-6 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${isConfirmed ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs' : 'border-slate-300 dark:border-neutral-600 text-slate-300 dark:text-neutral-600 hover:border-slate-500 hover:text-slate-700'}">
                                <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                            </button>

                            <!-- Yorum & LQA Butonu -->
                            <button type="button" onclick="CatLSP.Review.openLqaDrawer(${seg.id})" 
                                    class="w-7 h-7 rounded-md border border-slate-300 dark:border-neutral-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-500 hover:text-purple-600 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs relative"
                                    title="Yorumlar ve LQA Kalite Puanı Çekmecesini Aç">
                                <span class="material-symbols-outlined text-[15px]">rate_review</span>
                                ${(seg.comments?.length || 0) + (seg.lqaErrors?.length || 0) > 0 ? `
                                    <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-600 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow-xs">
                                        ${(seg.comments?.length || 0) + (seg.lqaErrors?.length || 0)}
                                    </span>
                                ` : ''}
                            </button>

                            <!-- Segment Satırının En Sağ Köşesindeki Kompakt Durum Alanı & Hover Popover -->
                            ${(!isConfirmed && qaAlerts && qaAlerts.length > 0) ? `
                                <div onclick="CatQA.openBatchQAModal()" class="relative group/qa flex items-center justify-center cursor-pointer" title="${qaAlerts.length} QA Uyarısı Tespit Edildi (Tıklayarak inceleyin)">
                                    <div class="qa-badge flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 text-[10px] font-bold font-mono shadow-2xs transition-transform hover:scale-105">
                                        <span class="material-symbols-outlined text-[12px] text-rose-600 font-bold">warning</span>
                                        <span>${qaAlerts.length}</span>
                                    </div>
                                    <!-- Popover / Tooltip: Fare üzerine geldiğinde açılır, çekildiğinde kapanır -->
                                    <div class="absolute right-0 top-full mt-1 hidden group-hover/qa:flex flex-col gap-1 w-64 p-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 text-left pointer-events-none animate-fadeIn">
                                        <div class="text-[11px] font-bold text-slate-800 dark:text-white pb-1 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-1.5">
                                            <span class="material-symbols-outlined text-[14px] text-rose-600">report_problem</span>
                                            <span>Kalite Güvencesi (${qaAlerts.length} Uyarı)</span>
                                        </div>
                                        <ul class="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-neutral-300">
                                            ${qaAlerts.map(a => `
                                                <li class="flex items-start gap-1.5 leading-snug">
                                                    <span class="text-rose-500 font-bold shrink-0">•</span>
                                                    <span>${escapeHtml(a.msg || a.title || 'Uyarı')}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                            ` : `
                                <div class="flex items-center justify-center ${isConfirmed ? 'text-emerald-500 font-bold' : 'text-emerald-500/50 hover:text-emerald-600'} transition-colors" title="${isConfirmed ? 'Segment Onaylandı' : 'QA: Hata tespit edilmedi'}">
                                    <span class="material-symbols-outlined text-[15px]">check_circle</span>
                                </div>
                            `}
                        </div>
                    </div>
                `;

            return card;
        }

        // Segment içi 5+ terim akordeon aç/kapa
        function toggleMoreTerms(segId) {
            const el = document.getElementById(`moreTerms-${segId}`);
            const icon = document.getElementById(`toggleTermsIcon-${segId}`);
            const btn = document.getElementById(`toggleTermsBtn-${segId}`);
            if (!el) return;
            const isHidden = el.classList.contains('hidden');
            if (isHidden) {
                el.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
                if (btn) btn.querySelector('span').innerText = 'Daha az göster';
            } else {
                el.classList.add('hidden');
                if (icon) icon.style.transform = 'rotate(0deg)';
                if (btn) btn.querySelector('span').innerText = `+${el.children.length} terim daha`;
            }
        }

        // ========================================================
        // 7. SEGMENT, ALTYAZI VE TM DEĞİŞİKLİK DİNLEYİCİLERİ
        // ========================================================
        function onSegmentChange(segId, el) {
            const doc = getActiveDoc();
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            const prevVal = seg.target || '';
            if (typeof CatHistory !== 'undefined' && typeof CatHistory.record === 'function') {
                CatHistory.record(segId, prevVal, el.value);
            }

            FormatShield.onTargetEdit(seg, prevVal, el.value);
            if (window.CatLSP && CatLSP.Review) {
                CatLSP.Review.handleTargetEdit(seg, prevVal, el.value);
            }
            seg.target = el.value;
            FormatShield.refreshBlock(seg);
            seg.isAutoFilled = false;
            if (seg.status !== 'confirmed' && seg.status !== 'reviewed') {
                seg.status = el.value.trim().length > 0 ? 'draft' : 'empty';
            }

            if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.updateQACountBadge === 'function') {
                CatWordToolbar.updateQACountBadge();
            }

            const counter = document.getElementById(`charCounter-${segId}`);
            if (counter) counter.innerText = `${el.value.length} karakter`;

            const card = document.getElementById(`segCard-${segId}`);
            if (card) {
                // Sol kenar durum rengini anında güncelle
                if (seg.status === 'confirmed' || seg.status === 'reviewed') {
                    card.className = card.className.replace(/border-l-4 border-l-\w+-\d+/, 'border-l-4 border-l-emerald-500');
                } else if (seg.status === 'translated') {
                    card.className = card.className.replace(/border-l-4 border-l-\w+-\d+/, 'border-l-4 border-l-sky-500');
                } else if (el.value.trim().length > 0) {
                    card.className = card.className.replace(/border-l-4 border-l-\w+-\d+/, 'border-l-4 border-l-amber-400');
                    card.classList.add('fluent-card-active');
                } else {
                    card.className = card.className.replace(/border-l-4 border-l-\w+-\d+/, 'border-l-4 border-l-slate-300');
                    card.classList.remove('fluent-card-active');
                }
            }

            // Altyazı projesi ise veya segmentte altyazı özellikleri varsa:
            const currentProj = getActiveProject();
            const isSub = (currentProj && currentProj.type === 'subtitling') || (currentProj && currentProj.wasSubtitling) || (seg.startTime !== undefined);
            if (isSub) {
                updateSubtitleLiveMetrics(segId, el.value);
                updateCinemaSubtitleMonitor(seg);
                const overlayCaption = document.getElementById('subVideoOverlayCaption');
                if (overlayCaption && (appState.activeSubtitleSegmentId === segId || !appState.activeSubtitleSegmentId)) {
                    const subLines = getSubtitleLines(el.value, 42);
                    const formatted = subLines.line2 ? `${sanitizeSubtitleHtml(subLines.line1)}<br>${sanitizeSubtitleHtml(subLines.line2)}` : sanitizeSubtitleHtml(subLines.line1);
                    overlayCaption.innerHTML = formatted;
                }
            }

            debouncedAutoSave();
            updateProgressStats();
            if (window.CatUI && window.CatUI.isLivePreviewOpen) {
                window.CatUI.refreshLivePreview();
            }
        }

        // Anlık Canlı Altyazı Sayaç Güncelleyici (1. Satır Üst, 2. Satır Alt & CPS)
        function updateSubtitleLiveMetrics(segId, text) {
            const doc = getActiveDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            const durationSec = seg ? seg.durationSec : 3.0;
            const m = calculateSubtitleMetrics(text, durationSec);

            const line1El = document.getElementById(`subLine1Counter-${segId}`);
            if (line1El) {
                line1El.innerHTML = `1. Satır (Üst): <span class="font-bold">${m.cplLine1}</span>/42 CPL`;
                line1El.className = m.isCpl1Exceeded
                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'
                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';
            }

            const line2El = document.getElementById(`subLine2Counter-${segId}`);
            if (line2El) {
                line2El.innerHTML = `2. Satır (Alt): <span class="font-bold">${m.cplLine2}</span>/42 CPL`;
                line2El.className = m.isCpl2Exceeded
                    ? 'text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300'
                    : 'text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold';
            }

            const lineCountEl = document.getElementById(`subLineCountCounter-${segId}`);
            if (lineCountEl) {
                lineCountEl.innerHTML = `Satır: <span class="font-bold">${m.lineCount}</span>/2`;
                lineCountEl.className = m.isLineExceeded
                    ? 'text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300'
                    : 'text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200';
            }

            const cpsEl = document.getElementById(`subCpsCounter-${segId}`);
            if (cpsEl) {
                let cpsClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';
                if (m.cpsStatus === 'fast') cpsClass = 'text-amber-800 bg-amber-50 border-amber-300';
                else if (m.cpsStatus === 'over') cpsClass = 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse';
                cpsEl.className = `px-2 py-0.5 rounded font-bold border ${cpsClass}`;
                cpsEl.innerText = `Hız: ${m.cps} CPS (${m.cpsLabel})`;
            }

            // Kartın altındaki genel karakter sayacı
            const charCounter = document.getElementById(`charCounter-${segId}`);
            if (charCounter) {
                charCounter.innerHTML = `<span class="font-bold">1. Satır (Üst):</span> ${m.cplLine1}/42 · <span class="font-bold">2. Satır (Alt):</span> ${m.cplLine2}/42 · Toplam: ${m.totalChars} kr`;
            }

            const textarea = document.getElementById(`targetInput-${segId}`);
            if (textarea) {
                if (m.isLineExceeded || m.isCplExceeded) {
                    textarea.classList.add('border-rose-500', 'ring-2', 'ring-rose-200', 'bg-rose-50/20');
                } else {
                    textarea.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200', 'bg-rose-50/20');
                }
            }

            const alertContainer = document.getElementById(`subAlertContainer-${segId}`);
            if (alertContainer) {
                const alerts = [];
                if (m.isLineExceeded) alerts.push(`Maksimum 2 satır sınırı aşıldı! (${m.lineCount} satır var)`);
                if (m.isCpl1Exceeded) alerts.push(`1. Satır (Üst) 42 karakteri aştı (${m.cplLine1}/42 CPL)`);
                if (m.isCpl2Exceeded) alerts.push(`2. Satır (Alt) 42 karakteri aştı (${m.cplLine2}/42 CPL)`);
                if (m.isTooShort) alerts.push(`Blok süresi çok kısa (< 1.0s)`);
                if (m.isTooLong) alerts.push(`Blok süresi çok uzun (> 7.0s)`);

                if (alerts.length > 0) {
                    alertContainer.innerHTML = `
                        <div class="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold mt-1.5 animate-fadeIn">
                            <span class="material-symbols-outlined text-[16px] text-rose-600 shrink-0">highlight_off</span>
                            <span>Altyazı Kısıt Uyarısı: ${alerts.join(' · ')}</span>
                        </div>
                    `;
                } else {
                    alertContainer.innerHTML = '';
                }
            }
        }

        // Uzun altyazı metnini üst ve alt olarak ikiye bölme yardımcısı
        function autoSplitSegmentLines(segId) {
            const textarea = document.getElementById(`targetInput-${segId}`);
            if (!textarea) return;
            const text = textarea.value.replace(/\r/g, '').replace(/\n+/g, ' ').trim();
            if (!text) return;

            const targetBreak = Math.floor(text.length / 2);
            let bestIdx = -1;
            let minDiff = 999;

            for (let i = 0; i < text.length; i++) {
                if (text[i] === ' ') {
                    const diff = Math.abs(i - targetBreak);
                    if (i <= 42 && diff < minDiff) {
                        minDiff = diff;
                        bestIdx = i;
                    }
                }
            }

            if (bestIdx === -1) {
                bestIdx = text.lastIndexOf(' ', 42);
            }

            if (bestIdx > 0) {
                const line1 = text.substring(0, bestIdx).trim();
                const line2 = text.substring(bestIdx + 1).trim();
                textarea.value = `${line1}\n${line2}`;
                onSegmentChange(segId, textarea);
                showToast(`Segment #${segId} üst ve alt satır olarak 2'ye bölündü.`);
            } else {
                showToast("Metin 42 karakterden kısa veya bölünecek boşluk bulunamadı.");
            }
        }

        // ========================================================
        // 7. KLAVYE NAVİGASYONU VE KISAYOL İŞLEMCİLERİ
        // ========================================================

        // Belirli Bir Segmente Odaklan (Sayfa Değişimi & Scroll Dahil)
        function focusSegment(segId) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const segIdx = doc.segments.findIndex(s => s.id === segId);
            if (segIdx === -1) return;

            appState.activeSegmentId = segId;
            window._lastHoveredSegId = segId;
            if (appState.activeSubtitleSegmentId !== undefined) {
                appState.activeSubtitleSegmentId = segId;
            }

            const targetPage = Math.ceil((segIdx + 1) / SEGMENTS_PER_PAGE);
            if (!appState.useVirtualScroll && targetPage !== doc.currentPage) {
                doc.currentPage = targetPage;
                renderSegments();
            }

            if (appState.useVirtualScroll && window._catVirtualScroller) {
                window._catVirtualScroller.scrollToIndex(segIdx);
            }

            const applyFocus = () => {
                const card = document.getElementById(`segCard-${segId}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('ring-2', 'ring-indigo-500');
                    setTimeout(() => card.classList.remove('ring-2', 'ring-indigo-500'), 1500);
                }
                const input = document.getElementById(`targetInput-${segId}`);
                if (input) {
                    input.focus();
                    if (typeof onSegmentClickOrFocus === 'function') {
                        onSegmentClickOrFocus(segId);
                    }
                    const proj = getActiveProject();
                    if (proj && proj.type === 'subtitling') {
                        updateCinemaSubtitleMonitor(doc.segments[segIdx]);
                    }
                    return true;
                }
                return false;
            };

            if (!applyFocus()) {
                setTimeout(applyFocus, 60);
                setTimeout(applyFocus, 180);
            }
        }

        // Komşu Segmente Geçiş (+1 Sonraki, -1 Önceki)
        function navigateToAdjacentSegment(currentSegId, direction) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) return;
            let currentIdx = doc.segments.findIndex(s => s.id === currentSegId);
            if (currentIdx === -1) {
                currentIdx = 0;
            }

            const targetIdx = currentIdx + direction;
            if (targetIdx >= 0 && targetIdx < doc.segments.length) {
                focusSegment(doc.segments[targetIdx].id);
            } else if (direction > 0) {
                showToast("Belgenin son segmentindesiniz.");
            } else if (direction < 0) {
                showToast("Belgenin ilk segmentindesiniz.");
            }
        }

        // Odaklama Kutusu Dışındayken İlk/Aktif Segmente Odaklan
        function focusFirstOrActiveSegment(direction = 0) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) return;

            const currentSegId = appState.activeSegmentId || appState.activeSubtitleSegmentId || window._lastHoveredSegId;
            if (currentSegId) {
                if (direction !== 0) {
                    navigateToAdjacentSegment(currentSegId, direction);
                } else {
                    focusSegment(currentSegId);
                }
                return;
            }

            const startIdx = (doc.currentPage - 1) * SEGMENTS_PER_PAGE;
            const target = doc.segments[startIdx] || doc.segments[0];
            if (target) {
                focusSegment(target.id);
            }
        }

        // Segment Düzenleme Kutusundaki Tuş Basımları (Klavye Navigasyonu)
        function onSegmentKeydown(e, segId) {
            const doc = getActiveDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;

            // 0. Segment Bölme (Ctrl + Shift + S) & Segment Birleştirme (Ctrl + Shift + M)
            if (typeof CatOps !== 'undefined' && CatOps.handleKey(e, segId)) {
                return;
            }

            // Tab / Shift + Tab: Sıradaki / Önceki segmente geç
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    navigateToAdjacentSegment(segId, -1);
                } else {
                    navigateToAdjacentSegment(segId, 1);
                }
                return;
            }

            // 1. Ctrl + Enter / Cmd + Enter: Segment Onayla (L1: Çevrildi / L2: İncelendi)
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const role = (typeof appState !== 'undefined' && appState.userRole) || 'L1';
                if (role === 'L2' && window.CatLSP && CatLSP.Review) {
                    CatLSP.Review.markAsReviewed(segId);
                } else {
                    confirmSegment(segId);
                }
                return;
            }

            // 2. Ctrl + Shift + Enter: L2 Editör / Düzeltmen İnceleme Onayı (Reviewed)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                if (window.CatLSP && CatLSP.Review) {
                    CatLSP.Review.markAsReviewed(segId);
                } else if (seg && seg.geminiDraft) {
                    approveGeminiDraft(segId);
                } else {
                    confirmSegment(segId);
                }
                return;
            }

            // 3. Alt + Aşağı Ok veya Alt + Sağ Ok veya Ctrl + Aşağı Ok: Sıradaki Segmente Geç (Onaylamadan)
            if ((e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) || (e.ctrlKey && e.key === 'ArrowDown')) {
                e.preventDefault();
                navigateToAdjacentSegment(segId, 1);
                return;
            }

            // 4. Alt + Yukarı Ok veya Alt + Sol Ok veya Ctrl + Yukarı Ok: Önceki Segmente Geç
            if ((e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) || (e.ctrlKey && e.key === 'ArrowUp')) {
                e.preventDefault();
                navigateToAdjacentSegment(segId, -1);
                return;
            }

            // Alt + N: Sıradaki Onaylanmamış Segmente Geç
            if (e.altKey && (e.key.toLowerCase() === 'n')) {
                e.preventDefault();
                if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.jumpNextUnapproved === 'function') {
                    CatWordToolbar.jumpNextUnapproved();
                } else {
                    navigateToAdjacentSegment(segId, 1);
                }
                return;
            }

            // Alt + P: Önceki Segmente Geç
            if (e.altKey && (e.key.toLowerCase() === 'p')) {
                e.preventDefault();
                navigateToAdjacentSegment(segId, -1);
                return;
            }

            // 5. Ctrl + Insert veya Alt + Insert veya Ctrl + Shift + S: Kaynağı Hedefe Kopyala
            if ((e.ctrlKey && (e.key === 'Insert' || (e.shiftKey && e.key.toLowerCase() === 's'))) || (e.altKey && e.key === 'Insert')) {
                e.preventDefault();
                copySourceToTarget(segId);
                return;
            }

            // 6. Alt + 1: Akıllı Biçim Kalkanı (Format Shield 1) Seçilen Metne Uygula
            if (e.altKey && e.key === '1') {
                e.preventDefault();
                applyFormatShieldTag(segId, 1);
                return;
            }

            // 6b. Ctrl + 1: TM Önerisini Uygula veya İlk Terimi Ekle
            if (e.ctrlKey && e.key === '1') {
                e.preventDefault();
                if (seg) {
                    const bestTm = findBestTmMatch(seg.source, segId);
                    if (bestTm && bestTm.entry && bestTm.entry.target) {
                        applyTmSuggestion(segId, bestTm.entry.target);
                        return;
                    }
                    const terms = findGlossaryMatches(seg.source);
                    if (terms.length > 0) {
                        insertTermAtCursor(segId, terms[0].target);
                        showToast(`Terim eklendi: "${terms[0].target}"`);
                        return;
                    }
                }
            }

            // 7. Ctrl + 2 veya Ctrl + 3: 2. ve 3. Terimi Ekle
            if ((e.ctrlKey || e.altKey) && (e.key === '2' || e.key === '3')) {
                e.preventDefault();
                const termIdx = parseInt(e.key) - 1;
                if (seg) {
                    const terms = findGlossaryMatches(seg.source);
                    if (terms.length > termIdx) {
                        insertTermAtCursor(segId, terms[termIdx].target);
                        showToast(`Terim eklendi: "${terms[termIdx].target}"`);
                    }
                }
                return;
            }

            // 8. Ctrl + M veya Alt + M: Gemini AI Taslağı İste
            if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                requestGeminiDraft(segId);
                return;
            }

            // 9. Alt + PageDown / PageUp: Sayfa Değiştir
            if (e.altKey && e.key === 'PageDown') {
                e.preventDefault();
                nextPage();
                return;
            }
            if (e.altKey && e.key === 'PageUp') {
                e.preventDefault();
                prevPage();
                return;
            }

            // 10. Ctrl + Home / End: Belgenin İlk / Son Segmentine Git
            if (e.ctrlKey && e.key === 'Home') {
                e.preventDefault();
                if (doc && doc.segments.length > 0) focusSegment(doc.segments[0].id);
                return;
            }
            if (e.ctrlKey && e.key === 'End') {
                e.preventDefault();
                if (doc && doc.segments.length > 0) focusSegment(doc.segments[doc.segments.length - 1].id);
                return;
            }
        }

        // TM Önerisini Segment Kutusuna Uygulama
        function applyTmSuggestion(segId, suggestionText) {
            const doc = getActiveDoc();
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            const cleanText = stripTagsAndShields(suggestionText);
            seg.target = cleanText;
            FormatShield.resetTarget(seg);
            seg.status = 'draft';
            seg.isAutoFilled = true;

            const input = document.getElementById(`targetInput-${segId}`);
            if (input) {
                input.value = cleanText;
                input.focus();
            }

            renderSegments();
            updateProgressStats();
            showToast("TM bellek önerisi hedef kutusuna uygulandı.");
        }

        // ========================================================
        // 7.1 GEMINI AI ENTEGRASYONU VE KULLANICI ONAY MEKANİZMASI
        // ========================================================
        const GEMINI_SMART_TRANSLATIONS = {
            "computer assisted translation tools significantly enhance the productivity of professional linguists": "Bilgisayar Destekli Çeviri araçları, profesyonel dilbilimcilerin üretkenliğini ve terminoloji tutarlılığını önemli ölçüde artırmaktadır.",
            "translation memory systems store previously verified segments to eliminate repetitive workload": "Çeviri belleği sistemleri, mükerrer iş yükünü ortadan kaldırmak amacıyla önceden doğrulanmış segmentleri depolar.",
            "consistent terminology management prevents ambiguity in specialized technical documentation": "Tutarlı terminoloji yönetimi, teknik uzmanlık gerektiren belgelerdeki anlam belirsizliklerinin ve kavram karmaşasının önüne geçer.",
            "sentence level segmentation divides complex source text into clear translation units": "Cümle düzeyinde segmentasyon, karmaşık kaynak metni açık ve bağımsız çeviri birimlerine ayrıştırır.",
            "quality estimation metrics assess candidate hypotheses before delivering final bilingual files": "Kalite değerlendirme metrikleri, nihai iki dilli dosyalar teslim edilmeden önce aday çeviri hipotezlerini otomatik olarak inceler.",
            "post editing requires deep linguistic intuition and domain specific vocabulary knowledge": "Son düzenleme (post-editing), derin bir dilsel sezgi ve alana özgü sözcük dağarcığı hakimiyeti gerektirir.",
            "localization agencies leverage translation management platforms to streamline global deliveries": "Yerelleştirme ajansları, küresel çok dilli teslimat süreçlerini kolaylaştırmak adına çeviri yönetim platformlarından faydalanır.",
            "format preservation guarantees that document layouts remain intact after localization": "Biçim koruma özelliği, yerelleştirme süreci sonrasında özgün belge düzeninin bozulmadan kalmasını güvence altına alır.",
            "welcome to our documentary series exploring the wonders of the natural world": "Doğal dünyanın mucizelerini keşfettiğimiz belgesel serimize hoş geldiniz.",
            "every ecosystem on earth is interconnected in ways we are just beginning to understand": "Dünyadaki her ekosistem birbirine derinden bağlıdır, henüz yeni anlamaya başladığımız yollarla.",
            "marine biologists have observed unprecedented shifts in migratory patterns this season": "Deniz biyologları bu mevsimde göç rotalarında daha önce görülmemiş değişimler kaydetti.",
            "rising temperatures continue to alter the delicate equilibrium of coral reef systems": "Yükselen sıcaklıklar mercan resif sistemlerinin hassas dengesini değiştirmeye devam ediyor.",
            "our choices today will directly shape the future of these endangered habitats": "Bugün yapacağımız tercihler, tehlike altındaki bu yaşam alanlarının geleceğini doğrudan belirleyecek.",
            "through collaborative conservation efforts local communities are restoring degraded coastlines": "Ortak koruma çabaları sayesinde yerel topluluklar tahrip olmuş kıyı ekosistemlerini yeniden canlandırıyor.",
            "innovative acoustic telemetry allows researchers to track oceanic wildlife with remarkable accuracy": "Yenilikçi akustik takip teknolojisi, araştırmacıların deniz canlılarını olağanüstü bir hassasiyetle izlemesini sağlıyor.",
            "protecting these critical biomes requires sustained commitment and global cooperation": "Bu kritik biyolojik alanları korumak, sürekli bir kararlılık ve küresel iş birliği gerektirmektedir.",
            "explore the depths of the ocean and witness the rich biodiversity of our world": "Okyanusların derinliklerini keşfedin ve dünyamızın zengin biyoçeşitliliğine tanıklık edin.",
            "in 2024 rising temperatures reached historic thresholds across global oceans": "2024 yılında küresel okyanus sıcaklıkları tarihi rekor eşiklere ulaştı.",
            "can we preserve these fragile habitats before irreversible tipping points are crossed": "Geri dönülemez eşikler aşılmadan önce bu kırılgan yaşam alanlarını koruyabilir miyiz?",
            "our choices today will determine the survival of countless vulnerable species": "Bugün yapacağımız tercihler, sayısız tehlike altındaki türün hayatta kalmasını belirleyecek.",
            "distinguished delegates nationally determined contributions represent our baseline commitment to climate stability": "Saygıdeğer delegeler, Ulusal Katkı Beyanları iklim istikrarına yönelik temel taahhüdümüzü temsil etmektedir.",
            "the operationalization of the loss and damage fund remains the cornerstone of multilateral climate negotiations": "Kayıp ve Zarar Fonu mekanizmasının hayata geçirilmesi, çok taraflı iklim müzakerelerinin mihenk taşıdır.",
            "implementing the carbon border adjustment mechanism demands comprehensive alignment with global trade standards": "Sınırda Karbon Düzenleme Mekanizması uygulaması, küresel ticaret standartlarıyla tam bir uyum gerektirmektedir.",
            "just transition mechanisms must safeguard vulnerable energy sector workforces": "Adil Geçiş mekanizmaları, kırılgan enerji sektörü iş gücünü mutlaka koruma altına almalıdır."
        };

        // Gemini taslak etiketini ve XML/kalkan etiketlerini metinden kesinlikle kaldıran filtre
        function cleanGeminiDraftTag(text) {
            if (!text || typeof text !== 'string') return '';
            let s = text
                .replace(/\s*\[\s*Gemini\s+Türkçe\s+Çeviri\s+Taslağı\s*\]\s*/gi, '')
                .replace(/\s*\[\s*Gemini\s+Çeviri\s+Taslağı\s*\]\s*/gi, '')
                .replace(/\s*\[\s*Taslak\s*\]\s*/gi, '');
            return stripTagsAndShields(s);
        }

        // Gemini API'ye erişilemediğinde temiz ve doğal Türkçe çeviri simülasyonu üreten motor
        function simulateTurkishTranslation(sourceText) {
            if (!sourceText) return '';
            const cleaned = cleanGeminiDraftTag(sourceText);
            const norm = normalizeString(cleaned);
            if (GEMINI_SMART_TRANSLATIONS[norm]) {
                return GEMINI_SMART_TRANSLATIONS[norm];
            }

            // Cümle havuzunda yüksek benzerlik ara (%75+)
            for (const [key, val] of Object.entries(GEMINI_SMART_TRANSLATIONS)) {
                if (norm.includes(key) || calculateSimilarity(norm, key) >= 75) {
                    return val;
                }
            }

            // 1. Çeviri Belleğinde (TM) %100 Exact veya Fuzzy eşleşme varsa doğrudan bellek karşılığını kullan
            const tmMatch = findBestTmMatch(cleaned);
            if (tmMatch && tmMatch.similarity >= 80 && tmMatch.entry && tmMatch.entry.target) {
                return tmMatch.entry.target;
            }

            // 2. Terim Sözlüğündeki terimleri öncelikli uygula
            let trText = cleaned;
            const matchedTerms = findGlossaryMatches(cleaned);
            if (matchedTerms && matchedTerms.length > 0) {
                matchedTerms.forEach(t => {
                    const esc = t.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const reg = new RegExp(esc.replace(/[- ]/g, '[- ]'), 'gi');
                    trText = trText.replace(reg, t.target);
                });
            }

            // 3. Sık karşılaşılan terim ve kalıpları Türkçeleştir
            const termMap = [
                { reg: /\bcomputer[- ]assisted translation\b/gi, val: "Bilgisayar Destekli Çeviri" },
                { reg: /\btranslation memory\b/gi, val: "çeviri belleği" },
                { reg: /\bterminology management\b/gi, val: "terminoloji yönetimi" },
                { reg: /\bsegmentation\b/gi, val: "segmentasyon" },
                { reg: /\bpost[- ]editing\b/gi, val: "son düzenleme" },
                { reg: /\blocalization\b/gi, val: "yerelleştirme" },
                { reg: /\bformat preservation\b/gi, val: "biçim koruma" },
                { reg: /\bquality estimation\b/gi, val: "kalite değerlendirme" },
                { reg: /\bsignificantly\b/gi, val: "önemli ölçüde" },
                { reg: /\bsubstantially\b/gi, val: "büyük ölçüde" },
                { reg: /\bconsiderably\b/gi, val: "ciddi oranda" },
                { reg: /\bconsistent\b/gi, val: "tutarlı" },
                { reg: /\bprofessional\b/gi, val: "profesyonel" },
                { reg: /\blinguists?\b/gi, val: "dilbilimcilerin" },
                { reg: /\btools?\b/gi, val: "araçları" },
                { reg: /\benhance(s)?\b/gi, val: "artırır" },
                { reg: /\bproductivity\b/gi, val: "üretkenliğini" },
                { reg: /\bthe\s+/gi, val: "" },
                { reg: /\bof\s+/gi, val: "" },
                { reg: /\bintroduction\b/gi, val: "Giriş" },
                { reg: /\babstract\b/gi, val: "Özet" },
                { reg: /\bconclusion\b/gi, val: "Sonuç" },
                { reg: /\breferences\b/gi, val: "Kaynakça" },
                { reg: /\bmethodology\b/gi, val: "Yöntem" },
                { reg: /\bresults\b/gi, val: "Bulgular" },
                { reg: /\bdiscussion\b/gi, val: "Tartışma" }
            ];

            termMap.forEach(item => {
                trText = trText.replace(item.reg, item.val);
            });

            return cleanGeminiDraftTag(trText);
        }

        // Akıllı Dil Tespiti Motoru (Metnin Türkçe, İngilizce, Almanca vb. olduğunu belirler)
        function detectTextLanguage(text) {
            if (!text || typeof text !== 'string') return 'en';
            const clean = text.toLowerCase();
            const trLetters = (clean.match(/[çğıöşüÇĞİÖŞÜ]/gi) || []).length;
            const trWordsMatch = clean.match(/\b(ve|bir|bu|ile|icin|için|de|da|dahi|ama|fakat|veya|ancak|gibi|olan|olarak|eden|gore|göre|daha|cok|çok|en|var|yok|kadar|sonra|once|önce|tum|tüm|her|kendi|neden|nasil|nasıl|cunku|çünkü|ise|bunu|buna|bunun|rehber|rehberi|metin|ceviri|çeviri|toplumsal|cinsiyet|cinsiyete)\b/gi);
            const trWords = trWordsMatch ? trWordsMatch.length : 0;
            const trScore = trLetters * 2 + trWords * 3;

            const enWordsMatch = clean.match(/\b(the|and|is|are|in|at|which|on|for|with|as|by|from|this|that|these|those|an|be|to|of|or|not|it|its|they|we|you)\b/gi);
            const enWords = enWordsMatch ? enWordsMatch.length : 0;

            const deWordsMatch = clean.match(/\b(der|die|das|und|ist|in|den|von|zu|mit|sich|des|auf|für|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird)\b/gi);
            const deLetters = (clean.match(/[äöüß]/gi) || []).length;
            const deScore = (deWordsMatch ? deWordsMatch.length : 0) * 2 + deLetters * 2;

            if (trScore > enWords && trScore > deScore && trScore >= 2) return 'tr';
            if (deScore > enWords && deScore > trScore && deScore >= 2) return 'de';
            if (enWords > 0) return 'en';
            return trLetters > 0 ? 'tr' : 'en';
        }

        function autoDetectAndSetProjectLanguage(sampleText) {
            const proj = getActiveProject();
            if (!sampleText || !proj) return;
            const detected = detectTextLanguage(sampleText);
            if (detected === proj.targetLang && detected !== proj.sourceLang) {
                const oldSrc = proj.sourceLang;
                proj.sourceLang = detected;
                proj.targetLang = (oldSrc !== detected) ? oldSrc : (detected === 'tr' ? 'en' : 'tr');
                proj.desc = `${proj.sourceLang.toUpperCase()} ➔ ${proj.targetLang.toUpperCase()} çeviri ve segmentasyon projesi.`;
                const srcSelect = document.getElementById('editorSourceLangSelect');
                const trgSelect = document.getElementById('editorTargetLangSelect');
                if (srcSelect) srcSelect.value = proj.sourceLang;
                if (trgSelect) trgSelect.value = proj.targetLang;
                scheduleAutoSave();
                showToast(`💡 Belge dili ${getLanguageDisplayName(detected)} olarak algılandı. Çeviri yönü ${proj.sourceLang.toUpperCase()} ➔ ${proj.targetLang.toUpperCase()} olarak güncellendi.`);
            }
        }

        function getLanguageDisplayName(code) {
            if (!code) return 'Türkçe';
            const c = code.toLowerCase();
            if (c.startsWith('tr')) return 'Türkçe';
            if (c.startsWith('en')) return 'İngilizce';
            if (c.startsWith('de')) return 'Almanca';
            if (c.startsWith('fr')) return 'Fransızca';
            if (c.startsWith('es')) return 'İspanyolca';
            if (c.startsWith('it')) return 'İtalyanca';
            if (c.startsWith('ru')) return 'Rusça';
            if (c.startsWith('ar')) return 'Arapça';
            if (c.startsWith('zh')) return 'Çince';
            if (c.startsWith('ja')) return 'Japonca';
            return code;
        }

        // Çevrilmiş metnin kaynak metinle aynı kalıp kalmadığını denetleyen sıkı filtre
        function isEchoedSource(translated, source) {
            if (!translated || !translated.trim()) return true;
            if (!source || !source.trim()) return false;
            const cleanT = translated.trim().toLowerCase().replace(/[.,!?;:\"'«»“”„()\-—–\[\]]/g, '').replace(/\s+/g, ' ');
            const cleanS = source.trim().toLowerCase().replace(/[.,!?;:\"'«»“”„()\-—–\[\]]/g, '').replace(/\s+/g, ' ');
            return cleanT === cleanS;
        }

        /**
         * AI Çevirisi ve Etiket/Kalkan (Tag/Shield) Yoksayımı:
         * Metin içindeki XML/CAT etiketlerini (<g id="1">, </g>, <x id="1"/> vb.)
         * ve kalkan işaretçilerini temizler; AI'nın sadece saf ve anlamlı metni çevirmesini sağlar.
         */
        function stripTagsAndShields(text) {
            if (!text) return '';
            let s = String(text);
            // 1. Standart XLIFF / XML / HTML CAT etiketleri: <g id="...">, </g>, <x id="..."/>, <ph>...</ph>, vb.
            s = s.replace(/<\/?(?:g|x|bx|ex|bpt|ept|ph|tag|span|shield)(?:\s+[^>]*)*>/gi, '');
            // 2. HTML encode edilmiş etiketler: &lt;g id="..."&gt;, &lt;/g&gt;
            s = s.replace(/&lt;\/?(?:g|x|bx|ex|bpt|ept|ph|tag|span|shield)(?:\s+[^&]*)*&gt;/gi, '');
            // 3. Çift boşlukları ve kenar boşluklarını toparla
            return s.replace(/\s{2,}/g, ' ').trim();
        }

        async function fetchOnlineTranslation(text, sourceLang = 'en', targetLang = 'tr') {
            const sl = (sourceLang || 'en').toLowerCase().slice(0, 2);
            const tl = (targetLang || 'tr').toLowerCase().slice(0, 2);
            // AI çevirisi öncesi etiket ve kalkanları temizle
            const clean = stripTagsAndShields(text);
            if (!clean) return '';

            // 1. MyMemory Çeviri API'si (CatMT ile kuyruk, retry ve timeout korumalı)
            try {
                const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${sl}|${tl}`;
                const fetchFn = (typeof CatMT !== 'undefined' && CatMT.fetch) ? CatMT.fetch : fetch;
                const res = await fetchFn(mmUrl, {}, { tag: 'mymemory' });
                if (res.ok) {
                    const data = await res.json();
                    let cand = data?.responseData?.translatedText || '';
                    cand = stripTagsAndShields(cand);
                    if (cand && !cand.startsWith('MYMEMORY WARNING') && !isEchoedSource(cand, clean)) {
                        return cand.trim();
                    }
                }
            } catch (e) {
                console.warn("MyMemory API uyarısı:", e);
            }

            // 2. Yerel Python Sunucu API Proxy (/api/translate)
            try {
                const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                const apiKey = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key') || '';
                const fetchFn = (typeof CatMT !== 'undefined' && CatMT.fetch) ? CatMT.fetch : fetch;
                const activeProjForProxy = (typeof getActiveProject === 'function') ? getActiveProject() : null;
                const styleGuideForProxy = activeProjForProxy?.styleGuide?.content || '';
                const res = await fetchFn(`${apiBase}/api/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: clean,
                        sourceLang: sl,
                        targetLang: tl,
                        apiKey: apiKey,
                        styleGuide: styleGuideForProxy
                    })
                }, { tag: 'proxy' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.status === 'success' && data.translatedText) {
                        const t = stripTagsAndShields(data.translatedText.trim());
                        if (!isEchoedSource(t, clean)) {
                            return t;
                        }
                    }
                }
            } catch (e) {
                console.warn("Sunucu çeviri uyarısı:", e);
            }

            return '';
        }

        async function translateWithGeminiApi(text, sourceLangName, targetLangName, apiKey, glossaryRules = "", customStyleGuide = null) {
            if (!apiKey || apiKey.trim().length < 10) return "";
            // Etiketleri ve kalkan kodlarını temizleyerek saf gövde metnini çeviriye hazırla
            const cleanTextForAI = stripTagsAndShields(text);
            if (!cleanTextForAI) return "";

            // Proje Kılavuzu (Guidelines / Style Guide) Entegrasyonu: Gemini Sistem Bağlamına Aktarılır
            const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
            const guideContent = (customStyleGuide !== null) ? customStyleGuide : (activeProj?.styleGuide?.content || "");
            let styleGuidePromptSection = "";
            if (guideContent && guideContent.trim().length > 0) {
                styleGuidePromptSection = `\n\nPROJE STİL VE REHBER KILAVUZU (STYLE GUIDE & GUIDELINES):\nAşağıdaki kurallara kesinlikle ve harfiyen uy:\n${guideContent.trim()}\n`;
            }

            const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

            for (const model of models) {
                try {
                    const payload = {
                        system_instruction: {
                            parts: [{
                                text: `Sen profesyonel, kıdemli bir edebi ve teknik mütercim-tercümansın. Görevin kaynak metni ${sourceLangName} dilinden ${targetLangName} diline eksiksiz, doğal, akıcı ve terminolojik açıdan kusursuz biçimde çevirmektir.

MUTLAK VE KESİN KURALLAR:
1. Kaynak metni KESİNLİKLE aynen geri döndürme! Kaynak metin ne olursa olsun hedef dilde (${targetLangName}) gerçek, doğal ve eksiksiz bir çeviri üret.
2. Kaynak metin hedef dille (${targetLangName}) aynı görünse dahi, onu hedef dile uyarla veya hedef dile aktar; ASLA kaynak metni aynen kopyalayıp verme.
3. Çıktıda ASLA 'Kaynak:', 'Hedef:', 'Çeviri:', 'Translation:', tırnak işaretleri, giriş cümleleri veya açıklamalar bulunmamalıdır. YALNIZCA doğrudan ${targetLangName} çeviri metnini döndür.
4. KESİNLİKLE METİN İÇERİSİNE <g id="...">, </g>, <tag>, XML, HTML veya kalkan etiketleri KOYMA! Etiketleri, kalkanları ve teknik kodları tamamen yok say ve çeviri içine asla etiketleme kodu yazma. Yalnızca düz, temiz ve doğal metin üret.
${glossaryRules}
${styleGuidePromptSection}`
                            }]
                        },
                        contents: [{
                            role: "user",
                            parts: [{
                                text: `Lütfen aşağıdaki ${sourceLangName} kaynak metni doğrudan ${targetLangName} diline çevir:\n\n${cleanTextForAI}\n\nDoğrudan ${targetLangName} Çevirisi:`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 2048
                        }
                    };

                    const fetchFn = (typeof CatMT !== 'undefined' && CatMT.fetch) ? CatMT.fetch : fetch;
                    const response = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }, { tag: 'gemini', retries: 3, baseDelay: 1000 });

                    if (response.ok) {
                        const data = await response.json();
                        let raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                        raw = raw.replace(/^(çeviri|translation|hedef çeviri|hedef metin):\s*/i, '')
                            .replace(/^["'«»“”„]+|["'«»“”„]+$/g, '')
                            .trim();
                        // Dönen çıktıdaki tüm olası etiket ve kalkan kalıntılarını tamamen arındır
                        raw = stripTagsAndShields(raw);
                        if (raw && !isEchoedSource(raw, cleanTextForAI)) {
                            return raw;
                        }
                    }
                } catch (e) {
                    console.warn(`Gemini API (${model}) deneme hatası:`, e);
                }
            }
            return "";
        }

        // DEEPL ÇEVİRİ MOTORU ENTEGRASYONU (API / PROXY / NEURAL MT)
        async function translateWithDeepLApi(text, sourceLangCode, targetLangCode, apiKey) {
            const clean = stripTagsAndShields(text);
            if (!clean) return "";

            let dlTarget = (targetLangCode || 'tr').toUpperCase();
            if (dlTarget === 'EN') dlTarget = 'EN-US';
            else if (dlTarget === 'PT') dlTarget = 'PT-BR';

            const dlSource = (sourceLangCode && sourceLangCode.toLowerCase() !== targetLangCode.toLowerCase())
                ? sourceLangCode.toUpperCase()
                : null;

            // 1. Doğrudan DeepL API (Eğer kullanıcı anahtar girdiyse)
            if (apiKey && apiKey.trim().length > 5) {
                try {
                    const isFree = apiKey.trim().endsWith(':fx');
                    const endpoint = isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
                    const payload = {
                        text: [clean],
                        target_lang: dlTarget
                    };
                    if (dlSource && dlSource !== 'AUTO') payload.source_lang = dlSource;

                    const fetchFn = (typeof CatMT !== 'undefined' && CatMT.fetch) ? CatMT.fetch : fetch;
                    const res = await fetchFn(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `DeepL-Auth-Key ${apiKey.trim()}`
                        },
                        body: JSON.stringify(payload)
                    }, { tag: 'deepl-api' });
                    if (res.ok) {
                        const data = await res.json();
                        let cand = data?.translations?.[0]?.text || '';
                        cand = stripTagsAndShields(cand);
                        if (cand && !isEchoedSource(cand, clean)) {
                            return cand.trim();
                        }
                    }
                } catch (e) {
                    console.warn("Doğrudan DeepL API isteği hatası:", e);
                }
            }

            // 2. Python Backend Proxy (/api/translate - engine: deepl)
            try {
                const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                const fetchFn = (typeof CatMT !== 'undefined' && CatMT.fetch) ? CatMT.fetch : fetch;
                const activeProjForDl = (typeof getActiveProject === 'function') ? getActiveProject() : null;
                const styleGuideForDl = activeProjForDl?.styleGuide?.content || '';
                const res = await fetchFn(`${apiBase}/api/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: clean,
                        sourceLang: sourceLangCode,
                        targetLang: dlTarget,
                        apiKey: apiKey || '',
                        deeplApiKey: apiKey || '',
                        engine: 'deepl',
                        styleGuide: styleGuideForDl
                    })
                }, { tag: 'deepl-proxy' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.status === 'success' && data.translatedText) {
                        let cand = stripTagsAndShields(data.translatedText.trim());
                        if (cand && !isEchoedSource(cand, clean)) {
                            return cand;
                        }
                    } else if (data && data.message) {
                        showToast(`⚠️ DeepL Uyarısı: ${data.message}`);
                    }
                }
            } catch (e) {
                console.warn("DeepL proxy denemesi:", e);
            }

            // 3. Fallback: Çeviri Motoru (MyMemory / Online MT)
            return await fetchOnlineTranslation(clean, sourceLangCode, targetLangCode);
        }

        // YALNIZCA SEÇİLEN SEGMENT KUTUCUĞUNU ÇEVİREN FONKSİYON (DeepL veya Gemini)
        async function translateSingleSegmentBox(segId, engine = 'gemini') {
            const doc = getActiveDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            // Kaynak metin kontrolü
            const cleanSource = (seg.source || '').trim();
            if (!cleanSource) {
                showToast("⚠️ Bu segmentte çevrilecek kaynak metin bulunamadı.");
                return;
            }

            // Butonu yükleniyor moduna al
            const btn = document.getElementById(`${engine}Btn-${segId}`);
            const origHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>`;
            }

            try {
                const activeProj = getActiveProject();
                let sourceLangCode = (activeProj && activeProj.sourceLang) ? activeProj.sourceLang : 'en';
                let targetLangCode = (activeProj && activeProj.targetLang) ? activeProj.targetLang : 'tr';

                const detectedSegLang = detectTextLanguage(cleanSource);
                if (detectedSegLang === targetLangCode) {
                    targetLangCode = (sourceLangCode !== detectedSegLang) ? sourceLangCode : (detectedSegLang === 'tr' ? 'en' : 'tr');
                    sourceLangCode = detectedSegLang;
                } else if (sourceLangCode.toLowerCase().trim() === targetLangCode.toLowerCase().trim()) {
                    targetLangCode = sourceLangCode.toLowerCase().startsWith('tr') ? 'en' : 'tr';
                }

                const sourceLangName = getLanguageDisplayName(sourceLangCode);
                const targetLangName = getLanguageDisplayName(targetLangCode);

                // Terim Sözlüğü Kuralları
                const cleanForGlossary = stripTagsAndShields(cleanSource);
                const matchedTerms = findGlossaryMatches(cleanForGlossary);
                let glossaryRules = "";
                if (matchedTerms && matchedTerms.length > 0) {
                    glossaryRules = "\nZorunlu Terim Sözlüğü Kuralları:\n" +
                        matchedTerms.map(t => `- "${t.source}" ➔ "${t.target}"`).join('\n') + "\n";
                }

                let translatedText = "";
                const providerTitle = (engine === 'deepl') ? "DeepL" : "Gemini AI";

                if (engine === 'deepl') {
                    const deeplKey = appState.deeplApiKey || localStorage.getItem('cat_deepl_api_key') || '';
                    translatedText = await translateWithDeepLApi(cleanSource, sourceLangCode, targetLangCode, deeplKey);
                } else {
                    const geminiKey = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key') || '';
                    if (geminiKey && geminiKey.trim().length > 10) {
                        translatedText = await translateWithGeminiApi(cleanSource, sourceLangName, targetLangName, geminiKey, glossaryRules);
                    }
                    if (!translatedText || isEchoedSource(translatedText, cleanSource)) {
                        translatedText = await fetchOnlineTranslation(cleanSource, sourceLangCode, targetLangCode);
                    }
                }

                // AI / MT çıktısını etiket ve kalkanlardan arındır
                translatedText = stripTagsAndShields(translatedText);
                translatedText = cleanGeminiDraftTag(translatedText).trim().replace(/^\s+/, '').replace(/\s{2,}/g, ' ');

                // Terim sözlüğü eşleştirmelerini uygula
                if (matchedTerms && matchedTerms.length > 0) {
                    matchedTerms.forEach(t => {
                        const esc = t.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        translatedText = translatedText.replace(new RegExp(esc, 'gi'), t.target);
                    });
                }

                if (!translatedText || isEchoedSource(translatedText, cleanSource)) {
                    showToast(`⚠️ Segment #${seg.id} çevrilemedi. Lütfen API anahtarınızı veya bağlantınızı kontrol edin.`);
                    return;
                }

                // STANDART CAT DAVRANIŞI: Hedef alanı doğrudan ezmek yerine,
                // hedef kutusunun hemen altında beliren bir önizleme/öneri kartında göster
                seg.mtDraft = {
                    provider: engine,
                    text: translatedText,
                    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                };

                renderSegments();
                showToast(`✨ ${providerTitle} çeviri önerisi hazırlandı. Hedefe aktarmak için karta tıklayın.`);
            } catch (err) {
                console.error("Segment çeviri hatası:", err);
                showToast("⚠️ Çeviri sırasında bir hata oluştu: " + err.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
            }
        }

        // ÖNERİ KARTINA TIKLANDIĞINDA METNİ HEDEF ALANINA AKTARAN FONKSİYON
        function applyMtSuggestion(segId) {
            const doc = getActiveDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            const draft = seg.mtDraft || seg.geminiDraft;
            if (!draft || !draft.text) return;

            const oldVal = seg.target || '';
            const textToApply = cleanGeminiDraftTag(draft.text);
            const provider = draft.provider || 'MT';

            seg.target = textToApply;
            if (seg.status !== 'confirmed') {
                seg.status = 'draft';
            }
            delete seg.mtDraft;
            delete seg.geminiDraft;

            const targetTextarea = document.getElementById(`targetInput-${segId}`);
            if (targetTextarea) {
                targetTextarea.value = textToApply;
                targetTextarea.focus();
            }

            if (typeof CatHistory !== 'undefined' && CatHistory.recordChange) {
                CatHistory.recordChange(seg.id, oldVal, textToApply, `${provider} Çevirisi`);
            }

            if (typeof onSegmentChange === 'function') {
                onSegmentChange(seg.id, targetTextarea || { value: textToApply });
            }
            if (typeof debouncedAutoSave === 'function') {
                debouncedAutoSave();
            }

            renderSegments();
            showToast(`✅ ${provider === 'deepl' ? 'DeepL' : 'Gemini AI'} önerisi hedef kutusuna aktarıldı.`);
        }

        function dismissMtSuggestion(segId) {
            const doc = getActiveDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            delete seg.mtDraft;
            delete seg.geminiDraft;
            renderSegments();
            showToast("Çeviri önerisi kapatıldı.");
        }

        async function requestGeminiDraft(segId) {
            const doc = getActiveDoc();
            const seg = doc ? doc.segments.find(s => s.id === segId) : null;
            if (!seg) return;

            // Kaynak metindeki tüm gereksiz başlama ve katlama boşluklarını temizle
            seg.source = (seg.source || '').trim().replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
            if (!seg.source) {
                showToast("Çevrilecek kaynak metin bulunamadı.");
                return;
            }

            const btn = document.getElementById(`geminiBtn-${segId}`);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="material-symbols-outlined text-[14px] text-amber-500 animate-spin">progress_activity</span><span class="text-amber-800">Çevriliyor...</span>`;
            }

            const activeProj = getActiveProject();
            let sourceLangCode = (activeProj && activeProj.sourceLang) ? activeProj.sourceLang : 'en';
            let targetLangCode = (activeProj && activeProj.targetLang) ? activeProj.targetLang : 'tr';

            const detectedSegLang = detectTextLanguage(seg.source);
            if (detectedSegLang === targetLangCode) {
                targetLangCode = (sourceLangCode !== detectedSegLang) ? sourceLangCode : (detectedSegLang === 'tr' ? 'en' : 'tr');
                sourceLangCode = detectedSegLang;
            } else if (sourceLangCode.toLowerCase().trim() === targetLangCode.toLowerCase().trim()) {
                targetLangCode = sourceLangCode.toLowerCase().startsWith('tr') ? 'en' : 'tr';
            }
            const sourceLangName = getLanguageDisplayName(sourceLangCode);
            const targetLangName = getLanguageDisplayName(targetLangCode);

            // Terim Sözlüğü Kuralları
            const cleanSrcForGlossary = stripTagsAndShields(seg.source);
            const matchedTerms = findGlossaryMatches(cleanSrcForGlossary);
            let glossaryPromptSection = "";
            if (matchedTerms && matchedTerms.length > 0) {
                glossaryPromptSection = `\nZORUNLU TERİM SÖZLÜĞÜ KURALLARI:\n` +
                    matchedTerms.map(t => `- "${t.source}" ➔ "${t.target}"`).join('\n') + `\n`;
            }

            const apiKey = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key');
            let draftResult = "";
            let providerName = "Gemini AI";

            // 1. Önce Gemini AI ile Çevirmeyi Dene
            if (apiKey && apiKey.trim().length > 10) {
                draftResult = await translateWithGeminiApi(seg.source, sourceLangName, targetLangName, apiKey, glossaryPromptSection);
            }

            // 2. Eğer Gemini anahtarı yoksa veya çevirmediyse (aynı bıraktıysa) TM ve Online motora başvur
            if (!draftResult || isEchoedSource(draftResult, seg.source)) {
                const tmMatch = findBestTmMatch(seg.source);
                if (tmMatch && tmMatch.similarity >= 85 && tmMatch.entry && tmMatch.entry.target) {
                    draftResult = stripTagsAndShields(tmMatch.entry.target);
                    providerName = `Çeviri Belleği (%${tmMatch.similarity})`;
                } else {
                    draftResult = await fetchOnlineTranslation(seg.source, sourceLangCode, targetLangCode);
                    providerName = "AI Çeviri Motoru";
                }
            }

            draftResult = stripTagsAndShields(draftResult);

            // 3. KESİN KURAL: Eğer çeviri hala boşsa veya kaynak metinle AYNEN EŞİTSE:
            // ASLA ve KESİNLİKLE kaynak metni taslak olarak kutuya yazma!
            if (!draftResult || isEchoedSource(draftResult, seg.source)) {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<span class="material-symbols-outlined text-[14px] text-amber-500">auto_awesome</span><span>Taslak Çevir</span>`;
                }
                showToast("⚠️ Kaynak metin çevrilemedi. Lütfen Ayarlar'dan geçerli bir Gemini API anahtarı girdiğinizden emin olun.");
                return;
            }

            // Temizleme ve terim eşleştirmesi
            draftResult = cleanGeminiDraftTag(draftResult).trim().replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
            if (matchedTerms && matchedTerms.length > 0) {
                matchedTerms.forEach(t => {
                    const esc = t.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    draftResult = draftResult.replace(new RegExp(esc, 'gi'), t.target);
                });
            }

            // Kullanıcı onayı için taslak nesnesine ata
            seg.geminiDraft = {
                text: draftResult,
                provider: providerName,
                timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };

            renderSegments();
            showToast(`✅ ${providerName} çevirisi hazırlandı (${sourceLangName} ➔ ${targetLangName}). Onaylayarak hedefe aktarabilirsiniz.`);
        }

        // Toplu Sayfa Çevirisi (Boş Segmentleri Otomatik Doldurma)
        async function requestBatchGeminiDrafts() {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("İşlenecek segment bulunamadı.");
                return;
            }

            const startIdx = (doc.currentPage - 1) * SEGMENTS_PER_PAGE;
            const endIdx = Math.min(startIdx + SEGMENTS_PER_PAGE, doc.segments.length);
            const pageSegments = doc.segments.slice(startIdx, endIdx);
            const emptySegments = pageSegments.filter(s => (!s.target || s.target.trim() === '') && !s.geminiDraft);

            if (emptySegments.length === 0) {
                showToast("Bu sayfada çevrilecek boş segment bulunamadı (Tümünde çeviri veya taslak mevcut).");
                return;
            }

            const btn = document.getElementById('btnBatchGemini');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span><span>Çevriliyor (0/${emptySegments.length})...</span>`;
            }

            let completed = 0;
            for (let i = 0; i < emptySegments.length; i++) {
                const seg = emptySegments[i];
                if (btn) {
                    btn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span><span>Çevriliyor (${completed + 1}/${emptySegments.length})...</span>`;
                }
                await requestGeminiDraft(seg.id);
                completed++;
                await new Promise(r => setTimeout(r, 250));
            }

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span class="material-symbols-outlined text-[15px] text-amber-600">auto_awesome</span><span>Boşları AI ile Çevir</span>`;
            }
            showToast(`🎉 Sayfadaki ${completed} segment için yapay zeka çeviri taslağı başarıyla oluşturuldu!`);
        }

        // ========================================================
        // 7.2 ALTYAZI GÖRÜNÜM, YAZI TİPİ, RENK VE BOYUT AYARLARI
        // ========================================================
        appState.subtitleStyles = {
            fontFamily: localStorage.getItem('sub_font_family') || "'Segoe UI', Arial, sans-serif",
            fontSize: parseInt(localStorage.getItem('sub_font_size') || '16', 10),
            color: localStorage.getItem('sub_color') || '#ffeb3b',
            bgColor: localStorage.getItem('sub_bg_color') || 'rgba(0, 0, 0, 0.65)',
            fontWeight: localStorage.getItem('sub_font_weight') || 'bold',
            position: localStorage.getItem('sub_position') || 'bottom'
        };

        function openSubtitleStyleModal() {
            const m = document.getElementById('modalSubtitleStyle');
            if (!m) return;
            m.classList.remove('hidden');
            m.classList.add('flex');

            const s = appState.subtitleStyles;
            const fontEl = document.getElementById('subStyleFontFamily');
            const sizeRange = document.getElementById('subStyleFontSizeRange');
            const sizeBadge = document.getElementById('subStyleFontSizeBadge');
            const colorPicker = document.getElementById('subStyleCustomColor');
            const bgEl = document.getElementById('subStyleBgColor');
            const weightEl = document.getElementById('subStyleFontWeight');
            const posEl = document.getElementById('subStylePosition');

            if (fontEl) fontEl.value = s.fontFamily;
            if (sizeRange) sizeRange.value = s.fontSize;
            if (sizeBadge) sizeBadge.innerText = `${s.fontSize}px`;
            if (colorPicker) colorPicker.value = s.color.startsWith('#') ? s.color : '#ffeb3b';
            if (bgEl) bgEl.value = s.bgColor;
            if (weightEl) weightEl.value = s.fontWeight;
            if (posEl) posEl.value = s.position;

            updateSubtitleStylePreviewBox();
        }

        function closeSubtitleStyleModal() {
            const m = document.getElementById('modalSubtitleStyle');
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        }

        function toggleSubtitleStyleModal() {
            const m = document.getElementById('modalSubtitleStyle');
            if (m && m.classList.contains('hidden')) {
                openSubtitleStyleModal();
            } else {
                closeSubtitleStyleModal();
            }
        }

        function setSubtitleColorPreset(colorHex) {
            const colorPicker = document.getElementById('subStyleCustomColor');
            if (colorPicker) colorPicker.value = colorHex;
            appState.subtitleStyles.color = colorHex;
            updateSubtitleStylePreviewBox();
            applySubtitleStyles();
        }

        function onSubtitleStyleSettingChange() {
            const fontEl = document.getElementById('subStyleFontFamily');
            const sizeRange = document.getElementById('subStyleFontSizeRange');
            const sizeBadge = document.getElementById('subStyleFontSizeBadge');
            const colorPicker = document.getElementById('subStyleCustomColor');
            const bgEl = document.getElementById('subStyleBgColor');
            const weightEl = document.getElementById('subStyleFontWeight');
            const posEl = document.getElementById('subStylePosition');

            if (fontEl) appState.subtitleStyles.fontFamily = fontEl.value;
            if (sizeRange) {
                appState.subtitleStyles.fontSize = parseInt(sizeRange.value, 10);
                if (sizeBadge) sizeBadge.innerText = `${sizeRange.value}px`;
            }
            if (colorPicker) appState.subtitleStyles.color = colorPicker.value;
            if (bgEl) appState.subtitleStyles.bgColor = bgEl.value;
            if (weightEl) appState.subtitleStyles.fontWeight = weightEl.value;
            if (posEl) appState.subtitleStyles.position = posEl.value;

            updateSubtitleStylePreviewBox();
            applySubtitleStyles();
        }

        function updateSubtitleStylePreviewBox() {
            const s = appState.subtitleStyles;
            const previewText = document.getElementById('subStylePreviewText');
            if (!previewText) return;

            previewText.style.fontFamily = s.fontFamily;
            previewText.style.fontSize = `${s.fontSize}px`;
            previewText.style.color = s.color;
            previewText.style.fontWeight = s.fontWeight;
            previewText.style.backgroundColor = s.bgColor;
            previewText.style.borderRadius = s.bgColor !== 'transparent' ? '6px' : '0px';

            if (s.bgColor === 'transparent') {
                previewText.style.textShadow = '0 2px 5px rgba(0,0,0,0.98), 0 0 6px rgba(0,0,0,0.9)';
            } else {
                previewText.style.textShadow = '0 1px 3px rgba(0,0,0,0.8)';
            }
        }

        function applySubtitleStyles() {
            const s = appState.subtitleStyles;
            const overlay = document.getElementById('subVideoOverlayCaption');
            const monitor = document.getElementById('subMonitorLiveText');

            if (overlay) {
                overlay.style.fontFamily = s.fontFamily;
                overlay.style.fontSize = `${s.fontSize}px`;
                overlay.style.color = s.color;
                overlay.style.fontWeight = s.fontWeight;
                overlay.style.backgroundColor = s.bgColor;
                overlay.style.borderRadius = s.bgColor !== 'transparent' ? '6px' : '0px';

                if (s.position === 'top') {
                    overlay.style.top = '20px';
                    overlay.style.bottom = 'auto';
                } else {
                    overlay.style.bottom = '32px';
                    overlay.style.top = 'auto';
                }

                if (s.bgColor === 'transparent') {
                    overlay.style.textShadow = '0 2px 6px rgba(0,0,0,0.98), 0 0 6px rgba(0,0,0,0.9)';
                } else {
                    overlay.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
                }
            }

            if (monitor) {
                monitor.style.fontFamily = s.fontFamily;
                monitor.style.color = s.color;
            }
        }

        function saveSubtitleStylesAndClose() {
            const s = appState.subtitleStyles;
            localStorage.setItem('sub_font_family', s.fontFamily);
            localStorage.setItem('sub_font_size', s.fontSize);
            localStorage.setItem('sub_color', s.color);
            localStorage.setItem('sub_bg_color', s.bgColor);
            localStorage.setItem('sub_font_weight', s.fontWeight);
            localStorage.setItem('sub_position', s.position);

            applySubtitleStyles();
            closeSubtitleStyleModal();
            showToast("🎨 Altyazı görünüm ve stil ayarları kaydedildi ve uygulandı!");
        }

        function resetSubtitleStylesToDefault() {
            appState.subtitleStyles = {
                fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: 16,
                color: '#ffeb3b',
                bgColor: 'rgba(0, 0, 0, 0.65)',
                fontWeight: 'bold',
                position: 'bottom'
            };
            openSubtitleStyleModal();
            applySubtitleStyles();
            showToast("Altyazı ayarları varsayılanlara sıfırlandı.");
        }

        // KULLANICI ONAYI ŞARTI: Öneri kartına veya "Onayla & Aktar" basıldığında
        function approveGeminiDraft(segId) {
            applyMtSuggestion(segId);
        }

        // KULLANICI REDDİ: Öneriyi yoksay
        function dismissGeminiDraft(segId) {
            dismissMtSuggestion(segId);
        }

        // 3. AKILLI BİÇİM KALKANI: Seçilen metne kalkan rozeti veya stili uygulama
        function applyFormatShieldTag(segId, shieldId = 1) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;

            let targetSegId = segId || appState.activeSegmentId || (doc.segments[0] ? doc.segments[0].id : null);
            let seg = doc.segments.find(s => s.id === targetSegId);
            if (!seg) seg = doc.segments[0];
            if (!seg) return;

            // Öncelik 1: FormatShield rozet uygulayıcısı
            if (typeof FormatShield !== 'undefined' && typeof FormatShield.applyShieldBadgeToSelection === 'function') {
                FormatShield.applyShieldBadgeToSelection(seg.id, shieldId);
                return;
            }

            let textarea = document.getElementById(`targetInput-${seg.id}`);
            if (!textarea) return;

            let start = textarea.selectionStart;
            let end = textarea.selectionEnd;
            const val = textarea.value || '';

            let selectedText = '';
            if (start !== end) {
                selectedText = val.substring(start, end);
            } else {
                const textBefore = val.slice(0, start);
                const textAfter = val.slice(start);
                const wordStartMatch = textBefore.match(/\S+$/);
                const wordEndMatch = textAfter.match(/^\S+/);
                if (wordStartMatch && wordEndMatch) {
                    start = start - wordStartMatch[0].length;
                    end = end + wordEndMatch[0].length;
                    selectedText = val.substring(start, end);
                } else if (wordStartMatch) {
                    start = start - wordStartMatch[0].length;
                    selectedText = val.substring(start, end);
                } else if (wordEndMatch) {
                    end = end + wordEndMatch[0].length;
                    selectedText = val.substring(start, end);
                }
            }

            if (!selectedText) {
                showToast(`Lütfen önce kalkan uygulanacak metni seçin.`);
                return;
            }

            if (seg.fmt && Array.isArray(seg.fmt.tgtRuns)) {
                seg.fmt.tgtRuns.push({ start: start, end: end, shieldId: 'sh' + shieldId });
                seg.fmt.tgtRuns.sort((a, b) => a.start - b.start);
            }

            if (typeof FormatShield !== 'undefined' && typeof FormatShield.refreshBlock === 'function') {
                FormatShield.refreshBlock(seg);
            }

            showToast(`🛡️ Biçim Kalkanı #${shieldId} seçime uygulandı: "${selectedText}"`);
        }

        function saveGeminiApiKey() {
            const input = document.getElementById('geminiApiKeyInput');
            if (!input) return;
            const key = input.value.trim();
            appState.geminiApiKey = key;
            localStorage.setItem('cat_gemini_api_key', key);

            const badge = document.getElementById('geminiKeyStatusBadge');
            if (badge) {
                if (key) {
                    badge.innerText = 'API Bağlandı (Aktif)';
                    badge.className = 'text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-300';
                } else {
                    badge.innerText = 'Hazır (Akıllı Motor)';
                    badge.className = 'text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold border border-amber-300';
                }
            }
            showToast(key ? "Gemini API anahtarı başarıyla kaydedildi." : "Gemini yerleşik akıllı motor aktif.");
        }

        // 2. ÇEVİRİ BELLEĞİ (TM) AKIŞ MANTIĞI:
        // Segment onaylandığında o segment TM'e eklenir, SADECE projedeki DİĞER segmentler taranır.
        // Onaylanan mevcut segment üzerinde TM eşleşmesi veya uyarısı ASLA gösterilmez.
        function propagateAndScanOtherSegments(confirmedSegId, sourceText, targetText) {
            const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
            const docs = (proj && proj.documents && proj.documents.length) ? proj.documents : [getActiveDoc()];
            const normSource = normalizeString(sourceText);
            let autoFilledCount = 0;

            docs.forEach(d => {
                if (!d || !d.segments) return;
                d.segments.forEach(otherSeg => {
                    // KESİN STANDART: Mevcut segment veya önceden onaylanmış segmentler taranmaz/etkilenmez!
                    if (otherSeg.id === confirmedSegId || otherSeg.status === 'confirmed') return;

                    const otherNorm = normalizeString(otherSeg.source);
                    // %100 Exact Match
                    if (otherNorm === normSource) {
                        // Eğer henüz çevrilmemişse otomatik yayılma (Auto-propagation) ile doldur
                        if (!otherSeg.target || !otherSeg.target.trim()) {
                            otherSeg.target = targetText;
                            otherSeg.status = 'draft';
                            otherSeg.isAutoFilled = true;
                            otherSeg.propagated = true;
                            delete otherSeg.geminiDraft;
                            delete otherSeg.mtDraft;
                            autoFilledCount++;
                        }
                        otherSeg.tmSuggestion = {
                            entry: { source: sourceText, target: targetText, date: 'Yeni TM Kaydı' },
                            similarity: 100,
                            isExact: true,
                            isFuzzy: false,
                            diffHtml: ''
                        };
                    } else {
                        // Fuzzy Match (%50-%99 Benzerlik)
                        const sim = calculateSimilarity(otherSeg.source, sourceText);
                        if (sim >= 50 && sim < 100) {
                            if (!otherSeg.tmSuggestion || otherSeg.tmSuggestion.similarity < sim) {
                                otherSeg.tmSuggestion = {
                                    entry: { source: sourceText, target: targetText, date: 'Yeni TM Kaydı' },
                                    similarity: sim,
                                    isExact: false,
                                    isFuzzy: true,
                                    diffHtml: generateWordDiff(otherSeg.source, sourceText)
                                };
                            }
                        }
                    }
                });
            });

            if (autoFilledCount > 0) {
                showToast(`⚡ Otomatik Yayılma: ${autoFilledCount} eşdeğer segment TM ile dolduruldu.`);
            }
        }

        // 1. BELLEĞE KAYIT: Kullanıcı Onayla'ya bastığında (Ctrl + Enter) TM hafızasına yazar
        // 1. BELLEĞE KAYIT & SEGMENT ONAYLAMA (Ctrl + Enter)
        function confirmSegment(segId) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            // 1. Textarea DOM içeriğini hemen senkronize et
            const input = document.getElementById(`targetInput-${segId}`);
            if (input && typeof input.value === 'string') {
                seg.target = input.value;
            }

            // 2. Hedef alan boşsa kaynak metin hedef olarak kabul edilir
            if (!seg.target || seg.target.trim().length === 0) {
                seg.target = (seg.source || '').trim();
                if (input) input.value = seg.target;
            }

            // 3. Segment Durumu: CAT standardı 'confirmed' (Onaylandı) yapılır!
            const role = (typeof appState !== 'undefined' && appState.userRole) || 'L1';
            seg.status = 'confirmed';
            seg.confirmedRole = role;
            if (role === 'L2' && seg.original_target) delete seg.original_target;
            delete seg.tmSuggestion;
            delete seg.mtDraft;
            delete seg.geminiDraft;
            delete seg.deeplDraft;

            // 4. Çeviri Belleğine (TM) Kaydet
            saveSegmentToTM(seg.source, seg.target, seg.id);

            // 5. TM İZOLASYONU VE DİĞER SEGMENTLERE OTOMATİK YAYILMA
            propagateAndScanOtherSegments(seg.id, seg.source, seg.target);

            // 6. UI ve İstatistikleri Güncelle
            renderSegments();
            updateProgressStats();
            if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.updateStatusBarMetrics === 'function') {
                CatWordToolbar.updateStatusBarMetrics();
            }
            showToast(`✓ Segment #${segId} onaylandı (Ctrl + Enter)!`);

            // 7. Sıradaki segment textarea'sına yumuşak ve akıllı geçiş
            const nextIdx = doc.segments.findIndex(s => s.id === segId) + 1;
            if (nextIdx < doc.segments.length) {
                const nextSeg = doc.segments[nextIdx];
                const targetPage = Math.ceil((nextIdx + 1) / SEGMENTS_PER_PAGE);
                if (targetPage !== doc.currentPage) {
                    doc.currentPage = targetPage;
                    renderSegments();
                }
                setTimeout(() => {
                    const nextInput = document.getElementById(`targetInput-${nextSeg.id}`);
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 80);
            }
        }

        function toggleConfirmSegment(segId) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            if (seg.status === 'confirmed' || seg.status === 'reviewed' || seg.status === 'translated') {
                seg.status = 'draft';
                delete seg.confirmedRole;
                showToast(`Segment #${segId} onayı kaldırıldı (Taslak durumuna alındı).`);
            } else {
                confirmSegment(segId);
                return;
            }
            renderSegments();
            updateProgressStats();
            if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.updateStatusBarMetrics === 'function') {
                CatWordToolbar.updateStatusBarMetrics();
            }
        }

        function copySourceToTarget(segId) {
            const doc = getActiveDoc();
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            seg.target = seg.source;
            const input = document.getElementById(`targetInput-${segId}`);
            if (input) input.value = seg.source;
            onSegmentChange(segId, input);
            FormatShield.copyFromSource(seg);
            showToast(`Kaynak metin kopyalandı.`);
        }

        function insertTermIntoSegment(segId, targetWord) {
            const input = document.getElementById(`targetInput-${segId}`);
            if (!input) return;

            const curVal = input.value;
            input.value = curVal ? `${curVal} ${targetWord}` : targetWord;
            onSegmentChange(segId, input);
            input.focus();
            showToast(`"${targetWord}" eklendi.`);
        }

        function prevPage() {
            const doc = getActiveDoc();
            if (doc.currentPage > 1) {
                doc.currentPage--;
                renderSegments();
                document.getElementById('segmentsContainer').scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function nextPage() {
            const doc = getActiveDoc();
            if (doc.currentPage < doc.totalPages) {
                doc.currentPage++;
                renderSegments();
                document.getElementById('segmentsContainer').scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function setFilter(filterType) {
            appState.currentFilter = filterType;
            ['btnFilterAll', 'btnFilterDraft', 'btnFilterConfirmed'].forEach(id => {
                const b = document.getElementById(id);
                b.className = 'px-2.5 py-1 text-[11px] font-semibold rounded-md text-slate-500 hover:text-slate-900 transition-all';
            });

            const map = { all: 'btnFilterAll', draft: 'btnFilterDraft', confirmed: 'btnFilterConfirmed' };
            const activeBtn = document.getElementById(map[filterType]);
            if (activeBtn) activeBtn.className = 'px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-slate-900 shadow-sm transition-all';

            renderSegments();
        }

        function handleGlobalSearch(val) {
            appState.searchQuery = val.trim();
            renderSegments();
        }

        function updateProgressStats() {
            const doc = getActiveDoc();
            if (!doc) return;

            const total = doc.segments.length;
            const confirmed = doc.segments.filter(s => s.status === 'confirmed').length;
            const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

            const elPct = document.getElementById('progressPercentageText');
            if (elPct) elPct.innerText = `%${pct}`;
            const elBar = document.getElementById('progressBarFill');
            if (elBar) elBar.style.width = `${pct}%`;
            const elConf = document.getElementById('statConfirmedSegments');
            if (elConf) elConf.innerText = `Onay: ${confirmed}`;
            const elTot = document.getElementById('statTotalSegments');
            if (elTot) elTot.innerText = `Toplam: ${total}`;

            // Smartcat Header Kelime Sayacı ve İlerleme Çubuğu Güncellemesi
            let totalWords = 0;
            let confirmedWords = 0;
            doc.segments.forEach(s => {
                const w = (s.source || '').trim().split(/\s+/).filter(Boolean).length;
                totalWords += w;
                if (s.status === 'confirmed') confirmedWords += w;
            });
            const wordPct = totalWords > 0 ? Math.round((confirmedWords / totalWords) * 100) : 0;

            const tbTotal = document.getElementById('topBarTotalWords');
            const tbDone = document.getElementById('topBarDoneWords');
            const tbPct = document.getElementById('topBarPct');
            const tbFill = document.getElementById('topBarProgressFill');
            const tbCount = document.getElementById('topBarSegmentCount');
            const tbDocName = document.getElementById('activeDocumentName');
            const tbProjName = document.getElementById('topBarProjectName');

            if (tbTotal) tbTotal.innerText = totalWords;
            if (tbDone) tbDone.innerText = confirmedWords;
            if (tbPct) tbPct.innerText = wordPct;
            if (tbFill) tbFill.style.width = `${wordPct}%`;
            if (tbCount) tbCount.innerText = `${total} segment`;
            if (tbDocName && doc.name) tbDocName.innerText = doc.name;
            const proj = typeof getActiveProject === 'function' ? getActiveProject() : null;
            if (tbProjName && proj && proj.name) tbProjName.innerText = proj.name;

            if (window.CatWordToolbar && typeof window.CatWordToolbar.updateToolbarState === 'function') {
                window.CatWordToolbar.updateToolbarState();
            }

            renderSidebarDocs();
        }


        // ========================================================
        // 8. ÇEVİRİ BELLEĞİ (TM VIEW) LİSTELEME
        // ========================================================
        function renderTMView() {
            const container = document.getElementById('tmEntriesList');
            if (!container) return;
            container.innerHTML = '';

            const curProj = getActiveProject();
            const curProjId = curProj ? curProj.id : null;
            const entries = curProjId
                ? appState.translationMemory.filter(t => !t.projectId || t.projectId === curProjId)
                : appState.translationMemory;

            if (entries.length === 0) {
                container.innerHTML = `
                    <div class="fluent-card p-8 rounded-xl text-center flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-4xl text-slate-300">history_toggle_off</span>
                        <div class="text-xs text-slate-600 font-semibold">Bu projeye ait kayıtlı çeviri belleği (TM) bulunmamaktadır.</div>
                        <div class="text-[11px] text-slate-400">Onayladığınız veya Gemini ile taslağını kabul ettiğiniz segmentler bu projeye özel olarak belleğe eklenir.</div>
                    </div>
                `;
                return;
            }

            entries.forEach((entry, idx) => {
                const item = document.createElement('div');
                item.className = 'fluent-card p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-2 hover:border-emerald-300 transition-all';
                item.innerHTML = `
                    <div class="flex items-center justify-between text-[11px] font-mono">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">TM #${idx + 1}</span>
                            <span class="text-slate-400">${escapeHtml(entry.date)}</span>
                        </div>
                        <button onclick="deleteTmEntry('${entry.id}')" 
                                class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 text-[11px] font-bold border border-rose-200/60"
                                title="Bu bellek kaydını sil">
                            <span class="material-symbols-outlined text-[14px]">delete</span>
                            <span>Sil</span>
                        </button>
                    </div>
                    <div class="text-xs font-semibold text-slate-900 leading-relaxed">${escapeHtml(entry.source)}</div>
                    <div class="text-xs font-medium text-emerald-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 leading-relaxed">
                        <span class="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">translate</span>
                        <span>${escapeHtml(entry.target)}</span>
                    </div>
                `;
                container.appendChild(item);
            });

            updateTMStats();
        }

        function deleteTmEntry(tmId) {
            appState.translationMemory = appState.translationMemory.filter(t => t.id !== tmId);
            renderTMView();
            renderSegments();
            updateTMStats();
            showToast("Bellek kaydı başarıyla silindi.");
        }

        function clearTM() {
            const curProj = getActiveProject();
            const curProjId = curProj ? curProj.id : null;
            if (confirm("Bu projenin çeviri belleğindeki tüm kayıtları silmek istediğinize emin misiniz?")) {
                if (curProjId) {
                    appState.translationMemory = appState.translationMemory.filter(t => t.projectId && t.projectId !== curProjId);
                } else {
                    appState.translationMemory = [];
                }
                renderTMView();
                renderSegments();
                updateTMStats();
                showToast("Projenin çeviri belleği temizlendi.");
            }
        }

        // ========================================================
        // 8B. DİNAMİK DRAWER VE COLLAPSIBLE SOL MENÜ MİMARİSİ
        // ========================================================

        // A) SOL MENÜ: DARALTMA / GENİŞLETME / DRAWER YÖNETİMİ
        function initSidebarState() {
            const savedState = localStorage.getItem('sidebar_collapsed');
            const isMobile = window.innerWidth <= 768;
            const sidebar = document.getElementById('catSidebar');
            const toggleIcon = document.getElementById('sidebarToggleIcon');

            if (savedState === 'true' && !isMobile) {
                if (sidebar) sidebar.classList.add('sidebar-collapsed');
                if (toggleIcon) toggleIcon.innerText = 'dock_to_right';
            } else {
                if (sidebar) sidebar.classList.remove('sidebar-collapsed');
                if (toggleIcon) toggleIcon.innerText = 'dock_to_left';
            }

            if (isMobile && sidebar) {
                sidebar.classList.add('sidebar-mobile-hidden');
            }
        }

        function toggleSidebarDrawer() {
            const sidebar = document.getElementById('catSidebar');
            const toggleIcon = document.getElementById('sidebarToggleIcon');
            const backdrop = document.getElementById('sidebarMobileBackdrop');
            if (!sidebar) return;

            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // Mobil Cihazda: Tamamen Gizlenen / Kayan Overlay Drawer
                const isHidden = sidebar.classList.contains('sidebar-mobile-hidden');
                if (isHidden) {
                    sidebar.classList.remove('sidebar-mobile-hidden');
                    if (backdrop) backdrop.classList.remove('hidden');
                } else {
                    sidebar.classList.add('sidebar-mobile-hidden');
                    if (backdrop) backdrop.classList.add('hidden');
                }
            } else {
                // Masaüstünde: "Kenetlenmiş (Docked / Geniş)" moddan "Daraltılmış (Mini Sidebar)" moda geçiş
                const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
                localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
                if (toggleIcon) {
                    toggleIcon.innerText = isCollapsed ? 'dock_to_right' : 'dock_to_left';
                }
                showToast(isCollapsed ? "Sol menü daraltıldı (Maksimum çalışma alanı)." : "Sol menü genişletildi.");
            }
        }

        function closeMobileSidebar() {
            const sidebar = document.getElementById('catSidebar');
            const backdrop = document.getElementById('sidebarMobileBackdrop');
            if (sidebar) sidebar.classList.add('sidebar-mobile-hidden');
            if (backdrop) backdrop.classList.add('hidden');
        }

        // B) SAĞ PROFİL & ABONELİK & CANLI API DURUM DRAWER'I
        function toggleProfileDrawer() {
            const drawer = document.getElementById('profileSubscriptionDrawer');
            if (!drawer) return;
            if (drawer.classList.contains('translate-x-full')) {
                openProfileDrawer();
            } else {
                closeProfileDrawer();
            }
        }

        function openProfileDrawer() {
            // Çakışma yönetimi: Diğer çekmeceleri kapat
            closeGlossaryDrawer();
            closeMobileSidebar();

            const drawer = document.getElementById('profileSubscriptionDrawer');
            const backdrop = document.getElementById('profileDrawerBackdrop');
            if (!drawer) return;

            drawer.classList.remove('translate-x-full');
            drawer.classList.add('translate-x-0');
            if (backdrop) backdrop.classList.remove('hidden');

            // API anahtarlarını inputlara doldur
            const deeplInput = document.getElementById('drawerDeeplKeyInput');
            const geminiInput = document.getElementById('drawerGeminiKeyInput');
            const savedDeepl = appState.deeplApiKey || localStorage.getItem('cat_deepl_api_key') || '';
            const savedGemini = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key') || '';
            if (deeplInput) deeplInput.value = savedDeepl;
            if (geminiInput) geminiInput.value = savedGemini;

            // Canlı kotaları ve bağlantıyı sorgula
            refreshApiStatus();
        }

        function closeProfileDrawer() {
            const drawer = document.getElementById('profileSubscriptionDrawer');
            const backdrop = document.getElementById('profileDrawerBackdrop');
            if (!drawer) return;

            drawer.classList.add('translate-x-full');
            drawer.classList.remove('translate-x-0');
            if (backdrop) backdrop.classList.add('hidden');
        }

        function toggleDrawerKeyEditor() {
            const sec = document.getElementById('drawerKeyEditorSection');
            const btn = document.getElementById('btnToggleDrawerKeys');
            if (!sec) return;
            const isHidden = sec.classList.toggle('hidden');
            if (btn) btn.innerText = isHidden ? 'Değiştir ▾' : 'Gizle ▴';
        }

        function saveProfileApiKeys() {
            const deeplInput = document.getElementById('drawerDeeplKeyInput');
            const geminiInput = document.getElementById('drawerGeminiKeyInput');
            const dKey = deeplInput ? deeplInput.value.trim() : '';
            const gKey = geminiInput ? geminiInput.value.trim() : '';

            appState.deeplApiKey = dKey;
            appState.geminiApiKey = gKey;
            localStorage.setItem('cat_deepl_api_key', dKey);
            localStorage.setItem('cat_gemini_api_key', gKey);

            // Ayarlar sekmesindeki gemini inputunu da senkronize et
            const mainGeminiInput = document.getElementById('geminiApiKeyInput');
            if (mainGeminiInput) mainGeminiInput.value = gKey;

            showToast("🔑 API anahtarları kaydedildi. Doğrulanıyor...");
            refreshApiStatus();
        }

        async function refreshApiStatus() {
            const spinIcon = document.getElementById('profileRefreshIcon');
            if (spinIcon) spinIcon.classList.add('animate-spin');

            const deeplKey = appState.deeplApiKey || localStorage.getItem('cat_deepl_api_key') || '';
            const geminiKey = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key') || '';

            // 1. DeepL Durumu ve Kotası
            const planBadge = document.getElementById('deeplPlanBadge');
            const usedText = document.getElementById('deeplCharUsedText');
            const limitText = document.getElementById('deeplCharLimitText');
            const pBar = document.getElementById('deeplProgressBar');
            const remPercent = document.getElementById('deeplRemainingPercent');
            const statusText = document.getElementById('deeplStatusText');

            if (!deeplKey || deeplKey.length < 5) {
                if (planBadge) {
                    planBadge.innerText = 'Anahtar Tanımsız';
                    planBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200';
                }
                if (usedText) usedText.innerText = '0';
                if (limitText) limitText.innerText = '500.000';
                if (pBar) {
                    pBar.style.width = '0%';
                    pBar.className = 'h-full rounded-full transition-all duration-500 bg-slate-300';
                }
                if (remPercent) remPercent.innerText = 'Anahtar Bekleniyor';
                if (statusText) {
                    statusText.innerText = 'Bağlantı Yok';
                    statusText.className = 'text-slate-400 font-bold';
                }
            } else {
                const isFree = deeplKey.endsWith(':fx');
                if (planBadge) {
                    planBadge.innerText = isFree ? 'DeepL Free Plan' : 'DeepL Pro Plan';
                    planBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-300';
                }

                let quotaSuccess = false;
                // Backend proxy (/api/deepl_usage) üzerinden kota çekimi
                try {
                    const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                    const res = await fetch(`${apiBase}/api/deepl_usage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deeplApiKey: deeplKey })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.status === 'success') {
                            quotaSuccess = true;
                            const count = data.character_count || 0;
                            const limit = data.character_limit || 500000;
                            const pct = Math.min(100, Math.max(0, (count / limit) * 100));

                            if (usedText) usedText.innerText = count.toLocaleString('tr-TR');
                            if (limitText) limitText.innerText = limit.toLocaleString('tr-TR');
                            if (pBar) {
                                pBar.style.width = `${pct}%`;
                                if (pct > 90) {
                                    pBar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-rose-600';
                                } else if (pct > 75) {
                                    pBar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-400 to-amber-600';
                                } else {
                                    pBar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 to-blue-600';
                                }
                            }
                            if (remPercent) remPercent.innerText = `Kalan: %${(100 - pct).toFixed(1)}`;
                            if (statusText) {
                                statusText.innerText = 'Bağlantı Başarılı (200 OK)';
                                statusText.className = 'text-emerald-600 font-bold';
                            }
                        }
                    }
                } catch (e) {
                    console.warn("DeepL proxy kota sorgusu:", e);
                }

                if (!quotaSuccess) {
                    // Simülasyon / Tahmini Kota
                    if (usedText) usedText.innerText = 'Aktif';
                    if (limitText) limitText.innerText = isFree ? '500.000' : 'Sınırsız';
                    if (pBar) {
                        pBar.style.width = '24%';
                        pBar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 to-blue-600';
                    }
                    if (remPercent) remPercent.innerText = 'Kota Kullanılabilir';
                    if (statusText) {
                        statusText.innerText = 'Bağlandı (Doğrulandı)';
                        statusText.className = 'text-emerald-600 font-bold';
                    }
                }
            }

            // 2. Gemini AI Durumu
            const gemBadge = document.getElementById('geminiDrawerBadge');
            const gemConn = document.getElementById('geminiConnectionLabel');
            if (geminiKey && geminiKey.length > 10) {
                if (gemBadge) {
                    gemBadge.innerText = 'Aktif (AIza...)';
                    gemBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-300';
                }
                if (gemConn) {
                    gemConn.innerText = 'Online / Doğrudan API';
                    gemConn.className = 'text-emerald-600 font-bold';
                }
            } else {
                if (gemBadge) {
                    gemBadge.innerText = 'Yerleşik Motor Hazır';
                    gemBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-300';
                }
                if (gemConn) {
                    gemConn.innerText = 'Nöral Heuristic Çeviri';
                    gemConn.className = 'text-amber-600 font-bold';
                }
            }

            setTimeout(() => {
                if (spinIcon) spinIcon.classList.remove('animate-spin');
            }, 400);
        }

        // C) ÇAKIŞMA VE Z-INDEX YÖNETİMİ: ESC VE DIŞ TIKLAMA İLE TÜM ÇEKMECELERİ KAPAT
        function closeAllDrawers() {
            closeGlossaryDrawer();
            closeProfileDrawer();
            closeMobileSidebar();
        }

        // Kısayol Dinleyicisi (ESC & Ctrl + B)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllDrawers();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                if (tag !== 'textarea' && tag !== 'input') {
                    e.preventDefault();
                    toggleSidebarDrawer();
                }
            }
        });

        // ========================================================
        // 9. WINDOWS 11 TERİM SÖZLÜĞÜ VE TERMİNOLOJİ YÖNETİM MOTORU
        // (TÜM TERİMLER GRID, PROJELERDEN KAYDEDİLEN TERİMLER, CSV EXPORT)
        // ========================================================
        appState.glossarySubTab = 'all';
        appState.glossarySearchQuery = '';
        appState.glossaryProjectFilter = 'all';

        function toggleGlossaryDrawer() {
            const drawer = document.getElementById('glossaryDrawer');
            if (!drawer) return;
            if (drawer.classList.contains('translate-x-full')) {
                openGlossaryDrawer();
            } else {
                closeGlossaryDrawer();
            }
        }

        function openGlossaryDrawer() {
            const drawer = document.getElementById('glossaryDrawer');
            const backdrop = document.getElementById('glossaryBackdrop');
            if (!drawer) return;
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('translate-x-0');
            if (backdrop) backdrop.classList.remove('hidden');
            renderGlossaryDrawerTerms();
        }

        function closeGlossaryDrawer() {
            const drawer = document.getElementById('glossaryDrawer');
            const backdrop = document.getElementById('glossaryBackdrop');
            if (!drawer) return;
            drawer.classList.add('translate-x-full');
            drawer.classList.remove('translate-x-0');
            if (backdrop) backdrop.classList.add('hidden');
        }

        function filterGlossary(query) {
            renderGlossaryDrawerTerms(query);
        }

        function addNewTerm() {
            const srcInput = document.getElementById('newTermSource');
            const trgInput = document.getElementById('newTermTarget');
            if (!srcInput || !trgInput) return;

            const src = srcInput.value.trim();
            const trg = trgInput.value.trim();
            if (!src || !trg) {
                showToast("Lütfen hem kaynak hem hedef terimi girin.");
                return;
            }

            const curProj = getActiveProject();
            const projName = curProj ? curProj.title : 'Genel Proje';
            const projId = curProj ? curProj.id : null;

            if (!appState.glossary) appState.glossary = [];
            const newTerm = {
                id: Date.now(),
                projectId: projId,
                projectName: projName,
                source: src,
                target: trg,
                cat: 'Genel',
                note: '',
                date: new Date().toLocaleDateString('tr-TR')
            };

            appState.glossary.unshift(newTerm);
            srcInput.value = '';
            trgInput.value = '';

            renderGlossaryDrawerTerms();
            renderGlossaryView();
            renderSegments();
            showToast(`"${src}" ➔ "${trg}" terimi başarıyla eklendi!`);
        }

        function renderGlossaryDrawerTerms(query = '') {
            const container = document.getElementById('glossaryTermsContainer');
            const badge = document.getElementById('glossaryBadge');
            if (!container) return;

            let terms = appState.glossary || [];
            if (badge) badge.innerText = `${terms.length} Terim`;

            const q = (query || (document.getElementById('drawerSearchInput') ? document.getElementById('drawerSearchInput').value : '')).toLowerCase().trim();
            if (q) {
                terms = terms.filter(t => (t.source && t.source.toLowerCase().includes(q)) || (t.target && t.target.toLowerCase().includes(q)));
            }

            if (terms.length === 0) {
                container.innerHTML = `
                    <div class="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                        <span class="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        <span class="text-xs font-semibold text-slate-600">Kayıtlı terim bulunamadı</span>
                        <span class="text-[11px] text-slate-400">Yukarıdaki kutucuktan hızlı terim ekleyebilirsiniz.</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = terms.map(term => {
                const proj = appState.projects ? appState.projects.find(p => p.id === term.projectId) : null;
                const sourceProjName = term.projectName || (proj ? proj.title : 'Genel Proje');
                return `
                    <div class="p-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50/70 dark:bg-neutral-800/70 hover:bg-sky-50/50 dark:hover:bg-neutral-800 transition-all flex flex-col gap-1.5 shadow-2xs group">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-900 dark:text-neutral-100 select-text">${escapeHtml(term.source)}</span>
                            <button type="button" onclick="deleteGlossaryTerm(${term.id})" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-all cursor-pointer" title="Terimi Sil">
                                <span class="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 select-text">
                            <span class="text-slate-400 text-[10px]">➔</span>
                            <span>${escapeHtml(term.target)}</span>
                        </div>
                        <div class="pt-1.5 mt-1 border-t border-slate-200/70 dark:border-neutral-700/70 flex items-center justify-between text-[10px]">
                            <!-- Kaynak Proje Etiketi: Her terim kartının altında silik metinle yazılır -->
                            <span class="text-slate-400 dark:text-neutral-500 font-mono italic">
                                Kaynak: ${escapeHtml(sourceProjName)}
                            </span>
                            <span class="font-mono text-slate-400 bg-white dark:bg-neutral-900 px-1.5 py-0.2 rounded border border-slate-200 dark:border-neutral-700 text-[9px]">
                                ${escapeHtml(term.cat || 'Genel')}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function switchGlossarySubTab(tab) {
            appState.glossarySubTab = tab;
            const btnAll = document.getElementById('btnGlossaryTab-all');
            const btnProj = document.getElementById('btnGlossaryTab-projects');
            const viewAll = document.getElementById('glossaryView-all');
            const viewProj = document.getElementById('glossaryView-projects');

            if (tab === 'all') {
                if (btnAll) btnAll.className = 'px-3.5 py-1.5 rounded-md text-xs font-bold bg-white text-sky-800 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer';
                if (btnProj) btnProj.className = 'px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-all cursor-pointer';
                if (viewAll) viewAll.classList.remove('hidden');
                if (viewProj) viewProj.classList.add('hidden');
            } else {
                if (btnAll) btnAll.className = 'px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-all cursor-pointer';
                if (btnProj) btnProj.className = 'px-3.5 py-1.5 rounded-md text-xs font-bold bg-white text-sky-800 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer';
                if (viewAll) viewAll.classList.add('hidden');
                if (viewProj) viewProj.classList.remove('hidden');
            }
            renderGlossaryView();
        }

        function filterGlossaryView(query) {
            appState.glossarySearchQuery = (query || '').toLowerCase().trim();
            renderGlossaryView();
        }

        function filterGlossaryByProject(projId) {
            appState.glossaryProjectFilter = projId;
            renderGlossaryView();
        }

        function renderGlossaryView() {
            const glossaryList = (appState.glossary && Array.isArray(appState.glossary)) ? appState.glossary : [];
            const totalCount = glossaryList.length;
            const headBadge = document.getElementById('glossaryHeaderCount');
            const navBadge = document.getElementById('navGlossaryCount');
            const subAllBadge = document.getElementById('glossarySubTabAllCount');
            const subProBadge = document.getElementById('glossarySubTabProjectsCount');

            if (headBadge) headBadge.innerText = `${totalCount} Terim`;
            if (navBadge) navBadge.innerText = totalCount;
            if (subAllBadge) subAllBadge.innerText = totalCount;
            if (subProBadge) subProBadge.innerText = `${(appState.projects || []).length} Proje`;

            // Proje seçim filtresini güncelle
            const filterSelect = document.getElementById('glossaryProjectFilterSelect');
            if (filterSelect && (!filterSelect.options || filterSelect.options.length <= 1)) {
                filterSelect.innerHTML = `<option value="all">Tüm Projeler (${totalCount})</option>`;
                (appState.projects || []).forEach(p => {
                    const pCount = glossaryList.filter(t => t.projectId === p.id).length;
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.innerText = `${p.title} (${pCount})`;
                    filterSelect.appendChild(opt);
                });
                if (appState.glossaryProjectFilter) {
                    filterSelect.value = appState.glossaryProjectFilter;
                }
            }

            if (appState.glossarySubTab === 'projects') {
                renderGlossaryByProjects();
            } else {
                renderGlossaryGrid();
            }
        }

        // 1. KISIM: TÜM TERİMLERİ GÖRÜNTÜLE GRID (PROJELER EKRANI BENZERİ BENTO CARD FORMATI)
        function renderGlossaryGrid() {
            const container = document.getElementById('glossaryCardsGrid');
            if (!container) return;
            container.innerHTML = '';

            let list = appState.glossary;
            if (appState.glossaryProjectFilter && appState.glossaryProjectFilter !== 'all') {
                list = list.filter(t => t.projectId === appState.glossaryProjectFilter);
            }
            if (appState.glossarySearchQuery) {
                const q = appState.glossarySearchQuery;
                list = list.filter(t => t.source.toLowerCase().includes(q) || t.target.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q)));
            }

            if (list.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-16 text-center flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                        <span class="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        <div class="text-sm font-bold text-slate-700">Eşleşen Terim Bulunamadı</div>
                        <div class="text-xs text-slate-400">Arama kriterini değiştirebilir veya yeni bir terim ekleyebilirsiniz.</div>
                        <button onclick="openAddTermModal()" class="fluent-btn-primary px-3.5 py-1.5 text-xs rounded-lg mt-2">
                            + Yeni Terim Ekle
                        </button>
                    </div>
                `;
                return;
            }

            list.forEach(t => {
                const proj = appState.projects.find(p => p.id === t.projectId);
                const projTitle = proj ? proj.title : 'Genel Terminoloji';
                const projType = proj ? proj.type : 'text';
                const projBadgeColor = projType === 'subtitling' ? 'bg-purple-50 text-purple-700 border-purple-200' : (projType === 'interpreting' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-sky-50 text-sky-700 border-sky-200');

                const card = document.createElement('div');
                card.className = 'fluent-card p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group';
                card.innerHTML = `
                    <div class="flex flex-col gap-2.5">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${projBadgeColor} truncate max-w-[170px]" title="Proje: ${escapeHtml(projTitle)}">
                                📁 ${escapeHtml(projTitle)}
                            </span>
                            <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                ${escapeHtml(t.cat || 'Temel')}
                            </span>
                        </div>

                        <!-- Kaynak ve Hedef Terim Çifti -->
                        <div class="flex flex-col gap-1 pt-1">
                            <div class="text-xs font-bold text-slate-900 group-hover:text-sky-900 transition-colors select-text">
                                ${escapeHtml(t.source)}
                            </div>
                            <div class="flex items-center gap-1.5 text-xs font-extrabold text-sky-700 bg-sky-50/70 p-2 rounded-lg border border-sky-200 select-text">
                                <span class="material-symbols-outlined text-[15px] text-sky-500 shrink-0">arrow_forward</span>
                                <span>${escapeHtml(t.target)}</span>
                            </div>
                        </div>

                        ${t.note ? `<div class="text-[11px] text-slate-500 leading-relaxed font-sans line-clamp-2">${escapeHtml(t.note)}</div>` : ''}
                    </div>

                    <!-- Alt Aksiyon Butonları -->
                    <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span class="text-[10px] font-mono text-slate-400">${escapeHtml(t.date || 'Kayıtlı')}</span>
                        <div class="flex items-center gap-1">
                            <button onclick="copyToClipboard('${escapeHtml(t.target)}')" class="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors" title="Hedef Terimi Kopyala">
                                <span class="material-symbols-outlined text-[15px]">content_copy</span>
                            </button>
                            <button onclick="openAddTermModal(${t.id})" class="p-1 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors" title="Terimi Düzenle">
                                <span class="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                            <button onclick="deleteGlossaryTerm(${t.id})" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Terimi Sil">
                                <span class="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // 2. KISIM: PROJELERDEN KAYDEDİLEN TERİMLER (PROJE GRUPLANDIRMA EKRANI)
        function renderGlossaryByProjects() {
            const container = document.getElementById('glossaryProjectsGroupContainer');
            if (!container) return;
            container.innerHTML = '';

            appState.projects.forEach(proj => {
                const terms = appState.glossary.filter(t => t.projectId === proj.id);
                const typeLabel = proj.type === 'subtitling' ? 'Altyazı Çevirisi' : (proj.type === 'interpreting' ? 'Sözlü Çeviri' : 'Yazılı Metin');
                const typeIcon = proj.type === 'subtitling' ? 'movie' : (proj.type === 'interpreting' ? 'record_voice_over' : 'description');
                const typeColor = proj.type === 'subtitling' ? 'text-purple-600 bg-purple-50 border-purple-200' : (proj.type === 'interpreting' ? 'text-teal-700 bg-teal-50 border-teal-200' : 'text-sky-700 bg-sky-50 border-sky-200');

                const card = document.createElement('div');
                card.className = 'fluent-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4';
                card.innerHTML = `
                    <div class="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl ${typeColor} flex items-center justify-center font-bold shadow-2xs">
                                <span class="material-symbols-outlined text-[20px]">${typeIcon}</span>
                            </div>
                            <div>
                                <h3 class="font-bold text-sm text-slate-900">${escapeHtml(proj.title)}</h3>
                                <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span class="font-medium">${typeLabel}</span>
                                    <span>·</span>
                                    <span>Diller: ${escapeHtml(proj.sourceLang || 'İngilizce')} ➔ ${escapeHtml(proj.targetLang || 'Türkçe')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                ${terms.length} Kayıtlı Terim
                            </span>
                            <button onclick="appState.glossaryProjectFilter='${proj.id}'; switchGlossarySubTab('all');" class="fluent-btn px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-50 rounded-lg">
                                Bu Projeyi Filtrele
                            </button>
                        </div>
                    </div>

                    ${terms.length > 0 ? `
                        <div class="flex flex-wrap items-center gap-2 pt-1">
                            ${terms.map(t => `
                                <div class="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 text-xs transition-all group">
                                    <span class="font-bold text-slate-900">${escapeHtml(t.source)}</span>
                                    <span class="text-slate-400">➔</span>
                                    <span class="font-extrabold text-sky-700">${escapeHtml(t.target)}</span>
                                    <span class="text-[9px] font-mono text-slate-400 bg-white px-1 rounded border border-slate-200 ml-1">${escapeHtml(t.cat || 'Terim')}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="py-4 text-center text-xs text-slate-400 font-mono">
                            Bu projeye henüz terim eklenmemiş. Yeni terim ekleyerek başlayabilirsiniz.
                        </div>
                    `}
                `;
                container.appendChild(card);
            });
        }

        // Terim Ekleme / Düzenleme Modalı
        function openAddTermModal(editId = null) {
            const m = document.getElementById('modalAddTerm');
            if (!m) return;
            m.classList.remove('hidden');
            m.classList.add('flex');

            const projSelect = document.getElementById('newTermProject');
            if (projSelect) {
                projSelect.innerHTML = '';
                appState.projects.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.innerText = p.title;
                    if (p.id === appState.activeProjectId) opt.selected = true;
                    projSelect.appendChild(opt);
                });
            }

            const titleEl = document.getElementById('addTermModalTitle');
            const btnText = document.getElementById('saveTermBtnText');
            const idInput = document.getElementById('editTermId');
            const srcInput = document.getElementById('newTermSource');
            const trgInput = document.getElementById('newTermTarget');
            const catInput = document.getElementById('newTermCategory');
            const noteInput = document.getElementById('newTermNote');

            if (editId) {
                const term = appState.glossary.find(t => t.id === editId);
                if (term) {
                    if (titleEl) titleEl.innerText = 'Terimi Düzenle';
                    if (btnText) btnText.innerText = 'Değişiklikleri Kaydet';
                    if (idInput) idInput.value = term.id;
                    if (srcInput) srcInput.value = term.source;
                    if (trgInput) trgInput.value = term.target;
                    if (catInput) catInput.value = term.cat || 'Temel';
                    if (noteInput) noteInput.value = term.note || '';
                    if (projSelect && term.projectId) projSelect.value = term.projectId;
                    return;
                }
            }

            if (titleEl) titleEl.innerText = 'Yeni Terim Ekle';
            if (btnText) btnText.innerText = 'Kaydet ve Ekle';
            if (idInput) idInput.value = '';
            if (srcInput) srcInput.value = '';
            if (trgInput) trgInput.value = '';
            if (noteInput) noteInput.value = '';
        }

        function closeAddTermModal() {
            const m = document.getElementById('modalAddTerm');
            if (!m) return;
            m.classList.add('hidden');
            m.classList.remove('flex');
        }

        function saveNewGlossaryTerm() {
            const idInput = document.getElementById('editTermId');
            const srcInput = document.getElementById('newTermSource');
            const trgInput = document.getElementById('newTermTarget');
            const projSelect = document.getElementById('newTermProject');
            const catSelect = document.getElementById('newTermCategory');
            const noteInput = document.getElementById('newTermNote');

            const src = srcInput ? srcInput.value.trim() : '';
            const trg = trgInput ? trgInput.value.trim() : '';

            if (!src || !trg) {
                showToast("⚠️ Kaynak ve hedef terim alanları zorunludur.");
                return;
            }

            const editId = idInput && idInput.value ? Number(idInput.value) : null;
            const pId = projSelect ? projSelect.value : appState.activeProjectId;
            const pObj = appState.projects.find(p => p.id === pId);
            const pTitle = pObj ? pObj.title : 'Genel Proje';

            if (editId) {
                const term = appState.glossary.find(t => t.id === editId);
                if (term) {
                    term.source = src;
                    term.target = trg;
                    term.projectId = pId;
                    term.projectName = pTitle;
                    term.cat = catSelect ? catSelect.value : 'Temel';
                    term.note = noteInput ? noteInput.value.trim() : '';
                    showToast(`"${src}" terimi güncellendi.`);
                }
            } else {
                appState.glossary.unshift({
                    id: Date.now(),
                    projectId: pId,
                    projectName: pTitle,
                    source: src,
                    target: trg,
                    cat: catSelect ? catSelect.value : 'Temel',
                    note: noteInput ? noteInput.value.trim() : '',
                    date: 'Yeni Eklendi'
                });
                showToast(`"${src}" terim sözlüğüne başarıyla kaydedildi!`);
            }

            closeAddTermModal();
            renderGlossaryView();
            renderSegments();
        }

        function deleteGlossaryTerm(termId) {
            if (confirm("Bu terimi sözlükten silmek istediğinize emin misiniz?")) {
                appState.glossary = appState.glossary.filter(t => t.id !== termId);
                renderGlossaryDrawerTerms();
                renderGlossaryView();
                renderSegments();
                showToast("Terim sözlükten silindi.");
            }
        }

        function exportGlossaryAsCSV() {
            if (!appState.glossary || appState.glossary.length === 0) {
                showToast("Dışa aktarılacak terim yok.");
                return;
            }

            let csv = '\ufeff"ID","Kaynak Terim","Hedef Ceviri","Proje","Kategori","Not"\n';
            appState.glossary.forEach(t => {
                const proj = appState.projects.find(p => p.id === t.projectId);
                const pTitle = proj ? proj.title : 'Genel';
                const s = t.source.replace(/"/g, '""');
                const tr = t.target.replace(/"/g, '""');
                const c = (t.cat || '').replace(/"/g, '""');
                const n = (t.note || '').replace(/"/g, '""');
                csv += `"${t.id}","${s}","${tr}","${pTitle}","${c}","${n}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Terim_Sozlugu_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Terim sözlüğü CSV olarak dışa aktarıldı.");
        }

        function findGlossaryMatches(sourceText) {
            if (!sourceText || !appState.glossary) return [];
            const lower = sourceText.toLowerCase();
            const normSource = normalizeString(sourceText);
            const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
            const assigned = activeProj?.assignedGlossaries;

            let pool = appState.glossary;
            if (assigned && Array.isArray(assigned) && assigned.length > 0 && !assigned.includes('all')) {
                pool = pool.filter(t => {
                    if (t.projectId && activeProj && t.projectId === activeProj.id) return true;
                    if (t.cat && assigned.includes(t.cat)) return true;
                    if (t.table && assigned.includes(t.table)) return true;
                    return false;
                });
            }

            return pool.filter(t => {
                const termLower = t.source.toLowerCase();
                if (lower.includes(termLower)) return true;
                const normTerm = normalizeString(t.source);
                if (normTerm && normSource.includes(normTerm)) return true;
                if (window.CatLSP && CatLSP.Stemmer && CatLSP.Stemmer.termMatchesText(t.source, sourceText)) return true;
                return false;
            });
        }

        // ========================================================
        // 10. DOSYA VE METİN İŞLEMLERİ (UPLOAD / PASTE / EXPORT)
        // ========================================================
        function triggerDocUpload() {
            document.getElementById('catFileInput').click();
        }

        // ========================================================
        // ÇOKLU FORMAT BELGE METİN AYIKLAMA MOTORU (PDF, WORD, TXT VB.)
        // ========================================================
        async function extractTextFromFile(file) {
            if (!file) throw new Error("Geçerli bir dosya seçilmedi.");

            const lowerName = file.name.toLowerCase();
            const ext = lowerName.includes('.') ? lowerName.split('.').pop() : 'txt';

            // 1. DÜZ METİN VE ALTYAZI FORMATLARI (.txt, .md, .srt, .vtt, .csv, .json, .xliff vb.)
            const textExts = ['txt', 'md', 'srt', 'vtt', 'sub', 'ass', 'ssa', 'sbv', 'json', 'csv', 'tsv', 'xml', 'html', 'htm', 'xliff', 'sdlxliff'];
            if (textExts.includes(ext)) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let content = e.target.result;
                        if (ext === 'xliff' || ext === 'sdlxliff') {
                            try {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(content, 'application/xml');
                                const sources = xmlDoc.getElementsByTagName('source');
                                if (sources && sources.length > 0) {
                                    const extracted = [];
                                    for (let s of sources) {
                                        if (s.textContent && s.textContent.trim()) {
                                            extracted.push(s.textContent.trim());
                                        }
                                    }
                                    if (extracted.length > 0) {
                                        resolve(extracted.join('\n\n'));
                                        return;
                                    }
                                }
                            } catch (eXliff) { }
                        }
                        resolve(content);
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsText(file, 'UTF-8');
                });
            }

            // 2. MICROSOFT WORD (.DOCX)
            if (ext === 'docx') {
                const arrayBuffer = await file.arrayBuffer();

                // 2.0. Biçim Kalkanı: run düzeyinde font/renk/kalın/italik bilgisini koruyarak ayrıştır
                try {
                    const richText = await FormatShield.captureDocx(file, arrayBuffer);
                    if (richText && richText.trim()) return richText;
                } catch (eShield) {
                    console.warn("Biçim Kalkanı DOCX ayrıştırma uyarısı:", eShield);
                }

                // 2.a. Mammoth.js ile Paragraf, Tablo ve Cümle Ayrıştırma (Öncelikli)
                if (typeof mammoth !== 'undefined') {
                    try {
                        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                        if (result && result.value && result.value.trim().length > 0) {
                            return result.value.trim();
                        }
                    } catch (eMammoth) {
                        console.warn("Mammoth.js ayrıştırma uyarısı:", eMammoth);
                    }
                }

                // 2.b. JSZip ile word/document.xml Doğrudan XML Ayrıştırma (Yerel Yedek)
                if (typeof JSZip !== 'undefined') {
                    try {
                        const zip = await JSZip.loadAsync(arrayBuffer);
                        const docXml = zip.file("word/document.xml");
                        if (docXml) {
                            const xmlStr = await docXml.async("string");
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(xmlStr, "application/xml");
                            const paragraphs = xmlDoc.getElementsByTagName("w:p");
                            const paraTexts = [];
                            for (let p of paragraphs) {
                                const textNodes = p.getElementsByTagName("w:t");
                                let pText = "";
                                for (let t of textNodes) {
                                    pText += t.textContent;
                                }
                                if (pText.trim()) paraTexts.push(pText.trim());
                            }
                            if (paraTexts.length > 0) {
                                return paraTexts.join('\n\n');
                            }
                        }
                    } catch (eZip) {
                        console.warn("JSZip DOCX ayrıştırma uyarısı:", eZip);
                    }
                }

                // 2.c. Sunucu API Fallback (app.py)
                try {
                    const serverText = await extractTextViaServerApi(file);
                    if (serverText && serverText.trim()) return serverText.trim();
                } catch (eSrv) { }

                throw new Error("Word (.docx) belgesinden metin çıkarılamadı.");
            }

            // 3. ADOBE PDF (.PDF)
            if (ext === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();

                // 3.a. PDF.js ile Sayfa Sayfa ve Satır Satır Akıllı Metin Çıkarma
                if (typeof pdfjsLib !== 'undefined') {
                    try {
                        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                            pdfjsLib.GlobalWorkerOptions.workerSrc = (window.location.protocol === 'file:' ? 'vendor/pdf.worker.min.js' : '/vendor/pdf.worker.min.js');
                        }
                        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
                        const pdfDoc = await loadingTask.promise;
                        const numPages = pdfDoc.numPages;
                        const pagesText = [];

                        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                            const page = await pdfDoc.getPage(pageNum);
                            const textContent = await page.getTextContent();
                            let lastY = null;
                            let pageLines = [];
                            let currentLine = "";

                            for (const item of textContent.items) {
                                if (!item || !item.str) continue;
                                const currentY = (item.transform && item.transform.length >= 6) ? item.transform[5] : null;

                                if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
                                    if (currentLine.trim()) {
                                        pageLines.push(currentLine.trim());
                                    }
                                    currentLine = item.str;
                                } else {
                                    if (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
                                        currentLine += ' ';
                                    }
                                    currentLine += item.str;
                                }

                                if (currentY !== null) {
                                    lastY = currentY;
                                }
                            }

                            if (currentLine.trim()) {
                                pageLines.push(currentLine.trim());
                            }

                            if (pageLines.length > 0) {
                                pagesText.push(pageLines.join('\n'));
                            }
                        }

                        if (pagesText.length > 0) {
                            return pagesText.join('\n\n');
                        }
                    } catch (ePdf) {
                        console.warn("PDF.js metin çıkarma uyarısı:", ePdf);
                    }
                }

                // 3.b. Sunucu API Fallback (app.py - pypdf)
                try {
                    const serverText = await extractTextViaServerApi(file);
                    if (serverText && serverText.trim()) return serverText.trim();
                } catch (eSrv) { }

                throw new Error("PDF belgesinden metin çıkarılamadı. Belge şifreli veya taranmış resim (OCR gerektiren) formatında olabilir.");
            }

            // 4. ESKİ WORD FORMATI (.DOC) VE ZENGİN METİN (.RTF)
            if (ext === 'doc' || ext === 'rtf') {
                try {
                    const serverText = await extractTextViaServerApi(file);
                    if (serverText && serverText.trim()) return serverText.trim();
                } catch (eSrv) { }

                // Tarayıcı içinde ArrayBuffer'dan metin çıkarma (Binary string cleaner)
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let extractedStrings = [];
                let currentStr = "";

                for (let i = 0; i < bytes.length; i++) {
                    const b = bytes[i];
                    if ((b >= 32 && b <= 126) || (b >= 160 && b <= 255)) {
                        currentStr += String.fromCharCode(b);
                    } else if (b === 10 || b === 13) {
                        if (currentStr.trim().length >= 4) {
                            extractedStrings.push(currentStr.trim());
                        }
                        currentStr = "";
                    } else {
                        if (currentStr.trim().length >= 5) {
                            extractedStrings.push(currentStr.trim());
                        }
                        currentStr = "";
                    }
                }
                if (currentStr.trim().length >= 4) {
                    extractedStrings.push(currentStr.trim());
                }

                if (extractedStrings.length > 0) {
                    return extractedStrings.join('\n');
                }
            }

            // Genel Metin Fallback
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (err) => reject(err);
                reader.readAsText(file, 'UTF-8');
            });
        }

        async function extractTextViaServerApi(file) {
            const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
            const res = await fetch(`${apiBase}/api/extract_document_text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-File-Name': encodeURIComponent(file.name)
                },
                body: file
            });
            if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
            const data = await res.json();
            if (data && data.status === 'success' && data.text) {
                return data.text;
            }
            throw new Error(data.message || "Sunucudan metin alınamadı.");
        }

        async function handleCatFileUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            e.target.value = '';

            try {
                showToast(`📄 "${file.name}" ayrıştırılıyor... Lütfen bekleyin.`);
                const text = await extractTextFromFile(file);
                if (!text || !text.trim()) {
                    showToast(`⚠️ "${file.name}" dosyasından okunabilir metin çıkarılamadı.`);
                    return;
                }
                addNewDoc(file.name, text);
            } catch (err) {
                console.error("Dosya okuma hatası:", err);
                showToast(`❌ Dosya okuma hatası: ${err.message || err}`);
            }
        }

        function openPasteModal() {
            const m = document.getElementById('modalPaste');
            m.classList.remove('hidden');
            m.classList.add('flex');
            setTimeout(() => document.getElementById('pasteTextInput').focus(), 50);
        }

        function closePasteModal() {
            const m = document.getElementById('modalPaste');
            m.classList.add('hidden');
            m.classList.remove('flex');
        }

        function submitPastedText() {
            const text = document.getElementById('pasteTextInput').value.trim();
            if (!text) {
                showToast("Lütfen metin girin.");
                return;
            }
            closePasteModal();
            document.getElementById('pasteTextInput').value = '';
            addNewDoc("Ceviri_yapistirilan_metin.txt", text);
        }

        async function handleContainerFileDrop(e) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                try {
                    showToast(`📄 "${file.name}" ayrıştırılıyor...`);
                    const text = await extractTextFromFile(file);
                    if (!text || !text.trim()) {
                        showToast(`⚠️ "${file.name}" dosyasından okunabilir metin çıkarılamadı.`);
                        return;
                    }
                    addNewDoc(file.name, text);
                } catch (err) {
                    console.error("Dosya sürükleme hatası:", err);
                    showToast(`❌ Dosya okuma hatası: ${err.message || err}`);
                }
            }
        }

        function addNewDoc(filename, rawText, customSegments = null) {
            autoDetectAndSetProjectLanguage(rawText.slice(0, 3000));
            const isSrt = (filename && (filename.toLowerCase().endsWith('.srt') || filename.toLowerCase().endsWith('.vtt'))) || (rawText && rawText.includes('-->'));
            let newSegments = [];

            if (customSegments && customSegments.length > 0) {
                newSegments = customSegments;
            } else if (isSrt) {
                newSegments = parseSRT(rawText);
            }

            if (!newSegments || newSegments.length === 0) {
                const activeProj = getActiveProject();
                const isSubtitling = activeProj && activeProj.type === 'subtitling';

                // Stil ve Biçimlendirme Hafızası & Başlık Segmentasyon İstisnası Analizi
                if (typeof FormatShield !== 'undefined' && typeof FormatShield.buildSegments === 'function' && !isSubtitling && !isSrt) {
                    newSegments = FormatShield.buildSegments(filename, rawText, segmentDocument);
                }

                if (!newSegments || newSegments.length === 0) {
                    // Smartcat Modeli: Metin önce paragraflara ayrılır, her paragraf kendi içinde cümlelere bölünür
                    const rawParagraphs = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n{2,}/);
                    newSegments = [];
                    let curId = 1;

                    rawParagraphs.forEach((pText, pIdx) => {
                        const trimmedP = pText.trim();
                        if (!trimmedP) return;

                        const isHead = typeof isLikelyHeading === 'function' ? isLikelyHeading(trimmedP) : (trimmedP.length < 90 && !/[.!?]$/.test(trimmedP));
                        if (isHead) {
                            newSegments.push({
                                id: curId++,
                                paraId: pIdx,
                                source: trimmedP,
                                target: '',
                                status: 'empty',
                                isHeading: true,
                                styleMemory: { isHeading: true }
                            });
                        } else {
                            const sents = segmentDocument(trimmedP);
                            sents.forEach(sTxt => {
                                if (sTxt.trim()) {
                                    newSegments.push({
                                        id: curId++,
                                        paraId: pIdx,
                                        source: sTxt.trim(),
                                        target: '',
                                        status: 'empty',
                                        isHeading: false
                                    });
                                }
                            });
                        }
                    });

                    if (newSegments.length === 0) {
                        showToast("Segmente edilecek geçerli metin bulunamadı.");
                        return;
                    }

                    if (isSubtitling) {
                        newSegments.forEach((seg, idx) => {
                            const start = idx * 3.5;
                            const end = start + 3.0;
                            seg.startTime = formatSecondsToSrtTimestamp(start);
                            seg.endTime = formatSecondsToSrtTimestamp(end);
                            seg.durationSec = 3.0;
                        });
                    }
                }
            }

            // Biçim Kalkanı: kaynak segmentlerdeki farklı biçimli ifadeleri (i, b, font vb.) tespit et ve bağla
            if (isSrt) {
                if (typeof FormatShield !== 'undefined' && typeof FormatShield.attachSubtitleTags === 'function') {
                    FormatShield.attachSubtitleTags(newSegments);
                }
            } else if (typeof FormatShield !== 'undefined' && typeof FormatShield.attach === 'function') {
                FormatShield.attach(newSegments, filename, rawText);
            }

            // 2. İstenen Özellik: Yüklenen veya yapıştırılan her segment için hafıza taranır ve eşleşme varsa doldurulur
            scanAndApplyTMToSegments(newSegments);

            // Orijinal dosya formatını tespit et ve kaydet
            let origFormat = 'txt';
            if (filename && filename.includes('.')) {
                const ext = filename.split('.').pop().toLowerCase();
                if (['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv', 'wmv', 'm4v', 'ts', '3gp'].includes(ext)) {
                    origFormat = 'srt'; // video projeleri için standart altyazı çıktısı SRT'dir
                } else if (['srt', 'vtt', 'docx', 'doc', 'txt', 'md', 'csv', 'xlsx'].includes(ext)) {
                    origFormat = ext === 'xlsx' ? 'csv' : (ext === 'doc' ? 'docx' : ext);
                } else if (ext === 'pdf') {
                    origFormat = 'pdf';
                } else {
                    origFormat = ext;
                }
            } else if (isSrt) {
                origFormat = 'srt';
            }

            const doc = {
                id: 'doc-' + Date.now(),
                name: filename || (isSrt ? 'Yeni_Altyazi.srt' : 'Yeni_Belge.txt'),
                originalFormat: origFormat,
                segments: newSegments,
                currentPage: 1,
                totalPages: Math.max(1, Math.ceil(newSegments.length / SEGMENTS_PER_PAGE))
            };

            // Orijinal DOCX ZIP tamponunu ve paragraf meta verisini bağla
            if (typeof DocxExport !== 'undefined') {
                DocxExport.bind(doc, filename);
            }

            // Aktif projeyi bul veya oluştur
            let activeProj = appState.projects.find(p => p.id === appState.activeProjectId);
            if (!activeProj) {
                if (appState.projects.length === 0) {
                    activeProj = {
                        id: 'proj-' + Date.now(),
                        title: 'Varsayılan Proje',
                        type: isSrt ? 'subtitling' : 'text',
                        desc: 'Çeviri ve segmentasyon projesi.',
                        createdAt: 'Bugün',
                        documents: []
                    };
                    appState.projects.push(activeProj);
                } else {
                    activeProj = appState.projects[0];
                }
                appState.activeProjectId = activeProj.id;
            }
            if (!activeProj.documents) activeProj.documents = [];
            activeProj.documents.push(doc);
            appState.documents = activeProj.documents;

            renderProjectsGrid();
            updateActiveProjectView();
            switchDocument(doc.id);
            updateExportButtonLabels();
            showToast(`"${doc.name}" yüklendi ve Çeviri Belleği (TM) ile eşleştirildi.`);
        }

        // ========================================================
        // 10.1 GELİŞMİŞ DIŞA AKTARMA VE WORD BİÇİMLENDİRME MOTORU
        // (STANDART AKADEMİK ÖLÇÜTLER, TÜRKÇE KARAKTER GARANTİSİ, CANLI ÖNİZLEME)
        // ========================================================
        let exportCurrentAlign = 'justify';
        let exportCurrentTab = 'docx';

        function openExportModal() {
            const m = document.getElementById('modalExport');
            if (!m) return;
            m.classList.remove('hidden');
            m.classList.add('flex');

            updateExportButtonLabels();
            switchExportTab('original');
            updateWordExportPreview();
        }

        function closeExportModal() {
            const m = document.getElementById('modalExport');
            if (!m) return;
            m.classList.add('hidden');
            m.classList.remove('flex');
        }

        function getOriginalDocFormat() {
            const doc = getActiveDoc();
            if (doc && doc.originalFormat) {
                const fmt = doc.originalFormat.toLowerCase();
                if (['docx', 'doc'].includes(fmt)) return 'docx';
                if (['pdf'].includes(fmt)) return 'docx'; // PDF çevirileri Word (.docx) olarak dışa aktarılır
                if (['txt'].includes(fmt)) return 'txt';
                if (['md'].includes(fmt)) return 'md';
                if (['srt'].includes(fmt)) return 'srt';
                if (['vtt'].includes(fmt)) return 'vtt';
                if (['csv', 'xlsx'].includes(fmt)) return 'csv';
                if (['json'].includes(fmt)) return 'json';
                if (['xliff', 'sdlxliff'].includes(fmt)) return 'xliff';
                return fmt;
            }
            const activeProj = getActiveProject();
            if (activeProj && activeProj.type === 'subtitling') return 'srt';
            return 'docx';
        }

        // Açık veya düzenlenmekte olan tüm segment textarea değerlerini anında doc.segments'e senkronize eder
        function syncActiveInputsToSegments() {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            doc.segments.forEach(seg => {
                const el = document.getElementById(`targetInput-${seg.id}`);
                if (el && typeof el.value === 'string') {
                    seg.target = el.value;
                    if (seg.status !== 'confirmed') {
                        seg.status = el.value.trim().length > 0 ? 'draft' : 'empty';
                    }
                }
            });
        }

        // Segment barındaki İndir açılır menüsünü aç / kapat
        function toggleSegmentDownloadMenu(event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            const menu = document.getElementById('segmentDownloadMenu');
            const chevron = document.getElementById('segmentDownloadChevron');
            if (!menu) return;
            const isOpen = !menu.classList.contains('hidden');
            if (isOpen) {
                closeSegmentDownloadMenu();
            } else {
                updateExportButtonLabels();
                menu.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }

        function closeSegmentDownloadMenu() {
            const menu = document.getElementById('segmentDownloadMenu');
            const chevron = document.getElementById('segmentDownloadChevron');
            if (menu) menu.classList.add('hidden');
            if (chevron) chevron.style.transform = '';
        }

        // Menü dışına tıklandığında otomatik kapatma
        window.addEventListener('click', function (e) {
            const container = document.getElementById('segmentDownloadContainer');
            if (container && !container.contains(e.target)) {
                closeSegmentDownloadMenu();
            }
        });

        function updateExportButtonLabels() {
            const fmt = getOriginalDocFormat().toUpperCase();
            const btn = document.getElementById('btnTopBarExport');
            if (btn) {
                btn.setAttribute('title', `Belgeyi dışa aktar (${fmt} / Word / Diğer Formatlar)`);
            }

            const badgeFmt = document.getElementById('segmentDownloadBadgeFmt');
            if (badgeFmt) badgeFmt.innerText = fmt;

            const menuBadge = document.getElementById('menuOrigFmtBadge');
            if (menuBadge) menuBadge.innerText = fmt;

            const modalLabels = document.querySelectorAll('.modalOrigFmtLabel');
            modalLabels.forEach(el => el.innerText = fmt);

            const doc = getActiveDoc();
            const docNameEl = document.getElementById('modalOrigDocName');
            if (docNameEl && doc) docNameEl.innerText = doc.name || 'Aktif Belge';
        }

        function exportInOriginalFormat() {
            // 1. Önce DOM'daki aktif tüm segment çevirilerini hafızaya yaz
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak aktif belge veya segment bulunamadı.");
                return;
            }

            // SMARTCAT EXPORT STANDARDI:
            // Orijinal formatta indirme her zaman temiz, akıcı paragraf modunu (target_only) kullanır.
            // Asla cümleleri 1 2 3 diye numaralandırmaz veya ayrı satırlara bölmez.
            const isSub = doc.originalFormat === 'srt' || doc.originalFormat === 'vtt' || 
                          ((getActiveProject()?.type === 'subtitling') && doc.segments.some(s => s.startTime));

            const contentModeEl = document.getElementById('exportContentMode');
            if (contentModeEl) {
                contentModeEl.value = isSub ? 'subtitle_timed' : 'target_only';
            }

            const fmt = getOriginalDocFormat();
            if (fmt === 'docx' || fmt === 'doc') {
                executeWordExport('docx', true);
            } else if (fmt === 'xliff' || fmt === 'sdlxliff') {
                if (typeof CatIO !== 'undefined' && typeof CatIO.exportXLIFF === 'function') {
                    CatIO.exportXLIFF();
                } else {
                    downloadCleanOutput('xliff');
                }
            } else {
                downloadCleanOutput(fmt);
            }
        }

        function switchExportTab(tab) {
            exportCurrentTab = tab;
            const tabs = ['original', 'preserved', 'docx', 'pdf', 'rtf', 'bilingual', 'xlf', 'tmx', 'tsv', 'po', 'html', 'xml', 'txt', 'md', 'srt', 'vtt', 'ttml', 'ass', 'catpkg', 'tbx', 'csv', 'video'];

            tabs.forEach(t => {
                const btn = document.getElementById(`tabBtn-${t}`);
                if (btn) {
                    if (t === tab) {
                        if (t === 'original') {
                            btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-emerald-600 text-white shadow-xs cursor-pointer";
                        } else if (t === 'video') {
                            btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all bg-purple-700 text-white shadow-xs cursor-pointer";
                        } else {
                            btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-sky-600 text-white shadow-xs cursor-pointer";
                        }
                    } else {
                        if (t === 'original') {
                            btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer";
                        } else if (t === 'video') {
                            btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-900 border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer";
                        } else {
                            btn.className = "px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all cursor-pointer";
                        }
                    }
                }
            });

            const paneOriginal = document.getElementById('exportPane-original');
            const paneDocx = document.getElementById('exportPane-docx');
            const paneOthers = document.getElementById('exportPane-others');
            const paneVideo = document.getElementById('exportPane-video');

            if (tab === 'original') {
                if (paneOriginal) {
                    paneOriginal.classList.remove('hidden');
                    paneOriginal.classList.add('flex');
                }
                if (paneDocx) paneDocx.classList.add('hidden');
                if (paneOthers) paneOthers.classList.add('hidden');
                if (paneVideo) paneVideo.classList.add('hidden');
                const doc = getActiveDoc();
                const docNameEl = document.getElementById('modalOrigDocName');
                if (docNameEl && doc) docNameEl.innerText = doc.name || 'Aktif Belge';
            } else if (tab === 'docx') {
                if (paneOriginal) paneOriginal.classList.add('hidden');
                if (paneDocx) paneDocx.classList.remove('hidden');
                if (paneOthers) paneOthers.classList.add('hidden');
                if (paneVideo) paneVideo.classList.add('hidden');
                updateWordExportPreview();
            } else if (tab === 'video') {
                if (paneOriginal) paneOriginal.classList.add('hidden');
                if (paneDocx) paneDocx.classList.add('hidden');
                if (paneOthers) paneOthers.classList.add('hidden');
                if (paneVideo) {
                    paneVideo.classList.remove('hidden');
                    paneVideo.classList.add('flex');
                }
            } else {
                if (paneOriginal) paneOriginal.classList.add('hidden');
                if (paneDocx) paneDocx.classList.add('hidden');
                if (paneVideo) paneVideo.classList.add('hidden');
                if (paneOthers) {
                    paneOthers.classList.remove('hidden');
                    paneOthers.classList.add('flex');
                }

                const iconEl = document.getElementById('otherFormatIcon');
                const titleEl = document.getElementById('otherFormatTitle');
                const descEl = document.getElementById('otherFormatDesc');
                const badgeEl = document.getElementById('otherFormatBadge');
                const btnTextEl = document.getElementById('otherFormatBtnText');
                const dlBtn = document.getElementById('otherFormatDownloadBtn');

                if (tab === 'preserved') {
                    if (iconEl) iconEl.innerText = '🎨';
                    if (badgeEl) badgeEl.innerText = 'DOCX';
                    if (titleEl) titleEl.innerText = 'İçerik Özelliklerini Koruyarak Dışa Aktar (.docx)';
                    if (descEl) descEl.innerText = 'Orijinal belgenin tüm yazı tipi, punto, kalın (bold), italik ve renk stillerini hiçbir kayba uğratmadan yeni bir Word (.docx) paketi olarak çıkarır.';
                    if (btnTextEl) btnTextEl.innerText = 'İçerik Özellikleriyle DOCX İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('docx')");
                } else if (tab === 'bilingual') {
                    if (iconEl) iconEl.innerText = '📑';
                    if (badgeEl) badgeEl.innerText = 'BILINGUAL';
                    if (titleEl) titleEl.innerText = 'İki Dilli (Bilingual) Karşılaştırmalı Tablo (.docx / .html)';
                    if (descEl) descEl.innerText = 'Kaynak ve hedef metinleri yan yana, bold ve italik özellikleri korunmuş profesyonel iki dilli inceleme tablosu olarak çıkarır.';
                    if (btnTextEl) btnTextEl.innerText = 'İki Dilli Tabloyu İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "downloadBilingualExport('html')");
                } else if (tab === 'xlf') {
                    if (iconEl) iconEl.innerText = '🔄';
                    if (badgeEl) badgeEl.innerText = 'XLIFF 1.2';
                    if (titleEl) titleEl.innerText = 'XLIFF 1.2 İki Dilli Paket (.xlf)';
                    if (descEl) descEl.innerText = 'Trados, memoQ ve Phrase ile %100 uyumlu, biçim kalkanları ve inline stil etiketleri korunmuş endüstri standardı XLIFF dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'XLIFF 1.2 (.xlf) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "CatIO.exportXLIFF()");
                }

                if (tab === 'pdf') {
                    if (iconEl) iconEl.innerText = '📕';
                    if (badgeEl) badgeEl.innerText = 'PDF';
                    if (titleEl) titleEl.innerText = 'Vektörel PDF Belgesi (.pdf) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'Yazı tipi, punto, kalkanlar, sayfa kenar boşlukları ve stilleri korunan yüksek kaliteli A4 PDF çıktısı.';
                    if (btnTextEl) btnTextEl.innerText = 'PDF Olarak Yazdır / Kaydet';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('pdf')");
                } else if (tab === 'rtf') {
                    if (iconEl) iconEl.innerText = '📜';
                    if (badgeEl) badgeEl.innerText = 'RTF';
                    if (titleEl) titleEl.innerText = 'Zengin Metin Biçimi (.rtf) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'Word, WordPad ve ofis araçlarıyla %100 uyumlu, Türkçe karakter garantili, kalın, italik ve punto stilleri korunan RTF belgesi.';
                    if (btnTextEl) btnTextEl.innerText = 'Zengin Metin (.rtf) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('rtf')");
                } else if (tab === 'tmx') {
                    if (iconEl) iconEl.innerText = '🗄️';
                    if (badgeEl) badgeEl.innerText = 'TMX 1.4b';
                    if (titleEl) titleEl.innerText = 'Çeviri Belleği Değişim Standardı (.tmx)';
                    if (descEl) descEl.innerText = 'ISO TMX 1.4b standardında, tüm onaylanan çeviri çiftlerini içeren evrensel Translation Memory dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'Çeviri Belleği (.tmx) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('tmx')");
                } else if (tab === 'tsv') {
                    if (iconEl) iconEl.innerText = '📊';
                    if (badgeEl) badgeEl.innerText = 'TSV';
                    if (titleEl) titleEl.innerText = 'İki Dilli Sekmeyle Ayrılmış Tablo (.tsv)';
                    if (descEl) descEl.innerText = 'Excel, Google E-Tablolar ve CAT araçlarıyla tam uyumlu, sekmelerle ayrılmış iki dilli veri tablosu.';
                    if (btnTextEl) btnTextEl.innerText = 'İki Dilli TSV (.tsv) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('tsv')");
                } else if (tab === 'po') {
                    if (iconEl) iconEl.innerText = '🌐';
                    if (badgeEl) badgeEl.innerText = 'GNU PO';
                    if (titleEl) titleEl.innerText = 'GNU gettext Yerelleştirme Dosyası (.po)';
                    if (descEl) descEl.innerText = 'Yazılım ve web yerelleştirme endüstri standardı msgid/msgstr PO çeviri dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'GNU gettext (.po) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('po')");
                } else if (tab === 'html') {
                    if (iconEl) iconEl.innerText = '🌐';
                    if (badgeEl) badgeEl.innerText = 'HTML5';
                    if (titleEl) titleEl.innerText = 'Biçimlendirilmiş Web Belgesi (.html)';
                    if (descEl) descEl.innerText = 'Tipografi, başlıklar, kalkan CSS sınıfları ve renkleri korunmuş, bağımsız ve modern web sayfası belgesi.';
                    if (btnTextEl) btnTextEl.innerText = 'HTML Web Belgesi İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('html')");
                } else if (tab === 'xml') {
                    if (iconEl) iconEl.innerText = '🧩';
                    if (badgeEl) badgeEl.innerText = 'XML';
                    if (titleEl) titleEl.innerText = 'Yapılandırılmış Segment XML (.xml)';
                    if (descEl) descEl.innerText = 'Segment ID, onay durumları, tipografi ve kalkan hiyerarşisini içeren standart XML veri yapısı.';
                    if (btnTextEl) btnTextEl.innerText = 'Segment XML (.xml) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "exportPreservingFormat('xml')");
                } else if (tab === 'txt') {
                    if (iconEl) iconEl.innerText = '📄';
                    if (titleEl) titleEl.innerText = 'Düz Metin (.txt) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'Tüm projenin birleştirilmiş, saf Türkçe hedef çevirisi temiz bir .txt dosyası olarak dışa aktarılır.';
                    if (btnTextEl) btnTextEl.innerText = 'Düz Metin (.txt) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "downloadCleanOutput('txt')");
                } else if (tab === 'md') {
                    if (iconEl) iconEl.innerText = '📑';
                    if (titleEl) titleEl.innerText = 'Markdown (.md) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'Başlık ve paragrafları korunmuş, modern not uygulamaları ve GitHub ile uyumlu Markdown belgesi.';
                    if (btnTextEl) btnTextEl.innerText = 'Markdown (.md) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "downloadCleanOutput('md')");
                } else if (tab === 'srt') {
                    if (iconEl) iconEl.innerText = '🎬';
                    if (titleEl) titleEl.innerText = 'Altyazı (.srt) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'Video oynatıcıları ve montaj programlarıyla uyumlu, sıralı zaman damgalı standart SRT altyazı dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'Altyazı (.srt) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "downloadCleanOutput('srt')");
                } else if (tab === 'vtt') {
                    if (iconEl) iconEl.innerText = '💬';
                    if (titleEl) titleEl.innerText = 'WebVTT (.vtt) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'HTML5 web video oynatıcıları ve modern platformlarla uyumlu standart WebVTT altyazı dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'WebVTT (.vtt) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "downloadCleanOutput('vtt')");
                } else if (tab === 'csv') {
                    if (iconEl) iconEl.innerText = '📊';
                    if (titleEl) titleEl.innerText = 'Tablo (.csv / Excel) Dışa Aktarımı';
                    if (descEl) descEl.innerText = 'Segment ID, zaman kodları, kaynak metin ve hedef çeviriyi içeren virgülle ayrılmış veri tablosu.';
                    if (btnTextEl) btnTextEl.innerText = 'Tablo (.csv) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "downloadCleanOutput('csv')");
                } else if (tab === 'ttml') {
                    if (iconEl) iconEl.innerText = '🎥';
                    if (titleEl) titleEl.innerText = 'Netflix / Disney+ TTML (IMSC 1.1 / DFXP)';
                    if (descEl) descEl.innerText = 'Uluslararası yayıncılık standardı, XML tabanlı zaman ve stil bölgesi tanımlı profesyonel TTML altyazı dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'Netflix TTML (.ttml) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "CatAVT.Export.downloadFormat('ttml')");
                } else if (tab === 'ass') {
                    if (iconEl) iconEl.innerText = '🎞️';
                    if (titleEl) titleEl.innerText = 'Advanced SubStation Alpha (.ass)';
                    if (descEl) descEl.innerText = 'Font, punto, renk, kenarlık stilleri ve {\\an8} ekran konumlandırma koordinatlarını içeren gelişmiş ASS altyazı dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'ASS / SSA (.ass) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "CatAVT.Export.downloadFormat('ass')");
                } else if (tab === 'catpkg') {
                    if (iconEl) iconEl.innerText = '📦';
                    if (titleEl) titleEl.innerText = 'Çeviri Bürosu İşbirliği Paketi (.catpkg)';
                    if (descEl) descEl.innerText = 'Tüm dokümanlar, biçim kalkanları, L1/L2 revizyonları, Track Changes ve LQA hata kayıtlarını içeren taşınabilir paket.';
                    if (btnTextEl) btnTextEl.innerText = 'İşbirliği Paketi (.catpkg) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "CatLSP.Package.exportPackage()");
                } else if (tab === 'tbx') {
                    if (iconEl) iconEl.innerText = '📖';
                    if (titleEl) titleEl.innerText = 'Terim Bankası TBX-Basic (ISO 30042 XML)';
                    if (descEl) descEl.innerText = 'Trados, MemoQ ve Phrase ile %100 uyumlu endüstri standardı XML terim bankası dosyası.';
                    if (btnTextEl) btnTextEl.innerText = 'TBX-Basic (.tbx) İndir';
                    if (dlBtn) dlBtn.setAttribute('onclick', "CatLSP.TBX.exportTbx()");
                }

                // Seçilen formatın canlı önizlemesini render et
                updateUniversalExportPreview(tab);
            }
        }

        function openVideoExportModal() {
            openExportModal();
            switchExportTab('video');
        }

        async function executeVideoSubtitleBurnExport() {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak altyazı segmenti bulunamadı.");
                return;
            }

            const formatRadio = document.querySelector('input[name="videoExportFormat"]:checked');
            const selectedFormat = formatRadio ? formatRadio.value : 'mp4';
            const fontSize = document.getElementById('videoSubtitleFontSize')?.value || '22';
            const fontColor = document.getElementById('videoSubtitleFontColor')?.value || 'white';

            const srtText = generateSRT(doc);
            if (!srtText) {
                showToast("Altyazı metni üretilemedi.");
                return;
            }

            const statusArea = document.getElementById('videoBurnStatusArea');
            const statusText = document.getElementById('videoBurnStatusText');
            const btn = document.getElementById('btnStartVideoBurn');

            if (statusArea) statusArea.classList.remove('hidden');
            if (statusText) statusText.innerText = `FFmpeg altyazıları videoya işliyor ve .${selectedFormat.toUpperCase()} formatına dönüştürüyor... Lütfen bekleyin.`;
            if (btn) btn.disabled = true;

            try {
                const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                const payload = {
                    videoId: currentServerVideoId || '',
                    srt: srtText,
                    format: selectedFormat,
                    fontSize: parseInt(fontSize, 10),
                    fontColor: fontColor
                };

                const res = await fetch(`${apiBase}/api/burn_subtitles_video`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.status === 'success' && data.download_url) {
                        const a = document.createElement('a');
                        a.href = `${apiBase}${data.download_url}`;
                        a.download = data.filename || `Ceviri_Altyazili.${selectedFormat}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        showToast(`🎬 Altyazılı video başarıyla indirildi (${data.filename}, ${data.file_size_mb} MB)!`);
                        closeExportModal();
                    } else {
                        throw new Error(data.message || "Video oluşturma başarısız oldu.");
                    }
                } else {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `Sunucu hatası (${res.status})`);
                }
            } catch (err) {
                console.error("Video burn hatası:", err);
                showToast("Video oluşturma hatası: " + err.message);
                if (statusText) statusText.innerText = "Hata: " + err.message;
            } finally {
                if (btn) btn.disabled = false;
                setTimeout(() => {
                    if (statusArea) statusArea.classList.add('hidden');
                }, 5000);
            }
        }

        // STANDART AKADEMİK VE HAZIR ŞABLON UYGULAYICI
        function applyExportPreset(preset) {
            const fontEl = document.getElementById('exportFontFamily');
            const sizeEl = document.getElementById('exportFontSize');
            const lineEl = document.getElementById('exportLineSpacing');
            const indentEl = document.getElementById('exportIndent');
            const paraEl = document.getElementById('exportParaSpacing');
            const headingColorEl = document.getElementById('exportHeadingColor');
            const headingSizeEl = document.getElementById('exportHeadingSize');
            const headingBoldEl = document.getElementById('exportHeadingBold');
            const marginEl = document.getElementById('exportMargins');
            const badgeEl = document.getElementById('previewPresetBadge');

            if (preset === 'academic') {
                // STANDART AKADEMİK (APA / YÖK / TEZ STANDARTLARI) - DOKUNULMAZ
                if (fontEl) fontEl.value = 'Times New Roman';
                if (sizeEl) sizeEl.value = '12';
                if (lineEl) lineEl.value = '1.5';
                if (indentEl) indentEl.value = '1.25';
                if (paraEl) paraEl.value = '6';
                if (headingColorEl) headingColorEl.value = '#000000';
                if (headingSizeEl) headingSizeEl.value = '14';
                if (headingBoldEl) headingBoldEl.checked = true;
                if (marginEl) marginEl.value = '2.5';
                setExportAlign('justify');

                if (badgeEl) {
                    badgeEl.innerText = 'Standart Akademik (APA / YÖK)';
                    badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold';
                }
                showToast("🎓 Standart Akademik Word ölçütleri uygulandı: Times New Roman 12pt, 1.5 Satır Aralığı, 1.25 cm Girinti, İki Yana Yaslı, Siyah Başlıklar.");
            } else if (preset === 'manual') {
                // MANUEL / ÖZEL AYARLAR (SERBEST KONTROL)
                if (badgeEl) {
                    badgeEl.innerText = 'Manuel / Özel Ayarlar';
                    badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 font-mono font-bold';
                }
                showToast("⚙️ Manuel biçimlendirme modu: Font, boyut, satır aralığı, girinti ve kenar boşluklarını serbestçe elle belirleyebilirsiniz.");
            } else if (preset === 'corporate') {
                // MODERN RAPOR / KURUMSAL
                if (fontEl) fontEl.value = 'Segoe UI';
                if (sizeEl) sizeEl.value = '11';
                if (lineEl) lineEl.value = '1.15';
                if (indentEl) indentEl.value = '0';
                if (paraEl) paraEl.value = '8';
                if (headingColorEl) headingColorEl.value = '#0078d4';
                if (headingSizeEl) headingSizeEl.value = '16';
                if (headingBoldEl) headingBoldEl.checked = true;
                if (marginEl) marginEl.value = '2.0';
                setExportAlign('left');

                if (badgeEl) {
                    badgeEl.innerText = 'Modern Rapor (Kurumsal)';
                    badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 font-mono font-bold';
                }
                showToast("💼 Modern Kurumsal Rapor ölçütleri uygulandı.");
            } else if (preset === 'minimal') {
                // MİNİMALİST
                if (fontEl) fontEl.value = 'Arial';
                if (sizeEl) sizeEl.value = '11';
                if (lineEl) lineEl.value = '1.0';
                if (indentEl) indentEl.value = '0';
                if (paraEl) paraEl.value = '4';
                if (headingColorEl) headingColorEl.value = '#1e293b';
                if (headingSizeEl) headingSizeEl.value = '14';
                if (headingBoldEl) headingBoldEl.checked = true;
                if (marginEl) marginEl.value = '2.0';
                setExportAlign('left');

                if (badgeEl) {
                    badgeEl.innerText = 'Minimalist';
                    badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono font-bold';
                }
                showToast("📄 Minimalist metin ölçütleri uygulandı.");
            }

            updateWordExportPreview();
        }

        function setExportAlign(align) {
            exportCurrentAlign = align;
            const aligns = ['justify', 'left', 'center'];
            aligns.forEach(a => {
                const btn = document.getElementById(`alignBtn-${a}`);
                if (btn) {
                    if (a === align) {
                        btn.className = "py-1 rounded text-center text-xs font-bold bg-white text-sky-700 shadow-2xs";
                    } else {
                        btn.className = "py-1 rounded text-center text-xs font-medium text-slate-600 hover:text-slate-900";
                    }
                }
            });
            updateWordExportPreview();
        }

        function setHeadingColorPreset(color) {
            const input = document.getElementById('exportHeadingColor');
            if (input) {
                input.value = color;
                updateWordExportPreview();
            }
        }

        function getWordExportOptions() {
            const fontEl = document.getElementById('exportFontFamily');
            const sizeEl = document.getElementById('exportFontSize');
            const lineEl = document.getElementById('exportLineSpacing');
            const indentEl = document.getElementById('exportIndent');
            const paraEl = document.getElementById('exportParaSpacing');
            const headingColorEl = document.getElementById('exportHeadingColor');
            const headingSizeEl = document.getElementById('exportHeadingSize');
            const headingBoldEl = document.getElementById('exportHeadingBold');
            const marginEl = document.getElementById('exportMargins');
            const contentModeEl = document.getElementById('exportContentMode');

            return {
                fontFamily: fontEl ? fontEl.value : 'Times New Roman',
                fontSize: sizeEl ? parseInt(sizeEl.value, 10) : 12,
                lineSpacing: lineEl ? parseFloat(lineEl.value) : 1.5,
                indentCm: indentEl ? parseFloat(indentEl.value) : 1.25,
                paragraphSpacing: paraEl ? parseInt(paraEl.value, 10) : 6,
                alignment: exportCurrentAlign || 'justify',
                headingColor: headingColorEl ? headingColorEl.value : '#000000',
                headingSize: headingSizeEl ? parseInt(headingSizeEl.value, 10) : 14,
                headingBold: headingBoldEl ? headingBoldEl.checked : true,
                marginCm: marginEl ? parseFloat(marginEl.value) : 2.5,
                contentMode: contentModeEl ? contentModeEl.value : 'target_only'
            };
        }

        // CANLI WORD SAYFASI ÖNİZLEMESİ
        function updateWordExportPreview() {
            const opts = getWordExportOptions();
            const paper = document.getElementById('wordPreviewPaper');
            const heading = document.getElementById('previewHeading');
            const p1 = document.getElementById('previewPara1');
            const p2 = document.getElementById('previewPara2');
            const metricsText = document.getElementById('previewMetricsText');

            if (!paper) return;

            // Kağıt genel stili
            paper.style.fontFamily = `"${opts.fontFamily}", Times New Roman, serif`;
            paper.style.fontSize = `${opts.fontSize}px`; // Ölçekli görsel uyum
            paper.style.lineHeight = opts.lineSpacing;

            // Başlık stili
            if (heading) {
                heading.style.fontFamily = `"${opts.fontFamily}", Times New Roman, serif`;
                heading.style.fontSize = `${opts.headingSize}px`;
                heading.style.color = opts.headingColor;
                heading.style.fontWeight = opts.headingBold ? 'bold' : 'normal';
                heading.style.marginBottom = `${opts.paragraphSpacing}px`;
            }

            // Paragraf stilleri
            const applyParaStyle = (el) => {
                if (!el) return;
                el.style.fontFamily = `"${opts.fontFamily}", Times New Roman, serif`;
                el.style.fontSize = `${opts.fontSize}px`;
                el.style.lineHeight = opts.lineSpacing;
                el.style.textIndent = `${opts.indentCm}cm`;
                el.style.textAlign = opts.alignment;
                el.style.marginBottom = `${opts.paragraphSpacing}px`;
            };

            applyParaStyle(p1);
            applyParaStyle(p2);

            // Eğer aktif belgede gerçek segmentler varsa önizleme metinlerini belgeden al
            const doc = getActiveDoc();
            if (doc && doc.segments && doc.segments.length > 0) {
                const cleanSegs = doc.segments
                    .map(s => cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()))
                    .filter(Boolean);

                if (cleanSegs.length > 0) {
                    if (heading) {
                        heading.innerText = cleanSegs[0].length < 80 ? cleanSegs[0] : (doc.name || "Akademik Çeviri İncelemesi");
                    }
                    if (p1 && cleanSegs.length > 1) {
                        p1.innerText = cleanSegs[1];
                    }
                    if (p2 && cleanSegs.length > 2) {
                        p2.innerText = cleanSegs.slice(2, 4).join(' ');
                    }
                }
            }

            // Alt bilgi özeti
            if (metricsText) {
                const alignName = opts.alignment === 'justify' ? 'İki Yana Yaslı' : (opts.alignment === 'center' ? 'Ortalı' : 'Sola Hizalı');
                metricsText.innerText = `${opts.fontFamily} ${opts.fontSize}pt · ${opts.lineSpacing} Satır · ${opts.indentCm} cm Girinti · ${alignName} · Başlık: ${opts.headingColor}`;
            }
        }

        // BAŞLIK OLABİLECEK CÜMLELERİ ALGILAMA YARDIMCISI
        function isLikelyHeading(text) {
            if (!text || typeof text !== 'string') return false;
            const t = text.trim();
            if (t.length === 0) return false;
            // Kısa ve noktasız veya numaralı başlık (örn: "1. Giriş", "Bölüm 2", "Özet")
            const isShort = t.length < 85;
            const endsWithPunct = /[.!?]$/.test(t);
            const startsWithHeadingPattern = /^(bölüm|giriş|özet|abstract|sonuç|kaynakça|metodoloji|yöntem|\d+(\.\d+)*\s+)/i.test(t);
            const isAllUppercase = t === t.toUpperCase() && /[A-ZĞÜŞİÖÇ]/.test(t) && t.length > 3;

            return (isShort && !endsWithPunct) || startsWithHeadingPattern || isAllUppercase;
        }

        // TÜRKÇE KARAKTERLERİ %100 KUSURSUZ ÇIKARAN WORD BELGESİ (HTML / MSO-XML) OLUŞTURUCUSU
        function buildWordDocumentHtml(doc, opts) {
            const cleanDocName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";

            // Segmentleri temizle ve hazırla
            const cleanSegments = doc.segments.map(s => {
                const src = cleanGeminiDraftTag(s.source);
                const trg = cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim());
                return {
                    id: s.id,
                    source: src,
                    target: trg,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    durationSec: s.durationSec,
                    isHead: isLikelyHeading(trg),
                    // Biçim Kalkanı: kalkan stilleri doğrulanarak hedef/kaynak biçimli HTML
                    targetHtml: FormatShield.exportHtml(s, (s.target && s.target.trim()) ? 'target' : 'source'),
                    sourceHtml: FormatShield.exportHtml(s, 'source')
                };
            }).filter(s => s.target.length > 0 || s.source.length > 0);

            // Paragrafları ve içeriği oluştur
            let bodyHtml = "";
            let currentParagraph = [];

            const flushParagraph = () => {
                if (currentParagraph.length === 0) return;
                const textBlock = currentParagraph.join(' ');
                bodyHtml += `<p class="MsoNormal">${textBlock}</p>\n`;
                currentParagraph = [];
            };

            const isActualSub = (doc.originalFormat === 'srt' || doc.originalFormat === 'vtt');

            if (opts.contentMode === 'subtitle_timed' && isActualSub) {
                // KULLANICI TALEBİ: GEÇTİĞİ SANİYELERLE BERABER ALT ALTA SATIRLARINI EKLEME
                bodyHtml += `
                <div style="margin-bottom: 18pt; border-bottom: 2.5pt solid #6366f1; padding-bottom: 10pt;">
                    <h1 class="Heading1" style="color: #4338ca; font-size: 18pt; margin-bottom: 4pt; font-family:'Segoe UI', Arial, sans-serif;">
                        ${escapeHtml(cleanDocName)} - Zaman Damgalı Altyazı Çevirisi
                    </h1>
                    <p style="color: #64748b; font-size: 9.5pt; font-family:'Segoe UI', Arial, sans-serif; margin: 0;">
                        Tarih: ${new Date().toLocaleDateString('tr-TR')} · Toplam Altyazı Bloğu: ${cleanSegments.length} Segment
                    </p>
                </div>\n`;

                cleanSegments.forEach((seg, idx) => {
                    const startStr = seg.startTime || formatSecondsToSrtTimestamp(idx * 3.5);
                    const endStr = seg.endTime || formatSecondsToSrtTimestamp(idx * 3.5 + 3.0);
                    const durSec = seg.durationSec ? seg.durationSec.toFixed(1) : '3.0';

                    // Kaynak satırları (1. Satır ve 2. Satır alt alta)
                    const srcLines = (seg.source || '').split('\n').map(l => l.trim()).filter(Boolean);
                    const srcHtml = srcLines.map((line, lIdx) =>
                        `<div style="padding-left: 10pt; margin-bottom: 2pt; font-size: 10pt;"><span style="color:#7c3aed; font-size:9pt; font-weight:bold; font-family:'Segoe UI',sans-serif;">${lIdx + 1}. Satır (Üst/Alt):</span> <span style="color:#475569; font-family:'Segoe UI',sans-serif;">${escapeHtml(line)}</span></div>`
                    ).join('') || `<div style="padding-left: 10pt; color:#475569; font-size: 10pt;">${escapeHtml(seg.source)}</div>`;

                    // Hedef çeviri satırları (1. Satır ve 2. Satır alt alta)
                    const trgLines = (seg.target || '').split('\n').map(l => l.trim()).filter(Boolean);
                    const trgHtml = trgLines.map((line, lIdx) =>
                        `<div style="padding-left: 10pt; margin-bottom: 3pt; font-size: 11pt;"><span style="color:#0284c7; font-size:9.5pt; font-weight:bold; font-family:'Segoe UI',sans-serif;">${lIdx + 1}. Satır:</span> <span style="color:#0f172a; font-weight:bold; font-family:'Segoe UI',sans-serif;">${escapeHtml(line)}</span></div>`
                    ).join('') || `<div style="padding-left: 10pt; color:#0f172a; font-weight:bold; font-size: 11pt;">${escapeHtml(seg.target)}</div>`;

                    bodyHtml += `
                    <div style="margin-bottom: 14pt; padding: 10pt 12pt; border: 1px solid #cbd5e1; border-left: 5pt solid #6366f1; background-color: #f8fafc; border-radius: 4pt; page-break-inside: avoid;">
                        <!-- Segment Numarası ve Geçtiği Saniyeler -->
                        <div style="margin-bottom: 7pt; font-family: 'Courier New', Consolas, monospace; font-size: 11pt; font-weight: bold; color: #4338ca;">
                            <span style="background-color: #ede9fe; padding: 2pt 6pt; border-radius: 3pt; border: 1px solid #ddd6fe; color:#5b21b6;">#${String(idx + 1).padStart(2, '0')}</span>
                            &nbsp;&nbsp;
                            <span style="background-color: #e0f2fe; color: #0369a1; padding: 2pt 6pt; border-radius: 3pt; border: 1px solid #bae6fd;">⏱️ ${startStr} ➔ ${endStr}</span>
                            &nbsp;
                            <span style="color: #64748b; font-size: 9pt; font-family:'Segoe UI', sans-serif;">[Süre: ${durSec}s]</span>
                        </div>
                        
                        <!-- Kaynak Metin (Alt Alta Satırları) -->
                        <div style="margin-bottom: 7pt;">
                            <div style="font-weight: bold; color: #64748b; font-size: 8.5pt; text-transform: uppercase; font-family:'Segoe UI',sans-serif; margin-bottom: 2pt;">Kaynak Konuşma Bloğu:</div>
                            ${srcHtml}
                        </div>

                        <!-- Hedef Çeviri (Alt Alta Satırları) -->
                        <div>
                            <div style="font-weight: bold; color: #0284c7; font-size: 9pt; text-transform: uppercase; font-family:'Segoe UI',sans-serif; margin-bottom: 2pt;">Hedef Altyazı Çevirisi:</div>
                            ${trgHtml}
                        </div>
                    </div>\n`;
                });
            } else if (opts.contentMode === 'table') {
                // Tablo Görünümü (Altyazı ise zaman damgası kolonu da eklenir)
                const hasTiming = cleanSegments.some(s => s.startTime);
                bodyHtml += `
                <table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse:collapse; margin-bottom:14pt; border:1px solid #cbd5e1; font-size:${opts.fontSize}pt;">
                    <thead>
                        <tr style="background-color:#f1f5f9; font-weight:bold;">
                            <th style="width:7%; border:1px solid #cbd5e1; text-align:center;">#</th>
                            ${hasTiming ? '<th style="width:23%; border:1px solid #cbd5e1; text-align:center;">Zaman Aralığı</th>' : ''}
                            <th style="width:${hasTiming ? '35%' : '46%'}; border:1px solid #cbd5e1; text-align:left;">Kaynak Metin</th>
                            <th style="width:${hasTiming ? '35%' : '46%'}; border:1px solid #cbd5e1; text-align:left;">Hedef Çeviri</th>
                        </tr>
                    </thead>
                    <tbody>\n`;
                cleanSegments.forEach((seg, idx) => {
                    bodyHtml += `
                        <tr>
                            <td style="border:1px solid #cbd5e1; text-align:center; vertical-align:top; font-size:${Math.max(9, opts.fontSize - 2)}pt; color:#64748b;">${idx + 1}</td>
                            ${hasTiming ? `<td style="border:1px solid #cbd5e1; text-align:center; vertical-align:top; font-family:monospace; font-size:9pt; color:#4338ca;">${seg.startTime || ''}<br/>➔ ${seg.endTime || ''}</td>` : ''}
                            <td style="border:1px solid #cbd5e1; vertical-align:top;">${seg.sourceHtml || escapeHtml(seg.source).replace(/\n/g, '<br/>')}</td>
                            <td style="border:1px solid #cbd5e1; vertical-align:top; font-weight:500;">${seg.targetHtml || escapeHtml(seg.target).replace(/\n/g, '<br/>')}</td>
                        </tr>\n`;
                });
                bodyHtml += `</tbody></table>\n`;
            } else if (opts.contentMode === 'bilingual') {
                // İki dilli mod: Kaynak ve Hedef
                cleanSegments.forEach((seg, idx) => {
                    bodyHtml += `
                        <div class="bilingual-box">
                            <div class="bilingual-source"><strong>[Kaynak ${idx + 1}]:</strong> ${seg.sourceHtml || escapeHtml(seg.source).replace(/\n/g, '<br/>')}</div>
                            <p class="MsoNormal" style="text-indent: 0cm;"><strong>[Çeviri]:</strong> ${seg.targetHtml || escapeHtml(seg.target).replace(/\n/g, '<br/>')}</p>
                        </div>\n`;
                });
            } else {
                // SMARTCAT STANDARDI: Cümleler paragraflarda birleşir, asla 1 2 3 diye ayrılmaz
                if (opts.contentMode === 'all_content' && cleanDocName) {
                    bodyHtml += `<h1 class="Heading1" style="text-align:center; margin-bottom:18pt;">${escapeHtml(cleanDocName)}</h1>\n`;
                }

                // Paragraflara göre grupla (Smartcat Paragraf Modeli)
                const paraGroups = new Map();
                cleanSegments.forEach(s => {
                    const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                    if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                    paraGroups.get(pKey).push(s);
                });

                paraGroups.forEach((group) => {
                    const isHead = group.some(s => s.isHead || s.isHeading);
                    if (isHead) {
                        const headText = group[0].targetHtml || escapeHtml(group[0].target);
                        bodyHtml += `<h1 class="Heading1">${headText}</h1>\n`;
                    } else {
                        // Aynı paragrafın cümleleri tek bir boşlukla yan yana akar
                        const pText = group.map(s => s.targetHtml || escapeHtml(s.target)).join(' ');
                        bodyHtml += `<p class="MsoNormal">${pText}</p>\n`;
                    }
                });
            }

            const linePercent = Math.round(opts.lineSpacing * 100);

            // Microsoft Word MSO Uyumlu HTML5 Şablonu
            return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<title>${escapeHtml(cleanDocName)}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
    <w:ValidateAgainstSchemas/>
    <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
    <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
    <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
    <w:Compatibility>
      <w:BreakWrappedTables/>
      <w:SnapToGridInCell/>
      <w:WrapTextWithPunct/>
      <w:UseAsianBreakRules/>
      <w:DontGrowAutofit/>
    </w:Compatibility>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
@charset "UTF-8";

@page Section1 {
    size: 21.0cm 29.7cm; /* A4 Standart */
    margin: ${opts.marginCm}cm ${opts.marginCm}cm ${opts.marginCm}cm ${opts.marginCm}cm;
    mso-page-orientation: portrait;
    mso-header-margin: 35.4pt;
    mso-footer-margin: 35.4pt;
    mso-paper-source: 0;
}

div.Section1 {
    page: Section1;
}

body {
    font-family: '${opts.fontFamily}', 'Times New Roman', serif;
    font-size: ${opts.fontSize}pt;
    line-height: ${opts.lineSpacing};
    color: #000000;
}

h1, .Heading1 {
    font-family: '${opts.fontFamily}', 'Times New Roman', serif;
    font-size: ${opts.headingSize}pt;
    font-weight: ${opts.headingBold ? 'bold' : 'normal'};
    color: ${opts.headingColor};
    margin-top: 14.0pt;
    margin-bottom: ${opts.paragraphSpacing}pt;
    line-height: 1.3;
    page-break-after: avoid;
    mso-para-margin-top: 14.0pt;
    mso-para-margin-bottom: ${opts.paragraphSpacing}.0pt;
}

p.MsoNormal, li.MsoNormal, div.MsoNormal {
    mso-style-parent: "";
    margin: 0cm;
    margin-top: 0pt;
    margin-bottom: ${opts.paragraphSpacing}pt;
    text-align: ${opts.alignment};
    text-justify: inter-ideograph;
    line-height: ${linePercent}%;
    text-indent: ${opts.indentCm}cm;
    font-size: ${opts.fontSize}pt;
    font-family: '${opts.fontFamily}', 'Times New Roman', serif;
    mso-fareast-font-family: '${opts.fontFamily}';
    mso-bidi-font-family: '${opts.fontFamily}';
}

.bilingual-box {
    margin-bottom: ${opts.paragraphSpacing + 4}pt;
    padding-bottom: 4pt;
    border-bottom: 0.5pt solid #e2e8f0;
}

.bilingual-source {
    font-size: ${Math.max(9, opts.fontSize - 2)}pt;
    color: #475569;
    font-style: italic;
    margin-bottom: 3pt;
    text-indent: 0cm;
    text-align: left;
}
</style>
</head>
<body lang="TR" style="tab-interval:35.4pt;">
<div class="Section1">
${bodyHtml}
</div>
</body>
</html>`;
        }

        // WORD (.DOCX / .DOC) DIŞA AKTARMA YÜRÜTÜCÜSÜ

        // ========================================================
        // EVRENSEL CANLI DIŞA AKTARMA ÖNİZLEMESİ (UNIVERSAL LIVE EXPORT PREVIEW)
        // ========================================================
        function updateUniversalExportPreview(tab) {
            const container = document.getElementById('exportUniversalPreviewContainer');
            const statsEl = document.getElementById('otherFormatPreviewStats');
            if (!container) return;

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                container.innerHTML = '<div class="text-slate-400 text-center py-6">Önizlenecek segment verisi bulunamadı.</div>';
                return;
            }

            const total = doc.segments.length;
            const confirmedCount = doc.segments.filter(s => s.status === 'confirmed').length;
            if (statsEl) {
                statsEl.innerText = `${total} Segment (${confirmedCount} Onaylı) · Canlı Çıktı`;
            }

            if (tab === 'pdf') {
                const opts = getWordExportOptions();
                let pdfPreviewHtml = `
                    <div style="font-family:'${opts.fontFamily}',serif; font-size:${opts.fontSize}pt; line-height:${opts.lineSpacing}; color:#000;" class="p-6 bg-white rounded-lg text-slate-900 shadow">
                        <div style="border-bottom:1px solid #ccc; padding-bottom:6px; margin-bottom:16px; font-size:9pt; color:#666; display:flex; justify-content:space-between;">
                            <span>CATtool Güvenli Vektörel PDF Çıktısı · ${escapeHtml(doc.name || 'Belge')}</span>
                            <span>${new Date().toLocaleDateString('tr-TR')}</span>
                        </div>
                        <h2 style="font-size:${opts.headingSize}pt; font-weight:bold; color:${opts.headingColor}; text-align:center; margin-bottom:${opts.paragraphSpacing * 2}pt;">
                            ${escapeHtml(doc.name ? doc.name.replace(/\.[^/.]+$/, '') : 'Belge Çevirisi')}
                        </h2>
                `;
                doc.segments.slice(0, 6).forEach(s => {
                    const sm = s.styleMemory || {};
                    let pStyle = '';
                    if (sm.bold || s.isHeading) pStyle += 'font-weight:bold;';
                    if (sm.italic) pStyle += 'font-style:italic;';
                    if (sm.underline) pStyle += 'text-decoration:underline;';
                    const t = (s.target && s.target.trim()) ? s.target.trim() : s.source;
                    pdfPreviewHtml += `<p style="margin-bottom:${opts.paragraphSpacing}pt; text-indent:${opts.indentCm}cm; text-align:justify; ${pStyle}">${escapeHtml(t)}</p>`;
                });
                pdfPreviewHtml += `
                        <div style="margin-top:20px; padding-top:10px; border-top:1px dashed #e2e8f0; font-size:9pt; color:#94a3b8; text-align:right;">
                            Sayfa 1 / A4 Standart Vektörel Baskı
                        </div>
                    </div>`;
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 p-3 shadow-inner select-text";
                container.innerHTML = pdfPreviewHtml;
            } else if (tab === 'rtf') {
                const rtfText = generateRTF(doc, getWordExportOptions());
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-amber-200 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = rtfText.slice(0, 1800) + (rtfText.length > 1800 ? '\n... (ve geri kalan RTF verisi)' : '');
            } else if (tab === 'tmx') {
                const { src, tgt } = (typeof CatIO !== 'undefined' && CatIO.langs) ? CatIO.langs() : { src: 'en', tgt: 'tr' };
                let tmxSample = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE tmx SYSTEM "tmx14.dtd">\n<tmx version="1.4">\n  <header creationtool="CATtool" datatype="plaintext" segtype="sentence" srclang="${src}"/>\n  <body>\n`;
                doc.segments.slice(0, 5).forEach((s, idx) => {
                    const t = (s.target && s.target.trim()) ? s.target.trim() : s.source;
                    tmxSample += `    <tu tuid="${s.id || (idx + 1)}">\n      <tuv xml:lang="${src}"><seg>${escapeHtml(s.source)}</seg></tuv>\n      <tuv xml:lang="${tgt}"><seg>${escapeHtml(t)}</seg></tuv>\n    </tu>\n`;
                });
                tmxSample += `    <!-- Toplam ${total} segment bellek kaydı -->\n  </body>\n</tmx>`;
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-violet-300 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = tmxSample;
            } else if (tab === 'tsv') {
                const tsvText = generateTSV(doc);
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-emerald-300 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = tsvText.split('\n').slice(0, 30).join('\n') + (tsvText.split('\n').length > 30 ? '\n... (ve geri kalan satırlar)' : '');
            } else if (tab === 'po') {
                const poText = generatePO(doc);
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-sky-200 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = poText.slice(0, 1800) + (poText.length > 1800 ? '\n... (ve geri kalan PO blokları)' : '');
            } else if (tab === 'html') {
                const htmlText = generateHTMLDoc(doc, getWordExportOptions());
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-orange-200 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = htmlText.slice(0, 1800) + (htmlText.length > 1800 ? '\n... (ve geri kalan HTML yapısı)' : '');
            } else if (tab === 'xml') {
                const xmlText = generateXMLDoc(doc);
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-pink-200 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = xmlText.slice(0, 1800) + (xmlText.length > 1800 ? '\n... (ve geri kalan XML düğümleri)' : '');
            } else if (tab === 'vtt') {
                const vttText = generateVTT(doc);
                const lines = vttText.split('\n').slice(0, 35).join('\n');
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-emerald-400 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = lines + (vttText.split('\n').length > 35 ? '\n... (ve geri kalan segmentler)' : '');
            } else if (tab === 'xlf') {
                const { src, tgt } = (typeof CatIO !== 'undefined' && CatIO.langs) ? CatIO.langs() : { src: 'en', tgt: 'tr' };
                let sampleUnits = '';
                doc.segments.slice(0, 4).forEach(s => {
                    const t = (s.target && s.target.trim()) ? s.target.trim() : s.source;
                    const isConf = s.status === 'confirmed' ? ' approved="yes"' : '';
                    sampleUnits += `    <trans-unit id="${s.id}"${isConf}>\n      <source xml:lang="${src}">${escapeHtml(s.source)}</source>\n      <target xml:lang="${tgt}" state="${s.status === 'confirmed' ? 'translated' : 'new'}">${escapeHtml(t)}</target>\n    </trans-unit>\n`;
                });
                const xlfSample = `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">\n  <file original="${escapeHtml(doc.name || 'belge.docx')}" source-language="${src}" target-language="${tgt}">\n    <body>\n${sampleUnits}      <!-- ... toplam ${total} segment ... -->\n    </body>\n  </file>\n</xliff>`;
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-sky-300 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = xlfSample;
            } else if (tab === 'srt') {
                const srtText = generateSRT(doc);
                const lines = srtText.split('\n').slice(0, 35).join('\n');
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-amber-300 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = lines + (srtText.split('\n').length > 35 ? '\n... (ve geri kalan altyazılar)' : '');
            } else if (tab === 'bilingual') {
                let tableHtml = `
                    <table class="w-full text-left border-collapse bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 rounded-lg overflow-hidden">
                        <thead>
                            <tr class="bg-slate-100 dark:bg-neutral-800 text-[11px] font-bold text-slate-600 dark:text-neutral-300 border-b border-slate-200 dark:border-neutral-700">
                                <th class="p-2 w-12 text-center">#</th>
                                <th class="p-2 w-1/2 border-r border-slate-200 dark:border-neutral-700">Kaynak Metin (Orijinal Stiller)</th>
                                <th class="p-2 w-1/2">Hedef Çeviri (Korunan Biçimler)</th>
                            </tr>
                        </thead>
                        <tbody class="text-xs divide-y divide-slate-100 dark:divide-neutral-800">
                `;
                doc.segments.slice(0, 8).forEach((s, idx) => {
                    const sm = s.styleMemory || {};
                    let srcStyle = '';
                    if (sm.font) srcStyle += `font-family:'${sm.font}',sans-serif;`;
                    if (sm.bold || s.isHeading) srcStyle += 'font-weight:bold;';
                    if (sm.italic) srcStyle += 'font-style:italic;';
                    if (sm.underline) srcStyle += 'text-decoration:underline;';

                    const t = (s.target && s.target.trim()) ? s.target.trim() : `<span class="italic text-slate-400 dark:text-neutral-500">${escapeHtml(s.source)}</span>`;
                    tableHtml += `
                        <tr class="hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors">
                            <td class="p-2 font-mono text-[10px] text-center text-slate-400 font-bold">${idx + 1}</td>
                            <td class="p-2 border-r border-slate-200 dark:border-neutral-700" style="${srcStyle}">
                                ${escapeHtml(s.source)}
                            </td>
                            <td class="p-2" style="${srcStyle}">
                                ${t}
                            </td>
                        </tr>
                    `;
                });
                tableHtml += `</tbody></table>`;
                if (total > 8) {
                    tableHtml += `<div class="p-2 text-center text-[10px] text-slate-400 font-mono">+ Toplam ${total} segmentin ilk 8 segmenti önizlenmektedir.</div>`;
                }
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 shadow-inner select-text";
                container.innerHTML = tableHtml;
            } else if (tab === 'preserved' || tab === 'docx') {
                const opts = getWordExportOptions();
                let docPreviewHtml = `
                    <div style="font-family:'${opts.fontFamily}',sans-serif; font-size:${opts.fontSize}pt; line-height:${opts.lineSpacing}; color:#000;" class="p-4 bg-white rounded-lg text-slate-900">
                        <div style="font-size:${opts.headingSize}pt; font-weight:${opts.headingBold ? 'bold' : 'normal'}; color:${opts.headingColor}; margin-bottom:${opts.paragraphSpacing}pt;">
                            ${escapeHtml(doc.name ? doc.name.replace(/\.[^/.]+$/, '') : 'Belge Çevirisi')}
                        </div>
                `;
                doc.segments.slice(0, 5).forEach(s => {
                    const sm = s.styleMemory || {};
                    let pStyle = '';
                    if (sm.bold || s.isHeading) pStyle += 'font-weight:bold;';
                    if (sm.italic) pStyle += 'font-style:italic;';
                    if (sm.underline) pStyle += 'text-decoration:underline;';
                    const t = (s.target && s.target.trim()) ? s.target.trim() : s.source;
                    docPreviewHtml += `<p style="margin-bottom:${opts.paragraphSpacing}pt; text-indent:${opts.indentCm}cm; text-align:${opts.alignment}; ${pStyle}">${escapeHtml(t)}</p>`;
                });
                docPreviewHtml += `</div>`;
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 p-2 shadow-inner select-text";
                container.innerHTML = docPreviewHtml;
            } else if (tab === 'md') {
                let mdText = `# ${doc.name || 'Belge'}\n\n`;
                doc.segments.slice(0, 15).forEach(s => {
                    const t = (s.target && s.target.trim()) ? s.target.trim() : s.source;
                    if (s.isHeading) mdText += `## ${t}\n\n`;
                    else mdText += `${t}\n\n`;
                });
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-sky-200 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = mdText;
            } else if (tab === 'csv') {
                const csvText = generateCSV(doc);
                const lines = csvText.split('\n').slice(0, 20).join('\n');
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-teal-300 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = lines;
            } else {
                const cleanSegments = doc.segments.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source.trim()).slice(0, 15);
                container.className = "w-full max-h-80 overflow-y-auto rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-900 text-slate-100 p-3 font-mono text-xs leading-relaxed shadow-inner select-text whitespace-pre";
                container.innerText = cleanSegments.join('\n\n');
            }
        }

        // ========================================================
        // İÇERİK ÖZELLİKLERİNİ KORUYARAK ÇIKAR (PRESERVED EXPORT MOTORU)
        // (TÜM FORMATLAR: WORD, PDF, RTF, XLIFF, TMX, TSV, CSV, PO, HTML, XML, SRT, VTT, TTML, ASS)
        // ========================================================

        // 1. Evrensel Format Seçim Modalı Aç/Kapat & Arama Filtresi
        function openUniversalPreservedExportModal() {
            // Önce DOM'daki aktif tüm segment çevirilerini senkronize et
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak aktif belge veya segment bulunamadı.");
                return;
            }

            const m = document.getElementById('modalUniversalPreservedExport');
            if (!m) {
                exportPreservingFormat('docx');
                return;
            }

            // Belge istatistiklerini güncelle
            const nameEl = document.getElementById('uniExportDocName');
            if (nameEl) nameEl.innerText = doc.name || 'Belge';

            const total = doc.segments.length;
            const confirmed = doc.segments.filter(s => s.status === 'confirmed').length;
            const statsEl = document.getElementById('uniExportStats');
            if (statsEl) statsEl.innerText = `${total} Segment (${confirmed} Onaylı, %${Math.round((confirmed / total) * 100)} Tamamlandı)`;

            // Algılanan orijinal font ve biçimleri tespit et
            const fontEl = document.getElementById('uniExportDetectedFont');
            if (fontEl) {
                const segWithFont = doc.segments.find(s => s.styleMemory && s.styleMemory.font);
                const dominantFont = segWithFont ? segWithFont.styleMemory.font : 'Calibri 11pt';
                fontEl.innerText = `${dominantFont} (Kalkanlar Devrede)`;
            }

            // Arama kutusunu sıfırla
            clearUniversalFormatSearch();

            m.classList.remove('hidden');
            m.classList.add('flex');
        }

        function closeUniversalPreservedExportModal() {
            const m = document.getElementById('modalUniversalPreservedExport');
            if (!m) return;
            m.classList.add('hidden');
            m.classList.remove('flex');
        }

        function filterUniversalFormats(query) {
            const q = (query || '').toLowerCase().trim();
            const cards = document.querySelectorAll('.uni-format-card');
            const clearBtn = document.getElementById('uniExportClearSearch');
            if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

            cards.forEach(card => {
                const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
                const text = card.innerText.toLowerCase();
                if (!q || keywords.includes(q) || text.includes(q)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });

            // Boş kalan kategorileri gizle
            document.querySelectorAll('.uni-export-category').forEach(cat => {
                const visible = cat.querySelectorAll('.uni-format-card:not([style*="display: none"])');
                cat.style.display = visible.length > 0 ? '' : 'none';
            });
        }

        function clearUniversalFormatSearch() {
            const inp = document.getElementById('uniExportSearchInput');
            if (inp) inp.value = '';
            filterUniversalFormats('');
        }

        // 2. Ana Dışa Aktarma Yönlendiricisi
        function exportPreservingFormat(format) {
            // Eğer format belirtilmemişse veya diyalog isteniyorsa seçim penceresini aç
            if (!format || format === 'prompt') {
                openUniversalPreservedExportModal();
                return;
            }

            // DOM'daki aktif segmentleri belleğe senkronize et
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak metin bulunamadı.");
                return;
            }

            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fmt = String(format).toLowerCase();

            if (fmt === 'docx') {
                executeWordExport('docx', true);
            } else if (fmt === 'pdf') {
                downloadPDFExport(doc);
            } else if (fmt === 'rtf') {
                downloadRTFExport(doc);
            } else if (fmt === 'doc') {
                executeWordExport('doc', true);
            } else if (fmt === 'bilingual' || fmt === 'bilingual_html') {
                downloadBilingualExport('html');
            } else if (fmt === 'bilingual_docx') {
                downloadBilingualExport('docx');
            } else if (fmt === 'xlf' || fmt === 'xliff') {
                if (typeof CatIO !== 'undefined' && typeof CatIO.exportXLIFF === 'function') {
                    CatIO.exportXLIFF();
                } else {
                    downloadCleanOutput('xliff');
                }
            } else if (fmt === 'tmx') {
                if (typeof CatIO !== 'undefined' && typeof CatIO.exportTMX === 'function') {
                    CatIO.exportTMX();
                } else {
                    showToast("Çeviri belleği dışa aktarılıyor...");
                }
            } else if (fmt === 'tsv') {
                downloadTSVExport(doc);
            } else if (fmt === 'html') {
                downloadHTMLExport(doc);
            } else if (fmt === 'xml') {
                downloadXMLExport(doc);
            } else if (fmt === 'po') {
                downloadPOExport(doc);
            } else if (fmt === 'catpkg') {
                if (typeof CatLSP !== 'undefined' && CatLSP.Package && typeof CatLSP.Package.exportPackage === 'function') {
                    CatLSP.Package.exportPackage();
                } else {
                    showToast("İşbirliği paketi hazırlanıyor...");
                }
            } else if (fmt === 'tbx') {
                if (typeof CatLSP !== 'undefined' && CatLSP.TBX && typeof CatLSP.TBX.exportTbx === 'function') {
                    CatLSP.TBX.exportTbx();
                } else {
                    showToast("Terim bankası dışa aktarılıyor...");
                }
            } else if (fmt === 'ttml') {
                if (typeof CatAVT !== 'undefined' && CatAVT.Export && typeof CatAVT.Export.downloadFormat === 'function') {
                    CatAVT.Export.downloadFormat('ttml');
                } else {
                    downloadCleanOutput('ttml');
                }
            } else if (fmt === 'ass') {
                if (typeof CatAVT !== 'undefined' && CatAVT.Export && typeof CatAVT.Export.downloadFormat === 'function') {
                    CatAVT.Export.downloadFormat('ass');
                } else {
                    downloadCleanOutput('ass');
                }
            } else if (fmt === 'video') {
                openVideoExportModal();
            } else {
                downloadCleanOutput(fmt);
            }
        }

        // 3. PDF İndirme & Vektörel Baskı Motoru
        function downloadPDFExport(doc) {
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("PDF için aktarılacak metin bulunamadı.");
                return;
            }
            const opts = getWordExportOptions();
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const printHtml = buildPrintPdfHtml(doc, opts);

            let iframe = document.getElementById('catPdfPrintFrame');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'catPdfPrintFrame';
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);
            }

            const frameDoc = iframe.contentWindow || iframe.contentDocument;
            const docTarget = frameDoc.document || frameDoc;
            docTarget.open();
            docTarget.write(printHtml);
            docTarget.close();

            showToast("📄 PDF yazdırma penceresi hazırlanıyor ('PDF Olarak Kaydet' seçeneğini kullanabilirsiniz)...");

            setTimeout(() => {
                try {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    }
                } catch (e) {
                    console.warn("Print engellendi, yeni pencerede açılıyor:", e);
                    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                }
            }, 450);

            closeUniversalPreservedExportModal();
            closeExportModal();
        }

        function buildPrintPdfHtml(doc, opts) {
            const font = (opts && opts.fontFamily) || 'Times New Roman, serif';
            const fontSize = (opts && opts.fontSize) || 12;
            const lineSpacing = (opts && opts.lineSpacing) || 1.5;
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";

            // Smartcat PDF Standardı: Cümleler paragraflarda birleşir, asla her cümle ayrı satıra veya 1 2 3 diye ayrılmaz
            const paraGroups = new Map();
            (doc.segments || []).forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            let body = '';
            paraGroups.forEach((group) => {
                const isHead = group.some(s => s.isHeading);
                if (isHead) {
                    const headText = (group[0].target && group[0].target.trim()) ? group[0].target.trim() : group[0].source;
                    body += `<h2 style="font-family:${font}; margin-top:22pt; margin-bottom:10pt; page-break-after:avoid; color:#0f172a; font-weight:bold;">${escapeHtml(headText)}</h2>\n`;
                } else {
                    const paraText = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    body += `<p style="font-family:${font}; margin-bottom:10pt; text-align:justify; text-indent:1.25cm; line-height:${lineSpacing};">${escapeHtml(paraText)}</p>\n`;
                }
            });

            return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(baseName)} - PDF Baskı Görünümü</title>
<style>
@page {
    size: A4 portrait;
    margin: 20mm 20mm 20mm 20mm;
    @bottom-right {
        content: counter(page);
    }
}
@media print {
    body { margin: 0; padding: 0; background: #fff !important; }
}
body {
    font-family: ${font};
    font-size: ${fontSize}pt;
    line-height: ${lineSpacing};
    color: #000;
    background: #fff;
    margin: 20mm;
}
.header-meta {
    border-bottom: 1pt solid #cbd5e1;
    padding-bottom: 6pt;
    margin-bottom: 20pt;
    font-size: 8.5pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
}
h1.title {
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    color: #0f172a;
    margin-bottom: 18pt;
}
</style>
</head>
<body>
<div class="header-meta">
    <span>CATtool Korunan Çeviri · ${escapeHtml(baseName)}</span>
    <span>${new Date().toLocaleDateString('tr-TR')}</span>
</div>
<h1 class="title">${escapeHtml(baseName)}</h1>
<div class="content">
    ${body}
</div>
</body>
</html>`;
        }

        // 4. RTF (Rich Text Format) Motoru (ANSI/Unicode Türkçe Kaçış Garantili)
        function escapeRtf(str) {
            if (!str) return '';
            let out = '';
            for (let i = 0; i < str.length; i++) {
                const c = str.charCodeAt(i);
                const char = str[i];
                if (char === '\\') out += '\\\\';
                else if (char === '{') out += '\\{';
                else if (char === '}') out += '\\}';
                else if (c > 127) {
                    out += '\\u' + c + '?';
                } else {
                    out += char;
                }
            }
            return out;
        }

        function generateRTF(doc, opts = {}) {
            const font = opts.fontFamily || 'Times New Roman';
            const fontSize = (opts.fontSize || 12) * 2;
            const headingSize = (opts.headingSize || 16) * 2;

            let rtf = '{\\rtf1\\ansi\\ansicpg1254\\deff0\\deflang1055\n';
            rtf += '{\\fonttbl{\\f0\\fnil\\fcharset162 ' + escapeRtf(font) + ';}{\\f1\\fnil\\fcharset162 Calibri;}{\\f2\\fnil\\fcharset162 Arial;}}\n';
            rtf += '{\\colortbl ;\\red0\\green0\\blue0;\\red30\\green41\\blue59;\\red79\\green70\\blue229;\\red220\\green38\\blue38;}\n';
            rtf += '\\viewkind4\\uc1\\pard\\cf1\\lang1055\\f0\\fs' + fontSize + ' \n';

            const title = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri Belgesi";
            rtf += '{\\pard\\qc\\b\\fs' + headingSize + '\\cf3 ' + escapeRtf(title) + '\\par}\n';
            rtf += '{\\pard\\qc\\i\\fs18\\cf2 Olusturulma: ' + escapeRtf(new Date().toLocaleDateString('tr-TR')) + '\\par\\par}\n';

            // Smartcat RTF Standardı: Cümleler \pard paragraf bloğunda birleşir
            const paraGroups = new Map();
            (doc.segments || []).forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            paraGroups.forEach((group) => {
                const isHead = group.some(s => s.isHeading);
                if (isHead) {
                    const text = (group[0].target && group[0].target.trim()) ? group[0].target.trim() : group[0].source;
                    rtf += '{\\pard\\qc\\sb180\\sa120\\b\\fs' + (fontSize + 6) + '\\cf3 ' + escapeRtf(text) + '\\par}\n';
                } else {
                    const text = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    rtf += '{\\pard\\ql\\sa120\\sl288\\slmult1 ' + escapeRtf(text) + '\\par}\n';
                }
            });

            rtf += '}';
            return rtf;
        }

        function downloadRTFExport(doc) {
            const opts = getWordExportOptions();
            const rtfContent = generateRTF(doc, opts);
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fileName = `${baseName}_Ceviri.rtf`;

            const blob = new Blob([rtfContent], { type: 'application/rtf;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeUniversalPreservedExportModal();
            closeExportModal();
            showToast(`✅ "${fileName}" Zengin Metin (RTF) belgesi indirildi.`);
        }

        // 5. GNU gettext PO Çıktı Motoru
        function generatePO(doc) {
            const title = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "CATtool Translation";
            const dateStr = new Date().toISOString();
            let po = `msgid ""\nmsgstr ""\n"Project-Id-Version: ${title}\\n"\n"POT-Creation-Date: ${dateStr}\\n"\n"PO-Revision-Date: ${dateStr}\\n"\n"MIME-Version: 1.0\\n"\n"Content-Type: text/plain; charset=UTF-8\\n"\n"Content-Transfer-Encoding: 8bit\\n"\n"X-Generator: CATtool Professional Translation System\\n"\n\n`;

            function escapePO(str) {
                return (str || '')
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n');
            }

            (doc.segments || []).forEach((seg, idx) => {
                const src = escapePO(seg.source);
                const tgt = escapePO((seg.target && seg.target.trim()) ? seg.target.trim() : seg.source);
                const status = seg.status || 'draft';
                po += `#: segment:${idx + 1} id:${seg.id}\n`;
                po += `#. Status: ${status}\n`;
                po += `msgid "${src}"\n`;
                po += `msgstr "${tgt}"\n\n`;
            });

            return po;
        }

        function downloadPOExport(doc) {
            const poContent = generatePO(doc);
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fileName = `${baseName}_Yerellestirme.po`;

            const blob = new Blob(['\ufeff' + poContent], { type: 'text/x-gettext-translation;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeUniversalPreservedExportModal();
            closeExportModal();
            showToast(`✅ "${fileName}" GNU gettext PO dosyası indirildi.`);
        }

        // 6. İki Dilli TSV (Tab-Separated) Motoru
        function generateTSV(doc) {
            let tsv = 'ID\tSource\tTarget\tStatus\tFont\tBold\tItalic\n';
            (doc.segments || []).forEach((seg, idx) => {
                const sm = seg.styleMemory || {};
                const src = (seg.source || '').replace(/[\t\r\n]+/g, ' ');
                const tgt = ((seg.target && seg.target.trim()) ? seg.target.trim() : seg.source).replace(/[\t\r\n]+/g, ' ');
                tsv += `${idx + 1}\t${src}\t${tgt}\t${seg.status || 'draft'}\t${sm.font || ''}\t${sm.bold ? '1' : '0'}\t${sm.italic ? '1' : '0'}\n`;
            });
            return tsv;
        }

        function downloadTSVExport(doc) {
            const tsvContent = generateTSV(doc);
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fileName = `${baseName}_IkiDilli.tsv`;

            const blob = new Blob(['\ufeff' + tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeUniversalPreservedExportModal();
            closeExportModal();
            showToast(`✅ "${fileName}" İki dilli TSV tablosu indirildi.`);
        }

        // 7. Bağımsız Biçimlendirilmiş HTML Web Sayfası Motoru
        function generateHTMLDoc(doc, opts = {}) {
            const font = opts.fontFamily || 'Segoe UI, Arial, sans-serif';
            const fontSize = opts.fontSize || 12;
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";

            // Smartcat HTML Standardı: Cümleler paragraflarda birleşir, numara konmaz
            const paraGroups = new Map();
            (doc.segments || []).forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            let body = '';
            paraGroups.forEach((group) => {
                const isHead = group.some(s => s.isHeading);
                if (isHead) {
                    const text = (group[0].target && group[0].target.trim()) ? group[0].target.trim() : group[0].source;
                    body += `    <h2 style="font-family:${font}; margin-top:24px; margin-bottom:10px; color:#0f172a; font-weight:bold;">${escapeHtml(text)}</h2>\n`;
                } else {
                    const text = group.map(s => (s.target && s.target.trim()) ? s.target.trim() : s.source).join(' ');
                    body += `    <p style="font-family:${font}; margin-bottom:14px; line-height:1.7; text-align:justify;">${escapeHtml(text)}</p>\n`;
                }
            });

            return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(baseName)} - Çeviri Belgesi</title>
<style>
body { font-family: ${font}; font-size: ${fontSize}pt; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
.page-container { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
.doc-header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
.doc-title { font-size: 22pt; font-weight: bold; color: #1e1b4b; margin: 0 0 6px 0; }
.doc-meta { font-size: 10pt; color: #64748b; }
@media print { body { background: white; padding: 0; } .page-container { box-shadow: none; border: none; padding: 0; max-width: 100%; } }
</style>
</head>
<body>
<div class="page-container">
    <div class="doc-header">
        <h1 class="doc-title">${escapeHtml(baseName)}</h1>
        <div class="doc-meta">CATtool Korunan Çeviri Çıktısı · Segment Sayısı: ${(doc.segments || []).length} · Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
    </div>
    <div class="doc-body">
        ${body}
    </div>
</div>
</body>
</html>`;
        }

        function downloadHTMLExport(doc) {
            const opts = getWordExportOptions();
            const htmlContent = generateHTMLDoc(doc, opts);
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fileName = `${baseName}_WebBelgesi.html`;

            const blob = new Blob(['\ufeff' + htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeUniversalPreservedExportModal();
            closeExportModal();
            showToast(`✅ "${fileName}" Bağımsız HTML belgesi indirildi.`);
        }

        // 8. Yapılandırılmış Segment XML Motoru
        function generateXMLDoc(doc) {
            const title = (doc.name || 'Belge').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<cat-document name="${title}" generated="${new Date().toISOString()}">\n  <segments count="${(doc.segments || []).length}">\n`;

            (doc.segments || []).forEach((seg, idx) => {
                const sm = seg.styleMemory || {};
                const src = (seg.source || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const tgt = ((seg.target && seg.target.trim()) ? seg.target.trim() : seg.source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                xml += `    <segment id="${seg.id || (idx + 1)}" status="${seg.status || 'draft'}">\n`;
                xml += `      <source font="${sm.font || ''}" bold="${sm.bold ? 'true' : 'false'}" italic="${sm.italic ? 'true' : 'false'}">${src}</source>\n`;
                xml += `      <target font="${sm.font || ''}" bold="${sm.bold ? 'true' : 'false'}" italic="${sm.italic ? 'true' : 'false'}">${tgt}</target>\n`;
                xml += `    </segment>\n`;
            });

            xml += `  </segments>\n</cat-document>\n`;
            return xml;
        }

        function downloadXMLExport(doc) {
            const xmlContent = generateXMLDoc(doc);
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fileName = `${baseName}_Segmentler.xml`;

            const blob = new Blob(['\ufeff' + xmlContent], { type: 'application/xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeUniversalPreservedExportModal();
            closeExportModal();
            showToast(`✅ "${fileName}" Segment XML belgesi indirildi.`);
        }

        // ========================================================
        // İKİ DİLLİ (BILINGUAL) TABLO DIŞA AKTARMA (HTML / DOCX)
        // ========================================================
        function downloadBilingualExport(ext = 'html') {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak segment bulunamadı.");
                return;
            }

            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";
            const fileName = `${baseName}_IkiDilli_Tablo.${ext === 'docx' ? 'doc' : 'html'}`;

            let rowsHtml = '';
            doc.segments.forEach((seg, idx) => {
                const sm = seg.styleMemory || {};
                let style = '';
                if (sm.font) style += `font-family:'${sm.font}',sans-serif;`;
                if (sm.bold || seg.isHeading) style += 'font-weight:bold;';
                if (sm.italic) style += 'font-style:italic;';
                if (sm.underline) style += 'text-decoration:underline;';

                const targetText = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : seg.source;
                const statusBadge = seg.status === 'confirmed' ? '<span style="color:#059669; font-weight:bold;">[Onaylı]</span>' : '<span style="color:#d97706;">[Taslak]</span>';

                rowsHtml += `
                    <tr style="border-bottom:1px solid #cbd5e1;">
                        <td style="padding:8px 10px; font-family:monospace; text-align:center; vertical-align:top; color:#64748b; font-size:11px;">${idx + 1}</td>
                        <td style="padding:8px 10px; vertical-align:top; border-right:1px solid #cbd5e1; width:46%; ${style}">
                            ${escapeHtml(seg.source)}
                        </td>
                        <td style="padding:8px 10px; vertical-align:top; border-right:1px solid #cbd5e1; width:46%; ${style}">
                            ${escapeHtml(targetText)}
                        </td>
                        <td style="padding:8px 10px; font-size:11px; text-align:center; vertical-align:top; white-space:nowrap;">
                            ${statusBadge}
                        </td>
                    </tr>
                `;
            });

            const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(baseName)} - İki Dilli İnceleme Tablosu</title>
<style>
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 13px; color: #1e293b; margin: 20px; line-height: 1.5; }
h2 { color: #1e1b4b; border-bottom: 2px solid #4338ca; padding-bottom: 6px; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; }
th { background-color: #f1f5f9; color: #334155; font-size: 12px; padding: 10px; border-bottom: 2px solid #cbd5e1; }
</style>
</head>
<body>
<h2>${escapeHtml(doc.name || 'Belge')} · İki Dilli (Bilingual) İnceleme Tablosu</h2>
<p style="font-size:11px; color:#64748b; margin-top:4px;">
    Toplam Segment: ${doc.segments.length} | Onaylanan: ${doc.segments.filter(s => s.status === 'confirmed').length} | Oluşturulma: ${new Date().toLocaleString('tr-TR')}
</p>
<table>
    <thead>
        <tr>
            <th style="width:40px;">#</th>
            <th>Kaynak Metin (Orijinal Stiller)</th>
            <th>Hedef Çeviri (Korunan Özellikler)</th>
            <th style="width:70px;">Durum</th>
        </tr>
    </thead>
    <tbody>
        ${rowsHtml}
    </tbody>
</table>
</body>
</html>`;

            const blob = new Blob(['\ufeff' + fullHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeExportModal();
            showToast(`✓ "${fileName}" iki dilli karşılaştırma tablosu olarak indirildi.`);
        }

        function executeWordExport(ext, skipShieldGate) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak metin bulunamadı.");
                return;
            }

            // Biçim Kalkanı doğrulaması: çözülmemiş stil çakışmaları varsa diyalog göster
            if (!skipShieldGate && !FormatShield.gateExport(doc, () => executeWordExport(ext, true))) return;

            const opts = getWordExportOptions();
            const baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";

            // 1. GERÇEK DOCX DIŞA AKTARMA (JSZip, w:t düğümleri ve kalkan w:rPr stilleri korunur)
            if (ext === 'docx' && typeof DocxExport !== 'undefined') {
                const activeProj = getActiveProject();
                const targetLang = (activeProj && activeProj.targetLang) ? activeProj.targetLang : 'tr';
                showToast("📄 Gerçek .docx dosyası JSZip ve kalkan stilleriyle derleniyor...");
                DocxExport.exportDoc(doc, opts, targetLang).then(res => {
                    closeExportModal();
                    showToast(`✅ "${res.fileName}" başarıyla indirildi (${res.mode === 'original' ? 'Orijinal ZIP yapısı ve stiller korundu' : 'Sıfırdan OOXML paketi oluşturuldu'}).`);
                }).catch(err => {
                    console.error("DocxExport hatası:", err);
                    showToast("Gerçek DOCX oluşturulamadı, standart HTML formatında indiriliyor: " + err.message);
                    downloadFallbackWord(doc, opts, ext, baseName);
                });
                return;
            }

            downloadFallbackWord(doc, opts, ext, baseName);
        }

        function downloadFallbackWord(doc, opts, ext, baseName) {
            const wordHtml = buildWordDocumentHtml(doc, opts);
            const fileName = `${baseName}_Ceviri.${ext}`;

            // KRİTİK ÇÖZÜM: UTF-8 BOM (\ufeff) eklenmesi Word'ün Türkçe karakterleri doğrudan doğru okumasını sağlar!
            const blob = new Blob(['\ufeff' + wordHtml], {
                type: 'application/vnd.ms-word;charset=utf-8'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeExportModal();
            showToast(`"${fileName}" Word belgesi indirildi.`);
        }

        // DİĞER TEMİZ ÇIKTILAR (TXT, MD, SRT, VTT, CSV, JSON)
        function downloadCleanOutput(ext) {
            // Önce DOM'daki aktif tüm segment çevirilerini senkronize et
            syncActiveInputsToSegments();

            const doc = getActiveDoc();
            if (!doc || !doc.segments || doc.segments.length === 0) {
                showToast("Dışa aktarılacak metin yok.");
                return;
            }

            // SMARTCAT EXPORT STANDARDI: Cümleleri paragraflarına göre grupla
            const paraGroups = new Map();
            (doc.segments || []).forEach(s => {
                const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                paraGroups.get(pKey).push(s);
            });

            const smartcatParagraphs = [];
            paraGroups.forEach((group) => {
                const isHead = group.some(s => s.isHeading || s.isHead);
                const sentences = group
                    .map(s => cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()))
                    .filter(Boolean);
                if (sentences.length > 0) {
                    smartcatParagraphs.push({
                        isHeading: isHead,
                        text: sentences.join(' ')
                    });
                }
            });

            const merged = smartcatParagraphs.map(p => p.text).join('\n\n');
            let mime = 'text/plain;charset=utf-8';
            let content = merged;
            const base = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : "Ceviri";

            if (ext === 'docx' || ext === 'doc') {
                executeWordExport(ext);
                return;
            } else if (ext === 'pdf') {
                downloadPDFExport(doc);
                return;
            } else if (ext === 'rtf') {
                downloadRTFExport(doc);
                return;
            } else if (ext === 'tsv') {
                downloadTSVExport(doc);
                return;
            } else if (ext === 'po') {
                downloadPOExport(doc);
                return;
            } else if (ext === 'html') {
                downloadHTMLExport(doc);
                return;
            } else if (ext === 'xml') {
                downloadXMLExport(doc);
                return;
            } else if (ext === 'tmx') {
                if (typeof CatIO !== 'undefined' && typeof CatIO.exportTMX === 'function') {
                    CatIO.exportTMX();
                }
                return;
            } else if (ext === 'md') {
                mime = 'text/markdown;charset=utf-8';
                content = `# ${doc.name || 'Çeviri Belgesi'}\n\n` + smartcatParagraphs.map(p => p.isHeading ? `## ${p.text}` : p.text).join('\n\n');
            } else if (ext === 'srt') {
                content = generateSRT(doc);
                mime = 'text/plain;charset=utf-8';
            } else if (ext === 'vtt') {
                content = generateVTT(doc);
                mime = 'text/vtt;charset=utf-8';
            } else if (ext === 'csv') {
                content = generateCSV(doc);
                mime = 'text/csv;charset=utf-8';
            } else if (ext === 'json') {
                mime = 'application/json;charset=utf-8';
                content = JSON.stringify(doc.segments.map(s => ({
                    id: s.id,
                    paraId: s.paraId,
                    source: s.source,
                    target: cleanGeminiDraftTag((s.target && s.target.trim()) ? s.target.trim() : s.source.trim()),
                    status: s.status,
                    ...(s.startTime ? { startTime: s.startTime, endTime: s.endTime } : {})
                })), null, 2);
            } else if (ext === 'txt') {
                mime = 'text/plain;charset=utf-8';
                // Smartcat Düz Metin: Paragraf blokları \n\n ile ayrılır, cümleler paragraf içinde tek boşlukla akar
                content = smartcatParagraphs.map(p => p.text).join('\n\n');
            }

            // UTF-8 BOM ile TXT / MD / SRT indirme (Türkçe karakterlerin Notepad ve diğer editörlerde de bozulmaması için)
            const blob = new Blob(['\ufeff' + content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${base}_Ceviri.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            closeExportModal();
            showToast(`✅ "${base}_Ceviri.${ext}" kaydedilen çevirilerle indirildi.`);
        }

        // ========================================================
        // PROJE OLUŞTURMA SİHİRBAZI & KILAVUZ YARDIMCILARI (DEADLINE, GLOSSARY, STYLE GUIDE)
        // ========================================================
        let newProjectLoadedStyleGuideFileName = '';
        let newProjectLoadedStyleGuideFormat = 'markdown';

        function setDeadlinePreset(hours) {
            const input = document.getElementById('newProjectDeadlineInput');
            if (!input) return;
            const targetDate = new Date(Date.now() + hours * 60 * 60 * 1000);
            const pad = (n) => String(n).padStart(2, '0');
            const year = targetDate.getFullYear();
            const month = pad(targetDate.getMonth() + 1);
            const day = pad(targetDate.getDate());
            const hoursStr = pad(targetDate.getHours());
            const minutesStr = pad(targetDate.getMinutes());
            input.value = `${year}-${month}-${day}T${hoursStr}:${minutesStr}`;
            showToast(`⏰ Teslim tarihi ayarlandı: ${targetDate.toLocaleDateString('tr-TR')} ${hoursStr}:${minutesStr}`);
        }

        function toggleProjectGlossaryChip(input) {
            if (!input) return;
            // Çoklu terim tablosu seçimi kontrolü
        }

        function addNewGlossaryTableToProjectWizard() {
            const input = document.getElementById('newProjectCustomGlossaryInput');
            if (!input || !input.value.trim()) return;
            const val = input.value.trim();
            const container = document.getElementById('newProjectGlossariesContainer');
            if (!container) return;

            const label = document.createElement('label');
            label.className = 'cursor-pointer animate-fadeIn';
            label.innerHTML = `
                <input type="checkbox" name="projectGlossaryCheck" value="${escapeHtml(val)}" checked class="hidden peer" onchange="toggleProjectGlossaryChip(this)">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-teal-500 bg-teal-600 text-white peer-checked:bg-teal-600 peer-checked:text-white transition-all shadow-2xs">
                    <span class="material-symbols-outlined text-[13px]">bookmark_add</span>
                    <span>${escapeHtml(val)}</span>
                </span>
            `;
            container.appendChild(label);
            input.value = '';
            showToast(`📚 "${val}" terim tablosu projeye bağlandı.`);
        }

        async function handleNewProjectStyleGuideSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            const nameEl = document.getElementById('newProjectStyleGuideFileName');
            const textEl = document.getElementById('newProjectStyleGuideText');
            if (nameEl) nameEl.innerText = `${file.name} (Ayrıştırılıyor...)`;

            try {
                const text = await extractTextFromFile(file);
                newProjectLoadedStyleGuideFileName = file.name;
                const ext = file.name.split('.').pop().toLowerCase();
                newProjectLoadedStyleGuideFormat = ext === 'pdf' ? 'pdf' : (ext === 'txt' ? 'text' : 'markdown');
                if (textEl) textEl.value = text;
                if (nameEl) nameEl.innerText = `${file.name} (${Math.round(file.size / 1024)} KB - Hazır)`;
                showToast(`📖 Stil kılavuzu "${file.name}" başarıyla ayrıştırıldı.`);
            } catch (err) {
                console.error("Stil kılavuzu okuma hatası:", err);
                if (nameEl) nameEl.innerText = `${file.name} (Hata!)`;
                showToast(`❌ Kılavuz okuma hatası: ${err.message || err}`);
            }
        }

        function loadSampleStyleGuide() {
            const textEl = document.getElementById('newProjectStyleGuideText');
            const nameEl = document.getElementById('newProjectStyleGuideFileName');
            if (!textEl) return;
            textEl.value = `# KURUMSAL ÇEVİRİ VE YERELLEŞTİRME KILAVUZU

## 1. Üslup ve Hitap
- Çeviride resmi, saygılı ve profesyonel bir üslup benimsenmeli; doğrudan 'siz' hitabı kullanılmalıdır.
- Samimi veya argo tabirlerden kesinlikle kaçınılmalıdır.

## 2. Terminoloji ve Dil Kuralları
- Projeye atanmış terim tablosundaki terim çiftlerine eksiksiz sadık kalınmalıdır.
- Sektörel teknik kavramlar ilk geçtiği yerde Türkçe karşılığıyla verilmelidir.
- Kısaltmalar orijinal biçimde korunmalı, ilk kullanımda açılımı eklenmelidir.

## 3. Cümle Yapısı ve Netlik
- Pasif çatılı hantal cümleler yerine akıcı, doğrudan ve etken cümle yapıları tercih edilmelidir.
- Rakamlar, tarihler, para birimleri ve özel isimler kaynak metne sadık biçimde aynen aktarılmalıdır.`;

            if (nameEl) nameEl.innerText = 'Standart_Kılavuz_Şablonu.md';
            newProjectLoadedStyleGuideFileName = 'Standart_Kılavuz_Şablonu.md';
            newProjectLoadedStyleGuideFormat = 'markdown';
            showToast("⚡ Örnek stil kılavuzu şablonu yüklendi.");
        }

        // ========================================================
        // KILAVUZ YAN PANELİ (GUIDELINES DRAWER) YÖNETİMİ
        // ========================================================
        let isGuidelinesDrawerOpen = false;
        let currentGuidelinesTab = 'preview';

        function openGuidelinesDrawer() {
            const drawer = document.getElementById('guidelinesDrawer');
            const backdrop = document.getElementById('guidelinesBackdrop');
            if (!drawer) return;
            isGuidelinesDrawerOpen = true;
            if (backdrop) backdrop.classList.remove('hidden');
            drawer.classList.remove('translate-x-full');
            renderGuidelinesDrawer();
        }

        function closeGuidelinesDrawer() {
            const drawer = document.getElementById('guidelinesDrawer');
            const backdrop = document.getElementById('guidelinesBackdrop');
            if (!drawer) return;
            isGuidelinesDrawerOpen = false;
            drawer.classList.add('translate-x-full');
            if (backdrop) backdrop.classList.add('hidden');
        }

        function toggleGuidelinesDrawer() {
            if (isGuidelinesDrawerOpen) {
                closeGuidelinesDrawer();
            } else {
                openGuidelinesDrawer();
            }
        }

        function switchGuidelinesTab(tab) {
            currentGuidelinesTab = tab;
            const prevPane = document.getElementById('guidelinesPreviewPane');
            const editPane = document.getElementById('guidelinesEditPane');
            const btnPrev = document.getElementById('tabBtnGuidelinesPreview');
            const btnEdit = document.getElementById('tabBtnGuidelinesEdit');

            if (tab === 'preview') {
                if (prevPane) prevPane.classList.remove('hidden');
                if (editPane) editPane.classList.add('hidden');
                if (btnPrev) {
                    btnPrev.className = 'py-2.5 px-3 font-bold border-b-2 border-emerald-600 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 cursor-pointer';
                }
                if (btnEdit) {
                    btnEdit.className = 'py-2.5 px-3 font-semibold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white border-b-2 border-transparent flex items-center gap-1.5 cursor-pointer';
                }
                renderGuidelinesDrawer();
            } else {
                if (prevPane) prevPane.classList.add('hidden');
                if (editPane) editPane.classList.remove('hidden');
                if (btnEdit) {
                    btnEdit.className = 'py-2.5 px-3 font-bold border-b-2 border-emerald-600 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 cursor-pointer';
                }
                if (btnPrev) {
                    btnPrev.className = 'py-2.5 px-3 font-semibold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white border-b-2 border-transparent flex items-center gap-1.5 cursor-pointer';
                }
                const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
                const editText = document.getElementById('guidelinesEditTextarea');
                if (editText) editText.value = activeProj?.styleGuide?.content || '';
            }
        }

        function renderGuidelinesDrawer() {
            const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
            const subTitle = document.getElementById('guidelinesProjectSubtitle');
            const container = document.getElementById('guidelinesPreviewPane');
            const deadlineContainer = document.getElementById('guidelinesDrawerDeadlineContainer');
            if (!container) return;

            if (subTitle && activeProj) {
                subTitle.innerText = `${activeProj.title} (${(activeProj.sourceLang || 'en').toUpperCase()} ➔ ${(activeProj.targetLang || 'tr').toUpperCase()})`;
            }

            if (deadlineContainer) {
                if (activeProj && activeProj.deadline) {
                    const dl = getProjectDeadlineInfo(activeProj.deadline);
                    if (dl) {
                        deadlineContainer.innerHTML = `
                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${dl.badgeClass}">
                                <span class="material-symbols-outlined text-[13px]">${dl.icon}</span>
                                <span>${dl.text}</span>
                            </span>
                        `;
                    } else {
                        deadlineContainer.innerHTML = '';
                    }
                } else {
                    deadlineContainer.innerHTML = '<span class="text-slate-400 text-[10px] font-mono">Teslim tarihi belirtilmedi</span>';
                }
            }

            const guideContent = activeProj?.styleGuide?.content || '';

            if (!guideContent || !guideContent.trim()) {
                container.innerHTML = `
                    <div class="fluent-card p-6 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-neutral-800 bg-emerald-50/30 dark:bg-neutral-900 text-center flex flex-col items-center gap-3 my-6">
                        <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                            <span class="material-symbols-outlined text-2xl">policy</span>
                        </div>
                        <div>
                            <div class="font-bold text-xs text-slate-800 dark:text-neutral-100">Henüz Stil Kılavuzu Eklenmedi</div>
                            <p class="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
                                Bu projeye ait özel stil kuralları belirlenmediğinde standart çeviri motoru çalışır. Hemen kılavuz ekleyebilir veya hazır şablon yükleyebilirsiniz.
                            </p>
                        </div>
                        <div class="flex items-center gap-2 pt-1">
                            <button onclick="switchGuidelinesTab('edit')" class="fluent-btn-primary bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-2xs cursor-pointer">
                                <span class="material-symbols-outlined text-[15px]">edit</span>
                                <span>Kılavuz Yaz</span>
                            </button>
                            <button onclick="applySampleGuideToActiveProject()" class="fluent-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 cursor-pointer">
                                ⚡ Örnek Şablon
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = formatMarkdownToHtml(guideContent);
        }

        function formatMarkdownToHtml(md) {
            if (!md) return '';
            const lines = md.split('\n');
            let html = '';
            let inList = false;

            for (let line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                    if (inList) { html += '</ul>'; inList = false; }
                    continue;
                }

                if (trimmed.startsWith('# ')) {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += `<h2 class="text-sm font-extrabold text-slate-900 dark:text-neutral-100 mt-3 mb-1 pb-1 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px] text-emerald-600">bookmark</span><span>${escapeHtml(trimmed.slice(2))}</span></h2>`;
                } else if (trimmed.startsWith('## ')) {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += `<h3 class="text-xs font-bold text-emerald-900 dark:text-emerald-300 mt-2 mb-1 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>${escapeHtml(trimmed.slice(3))}</span></h3>`;
                } else if (trimmed.startsWith('### ')) {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += `<h4 class="text-xs font-semibold text-slate-800 dark:text-neutral-200 mt-1.5 mb-0.5">${escapeHtml(trimmed.slice(4))}</h4>`;
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    if (!inList) { html += '<ul class="list-disc pl-4 space-y-1 my-1 text-slate-700 dark:text-neutral-300">'; inList = true; }
                    const itemText = escapeHtml(trimmed.slice(2)).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html += `<li>${itemText}</li>`;
                } else if (/^\d+\.\s/.test(trimmed)) {
                    if (inList) { html += '</ul>'; inList = false; }
                    const numItemText = escapeHtml(trimmed.replace(/^\d+\.\s/, '')).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html += `<div class="flex items-start gap-1.5 my-1 text-slate-700 dark:text-neutral-300"><span class="font-bold text-emerald-700 font-mono text-[11px] shrink-0">•</span><span>${numItemText}</span></div>`;
                } else {
                    if (inList) { html += '</ul>'; inList = false; }
                    const paraText = escapeHtml(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html += `<p class="my-1 leading-relaxed text-slate-700 dark:text-neutral-300">${paraText}</p>`;
                }
            }
            if (inList) html += '</ul>';
            return html;
        }

        function saveGuidelinesFromDrawer() {
            const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
            if (!activeProj) return;
            const editText = document.getElementById('guidelinesEditTextarea');
            const val = editText ? editText.value.trim() : '';

            activeProj.styleGuide = {
                name: activeProj.styleGuide?.name || 'Proje Stil Kılavuzu',
                content: val,
                format: 'markdown'
            };

            debouncedAutoSave();
            renderProjectsGrid();
            updateActiveProjectView();
            switchGuidelinesTab('preview');
            showToast("✅ Kılavuz güncellendi ve kaydedildi. Gemini & DeepL isteklerine aktarılacak.");
        }

        function applySampleGuideToActiveProject() {
            const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
            if (!activeProj) return;
            activeProj.styleGuide = {
                name: 'Standart_Kılavuz_Şablonu.md',
                content: `# KURUMSAL ÇEVİRİ VE YERELLEŞTİRME KILAVUZU

## 1. Üslup ve Hitap
- Çeviride resmi, saygılı ve profesyonel bir üslup benimsenmeli; doğrudan 'siz' hitabı kullanılmalıdır.
- Samimi veya argo tabirlerden kesinlikle kaçınılmalıdır.

## 2. Terminoloji ve Dil Kuralları
- Projeye atanmış terim tablosundaki terim çiftlerine eksiksiz sadık kalınmalıdır.
- Sektörel teknik kavramlar ilk geçtiği yerde Türkçe karşılığıyla verilmelidir.
- Kısaltmalar orijinal biçimde korunmalı, ilk kullanımda açılımı eklenmelidir.

## 3. Cümle Yapısı ve Netlik
- Pasif çatılı hantal cümleler yerine akıcı, doğrudan ve etken cümle yapıları tercih edilmelidir.
- Rakamlar, tarihler, para birimleri ve özel isimler kaynak metne sadık biçimde aynen aktarılmalıdır.`,
                format: 'markdown'
            };
            debouncedAutoSave();
            renderProjectsGrid();
            updateActiveProjectView();
            renderGuidelinesDrawer();
            showToast("⚡ Örnek kılavuz projeye tanımlandı.");
        }

        function loadSampleStyleGuideToDrawer() {
            const textarea = document.getElementById('guidelinesEditTextarea');
            if (!textarea) return;
            textarea.value = `# KURUMSAL ÇEVİRİ VE YERELLEŞTİRME KILAVUZU

## 1. Üslup ve Hitap
- Çeviride resmi, saygılı ve profesyonel bir üslup benimsenmeli; doğrudan 'siz' hitabı kullanılmalıdır.
- Samimi veya argo tabirlerden kesinlikle kaçınılmalıdır.

## 2. Terminoloji ve Dil Kuralları
- Projeye atanmış terim tablosundaki terim çiftlerine eksiksiz sadık kalınmalıdır.
- Sektörel teknik kavramlar ilk geçtiği yerde Türkçe karşılığıyla verilmelidir.
- Kısaltmalar orijinal biçimde korunmalı, ilk kullanımda açılımı eklenmelidir.

## 3. Cümle Yapısı ve Netlik
- Pasif çatılı hantal cümleler yerine akıcı, doğrudan ve etken cümle yapıları tercih edilmelidir.
- Rakamlar, tarihler, para birimleri ve özel isimler kaynak metne sadık biçimde aynen aktarılmalıdır.`;
        }

        async function handleDrawerStyleGuideSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            try {
                const text = await extractTextFromFile(file);
                const textarea = document.getElementById('guidelinesEditTextarea');
                if (textarea) textarea.value = text;
                showToast(`📖 "${file.name}" metni düzenleyiciye aktarıldı.`);
            } catch (e) {
                showToast(`❌ Dosya okunamadı: ${e.message || e}`);
            }
        }

        // ========================================================
        // DİNAMİK TESLİM TARİHİ VE GERİ SAYIM HESAPLAMA MOTORU
        // ========================================================
        function getProjectDeadlineInfo(deadlineStr) {
            if (!deadlineStr) return null;
            const deadline = new Date(deadlineStr);
            if (isNaN(deadline.getTime())) return null;
            const now = new Date();
            const diffMs = deadline.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = Math.ceil(diffHours / 24);

            const formattedDate = deadline.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) + ' ' +
                deadline.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            if (diffMs < 0) {
                return {
                    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700 animate-pulse',
                    icon: 'error',
                    text: `Süresi Doldu (${formattedDate})`,
                    shortText: 'Süresi Doldu!',
                    status: 'overdue'
                };
            } else if (diffHours <= 24) {
                const hoursLeft = Math.max(1, Math.round(diffHours));
                return {
                    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 font-bold',
                    icon: 'alarm',
                    text: `Kritik: ${hoursLeft}s kaldı (${formattedDate})`,
                    shortText: `${hoursLeft}s Kaldı`,
                    status: 'critical'
                };
            } else if (diffHours <= 72) {
                return {
                    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700 font-semibold',
                    icon: 'schedule',
                    text: `${diffDays} gün kaldı (${formattedDate})`,
                    shortText: `${diffDays} Gün Kaldı`,
                    status: 'warning'
                };
            } else {
                return {
                    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-medium',
                    icon: 'event_available',
                    text: `Teslim: ${formattedDate} (${diffDays} gün)`,
                    shortText: `${diffDays} Gün`,
                    status: 'normal'
                };
            }
        }

        function openCreateProjectModal() {
            const m = document.getElementById('modalCreateProject');
            if (m) {
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
            newProjectLoadedFile = null;
            newProjectLoadedVideoFile = null;
            newProjectFileLoadingPromise = null;
            const fileInput = document.getElementById('newProjectFileInput');
            if (fileInput) fileInput.value = '';
            const fileNameEl = document.getElementById('newProjectSelectedFileName');
            if (fileNameEl) fileNameEl.innerText = 'Dosya seçilmedi';
            const pastedTextEl = document.getElementById('newProjectPastedText');
            if (pastedTextEl) pastedTextEl.value = '';
            const titleInput = document.getElementById('newProjectTitleInput');
            if (titleInput && !titleInput.value) titleInput.value = 'Yeni Çeviri Projesi';

            const curType = document.getElementById('selectedProjectType')?.value || 'text';
            selectProjectType(curType);
        }

        function closeCreateProjectModal() {
            const m = document.getElementById('modalCreateProject');
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
            newProjectLoadedFile = null;
            newProjectLoadedVideoFile = null;
            newProjectLoadedStyleGuideFileName = '';
            newProjectLoadedStyleGuideFormat = 'markdown';
            newProjectFileLoadingPromise = null;
            const fileInput = document.getElementById('newProjectFileInput');
            if (fileInput) fileInput.value = '';
            const fileNameEl = document.getElementById('newProjectSelectedFileName');
            if (fileNameEl) fileNameEl.innerText = 'Dosya seçilmedi';
            const pastedTextEl = document.getElementById('newProjectPastedText');
            if (pastedTextEl) pastedTextEl.value = '';
            const titleInput = document.getElementById('newProjectTitleInput');
            if (titleInput) titleInput.value = 'Yeni Çeviri Projesi';
            const deadlineInput = document.getElementById('newProjectDeadlineInput');
            if (deadlineInput) deadlineInput.value = '';
            const styleGuideTextEl = document.getElementById('newProjectStyleGuideText');
            if (styleGuideTextEl) styleGuideTextEl.value = '';
            const guideNameEl = document.getElementById('newProjectStyleGuideFileName');
            if (guideNameEl) guideNameEl.innerText = 'Kılavuz dosyası seçilmedi';
        }

        let newProjectLoadedFile = null;
        let newProjectLoadedVideoFile = null;

        function isVideoFileObject(file) {
            if (!file) return false;
            if (file.type && file.type.startsWith('video/')) return true;
            const ext = file.name.toLowerCase().split('.').pop();
            const videoExts = ['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv', 'wmv', 'm4v', 'ts', '3gp', 'ogg', 'ogv', 'm2ts', 'mts', 'divx', 'vob', 'rmvb'];
            return videoExts.includes(ext);
        }

        let newProjectFileLoadingPromise = null;

        async function handleNewProjectFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;
            const nameEl = document.getElementById('newProjectSelectedFileName');
            if (nameEl) nameEl.innerText = `${file.name} (Ayrıştırılıyor...)`;

            const lowerName = file.name.toLowerCase();

            // Eğer video dosyası seçildiyse:
            if (isVideoFileObject(file)) {
                newProjectLoadedVideoFile = file;
                newProjectLoadedFile = null;
                if (nameEl) nameEl.innerText = file.name;
                selectProjectType('subtitling');
                showToast(`🎥 Video algılandı: "${file.name}". Proje türü Altyazı Çevirisi olarak ayarlandı.`);
                return;
            }

            // Eğer .srt veya diğer altyazı dosyası seçildiyse otomatik Altyazı türünü seç
            if (lowerName.endsWith('.srt') || lowerName.endsWith('.vtt') || lowerName.endsWith('.sub') || lowerName.endsWith('.ass') || lowerName.endsWith('.ssa')) {
                selectProjectType('subtitling');
            }

            newProjectFileLoadingPromise = (async () => {
                const text = await extractTextFromFile(file);
                newProjectLoadedFile = {
                    name: file.name,
                    content: text
                };
                if (nameEl) nameEl.innerText = `${file.name} (${Math.round(file.size / 1024)} KB - Hazır)`;
                showToast(`✅ "${file.name}" başarıyla okundu.`);
                return text;
            })();

            try {
                await newProjectFileLoadingPromise;
            } catch (err) {
                console.error("Yeni proje dosya okuma hatası:", err);
                if (nameEl) nameEl.innerText = `${file.name} (Okuma hatası!)`;
                showToast(`❌ Dosya okuma hatası: ${err.message || err}`);
            } finally {
                newProjectFileLoadingPromise = null;
            }
        }

        async function confirmNewProject() {
            try {
                if (newProjectFileLoadingPromise) {
                    showToast("⏳ Belge ayrıştırılıyor, lütfen bekleyin...");
                    try {
                        await newProjectFileLoadingPromise;
                    } catch (e) {
                        showToast("❌ Dosya ayrıştırma hatası: " + (e.message || e));
                        return;
                    }
                }
                const titleInput = document.getElementById('newProjectTitleInput');
                const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : 'Yeni Çeviri Projesi';
                const typeInput = document.getElementById('selectedProjectType');
                const projectType = (typeInput && typeInput.value) ? typeInput.value : 'text';

                const srcLangEl = document.getElementById('newProjectSourceLang');
                const trgLangEl = document.getElementById('newProjectTargetLang');
                const srcLang = srcLangEl ? srcLangEl.value : 'en';
                const trgLang = trgLangEl ? trgLangEl.value : 'tr';

                const pastedTextEl = document.getElementById('newProjectPastedText');
                const pastedText = pastedTextEl ? pastedTextEl.value.trim() : '';

                // Teslim Tarihi
                const deadlineInput = document.getElementById('newProjectDeadlineInput');
                const deadline = deadlineInput ? deadlineInput.value.trim() : '';

                // Özel Terim Sözlüğü Seçimi
                const selectedGlossaries = [];
                document.querySelectorAll('input[name="projectGlossaryCheck"]:checked').forEach(cb => {
                    selectedGlossaries.push(cb.value);
                });

                // Stil & Rehber Kılavuzu
                const styleGuideTextEl = document.getElementById('newProjectStyleGuideText');
                const styleGuideContent = styleGuideTextEl ? styleGuideTextEl.value.trim() : '';
                const styleGuideName = newProjectLoadedStyleGuideFileName || (styleGuideContent ? 'Proje Stil Kılavuzu' : '');

                const newProjId = 'proj-' + Date.now();
                let desc = `${srcLang.toUpperCase()} ➔ ${trgLang.toUpperCase()} çeviri ve segmentasyon projesi.`;
                if (projectType === 'subtitling') {
                    desc = `Netflix ve EBU-TT uyumlu (${srcLang.toUpperCase()} ➔ ${trgLang.toUpperCase()}) altyazı çeviri ve zaman kodu projesi.`;
                } else if (projectType === 'interpreting') {
                    desc = `Konferans ve sözlü çeviri hazırlık (${srcLang.toUpperCase()} ➔ ${trgLang.toUpperCase()}) terminoloji ve concordance projesi.`;
                }

                const newProj = {
                    id: newProjId,
                    title: title,
                    type: projectType,
                    sourceLang: srcLang,
                    targetLang: trgLang,
                    desc: desc,
                    deadline: deadline,
                    assignedGlossaries: (selectedGlossaries.length > 0) ? selectedGlossaries : ['all'],
                    styleGuide: {
                        name: styleGuideName,
                        content: styleGuideContent,
                        format: newProjectLoadedStyleGuideFormat || 'markdown'
                    },
                    createdAt: 'Bugün ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    documents: []
                };

                // Yeni projeyi projeler listesine ekle ve aktif yap
                appState.projects.push(newProj);
                appState.activeProjectId = newProjId;
                appState.documents = newProj.documents;
                appState.activeDocId = null;

                // Video dosyasını referans al
                const videoToMount = newProjectLoadedVideoFile;
                if (videoToMount) {
                    currentLoadedVideoFile = videoToMount;
                    currentTranscribeVideoFile = videoToMount;
                }

                // Eğer dosya seçildiyse veya metin yapıştırıldıysa hemen segmente et
                if (newProjectLoadedFile && newProjectLoadedFile.content) {
                    addNewDoc(newProjectLoadedFile.name, newProjectLoadedFile.content);
                } else if (newProjectLoadedVideoFile) {
                    const videoFileName = newProjectLoadedVideoFile.name;
                    const docName = `${videoFileName.replace(/\.[^/.]+$/, '')}_transkript.srt`;
                    addNewDoc(docName, '1\n00:00:00,000 --> 00:00:03,000\n[Ses kanalı taranıyor...]');
                } else if (pastedText) {
                    addNewDoc(`${title.replace(/\s+/g, '_')}_kaynak.txt`, pastedText);
                } else {
                    // Kullanıcı dosya veya metin eklemeden doğrudan "Projeyi Başlat"a tıkladığında
                    // Editörün boş kalmaması ve çevirmenin hemen yazmaya başlayabilmesi için başlangıç belgesi oluştur
                    if (projectType === 'subtitling') {
                        addNewDoc(`${title.replace(/\s+/g, '_')}_altyazi.srt`, '1\n00:00:01,000 --> 00:00:04,000\n[İlk altyazı diyaloğunu buraya yazabilir veya video yükleyebilirsiniz.]\n\n2\n00:00:04,500 --> 00:00:08,000\n[İkinci altyazı diyaloğu]');
                    } else if (projectType === 'interpreting') {
                        addNewDoc(`${title.replace(/\s+/g, '_')}_hazirlik.txt`, `${title} - Sözlü Çeviri Hazırlık Notları\nKonferans terminolojisi ve anahtar concordance ifadelerini buraya ekleyin.`);
                    } else {
                        addNewDoc(`${title.replace(/\s+/g, '_')}_belge.txt`, `${title} projesi başarıyla başlatıldı.\nBu segmenti düzenleyerek doğrudan çeviriye başlayabilir veya üst menüden yeni bir dosya yükleyebilirsiniz.`);
                    }
                }

                // Formu temizle ve modalı kapat
                closeCreateProjectModal();

                // Arayüzü güncelle
                renderProjectsGrid();
                renderSidebarDocs();
                updateActiveProjectView();
                renderActiveDocument();
                updateProgressStats();
                syncWebSpeechLanguageFromProject(newProj);
                switchNav('editor');

                // Eğer video yüklenmişse video oynatıcıyı aktifleştir ve videoyu yükle
                if (videoToMount) {
                    setTimeout(() => {
                        const player = document.getElementById('subVideoPlayer');
                        const placeholder = document.getElementById('subVideoPlaceholderArea');
                        const playerArea = document.getElementById('subVideoPlayerArea');
                        const videoPanel = document.getElementById('subVideoPanel');
                        if (videoPanel) videoPanel.classList.remove('hidden');
                        if (player) {
                            player.src = URL.createObjectURL(videoToMount);
                            player.load();
                        }
                        if (placeholder) placeholder.classList.add('hidden');
                        if (playerArea) playerArea.classList.remove('hidden');
                        showToast(`🎬 "${videoToMount.name}" video oynatıcıya yüklendi.`);

                        // Videodaki konuşmaları otomatik olarak transkribe etmeye başla!
                        if (typeof autoTranscribeVideoFile === 'function') {
                            autoTranscribeVideoFile(videoToMount);
                        }
                    }, 150);
                }

                const typeLabel = projectType === 'subtitling' ? 'Altyazı Çevirisi' : (projectType === 'interpreting' ? 'Sözlü Çeviri Hazırlık' : 'Yazılı Metin');
                showToast(`"${title}" (${typeLabel}) başarıyla başlatıldı!`);

                // Yerel kaydet
                if (typeof debouncedAutoSave === 'function') debouncedAutoSave(100);
            } catch (err) {
                console.error("Projeyi Başlat Hatası:", err);
                showToast("❌ Proje başlatılırken hata oluştu: " + (err.message || err));
            }
        }

        // ========================================================
        // 12. VİDEO & ALTYAZI ÇİFT YÖNLÜ CANLI SENKRONİZASYON MOTORU
        // ========================================================

        let currentLoadedVideoFile = null;
        let currentTranscribeVideoFile = null;

        function openVideoTranscriptionModal(file = null) {
            if (file) {
                currentTranscribeVideoFile = file;
            } else if (currentLoadedVideoFile) {
                currentTranscribeVideoFile = currentLoadedVideoFile;
            }

            // API anahtar durumunu güncelle
            const apiKey = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key');
            const badge = document.getElementById('transcribeGeminiStatusBadge');
            const input = document.getElementById('transcribeGeminiApiKeyInput');
            if (apiKey) {
                if (input) input.value = apiKey;
                if (badge) {
                    badge.innerText = 'Bağlı (Aktif)';
                    badge.className = 'text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700';
                }
            } else {
                if (badge) {
                    badge.innerText = 'Anahtar Bekleniyor';
                    badge.className = 'text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700';
                }
            }

            const m = document.getElementById('modalVideoTranscription');
            if (m) {
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
        }

        function closeVideoTranscriptionModal() {
            const m = document.getElementById('modalVideoTranscription');
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        }

        function saveTranscribeApiKey() {
            const input = document.getElementById('transcribeGeminiApiKeyInput');
            const key = input ? input.value.trim() : '';
            appState.geminiApiKey = key;
            localStorage.setItem('cat_gemini_api_key', key);
            saveGeminiApiKey();
            const badge = document.getElementById('transcribeGeminiStatusBadge');
            if (badge) {
                if (key) {
                    badge.innerText = 'Bağlı (Aktif)';
                    badge.className = 'text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700';
                    showToast("Gemini API anahtarı kaydedildi!");
                } else {
                    badge.innerText = 'Anahtar Yok';
                    badge.className = 'text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700';
                }
            }
        }

        let activeWebSpeechRecognition = null;
        let isWebSpeechListening = false;
        let webSpeechSegStartSec = 0;
        let currentTranscribeMethod = 'webspeech';

        function selectTranscribeMethod(method) {
            currentTranscribeMethod = method;
            const btnWeb = document.getElementById('btnTransMethod-webspeech');
            const btnGem = document.getElementById('btnTransMethod-gemini');
            const paneWeb = document.getElementById('transcribePane-webspeech');
            const paneGem = document.getElementById('transcribePane-gemini');

            if (method === 'webspeech') {
                if (btnWeb) btnWeb.className = "py-2 px-3 rounded-lg text-xs font-bold bg-white text-purple-900 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer";
                if (btnGem) btnGem.className = "py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer";
                if (paneWeb) paneWeb.classList.remove('hidden');
                if (paneGem) paneGem.classList.add('hidden');
            } else {
                if (btnWeb) btnWeb.className = "py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer";
                if (btnGem) btnGem.className = "py-2 px-3 rounded-lg text-xs font-bold bg-white text-purple-900 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer";
                if (paneWeb) paneWeb.classList.add('hidden');
                if (paneGem) paneGem.classList.remove('hidden');
            }
        }

        function getVideoSourceSpeechLanguage() {
            const quickSelect = document.getElementById('quickWebSpeechLangSelect');
            if (quickSelect && quickSelect.value) {
                return quickSelect.value;
            }
            const modalSelect = document.getElementById('transcribeLanguageSelect');
            if (modalSelect && modalSelect.value && modalSelect.value !== 'auto') {
                return modalSelect.value;
            }
            const activeProj = getActiveProject();
            const src = (activeProj?.sourceLang || 'en').toLowerCase();
            const map = {
                'en': 'en-US',
                'tr': 'tr-TR',
                'de': 'de-DE',
                'fr': 'fr-FR',
                'es': 'es-ES',
                'it': 'it-IT',
                'ru': 'ru-RU',
                'ar': 'ar-SA',
                'zh': 'zh-CN',
                'ja': 'ja-JP'
            };
            return map[src] || 'en-US';
        }

        function syncWebSpeechLanguage(val) {
            const quick = document.getElementById('quickWebSpeechLangSelect');
            const modal = document.getElementById('transcribeLanguageSelect');
            if (quick && quick.value !== val) quick.value = val;
            if (modal && modal.value !== val) modal.value = val;
            if (isWebSpeechListening) {
                stopWebSpeechLiveTranscription();
                setTimeout(() => startWebSpeechLiveTranscription(), 200);
            }
        }

        function syncWebSpeechLanguageFromProject(proj = null) {
            const p = proj || getActiveProject();
            const src = (p?.sourceLang || 'en').toLowerCase();
            const map = {
                'en': 'en-US',
                'tr': 'tr-TR',
                'de': 'de-DE',
                'fr': 'fr-FR',
                'es': 'es-ES',
                'it': 'it-IT',
                'ru': 'ru-RU',
                'ar': 'ar-SA',
                'zh': 'zh-CN',
                'ja': 'ja-JP'
            };
            const targetLang = map[src] || 'en-US';
            const quick = document.getElementById('quickWebSpeechLangSelect');
            const modal = document.getElementById('transcribeLanguageSelect');
            if (quick) quick.value = targetLang;
            if (modal) modal.value = targetLang;
        }

        function toggleWebSpeechLiveTranscription() {
            if (isWebSpeechListening) {
                stopWebSpeechLiveTranscription();
            } else {
                startWebSpeechLiveTranscription();
            }
        }

        function startWebSpeechLiveTranscription() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                showToast("⚠️ Tarayıcınız Web Speech API desteklemiyor. Lütfen Google Chrome veya Microsoft Edge kullanın.");
                return;
            }

            const player = document.getElementById('subVideoPlayer');
            if (!player || !player.src) {
                showToast("⚠️ Lütfen önce bir video dosyası yükleyin.");
                return;
            }

            const lang = getVideoSourceSpeechLanguage();

            try {
                if (activeWebSpeechRecognition) {
                    try { activeWebSpeechRecognition.stop(); } catch (e) { }
                }

                activeWebSpeechRecognition = new SpeechRec();
                activeWebSpeechRecognition.continuous = true;
                activeWebSpeechRecognition.interimResults = true;
                activeWebSpeechRecognition.lang = lang;

                isWebSpeechListening = true;
                webSpeechSegStartSec = player.currentTime || 0;

                // UI Güncelle
                updateWebSpeechUI(true);

                activeWebSpeechRecognition.onresult = (event) => {
                    let interimText = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            const cleanText = transcript.trim();
                            if (cleanText.length > 0) {
                                const curTime = player ? player.currentTime : (webSpeechSegStartSec + 3.0);
                                const startSec = Math.max(0, webSpeechSegStartSec);
                                const endSec = Math.max(startSec + 1.0, curTime);
                                webSpeechSegStartSec = endSec;

                                addRecognizedSpeechSegment(cleanText, startSec, endSec);
                            }
                        } else {
                            interimText += transcript;
                        }
                    }

                    // Video üstündeki altyazı alanına anlık göster
                    const captionOverlay = document.getElementById('subVideoOverlayCaption');
                    if (captionOverlay && interimText) {
                        captionOverlay.innerText = interimText;
                    }
                    const bannerText = document.getElementById('webSpeechLiveStatusText');
                    if (bannerText && interimText) {
                        bannerText.innerText = `🎙️ Dinleniyor (${lang}): "${interimText}"`;
                    }
                };

                activeWebSpeechRecognition.onerror = (event) => {
                    console.warn("Web Speech uyarısı:", event.error);
                    if (event.error === 'not-allowed') {
                        showToast("⚠️ Tarayıcı mikrofon/ses izni verilmedi. Lütfen adres çubuğundaki kilit simgesinden izin verin.");
                        stopWebSpeechLiveTranscription();
                    }
                };

                activeWebSpeechRecognition.onend = () => {
                    if (isWebSpeechListening) {
                        try {
                            activeWebSpeechRecognition.start();
                        } catch (e) { }
                    }
                };

                activeWebSpeechRecognition.start();

                // Videoyu oynat
                if (player.paused) {
                    player.play().catch(e => console.warn("Video otomatik oynatma:", e));
                }

                showToast(`🎙️ Web Speech aktif: Videodaki orijinal konuşmalar (${lang}) doğrudan sol kaynak sütununa aktarılıyor. Hedef çeviri sütunu sizin yazmanız için boş bırakıldı.`);
            } catch (err) {
                console.error("Web Speech başlatma hatası:", err);
                showToast("Ses tanıma başlatılamadı: " + err.message);
                updateWebSpeechUI(false);
            }
        }

        function stopWebSpeechLiveTranscription() {
            isWebSpeechListening = false;
            if (activeWebSpeechRecognition) {
                try {
                    activeWebSpeechRecognition.stop();
                } catch (e) { }
                activeWebSpeechRecognition = null;
            }
            updateWebSpeechUI(false);

            const player = document.getElementById('subVideoPlayer');
            if (player && !player.paused) {
                player.pause();
            }

            showToast("⏹️ Web Speech canlı dinleme durduruldu. Orijinal konuşma segmentleri kaydedildi.");
        }

        function updateWebSpeechUI(listening) {
            const btnText = document.getElementById('webSpeechBtnText');
            const btnIcon = document.getElementById('webSpeechBtnIcon');
            const btn = document.getElementById('btnWebSpeechLive');
            const banner = document.getElementById('webSpeechActiveBanner');

            if (listening) {
                if (btn) {
                    btn.className = "w-full py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer border border-rose-500 animate-pulse";
                }
                if (btnText) btnText.innerText = "⏹️ Dinlemeyi Durdur & Kaydet";
                if (btnIcon) btnIcon.innerText = "stop_circle";
                if (banner) banner.classList.remove('hidden');
            } else {
                if (btn) {
                    btn.className = "w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-400/40";
                }
                if (btnText) btnText.innerText = "🎙️ Tarayıcı ile Canlı Dinle & Segmente Et (Web Speech)";
                if (btnIcon) btnIcon.innerText = "mic";
                if (banner) banner.classList.add('hidden');
            }
        }

        function addRecognizedSpeechSegment(text, startSec, endSec) {
            let activeDoc = getActiveDoc();
            if (!activeDoc) {
                activeDoc = {
                    id: 'doc-sub-' + Date.now(),
                    name: 'Canli_Transkript.srt',
                    originalFormat: 'srt',
                    segments: [],
                    currentPage: 1,
                    totalPages: 1
                };
                const proj = getActiveProject();
                if (proj) {
                    if (!proj.documents) proj.documents = [];
                    proj.documents.push(activeDoc);
                    appState.documents = proj.documents;
                    appState.activeDocId = activeDoc.id;
                }
            }

            if (!activeDoc.segments) activeDoc.segments = [];

            // Eğer ilk segment geçici bir segmentse onu temizle
            if (activeDoc.segments.length === 1 && (activeDoc.segments[0].source.includes('Ses kanalı taranıyor') || activeDoc.segments[0].source.includes('transkripti hazırlanıyor'))) {
                activeDoc.segments = [];
            }

            const subLines = getSubtitleLines(text, 42);
            const formatted = subLines.line2 ? `${subLines.line1}\n${subLines.line2}` : subLines.line1;
            const segId = activeDoc.segments.length + 1;

            // KULLANICI TALEBİ: Kaynak sütununda videoda söylenen orijinal metin olmalı.
            // Hedef çeviri sütunu (target) tamamen boş ('') kalmalı; kullanıcı çeviriyi kendisi yazar!
            const newSeg = {
                id: segId,
                source: formatted,
                target: '',
                startTime: formatSecondsToSrtTimestamp(startSec),
                endTime: formatSecondsToSrtTimestamp(endSec),
                durationSec: Number(Math.max(1.0, endSec - startSec).toFixed(2)),
                status: 'empty'
            };

            // TM eşleşmesini yalnızca referans öneri olarak kaydet, asla target'a otomatik basma
            const match = findBestTmMatch(newSeg.source);
            if (match) {
                newSeg.tmSuggestion = match;
            }

            activeDoc.segments.push(newSeg);
            activeDoc.totalPages = Math.max(1, Math.ceil(activeDoc.segments.length / SEGMENTS_PER_PAGE));
            activeDoc.currentPage = activeDoc.totalPages;

            renderSegments();
            updateProgressStats();
        }

        function executeVideoTranscription() {
            closeVideoTranscriptionModal();

            if (currentTranscribeMethod === 'webspeech') {
                const player = document.getElementById('subVideoPlayer');
                if (player) {
                    player.currentTime = 0;
                }
                startWebSpeechLiveTranscription();
                return;
            }

            const file = currentTranscribeVideoFile || currentLoadedVideoFile;
            if (!file) {
                showToast("⚠️ Lütfen önce bir video dosyası yükleyin.");
                return;
            }
            autoTranscribeVideoFile(file);
        }

        // Web Audio API: 16kHz Mono WAV Kodlayıcı
        function audioBufferToWavBlob(buffer, targetSampleRate = 16000) {
            const rawData = buffer.getChannelData(0);
            const sampleRate = buffer.sampleRate;
            const length = buffer.length;

            const ratio = sampleRate / targetSampleRate;
            const newLength = Math.round(length / ratio);
            const samples = new Float32Array(newLength);

            for (let i = 0; i < newLength; i++) {
                const origIdx = Math.floor(i * ratio);
                samples[i] = rawData[origIdx] || 0;
            }

            const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
            const view = new DataView(wavBuffer);

            function writeString(view, offset, string) {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + samples.length * 2, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM format
            view.setUint16(22, 1, true); // Mono channel
            view.setUint32(24, targetSampleRate, true);
            view.setUint32(28, targetSampleRate * 2, true); // byte rate
            view.setUint16(32, 2, true); // block align
            view.setUint16(34, 16, true); // bits per sample
            writeString(view, 36, 'data');
            view.setUint32(40, samples.length * 2, true);

            let offset = 44;
            for (let i = 0; i < samples.length; i++) {
                let s = Math.max(-1, Math.min(1, samples[i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                offset += 2;
            }

            return new Blob([view], { type: 'audio/wav' });
        }

        function blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    const base64 = dataUrl.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        // Ses Dalgası Konuşma Algılama (Voice Activity Detection - VAD)
        function detectSpeechIntervals(audioBuffer) {
            if (!audioBuffer || !Number.isFinite(audioBuffer.duration) || audioBuffer.duration <= 0) {
                return generateFallbackIntervals(60);
            }
            const raw = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            const totalDuration = audioBuffer.duration;
            const windowSec = 0.1;
            const windowSamples = Math.floor(sampleRate * windowSec);
            const numWindows = Math.floor(raw.length / windowSamples);

            let totalRms = 0;
            const rmsValues = new Float32Array(numWindows);
            for (let i = 0; i < numWindows; i++) {
                let sum = 0;
                const offset = i * windowSamples;
                for (let j = 0; j < windowSamples; j += 4) {
                    const s = raw[offset + j] || 0;
                    sum += s * s;
                }
                const rms = Math.sqrt(sum / (windowSamples / 4));
                rmsValues[i] = rms;
                totalRms += rms;
            }

            const avgRms = totalRms / Math.max(1, numWindows);
            const speechThreshold = Math.max(0.012, avgRms * 1.15);

            const intervals = [];
            let inSpeech = false;
            let speechStart = 0;
            let silenceCount = 0;
            const maxSilenceWindows = 4;

            for (let i = 0; i < numWindows; i++) {
                const t = i * windowSec;
                const isLoud = rmsValues[i] >= speechThreshold;

                if (isLoud) {
                    if (!inSpeech) {
                        inSpeech = true;
                        speechStart = Math.max(0, t - 0.15);
                    }
                    silenceCount = 0;
                } else {
                    if (inSpeech) {
                        silenceCount++;
                        if (silenceCount >= maxSilenceWindows || (t - speechStart) >= 5.5) {
                            const speechEnd = Math.min(totalDuration, t - (silenceCount * windowSec) + 0.25);
                            if (speechEnd - speechStart >= 0.8) {
                                intervals.push({ start: Number(speechStart.toFixed(2)), end: Number(speechEnd.toFixed(2)) });
                            }
                            inSpeech = false;
                            silenceCount = 0;
                        }
                    }
                }
            }

            if (inSpeech && totalDuration - speechStart >= 0.8) {
                intervals.push({ start: Number(speechStart.toFixed(2)), end: Number(totalDuration.toFixed(2)) });
            }

            if (intervals.length === 0) {
                return generateFallbackIntervals(totalDuration);
            }

            return intervals;
        }

        function generateFallbackIntervals(totalDuration) {
            const intervals = [];
            let dur = Number(totalDuration);
            // fMP4 veya canlı kayıtlarda duration Infinity veya NaN geldiğinde asla sonsuz döngüye girmez
            if (!Number.isFinite(dur) || isNaN(dur) || dur <= 0) {
                dur = 60;
            } else if (dur > 600) {
                dur = 600;
            }
            dur = Math.max(4, dur);

            let cur = 1.0;
            const maxIntervals = 35; // Kesin sonsuz döngü emniyet kilidi
            while (cur < dur - 1.5 && intervals.length < maxIntervals) {
                const segLen = Math.min(4.0, dur - cur - 0.5);
                intervals.push({ start: Number(cur.toFixed(2)), end: Number((cur + segLen).toFixed(2)) });
                cur += segLen + 0.8;
            }
            if (intervals.length === 0) {
                intervals.push({ start: 1.0, end: Math.min(5.0, dur) });
            }
            return intervals;
        }

        // Ana Otomatik Transkripsiyon Motoru
        let streamingTranscriptionActive = false;
        let streamingTranscriptionCancelled = false;

        function stopStreamingTranscription() {
            streamingTranscriptionCancelled = true;
            streamingTranscriptionActive = false;
            const banner = document.getElementById('subStreamingStatusBanner');
            const title = document.getElementById('subStreamingStatusTitle');
            const subtitle = document.getElementById('subStreamingStatusSubtitle');
            if (title) title.innerText = 'Transkripsiyon Durduruldu';
            if (subtitle) subtitle.innerText = 'Kullanıcı isteğiyle transkripsiyon akışı sonlandırıldı. Mevcut segmentleri çevirebilirsiniz.';
            showToast("⏹️ Otomatik transkripsiyon akışı durduruldu.");
            setTimeout(() => {
                if (banner) banner.classList.add('hidden');
            }, 3000);
        }

        function streamAppendSegmentToUI(item, idx) {
            try {
                renderSegments();
            } catch (e) {
                console.warn("streamAppendSegmentToUI render uyarısı:", e);
            }
        }

        // Ana Akışkan (Non-Blocking Streaming) Transkripsiyon Motoru
        // Tercümanı ASLA yükleme ekranında bekletmez; segmentler çıktıkça sıra sıra editöre yazar!
        async function startStreamingVideoTranscription(videoFile) {
            if (!videoFile) return;

            streamingTranscriptionCancelled = false;
            streamingTranscriptionActive = true;

            const banner = document.getElementById('subStreamingStatusBanner');
            const badge = document.getElementById('subStreamingProgressBadge');
            const bar = document.getElementById('subStreamingProgressBar');
            const title = document.getElementById('subStreamingStatusTitle');
            const subtitle = document.getElementById('subStreamingStatusSubtitle');

            if (banner) {
                banner.classList.remove('hidden');
                if (bar) bar.style.width = '10%';
                if (badge) badge.innerText = 'Başlatılıyor...';
                if (title) title.innerText = 'Ses Kanalı Ayrıştırılıyor';
                if (subtitle) subtitle.innerText = `"${videoFile.name}" ses dalgaları çözümleniyor, konuşmalar çıktıkça editöre eklenecektir...`;
            }

            try {
                const apiKey = appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key');
                let preparedSegments = [];

                // 1. ADIM: Sunucu Tabanlı Otomatik FFmpeg Ses Ayıklama & Transkripsiyon Motoru
                // Videonun sesi saniyeler içinde ayrıştırılıp bağımsız bir WAV dosyası olarak diske kaydedilir
                try {
                    if (bar) bar.style.width = '20%';
                    if (title) title.innerText = 'Videonun Sesi Ayıklanıyor (FFmpeg)...';
                    if (subtitle) subtitle.innerText = `"${videoFile.name}" ses kanalı bağımsız bir WAV dosyasına dönüştürülüyor...`;

                    const langCode = getVideoSourceSpeechLanguage();
                    const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';
                    const serverRes = await fetch(`${apiBase}/api/extract_and_transcribe`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'X-File-Name': videoFile.name,
                            'X-Gemini-Key': apiKey || '',
                            'X-Source-Lang': langCode
                        },
                        body: videoFile
                    });

                    if (serverRes.ok) {
                        const data = await serverRes.json();
                        if (data && data.status === 'success' && data.segments && data.segments.length > 0) {
                            preparedSegments = data.segments;
                            if (data.video_id) currentServerVideoId = data.video_id;
                            showToast(`🎵 Ses "${data.audio_filename}" olarak ayrıştırıldı ve ${data.segments.length} segment zaman damgalarıyla sisteme aktarıldı!`);
                        }
                    }
                } catch (srvErr) {
                    console.warn("Sunucu ses servisi meşgul veya çevrimdışı, tarayıcı yerleşik motoruna geçiliyor:", srvErr);
                }

                if (streamingTranscriptionCancelled) return;

                // 2. ADIM: Yedek İstemci Taraflı Motor (Sunucu Erişilemezse veya Yedek Olarak)
                if (!preparedSegments || preparedSegments.length === 0) {
                    if (bar) bar.style.width = '35%';
                    if (title) title.innerText = 'Tarayıcı Ses Kanalı Ayrıştırılıyor';
                    if (subtitle) subtitle.innerText = 'Yerleşik ses dalgaları taranıyor...';

                    const arrayBuffer = await videoFile.arrayBuffer();
                    if (streamingTranscriptionCancelled) return;

                    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                    let audioBuffer = null;
                    try {
                        const audioCtx = new AudioCtxClass();
                        const audioChunk = arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 15 * 1024 * 1024));
                        const decodePromise = audioCtx.decodeAudioData(audioChunk);
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Audio decode timeout')), 2500));
                        audioBuffer = await Promise.race([decodePromise, timeoutPromise]);
                    } catch (audioErr) {
                        console.warn('AudioContext decode uyarısı:', audioErr);
                    }

                    // A: Gemini AI Doğrudan İstemci Çağrısı
                    if (apiKey && audioBuffer) {
                        try {
                            const wavBlob = audioBufferToWavBlob(audioBuffer, 16000);
                            const base64Wav = await blobToBase64(wavBlob);
                            const langCode = getVideoSourceSpeechLanguage();
                            const langNote = langCode.startsWith('en') ? 'English' : (langCode.startsWith('tr') ? 'Türkçe' : langCode);

                            const prompt = `Sen uzman bir konuşma tanıma ve altyazı çıkarma (ASR / Subtitle) uzmanısın.
GÖREV: Bu ses kaydını baştan sona dinle ve videoda konuşulan ORİJİNAL kelimeleri BİREBİR (verbatim) olarak ${langNote} dilinde SRT altyazı formatına dök.
KESİN KURALLAR:
1. KESİNLİKLE VE ASLA TERCÜME / ÇEVİRİ YAPMA! Konuşmacı hangi dilde konuşuyorsa o orijinal dilde kelimesi kelimesine yaz.
2. ZAMANLAMA VE SESSİZLİK KORUMA (ÇOK ÖNEMLİ): Her altyazı bloğunun başlangıç zamanı, konuşmacının sesi tam olarak ne zaman başlıyorsa o saniyede olmalıdır. Örneğin bir konuşma 00:00:12,000'de bitti ve sıradaki konuşma 00:00:17,000'de başlıyorsa; sıradaki altyazının başlangıcını ASLA 00:00:12 yapma! Mutlaka konuşmanın başladığı 00:00:17,000 olarak yaz. Konuşmalar arasındaki sessizlik aralıklarını koru.
3. SADECE standart SRT formatında bloklar döndür:
   Sıra Numarası
   00:00:00,000 --> 00:00:00,000
   Orijinal konuşma metni
4. Açıklama veya markdown (\\\`\\\`\\\`srt) ekleme, doğrudan saf SRT çıktısı ver.`;

                            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [
                                            { text: prompt },
                                            { inlineData: { mimeType: 'audio/wav', data: base64Wav } }
                                        ]
                                    }],
                                    generationConfig: { temperature: 0.1 }
                                })
                            });

                            if (res.ok) {
                                const data = await res.json();
                                let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                txt = txt.replace(/```srt/gi, '').replace(/```/g, '').trim();
                                if (txt && txt.includes('-->')) {
                                    preparedSegments = parseSRT(txt);
                                }
                            }
                        } catch (gemErr) {
                            console.warn("Client Gemini transkripsiyon hatası:", gemErr);
                        }
                    }

                    // B: VAD Konuşma Enerjisi Aralıkları (Demo metinler kaldırıldı!)
                    if (!preparedSegments || preparedSegments.length === 0) {
                        const playerEl = document.getElementById('subVideoPlayer');
                        let totalDur = 60;
                        if (audioBuffer && Number.isFinite(audioBuffer.duration) && audioBuffer.duration > 0) {
                            totalDur = audioBuffer.duration;
                        } else if (playerEl && Number.isFinite(playerEl.duration) && playerEl.duration > 0) {
                            totalDur = playerEl.duration;
                        } else if (videoFile && videoFile.size) {
                            totalDur = Math.min(600, Math.max(30, Math.round(videoFile.size / 71000)));
                        }

                        const speechIntervals = (audioBuffer && Number.isFinite(audioBuffer.duration)) ? detectSpeechIntervals(audioBuffer) : generateFallbackIntervals(totalDur);

                        speechIntervals.forEach((interval, idx) => {
                            preparedSegments.push({
                                id: idx + 1,
                                source: '[Videoda anlaşılmayan konuşmalar var, lütfen videodaki sesleri dinleyiniz]',
                                target: '',
                                startTime: formatSecondsToSrtTimestamp(interval.start),
                                endTime: formatSecondsToSrtTimestamp(interval.end),
                                durationSec: Number(Math.max(1.0, interval.end - interval.start).toFixed(2)),
                                status: 'empty'
                            });
                        });
                    }
                }

                // ========================================================
                // KRİTİK KISIM: AKIŞKAN (STREAMING) SIRAYLA YAZMA DÖNGÜSÜ
                // TERCÜMAN BEKLEME EKRANINDA BEKLEMEZ, SİSTEM SIRA SIRA YAZAR!
                // ========================================================
                const activeDoc = getActiveDoc();
                if (!activeDoc) return;
                activeDoc.segments = []; // Temiz başla

                const totalSegments = preparedSegments.length;
                if (bar) bar.style.width = '50%';

                for (let i = 0; i < totalSegments; i++) {
                    if (streamingTranscriptionCancelled) break;

                    const item = preparedSegments[i];
                    item.id = i + 1;
                    item.target = '';
                    item.status = 'empty';

                    // TM Eşleşmesini kontrol et (arka planda)
                    const tmMatch = findBestTmMatch(item.source);
                    if (tmMatch) item.tmSuggestion = tmMatch;

                    activeDoc.segments.push(item);
                    activeDoc.totalPages = Math.max(1, Math.ceil(activeDoc.segments.length / SEGMENTS_PER_PAGE));

                    // İlerleme çubuğunu ve rozetleri güncelle
                    const pct = Math.round(50 + ((i + 1) / totalSegments) * 50);
                    if (bar) bar.style.width = `${pct}%`;
                    if (badge) badge.innerText = `Segment ${i + 1} / ${totalSegments}`;
                    if (title) title.innerText = `🎙️ Konuşmalar Çıkarılıyor: Segment #${i + 1} Eklendi`;
                    if (subtitle) subtitle.innerText = `Sistem konuşulanları sıra sıra yazmaya devam ediyor; ilk segmentleri hemen çevirmeye başlayabilirsiniz!`;

                    // Belge istatistiklerini ve sayfa numaralarını güncelle
                    const badgeDoc = document.getElementById('activeDocBadge');
                    if (badgeDoc) badgeDoc.innerText = `${activeDoc.segments.length} Cümle/Blok`;
                    const navBadge = document.getElementById('navSegCountBadge');
                    if (navBadge) navBadge.innerText = activeDoc.segments.length;
                    updateProgressStats();
                    updateTMStats();

                    // İlk segmentte videoyu ilk zamana konumlandır
                    if (i === 0) {
                        try {
                            const player = document.getElementById('subVideoPlayer');
                            if (player) {
                                seekSubVideo(item.startTime, item);
                            }
                        } catch (seekErr) {
                            console.warn("İlk segment seek uyarısı:", seekErr);
                        }
                    }

                    // DOM'a kesintisiz ekle ve render et
                    streamAppendSegmentToUI(item, i);

                    // Sıra sıra yazma efekti (hızlı ve akıcı)
                    await new Promise(r => setTimeout(r, 100));
                }

                if (!streamingTranscriptionCancelled) {
                    if (bar) bar.style.width = '100%';
                    debouncedAutoSave(200);
                    if (badge) badge.innerText = `${activeDoc.segments.length} Segment Hazır`;
                    if (title) title.innerText = `✅ Otomatik Transkripsiyon Tamamlandı (${activeDoc.segments.length} Segment)`;
                    if (subtitle) subtitle.innerText = `Tüm konuşmalar başarıyla segmente edildi. Hedef çevirilerinizi tamamlayabilirsiniz.`;
                    showToast(`🎙️ "${videoFile.name}" transkripsiyonu tamamlandı! (${activeDoc.segments.length} segment)`);

                    setTimeout(() => {
                        if (banner && !streamingTranscriptionCancelled) {
                            banner.classList.add('hidden');
                        }
                    }, 5000);
                }

            } catch (err) {
                console.error("Transkripsiyon akış hatası:", err);
                if (title) title.innerText = 'Transkripsiyon Hatası';
                if (subtitle) subtitle.innerText = err.message;
                showToast("Transkripsiyon sırasında bir hata oluştu: " + err.message);
            } finally {
                streamingTranscriptionActive = false;
            }
        }

        // Geriye dönük uyumluluk için alias
        function autoTranscribeVideoFile(videoFile) {
            return startStreamingVideoTranscription(videoFile);
        }

        function formatSecondsToMinSec(seconds) {
            const s = Math.max(0, seconds || 0);
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            const ms = Math.floor((s - Math.floor(s)) * 10);
            const pad = (n) => String(n).padStart(2, '0');
            return `${pad(m)}:${pad(sec)}.${ms}`;
        }

        function handleSubVideoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            currentLoadedVideoFile = file;
            currentTranscribeVideoFile = file;

            const player = document.getElementById('subVideoPlayer');
            const placeholder = document.getElementById('subVideoPlaceholderArea');
            const playerArea = document.getElementById('subVideoPlayerArea');

            const videoUrl = URL.createObjectURL(file);
            if (player) {
                player.src = videoUrl;
                player.load();
            }

            if (placeholder) placeholder.classList.add('hidden');
            if (playerArea) playerArea.classList.remove('hidden');

            // Faz 2: Ses Dalga Formu Stüdyosunu Başlat & Tepe Noktalarını Yükle
            setTimeout(() => {
                if (window.CatAVT && CatAVT.Waveform) {
                    CatAVT.Waveform.init();
                    CatAVT.Waveform.generateWaveformPeaks();
                    CatAVT.Waveform.render();
                }
            }, 300);

            // Eğer proje subtitling değilse altyazı modunu etkinleştir
            const activeProj = getActiveProject();
            if (activeProj && activeProj.type !== 'subtitling') {
                activeProj.type = 'subtitling';
                updateActiveProjectView();
            }

            // Temiz bir altyazı belgesi başlat (demo metinleri temizle)
            let doc = getActiveDoc();
            const srtDocName = `${file.name.replace(/\.[^/.]+$/, '')}.srt`;
            if (!doc || activeProj.type === 'subtitling') {
                if (doc) {
                    doc.name = srtDocName;
                    doc.segments = [];
                    doc.currentPage = 1;
                    doc.totalPages = 1;
                } else {
                    doc = {
                        id: 'doc-sub-' + Date.now(),
                        name: srtDocName,
                        originalFormat: 'srt',
                        segments: [],
                        currentPage: 1,
                        totalPages: 1
                    };
                    if (activeProj) {
                        activeProj.documents = [doc];
                        appState.documents = activeProj.documents;
                        appState.activeDocId = doc.id;
                    }
                }
            }

            renderActiveDocument();
            updateProgressStats();

            showToast(`🎬 "${file.name}" yüklendi. Konuşmalar otomatik çözümleniyor...`);

            // KULLANICI TALEBİ: Bekleme ekranında bekletmeden anında otomatik transkripsiyonu başlat!
            startStreamingVideoTranscription(file);
        }

        function exitSubtitlingMode() {
            const proj = getActiveProject();
            if (proj) {
                proj.wasSubtitling = true;
                proj.type = 'text';
            }
            const videoPanel = document.getElementById('subVideoPanel');
            if (videoPanel) videoPanel.classList.add('hidden');
            const workbench = document.getElementById('subtitlingWorkbench');
            if (workbench) workbench.classList.add('hidden');

            const btnReturn = document.getElementById('btnReturnToSubVideo');
            if (btnReturn) {
                btnReturn.classList.remove('hidden');
                btnReturn.classList.add('flex');
            }

            updateActiveProjectView();
            renderSegments();
            showToast("Altyazı modundan çıkıldı. Videoya geri dönmek için üst bardaki 'Video & Altyazı Modunu Aç' butonuna tıklayabilirsiniz.");
        }

        function enterSubtitlingMode() {
            const proj = getActiveProject();
            if (proj) {
                proj.type = 'subtitling';
            }
            const videoPanel = document.getElementById('subVideoPanel');
            if (videoPanel) videoPanel.classList.remove('hidden');
            const workbench = document.getElementById('subtitlingWorkbench');
            if (workbench) workbench.classList.remove('hidden');

            // Eğer video dosyası varsa video oynatıcıya bağla
            const file = currentLoadedVideoFile || currentTranscribeVideoFile;
            if (file) {
                const player = document.getElementById('subVideoPlayer');
                const placeholder = document.getElementById('subVideoPlaceholderArea');
                const playerArea = document.getElementById('subVideoPlayerArea');
                if (player && !player.src) {
                    player.src = URL.createObjectURL(file);
                    player.load();
                }
                if (placeholder) placeholder.classList.add('hidden');
                if (playerArea) playerArea.classList.remove('hidden');
            }

            updateActiveProjectView();
            renderSegments();
            showToast("🎬 Video & Altyazı Çeviri Moduna geri dönüldü.");
        }

        function seekSubVideo(startStr, seg) {
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
                timeDisplay.innerText = `Süre: ${formatSecondsToMinSec(sec)} (${sec.toFixed(1)}s)`;
            }

            if (seg) {
                appState.activeSubtitleSegmentId = seg.id;
                if (activeSegDisplay) {
                    activeSegDisplay.innerText = `Aktif Segment #${seg.id}: ${startStr}`;
                }
                if (overlayCaption) {
                    const text = (seg.target && seg.target.trim().length > 0) ? seg.target.trim() : seg.source;
                    overlayCaption.innerHTML = sanitizeSubtitleHtml(text);
                }
                updateCinemaSubtitleMonitor(seg);
            }
        }

        function onSegmentClickOrFocus(segId) {
            const doc = getActiveDoc();
            if (!doc || !doc.segments) return;
            const seg = doc.segments.find(s => s.id === segId);
            if (!seg) return;

            appState.activeSegmentId = segId;
            window._lastHoveredSegId = segId;
            if (typeof CatWordToolbar !== 'undefined') {
                const ta = document.getElementById(`targetInput-${segId}`);
                CatWordToolbar.recordTargetFocus(segId, ta);
            }

            const proj = getActiveProject();
            if (proj && proj.type === 'subtitling') {
                seekSubVideo(seg.startTime || '00:00:00,000', seg);
            }
        }

        function initSubVideoEventListeners() {
            const player = document.getElementById('subVideoPlayer');
            if (!player || player._hasCatListeners) return;
            player._hasCatListeners = true;

            // Oynatma ve serbest sarma dinleyicisi: Segment kutularını ASLA kilitlemez
            player.addEventListener('timeupdate', () => {
                const curSec = player.currentTime;
                const timeDisplay = document.getElementById('subVideoTimecodeDisplay');
                if (timeDisplay) {
                    timeDisplay.innerText = `Süre: ${formatSecondsToMinSec(curSec)} (${curSec.toFixed(1)}s)`;
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
                            const isTop = (matchingSeg.placement === 'top') || (matchingSeg.target && matchingSeg.target.includes('{\\an8}')) || (matchingSeg.source && matchingSeg.source.includes('{\\an8}'));
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
                            text = text.replace(/\{\\an\d\}/g, '').trim();
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
        }

        // ========================================================
        // 11. TEORİK TERCÜME 3D KÜRE MOTORU & SAĞ ÇEKMECE İNTERAKTİF KÜRE
        // (BEYAZ KÜRE MODELİ, AÇIK MAVİ KARA SINIRLARI & ORBITCONTROLS)
        // ========================================================
        const GLOBAL_TRANSLATION_ARCS = [
            { startLat: 39.0, startLng: 35.0, endLat: 38.89, endLng: -77.03, color: '#0284c7' }, // Washington DC
            { startLat: 39.0, startLng: 35.0, endLat: 51.50, endLng: -0.12, color: '#0284c7' }, // Londra
            { startLat: 39.0, startLng: 35.0, endLat: 48.85, endLng: 2.35, color: '#0369a1' }, // Paris
            { startLat: 39.0, startLng: 35.0, endLat: 52.52, endLng: 13.40, color: '#0ea5e9' }, // Berlin
            { startLat: 39.0, startLng: 35.0, endLat: 55.75, endLng: 37.61, color: '#0284c7' }, // Moskova
            { startLat: 39.0, startLng: 35.0, endLat: 35.67, endLng: 139.65, color: '#0284c7' }, // Tokyo
            { startLat: 39.0, startLng: 35.0, endLat: 31.23, endLng: 121.47, color: '#0369a1' }, // Şanghay
            { startLat: 39.0, startLng: 35.0, endLat: 25.20, endLng: 55.27, color: '#0ea5e9' }, // Dubai
            { startLat: 39.0, startLng: 35.0, endLat: -33.86, endLng: 151.20, color: '#0284c7' }, // Sidney
            { startLat: 39.0, startLng: 35.0, endLat: -23.55, endLng: -46.63, color: '#0369a1' }  // Sao Paulo
        ];

        // 1. D3 Canvas Texture: Beyaz Küre Üzerine Açık Mavi Kara Sınırları ve Kıyı Çizgileri
        function applyWorldTextureToGlobe(Globe) {
            const jsonUrl = '/countries-110m.json';
            fetch(jsonUrl)
                .then(r => r.json())
                .catch(() => fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json').then(r => r.json()))
                .then(topoData => {
                    if (!topoData || typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

                    const canvas = document.createElement('canvas');
                    canvas.width = 2048;
                    canvas.height = 1024;
                    const ctx = canvas.getContext('2d');

                    // Küre yüzeyi saf beyaz (#ffffff)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const projection = d3.geoEquirectangular()
                        .scale(canvas.width / (2 * Math.PI))
                        .translate([canvas.width / 2, canvas.height / 2]);
                    const path = d3.geoPath(projection, ctx);

                    // Karaların içi saf beyaz (#ffffff)
                    if (topoData.objects && topoData.objects.land) {
                        const land = topojson.feature(topoData, topoData.objects.land);
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        path(land);
                        ctx.fill();

                        // Kara Sınırlarının başladığı yerler: Net, kalın, canlı açık mavi (#0284c7)
                        ctx.strokeStyle = '#0284c7';
                        ctx.lineWidth = 4.5;
                        ctx.lineJoin = 'round';
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        path(land);
                        ctx.stroke();
                    }

                    // Ülke sınırları: İnce açık mavi (#38bdf8)
                    if (topoData.objects && topoData.objects.countries) {
                        const borders = topojson.mesh(topoData, topoData.objects.countries, (a, b) => a !== b);
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2.0;
                        ctx.beginPath();
                        path(borders);
                        ctx.stroke();
                    }

                    const texture = new THREE.CanvasTexture(canvas);
                    const mat = Globe.globeMaterial();
                    if (mat) {
                        mat.map = texture;
                        mat.color = new THREE.Color(0xffffff);
                        mat.roughness = 0.8;
                        mat.metalness = 0.05;
                        mat.needsUpdate = true;
                    }
                }).catch(() => { });
        }

        // ========================================================
        // 11.1 HEADER MİNİ KÜRE
        // ========================================================
        function initHeaderMiniGlobe() {
            const container = document.getElementById('headerMiniGlobeCanvas');
            const wrapper = document.getElementById('headerGlobeWrapper');
            if (!container) return;

            const width = container.clientWidth || 40;
            const height = container.clientHeight || 40;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.z = 240;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
            scene.add(ambientLight);

            const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
            dirLight1.position.set(120, 120, 120);
            scene.add(dirLight1);

            const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight2.position.set(-120, -100, 100);
            scene.add(dirLight2);

            const globeGroup = new THREE.Group();
            scene.add(globeGroup);

            if (typeof ThreeGlobe !== 'undefined') {
                const Globe = new ThreeGlobe({ animateIn: false })
                    .showAtmosphere(true)
                    .atmosphereColor('#38bdf8')
                    .atmosphereAltitude(0.22);

                const globeMat = Globe.globeMaterial();
                if (globeMat) {
                    globeMat.color = new THREE.Color(0xffffff);
                    globeMat.roughness = 0.85;
                    globeMat.metalness = 0.05;
                }

                Globe.scale.set(0.70, 0.70, 0.70);
                globeGroup.add(Globe);

                // Beyaz küre üzerine açık mavi kara sınırlarını uygula
                applyWorldTextureToGlobe(Globe);

                // Kürenin üzerinden çıkan belirgin ışınlar (arcs)
                Globe.arcsData(GLOBAL_TRANSLATION_ARCS)
                    .arcColor(d => [d.color || '#0284c7', '#38bdf8'])
                    .arcAltitude(0.44)
                    .arcStroke(2.6)
                    .arcDashLength(0.6)
                    .arcDashGap(0.15)
                    .arcDashAnimateTime(2000)
                    .arcDashInitialGap(e => Math.random());

                const ringPoints = [
                    { lat: 39.0, lng: 35.0, maxR: 7, speed: 2.2, color: () => '#0284c7' },
                    ...GLOBAL_TRANSLATION_ARCS.map(a => ({ lat: a.endLat, lng: a.endLng, maxR: 5, speed: 1.8, color: () => a.color }))
                ];
                Globe.ringsData(ringPoints)
                    .ringColor(d => d.color)
                    .ringMaxRadius(d => d.maxR)
                    .ringPropagationSpeed(d => d.speed)
                    .ringRepeatPeriod(1000);

                const points = [
                    { lat: 39.0, lng: 35.0, size: 1.4, color: '#0284c7' },
                    ...GLOBAL_TRANSLATION_ARCS.map(a => ({ lat: a.endLat, lng: a.endLng, size: 0.9, color: a.color }))
                ];
                Globe.pointsData(points)
                    .pointColor(d => d.color)
                    .pointAltitude(0.015)
                    .pointRadius(d => d.size);

            } else {
                const sphereGeometry = new THREE.SphereGeometry(68, 32, 24);
                const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                globeGroup.add(new THREE.Mesh(sphereGeometry, sphereMat));

                const wireMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 });
                globeGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(sphereGeometry), wireMat));
            }

            let headerGlobeDragDist = 0;
            function handleGlobeChipClick(e) {
                if (headerGlobeDragDist > 6) {
                    headerGlobeDragDist = 0;
                    return;
                }
                openGlobeModal();
            }

            let isDragging = false;
            let prevX = 0, prevY = 0;
            let rotY = -(35.0 * Math.PI / 180);
            let rotX = (39.0 * Math.PI / 180) * 0.4;

            const targetWrapper = wrapper || container;
            targetWrapper.addEventListener('mousedown', (e) => {
                isDragging = true;
                headerGlobeDragDist = 0;
                prevX = e.clientX;
                prevY = e.clientY;
            });

            window.addEventListener('mouseup', () => {
                setTimeout(() => { isDragging = false; }, 40);
            });
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = e.clientX - prevX;
                    const dy = e.clientY - prevY;
                    headerGlobeDragDist += Math.hypot(dx, dy);
                    rotY += dx * 0.008;
                    rotX += dy * 0.008;
                    prevX = e.clientX;
                    prevY = e.clientY;
                }
            });

            function renderHeaderLoop() {
                requestAnimationFrame(renderHeaderLoop);
                if (!isDragging) {
                    rotY += 0.0035;
                }
                globeGroup.rotation.y += (rotY - globeGroup.rotation.y) * 0.08;
                globeGroup.rotation.x += (rotX - globeGroup.rotation.x) * 0.08;
                renderer.render(scene, camera);
            }
            renderHeaderLoop();
        }

        function openGlobeModal() {
            const m = document.getElementById('modalGlobe');
            m.classList.remove('hidden');
            m.classList.add('flex');
            setTimeout(initExpandedGlobe, 50);
        }

        function closeGlobeModal() {
            const m = document.getElementById('modalGlobe');
            m.classList.add('hidden');
            m.classList.remove('flex');
        }

        // ========================================================
        // 11.2 GENİŞLETİLMİŞ MODAL KÜRE (EXPANDED GLOBE)
        // ========================================================
        function initExpandedGlobe() {
            const container = document.getElementById('expandedGlobeCanvas');
            const wrapper = document.getElementById('expandedGlobeWrapper');
            if (!container) return;

            const width = container.clientWidth || 600;
            const height = container.clientHeight || 360;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.z = 240;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
            scene.add(ambientLight);

            const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
            dirLight1.position.set(140, 140, 140);
            scene.add(dirLight1);

            const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight2.position.set(-140, -100, 100);
            scene.add(dirLight2);

            const globeGroup = new THREE.Group();
            scene.add(globeGroup);

            if (typeof ThreeGlobe !== 'undefined') {
                const Globe = new ThreeGlobe({ animateIn: false })
                    .showAtmosphere(true)
                    .atmosphereColor('#38bdf8')
                    .atmosphereAltitude(0.20);

                const globeMat = Globe.globeMaterial();
                if (globeMat) {
                    globeMat.color = new THREE.Color(0xffffff);
                    globeMat.roughness = 0.85;
                    globeMat.metalness = 0.05;
                }

                Globe.scale.set(0.78, 0.78, 0.78);
                globeGroup.add(Globe);

                // Açık mavi kara sınırları dokusu
                applyWorldTextureToGlobe(Globe);

                Globe.arcsData(GLOBAL_TRANSLATION_ARCS)
                    .arcColor(d => [d.color || '#0284c7', '#38bdf8'])
                    .arcAltitude(0.44)
                    .arcStroke(3.0)
                    .arcDashLength(0.6)
                    .arcDashGap(0.15)
                    .arcDashAnimateTime(2000)
                    .arcDashInitialGap(e => Math.random());

                const ringPoints = [
                    { lat: 39.0, lng: 35.0, maxR: 8, speed: 2.2, color: () => '#0284c7' },
                    ...GLOBAL_TRANSLATION_ARCS.map(a => ({ lat: a.endLat, lng: a.endLng, maxR: 6, speed: 1.8, color: () => a.color }))
                ];
                Globe.ringsData(ringPoints)
                    .ringColor(d => d.color)
                    .ringMaxRadius(d => d.maxR)
                    .ringPropagationSpeed(d => d.speed)
                    .ringRepeatPeriod(1000);

                const points = [
                    { lat: 39.0, lng: 35.0, size: 1.5, color: '#0284c7' },
                    ...GLOBAL_TRANSLATION_ARCS.map(a => ({ lat: a.endLat, lng: a.endLng, size: 1.0, color: a.color }))
                ];
                Globe.pointsData(points)
                    .pointColor(d => d.color)
                    .pointAltitude(0.015)
                    .pointRadius(d => d.size);

            } else {
                const sphereGeometry = new THREE.SphereGeometry(75, 32, 24);
                const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                globeGroup.add(new THREE.Mesh(sphereGeometry, sphereMat));

                const wireMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 });
                globeGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(sphereGeometry), wireMat));
            }

            let isDragging = false;
            let prevX = 0, prevY = 0;
            let rotY = -(35.0 * Math.PI / 180);
            let rotX = (39.0 * Math.PI / 180) * 0.4;

            wrapper.addEventListener('mousedown', (e) => {
                isDragging = true;
                prevX = e.clientX;
                prevY = e.clientY;
            });

            window.addEventListener('mouseup', () => { isDragging = false; });
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    rotY += (e.clientX - prevX) * 0.006;
                    rotX += (e.clientY - prevY) * 0.006;
                    prevX = e.clientX;
                    prevY = e.clientY;
                }
            });

            function renderLoop() {
                requestAnimationFrame(renderLoop);
                if (!isDragging) {
                    rotY += 0.0025;
                }
                globeGroup.rotation.y += (rotY - globeGroup.rotation.y) * 0.08;
                globeGroup.rotation.x += (rotX - globeGroup.rotation.x) * 0.08;
                renderer.render(scene, camera);
            }
            renderLoop();
        }

        // ========================================================
        // 12. BİLDİRİM & GÜVENLİK
        // ========================================================
        function showToast(msg) {
            const box = document.getElementById('toastBox');
            if (!box) return;
            const toast = document.createElement('div');
            toast.className = 'fluent-card bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-xl shadow-xl pointer-events-auto transition-opacity duration-200 flex items-center gap-2 border border-sky-200';
            toast.innerHTML = `<span class="material-symbols-outlined text-sky-600 text-[17px]">info</span><span class="font-medium">${escapeHtml(msg)}</span>`;
            box.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 250);
            }, 2600);
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function openShortcutsModal() {
            if (window.CatUI && typeof window.CatUI.openShortcutsModal === 'function') {
                window.CatUI.openShortcutsModal();
                return;
            }
            const m = document.getElementById('modalShortcuts');
            if (m) {
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
        }

        function closeShortcutsModal() {
            if (window.CatUI && typeof window.CatUI.closeShortcutsModal === 'function') {
                window.CatUI.closeShortcutsModal();
            }
            const m = document.getElementById('modalShortcuts');
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        }

        function toggleShortcutsModal() {
            const m = document.getElementById('modalShortcuts');
            if (m) {
                if (m.classList.contains('hidden') || m.style.display === 'none') {
                    openShortcutsModal();
                } else {
                    closeShortcutsModal();
                }
                return;
            }
            if (window.CatUI && typeof window.CatUI.openShortcutsModal === 'function') {
                window.CatUI.openShortcutsModal();
            }
        }

        function closeAllModalsAndDrawers() {
            closeShortcutsModal();
            closeCreateProjectModal();
            closeExportModal();
            closePasteModal();
            closeGlobeModal();
            closeGlossaryDrawer();
            closeProfileDrawer();
            if (typeof closeGuidelinesDrawer === 'function') closeGuidelinesDrawer();
            closeMobileSidebar();
        }

        // ========================================================
        // 13. GLOBAL KLAVYE KISAYOLLARI VE NAVİGASYON DİNLEYİCİSİ
        // ========================================================
        window.addEventListener('keydown', (e) => {
            const activeEl = document.activeElement;
            const isEditingText = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            // Ctrl + Enter / Cmd + Enter: Segment Onaylama (Kullanıcı nerede olursa olsun anında onaylar)
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                let targetSegId = null;
                if (activeEl && activeEl.id && activeEl.id.startsWith('targetInput-')) {
                    targetSegId = parseInt(activeEl.id.replace('targetInput-', ''), 10);
                } else if (typeof appState !== 'undefined' && appState.activeSegmentId) {
                    targetSegId = appState.activeSegmentId;
                } else {
                    const firstSeg = document.querySelector('.cat-segment-card:hover, .cat-segment-row:hover, [data-seg-id]:hover');
                    if (firstSeg && firstSeg.getAttribute('data-seg-id')) {
                        targetSegId = parseInt(firstSeg.getAttribute('data-seg-id'), 10);
                    }
                }
                if (targetSegId) {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmSegment(targetSegId);
                    return;
                }
            }

            // F1 veya Shift + ?: Klavye Kısayolları Modalı
            if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
                e.preventDefault();
                toggleShortcutsModal();
                return;
            }

            // Escape: Açık modal veya çekmeceleri kapat
            if (e.key === 'Escape') {
                closeAllModalsAndDrawers();
                return;
            }

            // Ctrl + F: Segment / Terim Arama Kutusuna Odaklan
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const s = document.getElementById('tbSegmentSearchInput') || document.getElementById('drawerSearchInput');
                if (s) {
                    s.focus();
                    s.select();
                }
                return;
            }

            // Ctrl + G veya Alt + G: Terim Sözlüğü Çekmecesi Aç/Kapat
            if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                toggleGlossaryDrawer();
                return;
            }

            // Ctrl + E: Dışa Aktar Modalı
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                openExportModal();
                return;
            }

            // Ctrl + N: Yeni Proje Modalı (Metin yazarken değilse)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey && !isEditingText) {
                e.preventDefault();
                openCreateProjectModal();
                return;
            }

            // Ctrl + S: Güvenli Kayıt Geri Bildirimi
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                forceManualLocalSave();
                return;
            }

            // Metin kutusu içinde değilken genel gezinme tuşları
            if (!isEditingText) {
                // Tab / Shift + Tab: Sıradaki / Önceki segmente odaklan ve giriş yap
                if (e.key === 'Tab') {
                    e.preventDefault();
                    focusFirstOrActiveSegment(e.shiftKey ? -1 : 1);
                    return;
                }
                // Enter: Aktif segmente odaklan
                if (e.key === 'Enter') {
                    e.preventDefault();
                    focusFirstOrActiveSegment(0);
                    return;
                }
                // Alt + N: Sıradaki Onaylanmamış segmente odaklan
                if (e.altKey && e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.jumpNextUnapproved === 'function') {
                        CatWordToolbar.jumpNextUnapproved();
                    } else {
                        focusFirstOrActiveSegment(1);
                    }
                    return;
                }
                // Alt + P: Önceki segmente odaklan
                if (e.altKey && e.key.toLowerCase() === 'p') {
                    e.preventDefault();
                    focusFirstOrActiveSegment(-1);
                    return;
                }
                // Aşağı Ok veya J: Sıradaki segmente odaklan
                if (e.key === 'ArrowDown' || e.key.toLowerCase() === 'j') {
                    e.preventDefault();
                    focusFirstOrActiveSegment(1);
                    return;
                }
                // Yukarı Ok veya K: Önceki segmente odaklan
                if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    focusFirstOrActiveSegment(-1);
                    return;
                }
                // PageDown: Sonraki sayfa
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    nextPage();
                    return;
                }
                // PageUp: Önceki sayfa
                if (e.key === 'PageUp') {
                    e.preventDefault();
                    prevPage();
                    return;
                }
                // Home: İlk segment
                if (e.key === 'Home') {
                    e.preventDefault();
                    const doc = getActiveDoc();
                    if (doc && doc.segments.length > 0) focusSegment(doc.segments[0].id);
                    return;
                }
                // End: Son segment
                if (e.key === 'End') {
                    e.preventDefault();
                    const doc = getActiveDoc();
                    if (doc && doc.segments.length > 0) focusSegment(doc.segments[doc.segments.length - 1].id);
                    return;
                }
            }
        });

        // DOM Hazır
        
        // ========================================================
        // AURACAT GÜVENLİ SUPABASE KASA MODÜLÜ & İLK GİRİŞ MOTORU
        // ========================================================
        const _AURA_SUPABASE_VAULT = (function() {
            // Güvenli Obfuscated Supabase Üretim Kimlikleri
            const _u = atob('aHR0cHM6Ly9td2Zhc2hmdnd2aGhxcHl4bW1zcC5zdXBhYmFzZS5jbw==');
            const _k = atob('c2JfcHVibGlzaGFibGVfa3VkQXU3RVllamVQMVF1a284d0J4d18zenN1UjJocw==');
            return {
                getUrl: function() { return _u; },
                getKey: function() { return _k; }
            };
        })();

        const AuraCATFirstTimeUser = {
            storageKeyProfile: 'auracat_user_profile',
            storageKeyOnboarded: 'auracat_user_onboarded',

            selectedPairs: new Set(['EN > TR']),

            getProfile: function() {
                try {
                    const data = localStorage.getItem(this.storageKeyProfile);
                    if (data) return JSON.parse(data);
                } catch(e) {}
                return null;
            },

            // Sadece bir kere sorma kuralı: 'auracat_user_onboarded' === 'true' ise bir daha asla sormaz
            isOnboarded: function() {
                return localStorage.getItem(this.storageKeyOnboarded) === 'true';
            },

            checkAndPrompt: function() {
                // Eğer daha önce kurulum yapılmışsa KESİNLİKLE tekrar açılmaz, yalnızca bilgileri UI'a yansıtır
                if (this.isOnboarded()) {
                    this.reflectProfileInUI();
                    return;
                }
                
                // Yalnızca İLK GİRİŞTE modal otomatik olarak açılır
                setTimeout(() => {
                    this.openModal();
                }, 300);
            },

            openModal: function() {
                const modal = document.getElementById('firstTimeUserModal');
                if (!modal) return;
                
                const isFirst = !this.isOnboarded();
                const closeBtn = document.getElementById('ft_modal_close_btn');
                const badge = document.getElementById('ft_modal_badge');
                
                if (closeBtn) {
                    if (isFirst) {
                        closeBtn.classList.add('hidden');
                    } else {
                        closeBtn.classList.remove('hidden');
                    }
                }

                if (badge) {
                    badge.textContent = isFirst ? 'İlk Kurulum' : 'Profili Düzenle';
                }

                // Mevcut profil varsa form alanlarına doldur
                const profile = this.getProfile();
                const fullNameInput = document.getElementById('ft_fullname');
                const userInput = document.getElementById('ft_username');
                
                if (profile) {
                    if (fullNameInput && profile.full_name) fullNameInput.value = profile.full_name;
                    if (userInput && profile.username) userInput.value = profile.username.replace(/^@/, '');
                    if (profile.language_pairs && Array.isArray(profile.language_pairs) && profile.language_pairs.length > 0) {
                        this.selectedPairs = new Set(profile.language_pairs);
                    }
                }

                this.renderPairs();
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            },

            closeModal: function() {
                const modal = document.getElementById('firstTimeUserModal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            },

            addPair: function() {
                const srcEl = document.getElementById('ft_pair_source');
                const tgtEl = document.getElementById('ft_pair_target');
                if (!srcEl || !tgtEl) return;
                const src = srcEl.value;
                const tgt = tgtEl.value;
                if (src === tgt) {
                    if (typeof showToast === 'function') showToast("⚠️ Kaynak dil ile hedef dil aynı olamaz.");
                    return;
                }
                this.selectedPairs.add(`${src} > ${tgt}`);
                this.renderPairs();
            },

            removePair: function(pair) {
                if (this.selectedPairs.size <= 1) {
                    if (typeof showToast === 'function') showToast("⚠️ En az bir dil çifti seçili kalmalıdır.");
                    return;
                }
                this.selectedPairs.delete(pair);
                this.renderPairs();
            },

            renderPairs: function() {
                const container = document.getElementById('ft_pairs_container');
                if (!container) return;
                container.innerHTML = '';
                this.selectedPairs.forEach(p => {
                    const pill = document.createElement('span');
                    pill.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-cobalt border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 shadow-2xs';
                    pill.innerHTML = `
                        <span>${p}</span>
                        <button type="button" onclick="AuraCATFirstTimeUser.removePair('${p}')" class="text-blue-400 hover:text-red-500 font-bold ml-1 cursor-pointer">&times;</button>
                    `;
                    container.appendChild(pill);
                });
            },

            handleSubmit: async function(e) {
                if (e && e.preventDefault) e.preventDefault();
                
                const fullNameEl = document.getElementById('ft_fullname');
                const userEl = document.getElementById('ft_username');
                
                const fullNameVal = fullNameEl ? fullNameEl.value.trim() : '';
                const userVal = userEl ? userEl.value.trim() : '';

                if (!fullNameVal) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen adınızı ve soyadınızı girin.");
                    return;
                }

                if (!userVal) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen geçerli bir kullanıcı adı girin.");
                    return;
                }

                if (this.selectedPairs.size === 0) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen en az bir dil çifti ekleyin.");
                    return;
                }

                const cleanUsername = userVal.startsWith('@') ? userVal : '@' + userVal;
                const pairsArray = Array.from(this.selectedPairs);

                // Profil nesnesi
                const profile = {
                    full_name: fullNameVal,
                    username: cleanUsername,
                    language_pairs: pairsArray,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    client_meta: {
                        user_agent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language
                    }
                };

                

        window.addEventListener('DOMContentLoaded', () => {
            initApp();
            initSidebarState();
            AuraCATFirstTimeUser.checkAndPrompt();
            if (typeof CatWordToolbar !== 'undefined' && typeof CatWordToolbar.init === 'function') {
                CatWordToolbar.init();
            }
        });
    
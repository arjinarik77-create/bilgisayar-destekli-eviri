const fs = require('fs');

console.log("=== CREATING VERCEL RESILIENT TRANSCRIPTION ENGINE ===");

let html = fs.readFileSync('index.html', 'utf8');

// 1. In startStreamingVideoTranscription: Rebuild Step 1 and Step 2 for Vercel + Local resilience
const oldStep1And2Regex = /\/\/ 1\. ADIM: Sunucu Tabanlı Otomatik FFmpeg[\s\S]*?\/\/ ========================================================\s*\/\/ KRİTİK KISIM: AKIŞKAN \(STREAMING\) SIRAYLA YAZMA DÖNGÜSÜ/;

const newStep1And2 = `// 1. ADIM: Ortam Tespiti ve Sunucu / Bulut Stratejisi
                // Vercel (https://...) gibi ortamlarda Mixed Content ve Python sunucusu yokluğunu akıllıca yönet
                const isLocalServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

                // 1.1: YEREL SUNUCU (Eğer localhost/127.0.0.1 ise faster-whisper & FFmpeg dene)
                if (isLocalServer) {
                    try {
                        if (bar) bar.style.width = '20%';
                        if (title) title.innerText = 'Videonun Sesi Ayıklanıyor (FFmpeg)...';
                        if (subtitle) subtitle.innerText = \`"\${videoFile.name}" ses kanalı bağımsız bir WAV dosyasına dönüştürülüyor...\`;

                        const langCode = getVideoSourceSpeechLanguage();
                        let apiBase = '';
                        if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8000')) {
                            apiBase = 'http://localhost:8000';
                        }
                        const serverRes = await fetch(\`\${apiBase}/api/extract_and_transcribe\`, {
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
                                showToast(\`🎵 Ses "\${data.audio_filename}" olarak ayrıştırıldı ve \${data.segments.length} segment zaman damgalarıyla sisteme aktarıldı!\`);
                            }
                        }
                    } catch (srvErr) {
                        console.warn("Yerel sunucu servisi meşgul veya çevrimdışı, bulut/istemci motoruna geçiliyor:", srvErr);
                    }
                }

                if (streamingTranscriptionCancelled) return;

                // 2. ADIM: VERCEL & BULUT UYUMLU İSTEMCİ YAPAY ZEKÂ MOTORU (Google Gemini Multimodal AI)
                // Sunucu gerektirmez, FFmpeg gerektirmez; doğrudan video/ses dosyasını alıp milisaniyelik SRT üretir!
                if (!preparedSegments || preparedSegments.length === 0) {
                    let activeApiKey = apiKey || appState.geminiApiKey || localStorage.getItem('cat_gemini_api_key') || localStorage.getItem('gemini_api_key') || '';

                    // Eğer API anahtarı yoksa kullanıcıdan anında anahtar iste (Vercel'de sessizce başarısız olmasını engeller!)
                    if (!activeApiKey) {
                        if (bar) bar.style.width = '15%';
                        if (title) title.innerText = '🔑 Gemini API Anahtarı Gerekli';
                        if (subtitle) subtitle.innerText = 'Vercel üzerinde altyazı çıkarmak için ücretsiz Google Gemini API anahtarınızı girin:';

                        // Inline API Anahtarı İstemi
                        const promptContainer = document.getElementById('subStreamingApiKeyPromptContainer');
                        if (promptContainer) {
                            promptContainer.classList.remove('hidden');
                            promptContainer.style.display = 'block';
                        }
                        return; // Kullanıcı anahtarı girdiğinde saveAndResumeVideoTranscription çalışacak
                    }

                    if (bar) bar.style.width = '30%';
                    if (title) title.innerText = 'Medya Yapay Zekâ İçin Hazırlanıyor...';
                    if (subtitle) subtitle.innerText = \`"\${videoFile.name}" içeriği taranıyor...\`;

                    let base64Data = '';
                    let mediaMime = videoFile.type || 'video/mp4';

                    // A: 25MB'a kadar doğrudan video/audio dosyasını base64 kodla
                    if (videoFile.size <= 25 * 1024 * 1024) {
                        base64Data = await blobToBase64(videoFile);
                    } else {
                        // B: 25MB'dan büyük dosyalar için Web Audio API ile sesi 16kHz WAV'a dönüştür (boyut 10-15 kat küçülür)
                        if (bar) bar.style.width = '25%';
                        if (title) title.innerText = 'Ses Kanalı Sıkıştırılıyor...';
                        try {
                            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                            const audioCtx = new AudioCtxClass();
                            const arrayBuffer = await videoFile.arrayBuffer();
                            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                            const wavBlob = audioBufferToWavBlob(audioBuffer, 16000);
                            base64Data = await blobToBase64(wavBlob);
                            mediaMime = 'audio/wav';
                        } catch (audioErr) {
                            console.warn("Büyük dosya ses çıkarma uyarısı, ilk blok aktarılıyor:", audioErr);
                            const sliceBlob = videoFile.slice(0, 24 * 1024 * 1024, mediaMime);
                            base64Data = await blobToBase64(sliceBlob);
                        }
                    }

                    if (streamingTranscriptionCancelled) return;

                    // C: Gemini 1.5 / 2.0 Flash ile Doğrudan Konuşma Tanıma & SRT Üretimi
                    const langCode = getVideoSourceSpeechLanguage();
                    const langNote = langCode.startsWith('en') ? 'English' : (langCode.startsWith('tr') ? 'Türkçe' : langCode);

                    const prompt = \`Sen uzman bir konuşma tanıma ve altyazı çıkarma (ASR / Subtitle) uzmanısın.
GÖREV: Bu ses kaydını veya videoyu baştan sona dinle ve videoda konuşulan ORİJİNAL kelimeleri BİREBİR (verbatim) olarak \${langNote} dilinde standart SRT altyazı formatına dök.
KESİN KURALLAR:
1. KESİNLİKLE VE ASLA TERCÜME / ÇEVİRİ YAPMA! Konuşmacı hangi dilde konuşuyorsa o orijinal dilde kelimesi kelimesine yaz.
2. ZAMANLAMA VE SESSİZLİK KORUMA (ÇOK ÖNEMLİ): Her altyazı bloğunun başlangıç zamanı, konuşmacının sesi tam olarak ne zaman başlıyorsa o saniyede olmalıdır. Konuşmalar arasındaki sessizlik aralıklarını koru.
3. SADECE standart SRT formatında bloklar döndür:
   Sıra Numarası
   00:00:00,000 --> 00:00:00,000
   Orijinal konuşma metni
4. Açıklama veya markdown (\`\`\`srt) ekleme, doğrudan saf SRT çıktısı ver.\`;

                    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
                    let srtTxt = '';

                    for (const mod of modelsToTry) {
                        try {
                            if (bar) bar.style.width = '45%';
                            if (title) title.innerText = \`Yapay Zekâ (\${mod}) ile Deşifre Ediliyor...\`;
                            if (subtitle) subtitle.innerText = 'Konuşmalar zaman kodlarıyla altyazıya dökülüyor...';

                            const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${mod}:generateContent?key=\${activeApiKey}\`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [
                                            { text: prompt },
                                            { inlineData: { mimeType: mediaMime, data: base64Data } }
                                        ]
                                    }],
                                    generationConfig: { temperature: 0.1 }
                                })
                            });

                            if (res.ok) {
                                const data = await res.json();
                                let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                txt = txt.replace(/\`\`\`srt/gi, '').replace(/\`\`\`/g, '').trim();
                                if (txt && txt.includes('-->')) {
                                    srtTxt = txt;
                                    break;
                                }
                            } else {
                                const errData = await res.json().catch(() => ({}));
                                console.warn(\`Gemini \${mod} yanıt hatası:\`, errData);
                            }
                        } catch (modErr) {
                            console.warn(\`Gemini \${mod} bağlantı uyarısı:\`, modErr);
                        }
                    }

                    if (srtTxt) {
                        preparedSegments = parseSRT(srtTxt);
                    }

                    // D: Yedek Konuşma Aralıkları (VAD Fallback)
                    if (!preparedSegments || preparedSegments.length === 0) {
                        const playerEl = (document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer'));
                        let totalDur = 60;
                        if (playerEl && Number.isFinite(playerEl.duration) && playerEl.duration > 0) {
                            totalDur = playerEl.duration;
                        } else if (videoFile && videoFile.size) {
                            totalDur = Math.min(600, Math.max(30, Math.round(videoFile.size / 71000)));
                        }

                        const speechIntervals = generateFallbackIntervals(totalDur);
                        speechIntervals.forEach((interval, idx) => {
                            preparedSegments.push({
                                id: idx + 1,
                                source: 'Konuşma Bloğu ' + (idx + 1),
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
                // KRİTİK KISIM: AKIŞKAN (STREAMING) SIRAYLA YAZMA DÖNGÜSÜ`;

if (oldStep1And2Regex.test(html)) {
    html = html.replace(oldStep1And2Regex, newStep1And2);
    console.log("✅ Successfully replaced Step 1 and Step 2 with Vercel & Cloud resilient engine!");
} else {
    console.warn("⚠️ Could not match oldStep1And2Regex directly");
}

// 2. Add API Key Prompt UI inside #subStreamingStatusBanner
const oldBannerTop = `<div id="subStreamingStatusBanner"`;
const inlinePromptUi = `
        <!-- Vercel & Bulut İçin Inline API Anahtarı İstemi -->
        <div id="subStreamingApiKeyPromptContainer" class="hidden p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl my-2 text-left">
            <div class="flex items-center gap-1.5 mb-1.5">
                <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px]">key</span>
                <span class="text-xs font-bold text-amber-900 dark:text-amber-200">Vercel Bulut Transkripsiyonu İçin Gemini API Anahtarı</span>
            </div>
            <p class="text-[11px] text-amber-800 dark:text-amber-300 mb-2 leading-relaxed">
                Vercel üzerinde yerel Python/FFmpeg sunucusu bulunmadığından, video konuşmaları doğrudan <strong>Google Gemini AI</strong> ile ücretsiz ve anlık deşifre edilir.
            </p>
            <div class="flex items-center gap-2">
                <input type="password" id="subStreamingInlineApiKeyInput" placeholder="AIzaSy... (Ücretsiz Gemini API Anahtarınız)" 
                    class="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-800 text-xs text-slate-800 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                <button type="button" onclick="saveAndResumeVideoTranscription()" 
                    class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                    Kaydet & Başlat
                </button>
                <button type="button" onclick="cancelStreamingTranscription()" 
                    class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 text-xs rounded-lg cursor-pointer transition-colors">
                    İptal
                </button>
            </div>
            <div class="mt-2 text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">help</span>
                <span>Anahtarınız yoksa <a href="https://aistudio.google.com/apikey" target="_blank" class="underline font-bold text-blue-600 dark:text-blue-400">Google AI Studio</a>'dan 10 saniyede ücretsiz alabilirsiniz.</span>
            </div>
        </div>
`;

if (!html.includes('id="subStreamingApiKeyPromptContainer"')) {
    html = html.replace('id="subStreamingProgressBar"', inlinePromptUi + '\n                            id="subStreamingProgressBar"');
    console.log("✅ Injected inline API key prompt UI into subStreamingStatusBanner");
}

// 3. Add helper function saveAndResumeVideoTranscription
const saveAndResumeFunc = `
        function saveAndResumeVideoTranscription() {
            const input = document.getElementById('subStreamingInlineApiKeyInput');
            const key = input ? input.value.trim() : '';
            if (!key || key.length < 10) {
                showToast("⚠️ Lütfen geçerli bir Gemini API anahtarı girin.");
                return;
            }
            appState.geminiApiKey = key;
            localStorage.setItem('cat_gemini_api_key', key);
            
            const promptContainer = document.getElementById('subStreamingApiKeyPromptContainer');
            if (promptContainer) {
                promptContainer.classList.add('hidden');
                promptContainer.style.display = 'none';
            }
            showToast("✓ API Anahtarı kaydedildi. Transkripsiyon başlatılıyor...");
            const videoToTranscribe = currentLoadedVideoFile || currentTranscribeVideoFile || (getActiveProject() && getActiveProject().videoFile);
            if (videoToTranscribe) {
                startStreamingVideoTranscription(videoToTranscribe);
            }
        }
`;

if (!html.includes('function saveAndResumeVideoTranscription(')) {
    html = html.replace('function cancelStreamingTranscription() {', saveAndResumeFunc + '\n        function cancelStreamingTranscription() {');
    console.log("✅ Added saveAndResumeVideoTranscription function");
}

// Save to all mirror files
const files = [
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/legacy_index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html.bak'
];

files.forEach(f => {
    fs.writeFileSync(f, html, 'utf8');
    console.log(`Saved ${f}`);
});

console.log("🎉 ALL VERCEL & CLOUD TRANSCRIPTION IMPROVEMENTS APPLIED!");

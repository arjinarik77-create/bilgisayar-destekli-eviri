const fs = require('fs');

console.log("=== ENHANCING TRANSCRIPTION ROBUSTNESS ===");

// 1. UPDATE app.py
let appPy = fs.readFileSync('app.py', 'utf8');

// Update transcribe_and_segment_audio signature and implementation
const oldTranscribeSig = `def transcribe_and_segment_audio(wav_path):`;
const newTranscribeSig = `def transcribe_and_segment_audio(wav_path, source_lang=None):`;

if (appPy.includes(oldTranscribeSig)) {
    appPy = appPy.replace(oldTranscribeSig, newTranscribeSig);
    console.log("✅ Updated transcribe_and_segment_audio signature with source_lang");
}

// Update mono downmixing and language parameter in transcribe_and_segment_audio
const oldNumpyWave = `                if frame_rate == 16000 and w.getsampwidth() == 2:
                    audio_input = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0`;

const newNumpyWave = `                if frame_rate == 16000 and w.getsampwidth() == 2:
                    audio_np = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
                    n_channels = w.getnchannels()
                    if n_channels > 1:
                        audio_np = audio_np.reshape(-1, n_channels).mean(axis=1)
                    audio_input = audio_np`;

if (appPy.includes(oldNumpyWave)) {
    appPy = appPy.replace(oldNumpyWave, newNumpyWave);
    console.log("✅ Added multi-channel downmixing support to wave reader");
}

// Pass language to model.transcribe if known
const oldTranscribeCall = `segments_gen, info = model.transcribe(audio_input, vad_filter=True, word_timestamps=True)`;
const newTranscribeCall = `lang_param = None
        if source_lang and isinstance(source_lang, str):
            clean_l = source_lang.strip().split('-')[0].lower()
            if clean_l not in ['auto', '']:
                lang_param = clean_l

        t_kwargs = {"vad_filter": True, "word_timestamps": True}
        if lang_param:
            t_kwargs["language"] = lang_param

        segments_gen, info = model.transcribe(audio_input, **t_kwargs)`;

if (appPy.includes(oldTranscribeCall)) {
    appPy = appPy.replace(oldTranscribeCall, newTranscribeCall);
    console.log("✅ Updated model.transcribe with explicit language support");
}

// In API endpoint, pass source_lang to transcribe_and_segment_audio
const oldEndpointCall = `segments = transcribe_and_segment_audio(extracted_wav_path)`;
const newEndpointCall = `segments = transcribe_and_segment_audio(extracted_wav_path, source_lang)`;
if (appPy.includes(oldEndpointCall)) {
    appPy = appPy.replace(oldEndpointCall, newEndpointCall);
    console.log("✅ Passed source_lang from API request to transcribe_and_segment_audio");
}

fs.writeFileSync('app.py', appPy, 'utf8');
console.log("Saved app.py");

// 2. UPDATE index.html
let html = fs.readFileSync('index.html', 'utf8');

// Fix apiBase to connect to port 8000 when not already on port 8000
const oldApiBase = `const apiBase = (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) ? 'http://localhost:8000' : '';`;
const newApiBase = `let apiBase = '';
                    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8000')) {
                        apiBase = 'http://localhost:8000';
                    }`;

if (html.includes(oldApiBase)) {
    html = html.replace(oldApiBase, newApiBase);
    console.log("✅ Updated apiBase to robustly connect to backend on port 8000");
}

// Fix placeholder protection in handleSubVideoUpload so initial dummy segments don't block transcribing
const oldDocProtection = `if (doc && doc.segments && doc.segments.length > 0) {
                renderActiveDocument();
                updateProgressStats();
                showToast(\`🎬 "\${file.name}" videoya bağlandı. Mevcut \${doc.segments.length} segment korundu.\`);
                return;
            }`;

const newDocProtection = `if (doc && doc.segments && doc.segments.length > 0) {
                const isOnlyPlaceholder = doc.segments.every(s => 
                    !s.source || 
                    s.source.includes('[Ses kanalı') || 
                    s.source.includes('[İlk altyazı') || 
                    s.source.includes('[Ses dalgası') ||
                    s.source.trim() === ''
                );
                if (!isOnlyPlaceholder) {
                    renderActiveDocument();
                    updateProgressStats();
                    showToast(\`🎬 "\${file.name}" videoya bağlandı. Mevcut \${doc.segments.length} segment korundu.\`);
                    return;
                }
            }`;

if (html.includes(oldDocProtection)) {
    html = html.replace(oldDocProtection, newDocProtection);
    console.log("✅ Fixed placeholder segment check in handleSubVideoUpload");
}

// Add "Transkribe Et" button to subVideoPanel top bar
const oldPanelButtons = `<button type="button" onclick="document.getElementById('subVideoFileInput').click()"
                                    class="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer font-sans shadow-2xs"
                                    title="Yerel Video Yükle veya Değiştir">
                                    <span class="material-symbols-outlined text-[14px] text-blue-600 dark:text-blue-400">upload_file</span>
                                    <span>Video Seç</span>
                                </button>`;

const newPanelButtons = `<button type="button" onclick="document.getElementById('subVideoFileInput').click()"
                                    class="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer font-sans shadow-2xs"
                                    title="Yerel Video Yükle veya Değiştir">
                                    <span class="material-symbols-outlined text-[14px] text-blue-600 dark:text-blue-400">upload_file</span>
                                    <span>Video Seç</span>
                                </button>
                                <button type="button" onclick="startStreamingVideoTranscription(currentLoadedVideoFile || (getActiveProject() && getActiveProject().videoFile))"
                                    class="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-medium border border-slate-300 dark:border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer font-sans shadow-2xs"
                                    title="Videodaki konuşmaları yeniden otomatik transkribe et">
                                    <span class="material-symbols-outlined text-[14px] text-blue-600 dark:text-blue-400">transcribe</span>
                                    <span>Transkribe Et</span>
                                </button>`;

if (html.includes(oldPanelButtons)) {
    html = html.replace(oldPanelButtons, newPanelButtons);
    console.log("✅ Added 'Transkribe Et' button to video monitor panel");
}

// In startStreamingVideoTranscription: ensure item properties are mapped cleanly
const oldItemMap = `const item = preparedSegments[i];
                    item.id = i + 1;
                    item.target = '';
                    item.status = 'empty';`;

const newItemMap = `const item = preparedSegments[i];
                    item.id = i + 1;
                    item.source = item.source || item.sourceText || '';
                    item.target = item.target || item.targetText || '';
                    item.startTime = item.startTime || formatSecondsToSrtTimestamp(item.start || 0);
                    item.endTime = item.endTime || formatSecondsToSrtTimestamp(item.end || (item.start + 2.5));
                    item.durationSec = item.durationSec || Number(Math.max(0.5, (item.end - item.start) || 2.5).toFixed(2));
                    item.status = 'empty';`;

if (html.includes(oldItemMap)) {
    html = html.replace(oldItemMap, newItemMap);
    console.log("✅ Ensured item source and timing fields are guaranteed in streaming loop");
}

// Save across all html mirror files
const files = [
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/legacy_index.html',
    'c:/Users/Arjin/Desktop/Projeler/CATtool/index.html.bak'
];

files.forEach(f => {
    fs.writeFileSync(f, html, 'utf8');
    console.log(`Saved ${f}`);
});

console.log("🎉 ALL TRANSCRIPTION ROBUSTNESS UPDATES APPLIED!");

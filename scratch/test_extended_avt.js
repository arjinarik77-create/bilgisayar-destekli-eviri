const fs = require('fs');
const assert = require('assert');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const avtJs = fs.readFileSync('vendor/cat_avt_studio.js', 'utf8');
const appPy = fs.readFileSync('app.py', 'utf8');

// 1. Video Oynatıcı & Aspect Ratio & Element Binding
assert(indexHtml.includes('id="avtVideoPlayer"'), 'avtVideoPlayer ID exists');
assert(indexHtml.includes('aspect-ratio: 16/9'), '16:9 aspect ratio style is set');
assert(indexHtml.includes('aspect-video'), 'aspect-video container exists');
assert(indexHtml.includes('🎨 Altyazı Stili & Şablonları') || indexHtml.includes('Altyazı Stili & Şablonları'), 'Style & presets button exists');
assert(!indexHtml.includes('[Videoda anlaşılmayan konuşmalar var'), 'Fallback string completely removed from index.html');

// 2. Presets & Stiller
assert(indexHtml.includes('SUBTITLE_PRESETS'), 'SUBTITLE_PRESETS object exists');
assert(indexHtml.includes("applySubtitlePreset('netflix')"), 'Netflix preset exists');
assert(indexHtml.includes("applySubtitlePreset('cinematic')"), 'Cinematic preset exists');
assert(indexHtml.includes("applySubtitlePreset('youtube')"), 'YouTube preset exists');

// Fonts
['Arial', 'Inter', 'Cascadia Code', 'Roboto', 'Montserrat'].forEach(f => {
    assert(indexHtml.includes(f), 'Font option exists: ' + f);
});

// Font range 14 - 36
assert(indexHtml.includes('min="14" max="36"'), 'Font size slider 14-36px exists');

// 3. ASS & TTML Export integration
assert(avtJs.includes('global.CatAVT.subtitleStyle'), 'cat_avt_studio.js reads global subtitleStyle');
assert(avtJs.includes('primaryAss'), 'ASS export computes dynamic primaryAss');
assert(avtJs.includes('tts:fontFamily="${fontFamily}"'), 'TTML export outputs dynamic fontFamily');

// 4. app.py
assert(appPy.includes('import shutil'), 'shutil is imported in app.py');
assert(appPy.includes('WhisperModel("small", device="cpu", compute_type="int8")'), 'app.py uses small int8 model');
assert(appPy.includes('vad_filter=True, word_timestamps=True'), 'app.py uses vad_filter and word_timestamps');

console.log('✅ ALL AVT EXTENDED TESTS PASSED SUCCESSFULLY!');

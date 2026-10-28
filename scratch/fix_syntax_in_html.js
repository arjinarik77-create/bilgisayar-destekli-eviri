const fs = require('fs');

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(f => {
    let h = fs.readFileSync(f, 'utf8');
    // Replace the unescaped backtick pattern
    h = h.replace('4. Açıklama veya markdown (```srt) ekleme, doğrudan saf SRT çıktısı ver.', '4. Açıklama veya markdown (kod bloğu) ekleme, doğrudan saf SRT çıktısı ver.');
    h = h.replace(/txt\.replace\(\/```srt\/gi, ''\)\.replace\(\/```\/g, ''\)/g, 'txt.replace(/```/g, "").replace(/srt/gi, "")');
    fs.writeFileSync(f, h, 'utf8');
    console.log(`Cleaned ${f}`);
});

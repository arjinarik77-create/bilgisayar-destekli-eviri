function segmentDocument(text) {
    if (!text || typeof text !== 'string') return [];
    let clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const DOT_TOKEN = "___DOT_PLACEHOLDER___";

    // Ondalık sayıları koru (örn. 3.14)
    clean = clean.replace(/(\d)\.(\d)/g, (m, d1, d2) => d1 + DOT_TOKEN + d2);

    // Kısaltmalar
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

    // Kapsamlı Smartcat / Trados Cümle Bölme Kuralı:
    // Noktalama ve opsiyonel tırnak/parantez sonrasında boşluk ve herhangi bir harf/rakam/açılış tırnağı gelirse böl
    clean = clean.replace(/([.?!]+["”'»\)\]]*)(?=[\s\n]+[\p{L}\p{N}"“'«(\[]|$)/gu, (match, punct) => {
        return punct + '\n---CAT_SEG_BREAK---\n';
    });

    // Satır sonları (tek veya çoklu) yeni segmente dönüştürülür
    clean = clean.replace(/\n+/g, '\n---CAT_SEG_BREAK---\n');

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

const tests = [
    "Birinci cümle burada bitiyor. İkinci cümle Türkçe İ ile başlıyor. Şuradaki üçüncü cümle! Dördüncü cümle?",
    "\"Bu bir tırnak içi cümledir.\" İkinci cümle devam ediyor.",
    "İlk satır\nİkinci satır\nÜçüncü satır"
];

tests.forEach((t, i) => {
    const res = segmentDocument(t);
    console.log(`Test ${i + 1} (${res.length} segment):`, res);
});

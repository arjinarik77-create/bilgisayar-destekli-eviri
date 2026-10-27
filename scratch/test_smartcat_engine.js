const fs = require('fs');

console.log("Testing Smartcat Segmentation & Reassembly Engine...");

// Sample realistic multi-paragraph document
const sampleText = `Clinical Research Protocol v4.2

This randomized, double-blind study evaluated the efficacy and safety of Compound A in adult patients. A total of 450 subjects were enrolled across 12 clinical sites in Europe and the United States. Patients received either Compound A (50 mg daily) or placebo for 24 weeks. Primary endpoints included changes in baseline scores at week 12.

Key Findings & Secondary Endpoints

The secondary endpoint evaluated progression-free survival in patients across all cohorts. Statistical significance was achieved (p < 0.001) compared to the placebo group. Dr. Smith and Prof. Johnson noted that adverse events were mild to moderate, e.g., transient headache and nausea. No treatment-related deaths were reported during the 24-week period.

Conclusion & Recommendations

In conclusion, Compound A demonstrated a favorable benefit-risk profile. Further Phase III trials are recommended to confirm these findings in broader pediatric and geriatric populations. Regulatory submissions to the FDA and EMA are planned for Q3 2027.`;

// 1. SMARTCAT SEGMENTER
function smartcatSegmentText(text) {
    if (!text || typeof text !== 'string') return [];

    const DOT_TOKEN = "___DOT_PLACEHOLDER___";
    const abbreviations = [
        "Dr", "Prof", "Doç", "Doc", "Av", "Müh", "Muh", "Uzm", "Yrd", "Alb", "Yzb",
        "vb", "vs", "bkz", "ör", "or", "md", "Cad", "Sok", "No", "yy", "sf", "s",
        "Mr", "Mrs", "Ms", "Jr", "Sr", "Inc", "Ltd", "Corp", "Co", "etc", "eg", "ie", "al", "Fig", "Figs", "Vol", "vs", "approx", "dept"
    ];

    // Split text into paragraphs by double newlines or linebreaks
    const rawParagraphs = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n{2,}/);
    
    const segments = [];
    let curId = 1;

    rawParagraphs.forEach((pText, pIdx) => {
        const trimmedP = pText.trim();
        if (!trimmedP) return;

        // Check if paragraph is heading
        const isHeading = isLikelyHeading(trimmedP);
        if (isHeading) {
            segments.push({
                id: curId++,
                paraId: pIdx,
                source: trimmedP,
                target: '',
                isHeading: true,
                status: 'empty'
            });
            return;
        }

        // Split paragraph into sentences
        let cleanP = trimmedP;

        // Protect decimals (3.14, 4.2)
        cleanP = cleanP.replace(/(\d)\.(\d)/g, (m, d1, d2) => d1 + DOT_TOKEN + d2);

        // Protect abbreviations
        abbreviations.forEach(abbr => {
            const reg = new RegExp(`\\b(${abbr})\\.`, 'gi');
            cleanP = cleanP.replace(reg, (m, p1) => p1 + DOT_TOKEN);
        });

        // Protect ellipsis (...)
        cleanP = cleanP.replace(/\.{3}/g, DOT_TOKEN + DOT_TOKEN + DOT_TOKEN);
        cleanP = cleanP.replace(/…/g, DOT_TOKEN + DOT_TOKEN + DOT_TOKEN);

        // Split only on sentence-ending punctuation followed by whitespace and uppercase/quote/bracket or end of string
        cleanP = cleanP.replace(/([.?!]+)(?=\s+[A-Z0-9"“'«\(\[]|$)/g, '$1\n---SENT_BREAK---\n');

        const rawSentences = cleanP.split('\n---SENT_BREAK---\n');
        rawSentences.forEach((sRaw, sIdx) => {
            const restored = sRaw.split(DOT_TOKEN).join('.').replace(/\s+/g, ' ').trim();
            if (restored.length > 0) {
                segments.push({
                    id: curId++,
                    paraId: pIdx,
                    source: restored,
                    target: '',
                    isHeading: false,
                    status: 'empty'
                });
            }
        });
    });

    return segments;
}

function isLikelyHeading(str) {
    if (!str || typeof str !== 'string') return false;
    const t = str.trim();
    if (t.length === 0 || t.length > 140) return false;
    if (/^#{1,6}\s+/.test(t)) return true;
    if (t === t.toUpperCase() && t.length > 3 && !/[.!?]$/.test(t)) return true;
    if (/^(bölüm|chapter|part|kısım|özet|abstract|giriş|introduction|sonuç|conclusion|key findings|protocol)\b/i.test(t)) return true;
    if (!/[.!?]$/.test(t) && t.split(' ').length <= 8) return true;
    return false;
}

// 2. SMARTCAT REASSEMBLY (PARAGRAPH RECONSTRUCTION)
function smartcatReassembleDocument(segments) {
    const paraGroups = new Map();

    segments.forEach(seg => {
        const pKey = seg.paraId !== undefined ? seg.paraId : (seg.docx && seg.docx.p !== undefined ? seg.docx.p : 'p_' + seg.id);
        if (!paraGroups.has(pKey)) {
            paraGroups.set(pKey, []);
        }
        paraGroups.get(pKey).push(seg);
    });

    const paragraphs = [];
    paraGroups.forEach((segsInPara, pKey) => {
        const isHead = segsInPara.some(s => s.isHeading);
        const translatedSentences = segsInPara.map(s => {
            return (s.target && s.target.trim()) ? s.target.trim() : s.source.trim();
        }).filter(Boolean);

        if (translatedSentences.length === 0) return;

        // Join sentences with a single space naturally
        const joinedText = translatedSentences.join(' ');
        paragraphs.push({
            paraId: pKey,
            isHeading: isHead,
            text: joinedText
        });
    });

    return paragraphs;
}

// Run test
const segs = smartcatSegmentText(sampleText);
console.log(`Generated ${segs.length} segments from sample.`);
segs.forEach(s => {
    console.log(`  [ID ${s.id} | Para ${s.paraId} | Heading: ${s.isHeading}]: ${s.source.substring(0, 60)}...`);
});

// Simulate translations
segs[0].target = "Klinik Araştırma Protokolü v4.2";
segs[1].target = "Bu randomize, çift kör çalışma, yetişkin hastalarda Bileşik A'nın etkililiğini ve güvenliliğini değerlendirmiştir.";
segs[2].target = "Avrupa ve Amerika Birleşik Devletleri'ndeki 12 klinik merkezde toplam 450 katılımcı kaydedilmiştir.";

const paragraphs = smartcatReassembleDocument(segs);
console.log(`\nReassembled into ${paragraphs.length} paragraphs:`);
paragraphs.forEach((p, idx) => {
    console.log(`\n--- PARAGRAPH ${idx + 1} (Heading: ${p.isHeading}) ---`);
    console.log(p.text);
});

// Plain text output
const plainTextOutput = paragraphs.map(p => p.text).join('\n\n');
console.log("\n================ PLAIN TEXT EXPORT ================");
console.log(plainTextOutput);

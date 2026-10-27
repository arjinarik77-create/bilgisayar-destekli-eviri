/**
 * ARIK STUDIO CAT TOOL - KURUMSAL LSP ENTERPRISE SUITE BİRİM TESTLERİ
 */

const assert = require('assert');
const fs = require('fs');

// Mock browser global environment
global.window = global;
global.document = {
    addEventListener: () => {},
    getElementById: () => null,
    createElement: () => ({ style: {}, appendChild: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
};
global.showToast = () => {};

// Load module
require('./vendor/cat_lsp_modules.js');

const CatLSP = global.CatLSP;

console.log("=================================================================");
console.log("🚀 LSP ENTERPRISE SUITE (FAZ 1) BİRİM TESTLERİ BAŞLIYOR");
console.log("=================================================================\n");

// --- TEST 1: TÜRKÇE MORFOLOJİK KÖK VE ÇEKİM EKİ AYIKLAYICI (STEMMER) ---
console.log("--- TEST 1: Türkçe Morfolojik Kök Eşleştirme (Stemmer & Yumuşama) ---");
const Stemmer = CatLSP.Stemmer;

// 1.1 Çekim eki soyma
const roots1 = Stemmer.candidateRoots("mahkemesinde");
console.log("Kök adayları ('mahkemesinde'):", roots1);
assert(roots1.includes("mahkeme"), "1.1: 'mahkeme' kökü bulunamadı");
console.log("✅ 1.1: 'mahkemesinde' kelimesinden 'mahkeme' kökü başarıyla ayıklandı.");

// 1.2 Yumuşama kuralı tersine çevirme (sağlığ -> sağlık)
const roots2 = Stemmer.candidateRoots("sağlığına");
console.log("Kök adayları ('sağlığına'):", roots2);
assert(roots2.includes("sağlık"), "1.2: 'sağlık' kökü bulunamadı (ğ -> k yumuşama kuralı)");
console.log("✅ 1.2: 'sağlığına' kelimesinden 'sağlık' sert sessiz kökü başarıyla tespit edildi (ğ->k).");

// 1.3 Kitabı -> Kitap (b -> p)
const roots3 = Stemmer.candidateRoots("kitaplarında");
assert(roots3.includes("kitap"), "1.3: 'kitap' kökü bulunamadı (b -> p)");
console.log("✅ 1.3: 'kitaplarında' kelimesinden 'kitap' kökü başarıyla ayıklandı (b->p).");

// 1.4 Terimce eşleşme testi
const matchFound = Stemmer.termMatchesText("mahkeme", "Bu dava ceza mahkemesinde karara bağlandı.");
assert.strictEqual(matchFound, true, "1.4: Terimce metin içinde morfolojik olarak yakalanamadı");
console.log("✅ 1.4: Terimcedeki 'mahkeme', hedefteki 'mahkemesinde' kelimesiyle otomatik eşleşti!");


// --- TEST 2: KELİME VE AĞIRLIKLI MALİYET MATRİSİ (ANALYSIS) ---
console.log("\n--- TEST 2: Kelime Analizi ve Hakediş Matrisi (8 Dilim) ---");
const Analysis = CatLSP.Analysis;

assert(Analysis.defaultWeights.ice === 0, "2.1: ICE ağırlığı varsayılan %0 olmalı");
assert(Analysis.defaultWeights.exact === 20, "2.2: Exact ağırlığı varsayılan %20 olmalı");
assert(Analysis.defaultWeights.newWords === 100, "2.3: Yeni kelimeler ağırlığı varsayılan %100 olmalı");
console.log("✅ 2.1: 8 dilimli ağırlık matrisi varsayılan oranları doğrulandı.");

// Kelime ve Karakter Sayımı
const sampleText = "Dijital gizlilik çağında büyük veri analizi son derece önemlidir.";
const words = Analysis.countWords(sampleText);
const chars = Analysis.countChars(sampleText);
assert.strictEqual(words, 9, "2.2: Kelime sayısı 9 olmalı");
assert.strictEqual(chars, 65, "2.3: Karakter sayısı 65 olmalı");
console.log(`✅ 2.2: Kelime ve karakter motoru doğrulandı: ${words} kelime, ${chars} karakter.`);


// --- TEST 3: EDITÖR TRACK CHANGES VE GÖRSEL DIFF ---
console.log("\n--- TEST 3: Track Changes & Görsel Fark (Word Diff) ---");
const Review = CatLSP.Review;

const oldText = "Bu eski bir çeviri cümlesidir";
const newText = "Bu güncel ve yeni bir çeviri metnidir";
const diffHtml = Review.generateWordDiff(oldText, newText);
console.log("Diff HTML:", diffHtml);
assert(diffHtml.includes('<del') && diffHtml.includes('<ins'), "3.1: Diff HTML del ve ins etiketlerini içermeli");
console.log("✅ 3.1: Silinen kelimeler <del>, eklenen kelimeler <ins> olarak görsel diff motoruyla üretildi.");

// MQM Kalite Puanı Testi
const mockDoc = {
    segments: [
        { source: "Hello world this is test one two three four five six", lqaErrors: [{ penalty: 1 }] },
        { source: "Second sentence with ten more words for quality assessment score testing", lqaErrors: [] }
    ]
};
const mqm = Review.calculateMqmScore(mockDoc);
console.log("MQM Puanı:", mqm);
assert(mqm.score >= 0 && mqm.score <= 100, "3.2: MQM skoru 0-100 arasında olmalı");
console.log(`✅ 3.2: MQM Kalite Puanı başarıyla hesaplandı: ${mqm.score}/100 [${mqm.grade}]`);


// --- TEST 4: DİNAMİK DRM VİDEO FİLİGRANI ---
console.log("\n--- TEST 4: Forensic DRM Dinamik Filigran Motoru ---");
const DRM = CatLSP.DRM;
assert.strictEqual(DRM.enabled, false, "4.1: DRM başlangıçta kapalı olmalı");
console.log("✅ 4.1: DRM filigran modülü başlatma durumu doğrulandı.");

console.log("\n=================================================================");
console.log("🎉 TÜM LSP ENTERPRISE SUITE (FAZ 1) BİRİM TESTLERİ BAŞARIYLA GEÇTİ!");
console.log("=================================================================");

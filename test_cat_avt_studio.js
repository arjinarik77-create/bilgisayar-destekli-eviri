/**
 * Arik Studio CAT Tool - Faz 2 Birim Testleri (Unit Tests)
 * --------------------------------------------------------
 * Test Edilen Bilesenler:
 * 1. CatAVT.Waveform (Zamanlama, Donusum, Mıknatıslanma/Snapping, Zincirleme/Chaining)
 * 2. CatAVT.SmartLineBreak (Piramit Kurali & Dilbilgisi Kurallari ile 42 CPL Bolucu)
 * 3. CatAVT.Placement ({\an8} Ekran Konumlandirma)
 * 4. CatAVT.Export (Netflix TTML IMSC 1.1 & ASS/SSA Cikti Motoru)
 * 5. CatLSP.TBX (TBX-Basic ISO 30042 XML Disa/Ice Aktarim)
 * 6. CatLSP.Package (.catpkg Isbirligi Paketi Paketleme & Geri Yukleme)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock Browser Environment
const globalMock = {
    document: {
        getElementById: (id) => null,
        createElement: (tag) => ({
            style: {},
            setAttribute: () => {},
            querySelectorAll: () => [],
            appendChild: () => {},
            removeChild: () => {},
            click: () => {}
        }),
        body: {
            appendChild: () => {},
            removeChild: () => {}
        },
        activeElement: null,
        addEventListener: () => {}
    },
    appState: {
        activeSubtitleSegmentId: 1,
        activeDocId: 'doc-test-1',
        projects: [],
        translationMemory: [],
        glossary: [
            { id: 'g-1', source: 'Artificial Intelligence', target: 'Yapay Zeka', cat: 'Bilgisayar' },
            { id: 'g-2', source: 'Subtitling', target: 'Altyazı', cat: 'Medya' }
        ],
        userRole: 'L1'
    },
    getActiveDoc: () => ({
        id: 'doc-test-1',
        name: 'Demo_Video.srt',
        originalFormat: 'srt',
        segments: [
            { id: 1, source: 'Hello world, this is a subtitle line.', target: 'Merhaba dunya, bu altyazi cumlesidir.', startTime: '00:00:01,000', endTime: '00:00:04,500', durationSec: 3.5, status: 'translated' },
            { id: 2, source: 'Contiguous next sentence here.', target: 'Burada bitisik ikinci cumle yer aliyor.', startTime: '00:00:05,000', endTime: '00:00:08,000', durationSec: 3.0, status: 'translated' }
        ]
    }),
    getActiveProject: () => ({
        id: 'proj-1',
        title: 'AVT Test Projesi',
        sourceLang: 'en',
        targetLang: 'tr',
        type: 'subtitling'
    }),
    showToast: (m) => {},
    renderSegments: () => {}
};

// Bind window to global so browser IIFEs (function(global){...})(window) map 100%
global.window = global;
global.document = globalMock.document;
global.appState = globalMock.appState;
global.getActiveDoc = globalMock.getActiveDoc;
global.getActiveProject = globalMock.getActiveProject;
global.showToast = globalMock.showToast;
global.renderSegments = globalMock.renderSegments;
global.Blob = class Blob {
    constructor(chunks, options) {
        this.content = chunks.join('');
        this.type = options && options.type;
    }
};
global.URL = {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {}
};

// DOMParser mock for TBX tests
global.DOMParser = class DOMParser {
    parseFromString(xmlString, mime) {
        return {
            querySelectorAll: (tag) => {
                if (tag === 'termEntry') {
                    const entries = [];
                    const matches = xmlString.match(/<termEntry[^>]*>([\s\S]*?)<\/termEntry>/g) || [];
                    matches.forEach(m => {
                        entries.push({
                            querySelector: (sel) => {
                                if (sel === 'descrip') {
                                    const d = m.match(/<descrip[^>]*>(.*?)<\/descrip>/);
                                    return d ? { textContent: d[1] } : null;
                                }
                                return null;
                            },
                            querySelectorAll: (sel) => {
                                if (sel === 'langSet') {
                                    const lsets = [];
                                    const lMatches = m.match(/<langSet[^>]*>([\s\S]*?)<\/langSet>/g) || [];
                                    lMatches.forEach(lm => {
                                        lsets.push({
                                            querySelector: (sub) => {
                                                if (sub === 'term') {
                                                    const t = lm.match(/<term>(.*?)<\/term>/);
                                                    return t ? { textContent: t[1] } : null;
                                                }
                                                return null;
                                            }
                                        });
                                    });
                                    return lsets;
                                }
                                return [];
                            }
                        });
                    });
                    return entries;
                }
                return [];
            }
        };
    }
};

// Load Phase 2 module files
const avtPath = path.join(__dirname, 'vendor', 'cat_avt_studio.js');
const lspPath = path.join(__dirname, 'vendor', 'cat_lsp_modules.js');

const avtCode = fs.readFileSync(avtPath, 'utf8');
const lspCode = fs.readFileSync(lspPath, 'utf8');

// Evaluate in global context
eval(lspCode);
eval(avtCode);

const CatAVT = global.CatAVT || global.window.CatAVT;
const CatLSP = global.CatLSP || global.window.CatLSP;

console.log('====================================================');
console.log('🧪 FAZ 2 BİRİM TESTLERİ (AVT STÜDYOSU & İŞBİRLİĞİ PAKETİ)');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [GEÇTİ] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [BAŞARISIZ] ${name}`);
        console.error('   Hata:', err.message);
    }
}

// ----------------------------------------------------
// TEST 1: Waveform Zamanlama, Zoom ve Mıknatıslanma (Snapping)
// ----------------------------------------------------
runTest('CatAVT.Waveform: Zaman <-> Piksel Dönüşümleri', () => {
    CatAVT.Waveform.pixelsPerSecond = 80;
    const x = CatAVT.Waveform.timeToX(2.5);
    assert.strictEqual(x, 200, '2.5s @ 80px/s => 200px olmalı');

    const t = CatAVT.Waveform.xToTime(200);
    assert.strictEqual(t, 2.5, '200px @ 80px/s => 2.5s olmalı');
});

runTest('CatAVT.Waveform: Sahne Değişimi ve Cue Kenarına Mıknatıslanma (Snapping)', () => {
    CatAVT.Waveform.snappingEnabled = true;
    CatAVT.Waveform.shotChanges = [10.0, 25.5];
    CatAVT.Waveform.snapThresholdSec = 0.15; // 150ms eşik

    // 10.05 sn'deki bir imleç 10.0'a yapışmalı (fark 0.05s <= 0.15s)
    const snappedToShot = CatAVT.Waveform.applySnapping(10.05);
    assert.strictEqual(snappedToShot, 10.0, 'Sahne kesimine (10.0) mıknatıslanmalı');

    // 12.0 sn'deki bir imleç yakında sahne olmadığı için değişmemeli
    const untouched = CatAVT.Waveform.applySnapping(12.0);
    assert.strictEqual(untouched, 12.0, 'Mıknatıslanma menzili dışındaki değer değişmemeli');
});

runTest('CatAVT.Waveform: Altyazı Zincirleme (Chain Subtitles - Netflix 2 Frame Gap)', () => {
    const testDoc = {
        segments: [
            { id: 1, startTime: '00:00:01,000', endTime: '00:00:03,500', durationSec: 2.5 },
            { id: 2, startTime: '00:00:04,000', endTime: '00:00:06,000', durationSec: 2.0 }
        ]
    };
    global.getActiveDoc = () => testDoc;

    CatAVT.Waveform.chainSubtitles();
    // Segment 2 00:00:04,000'de başlıyor. 2 kare = 0.08s.
    // Segment 1 bitişi 00:00:03,920 olmalı (4.0 - 0.08 = 3.92s).
    const s1End = testDoc.segments[0].endTime;
    assert.ok(s1End.includes('03,920') || s1End.includes('03.92'), `Zincirleme bitişi ~3.92 olmalı, alınan: ${s1End}`);
});

// ----------------------------------------------------
// TEST 2: Akıllı Satır Bölücü (Pyramid Rule & Grammar Scoring)
// ----------------------------------------------------
runTest('CatAVT.SmartLineBreak: 42 Karakter Sınırı ve Piramit Kuralı (Alt Satır Uzun/Dengeli)', () => {
    const text = 'Bu bir altyazı cümlesidir ve piramit kuralına göre bölünmelidir.';
    const broken = CatAVT.SmartLineBreak.breakSubtitle(text, 42);

    assert.ok(broken.includes('\n'), 'Metin satır sonu ile 2 parçaya bölünmeli');
    const lines = broken.split('\n');
    assert.strictEqual(lines.length, 2, 'Tam olarak 2 satır olmalı');
    assert.ok(lines[0].length <= 42, `1. Satır <= 42 CPL olmalı (${lines[0].length})`);
    assert.ok(lines[1].length <= 42, `2. Satır <= 42 CPL olmalı (${lines[1].length})`);

    // Piramit kuralı: 2. satır 1. satırdan uzun veya dengeli olmalı
    assert.ok(lines[1].length >= lines[0].length - 12, 'Piramit kuralına göre alt satır orantılı olmalı');
});

runTest('CatAVT.SmartLineBreak: Yapışkan Bağlaçlardan Hemen Sonra Bölmeyi Engelleme', () => {
    const text = 'Yapay zeka modelleri ile derin öğrenme teknikleri hızla gelişiyor.';
    const broken = CatAVT.SmartLineBreak.breakSubtitle(text, 42);
    const lines = broken.split('\n');
    // "ile" kelimesi 1. satırın son kelimesi olmamalı
    const lastWord1 = lines[0].trim().split(/\s+/).pop().toLowerCase();
    assert.notStrictEqual(lastWord1, 'ile', '"ile" bağlacı satır sonunda tek başına bırakılmamalı');
});

// ----------------------------------------------------
// TEST 3: Ekran Konumlandırma ({\an8} Top/Bottom)
// ----------------------------------------------------
runTest('CatAVT.Placement: {\\an8} Üst ve Alt Konum Değişimi', () => {
    const doc = globalMock.getActiveDoc();
    global.getActiveDoc = () => doc;

    const seg = doc.segments[0];
    assert.strictEqual(seg.placement, undefined);

    // Toggle 1: top olmalı
    CatAVT.Placement.togglePlacement(seg.id);
    assert.strictEqual(seg.placement, 'top', 'İlk toggle sonrası placement="top" olmalı');

    // Toggle 2: bottom olmalı
    CatAVT.Placement.togglePlacement(seg.id);
    assert.strictEqual(seg.placement, 'bottom', 'İkinci toggle sonrası placement="bottom" olmalı');
});

// ----------------------------------------------------
// TEST 4: Yayıncılık Formatları (Netflix TTML & ASS/SSA)
// ----------------------------------------------------
runTest('CatAVT.Export: Netflix TTML (IMSC 1.1 / DFXP XML) Üretimi', () => {
    const doc = globalMock.getActiveDoc();
    doc.segments[0].placement = 'top';

    const ttml = CatAVT.Export.generateTtml(doc);
    assert.ok(ttml.includes('xmlns="http://www.w3.org/ns/ttml"'), 'TTML kök isim uzayı bulunmalı');
    assert.ok(ttml.includes('xml:lang="tr"'), 'Hedef dil tr olmalı');
    assert.ok(ttml.includes('<region xml:id="topRegion"'), 'Üst bölge stili tanımlı olmalı');
    assert.ok(ttml.includes('<region xml:id="bottomRegion"'), 'Alt bölge stili tanımlı olmalı');
    assert.ok(ttml.includes('region="topRegion"'), 'Segment 1 topRegion bölgesine yönlendirilmeli');
    assert.ok(ttml.includes('begin="00:00:01.000"'), 'Başlangıç zaman formatı doğru olmalı');
});

runTest('CatAVT.Export: ASS/SSA (Advanced SubStation Alpha) Üretimi', () => {
    const doc = globalMock.getActiveDoc();
    doc.segments[0].placement = 'top';

    const ass = CatAVT.Export.generateAss(doc);
    assert.ok(ass.includes('[Script Info]'), 'ASS Script Info başlığı bulunmalı');
    assert.ok(ass.includes('[V4+ Styles]'), 'V4+ Styles bölümü bulunmalı');
    assert.ok(ass.includes('[Events]'), 'Events bölümü bulunmalı');
    assert.ok(ass.includes('Dialogue:'), 'Dialogue satırı üretilmeli');
    assert.ok(ass.includes('{\\an8}'), 'Üst konumlandırma {\\an8} etiketi dialogue metnine eklenmeli');
});

// ----------------------------------------------------
// TEST 5: TBX-Basic (ISO 30042 XML) İçe ve Dışa Aktarımı
// ----------------------------------------------------
runTest('CatLSP.TBX: TBX-Basic XML İçe Aktarma (Import)', () => {
    const sampleTbx = `<?xml version="1.0" encoding="UTF-8"?>
<martif type="TBX-Basic" xml:lang="tr">
  <text>
    <body>
      <termEntry id="term_101">
        <descrip type="subjectField">Hukuk</descrip>
        <langSet xml:lang="en">
          <tig><term>Power of Attorney</term></tig>
        </langSet>
        <langSet xml:lang="tr">
          <tig><term>Vekaletname</term></tig>
        </langSet>
      </termEntry>
    </body>
  </text>
</martif>`;

    const success = CatLSP.TBX.importTbxText(sampleTbx);
    assert.strictEqual(success, true, 'TBX içe aktarma başarılı olmalı');

    const added = globalMock.appState.glossary.find(g => g.source === 'Power of Attorney');
    assert.ok(added, 'İçe aktarılan terim sözlükte bulunmalı');
    assert.strictEqual(added.target, 'Vekaletname', 'Hedef terim doğru eşleşmeli');
    assert.strictEqual(added.cat, 'Hukuk', 'Kategori/not doğru aktarılmalı');
});

// ----------------------------------------------------
// TEST 6: Çeviri Bürosu İşbirliği Paketi (.catpkg)
// ----------------------------------------------------
runTest('CatLSP.Package: .catpkg Proje Paketi İçe Aktarma ve Geri Yükleme', () => {
    const samplePkg = JSON.stringify({
        catpkg_version: '2.0-enterprise',
        exported_at: new Date().toISOString(),
        user_role: 'L2',
        project: {
            id: 'proj-pkg-99',
            title: 'Kurumsal Finans Raporu Çevirisi',
            sourceLang: 'en',
            targetLang: 'tr',
            type: 'text',
            documents: [{
                id: 'doc-pkg-1',
                name: 'Faaliyet_Raporu.docx',
                segments: [
                    { id: 1, source: 'Financial statements are attached.', target: 'Mali tablolar ektedir.', status: 'reviewed', original_target: 'Mali tablolar ilişiktedir.' }
                ]
            }]
        },
        translationMemory: [
            { id: 'tm-pkg-1', source: 'Financial statements', target: 'Mali tablolar' }
        ],
        glossary: [
            { id: 'g-pkg-1', source: 'Balance sheet', target: 'Bilanço', cat: 'Muhasebe' }
        ]
    });

    const success = CatLSP.Package.importPackageText(samplePkg);
    assert.strictEqual(success, true, 'Paket içe aktarımı başarılı olmalı');

    // Aktif projenin geri yüklendiğini doğrula
    const restoredProj = globalMock.appState.projects.find(p => p.id === 'proj-pkg-99');
    assert.ok(restoredProj, 'Proje appState.projects listesine eklenmeli');
    assert.strictEqual(restoredProj.title, 'Kurumsal Finans Raporu Çevirisi');

    // L2 Track changes ve durumların korunduğunu doğrula
    const seg1 = restoredProj.documents[0].segments[0];
    assert.strictEqual(seg1.status, 'reviewed');
    assert.strictEqual(seg1.original_target, 'Mali tablolar ilişiktedir.');

    // TM ve Sözlük birleşimini doğrula
    const restoredTm = globalMock.appState.translationMemory.find(t => t.id === 'tm-pkg-1');
    assert.ok(restoredTm, 'Paketteki TM verisi içeri aktarılmış olmalı');
    const restoredGl = globalMock.appState.glossary.find(g => g.id === 'g-pkg-1');
    assert.ok(restoredGl, 'Paketteki Sözlük terimi içeri aktarılmış olmalı');
});

console.log('\n----------------------------------------------------');
console.log(`📊 TEST SONUÇLARI: ${passedTests} / ${totalTests} TEST GEÇTİ (%${Math.round((passedTests/totalTests)*100)})`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
    console.log('🚀 TÜM FAZ 2 MODÜLLERİ VE ENTEGRASYONLAR EKSİKSİZ ÇALIŞIYOR!');
    process.exit(0);
} else {
    console.error('⚠️ Bazı testler başarısız oldu!');
    process.exit(1);
}

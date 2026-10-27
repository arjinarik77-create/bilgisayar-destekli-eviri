const fs = require('fs');

// index.html içindeki fonksiyonları test ortamına çekelim
const content = fs.readFileSync('index.html', 'utf8');

// Basit test ortamı
global.normalizeString = function(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[\s\p{P}]+/gu, ' ').trim();
};

global.hashContextText = function(str) {
    if (!str) return '';
    const norm = global.normalizeString(str);
    if (!norm) return '';
    let hash = 0;
    for (let i = 0; i < norm.length; i++) {
        hash = ((hash << 5) - hash) + norm.charCodeAt(i);
        hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
};

global.calculateSimilarity = function(str1, str2) {
    return 82; // Mock
};

const s1 = "Cihazı prize takın ve güç kablosunu kontrol edin.";
const s2 = "Açma düğmesine 3 saniye basılı tutun.";
const s3 = "Mavi LED göstergesi yandığında kurulum tamamlanır.";
const s4 = "Güvenlik talimatlarını ve uyarıları dikkatle okuyun.";
const s5 = "Sistem güncellemeleri otomatik olarak arka planda yüklenecektir.";

const doc = {
    segments: [
        { id: 1, source: s1 },
        { id: 2, source: s2 },
        { id: 3, source: s3 },
        { id: 4, source: s4 },
        { id: 5, source: s5 }
    ]
};
global.getActiveDoc = () => doc;

const pId = 'proj-tm-demo';
const appState = {
    activeProjectId: pId,
    translationMemory: [
        {
            id: 'tm-demo-1',
            projectId: pId,
            source: s1,
            sourceNorm: global.normalizeString(s1),
            target: "Plug the device into the outlet and inspect the power cord.",
            prevSourceHash: "",
            nextSourceHash: global.hashContextText(s2)
        },
        {
            id: 'tm-demo-2',
            projectId: pId,
            source: s2,
            sourceNorm: global.normalizeString(s2),
            target: "Press and hold the power button for 3 seconds.",
            prevSourceHash: global.hashContextText(s1),
            nextSourceHash: global.hashContextText(s3)
        },
        {
            id: 'tm-demo-3',
            projectId: pId,
            source: s3,
            sourceNorm: global.normalizeString(s3),
            target: "Setup is complete when the blue LED indicator lights up.",
            prevSourceHash: global.hashContextText(s2),
            nextSourceHash: global.hashContextText("Farklı bir sonraki cümle.")
        },
        {
            id: 'tm-demo-4',
            projectId: pId,
            source: s4,
            sourceNorm: global.normalizeString(s4),
            target: "Read safety instructions and operational warnings carefully.",
            prevSourceHash: global.hashContextText("Bambaşka bir önceki cümle."),
            nextSourceHash: global.hashContextText("Bambaşka bir sonraki cümle.")
        },
        {
            id: 'tm-demo-5',
            projectId: pId,
            source: "Sistem güncellemeleri arka planda yüklenecektir.",
            sourceNorm: global.normalizeString("Sistem güncellemeleri arka planda yüklenecektir."),
            target: "System updates will be installed in the background."
        }
    ]
};
global.appState = appState;

// findBestTmMatch implementation
function findBestTmMatch(sourceText, currentSegId = null) {
    if (!sourceText || appState.translationMemory.length === 0) return null;
    const normSource = global.normalizeString(sourceText);

    let prevSource = '';
    let nextSource = '';
    const d = global.getActiveDoc();
    if (d && d.segments && currentSegId) {
        const sIdx = d.segments.findIndex(s => s.id === currentSegId);
        if (sIdx !== -1) {
            if (sIdx > 0) prevSource = d.segments[sIdx - 1].source;
            if (sIdx < d.segments.length - 1) nextSource = d.segments[sIdx + 1].source;
        }
    }
    const curPrevHash = global.hashContextText(prevSource);
    const curNextHash = global.hashContextText(nextSource);

    for (const entry of appState.translationMemory) {
        const normEntry = entry.sourceNorm || global.normalizeString(entry.source);
        if (normSource === normEntry) {
            const prevMatches = Boolean(entry.prevSourceHash && curPrevHash && entry.prevSourceHash === curPrevHash);
            const nextMatches = Boolean(entry.nextSourceHash && curNextHash && entry.nextSourceHash === curNextHash);

            if (prevMatches && nextMatches) {
                return { similarity: 102, label: '%102 ICE Match (Double Context)' };
            }
            if (prevMatches || nextMatches) {
                return { similarity: 101, label: '%101 ICE Match (Single Context)' };
            }
            return { similarity: 100, label: '%100 Exact Match' };
        }
    }

    return { similarity: 82, label: '%82 Fuzzy Match' };
}

console.log("Segment 2 (Açma düğmesi...):", findBestTmMatch(s2, 2));
console.log("Segment 3 (Mavi LED...):", findBestTmMatch(s3, 3));
console.log("Segment 4 (Güvenlik talimatları...):", findBestTmMatch(s4, 4));
console.log("Segment 5 (Sistem güncellemeleri...):", findBestTmMatch(s5, 5));

const assert = require('assert');

// Simulate mergeSegments logic
function mergeSegments(doc, segIdA, segIdB) {
    if (!doc || !doc.segments || doc.segments.length < 2) return false;

    let idxA = doc.segments.findIndex(s => s.id === segIdA);
    if (idxA === -1) idxA = 0;

    let idxB = (typeof segIdB === 'number') ? doc.segments.findIndex(s => s.id === segIdB) : (idxA + 1);
    if (idxB === -1 || idxB === idxA) idxB = idxA + 1;

    if (idxA > idxB) { const t = idxA; idxA = idxB; idxB = t; }
    if (idxB >= doc.segments.length) return false;

    const a = doc.segments[idxA];
    const b = doc.segments[idxB];

    const aSrc = (a.source || '').trim();
    const bSrc = (b.source || '').trim();
    a.source = aSrc ? (bSrc ? `${aSrc} ${bSrc}` : aSrc) : bSrc;
    a.sourceText = a.source;

    const aTgt = (a.target || '').trim();
    const bTgt = (b.target || '').trim();
    a.target = aTgt ? (bTgt ? `${aTgt} ${bTgt}` : aTgt) : bTgt;
    a.targetText = a.target;

    if (b.end !== undefined || b.endTime) {
        a.end = b.end;
        a.endTime = b.endTime;
        a.durationSec = Number((b.end - a.start).toFixed(2));
    }

    doc.segments.splice(idxB, 1);
    return true;
}

// TEST 1: Subtitle segments merge
const testDoc = {
    segments: [
        { id: 1, source: 'Hello world,', target: 'Merhaba dünya,', start: 1.0, end: 2.5, startTime: '00:00:01,000', endTime: '00:00:02,500' },
        { id: 2, source: 'how are you today?', target: 'bugün nasılsın?', start: 2.7, end: 5.0, startTime: '00:00:02,700', endTime: '00:00:05,000' },
        { id: 3, source: 'I am doing well.', target: 'İyiyim.', start: 5.2, end: 7.0, startTime: '00:00:05,200', endTime: '00:00:07,000' }
    ]
};

const res = mergeSegments(testDoc, 1, 2);
assert.strictEqual(res, true, 'Merge succeeded');
assert.strictEqual(testDoc.segments.length, 2, 'Segments count reduced to 2');
assert.strictEqual(testDoc.segments[0].source, 'Hello world, how are you today?', 'Sources merged');
assert.strictEqual(testDoc.segments[0].target, 'Merhaba dünya, bugün nasılsın?', 'Targets merged');
assert.strictEqual(testDoc.segments[0].start, 1.0, 'Start time preserved from first segment');
assert.strictEqual(testDoc.segments[0].end, 5.0, 'End time extended to second segment');
assert.strictEqual(testDoc.segments[0].endTime, '00:00:05,000', 'endTime matches second segment');
assert.strictEqual(testDoc.segments[0].durationSec, 4.0, 'Duration is 5.0 - 1.0 = 4.0s');

console.log('✅ Unit test for mergeSegments passed 100%!');

const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const keywords = [
    'calculateSubtitleMetrics',
    'updateCinemaSubtitleMonitor',
    'enterSubtitlingMode',
    'stopStreamingTranscription',
    'handleSubVideo',
    'nudgeSegmentTime',
    'updateSegmentTimestamp',
    'setTimestampFromCurrentVideo',
    'applySubtitleStyles',
    'exportSubtitle',
    'switchInterpretingTab',
    'handleConcordanceSearch',
    'renderInterpretingCards',
    'renderFlashcards',
    'speakTerm'
];

console.log('Searching for AVT and Interpreting functions:');
keywords.forEach(kw => {
    lines.forEach((l, i) => {
        if (l.includes('function ' + kw) || l.includes(kw + ' =') || l.includes('const ' + kw) || l.includes('let ' + kw)) {
            console.log(`Found ${kw} at line ${i+1}: ${l.trim()}`);
        }
    });
});

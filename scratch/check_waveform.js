const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log('has bottomWaveformContainer:', html.includes('id="bottomWaveformContainer"'));
console.log('has bottomWaveformCanvas:', html.includes('id="bottomWaveformCanvas"'));

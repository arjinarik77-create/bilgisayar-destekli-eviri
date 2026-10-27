const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const idx = content.indexOf('function startStreamingVideoTranscription');
console.log(content.substring(idx + 2500, idx + 5000));

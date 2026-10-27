const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const wbIdx = content.indexOf('id="subtitlingWorkbench"');
console.log("Context around subtitlingWorkbench:");
console.log(content.substring(wbIdx - 200, wbIdx + 1500));

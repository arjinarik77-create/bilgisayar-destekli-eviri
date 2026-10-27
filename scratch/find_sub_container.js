const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const idx = content.indexOf('Video & Altyazı Senkronizasyonu');
console.log(content.substring(idx - 600, idx + 200));

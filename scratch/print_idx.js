const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const idx = content.indexOf('Video & Altyazı Senkronizasyonu');
console.log("idx is:", idx);
console.log(content.substring(idx - 300, idx + 100));

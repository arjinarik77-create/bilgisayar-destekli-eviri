const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const sIdx = h.indexOf('id="subVideoPanel"');
const closeIdx = h.indexOf('<!-- SÖZLÜ ÇEVİRİ İKİ DİLLİ', sIdx);
console.log(h.substring(sIdx, closeIdx));

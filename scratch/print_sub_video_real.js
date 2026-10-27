const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const sIdx = h.indexOf('id="subVideoPanel"');
const nextSection = h.indexOf('<!-- 2. GÖRÜNÜM: ÇEVİRİ BELLEĞİ', sIdx);
console.log(h.substring(sIdx, nextSection));

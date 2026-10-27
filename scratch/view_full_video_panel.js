const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('id="subVideoPanel"');
const endIdx = h.indexOf('<!-- İki Bölmeli', idx);
console.log(h.substring(idx, endIdx));

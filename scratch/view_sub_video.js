const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('id="subVideoPanel"');
console.log(h.substring(idx - 100, idx + 2500));

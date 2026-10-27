const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const sIdx = h.indexOf('id="subVideoPanel"');
console.log(h.substring(sIdx + 1200, sIdx + 4000));

const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');

const sIdx = h.indexOf('id="subVideoPanel"');
const eIdx = h.indexOf('<!-- İki Bölmeli', sIdx);
// Let's find closing div of subVideoPanel
const snippet = h.substring(sIdx - 50, sIdx + 3000);
console.log(snippet.substring(0, 2000));

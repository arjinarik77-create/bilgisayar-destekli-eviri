const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('id="section-projects"');
console.log(h.substring(idx - 400, idx + 200));

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('id="subtitlingWorkbench"');
console.log(html.substring(idx - 300, idx + 400));

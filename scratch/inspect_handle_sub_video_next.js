const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const idx = content.indexOf('function handleSubVideoUpload');
console.log(content.substring(idx + 1800, idx + 4000));

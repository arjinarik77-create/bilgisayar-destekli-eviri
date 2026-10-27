const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

console.log(content.substring(940300, 940633));

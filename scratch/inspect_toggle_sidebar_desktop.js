const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const idx = content.indexOf('function toggleSidebarDrawer');
console.log(content.substring(idx + 500, idx + 1500));

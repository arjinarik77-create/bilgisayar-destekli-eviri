const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const vpIdx = content.indexOf('id="subVideoPanel"');
console.log("Context around subVideoPanel:");
console.log(content.substring(vpIdx - 300, vpIdx + 800));

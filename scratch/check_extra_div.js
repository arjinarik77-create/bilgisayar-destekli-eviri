const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startIdx = html.indexOf('id="section-editor"');
const targetIdx = startIdx + 48029;

console.log('Snippet around 48029:');
console.log(html.substring(targetIdx - 300, targetIdx + 300));

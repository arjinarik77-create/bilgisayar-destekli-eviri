const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const headIdx = content.indexOf('<head>');
const headEnd = content.indexOf('</head>');
console.log(content.substring(headEnd - 600, headEnd));

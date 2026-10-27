const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

console.log("File size:", content.length);
console.log("Has </head>:", content.indexOf('</head>'));
console.log("Has </body>:", content.indexOf('</body>'));

const domContentLoadedMatches = [...content.matchAll(/DOMContentLoaded/g)].map(m => m.index);
console.log("DOMContentLoaded matches count:", domContentLoadedMatches.length);
domContentLoadedMatches.forEach(idx => {
    console.log("Context around DOMContentLoaded at", idx, ":");
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
});

// Check header bar
const headerMatch = content.indexOf('<header');
console.log("Header found at:", headerMatch);

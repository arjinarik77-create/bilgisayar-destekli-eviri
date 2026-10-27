const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const playerIdx = content.indexOf('id="subVideoPlayer"');
console.log("Context from 1500 chars before to 500 chars after subVideoPlayer:");
console.log(content.substring(playerIdx - 1500, playerIdx + 500));

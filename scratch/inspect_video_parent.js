const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf8');

const playerIdx = content.indexOf('id="subVideoPlayerArea"');
console.log(content.substring(playerIdx - 2000, playerIdx));

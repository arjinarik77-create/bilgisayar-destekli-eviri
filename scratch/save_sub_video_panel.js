const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const sIdx = h.indexOf('id="subVideoPanel"');
fs.writeFileSync('scratch/full_video_panel.html', h.substring(sIdx, sIdx + 7000), 'utf8');
console.log('Saved scratch/full_video_panel.html');

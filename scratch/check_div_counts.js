const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find section-editor
const sIdx = html.indexOf('id="section-editor"');
// Find section-tm
const tmIdx = html.indexOf('id="section-tm"');
// Find section-projects
const pIdx = html.indexOf('id="section-projects"');

console.log('section-editor to section-tm:');
const s_tm = html.substring(sIdx, tmIdx);
console.log('open divs:', (s_tm.match(/<div\b/g) || []).length);
console.log('close divs:', (s_tm.match(/<\/div>/g) || []).length);

console.log('section-tm to section-projects:');
const tm_p = html.substring(tmIdx, pIdx);
console.log('open divs:', (tm_p.match(/<div\b/g) || []).length);
console.log('close divs:', (tm_p.match(/<\/div>/g) || []).length);

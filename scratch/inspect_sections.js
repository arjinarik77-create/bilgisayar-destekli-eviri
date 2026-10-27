const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = html.match(/id="section-[^"]+"/g) || [];
console.log('Sections found:', matches);

// Also look for unclosed divs or structure of section-editor vs section-projects
const secEditorIdx = html.indexOf('id="section-editor"');
const secProjectsIdx = html.indexOf('id="section-projects"');
console.log('secEditorIdx:', secEditorIdx);
console.log('secProjectsIdx:', secProjectsIdx);

if (secEditorIdx !== -1 && secProjectsIdx !== -1) {
    const snippet = html.substring(secEditorIdx, secProjectsIdx);
    const openDivs = (snippet.match(/<div\b/g) || []).length;
    const closeDivs = (snippet.match(/<\/div>/g) || []).length;
    console.log(`Between section-editor and section-projects: open=${openDivs}, close=${closeDivs}`);
}

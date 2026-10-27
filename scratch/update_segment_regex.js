const fs = require('fs');

const files = ['index.html', 'legacy_index.html', 'index.html.bak'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    const oldSplitting = `clean = clean.replace(/([.?!]+)(?=[\\s\\n]+[A-Z0-9"“'«\\(\\[]|$)/g, (match, punct) => {
                return punct + '\\n---CAT_SEG_BREAK---\\n';
            });

            clean = clean.replace(/\\n{2,}/g, '\\n---CAT_SEG_BREAK---\\n');`;

    const newSplitting = `clean = clean.replace(/([.?!]+["”'»\\)\\]]*)(?=[\\s\\n]+[\\p{L}\\p{N}"“'«(\\[]|$)/gu, (match, punct) => {
                return punct + '\\n---CAT_SEG_BREAK---\\n';
            });

            clean = clean.replace(/\\n+/g, '\\n---CAT_SEG_BREAK---\\n');`;

    if (content.includes(oldSplitting)) {
        content = content.replace(oldSplitting, newSplitting);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ Updated segmentDocument in ${file}`);
    } else {
        console.log(`Old splitting not found directly in ${file}, checking regex...`);
        const reg = /clean = clean\.replace\(\/\(\[\.\?!\]\+\)\(\?=\[\\s\\n\]\+\[A-Z0-9"“'«\\(\\[\]\|\$\)\/g[\s\S]*?clean = clean\.replace\(\/\\n\{2,\}\/g, '\\n---CAT_SEG_BREAK---\\n'\);/;
        if (reg.test(content)) {
            content = content.replace(reg, newSplitting);
            fs.writeFileSync(file, content, 'utf8');
            console.log(`✅ Regex replaced segmentDocument in ${file}`);
        } else {
            console.warn(`Could not match segmentDocument in ${file}`);
        }
    }
});

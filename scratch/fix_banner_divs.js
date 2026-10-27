const fs = require('fs');

function cleanRemnant(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const remnantRegex = /<\/div>\s*<div class="flex items-center gap-2\.5">\s*<div class="w-24 bg-slate-800 rounded-full h-1\.5 overflow-hidden border border-slate-700">[\s\S]*?Durdur\s*<\/button>\s*<\/div>\s*<\/div>/;
    
    if (remnantRegex.test(content)) {
        content = content.replace(remnantRegex, '</div>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Cleaned remnant in ${filePath}`);
    } else {
        console.log(`No remnant in ${filePath}`);
    }
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(cleanRemnant);

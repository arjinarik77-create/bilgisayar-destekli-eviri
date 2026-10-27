const fs = require('fs');

function addMergeButton(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const splitBtnRegex = /(<button[^>]*onclick="splitSubtitleSegment\(\$\{seg\.id\}\)"[\s\S]*?<\/button>)/;
    const mergeBtn = `\n                                <button type="button" onclick="mergeSegments(\${seg.id})" class="px-2 py-0.5 text-[9.5px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-900 dark:text-indigo-200 border border-indigo-400 rounded transition-all flex items-center gap-1 cursor-pointer" title="Bu segmenti sonrakiyle birleştir (Kısayol: Ctrl + M / Ctrl + Shift + M / Ctrl + J)">\n                                    <span>🔗 Birleştir</span>\n                                </button>`;

    if (splitBtnRegex.test(content) && !content.includes('mergeSegments(${seg.id})')) {
        content = content.replace(splitBtnRegex, `$1${mergeBtn}`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added '🔗 Birleştir' button to ${filePath}`);
    } else {
        console.log(`Already has button or not matched: ${filePath}`);
    }
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(addMergeButton);

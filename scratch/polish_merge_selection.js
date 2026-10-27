const fs = require('fs');

function polishMergeSelection(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const cardRegex = /(const card = document\.createElement\('div'\);\s*card\.id = `segCard-\$\{seg\.id\}`;)\s*(card\.className = `cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 \$\{zebraBg\} hover:bg-blue-50\/30 dark:hover:bg-neutral-900\/70`;)/;

    const replacementCardCode = `$1
            const isPendingMerge = (typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId === seg.id);
            const mergeBorderClass = isPendingMerge ? 'ring-2 ring-blue-600 bg-blue-50/70 border-l-4 border-l-blue-600 shadow-md' : '';
            card.className = \`cat-segment-row relative flex flex-col transition-all border-b border-slate-300 dark:border-neutral-700 \${zebraBg} hover:bg-blue-50/30 dark:hover:bg-neutral-900/70 \${mergeBorderClass}\`;

            // 2. AŞAMA: Eğer 1. segment seçilmişse diğer karta tıklayınca iki cümleyi birleştir!
            if (typeof window._pendingMergeSegId !== 'undefined' && window._pendingMergeSegId && !isPendingMerge) {
                card.classList.add('cursor-pointer');
                card.title = "2. segment olarak birleştirmek için tıklayın";
                card.onclick = (e) => {
                    const isInput = e.target.closest('input, textarea');
                    if (!isInput && window._pendingMergeSegId) {
                        handleMergeButtonClick(seg.id, e);
                    }
                };
            }`;

    if (cardRegex.test(content)) {
        content = content.replace(cardRegex, replacementCardCode);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Applied card interactive merge click to ${filePath}`);
    } else {
        console.log(`cardRegex did not match for ${filePath}`);
    }
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(polishMergeSelection);

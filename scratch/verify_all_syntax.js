const fs = require('fs');
['legacy_index.html', 'index.html'].forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let blockIdx = 0;
    let hasError = false;
    while ((match = scriptRegex.exec(content)) !== null) {
        blockIdx++;
        const code = match[1];
        if (!code.trim()) continue;
        try {
            new Function(code);
            console.log(`${file} Block #${blockIdx}: OK (${code.length} chars)`);
        } catch (e) {
            hasError = true;
            console.error(`${file} Block #${blockIdx} ERROR:`, e.message);
        }
    }
    if (!hasError) console.log(`>>> ${file} has ZERO syntax errors!`);
});

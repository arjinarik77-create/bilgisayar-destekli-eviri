const fs = require('fs');

['legacy_index.html', 'index.html'].forEach(filename => {
    const content = fs.readFileSync(filename, 'utf8');
    const matches = [...content.matchAll(/unsplash/gi)].map(m => m.index);
    console.log(`[${filename}] Has unsplash matches:`, matches.length);
});

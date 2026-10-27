const fs = require('fs');

function search(query) {
    console.log(`Searching for: ${query}`);
    for (const f of fs.readdirSync('.', { withFileTypes: true })) {
        if (f.isFile() && (f.name.endsWith('.html') || f.name.endsWith('.js') || f.name.endsWith('.py') || f.name.endsWith('.bak'))) {
            const content = fs.readFileSync(f.name, 'utf8');
            const idx = content.indexOf(query);
            if (idx !== -1) {
                console.log(`  Found in ${f.name} at char ${idx}: ...${content.substring(Math.max(0, idx - 50), idx + 100).replace(/\n/g, ' ')}...`);
            }
        }
    }
}

search('orijinal');
search('Orijinal');
search('downloadTarget');
search('download');
search('export');

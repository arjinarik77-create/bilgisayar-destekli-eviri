const fs = require('fs');
// Check backups
console.log('Searching in backups...');
['scratch/index.html.original', 'scratch/index.html.backup', 'index.html.bak'].forEach(file => {
    if (fs.existsSync(file)) {
        const c = fs.readFileSync(file, 'utf8');
        const idx = c.indexOf('bottomWaveformContainer');
        console.log(`In ${file}, bottomWaveformContainer found at ${idx}`);
        if (idx !== -1) {
            console.log(c.substring(idx - 100, idx + 400));
        }
    }
});

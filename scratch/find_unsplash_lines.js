const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('unsplash') || (line.includes('img') && line.includes('avatar'))) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});

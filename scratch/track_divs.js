const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startIdx = html.indexOf('id="section-editor"');
const endIdx = html.indexOf('id="section-projects"');

const snippet = html.substring(startIdx, endIdx);

// Track div tags
const regex = /<\/?div\b[^>]*>/gi;
let match;
let depth = 0;
const events = [];

while ((match = regex.exec(snippet)) !== null) {
    const tag = match[0];
    const isClose = tag.startsWith('</');
    const isSelfClosing = tag.endsWith('/>');
    
    if (isClose) {
        depth--;
        events.push({ type: 'close', index: match.index, depth, tag });
        if (depth < 0) {
            console.log(`EXTRA CLOSING DIV at snippet index ${match.index}!`);
            console.log('Context around extra close:');
            console.log(snippet.substring(Math.max(0, match.index - 200), match.index + 200));
            break;
        }
    } else if (!isSelfClosing) {
        depth++;
        events.push({ type: 'open', index: match.index, depth, tag });
    }
}

console.log('Final depth at section-projects:', depth);

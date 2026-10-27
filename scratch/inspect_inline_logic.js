const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
while ((match = btnRegex.exec(html)) !== null) {
    const attrs = match[1];
    const onclickMatch = attrs.match(/onclick="([^"]*)"/i) || attrs.match(/onclick='([^']*)'/i);
    if (onclickMatch) {
        const oc = onclickMatch[1];
        if (oc.includes('if(') || oc.includes('if (') || oc.includes('.click(')) {
            console.log('Button:', match[2].replace(/<[^>]+>/g, '').trim().slice(0, 40));
            console.log('Onclick:', oc);
            console.log('---');
        }
    }
}

const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const matches = [...content.matchAll(/switchModule\(['"]([^'"]+)['"]\)/g)];
console.log("Modules:", [...new Set(matches.map(m => m[1]))]);

const ids = [...content.matchAll(/id=['"]([^'"]+)['"]/g)].map(m => m[1]);
console.log("IDs containing translator or linguist:", ids.filter(id => /trans|ling|user|profile/i.test(id)));

const scriptMatch = content.indexOf('<script>');
if (scriptMatch !== -1) {
    console.log("Has inline script at:", scriptMatch);
}

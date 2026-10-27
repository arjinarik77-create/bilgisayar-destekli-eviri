const fs = require('fs');

const raw = fs.readFileSync('cat_workspace_autosave.json', 'utf8');
const data = JSON.parse(raw);
console.log(JSON.stringify(data).slice(0, 2000));

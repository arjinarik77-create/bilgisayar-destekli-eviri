const fs = require('fs');

// Read block5.js
let b5 = fs.readFileSync('scratch/block5.js', 'utf8');
console.log('Original b5 length:', b5.length);

// Apply apply_merge_shortcut logic to b5
const applyMergeShortcut = require('./apply_merge_shortcut_func.js');
// Let's check what apply_merge_shortcut.js has

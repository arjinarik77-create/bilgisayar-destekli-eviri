const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('=== CAT TOOL BUTTON & SHORTCUT AUDIT ===');

// 1. Extract all buttons
const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
let count = 0;
let withOnclick = 0;
let withoutOnclick = 0;
const onclickExpressions = [];
const missingHandlers = [];

while ((match = btnRegex.exec(html)) !== null) {
    count++;
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim().slice(0, 30);
    const onclickMatch = attrs.match(/onclick="([^"]*)"/i) || attrs.match(/onclick='([^']*)'/i);
    const typeMatch = attrs.match(/type="([^"]*)"/i);
    const idMatch = attrs.match(/id="([^"]*)"/i);

    if (onclickMatch) {
        withOnclick++;
        onclickExpressions.push({
            id: idMatch ? idMatch[1] : null,
            text,
            onclick: onclickMatch[1]
        });
    } else {
        withoutOnclick++;
        // Check if it's a submit button in a form or has an ID
        missingHandlers.push({
            id: idMatch ? idMatch[1] : null,
            text,
            attrs: attrs.trim()
        });
    }
}

console.log(`Total <button> elements: ${count}`);
console.log(`With onclick: ${withOnclick}`);
console.log(`Without onclick: ${withoutOnclick}`);

// Check buttons without onclick: do they have event listeners or IDs?
console.log('\n--- Buttons without inline onclick: ---');
missingHandlers.forEach((b, idx) => {
    // Check if ID is queried in JS
    let hasListener = false;
    if (b.id) {
        const idRegex = new RegExp(`['"]${b.id}['"]`, 'g');
        hasListener = idRegex.test(html);
    }
    console.log(`${idx + 1}. ID: ${b.id || '(no id)'} | Text: "${b.text}" | Has JS reference? ${hasListener}`);
});

// Check all functions called in onclick
const funcNames = new Set();
onclickExpressions.forEach(item => {
    // Find function calls like `foo(...)` or `CatOps.bar(...)`
    const matches = item.onclick.match(/([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)?)\s*\(/g);
    if (matches) {
        matches.forEach(m => {
            const fn = m.replace('(', '').trim();
            funcNames.add(fn);
        });
    }
});

console.log(`\nDistinct functions called by buttons: ${funcNames.size}`);
const notFound = [];
funcNames.forEach(fn => {
    if (fn.includes('.')) {
        const [obj, method] = fn.split('.');
        // check if obj and method exist
        const regex = new RegExp(`\\b${obj}\\b[\\s\\S]*?\\b${method}\\b`, 'g');
        if (!regex.test(html)) {
            notFound.push(fn);
        }
    } else {
        const regex = new RegExp(`function\\s+${fn}\\b|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|var\\s+${fn}\\s*=|window\\.${fn}\\s*=`, 'g');
        if (!regex.test(html)) {
            notFound.push(fn);
        }
    }
});

if (notFound.length === 0) {
    console.log('✅ ALL button handler functions are defined in the codebase!');
} else {
    console.log('❌ Potential missing functions:', notFound);
}

const fs = require('fs');

console.log("=========================================");
console.log("VALIDATING ANAEKRAN.HTML");
console.log("=========================================");

const content = fs.readFileSync('anaekran.html', 'utf8');

// 1. Emoji Check
const strictEmoji = /\p{Extended_Pictographic}/u;
const chars = [...content];
const foundEmojis = [];
for (let c of chars) {
    if (strictEmoji.test(c)) foundEmojis.push(c);
}
console.log("1. Emoji count:", foundEmojis.length);
if (foundEmojis.length > 0) {
    console.error("FAIL: Emojis detected:", foundEmojis);
    process.exit(1);
} else {
    console.log("   -> PASS: 0 Emojis! 100% SVG Vector standard preserved.");
}

// 2. Light Theme Default Check
const hasDarkClass = /<html[^>]*class=["'][^"']*dark[^"']*["']/i.test(content);
console.log("2. HTML tag has dark class?:", hasDarkClass);
if (hasDarkClass) {
    console.error("FAIL: HTML tag has dark class, must default to light!");
    process.exit(1);
} else {
    console.log("   -> PASS: Light Mode is default!");
}

// 3. Admin Panel Check (Must NOT contain admin panel)
const hasAdminPanel = content.includes('adminTableBody') || content.includes('Yönetici Paneli');
console.log("3. Contains Admin Panel?:", hasAdminPanel);
if (hasAdminPanel) {
    console.error("FAIL: anaekran.html must NOT contain an Admin Panel!");
    process.exit(1);
} else {
    console.log("   -> PASS: Pure landing and onboarding page, no admin panel.");
}

// 4. Required Roles and Fields Check
const requiredRoles = ['translator', 'student', 'academic', 'agency'];
requiredRoles.forEach(r => {
    if (!content.includes(r)) {
        console.error("FAIL: Missing role definition:", r);
        process.exit(1);
    }
});
console.log("4. All 4 roles present in JS definitions: PASS!");

// 5. Check JS execution and syntax
const scriptContent = content.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
if (scriptContent) {
    try {
        new Function(scriptContent);
        console.log("5. Script syntax valid: PASS!");
    } catch (e) {
        console.error("FAIL: Script syntax error:", e);
        process.exit(1);
    }
}

console.log("=========================================");
console.log("ALL ANAEKRAN.HTML CHECKS PASSED!");
console.log("=========================================");

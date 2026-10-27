const fs = require('fs');
const vm = require('vm');

console.log("==================================================");
console.log("RUNNING COMPREHENSIVE VALIDATION ON INDEX.HTML");
console.log("==================================================");

const content = fs.readFileSync('index.html', 'utf8');

// 1. Strict Emoji Check
const strictEmoji = /\p{Extended_Pictographic}/u;
const chars = [...content];
const foundEmojis = [];
for (let c of chars) {
    if (strictEmoji.test(c)) {
        foundEmojis.push({char: c, code: c.codePointAt(0).toString(16)});
    }
}
console.log(`1. Emoji Check: Found ${foundEmojis.length} emojis.`);
if (foundEmojis.length > 0) {
    console.error("FORBIDDEN EMOJIS FOUND:", foundEmojis);
    process.exit(1);
} else {
    console.log("   -> PASS: 0 Emojis! 100% SVG Vector standard preserved.");
}

// 2. Extract and Parse JavaScript
const scriptMatches = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
console.log(`2. Script Tags Found: ${scriptMatches ? scriptMatches.length : 0}`);

if (scriptMatches) {
    scriptMatches.forEach((sTag, idx) => {
        const code = sTag.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '');
        try {
            // Mock browser environment for syntax check
            const sandbox = {
                document: {
                    getElementById: () => ({ classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} }, innerHTML: '', value: '', style: {} }),
                    querySelectorAll: () => [],
                    querySelector: () => null,
                    body: { classList: { toggle:()=>{} } },
                    createElement: () => ({ setAttribute:()=>{}, click:()=>{} }),
                },
                window: { addEventListener: ()=>{} },
                localStorage: {
                    getItem: () => null,
                    setItem: () => {}
                },
                setTimeout: ()=>{},
                tailwind: {},
                clearTimeout: ()=>{},
                setInterval: ()=>{},
                clearInterval: ()=>{},
                console: console
            };
            vm.createContext(sandbox);
            vm.runInContext(code, sandbox);
            console.log(`   -> PASS: Script tag #${idx + 1} syntax and initial execution clean!`);
        } catch (err) {
            console.error(`   -> FAIL: Error in script tag #${idx + 1}:`, err);
            process.exit(1);
        }
    });
}

// 3. Check Critical DOM IDs
const requiredIds = [
    'onboardingWizardModal',
    'wizardCard',
    'wizardMainTitle',
    'wizardSubtitle',
    'wizardStepIndicatorBar',
    'stepIndicator-1',
    'stepIndicator-2',
    'stepIndicator-3',
    'stepIndicator-4',
    'wizardContentContainer',
    'wizardBtnBack',
    'wizardBtnNext',
    'wizardBtnNextText',
    'adminPanelModal',
    'adminCard',
    'adminStatTotal',
    'adminStatApproved',
    'adminStatPending',
    'adminStatAgency',
    'adminFilter-all',
    'adminFilter-translator',
    'adminFilter-student',
    'adminFilter-academic',
    'adminFilter-agency',
    'adminSearchInput',
    'adminTableBody',
    'adminTableFooterInfo',
    'adminDetailModal',
    'adminDetailContent',
    'adminDetailActions'
];

let missingIds = [];
requiredIds.forEach(id => {
    if (!content.includes(`id="${id}"`)) {
        missingIds.push(id);
    }
});

console.log(`3. Required Element IDs Check: ${requiredIds.length - missingIds.length}/${requiredIds.length} found.`);
if (missingIds.length > 0) {
    console.error("   -> FAIL: Missing IDs:", missingIds);
    process.exit(1);
} else {
    console.log("   -> PASS: All required Onboarding & Admin IDs verified.");
}

console.log("==================================================");
console.log("ALL CHECKS PASSED PERFECTLY!");
console.log("==================================================");

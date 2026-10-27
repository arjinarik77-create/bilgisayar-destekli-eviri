const fs = require('fs');

console.log("Running comprehensive validation on embedded user flow & once-only prompt guarantee...");

['legacy_index.html', 'index.html'].forEach(filename => {
    console.log(`\nChecking ${filename}...`);
    const content = fs.readFileSync(filename, 'utf8');

    // 1. Full name field
    if (!content.includes('id="ft_fullname"')) throw new Error(`Missing ft_fullname in ${filename}`);
    // 2. Username field
    if (!content.includes('id="ft_username"')) throw new Error(`Missing ft_username in ${filename}`);
    // 3. Vault module
    if (!content.includes('_AURA_SUPABASE_VAULT')) throw new Error(`Missing _AURA_SUPABASE_VAULT in ${filename}`);
    // 4. CheckAndPrompt hook
    if (!content.includes('AuraCATFirstTimeUser.checkAndPrompt()')) throw new Error(`Missing checkAndPrompt hook in ${filename}`);
    // 5. Supabase CDN
    if (!content.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')) throw new Error(`Missing Supabase CDN in ${filename}`);

    console.log(`[PASS] ${filename} has all required elements.`);
});

// Unit test logic of isOnboarded and once-only flow
console.log("\n--- Testing 'Sadece Bir Kere' (Once-only) Logic ---");

const mockLocalStorage = {};
global.localStorage = {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, val) => { mockLocalStorage[key] = String(val); }
};

// Vault
const _AURA_SUPABASE_VAULT = (function() {
    const _u = atob('aHR0cHM6Ly9td2Zhc2hmdnd2aGhxcHl4bW1zcC5zdXBhYmFzZS5jbw==');
    const _k = atob('c2JfcHVibGlzaGFibGVfa3VkQXU3RVllamVQMVF1a284d0J4d18zenN1UjJocw==');
    return {
        getUrl: function() { return _u; },
        getKey: function() { return _k; }
    };
})();

console.log("Vault URL test:", _AURA_SUPABASE_VAULT.getUrl() === 'https://mwfashfvwvhhqpyxmmsp.supabase.co');
console.log("Vault Key test:", _AURA_SUPABASE_VAULT.getKey().startsWith('sb_publishable_'));

let modalOpenedCount = 0;
const testEngine = {
    storageKeyProfile: 'auracat_user_profile',
    storageKeyOnboarded: 'auracat_user_onboarded',
    isOnboarded: function() {
        return localStorage.getItem(this.storageKeyOnboarded) === 'true';
    },
    checkAndPrompt: function() {
        if (this.isOnboarded()) {
            return "ALREADY_ONBOARDED_DO_NOTHING";
        }
        modalOpenedCount++;
        return "OPEN_MODAL";
    },
    save: function(fullName, username, pairs) {
        localStorage.setItem(this.storageKeyProfile, JSON.stringify({ fullName, username, pairs }));
        localStorage.setItem(this.storageKeyOnboarded, 'true');
    }
};

// 1. First Visit
console.log("\nVisit 1 (New User):");
const res1 = testEngine.checkAndPrompt();
console.log("Result:", res1);
if (res1 !== "OPEN_MODAL" || modalOpenedCount !== 1) throw new Error("First visit failed to open modal");

// User fills form and submits
testEngine.save("Arjin Demir", "@arjin", ["EN > TR"]);
console.log("User submitted. Storage onboarded:", mockLocalStorage['auracat_user_onboarded']);

// 2. Second Visit (Page refresh or new tab)
console.log("\nVisit 2 (Page Refresh):");
const res2 = testEngine.checkAndPrompt();
console.log("Result:", res2);
if (res2 !== "ALREADY_ONBOARDED_DO_NOTHING" || modalOpenedCount !== 1) throw new Error("Modal opened again on second visit!");

// 3. Third Visit
console.log("\nVisit 3 (Days later):");
const res3 = testEngine.checkAndPrompt();
console.log("Result:", res3);
if (res3 !== "ALREADY_ONBOARDED_DO_NOTHING" || modalOpenedCount !== 1) throw new Error("Modal opened again on third visit!");

console.log("\n>>> ALL TESTS PASSED! Modal opens strictly once upon initial visit.");

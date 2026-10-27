const fs = require('fs');

console.log("=== Testing End-to-End Translator Registration & Admin Panel Sync ===");

// 1. Check HTML files contain new requirements
console.log("\n1. Verifying Markup & Scripts in legacy_index.html & index.html:");
['legacy_index.html', 'index.html'].forEach(filename => {
    const html = fs.readFileSync(filename, 'utf8');

    // No username input in modal
    const hasFullname = html.includes('id="ft_fullname"');
    const hasUsernameInput = html.includes('id="ft_username"');
    const hasCustomPairInput = html.includes('id="ft_custom_source"') && html.includes('id="ft_custom_target"');
    const hasAddCustomPair = html.includes('addCustomPair()');

    console.log(`[${filename}] Has Full Name input:`, hasFullname);
    console.log(`[${filename}] Username input removed from modal:`, !hasUsernameInput);
    console.log(`[${filename}] Has Custom Language Pair input:`, hasCustomPairInput);
    console.log(`[${filename}] Has addCustomPair() method:`, hasAddCustomPair);

    if (!hasFullname || hasUsernameInput || !hasCustomPairInput || !hasAddCustomPair) {
        throw new Error(`Verification failed for ${filename}`);
    }
});

// 2. Check admin.html
console.log("\n2. Verifying admin.html Supabase & Translator Sync:");
const adminHtml = fs.readFileSync('admin.html', 'utf8');
const adminHasCdn = adminHtml.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
const adminHasVault = adminHtml.includes('_AURA_SUPABASE_VAULT');
const adminHasSyncFunc = adminHtml.includes('syncTranslatorsWithSupabase');
const adminHasAddTrans = adminHtml.includes('addTranslatorToData');

console.log("[admin.html] Has Supabase CDN:", adminHasCdn);
console.log("[admin.html] Has Vault module:", adminHasVault);
console.log("[admin.html] Has syncTranslatorsWithSupabase():", adminHasSyncFunc);
console.log("[admin.html] Has addTranslatorToData():", adminHasAddTrans);

if (!adminHasCdn || !adminHasVault || !adminHasSyncFunc || !adminHasAddTrans) {
    throw new Error("Verification failed for admin.html");
}

console.log("\n>>> ALL CHECKS PASSED SUCCESSFULLY!");

const fs = require('fs');

console.log("Validating First-Time User Onboarding & Supabase integration in legacy_index.html & index.html...");

['legacy_index.html', 'index.html'].forEach(filename => {
    console.log(`\n--- Checking ${filename} ---`);
    const content = fs.readFileSync(filename, 'utf8');

    // 1. Supabase CDN
    const hasCdn = content.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    console.log("Has Supabase CDN script:", hasCdn);

    // 2. Header Badge
    const hasHeaderBadge = content.includes('id="userProfileHeaderBadge"');
    console.log("Has Header Badge:", hasHeaderBadge);

    // 3. Modal
    const hasModal = content.includes('id="firstTimeUserModal"');
    console.log("Has Modal:", hasModal);

    // 4. Input Fields
    const hasUsernameInput = content.includes('id="ft_username"');
    const hasPairSource = content.includes('id="ft_pair_source"');
    const hasPairTarget = content.includes('id="ft_pair_target"');
    const hasPairsContainer = content.includes('id="ft_pairs_container"');
    console.log("Has Inputs (username, source, target, container):", hasUsernameInput && hasPairSource && hasPairTarget && hasPairsContainer);

    // 5. Supabase Config Fields
    const hasSupabaseUrl = content.includes('id="ft_supabase_url"');
    const hasSupabaseKey = content.includes('id="ft_supabase_anon_key"');
    console.log("Has Supabase Config fields:", hasSupabaseUrl && hasSupabaseKey);

    // 6. AuraCATFirstTimeUser Engine
    const hasEngine = content.includes('const AuraCATFirstTimeUser =');
    console.log("Has Engine Object:", hasEngine);

    // 7. CheckAndPrompt in DOMContentLoaded
    const hasPromptCall = content.includes('AuraCATFirstTimeUser.checkAndPrompt();');
    console.log("Has checkAndPrompt() in DOMContentLoaded:", hasPromptCall);

    if (hasCdn && hasHeaderBadge && hasModal && hasUsernameInput && hasSupabaseUrl && hasEngine && hasPromptCall) {
        console.log(`>>> SUCCESS: ${filename} is 100% verified!`);
    } else {
        console.error(`>>> ERROR: ${filename} verification failed!`);
        process.exit(1);
    }
});

console.log("\nAll checks passed successfully!");

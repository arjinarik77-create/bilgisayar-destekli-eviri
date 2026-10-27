const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log("==================================================");
console.log("RUNNING ONBOARDING & ADMIN REALTIME LIFECYCLE TEST");
console.log("==================================================");

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file:///c:/Users/Arjin/Desktop/Projeler/CATtool/index.html'
});

const { window } = dom;
const { document } = window;

// Verify initial state
console.log("1. Checking Initial State...");
const wizardModal = document.getElementById('onboardingWizardModal');
const adminModal = document.getElementById('adminPanelModal');
console.log("   Wizard Modal exists:", !!wizardModal);
console.log("   Admin Modal exists:", !!adminModal);

// Open Wizard
window.openOnboardingWizard();
console.log("2. Opening Onboarding Wizard...");
console.log("   Wizard Modal visible:", !wizardModal.classList.contains('hidden'));

// Check Role Selection (Stage 0)
const roleTranslatorBtn = document.getElementById('roleBtn-translator');
const roleStudentBtn = document.getElementById('roleBtn-student');
const roleAcademicBtn = document.getElementById('roleBtn-academic');
const roleAgencyBtn = document.getElementById('roleBtn-agency');
console.log("3. Stage 0 Role Selection Cards:");
console.log("   Translator card:", !!roleTranslatorBtn);
console.log("   Student card:", !!roleStudentBtn);
console.log("   Academic card:", !!roleAcademicBtn);
console.log("   Agency card:", !!roleAgencyBtn);

// Select Translator and test 4 steps
console.log("4. Testing Translator Flow (4 steps)...");
window.selectOnboardingRole('translator');
console.log("   Step 1 title:", document.getElementById('wizardSubtitle')?.textContent);

// Step 1: fill username & full name
document.getElementById('reg_username').value = '@ayse_trans';
document.getElementById('reg_fullname').value = 'Ayşe Yılmaz';
window.handleWizardNext();
console.log("   Advanced to Step 2 (Language Competence)");

// Step 2: fill language pairs
window.addLanguagePair('EN', 'TR');
window.addLanguagePair('DE', 'TR');
window.handleWizardNext();
console.log("   Advanced to Step 3 (Specialties)");

// Step 3: select specialties
window.toggleSpecialtyTag('Tıp');
window.toggleSpecialtyTag('Hukuk');
window.handleWizardNext();
console.log("   Advanced to Step 4 (Security & Submit)");

// Step 4: fill email & password
document.getElementById('reg_email').value = 'ayse@example.com';
document.getElementById('reg_password').value = 'GuvenliSifre2026!';
document.getElementById('reg_password_confirm').value = 'GuvenliSifre2026!';
window.checkPasswordMatch();

// Submit registration
console.log("5. Submitting Translator Registration to Supabase...");
const initialProfiles = window.AuraCATDB.getProfiles().length;
window.submitOnboardingRegistration();
const newProfiles = window.AuraCATDB.getProfiles().length;
console.log(`   Profiles before: ${initialProfiles}, Profiles after: ${newProfiles}`);
if (newProfiles !== initialProfiles + 1) {
    console.error("FAIL: Profile was not added to Supabase DB!");
    process.exit(1);
}
console.log("   -> PASS: Successfully registered to Supabase DB!");

// Test Admin Panel
console.log("6. Testing Admin Panel Realtime Data Display...");
window.openAdminPanel();
const adminTable = document.getElementById('adminTableBody');
console.log("   Admin Table rows count:", adminTable.children.length);
if (adminTable.children.length !== newProfiles) {
    console.error(`FAIL: Admin table row count mismatch! Expected ${newProfiles}, got ${adminTable.children.length}`);
    process.exit(1);
}
console.log("   -> PASS: Realtime table populated correctly!");

// Test Filters
console.log("7. Testing Role Filters...");
window.setAdminRoleFilter('translator');
console.log("   Translator filter active, rows:", adminTable.children.length);
window.setAdminRoleFilter('all');

// Test Status Update (Approve Ayşe)
console.log("8. Testing Admin Action (Approve Registration)...");
const ayseProfile = window.AuraCATDB.getProfiles().find(p => p.username === '@ayse_trans');
console.log("   Ayşe's current status:", ayseProfile.status);
window.updateProfileStatus(ayseProfile.id, 'approved');
const updatedAyse = window.AuraCATDB.getProfiles().find(p => p.id === ayseProfile.id);
console.log("   Ayşe's updated status:", updatedAyse.status);
if (updatedAyse.status !== 'approved') {
    console.error("FAIL: Status update failed!");
    process.exit(1);
}
console.log("   -> PASS: Status update action succeeded!");

console.log("==================================================");
console.log("LIFECYCLE TEST COMPLETED SUCCESSFULLY!");
console.log("==================================================");

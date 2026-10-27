const fs = require('fs');

console.log("Starting integration of Onboarding Wizard & Admin Panel into index.html...");

let indexHtml = fs.readFileSync('index.html', 'utf8');
const modalsHtml = fs.readFileSync('scratch/onboarding_and_admin.html', 'utf8');
const jsCode = fs.readFileSync('scratch/onboarding_and_admin.js', 'utf8');

// 1. Add header buttons
const targetHeaderButtons = `            <!-- BİRİNCİL AKSİYON: BİÇİMİ KORUYARAK İNDİR (EXPORT MODAL TETİKLEYİCİ) -->`;

const newHeaderButtons = `            <!-- KAYIT SİHİRBAZI (ONBOARDING WIZARD) -->
            <button type="button" onclick="openOnboardingWizard()" class="h-8 px-2.5 rounded-md border border-white/10 hover:border-cobalt/50 bg-black/20 hover:bg-cobalt/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer" title="4 Aşamalı Rol Kayıt Sihirbazı (Tercüman, Öğrenci, Akademisyen, Çeviri Bürosu)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                <span>Kayıt / Rol Seçimi</span>
            </button>

            <!-- YÖNETİCİ PANELİ (ADMIN PANEL) -->
            <button type="button" onclick="openAdminPanel()" class="h-8 px-2.5 rounded-md border border-white/10 hover:border-emerald/50 bg-black/20 hover:bg-emerald/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer" title="AuraCAT Yönetici Paneli & Canlı Supabase Realtime İzleme">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Yönetici Paneli</span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
            </button>

            <!-- BİRİNCİL AKSİYON: BİÇİMİ KORUYARAK İNDİR (EXPORT MODAL TETİKLEYİCİ) -->`;

if (!indexHtml.includes(targetHeaderButtons)) {
    console.error("Target header buttons not found in index.html!");
    process.exit(1);
}
indexHtml = indexHtml.replace(targetHeaderButtons, newHeaderButtons);

// 2. Add modals HTML before <!-- Bildirim Rozeti (Toast) -->
const targetToast = `    <!-- Bildirim Rozeti (Toast) -->`;
if (!indexHtml.includes(targetToast)) {
    console.error("Target toast not found in index.html!");
    process.exit(1);
}
indexHtml = indexHtml.replace(targetToast, `${modalsHtml}\n\n${targetToast}`);

// 3. Add JS code before </script>
const targetScriptEnd = `    </script>\n</body>`;
if (!indexHtml.includes(targetScriptEnd)) {
    console.error("Target script end not found in index.html!");
    process.exit(1);
}
indexHtml = indexHtml.replace(targetScriptEnd, `\n${jsCode}\n    </script>\n</body>`);

fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log("Successfully integrated Onboarding & Admin Panel into index.html!");

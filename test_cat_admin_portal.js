/**
 * Arik Studio CAT Tool - LSP Yonetim Portali & P2P Havuzu Birim Testleri
 * ---------------------------------------------------------------------
 * Test Edilen Bilesenler:
 * 1. Acik Tema (Light Mode) Glassmorphism Stili
 * 2. Sag Taraf Drawer (Cekmece) ve 8 Ana Yonetim Modulu
 * 3. Dinamik Modul Gecis Motoru (switchModule)
 * 4. Freelance Tercuman Havuzu ve Coklu Filtreleme
 * 5. P2P E2EE Dosya Aktarim & Zero-Knowledge Audit Log
 * 6. Destek Masasi Bilet Yonetimi
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🧪 LSP YÖNETİM PORTALI (AÇIK TEMA & 8 MODÜL) BİRİM TESTLERİ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [GEÇTİ] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [BAŞARISIZ] ${name}`);
        console.error('   Hata:', err.message);
    }
}

// admin.html içeriğini oku
const adminHtmlPath = path.join(__dirname, 'admin.html');
assert.ok(fs.existsSync(adminHtmlPath), 'admin.html dosyası mevcut olmalıdır');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// Test 1: Açık Tema (Light Theme) ve Glassmorphism Doğrulaması
runTest('Admin Portal: Açık Tema (Light Mode) & Glassmorphism Stili', () => {
    assert.ok(adminHtml.includes('class="light"'), 'HTML kök etiketi açık tema (class="light") olmalı');
    assert.ok(adminHtml.includes('rgba(255, 255, 255, 0.75)'), 'Açık tema yarı saydam buzlu cam (rgba(255,255,255,0.75)) stili tanımlı olmalı');
    assert.ok(adminHtml.includes('backdrop-filter: blur'), 'Buzlu cam backdrop-filter stili bulunmalı');
    assert.ok(adminHtml.includes('glass-card'), 'glass-card sınıfı tanımlı olmalı');
    assert.ok(!adminHtml.includes('class="dark"'), 'Karanlık tema kök etiketi (class="dark") kaldırılmış olmalı');
});

// Test 2: Sağ Taraf Drawer ve 8 Ana Modül Bağlantısı
runTest('Drawer Menü: 8 Ana Modül Linki ve Çekmece Mekanizması', () => {
    assert.ok(adminHtml.includes('id="adminSideDrawer"'), 'adminSideDrawer çekmece bileşeni bulunmalı');
    assert.ok(adminHtml.includes('id="adminDrawerBackdrop"'), 'Drawer karartma perdesi (backdrop) bulunmalı');

    const expectedModules = [
        { id: 'dashboard', label: '1. Ana Sayfa' },
        { id: 'finance', label: '2. Finans & Hakediş' },
        { id: 'university', label: '3. Üniversite Lisansları' },
        { id: 'translators', label: '4. Tercümanlar' },
        { id: 'accounts', label: '5. Kayıtlı Hesaplar' },
        { id: 'agencies', label: '6. Çeviri Büroları' },
        { id: 'transfers', label: '7. Aktarılan Metinler' },
        { id: 'support', label: '8. Destek Masası' }
    ];

    expectedModules.forEach(mod => {
        assert.ok(adminHtml.includes(`drawerNav-${mod.id}`), `Drawer içinde ${mod.label} navigasyon butonu bulunmalı`);
        assert.ok(adminHtml.includes(`module-${mod.id}`), `Ana alanda ${mod.label} içerik bölümü (module-${mod.id}) bulunmalı`);
    });
});

// Test 3: Dinamik Modül Değiştirme Motoru (switchModule)
runTest('Modül Yönlendirme: switchModule() Fonksiyonu ve Rozet Güncellemesi', () => {
    assert.ok(adminHtml.includes('function switchModule(modKey)'), 'switchModule fonksiyonu tanımlı olmalı');
    assert.ok(adminHtml.includes('currentModuleIcon') && adminHtml.includes('currentModuleLabel'), 'Aktif modül üst bar rozetleri bulunmalı');
    assert.ok(adminHtml.includes('MODULE_NAMES'), 'Modül adları ve ikonları sözlüğü tanımlı olmalı');
});

// Test 4: Tercüman Havuzu ve Filtreleme Mantığı
runTest('Translator Pool: Dil, Deneyim ve Uzmanlık Filtreleme Doğrulaması', () => {
    const match = adminHtml.match(/const TRANSLATORS_DATA = (\[[\s\S]*?\]);/);
    assert.ok(match, 'TRANSLATORS_DATA veri dizisi admin.html içinde bulunmalı');
    
    const translators = eval(match[1]);
    assert.ok(Array.isArray(translators), 'Tercümanlar dizi olmalı');
    assert.ok(translators.length >= 8, 'En az 8 tercüman tanımlı olmalı');

    translators.forEach(t => {
        assert.ok(t.id && t.name, 'Tercümanın ID ve Adı olmalı');
        assert.ok(Array.isArray(t.languages), 'Bildiği diller bir array olmalı');
        assert.ok(typeof t.experienceYears === 'number', 'Deneyim yılı sayı olmalı');
        assert.ok(t.specialization, 'Uzmanlık alanı olmalı');
    });

    // Filtreleme: Almanca bilenler
    const germanSpeakers = translators.filter(t => t.languages.includes('Almanca'));
    assert.ok(germanSpeakers.length >= 2, 'Almanca bilen en az 2 tercüman bulunmalı');

    // Filtreleme: 8+ yıl deneyim
    const seniorTranslators = translators.filter(t => t.experienceYears >= 8);
    assert.ok(seniorTranslators.length >= 3, '8+ yıl deneyimli en az 3 tercüman bulunmalı');
});

// Test 5: P2P Audit Log ve Zero-Knowledge E2EE Kayıt Yapısı
runTest('P2P Audit Log: E2EE Hash ve Metadata Kayıt Doğrulaması', () => {
    const match = adminHtml.match(/let AUDIT_LOGS = (\[[\s\S]*?\]);/);
    assert.ok(match, 'AUDIT_LOGS veri dizisi bulunmalı');
    const logs = eval(match[1]);

    assert.ok(Array.isArray(logs) && logs.length > 0, 'Audit log kayıtları bulunmalı');
    logs.forEach(log => {
        assert.ok(log.id.startsWith('P2P-'), 'ID P2P- ile başlamalı');
        assert.ok(log.sender && log.receiver, 'Gönderen ve Alıcı tanımlı olmalı');
        assert.ok(log.fileName.endsWith('.catpkg'), 'Dosya adı .catpkg ile bitmeli');
        assert.ok(log.hash.startsWith('sha256:'), 'E2EE Hash sha256: formatında olmalı');
    });
});

// Test 6: Destek Masası ve Üniversite Lisansları Modülleri
runTest('Destek Masası & Üniversite Lisansları Modül Verileri', () => {
    const match = adminHtml.match(/let SUPPORT_TICKETS = (\[[\s\S]*?\]);/);
    assert.ok(match, 'SUPPORT_TICKETS veri dizisi bulunmalı');
    const tickets = eval(match[1]);

    assert.ok(Array.isArray(tickets) && tickets.length >= 3, 'En az 3 destek bileti bulunmalı');
    assert.ok(adminHtml.includes('Boğaziçi Üniversitesi'), 'Üniversite lisansları arasında Boğaziçi bulunmalı');
    assert.ok(adminHtml.includes('Hacettepe Üniversitesi'), 'Üniversite lisansları arasında Hacettepe bulunmalı');
});

console.log('\n----------------------------------------------------');
console.log(`📊 TEST SONUÇLARI: ${passedTests} / ${totalTests} TEST GEÇTİ (%${Math.round((passedTests/totalTests)*100)})`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
    console.log('🚀 AÇIK TEMA GLASSMORPHISM VE 8 MODÜLLÜ YÖNETİM PORTALI EKSİKSİZ ÇALIŞIYOR!');
    process.exit(0);
} else {
    console.error('⚠️ Bazı testler başarısız oldu!');
    process.exit(1);
}

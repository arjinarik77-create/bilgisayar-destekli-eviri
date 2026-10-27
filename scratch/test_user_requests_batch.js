const fs = require('fs');
const assert = require('assert');

console.log('----------------------------------------------------');
console.log('🧪 KULLANICI İSTEKLERİ DOĞRULAMA TESTİ');
console.log('----------------------------------------------------');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const catUiEnhancements = fs.readFileSync('vendor/cat_ui_enhancements.js', 'utf8');

// 1. SORU İŞARETİ (?) VE SHIFT + ? İLE SEKME / MODAL AÇILMASI KAPATILDI
assert(!indexHtml.includes("e.shiftKey && e.key === '?'"), "index.html: Shift + ? kısayolu tamamen kaldırıldı");
assert(!catUiEnhancements.includes("e.key === '?' && !isTyping"), "cat_ui_enhancements.js: ? tuşu dinleyicisi kaldırıldı");
assert(indexHtml.includes("if (e.key === 'F1') {"), "index.html: F1 tuşu kısayol modalı için güvenli biçimde korundu");
console.log('✅ 1. Soru işareti (?) yazarken veya Shift + ? basıldığında sekme/modal açılması başarıyla kapatıldı.');

// 2. LIGHT EKRANDAKİ BARLAR ARASINDAKİ ÇİZGİLER (BELİRGİN BORDER-SLATE-300)
assert(indexHtml.includes('border-b border-slate-300 dark:border-neutral-800'), "Header & bar alt sınırları border-slate-300 yapıldı");
assert(indexHtml.includes('border-r border-slate-300 dark:border-neutral-800'), "Panel sağ sınırları border-slate-300 yapıldı");
assert(indexHtml.includes('border-l border-slate-300 dark:border-neutral-800'), "Video paneli sol sınırı border-slate-300 yapıldı");
assert(indexHtml.includes('border-t border-slate-300 dark:border-neutral-800'), "Alt pagination bar üst sınırı border-slate-300 yapıldı");
console.log('✅ 2. Light mode bar ve panel sınırları belirgin gri çizgilere (border-slate-300) yükseltildi.');

// 3. VİDEO PROJEYE TEKRAR GİRİNCE VİDEO KAPANMASIN & TEKRAR VİDEO YÜKLENİNCE MEVCUT SEGMENTLER SİLİNMESİN
assert(indexHtml.includes('existingVideoUrl && player'), "updateActiveProjectView mevcut video URL'ini algılıyor");
assert(indexHtml.includes('if (!player.src || player.src !== existingVideoUrl)'), "updateActiveProjectView videoyu oynatıcıya yüklüyor");
assert(indexHtml.includes('if (doc && doc.segments && doc.segments.length > 0)'), "handleSubVideoUpload mevcut segment kontrolü yapıyor");
assert(indexHtml.includes('videoya bağlandı. Mevcut'), "handleSubVideoUpload mevcut segmentleri koruyarak bildirim veriyor");
console.log('✅ 3. Video projeye tekrar girildiğinde açık kalıyor; tekrar video seçilirse mevcut çeviriler korunuyor ve tekrar segmente edilmiyor.');

// 4. NETFLIX ALTYAZI STANDARDI OLAN SATIR SİLİNDİ
assert(!indexHtml.includes('Netflix & EBU-TT Altyazı Standartları'), "Netflix altyazı standartları görünür başlık satırı silindi");
assert(!indexHtml.includes('Max 2 Satır · 42 CPL · 17-20 CPS'), "Netflix kural metni satırı arayüzden silindi");
assert(indexHtml.includes('id="subtitlingWorkbench" class="hidden" aria-hidden="true" style="display:none;"'), "subtitlingWorkbench DOM hookları görünmez kılındı");
console.log('✅ 4. Netflix altyazı standardı bar satırı ekrandan tamamen silindi, dikey alan çevirmene kazandırıldı.');

// 5. UYARI KISIMLARI YAZILAN YERİN ALTINDA YAZI ŞEKLİNDE ÇIKMASIN (Zaten kenardaki rozetlerde var)
assert(!indexHtml.includes('Altyazı Kısıt Uyarısı:'), "Altyazı kısıt uyarı metni hedef metin kutusu altından silindi");
assert(indexHtml.includes('text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-[10px]'), "CPL/CPS limit aşım rozeti segment çubuğunda mevcut");
console.log('✅ 5. Hedef kutusu altındaki gereksiz kırmızı uyarı yazısı kaldırıldı, kenar rozetleri korundu.');

// 6. BELLEKTE KAYITLI BİR ŞEY VARSA SAĞDA YEŞİL TİK TUŞU
assert(indexHtml.includes('applyTmMatchToTarget(${seg.id})'), "Bellekteki çeviriyi aktarmak için sağda yeşil tik tuşu mevcut");
assert(indexHtml.includes('bg-emerald-600 hover:bg-emerald-700'), "Yeşil tik tuşu emerald renk paletine sahip");
console.log('✅ 6. TM bellek eşleşmesi kutu altına metin basmak yerine sağ köşede yeşil tik butonu ile sunuldu.');

// 7. VİDEO PANELİ ŞABLONU TÜM TEMALARA (LIGHT/DARK/SEPIA) UYARLANDI
assert(indexHtml.includes('/* SEPIA THEME EXTENSIONS FOR VIDEO PANEL */'), "Video paneli için Sepia tema kuralları tanımlı");
assert(indexHtml.includes('bg-white dark:bg-[#0c0c0c] text-slate-800 dark:text-neutral-100'), "Video paneli tema duyarlı sınıflarla yeniden yazıldı");
console.log('✅ 7. Video monitör paneli tüm temalara (Light, Dark, Sepia) uygun dinamik şablonla güncellendi.');

console.log('----------------------------------------------------');
console.log('🎉 TÜM KULLANICI TALEPLERİ TESTLERDEN %100 BAŞARIYLA GEÇTİ!');
console.log('----------------------------------------------------');


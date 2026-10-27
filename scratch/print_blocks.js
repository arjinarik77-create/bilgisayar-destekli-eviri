const fs = require('fs');

const content = fs.readFileSync('c:/Users/Arjin/Desktop/Projeler/CATtool/index.html', 'utf8');

// Print exact subtitlingWorkbench block
const startWb = content.indexOf('<!-- ALTYAZI ÇEVİRİ MOTORU VE KOMPAKT KONTROL BARI (SUBTITLING MODULE) -->');
const endWb = content.indexOf('<!-- Canlı Akış Transkripsiyon Bilgi');
console.log("=== SUBTITLING WORKBENCH ===");
console.log(content.substring(startWb, endWb));

// Print exact subStreamingStatusBanner block
const startBanner = content.indexOf('<!-- Canlı Akış Transkripsiyon Bilgi');
const endBanner = content.indexOf('<!-- SÖZLÜ ÇEVİRİ HAZIRLIK KONSOLU');
console.log("=== STREAMING BANNER ===");
console.log(content.substring(startBanner, endBanner));

// Print exact subVideoPanel Header block
const startVp = content.indexOf('<!-- SAĞ SÜTUN: ALTYAZI VİDEO OYNATICI');
const endVp = content.indexOf('<!-- 1. Durum: Henüz Video Yüklenmemiş Boş Ekran');
console.log("=== VIDEO PANEL HEADER ===");
console.log(content.substring(startVp, endVp));

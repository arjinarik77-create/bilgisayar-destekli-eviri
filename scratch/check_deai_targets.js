const fs = require('fs');

const content = fs.readFileSync('c:/Users/Arjin/Desktop/Projeler/CATtool/index.html', 'utf8');

console.log("Checking subtitlingWorkbench:");
const wbMatch = content.match(/<div id="subtitlingWorkbench"[\s\S]*?<\/div>\s*<\/div>\s*<!-- Gizli/);
if (wbMatch) {
    console.log("Found subtitlingWorkbench:", wbMatch[0].substring(0, 300) + '...');
} else {
    console.log("subtitlingWorkbench match NOT found");
}

console.log("\nChecking subStreamingStatusBanner:");
const bannerMatch = content.match(/<div id="subStreamingStatusBanner"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (bannerMatch) {
    console.log("Found subStreamingStatusBanner:", bannerMatch[0].substring(0, 300) + '...');
} else {
    console.log("subStreamingStatusBanner match NOT found");
}

console.log("\nChecking subVideoPanel Header:");
const vpMatch = content.match(/<div id="subVideoPanel"[\s\S]*?<!-- Panel Üst Barı -->[\s\S]*?<\/div>\s*<!-- 1\. Durum/);
if (vpMatch) {
    console.log("Found subVideoPanel Header:", vpMatch[0].substring(0, 300) + '...');
} else {
    console.log("subVideoPanel Header match NOT found");
}

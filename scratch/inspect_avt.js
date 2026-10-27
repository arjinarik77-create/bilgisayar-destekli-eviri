const fs = require('fs');

const avtStudioExists = fs.existsSync('vendor/cat_avt_studio.js');
console.log("vendor/cat_avt_studio.js exists:", avtStudioExists);

if (avtStudioExists) {
    const avtContent = fs.readFileSync('vendor/cat_avt_studio.js', 'utf8');
    console.log("cat_avt_studio.js length:", avtContent.length);
    const matches = [...avtContent.matchAll(/function\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*:\s*function/g)].map(m => m[1] || m[2]);
    console.log("cat_avt_studio functions:", [...new Set(matches)].slice(0, 30));
}

const legacy = fs.readFileSync('legacy_index.html', 'utf8');
const subMatches = [...legacy.matchAll(/subtitl|video|subVideo|caption|overlay/gi)].length;
console.log("Subtitling/video matches in legacy_index.html:", subMatches);

// Find video player container in legacy_index.html
const playerIdx = legacy.indexOf('id="subVideoPlayer"');
console.log("subVideoPlayer index:", playerIdx);
if (playerIdx !== -1) {
    console.log("Context around subVideoPlayer:");
    console.log(legacy.substring(Math.max(0, playerIdx - 400), Math.min(legacy.length, playerIdx + 800)));
}

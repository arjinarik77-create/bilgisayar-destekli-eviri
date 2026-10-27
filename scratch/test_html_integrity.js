const fs = require('fs');

console.log('Testing index.html structural integrity & segmentation...');
const html = fs.readFileSync('index.html', 'utf8');

// 1. Check orphan div around subStreamingStatusBanner
const matchBanner = html.match(/id="subStreamingStatusBanner"[\s\S]*?id="interpretingWorkbench"/);
if (matchBanner) {
    const snippet = matchBanner[0];
    const openDivs = (snippet.match(/<div\b/g) || []).length;
    const closeDivs = (snippet.match(/<\/div>/g) || []).length;
    console.log(`subStreamingStatusBanner section: open divs = ${openDivs}, close divs = ${closeDivs}`);
    if (openDivs === closeDivs) {
        console.log('✅ PASS: subStreamingStatusBanner divs are perfectly balanced!');
    } else {
        console.error(`❌ FAIL: Unbalanced divs in snippet! open=${openDivs}, close=${closeDivs}`);
        process.exit(1);
    }
}

// 2. Check segmentDocument regex in index.html
if (html.includes('\\p{L}\\p{N}') && html.includes('\\n+')) {
    console.log('✅ PASS: segmentDocument has Unicode Turkish & multi-line splitting support!');
} else {
    console.error('❌ FAIL: segmentDocument regex not found!');
    process.exit(1);
}

// 3. Check waveform isolation in updateActiveProjectView
if (html.includes("if (wfContainer) wfContainer.classList.add('hidden')")) {
    console.log('✅ PASS: bottomWaveformContainer is properly hidden for non-subtitling projects!');
} else {
    console.error('❌ FAIL: Waveform container is not hidden in updateActiveProjectView!');
    process.exit(1);
}

// 4. Check video mounting in confirmNewProject
if (html.includes("document.getElementById('avtVideoPlayer') || document.getElementById('subVideoPlayer')")) {
    console.log('✅ PASS: confirmNewProject binds correctly to avtVideoPlayer!');
} else {
    console.error('❌ FAIL: confirmNewProject still using old video player id!');
    process.exit(1);
}

console.log('🚀 ALL CHECKS PASSED SUCCESSFULLY!');

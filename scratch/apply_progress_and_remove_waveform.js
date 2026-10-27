const fs = require('fs');

function applyChanges(filePath) {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. In renderActiveDocument: Add "Bu işlem biraz zaman alabilir..." to central card
    if (!content.includes('Bu işlem biraz zaman alabilir...')) {
        const targetStr = '<span>Yapay zeka ses analizi ve akıllı cümleleme çalışıyor...</span>';
        if (content.includes(targetStr)) {
            const addition = '\n                                    </div>\n                                    <div class="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1.5 mt-0.5">\n                                        <span class="material-symbols-outlined text-[14px] animate-spin">hourglass_empty</span>\n                                        <span>Bu işlem biraz zaman alabilir...</span>';
            content = content.replace(targetStr + '\r\n                                    </div>', targetStr + addition);
            content = content.replace(targetStr + '\n                                    </div>', targetStr + addition);
            console.log(`  ✅ Added "Bu işlem biraz zaman alabilir..." to renderActiveDocument card.`);
        }
    }

    // 2. Clean up waveform init in handleSubVideoUpload
    const wfRegex = /\/\/\s*Alt ses dalgası konteynerini de aç[\s\S]*?setTimeout\(\(\)\s*=>\s*\{[\s\S]*?CatAVT\.Waveform\.render\(\);[\s\S]*?\}, 300\);/;
    if (wfRegex.test(content)) {
        content = content.replace(wfRegex, '// Alttaki ses dalgası kullanıcının talebiyle tamamen kaldırıldı');
        console.log(`  ✅ Cleaned up handleSubVideoUpload waveform init.`);
    }

    // 3. Make sure banner is shown immediately in handleSubVideoUpload
    const bannerShowTarget = 'collapseSidebarForSubtitling();';
    const bannerShowCode = `collapseSidebarForSubtitling();
            const streamingBanner = document.getElementById('subStreamingStatusBanner');
            if (streamingBanner) {
                streamingBanner.classList.remove('hidden');
                streamingBanner.style.display = 'flex';
            }`;
    if (content.includes(bannerShowTarget) && !content.includes('streamingBanner.classList.remove(\'hidden\');')) {
        content = content.replace(bannerShowTarget, bannerShowCode);
        console.log(`  ✅ Added immediate banner show in handleSubVideoUpload.`);
    }

    // 4. In startStreamingVideoTranscription: Animate progress bar smoothly
    const startRegex = /(if\s*\(banner\)\s*\{[\s\S]*?if\s*\(bar\)\s*bar\.style\.width\s*=\s*'10%';[\s\S]*?if\s*\(subtitle\)\s*subtitle\.innerText[\s\S]*?;\s*\})/;
    if (startRegex.test(content)) {
        const replacement = `if (banner) {
                banner.classList.remove('hidden');
                banner.style.display = 'flex';
                if (bar) bar.style.width = '15%';
                if (badge) badge.innerText = 'Başlatılıyor...';
                if (title) title.innerText = 'Videonun Sesi Dönüştürülüyor & Transkript Çıkarılıyor...';
                if (subtitle) subtitle.innerText = \`"\${videoFile.name}" ses kanalı taranıyor ve zaman kodlu konuşmalar çıkarılıyor...\`;
            }

            // Canlı ve gerçekçi ilerleme çizgisi (Progress Line)
            let currentProgressPct = 15;
            const liveProgressInterval = setInterval(() => {
                if (streamingTranscriptionCancelled || !streamingTranscriptionActive) {
                    clearInterval(liveProgressInterval);
                    return;
                }
                if (currentProgressPct < 90) {
                    currentProgressPct += (currentProgressPct < 45 ? 6 : (currentProgressPct < 75 ? 3 : 1));
                    if (bar) bar.style.width = \`\${currentProgressPct}%\`;
                    if (badge) badge.innerText = \`%\${currentProgressPct}\`;
                }
            }, 600);`;
        content = content.replace(startRegex, replacement);
        console.log(`  ✅ Added live animated progress bar to startStreamingVideoTranscription.`);
    }

    // 5. In stopStreamingTranscription & finally: clear interval
    if (!content.includes('if (typeof liveProgressInterval !== \'undefined\') clearInterval(liveProgressInterval);')) {
        content = content.replace(
            'streamingTranscriptionCancelled = true;',
            'streamingTranscriptionCancelled = true;\n            if (typeof liveProgressInterval !== \'undefined\') clearInterval(liveProgressInterval);'
        );
        content = content.replace(
            'streamingTranscriptionActive = false;\n            }',
            'streamingTranscriptionActive = false;\n                if (typeof liveProgressInterval !== \'undefined\') clearInterval(liveProgressInterval);\n            }'
        );
        console.log(`  ✅ Added interval clearing to stop/finally.`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saved ${filePath}\n`);
}

['index.html', 'legacy_index.html', 'index.html.bak'].forEach(applyChanges);

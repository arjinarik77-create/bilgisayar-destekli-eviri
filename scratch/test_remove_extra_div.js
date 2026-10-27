const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `<div id="subtitlingWorkbench" class="hidden" aria-hidden="true" style="display:none;">
                    <span id="subMonitorTimecode">00:00:00,000 ➔ 00:00:03,000</span>
                    <span id="subMonitorDuration">3.0s</span>
                    <span id="subMonitorCpsBadge">14.2 CPS (İdeal)</span>
                    <div id="subMonitorLiveText">Altyazı önizlemesi</div>
                </div>
                </div>`;

const fixed = `<div id="subtitlingWorkbench" class="hidden" aria-hidden="true" style="display:none;">
                    <span id="subMonitorTimecode">00:00:00,000 ➔ 00:00:03,000</span>
                    <span id="subMonitorDuration">3.0s</span>
                    <span id="subMonitorCpsBadge">14.2 CPS (İdeal)</span>
                    <div id="subMonitorLiveText">Altyazı önizlemesi</div>
                </div>`;

if (html.includes(target)) {
    console.log('Target found!');
    html = html.replace(target, fixed);
    
    // Check balance
    const sIdx = html.indexOf('id="section-editor"');
    const tmIdx = html.indexOf('id="section-tm"');
    const pIdx = html.indexOf('id="section-projects"');
    const s_tm = html.substring(sIdx, tmIdx);
    console.log('open divs:', (s_tm.match(/<div\b/g) || []).length);
    console.log('close divs:', (s_tm.match(/<\/div>/g) || []).length);
} else {
    console.log('Target not found!');
}

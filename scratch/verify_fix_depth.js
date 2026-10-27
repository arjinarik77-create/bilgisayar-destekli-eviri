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

html = html.replace(target, fixed);

const startIdx = html.indexOf('id="section-editor"');
const endIdx = html.indexOf('id="section-projects"');
const snippet = html.substring(startIdx, endIdx);

const regex = /<\/?div\b[^>]*>/gi;
let match;
let depth = 0;
let minDepth = 0;

while ((match = regex.exec(snippet)) !== null) {
    const tag = match[0];
    const isClose = tag.startsWith('</');
    const isSelfClosing = tag.endsWith('/>');
    
    if (isClose) {
        depth--;
        if (depth < minDepth) minDepth = depth;
    } else if (!isSelfClosing) {
        depth++;
    }
}

console.log('Final depth at section-projects:', depth);
console.log('Minimum depth reached:', minDepth);

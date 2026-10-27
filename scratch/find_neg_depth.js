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

while ((match = regex.exec(snippet)) !== null) {
    const tag = match[0];
    const isClose = tag.startsWith('</');
    const isSelfClosing = tag.endsWith('/>');
    
    if (isClose) {
        depth--;
        if (depth < 0) {
            console.log(`Depth became negative at snippet index ${match.index}:`);
            console.log(snippet.substring(Math.max(0, match.index - 100), match.index + 100));
            break;
        }
    } else if (!isSelfClosing) {
        depth++;
    }
}
console.log('Finished. If not printed above, depth never became negative before closing.');

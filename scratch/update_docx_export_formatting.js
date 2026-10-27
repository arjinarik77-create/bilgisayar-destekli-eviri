const fs = require('fs');

console.log("Upgrading vendor/docx_export.js with rich format parsing and paragraph grouping...");

let code = fs.readFileSync('vendor/docx_export.js', 'utf8');

// Rich HTML parser function to include in docx_export.js
const parseHtmlToRunsFunction = `
    function parseStyleAttr(styleStr, parentFmt) {
        const fmt = Object.assign({}, parentFmt);
        if (!styleStr) return fmt;
        const rules = styleStr.split(';');
        for (let rule of rules) {
            const [prop, val] = rule.split(':').map(s => s ? s.trim().toLowerCase() : '');
            if (!prop || !val) continue;
            if (prop === 'font-weight' && (val === 'bold' || val === '700' || val === '800' || val === '900')) {
                fmt.bold = true;
            } else if (prop === 'font-style' && val === 'italic') {
                fmt.italic = true;
            } else if (prop === 'text-decoration' && val.includes('underline')) {
                fmt.underline = true;
            } else if (prop === 'color') {
                if (val.startsWith('#')) fmt.color = val.toUpperCase();
                else if (val.startsWith('rgb')) {
                    const m = val.match(/\\d+/g);
                    if (m && m.length >= 3) {
                        const hex = '#' + ((1 << 24) + (+m[0] << 16) + (+m[1] << 8) + +m[2]).toString(16).slice(1).toUpperCase();
                        fmt.color = hex;
                    }
                } else {
                    fmt.color = val.toUpperCase();
                }
            } else if (prop === 'font-size') {
                const ptMatch = val.match(/([\\d.]+)\\s*(pt|px)?/);
                if (ptMatch) {
                    let num = parseFloat(ptMatch[1]);
                    if (ptMatch[2] === 'px') num = Math.round(num * 0.75);
                    fmt.size = num;
                }
            } else if (prop === 'font-family') {
                const fontClean = val.replace(/['"]/g, '').split(',')[0].trim();
                if (fontClean) fmt.font = fontClean;
            }
        }
        return fmt;
    }

    function parseHtmlToRuns(htmlText, baseFmt) {
        baseFmt = baseFmt || { font: 'Times New Roman', size: 12, bold: false, italic: false, underline: false, color: '#000000' };
        if (!htmlText) return [];

        // Check if there are any HTML tags
        if (!/<[a-zA-Z][^>]*>|<\\/[a-zA-Z]+>/i.test(htmlText)) {
            return [{ text: htmlText, fmt: Object.assign({}, baseFmt) }];
        }

        const runs = [];
        const tagRegex = /<\\/?([a-zA-Z0-9]+)([^>]*)>/g;
        let lastIdx = 0;
        let match;
        const stack = [Object.assign({}, baseFmt)];
        const currentFmt = () => stack[stack.length - 1];

        while ((match = tagRegex.exec(htmlText)) !== null) {
            const textBefore = htmlText.slice(lastIdx, match.index);
            if (textBefore) {
                // Decode common HTML entities
                const cleanTxt = textBefore
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&nbsp;/g, ' ');
                runs.push({ text: cleanTxt, fmt: Object.assign({}, currentFmt()) });
            }

            const isClosing = match[0].startsWith('</');
            const tagName = match[1].toLowerCase();
            const attrs = match[2] || '';

            if (isClosing) {
                if (stack.length > 1) stack.pop();
            } else {
                const cur = currentFmt();
                const next = Object.assign({}, cur);

                if (tagName === 'b' || tagName === 'strong') next.bold = true;
                else if (tagName === 'i' || tagName === 'em') next.italic = true;
                else if (tagName === 'u') next.underline = true;

                if (attrs) {
                    const styleMatch = attrs.match(/style=["']([^"']*)["']/i);
                    if (styleMatch) Object.assign(next, parseStyleAttr(styleMatch[1], cur));
                    const colorMatch = attrs.match(/color=["']([^"']*)["']/i);
                    if (colorMatch) next.color = colorMatch[1].toUpperCase();
                    const faceMatch = attrs.match(/face=["']([^"']*)["']/i);
                    if (faceMatch) next.font = faceMatch[1].replace(/['"]/g, '').split(',')[0].trim();
                    const sizeMatch = attrs.match(/size=["']([^"']*)["']/i);
                    if (sizeMatch) {
                        const szNum = parseFloat(sizeMatch[1]);
                        if (!isNaN(szNum)) next.size = szNum;
                    }
                }
                stack.push(next);
            }
            lastIdx = tagRegex.lastIndex;
        }

        if (lastIdx < htmlText.length) {
            const textAfter = htmlText.slice(lastIdx)
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ');
            runs.push({ text: textAfter, fmt: Object.assign({}, currentFmt()) });
        }

        return runs;
    }
`;

// Insert parseHtmlToRunsFunction right before function segPieces
const segPiecesTarget = 'function segPieces(seg, tf) {';
if (code.includes(segPiecesTarget) && !code.includes('function parseHtmlToRuns(')) {
    code = code.replace(segPiecesTarget, `${parseHtmlToRunsFunction}\n    ${segPiecesTarget}`);
    console.log("Added parseHtmlToRuns before segPieces");
}

// Now replace segPieces implementation to inherit styleMemory and parse HTML
const updatedSegPieces = `function segPieces(seg, tf) {
        const useTarget = !!(seg.target && seg.target.trim());
        const text = useTarget ? seg.target : (seg.source || '');
        
        // Stilleri koru (styleMemory varsa temel biçime aktar)
        const sm = seg.styleMemory || {};
        const segTf = Object.assign({}, tf, {
            font: sm.font || tf.font,
            size: sm.size ? Math.round(sm.size) : tf.size,
            bold: sm.bold != null ? Boolean(sm.bold) : (seg.isHeading ? true : tf.bold),
            italic: sm.italic != null ? Boolean(sm.italic) : tf.italic,
            underline: sm.underline != null ? Boolean(sm.underline) : tf.underline,
            color: (sm.color && sm.color !== 'auto' && sm.color !== '#000000') ? sm.color : tf.color
        });

        const fm = seg.fmt;
        if (!fm) {
            // Biçim kalkanı yoksa ama metin içinde HTML/bold/italic/renk etiketleri varsa ayrıştır
            return parseHtmlToRuns(text, segTf);
        }
        const base = Object.assign({}, segTf, fm.base || {});

        // EĞER hedef metin içinde HTML/DOM <span class="shield-badge"... veya <shield id="..." varsa doğrudan ayrıştır:
        const shieldHtmlRegex = /<span class=["']?shield-badge["']?[^>]*data-shield-id=["']?(\\w+)["']?[^>]*>(?:<span[^>]*class=["']?shield-num-badge["']?[^>]*>\\[\\d+\\]<\\/span>)?([\\s\\S]*?)<\\/span>|<shield(?:\\s+id=["']?(\\w+)["']?)?>([\\s\\S]*?)<\\/shield>/gi;
        if (useTarget && shieldHtmlRegex.test(text)) {
            shieldHtmlRegex.lastIndex = 0;
            const out = [];
            let lastIdx = 0;
            let m;
            while ((m = shieldHtmlRegex.exec(text)) !== null) {
                if (m.index > lastIdx) {
                    const plainBefore = text.slice(lastIdx, m.index);
                    parseHtmlToRuns(plainBefore, base).forEach(pc => out.push(pc));
                }
                const shId = m[1] || m[3];
                const innerRaw = m[2] !== undefined ? m[2] : m[4];
                const innerText = innerRaw.replace(/<[^>]+>/g, '');
                const sh = fm.shields.find(s => s.id === shId || s.id === 'sh' + shId || s.id === shId.replace(/^sh/, ''));
                const shFmt = sh ? Object.assign({}, base, sh.fmt) : base;
                out.push({ text: innerText, fmt: shFmt });
                lastIdx = shieldHtmlRegex.lastIndex;
            }
            if (lastIdx < text.length) {
                const plainAfter = text.slice(lastIdx);
                parseHtmlToRuns(plainAfter, base).forEach(pc => out.push(pc));
            }
            return out;
        }

        const runs = (useTarget ? fm.tgtRuns : fm.srcRuns)
            .filter(r => r && r.end > r.start && r.start >= 0 && r.end <= text.length && (!r.shieldId || fm.shields.some(s => s.id === r.shieldId)))
            .sort((a, b) => a.start - b.start);
        const out = []; let pos = 0;
        for (const r of runs) {
            if (r.start < pos) continue;
            if (r.start > pos) {
                parseHtmlToRuns(text.slice(pos, r.start), base).forEach(pc => out.push(pc));
            }
            const sh = r.shieldId ? fm.shields.find(s => s.id === r.shieldId) : null;
            const rFmt = sh ? Object.assign({}, base, sh.fmt) : Object.assign({}, base, r.fmt || {});
            out.push({ text: text.slice(r.start, r.end), fmt: rFmt });
            pos = r.end;
        }
        if (pos < text.length) {
            parseHtmlToRuns(text.slice(pos), base).forEach(pc => out.push(pc));
        }
        return out;
    }`;

// Replace original segPieces
const oldSegPiecesRegex = /function segPieces\(seg, tf\)\s*\{[\s\S]*?return out;\s*\}/;
if (oldSegPiecesRegex.test(code)) {
    code = code.replace(oldSegPiecesRegex, updatedSegPieces);
    console.log("Replaced segPieces with rich formatting version");
} else {
    console.warn("Could not find oldSegPiecesRegex");
}

// Replace paragraph grouping in exportFromScratch so segments don't jump to a new line
const oldGroupingRegex = /\/\/\s*Paragraflara göre grupla[\s\S]*?paraGroups\.forEach\(group => \{[\s\S]*?body\.appendChild\(para\(pieces, \{ indent: true \}\)\);\s*\}\s*\}\);/;

const updatedGrouping = `// SMARTCAT KUSURSUZ PARAGRAF MODELİ: Cümleler ait oldukları paragrafta tek boşlukla birleşir, alt satıra atlanmaz
            const paragraphs = [];
            let curGroup = [];
            let curPid = null;
            const isHeading = (s) => Boolean(s.isHeading || s.isHead || (s.styleMemory && s.styleMemory.isHeading));

            segs.forEach((seg, idx) => {
                const head = isHeading(seg);
                if (head) {
                    if (curGroup.length > 0) {
                        paragraphs.push({ isHead: false, segs: curGroup });
                        curGroup = [];
                        curPid = null;
                    }
                    paragraphs.push({ isHead: true, segs: [seg] });
                    return;
                }

                let pid = seg.paraId !== undefined ? seg.paraId : (seg.docx && seg.docx.p !== undefined ? seg.docx.p : null);

                if (pid != null) {
                    if (curPid === null) {
                        curPid = pid;
                        curGroup.push(seg);
                    } else if (curPid === pid) {
                        curGroup.push(seg);
                    } else {
                        paragraphs.push({ isHead: false, segs: curGroup });
                        curGroup = [seg];
                        curPid = pid;
                    }
                } else {
                    // paraId yoksa ardışık gövde cümleleri AYNI paragrafta akar, asla her cümlede yeni satıra geçmez!
                    const prev = idx > 0 ? segs[idx - 1] : null;
                    const hardBreak = prev && (prev.endsParagraph || (prev.source && /\\n\\s*$/.test(prev.source)) || (prev.target && /\\n\\s*$/.test(prev.target)));
                    if (hardBreak && curGroup.length > 0) {
                        paragraphs.push({ isHead: false, segs: curGroup });
                        curGroup = [seg];
                    } else {
                        curGroup.push(seg);
                    }
                }
            });

            if (curGroup.length > 0) {
                paragraphs.push({ isHead: false, segs: curGroup });
            }

            paragraphs.forEach(pObj => {
                if (pObj.isHead) {
                    const first = pObj.segs[0];
                    const headPieces = segP(first);
                    const headFmt = Object.assign({}, tf, {
                        bold: true,
                        size: (first.styleMemory && first.styleMemory.size) || opts.headingSize || 14,
                        color: (first.styleMemory && first.styleMemory.color) || opts.headingColor || '#000000'
                    });
                    headPieces.forEach(pc => { pc.fmt = Object.assign({}, pc.fmt, headFmt); });
                    body.appendChild(para(headPieces, { align: 'left', after: 8 }));
                } else {
                    const pieces = [];
                    pObj.segs.forEach((s, idx) => {
                        if (idx > 0) pieces.push({ text: ' ', fmt: s.styleMemory || tf });
                        segP(s).forEach(pc => pieces.push(pc));
                    });
                    body.appendChild(para(pieces, { indent: true }));
                }
            });`;

if (oldGroupingRegex.test(code)) {
    code = code.replace(oldGroupingRegex, updatedGrouping);
    console.log("Replaced paragraph grouping in exportFromScratch with smooth paragraph flow");
} else {
    console.warn("Could not find oldGroupingRegex in docx_export.js");
}

fs.writeFileSync('vendor/docx_export.js', code, 'utf8');
console.log("vendor/docx_export.js updated successfully!");

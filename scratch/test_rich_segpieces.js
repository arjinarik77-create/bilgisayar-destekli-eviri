function parseHtmlToRuns(htmlText, baseFmt) {
    baseFmt = baseFmt || { font: 'Times New Roman', size: 12, bold: false, italic: false, underline: false, color: '#000000' };
    if (!htmlText) return [];

    // Check if there are any HTML tags
    if (!/<[a-zA-Z][^>]*>|<\/[a-zA-Z]+>/i.test(htmlText)) {
        return [{ text: htmlText, fmt: Object.assign({}, baseFmt) }];
    }

    const runs = [];
    const tagRegex = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
    let lastIdx = 0;
    let match;

    // Active format stack
    const stack = [Object.assign({}, baseFmt)];

    function currentFmt() {
        return stack[stack.length - 1];
    }

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
                // Hex or named or rgb
                if (val.startsWith('#')) {
                    fmt.color = val.toUpperCase();
                } else {
                    fmt.color = val;
                }
            } else if (prop === 'font-size') {
                const ptMatch = val.match(/([\d.]+)\s*(pt|px)?/);
                if (ptMatch) {
                    let num = parseFloat(ptMatch[1]);
                    if (ptMatch[2] === 'px') num = Math.round(num * 0.75); // px to pt
                    fmt.size = num;
                }
            } else if (prop === 'font-family') {
                const fontClean = val.replace(/['"]/g, '').split(',')[0].trim();
                if (fontClean) fmt.font = fontClean;
            }
        }
        return fmt;
    }

    while ((match = tagRegex.exec(htmlText)) !== null) {
        const textBefore = htmlText.slice(lastIdx, match.index);
        if (textBefore) {
            runs.push({ text: textBefore, fmt: Object.assign({}, currentFmt()) });
        }

        const isClosing = match[0].startsWith('</');
        const tagName = match[1].toLowerCase();
        const attrs = match[2] || '';

        if (isClosing) {
            if (stack.length > 1) {
                stack.pop();
            }
        } else {
            const cur = currentFmt();
            const next = Object.assign({}, cur);

            if (tagName === 'b' || tagName === 'strong') {
                next.bold = true;
            } else if (tagName === 'i' || tagName === 'em') {
                next.italic = true;
            } else if (tagName === 'u') {
                next.underline = true;
            } else if (tagName === 'span' || tagName === 'font' || tagName === 'p' || tagName === 'div') {
                const styleMatch = attrs.match(/style=["']([^"']*)["']/i);
                if (styleMatch) {
                    Object.assign(next, parseStyleAttr(styleMatch[1], cur));
                }
                const colorMatch = attrs.match(/color=["']([^"']*)["']/i);
                if (colorMatch) {
                    next.color = colorMatch[1].toUpperCase();
                }
                const faceMatch = attrs.match(/face=["']([^"']*)["']/i);
                if (faceMatch) {
                    next.font = faceMatch[1].replace(/['"]/g, '').split(',')[0].trim();
                }
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
        runs.push({ text: htmlText.slice(lastIdx), fmt: Object.assign({}, currentFmt()) });
    }

    return runs;
}

// Test cases
const base = { font: 'Calibri', size: 11, bold: false, italic: false, underline: false, color: '#000000' };
const testSample = 'Bu metin normaldir, bu <b style="color:#2563EB;">mavi kalın</b>, bu <i>italik</i> ve <span style="font-size:18pt; color:#DC2626; font-family:Georgia;">büyük kırmızı Georgia</span> kelimedir.';

console.log("Testing parseHtmlToRuns:");
const runs = parseHtmlToRuns(testSample, base);
console.log(JSON.stringify(runs, null, 2));

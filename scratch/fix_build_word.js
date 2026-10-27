const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');
const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

const marker = "function buildWordDocumentHtml(doc, opts) {";
const fnStart = normalized.indexOf(marker);
const targetSnippetStart = normalized.indexOf("opts.contentMode === 'all_content'", fnStart);
console.log("Found snippet at:", targetSnippetStart);

if (targetSnippetStart !== -1) {
    // Find the 'else' before it
    const elseIdx = normalized.lastIndexOf("} else {", targetSnippetStart);
    // Find the end of this else block before "const linePercent ="
    const endElseIdx = normalized.indexOf("const linePercent = Math.round(opts.lineSpacing * 100);", targetSnippetStart);
    
    console.log("elseIdx:", elseIdx, "endElseIdx:", endElseIdx);
    
    const replacement = `} else {
                // SMARTCAT STANDARDI: Cümleler paragraflarda birleşir, asla 1 2 3 diye ayrılmaz
                if (opts.contentMode === 'all_content' && cleanDocName) {
                    bodyHtml += \`<h1 class="Heading1" style="text-align:center; margin-bottom:18pt;">\${escapeHtml(cleanDocName)}</h1>\\n\`;
                }

                // Paragraflara göre grupla (Smartcat Paragraf Modeli)
                const paraGroups = new Map();
                cleanSegments.forEach(s => {
                    const pKey = s.paraId !== undefined ? s.paraId : (s.docx && s.docx.p !== undefined ? s.docx.p : 'p_' + s.id);
                    if (!paraGroups.has(pKey)) paraGroups.set(pKey, []);
                    paraGroups.get(pKey).push(s);
                });

                paraGroups.forEach((group) => {
                    const isHead = group.some(s => s.isHead || s.isHeading);
                    if (isHead) {
                        const headText = group[0].targetHtml || escapeHtml(group[0].target);
                        bodyHtml += \`<h1 class="Heading1">\${headText}</h1>\\n\`;
                    } else {
                        // Aynı paragrafın cümleleri tek bir boşlukla yan yana akar
                        const pText = group.map(s => s.targetHtml || escapeHtml(s.target)).join(' ');
                        bodyHtml += \`<p class="MsoNormal">\${pText}</p>\\n\`;
                    }
                });
            }

            `;

    normalized = normalized.substring(0, elseIdx) + replacement + normalized.substring(endElseIdx);
    console.log("Successfully replaced buildWordDocumentHtml else block!");
}

const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync('index.html', finalContent, 'utf8');
console.log("Saved index.html!");

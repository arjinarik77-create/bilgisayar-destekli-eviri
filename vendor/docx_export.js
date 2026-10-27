/* ==========================================================
   GERÇEK DOCX DIŞA AKTARMA (JSZip)
   ----------------------------------------------------------
   1) Orijinal .docx yüklendiyse: ZIP yapısı korunur, yalnızca
      word/document.xml içindeki paragrafların metin run'ları (<w:r>/<w:t>)
      çevirilerle yeniden yazılır. Kalkan stilleri <w:rPr> alanlarına
      (rFonts, b/bCs, i/iCs, u, color, sz/szCs, lang) birebir yansıtılır.
   2) Orijinal yoksa (PDF/TXT/yapıştırma): sıfırdan geçerli bir OOXML paketi üretilir.
   Her iki durumda da tarayıcıda Blob olarak gerçek .docx indirilir.
   ========================================================== */
(function (global) {
    'use strict';

    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const XML_NS = 'http://www.w3.org/XML/1998/namespace';
    const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    /* ---------------- Orijinal dosya deposu (bellek + IndexedDB) ---------------- */
    const mem = new Map();
    function idb() {
        return new Promise((resolve, reject) => {
            if (!global.indexedDB) return reject(new Error('IndexedDB yok'));
            const rq = indexedDB.open('cat_docx_store', 1);
            rq.onupgradeneeded = () => rq.result.createObjectStore('files');
            rq.onsuccess = () => resolve(rq.result);
            rq.onerror = () => reject(rq.error);
        });
    }
    async function idbPut(key, val) {
        try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { /* kalıcılık opsiyonel */ }
    }
    async function idbGet(key) {
        try { const db = await idb(); return await new Promise((res, rej) => { const rq = db.transaction('files').objectStore('files').get(key); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); } catch (e) { return null; }
    }
    /** addNewDoc sonrası: yakalanan orijinal DOCX'i belgeye bağlar. */
    function bind(doc, fileName) {
        const c = global.FormatShield && global.FormatShield.takeCaptured(fileName);
        if (!c || !c.buffer) return false;
        mem.set(doc.id, c.buffer);
        doc.docxParas = c.paraInfo;
        doc.hasOriginalDocx = true;
        idbPut(doc.id, c.buffer);
        return true;
    }
    async function getBuffer(docId) { return mem.get(docId) || (await idbGet(docId)) || null; }

    /* ---------------- rPr yardımcıları ---------------- */
    const RPR_ORDER = ['rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike', 'outline', 'shadow', 'emboss',
        'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing', 'w', 'kern', 'position', 'sz', 'szCs', 'highlight',
        'u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang', 'eastAsianLayout', 'specVanish', 'oMath'];
    const local = (n) => n.nodeName.replace(/^w:/, '');

    function mk(dom, name, attrs) {
        const el = dom.createElementNS(W, 'w:' + name);
        if (attrs) Object.keys(attrs).forEach(k => el.setAttributeNS(W, 'w:' + k, attrs[k]));
        return el;
    }
    function find(parent, name) { for (const c of parent.childNodes) if (c.nodeType === 1 && c.nodeName === 'w:' + name) return c; return null; }
    function ensure(dom, rPr, name) { let el = find(rPr, name); if (!el) { el = mk(dom, name); rPr.appendChild(el); } return el; }
    function drop(rPr, name) { const el = find(rPr, name); if (el) rPr.removeChild(el); }
    function setAttr(el, k, v) { el.setAttributeNS(W, 'w:' + k, v); }
    function sortRPr(rPr) {
        const kids = Array.from(rPr.childNodes).filter(n => n.nodeType === 1);
        kids.sort((a, b) => {
            const ia = RPR_ORDER.indexOf(local(a)), ib = RPR_ORDER.indexOf(local(b));
            return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        });
        kids.forEach(k => rPr.appendChild(k));
    }

    /** `f` biçimini, `tf` (şablon/miras) biçimine göre farklı olan özellikler için <w:rPr> içine yazar. */
    function applyFmt(dom, rPr, f, tf, force) {
        const diff = (a, b) => force || a !== b;
        if (f.font && diff(f.font, tf.font)) {
            const rf = ensure(dom, rPr, 'rFonts');
            ['asciiTheme', 'hAnsiTheme', 'cstheme', 'eastAsiaTheme'].forEach(a => rf.removeAttributeNS(W, a));
            ['ascii', 'hAnsi', 'cs', 'eastAsia'].forEach(a => setAttr(rf, a, f.font));
        }
        if (f.size && diff(f.size, tf.size)) {
            const hp = String(Math.round(f.size * 2));
            setAttr(ensure(dom, rPr, 'sz'), 'val', hp); setAttr(ensure(dom, rPr, 'szCs'), 'val', hp);
        }
        if (diff(!!f.bold, !!tf.bold)) {
            ['b', 'bCs'].forEach(n => { const el = ensure(dom, rPr, n); if (f.bold) el.removeAttributeNS(W, 'val'); else setAttr(el, 'val', '0'); });
        }
        if (diff(!!f.italic, !!tf.italic)) {
            ['i', 'iCs'].forEach(n => { const el = ensure(dom, rPr, n); if (f.italic) el.removeAttributeNS(W, 'val'); else setAttr(el, 'val', '0'); });
        }
        if (diff(!!f.underline, !!tf.underline)) {
            setAttr(ensure(dom, rPr, 'u'), 'val', f.underline ? 'single' : 'none');
        }
        if (f.color && diff((f.color || '').toUpperCase(), (tf.color || '').toUpperCase())) {
            const c = ensure(dom, rPr, 'color');
            ['themeColor', 'themeShade', 'themeTint'].forEach(a => c.removeAttributeNS(W, a));
            setAttr(c, 'val', f.color.replace('#', '').toUpperCase());
        }
    }

    /** Metni <w:r> düğümlerine çevirir (\n -> w:br, \t -> w:tab). */
    function buildRun(dom, text, tmplRPr, fmt, tf, lang, force) {
        const r = mk(dom, 'r');
        const rPr = tmplRPr ? tmplRPr.cloneNode(true) : mk(dom, 'rPr');
        applyFmt(dom, rPr, fmt, tf, force);
        if (lang) setAttr(ensure(dom, rPr, 'lang'), 'val', lang);
        sortRPr(rPr);
        if (rPr.childNodes.length) r.appendChild(rPr);
        text.split(/(\n|\t)/).forEach(part => {
            if (part === '\n') r.appendChild(mk(dom, 'br'));
            else if (part === '\t') r.appendChild(mk(dom, 'tab'));
            else if (part) {
                const t = mk(dom, 't'); t.textContent = part;
                t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
                r.appendChild(t);
            }
        });
        return r;
    }

    /** Segmentin hedef (yoksa kaynak) metnini biçim parçalarına böler. */
    
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
                    const m = val.match(/\d+/g);
                    if (m && m.length >= 3) {
                        const hex = '#' + ((1 << 24) + (+m[0] << 16) + (+m[1] << 8) + +m[2]).toString(16).slice(1).toUpperCase();
                        fmt.color = hex;
                    }
                } else {
                    fmt.color = val.toUpperCase();
                }
            } else if (prop === 'font-size') {
                const ptMatch = val.match(/([\d.]+)\s*(pt|px)?/);
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
        if (!/<[a-zA-Z][^>]*>|<\/[a-zA-Z]+>/i.test(htmlText)) {
            return [{ text: htmlText, fmt: Object.assign({}, baseFmt) }];
        }

        const runs = [];
        const tagRegex = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
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

    function segPieces(seg, tf) {
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
        const shieldHtmlRegex = /<span class=["']?shield-badge["']?[^>]*data-shield-id=["']?(\w+)["']?[^>]*>(?:<span[^>]*class=["']?shield-num-badge["']?[^>]*>\[\d+\]<\/span>)?([\s\S]*?)<\/span>|<shield(?:\s+id=["']?(\w+)["']?)?>([\s\S]*?)<\/shield>/gi;
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
    }

    const LANG = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', ru: 'ru-RU', ar: 'ar-SA', pt: 'pt-PT', nl: 'nl-NL' };
    const langOf = (code) => code ? (LANG[String(code).toLowerCase().slice(0, 2)] || null) : null;
    const DEFAULT_TF = { font: 'Calibri', size: 11, bold: false, italic: false, underline: false, color: '#000000' };

    /* ---------------- 1) Orijinal DOCX'i yeniden yaz ---------------- */
    function rewriteParagraph(dom, p, segs, tf, lang) {
        const isMedia = (r) => [
            'w:drawing', 'w:pict', 'w:object', 'w:fldChar', 'w:instrText',
            'w:footnoteReference', 'w:endnoteReference', 'w:commentReference',
            'w:sym', 'w:lastRenderedPageBreak'
        ].some(n => r.getElementsByTagName(n).length > 0);
        const textRuns = Array.from(p.getElementsByTagName('w:r'))
            .filter(r => r.getElementsByTagName('w:t').length && !isMedia(r));
        if (!textRuns.length) return false;
        // şablon: en uzun metin run'ı (paragrafın baskın biçimi)
        let tmpl = textRuns[0], best = -1;
        for (const r of textRuns) {
            const len = Array.from(r.getElementsByTagName('w:t')).reduce((a, t) => a + t.textContent.length, 0);
            if (len > best) { best = len; tmpl = r; }
        }
        const tmplRPr = find(tmpl, 'rPr');
        const anchor = textRuns[0];
        const parent = anchor.parentNode;
        let first = true;
        segs.forEach(seg => {
            const pieces = segPieces(seg, tf);
            if (!first) parent.insertBefore(buildRun(dom, ' ', tmplRPr, tf, tf, lang), anchor);
            first = false;
            pieces.forEach(pc => parent.insertBefore(buildRun(dom, pc.text, tmplRPr, pc.fmt, tf, lang), anchor));
        });
        textRuns.forEach(r => r.parentNode && r.parentNode.removeChild(r));
        return true;
    }

    function serialize(dom) {
        const s = new XMLSerializer().serializeToString(dom).replace(/^<\?xml[^>]*\?>\s*/, '');
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + s;
    }

    async function exportFromOriginal(doc, lang) {
        const buf = await getBuffer(doc.id);
        if (!buf) throw new Error('Orijinal DOCX bulunamadı (yeniden yükleyin).');
        const zip = await global.JSZip.loadAsync(buf);
        const f = zip.file('word/document.xml');
        if (!f) throw new Error('word/document.xml yok.');
        const dom = new DOMParser().parseFromString(await f.async('string'), 'application/xml');
        if (dom.getElementsByTagName('parsererror').length) throw new Error('document.xml ayrıştırılamadı.');
        const allP = Array.from(dom.getElementsByTagName('w:p'));
        const groups = new Map(); let unmapped = 0;
        doc.segments.forEach(s => {
            if (!s.docx || s.docx.p == null || !allP[s.docx.p]) { unmapped++; return; }
            if (!groups.has(s.docx.p)) groups.set(s.docx.p, []);
            groups.get(s.docx.p).push(s);
        });
        let rewritten = 0;
        groups.forEach((segs, pIdx) => {
            const tf = (doc.docxParas && doc.docxParas[pIdx]) || DEFAULT_TF;
            if (rewriteParagraph(dom, allP[pIdx], segs, tf, lang)) rewritten++;
        });
        zip.file('word/document.xml', serialize(dom));
        const blob = await zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' });
        return { blob, rewritten, unmapped };
    }

    /* ---------------- 2) Sıfırdan geçerli DOCX üret ---------------- */
    const hex = (c) => String(c || '#000000').replace('#', '').toUpperCase();
    async function exportFromScratch(doc, opts, lang) {
        opts = opts || {};
        const fontFamily = opts.fontFamily || 'Times New Roman';
        const fontSize = opts.fontSize || 12;
        const tf = { font: fontFamily, size: fontSize, bold: false, italic: false, underline: false, color: '#000000' };
        const dom = new DOMParser().parseFromString(`<w:document xmlns:w="${W}"><w:body/></w:document>`, 'application/xml');
        const body = dom.getElementsByTagName('w:body')[0];
        const baseRPr = () => { const r = mk(dom, 'rPr'); applyFmt(dom, r, tf, {}, true); return r; };
        const tmpl = baseRPr();
        const para = (pieces, o) => {
            o = o || {};
            const p = mk(dom, 'p'); const pPr = mk(dom, 'pPr');
            const sp = mk(dom, 'spacing', { after: String(Math.round((o.after != null ? o.after : opts.paragraphSpacing || 6) * 20)), line: String(Math.round((opts.lineSpacing || 1.15) * 240)), lineRule: 'auto' });
            pPr.appendChild(sp);
            if (o.indent && opts.indentCm) pPr.appendChild(mk(dom, 'ind', { firstLine: String(Math.round(opts.indentCm * 567)) }));
            const jc = { justify: 'both', left: 'left', right: 'right', center: 'center' }[o.align || opts.alignment || 'left'];
            if (jc) pPr.appendChild(mk(dom, 'jc', { val: jc }));
            p.appendChild(pPr);
            pieces.forEach(pc => p.appendChild(buildRun(dom, pc.text, pc.tmpl || tmpl, pc.fmt || tf, pc.tf || tf, lang, !!pc.force)));
            return p;
        };
        const segP = (seg, tfLocal) => segPieces(seg, tfLocal || tf);
        const segs = doc.segments.filter(s => (s.target && s.target.trim()) || (s.source && s.source.trim()));
        const mode = opts.contentMode || 'target_only';
        
        // SMARTCAT STANDARDI: Normal dokümanlarda (DOCX/TXT/PDF) KESİNLİKLE #1 -> gibi numaralar basılmaz!
        // Sadece ve sadece kullanıcı bilinçli olarak 'subtitle_timed' seçmişse VE dosya gerçek bir altyazı dosyası ise zaman kodu basılır
        const isExplicitSubtitle = mode === 'subtitle_timed' && (doc.originalFormat === 'srt' || doc.originalFormat === 'vtt');

        if (isExplicitSubtitle) {
            segs.forEach((s, i) => {
                body.appendChild(para([{ text: `#${i + 1}  ${s.startTime || ''} \u2192 ${s.endTime || ''}`, fmt: Object.assign({}, tf, { bold: true, color: '#4338CA' }) }], { after: 2, align: 'left' }));
                body.appendChild(para(segP(s), { after: 10, align: 'left' }));
            });
        } else if (mode === 'table') {
            const tbl = mk(dom, 'tbl');
            const tblPr = mk(dom, 'tblPr'); tblPr.appendChild(mk(dom, 'tblW', { w: '5000', type: 'pct' }));
            const bd = mk(dom, 'tblBorders');
            ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach(n => bd.appendChild(mk(dom, n, { val: 'single', sz: '4', space: '0', color: 'CBD5E1' })));
            tblPr.appendChild(bd); tbl.appendChild(tblPr);
            const cell = (content, w) => { const tc = mk(dom, 'tc'); const pr = mk(dom, 'tcPr'); pr.appendChild(mk(dom, 'tcW', { w: String(w), type: 'pct' })); tc.appendChild(pr); tc.appendChild(content); return tc; };
            segs.forEach((s, i) => {
                const tr = mk(dom, 'tr');
                tr.appendChild(cell(para([{ text: String(i + 1), fmt: tf }], { after: 0, align: 'center' }), 300));
                tr.appendChild(cell(para(segPieces(Object.assign({}, s, { target: '' }), tf), { after: 0, align: 'left' }), 2350));
                tr.appendChild(cell(para(segP(s), { after: 0, align: 'left' }), 2350));
                tbl.appendChild(tr);
            });
            body.appendChild(tbl);
            body.appendChild(mk(dom, 'p'));
        } else if (mode === 'bilingual') {
            segs.forEach((s, i) => {
                body.appendChild(para([{ text: `[Kaynak ${i + 1}] ` + (s.source || ''), fmt: Object.assign({}, tf, { italic: true, color: '#475569', size: Math.max(9, fontSize - 2) }) }], { after: 2, align: 'left' }));
                body.appendChild(para(segP(s), { after: 10, align: 'left' }));
            });
        } else {
            // SMARTCAT EXPORT STANDARDI (TÜM CÜMLELER PARAGRAF AKIŞINDA BİRLEŞİR, NUMARA YOK)
            if (mode === 'all_content' && doc.name) {
                body.appendChild(para([{ text: doc.name.replace(/\.[^/.]+$/, ''), fmt: Object.assign({}, tf, { bold: true, size: opts.headingSize || 16, color: opts.headingColor || '#000000' }) }], { align: 'center', after: 14 }));
            }
            const head = (s) => (s.isHeading || (typeof global.isLikelyHeading === 'function' && global.isLikelyHeading((s.target || s.source || '').trim())));

            // SMARTCAT KUSURSUZ PARAGRAF MODELİ: Cümleler ait oldukları paragrafta tek boşlukla birleşir, alt satıra atlanmaz
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
                    const hardBreak = prev && (prev.endsParagraph || (prev.source && /\n\s*$/.test(prev.source)) || (prev.target && /\n\s*$/.test(prev.target)));
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
            });
        }
        const cm = (opts.marginCm || 2.5) * 567;
        const sect = mk(dom, 'sectPr');
        sect.appendChild(mk(dom, 'pgSz', { w: '11906', h: '16838' }));
        sect.appendChild(mk(dom, 'pgMar', { top: String(Math.round(cm)), right: String(Math.round(cm)), bottom: String(Math.round(cm)), left: String(Math.round(cm)), header: '708', footer: '708', gutter: '0' }));
        body.appendChild(sect);

        const zip = new global.JSZip();
        zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
        zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${esc(fontFamily)}" w:hAnsi="${esc(fontFamily)}" w:cs="${esc(fontFamily)}" w:eastAsia="${esc(fontFamily)}"/><w:sz w:val="${Math.round(fontSize * 2)}"/><w:szCs w:val="${Math.round(fontSize * 2)}"/><w:lang w:val="${lang || 'en-US'}"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`);
        zip.file('word/document.xml', serialize(dom));
        const blob = await zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' });
        return { blob, rewritten: segs.length, unmapped: 0 };
    }

    function download(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /** Ana giriş: gerçek .docx üretir ve indirir. */
    async function exportDoc(doc, opts, targetLangCode) {
        if (!global.JSZip) throw new Error('JSZip yüklü değil.');
        const lang = langOf(targetLangCode);
        const base = doc.name ? doc.name.replace(/\.[^/.]+$/, '') : 'Ceviri';
        const hasOrig = doc.hasOriginalDocx && (await getBuffer(doc.id));
        const res = hasOrig ? await exportFromOriginal(doc, lang) : await exportFromScratch(doc, opts, lang);
        const fileName = `${base}_Ceviri.docx`;
        download(res.blob, fileName);
        return { fileName, mode: hasOrig ? 'original' : 'scratch', rewritten: res.rewritten, unmapped: res.unmapped };
    }

    global.DocxExport = { bind, exportDoc, getBuffer, applyFmt, buildRun, segPieces };
})(window);

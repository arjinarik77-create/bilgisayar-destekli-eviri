/* ==========================================================
   AKILLI BİÇİMLENDİRME KALKANI (Smart Formatting Shield)
   ----------------------------------------------------------
   VERİ MODELİ (segment.fmt):
   {
     base:    Fmt,                         // segmentin baskın (temel) biçimi
     baseDiffers: bool,                    // temel biçim belge varsayılanından farklı mı
     shields: [{ id, color, fmt: Fmt }],   // her farklı stil grubu için bir kalkan
     srcRuns: [{ start, end, shieldId }],  // kaynak metindeki kalkanlı aralıklar
     tgtRuns: [{ start, end, shieldId|null, fmt?, ignored? }], // hedef aralıkları
     ignoreMissing: { [shieldId]: true }
   }
   Fmt = { font, size(pt), bold, italic, underline, color(#RRGGBB) }
   ========================================================== */
(function (global) {
    'use strict';

    const PALETTE = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#DB2777', '#0891B2', '#CA8A04', '#4F46E5'];

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const save = () => { if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave(); };

    /* ---------------- Biçim yardımcıları ---------------- */
    function fmtKey(f) {
        return [(f.font || '').toLowerCase(), +f.size || 0, f.bold ? 1 : 0, f.italic ? 1 : 0, f.underline ? 1 : 0,
            (f.color || '#000000').toUpperCase()].join('|');
    }
    function fmtSummary(f) {
        return `Font: ${f.font}, Size: ${f.size}pt, Weight: ${f.bold ? 'Bold' : 'Regular'}, ` +
            `Style: ${f.italic ? 'Italic' : 'Normal'}${f.underline ? ', Underline' : ''}, Color: ${(f.color || '#000000').toUpperCase()}`;
    }
    /** `base`e göre farklı olan özellikleri CSS olarak üretir (UI ve export ortak). */
    function cssDiff(f, base) {
        const b = base || {};
        const out = [];
        if (f.font && f.font !== b.font) out.push(`font-family:'${String(f.font).replace(/'/g, '')}'`);
        if (f.size && f.size !== b.size) out.push(`font-size:${f.size}pt`);
        if (!!f.bold !== !!b.bold) out.push(`font-weight:${f.bold ? 'bold' : 'normal'}`);
        if (!!f.italic !== !!b.italic) out.push(`font-style:${f.italic ? 'italic' : 'normal'}`);
        if (!!f.underline !== !!b.underline) out.push(`text-decoration:${f.underline ? 'underline' : 'none'}`);
        if ((f.color || '').toUpperCase() !== (b.color || '').toUpperCase()) out.push(`color:${f.color}`);
        return out.join(';');
    }
    function cssFull(f) {
        return cssDiff(f, { font: '', size: 0, bold: false, italic: false, underline: false, color: '' });
    }

    /* ---------------- SVG kalkan (beşgen + "i") / Amber Tag Rozeti ---------------- */
    function shieldSvg(color) {
        return `<svg viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
            `<path d="M1.5 2 H14.5 V9.5 L8 16.5 L1.5 9.5 Z" fill="${color}" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>` +
            `<circle cx="8" cy="5.6" r="1.05" fill="#fff"/><rect x="7.2" y="7.5" width="1.6" height="4.6" rx=".6" fill="#fff"/></svg>`;
    }
    function shieldEl(seg, sh, side, where) {
        const num = (sh.id || '').replace(/^sh/i, '') || '1';
        return `<span class="shield-num-badge inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded text-[9px] font-extrabold font-mono text-white shadow-2xs mx-0.5 align-baseline select-none cursor-pointer" style="background-color:${sh.color || '#2563EB'};" data-fs-seg="${seg.id}" data-fs-sh="${sh.id}" data-fs-side="${side}" title="Biçim Kalkanı #${sh.id}">[${num}]</span>`;
    }

    /* ---------------- Aralık -> HTML ---------------- */
    function runsToHtml(seg, text, runs, opts) {
        opts = opts || {};
        const fm = seg.fmt;
        const sorted = (runs || []).filter(r => r.end > r.start && r.start >= 0 && r.end <= text.length)
            .sort((a, b) => a.start - b.start);
        let pos = 0, html = '';
        for (const r of sorted) {
            if (r.start < pos) continue;
            html += esc(text.slice(pos, r.start));
            const sh = r.shieldId ? fm.shields.find(s => s.id === r.shieldId) : null;
            const f = sh ? sh.fmt : (r.fmt || fm.base);
            const style = cssDiff(f, fm.base);
            const badgeBg = sh ? `${sh.color || '#2563EB'}18` : 'transparent';
            const badgeBorder = sh ? `${sh.color || '#2563EB'}60` : 'transparent';
            const num = sh ? (sh.id || '').replace(/^sh/i, '') : '1';
            const inner = `<span class="shield-badge ${sh ? 'fs-run' : 'fs-manual'} inline-flex items-center gap-1 px-1.5 py-0.5 rounded shadow-2xs" data-shield-id="${sh ? sh.id : ''}" style="${sh ? `background-color:${badgeBg};border:1px solid ${badgeBorder};` : ''}${style}">${sh && opts.shields ? shieldEl(seg, sh, 'l', opts.where) : ''}<span style="${style}">${esc(text.slice(r.start, r.end))}</span></span>`;
            html += inner;
            pos = r.end;
        }
        html += esc(text.slice(pos));
        return html;
    }

    /* ==========================================================
       1) DOCX AYRIŞTIRMA (run düzeyinde biçim çıkarma)
       ========================================================== */
    let pending = null; // { fileName, richText, paras, buffer }
    let lastCaptured = null; // attach sonrası: { fileName, buffer, paraInfo } (DocxExport.bind kullanır)
    const takeCaptured = (fileName) => { const c = lastCaptured && lastCaptured.fileName === fileName ? lastCaptured : null; lastCaptured = null; return c; };

    function kids(el, name) {
        const out = [];
        if (!el) return out;
        for (const c of el.childNodes) if (c.nodeType === 1 && c.nodeName === name) out.push(c);
        return out;
    }
    const kid = (el, n) => kids(el, n)[0] || null;
    const wval = (el) => el ? (el.getAttribute('w:val')) : null;
    const isOn = (el) => { if (!el) return undefined; const v = wval(el); return !(v === '0' || v === 'false' || v === 'off' || v === 'none'); };

    function readRPr(rPr) {
        if (!rPr) return {};
        const o = {};
        const rf = kid(rPr, 'w:rFonts');
        if (rf) { const f = rf.getAttribute('w:ascii') || rf.getAttribute('w:hAnsi') || rf.getAttribute('w:cs') || rf.getAttribute('w:eastAsia'); if (f) o.font = f; }
        const sz = kid(rPr, 'w:sz'); if (sz && wval(sz)) o.size = parseInt(wval(sz), 10) / 2;
        const b = kid(rPr, 'w:b'); if (b) o.bold = isOn(b);
        const i = kid(rPr, 'w:i'); if (i) o.italic = isOn(i);
        const u = kid(rPr, 'w:u'); if (u) o.underline = wval(u) !== 'none';
        const c = kid(rPr, 'w:color');
        if (c && wval(c)) { const v = wval(c); o.color = v === 'auto' ? '#000000' : '#' + v.toUpperCase(); }
        return o;
    }

    async function captureDocx(file, arrayBuffer) {
        if (typeof global.JSZip === 'undefined') return null;
        const zip = await global.JSZip.loadAsync(arrayBuffer);
        const docF = zip.file('word/document.xml');
        if (!docF) return null;
        const parser = new DOMParser();
        const docXml = parser.parseFromString(await docF.async('string'), 'application/xml');

        // styles.xml: docDefaults + stil zinciri (basedOn)
        const styles = {};
        let defaults = { font: 'Calibri', size: 11, bold: false, italic: false, underline: false, color: '#000000' };
        const stF = zip.file('word/styles.xml');
        if (stF) {
            const stXml = parser.parseFromString(await stF.async('string'), 'application/xml');
            const dd = stXml.getElementsByTagName('w:docDefaults')[0];
            if (dd) defaults = Object.assign(defaults, readRPr(kid(kid(dd, 'w:rPrDefault'), 'w:rPr')));
            for (const s of stXml.getElementsByTagName('w:style')) {
                const id = s.getAttribute('w:styleId');
                styles[id] = { based: wval(kid(s, 'w:basedOn')), rpr: readRPr(kid(s, 'w:rPr')) };
            }
        }
        const styleProps = (id, depth) => {
            if (!id || !styles[id] || (depth || 0) > 8) return {};
            return Object.assign({}, styleProps(styles[id].based, (depth || 0) + 1), styles[id].rpr);
        };

        const paras = [];
        const allP = docXml.getElementsByTagName('w:p');
        for (let pIdx = 0; pIdx < allP.length; pIdx++) {
            const p = allP[pIdx];
            const pStyle = wval(kid(kid(p, 'w:pPr'), 'w:pStyle'));
            const pBase = Object.assign({}, defaults, styleProps(pStyle));
            const runs = [];
            for (const r of p.getElementsByTagName('w:r')) {
                let t = '';
                for (const c of r.childNodes) {
                    if (c.nodeType !== 1) continue;
                    if (c.nodeName === 'w:t') t += c.textContent;
                    else if (c.nodeName === 'w:tab' || c.nodeName === 'w:br') t += ' ';
                }
                if (!t) continue;
                const rPr = kid(r, 'w:rPr');
                const rStyle = rPr ? wval(kid(rPr, 'w:rStyle')) : null;
                const f = Object.assign({}, pBase, styleProps(rStyle), readRPr(rPr));
                runs.push({ text: t, fmt: { font: f.font, size: f.size, bold: !!f.bold, italic: !!f.italic, underline: !!f.underline, color: f.color } });
            }
            const text = runs.map(r => r.text).join('');
            const isHeadingStyle = pStyle && /heading|başlık|baslik|title|subtitle/i.test(pStyle);
            let headingLevel = 1;
            if (pStyle) {
                const lvlMatch = pStyle.match(/\d+/);
                if (lvlMatch) headingLevel = parseInt(lvlMatch[0], 10);
                else if (/title/i.test(pStyle)) headingLevel = 1;
                else if (/subtitle/i.test(pStyle)) headingLevel = 2;
            }
            const isBoldAll = runs.length > 0 && runs.every(r => r.fmt && r.fmt.bold);
            const isLargeSize = (pBase.size && pBase.size >= 13) || runs.some(r => r.fmt && r.fmt.size >= 13);
            const isShortTitle = text.trim().length <= 180 && !text.trim().includes('\n');
            const isHeading = Boolean(isHeadingStyle || (isBoldAll && isLargeSize && isShortTitle));
            const dominantFmt = runs[0] ? Object.assign({}, pBase, runs[0].fmt) : Object.assign({}, pBase);

            if (text.trim()) paras.push({
                runs,
                xml: pIdx,
                text,
                isHeading,
                headingLevel: isHeading ? headingLevel : 0,
                pStyle: pStyle || (isHeading ? `Heading ${headingLevel}` : 'Normal'),
                dominantFmt
            });
        }
        if (!paras.length) return null;
        const richText = paras.map(p => p.text.trim()).join('\n\n');
        // paragrafları kırpılmış metne göre yeniden hizala
        paras.forEach(p => {
            const lead = p.text.length - p.text.trimStart().length;
            const total = p.text.trim().length;
            let cut = 0; const kept = [];
            for (const r of p.runs) {
                const s = cut, e = cut + r.text.length; cut = e;
                const a = Math.max(s, lead), b = Math.min(e, lead + total);
                if (b > a) kept.push({ text: r.text.slice(a - s, b - s), fmt: r.fmt });
            }
            p.runs = kept; p.text = p.text.trim();
        });
        pending = { fileName: file.name, richText, paras, buffer: arrayBuffer };
        return richText;
    }

    const hasPending = (fileName) => Boolean(pending && pending.fileName === fileName);

    /**
     * STİL VE BİÇİMLENDİRME HAFIZASI + BAŞLIK İSTİSNA KURALI (HEADING EXCEPTION):
     * Belge içerisindeki ana başlıklar (Headings) segmentasyona uğramadan,
     * olduğu gibi ham halleriyle tek segment olarak korunur.
     */
    function buildSegments(fileName, rawText, segmentDocFn) {
        const results = [];
        let curId = 1;

        if (pending && pending.fileName === fileName && pending.paras && pending.paras.length > 0) {
            for (let pIdx = 0; pIdx < pending.paras.length; pIdx++) {
                const p = pending.paras[pIdx];
                const pText = p.text.trim();
                if (!pText) continue;

                const curParaId = p.xml != null ? p.xml : pIdx;

                if (p.isHeading) {
                    // İSTİSNA KURALI: Ana başlıklar cümlelere bölünmeden ham haliyle korunur!
                    results.push({
                        id: curId++,
                        paraId: curParaId,
                        source: pText,
                        target: '',
                        status: 'empty',
                        isHeading: true,
                        headingLevel: p.headingLevel || 1,
                        docx: { p: curParaId },
                        styleMemory: {
                            font: p.dominantFmt.font || defaults.font || 'Calibri',
                            size: p.dominantFmt.size || 14,
                            bold: true,
                            italic: Boolean(p.dominantFmt.italic),
                            underline: Boolean(p.dominantFmt.underline),
                            color: p.dominantFmt.color || '#000000',
                            isHeading: true,
                            headingLevel: p.headingLevel || 1,
                            styleName: p.pStyle || 'Heading'
                        }
                    });
                } else {
                    // Normal gövde metinleri akıllı cümle kurallarıyla segmente edilir
                    const sentences = (typeof segmentDocFn === 'function') ? segmentDocFn(pText) : [pText];
                    for (const sTxt of sentences) {
                        if (!sTxt.trim()) continue;
                        results.push({
                            id: curId++,
                            paraId: curParaId,
                            source: sTxt.trim(),
                            target: '',
                            status: 'empty',
                            isHeading: false,
                            docx: { p: curParaId },
                            styleMemory: {
                                font: p.dominantFmt.font || defaults.font || 'Calibri',
                                size: p.dominantFmt.size || 11,
                                bold: Boolean(p.dominantFmt.bold),
                                italic: Boolean(p.dominantFmt.italic),
                                underline: Boolean(p.dominantFmt.underline),
                                color: p.dominantFmt.color || '#000000',
                                isHeading: false,
                                styleName: p.pStyle || 'Normal'
                            }
                        });
                    }
                }
            }
            return results;
        }

        // Smartcat Modeli: Metin önce paragraflara (çift satır atlaması veya başlık) ayrılır
        const rawParas = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n{2,}/);
        for (let pIdx = 0; pIdx < rawParas.length; pIdx++) {
            const pBlock = rawParas[pIdx].trim();
            if (!pBlock) continue;

            const isMdHeading = /^#{1,6}\s+/.test(pBlock);
            const isAllCapsHeading = pBlock.length > 3 && pBlock.length < 120 && pBlock === pBlock.toUpperCase() && !/[.!?]$/.test(pBlock);
            const isChapter = /^(bölüm|chapter|part|kısım|özet|abstract|giriş|introduction|sonuç|conclusion)\b/i.test(pBlock) && pBlock.length < 120;

            if (isMdHeading || isAllCapsHeading || isChapter) {
                const cleanHead = isMdHeading ? pBlock.replace(/^#{1,6}\s+/, '') : pBlock;
                let lvl = 1;
                if (isMdHeading) {
                    const hm = pBlock.match(/^(#{1,6})/);
                    if (hm) lvl = hm[1].length;
                }
                results.push({
                    id: curId++,
                    paraId: pIdx,
                    source: cleanHead,
                    target: '',
                    status: 'empty',
                    isHeading: true,
                    headingLevel: lvl,
                    styleMemory: {
                        font: 'Segoe UI',
                        size: 16 - (lvl - 1) * 2,
                        bold: true,
                        italic: false,
                        underline: false,
                        color: '#000000',
                        isHeading: true,
                        headingLevel: lvl,
                        styleName: `Heading ${lvl}`
                    }
                });
            } else {
                // Gövde paragrafı: akıllı cümle kurallarıyla segmente edilir ama paraId korunur
                const sents = (typeof segmentDocFn === 'function') ? segmentDocFn(pBlock) : [pBlock];
                for (const s of sents) {
                    if (!s.trim()) continue;
                    results.push({
                        id: curId++,
                        paraId: pIdx,
                        source: s.trim(),
                        target: '',
                        status: 'empty',
                        isHeading: false,
                        styleMemory: {
                            font: 'Segoe UI',
                            size: 11,
                            bold: false,
                            italic: false,
                            underline: false,
                            color: '#0f172a',
                            isHeading: false,
                            styleName: 'Normal'
                        }
                    });
                }
            }
        }
        return results;
    }

    /* Segmentlere biçim grupları (kalkanlar) ata */
    function attach(segments, fileName, rawText) {
        if (!pending || pending.fileName !== fileName || pending.richText !== rawText) return 0;
        const full = pending.richText;
        const charFmt = new Array(full.length);
        let off = 0;
        const starts = []; const paraInfo = {};
        pending.paras.forEach((p, pi) => {
            starts.push(off);
            let best = null;
            let pOff = off;
            for (const r of p.runs) {
                for (let k = 0; k < r.text.length; k++) charFmt[pOff + k] = r.fmt;
                pOff += r.text.length;
                if (!best || r.text.trim().length > best.len) best = { len: r.text.trim().length, fmt: r.fmt };
            }
            paraInfo[p.xml] = best ? best.fmt : null;
            off += p.text.length + (pi < pending.paras.length - 1 ? 2 : 0);
        });
        // boşlukları normalleştirilmiş metin + indeks haritası
        let norm = ''; const map = [];
        for (let i = 0; i < full.length; i++) {
            if (/\s/.test(full[i])) { if (norm.length && norm[norm.length - 1] !== ' ') { norm += ' '; map.push(i); } }
            else { norm += full[i]; map.push(i); }
        }
        const results = [];
        let cursor = 0;
        for (const seg of segments) {
            const idx = norm.indexOf(seg.source, cursor);
            if (idx === -1) { results.push(null); continue; }
            cursor = idx + seg.source.length;
            // Gerçek DOCX dışa aktarma için paragraf eşlemesi (word/document.xml içindeki w:p sırası)
            const origPos = map[idx];
            let pi2 = 0;
            for (let q = 0; q < starts.length; q++) if (starts[q] <= origPos) pi2 = q;
            seg.docx = { p: pending.paras[pi2].xml };
            const fm = [];
            for (let k = 0; k < seg.source.length; k++) fm.push(charFmt[map[idx + k]] || null);
            results.push(fm);
        }
        // belge geneli varsayılan (en sık kullanılan) temel biçim
        const docCount = {};
        results.forEach(fm => fm && fm.forEach(f => { if (f) { const k = fmtKey(f); docCount[k] = (docCount[k] || 0) + 1; } }));
        const docBaseKey = Object.keys(docCount).sort((a, b) => docCount[b] - docCount[a])[0];

        let attached = 0;
        segments.forEach((seg, si) => {
            const fm = results[si];
            if (!fm) return;
            const src = seg.source;
            const keyOf = (i) => fm[i] ? fmtKey(fm[i]) : null;
            const cnt = {}; const fmts = {};
            for (let i = 0; i < src.length; i++) {
                if (/\s/.test(src[i]) || !fm[i]) continue;
                const k = keyOf(i); cnt[k] = (cnt[k] || 0) + 1; fmts[k] = fm[i];
            }
            const keys = Object.keys(cnt);
            if (!keys.length) return;
            const baseKey = keys.sort((a, b) => cnt[b] - cnt[a])[0];
            // her karakter için etkin anahtar (boşluk = komşular aynıysa o anahtar, yoksa temel)
            const eff = [];
            for (let i = 0; i < src.length; i++) {
                if (!/\s/.test(src[i]) && fm[i]) { eff.push(keyOf(i)); continue; }
                let l = i - 1, r = i + 1;
                while (l >= 0 && (/\s/.test(src[l]) || !fm[l])) l--;
                while (r < src.length && (/\s/.test(src[r]) || !fm[r])) r++;
                const kl = l >= 0 ? keyOf(l) : null, kr = r < src.length ? keyOf(r) : null;
                eff.push(kl && kl === kr ? kl : baseKey);
            }
            const shields = []; const srcRuns = [];
            let i = 0;
            while (i < src.length) {
                if (eff[i] === baseKey) { i++; continue; }
                let j = i; while (j < src.length && eff[j] === eff[i]) j++;
                let sh = shields.find(s => fmtKey(s.fmt) === eff[i]);
                if (!sh) {
                    sh = { id: 'sh' + (shields.length + 1), color: PALETTE[shields.length % PALETTE.length], fmt: Object.assign({}, fmts[eff[i]]) };
                    shields.push(sh);
                }
                srcRuns.push({ start: i, end: j, shieldId: sh.id });
                i = j;
            }
            const baseDiffers = baseKey !== docBaseKey;
            if (shields.length || baseDiffers) {
                seg.fmt = { base: Object.assign({}, fmts[baseKey]), baseDiffers, shields, srcRuns, tgtRuns: [], ignoreMissing: {} };
                if (shields.length) attached++;
            }
            if (fmts[baseKey]) {
                if (!seg.styleMemory) seg.styleMemory = {};
                Object.assign(seg.styleMemory, fmts[baseKey]);
            }
        });
        lastCaptured = { fileName: pending.fileName, buffer: pending.buffer, paraInfo };
        pending = null;
        return attached;
    }

    /* Altyazı belgelerindeki <i>, <b>, <u>, <em>, <strong> etiketlerini otomatik kalkanlara bağla */
    function attachSubtitleTags(segments) {
        if (!Array.isArray(segments)) return 0;
        let attached = 0;

        segments.forEach(seg => {
            const text = seg.source || '';
            if (!text || !/<(?:i|b|u|em|strong|shield)\b/i.test(text)) return;

            let cleanText = '';
            const shields = [];
            const srcRuns = [];
            const tagPattern = /<\/?(?:i|b|u|em|strong|shield)(?:\s+id=["']?(\w+)["']?)?[^>]*>/gi;

            let pos = 0;
            const activeStack = [];
            let match;

            while ((match = tagPattern.exec(text)) !== null) {
                const chunk = text.slice(pos, match.index);
                if (chunk) cleanText += chunk;

                const isClosing = match[0].startsWith('</');
                let tagName = match[0].replace(/[<\/>]/g, '').split(/\s+/)[0].toLowerCase();
                if (tagName === 'em') tagName = 'i';
                if (tagName === 'strong') tagName = 'b';
                const shieldAttr = match[1];

                if (!isClosing) {
                    const isBold = (tagName === 'b' || shieldAttr === '2' || shieldAttr === 'sh2');
                    const isItalic = (tagName === 'i' || shieldAttr === '1' || shieldAttr === 'sh1' || (!isBold && tagName !== 'u'));
                    const isUnderline = (tagName === 'u' || shieldAttr === '3' || shieldAttr === 'sh3');

                    const shId = (isItalic && !isBold && !isUnderline) ? 'sh1' : (isBold ? 'sh2' : `sh${shields.length + 1}`);
                    let sh = shields.find(s => s.id === shId);
                    if (!sh) {
                        const color = PALETTE[shields.length % PALETTE.length];
                        sh = {
                            id: shId,
                            color: color,
                            fmt: {
                                font: 'Arial', size: 10,
                                bold: isBold, italic: isItalic, underline: isUnderline,
                                color: '#000000'
                            },
                            tag: isBold ? 'b' : (isUnderline ? 'u' : 'i')
                        };
                        shields.push(sh);
                    }
                    activeStack.push({ tag: tagName, shId: shId, start: cleanText.length });
                } else {
                    for (let idx = activeStack.length - 1; idx >= 0; idx--) {
                        if (activeStack[idx].tag === tagName) {
                            const item = activeStack.splice(idx, 1)[0];
                            const endPos = cleanText.length;
                            if (endPos > item.start) {
                                srcRuns.push({ start: item.start, end: endPos, shieldId: item.shId });
                            }
                            break;
                        }
                    }
                }
                pos = tagPattern.lastIndex;
            }

            const chunk = text.slice(pos);
            if (chunk) cleanText += chunk;

            if (shields.length > 0) {
                seg.source = cleanText;
                seg.fmt = {
                    base: { font: 'Arial', size: 10, bold: false, italic: false, underline: false, color: '#000000' },
                    baseDiffers: false,
                    shields: shields,
                    srcRuns: srcRuns,
                    tgtRuns: [],
                    ignoreMissing: {}
                };
                attached++;
            }
        });

        return attached;
    }

    /* Kalkanları standart SRT/VTT etiketlerine (<i>...</i>, <b>...</b>) kayıpsız dönüştür */
    function convertShieldsToSubtitleTags(rawText, seg) {
        if (!rawText) return '';
        let text = String(rawText);

        // 1. Hedef metinde doğrudan <span class="shield-badge"... veya <shield id="1">...</shield> varsa:
        text = text.replace(/<span class=["']?shield-badge["']?[^>]*data-shield-id=["']?(\w+)["']?[^>]*>(?:<span[^>]*class=["']?shield-num-badge["']?[^>]*>\[\d+\]<\/span>)?([\s\S]*?)<\/span>|<shield(?:\s+id=["']?(\w+)["']?)?>([\s\S]*?)<\/shield>/gi, (match, shSpanId, spanContent, shTagId, tagContent) => {
            const id = shSpanId || shTagId || '1';
            const content = spanContent !== undefined ? spanContent : tagContent;
            let tag = 'i';
            if (id === '2' || id === 'sh2') tag = 'b';
            else if (id === '3' || id === 'sh3') tag = 'u';
            else if (seg && seg.fmt && seg.fmt.shields) {
                const sh = seg.fmt.shields.find(s => s.id === id || s.id === 'sh' + id || s.id === id.replace(/^sh/, ''));
                if (sh && sh.tag) tag = sh.tag;
                else if (sh && sh.fmt) {
                    if (sh.fmt.bold) tag = 'b';
                    else if (sh.fmt.underline) tag = 'u';
                    else tag = 'i';
                }
            }
            return `<${tag}>${content}</${tag}>`;
        });

        // 2. Eğer metinde <shield> kalmadıysa ama seg.fmt.tgtRuns varsa:
        if (seg && seg.fmt && Array.isArray(seg.fmt.tgtRuns) && seg.fmt.tgtRuns.length > 0 && !/<[ibu]\b/i.test(text)) {
            const sorted = seg.fmt.tgtRuns
                .filter(r => r.end > r.start && r.start >= 0 && r.end <= text.length)
                .sort((a, b) => b.start - a.start);

            for (const r of sorted) {
                let tag = 'i';
                const sh = seg.fmt.shields ? seg.fmt.shields.find(s => s.id === r.shieldId) : null;
                if (sh && sh.tag) tag = sh.tag;
                else if (sh && sh.fmt) {
                    if (sh.fmt.bold) tag = 'b';
                    else if (sh.fmt.underline) tag = 'u';
                    else tag = 'i';
                } else if (r.fmt) {
                    if (r.fmt.bold) tag = 'b';
                    else if (r.fmt.underline) tag = 'u';
                    else tag = 'i';
                }
                text = text.slice(0, r.start) + `<${tag}>` + text.slice(r.start, r.end) + `</${tag}>` + text.slice(r.end);
            }
        }

        return text;
    }

    /* ==========================================================
       2) KAYNAK / HEDEF GÖRSELLEŞTİRME & STİL HAFIZASI
       ========================================================== */
    function sourceHtml(seg) {
        const text = (seg.source || '').trim();
        let content = '';
        if (seg.fmt && seg.fmt.shields && seg.fmt.shields.length) {
            content = runsToHtml(seg, text, seg.fmt.srcRuns, { shields: true, ui: true, where: 'src' });
        } else {
            content = esc(text);
        }

        // Metin içindeki {1}, <1>, [1] gibi ham etiket numaralarını amber rozetle vurgula
        content = content.replace(/\{(\d+)\}|&lt;(\d+)&gt;|\[(\d+)\]/g, (m, g1, g2, g3) => {
            const num = g1 || g2 || g3;
            return `<span class="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-sm text-[10px] font-bold font-mono bg-amber-400 text-slate-900 shadow-2xs mx-0.5 align-baseline select-none" title="Etiket #${num}">${num}</span>`;
        });

        const sm = seg.styleMemory;
        if (sm) {
            const styles = [];
            if (sm.font) styles.push(`font-family: '${String(sm.font).replace(/'/g, '')}', sans-serif`);
            if (sm.bold || seg.isHeading) styles.push(`font-weight: 700`);
            if (sm.italic) styles.push(`font-style: italic`);
            if (sm.underline) styles.push(`text-decoration: underline`);
            if (sm.color && sm.color !== '#000000' && sm.color !== '#0f172a' && sm.color !== '#0078D4' && sm.color !== '#0284c7' && sm.color !== 'auto') {
                styles.push(`color: ${sm.color}`);
            }
            if (seg.isHeading) styles.push(`font-size: 14.5px; letter-spacing: -0.01em`);
            if (styles.length) {
                return `<span class="source-style-memory-applied" style="${styles.join('; ')}">${content}</span>`;
            }
        }
        return content;
    }

    function renderStyleBadge(seg) {
        if (!seg) return '';
        const sm = seg.styleMemory || (seg.fmt && seg.fmt.base ? seg.fmt.base : null);
        let headingHtml = '';
        if (seg.isHeading) {
            headingHtml = `
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shadow-2xs select-none"
                      title="Ana Başlık (Heading) kuralı uygulandı: Cümlelere bölünmeden orijinal ham haliyle korundu.">
                    <span class="material-symbols-outlined text-[13px]">title</span>
                    <span>BAŞLIK (H${seg.headingLevel || sm?.headingLevel || 1}) · KORUNDU</span>
                </span>
            `;
        }

        if (!sm) return headingHtml;

        const font = esc(sm.font || 'Calibri');
        const size = sm.size || 11;
        const color = esc((sm.color && sm.color !== '#0078D4' && sm.color !== '#0284c7') ? sm.color : '#000000');
        const isBold = Boolean(sm.bold);
        const isItalic = Boolean(sm.italic);
        const isUnderline = Boolean(sm.underline);

        return `
            ${headingHtml}
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 select-none shadow-2xs"
                 title="Orijinal Belge Stil Hafızası: Yazı Tipi: ${font}, Boyut: ${size}pt, Renk: ${color}">
                <span class="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-2xs" style="background-color: ${color}"></span>
                <span class="font-bold">${font}</span>
                <span class="text-slate-400">·</span>
                <span>${size}pt</span>
                ${isBold ? '<span class="text-amber-600 dark:text-amber-400 font-bold" title="Kalın">· B</span>' : ''}
                ${isItalic ? '<span class="text-sky-600 dark:text-sky-400 italic" title="İtalik">· I</span>' : ''}
                ${isUnderline ? '<span class="text-purple-600 dark:text-purple-400 underline" title="Altı Çizili">· U</span>' : ''}
            </div>
        `;
    }

    function qaIssues(seg) {
        const fm = seg.fmt;
        if (!fm || !fm.shields.length) return [];
        const target = seg.target || '';
        if (!target.trim()) return [];
        const issues = [];
        const bykey = {}; fm.shields.forEach(s => { bykey[fmtKey(s.fmt)] = s; });
        const baseKey = fmtKey(fm.base);
        fm.tgtRuns.forEach((r, idx) => {
            if (r.shieldId || r.ignored) return;
            const k = fmtKey(r.fmt || fm.base);
            if (k === baseKey) return;
            const text = target.slice(r.start, r.end);
            if (bykey[k]) issues.push({ type: 'same-format', level: 'error', runIdx: idx, shieldId: bykey[k].id, text,
                msg: `"${text}" kalkanla aynı biçime sahip ama kalkana bağlı değil.` });
            else issues.push({ type: 'extra-format', level: 'error', runIdx: idx, text,
                msg: `"${text}" kaynakta karşılığı olmayan fazladan/çakışan bir biçime sahip.` });
        });
        fm.shields.forEach(sh => {
            if (fm.ignoreMissing && fm.ignoreMissing[sh.id]) return;
            if (!fm.tgtRuns.some(r => r.shieldId === sh.id)) {
                const sample = (fm.srcRuns.filter(r => r.shieldId === sh.id).map(r => seg.source.slice(r.start, r.end))[0]) || '';
                issues.push({ type: 'missing', level: 'warn', shieldId: sh.id, text: sample,
                    msg: `"${sample}" için kalkan biçimi hedefte uygulanmamış.` });
            }
        });
        return issues;
    }

    function blockInner(seg) {
        const fm = seg.fmt;
        const chips = fm.shields.map(sh => {
            const sample = fm.srcRuns.filter(r => r.shieldId === sh.id).map(r => seg.source.slice(r.start, r.end))[0] || '';
            return `<button type="button" class="fs-chip" style="--fs-c:${sh.color}" data-fs-seg="${seg.id}" data-fs-sh="${sh.id}" data-fs-side="chip" ` +
                `onmousedown="event.preventDefault()" onclick="FormatShield.applyShield(${seg.id}, '${sh.id}')" ` +
                `title="Hedefte metni seçip tıklayın: biçim uygulanır">${shieldEl(seg, sh, 'c', 'tgt').replace('fs-shield ', 'fs-shield fs-nohover ')}` +
                `<span class="fs-chip-t">${esc(sample)}</span></button>`;
        }).join('');
        const tools = ['bold', 'italic', 'underline'].map(a =>
            `<button type="button" class="fs-tool" onmousedown="event.preventDefault()" onclick="FormatShield.applyManual(${seg.id}, '${a}')" ` +
            `title="Seçili metne manuel ${a}" style="${a === 'bold' ? 'font-weight:700' : a === 'italic' ? 'font-style:italic' : 'text-decoration:underline'}">${a[0].toUpperCase()}</button>`).join('') +
            `<button type="button" class="fs-tool" onmousedown="event.preventDefault()" onclick="FormatShield.clearSelection(${seg.id})" title="Seçili metnin biçimini temizle">⌫</button>`;
        let html = `<div class="fs-row"><span class="fs-label">${shieldSvgInline('#2563EB')} Biçim Kalkanları</span>${chips}<span style="margin-left:auto" class="fs-row">${tools}</span></div>`;
        if ((seg.target || '').trim() && fm.tgtRuns.length) {
            html += `<div class="fs-preview">${runsToHtml(seg, seg.target, fm.tgtRuns, { shields: true, ui: true, where: 'tgt' })}</div>`;
        }
        const issues = (seg.status !== 'confirmed') ? qaIssues(seg) : [];
        if (issues.length) {
            const errs = issues.filter(i => i.level === 'error');
            const lvl = errs.length ? 'error' : 'warn';
            html += `<div class="fs-qa fs-qa-${lvl}"><span>${errs.length ? '⛔' : '⚠️'}</span>` +
                `<span>Biçim QA: ${esc(issues[0].msg)}${issues.length > 1 ? ` (+${issues.length - 1} uyarı daha)` : ''}</span>` +
                `<button type="button" onclick="FormatShield.openResolveDialog([${seg.id}])">Çöz…</button></div>`;
        }
        return html;
    }
    function shieldSvgInline(c) { return `<span class="fs-shield fs-shield-sm" style="margin:0;cursor:default">${shieldSvg(c)}</span>`; }

    function targetBlockHtml(seg) {
        if (!seg.fmt || !seg.fmt.shields.length) return '';
        return `<div class="fs-block" id="fsBlock-${seg.id}">${blockInner(seg)}</div>`;
    }
    function refreshBlock(seg) {
        const el = document.getElementById(`fsBlock-${seg.id}`);
        if (el && seg.fmt) el.innerHTML = blockInner(seg);
    }

    /* ==========================================================
       3) HEDEF ARALIK YÖNETİMİ & FORMAT PAINTER
       ========================================================== */
    function getSeg(id) {
        const d = typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null;
        return d ? d.segments.find(s => s.id === id) : null;
    }
    function removeOverlap(seg, s, e) {
        const out = [];
        for (const r of seg.fmt.tgtRuns) {
            if (r.end <= s || r.start >= e) { out.push(r); continue; }
            if (r.start < s) out.push(Object.assign({}, r, { end: s }));
            if (r.end > e) out.push(Object.assign({}, r, { start: e }));
        }
        seg.fmt.tgtRuns = out;
    }
    function selectionOf(segId) {
        const ta = document.getElementById(`targetInput-${segId}`);
        if (!ta) return null;
        let s = ta.selectionStart, e = ta.selectionEnd;
        const v = ta.value;
        while (s < e && /\s/.test(v[s])) s++;
        while (e > s && /\s/.test(v[e - 1])) e--;
        return e > s ? { s, e, ta } : null;
    }
    /** Format Painter: seçili hedef metni kalkanın biçimine dönüştürür */
    function applyShield(segId, shieldId) {
        const seg = getSeg(segId); if (!seg || !seg.fmt) return;
        const sel = selectionOf(segId);
        if (!sel) { toast('Önce hedef metinde biçimlendirilecek bölümü seçin.'); return; }
        seg.target = sel.ta.value;
        removeOverlap(seg, sel.s, sel.e);
        seg.fmt.tgtRuns.push({ start: sel.s, end: sel.e, shieldId });
        seg.fmt.tgtRuns.sort((a, b) => a.start - b.start);
        refreshBlock(seg); save();
        toast('Kalkan biçimi seçili metne uygulandı.');
    }

    /**
     * Standart UI/UX Kalkan Rozeti Uygulayıcısı:
     * - contenteditable alanlarda seçimi doğrudan <span class="shield-badge" data-shield-id="sh1" style="...">[1]kelime</span> rozetine sarar.
     * - textarea alanlarında ise seçimi tespit edip seg.fmt.tgtRuns havuzuna bağlar ve canlı önizleme rozetini anında günceller.
     */
    function applyShieldBadgeToSelection(segId, shieldIndex = 1) {
        const seg = getSeg(segId);
        if (!seg) return;
        if (!seg.fmt) {
            seg.fmt = {
                base: { font: 'Calibri', size: 11, bold: false, italic: false, underline: false, color: '#000000' },
                baseDiffers: false,
                shields: [],
                srcRuns: [],
                tgtRuns: [],
                ignoreMissing: {}
            };
        }

        const shId = 'sh' + shieldIndex;
        let sh = seg.fmt.shields.find(s => s.id === shId || s.id === String(shieldIndex));
        if (!sh) {
            const c = PALETTE[(shieldIndex - 1) % PALETTE.length];
            sh = {
                id: shId,
                color: c,
                fmt: {
                    font: 'Calibri',
                    size: 11,
                    bold: shieldIndex === 2,
                    italic: shieldIndex === 1,
                    underline: shieldIndex === 3,
                    color: c
                },
                tag: shieldIndex === 2 ? 'b' : (shieldIndex === 3 ? 'u' : 'i')
            };
            seg.fmt.shields.push(sh);
        }

        const shColor = sh.color || PALETTE[0];
        const fmt = sh.fmt || {};

        // CSS Stil Özellikleri (font-family, bold, italic, color)
        const styles = [];
        if (fmt.font) styles.push(`font-family:'${String(fmt.font).replace(/'/g, '')}'`);
        if (fmt.size) styles.push(`font-size:${fmt.size}pt`);
        if (fmt.bold) styles.push('font-weight:bold');
        if (fmt.italic) styles.push('font-style:italic');
        if (fmt.underline) styles.push('text-decoration:underline');
        if (fmt.color) styles.push(`color:${fmt.color}`);

        styles.push(`background-color:${shColor}18`);
        styles.push(`border:1px solid ${shColor}60`);
        styles.push('border-radius:4px');
        styles.push('padding:1px 5px');
        styles.push('display:inline-flex');
        styles.push('align-items:center');
        styles.push('gap:3px');
        const badgeStyleStr = styles.join(';');
        const numBadgeHtml = `<span class="shield-num-badge" style="background-color:${shColor};color:#ffffff;font-size:9px;font-weight:800;font-family:monospace;border-radius:2px;padding:0 3px;line-height:14px;display:inline-block;user-select:none;">[${shieldIndex}]</span>`;

        // A) Eğer contenteditable bir alandaysak:
        const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection() : null;
        let isContentEditable = false;
        let anchorNode = sel && sel.anchorNode;
        while (anchorNode) {
            if (anchorNode.nodeType === 1 && (anchorNode.isContentEditable || anchorNode.getAttribute('contenteditable') === 'true')) {
                isContentEditable = true;
                break;
            }
            anchorNode = anchorNode.parentNode;
        }

        if (isContentEditable && sel && !sel.isCollapsed && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const selectedText = range.toString();
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'shield-badge';
            badgeSpan.setAttribute('data-shield-id', shId);
            badgeSpan.setAttribute('style', badgeStyleStr);
            badgeSpan.innerHTML = `${numBadgeHtml}<span style="${styles.filter(s => !s.startsWith('background') && !s.startsWith('border') && !s.startsWith('padding') && !s.startsWith('display') && !s.startsWith('gap')).join(';')}">${selectedText}</span>`;
            range.deleteContents();
            range.insertNode(badgeSpan);
            sel.removeAllRanges();

            if (anchorNode && anchorNode.id === `targetInput-${seg.id}`) {
                seg.target = anchorNode.innerHTML;
                if (typeof global.onSegmentChange === 'function') global.onSegmentChange(seg.id, anchorNode);
            }
            refreshBlock(seg);
            save();
            toast(`🛡️ Biçim Kalkanı #${shieldIndex} uygulandı: "${selectedText}"`);
            return;
        }

        // B) Standart CAT Hedef Textarea Alanı:
        const ta = document.getElementById(`targetInput-${segId}`);
        if (ta) {
            let s = ta.selectionStart;
            let e = ta.selectionEnd;
            const val = ta.value || '';
            let selectedText = '';

            if (s !== e) {
                selectedText = val.substring(s, e);
            } else {
                const textBefore = val.slice(0, s);
                const textAfter = val.slice(s);
                const wordStartMatch = textBefore.match(/\S+$/);
                const wordEndMatch = textAfter.match(/^\S+/);
                if (wordStartMatch && wordEndMatch) {
                    s = s - wordStartMatch[0].length;
                    e = e + wordEndMatch[0].length;
                    selectedText = val.substring(s, e);
                } else if (wordStartMatch) {
                    s = s - wordStartMatch[0].length;
                    selectedText = val.substring(s, e);
                } else if (wordEndMatch) {
                    e = e + wordEndMatch[0].length;
                    selectedText = val.substring(s, e);
                }
            }

            if (selectedText) {
                removeOverlap(seg, s, e);
                seg.fmt.tgtRuns.push({ start: s, end: e, shieldId: shId });
                seg.fmt.tgtRuns.sort((a, b) => a.start - b.start);
                seg.target = ta.value;
                refreshBlock(seg);
                save();
                toast(`🛡️ Biçim Kalkanı #${shieldIndex} uygulandı: "${selectedText}"`);
            } else {
                toast('Lütfen önce hedef alanda kalkan uygulanacak bir kelime seçin.');
            }
        }
    }
    function applyManual(segId, attr) {
        const seg = getSeg(segId); if (!seg || !seg.fmt) return;
        const sel = selectionOf(segId);
        if (!sel) { toast('Önce hedef metinde bir bölüm seçin.'); return; }
        seg.target = sel.ta.value;
        const cur = seg.fmt.tgtRuns.find(r => r.start < sel.e && r.end > sel.s);
        const curFmt = cur ? (cur.shieldId ? seg.fmt.shields.find(x => x.id === cur.shieldId).fmt : cur.fmt) : seg.fmt.base;
        const nf = Object.assign({}, curFmt); nf[attr] = !nf[attr];
        removeOverlap(seg, sel.s, sel.e);
        if (fmtKey(nf) !== fmtKey(seg.fmt.base)) seg.fmt.tgtRuns.push({ start: sel.s, end: sel.e, shieldId: null, fmt: nf });
        seg.fmt.tgtRuns.sort((a, b) => a.start - b.start);
        refreshBlock(seg); save();
    }
    function clearSelection(segId) {
        const seg = getSeg(segId); if (!seg || !seg.fmt) return;
        const sel = selectionOf(segId);
        if (!sel) { toast('Önce hedef metinde bir bölüm seçin.'); return; }
        removeOverlap(seg, sel.s, sel.e); refreshBlock(seg); save();
    }
    /** Metin düzenlenince aralıkları kaydır (ortak önek/sonek farkı) */
    function onTargetEdit(seg, oldT, newT) {
        if (!seg.fmt || !seg.fmt.tgtRuns.length || oldT === newT) return;
        let p = 0; const max = Math.min(oldT.length, newT.length);
        while (p < max && oldT[p] === newT[p]) p++;
        let suf = 0;
        while (suf < max - p && oldT[oldT.length - 1 - suf] === newT[newT.length - 1 - suf]) suf++;
        const oldEnd = oldT.length - suf, newEnd = newT.length - suf, delta = newEnd - oldEnd;
        const mapStart = (x) => x < p ? x : (x >= oldEnd ? x + delta : newEnd);
        const mapEnd = (x) => x <= p ? x : (x >= oldEnd ? x + delta : p);
        seg.fmt.tgtRuns = seg.fmt.tgtRuns
            .map(r => Object.assign({}, r, { start: mapStart(r.start), end: mapEnd(r.end) }))
            .filter(r => r.end > r.start);
    }
    function resetTarget(seg) { if (seg && seg.fmt) seg.fmt.tgtRuns = []; }
    function copyFromSource(seg) {
        if (!seg || !seg.fmt) return;
        seg.fmt.tgtRuns = seg.fmt.srcRuns.map(r => ({ start: r.start, end: r.end, shieldId: r.shieldId }));
        refreshBlock(seg);
    }

    /* ==========================================================
       4) ÇÖZÜM DİYALOĞU (QA uyarısı -> akıllı öneri)
       ========================================================== */
    function collect(segs) {
        const items = [];
        segs.forEach(seg => qaIssues(seg).forEach(is => items.push({ seg, is })));
        return items;
    }
    function closeDialog() { const d = document.getElementById('fsDialogBackdrop'); if (d) d.remove(); }

    function openResolveDialog(segIds, exportCb) {
        const doc = typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null;
        const segs = segIds ? segIds.map(getSeg).filter(Boolean) : (doc ? doc.segments : []);
        const items = collect(segs);
        if (!items.length) { toast('Biçim kalkanı QA: sorun bulunamadı.'); if (exportCb) exportCb(); return; }
        closeDialog();
        const convOpts = [['base', 'Temel biçime (düz) dönüştür'], ['bold', 'Kalın yap'], ['italic', 'İtalik yap'], ['underline', 'Altı çizili yap']];
        const rows = items.map((it, n) => {
            const { seg, is } = it;
            const fm = seg.fmt;
            let controls;
            if (is.type === 'missing') {
                controls = `<select data-fs-i="${n}"><option value="keep">Şimdilik bırak (hedefte kalkanı uygulayacağım)</option><option value="ignore">Bu kalkan hedefte gerekmiyor (yoksay)</option></select>`;
            } else {
                const bindOpts = fm.shields.map(s => `<option value="bind:${s.id}" ${s.id === is.shieldId ? 'selected' : ''}>Kalkan biçimini uygula: ${esc(fmtSummary(s.fmt).slice(0, 60))}…</option>`).join('');
                const taken = new Set(fm.shields.map(s => fmtKey(s.fmt)));
                const conv = convOpts.filter(([k]) => {
                    if (k === 'base') return true;
                    const f = Object.assign({}, fm.base); f[k] = !f[k]; return !taken.has(fmtKey(f));
                }).map(([k, l]) => `<option value="conv:${k}">${l}</option>`).join('');
                controls = `<select data-fs-i="${n}"><optgroup label="Yazıyı kalkana uydur (kalkan ile değişen biçimi güncelle)">${bindOpts}</optgroup>` +
                    `<optgroup label="Hedef metni başka/uygun bir biçime dönüştür">${conv}</optgroup><option value="ignore">Yoksay</option></select>`;
            }
            return `<div class="fs-issue fs-${is.level}"><div style="font-weight:700">Segment #${seg.id} — ${esc(is.msg)}</div>` +
                `<div style="color:#64748b;font-size:11px">Kaynak: ${esc(seg.source.slice(0, 90))}${seg.source.length > 90 ? '…' : ''}</div>${controls}</div>`;
        }).join('');
        const back = document.createElement('div');
        back.id = 'fsDialogBackdrop';
        back.innerHTML = `<div class="fs-dialog" role="dialog" aria-modal="true">
            <div class="fs-dialog-head">${shieldSvgInline('#fff')}<span>Biçim Kalkanı — Stil Çakışması / QA (${items.length})</span></div>
            <div class="fs-dialog-body">${rows}</div>
            <div class="fs-dialog-foot">
                <button class="fs-btn" id="fsCancel">${exportCb ? 'İptal' : 'Kapat'}</button>
                ${exportCb ? '<button class="fs-btn" id="fsForce">Düzeltmeden Dışa Aktar</button>' : ''}
                <button class="fs-btn fs-btn-primary" id="fsApply">${exportCb ? 'Düzelt ve Dışa Aktar' : 'Seçimleri Uygula'}</button>
            </div></div>`;
        document.body.appendChild(back);
        back.addEventListener('mousedown', e => { if (e.target === back) closeDialog(); });
        back.querySelector('#fsCancel').onclick = closeDialog;
        if (exportCb) back.querySelector('#fsForce').onclick = () => { closeDialog(); exportCb(); };
        back.querySelector('#fsApply').onclick = () => {
            back.querySelectorAll('select[data-fs-i]').forEach(sel => {
                const { seg, is } = items[+sel.getAttribute('data-fs-i')];
                const fm = seg.fmt; const v = sel.value;
                if (is.type === 'missing') { if (v === 'ignore') fm.ignoreMissing[is.shieldId] = true; return; }
                const run = fm.tgtRuns[is.runIdx];
                if (!run) return;
                if (v.startsWith('bind:')) { run.shieldId = v.slice(5); delete run.fmt; }
                else if (v.startsWith('conv:')) {
                    const k = v.slice(5);
                    if (k === 'base') fm.tgtRuns[is.runIdx] = null;
                    else { const f = Object.assign({}, fm.base); f[k] = !f[k]; run.fmt = f; }
                } else if (v === 'ignore') run.ignored = true;
            });
            items.forEach(({ seg }) => { if (seg.fmt) seg.fmt.tgtRuns = seg.fmt.tgtRuns.filter(Boolean); });
            closeDialog(); save();
            if (typeof global.renderSegments === 'function') global.renderSegments();
            toast('Biçim kalkanı çözümleri uygulandı.');
            if (exportCb) exportCb();
        };
    }

    /* ==========================================================
       5) DIŞA AKTARMA DOĞRULAMA & BİÇİMLİ HTML
       ========================================================== */
    /** Kalkan stilleri esas alınarak hedef (veya hedef boşsa kaynak) HTML'i üretir; fmt yoksa null. */
    function exportHtml(seg, which) {
        const fm = seg.fmt; if (!fm) return null;
        const useTarget = which !== 'source';
        const text = useTarget ? (seg.target || '') : (seg.source || '');
        if (!text) return null;
        const runs = useTarget ? fm.tgtRuns.filter(r => {
            // kalkan silinmiş / geçersiz referansları dışla
            return !r.shieldId || fm.shields.some(s => s.id === r.shieldId);
        }) : fm.srcRuns;
        const inner = runsToHtml(seg, text, runs, { shields: false, ui: false });
        if (fm.baseDiffers) {
            const css = cssFull(fm.base);
            return css ? `<span style="${css}">${inner}</span>` : inner;
        }
        return inner;
    }
    /** Dışa aktarmadan önce tüm belgeyi doğrular; sorun varsa diyalog açıp proceed'i erteler. */
    function gateExport(doc, proceed) {
        if (!doc || !doc.segments) return true;
        const items = collect(doc.segments.filter(s => s.fmt && s.fmt.shields.length && (s.target || '').trim()));
        if (!items.length) return true;
        openResolveDialog(null, proceed);
        return false;
    }

    /* ---------------- Tooltip (hover) ---------------- */
    function initTooltip() {
        let tip = document.getElementById('fsTooltip');
        if (!tip) { tip = document.createElement('div'); tip.id = 'fsTooltip'; document.body.appendChild(tip); }
        document.addEventListener('mouseover', (e) => {
            const el = e.target.closest && e.target.closest('[data-fs-sh]');
            if (!el) return;
            const seg = getSeg(+el.getAttribute('data-fs-seg'));
            const sh = seg && seg.fmt && seg.fmt.shields.find(s => s.id === el.getAttribute('data-fs-sh'));
            if (!sh) return;
            const f = sh.fmt;
            const idx = seg.fmt.shields.indexOf(sh) + 1;
            tip.innerHTML = `<div class="fs-tt-head"><span class="fs-tt-dot" style="background:${sh.color}"></span>Biçim Kalkanı #${idx}</div>` +
                `<div class="fs-tt-row"><span>Font</span><span>${esc(f.font)}</span></div>` +
                `<div class="fs-tt-row"><span>Boyut</span><span>${f.size} pt</span></div>` +
                `<div class="fs-tt-row"><span>Weight</span><span>${f.bold ? 'Bold' : 'Regular'}</span></div>` +
                `<div class="fs-tt-row"><span>Style</span><span>${f.italic ? 'Italic' : 'Normal'}</span></div>` +
                `<div class="fs-tt-row"><span>Altı çizili</span><span>${f.underline ? 'Evet' : 'Hayır'}</span></div>` +
                `<div class="fs-tt-row"><span>Renk</span><span><i class="fs-tt-sw" style="background:${esc(f.color)}"></i>${esc((f.color || '').toUpperCase())}</span></div>` +
                `<div class="fs-tt-sum">${esc(fmtSummary(f))}</div>`;
            const r = el.getBoundingClientRect();
            tip.classList.add('fs-visible');
            const w = tip.offsetWidth, h = tip.offsetHeight;
            let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
            let y = r.top - h - 10; if (y < 8) y = r.bottom + 10;
            tip.style.left = x + 'px'; tip.style.top = y + 'px';
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest && e.target.closest('[data-fs-sh]')) tip.classList.remove('fs-visible');
        });
        document.addEventListener('scroll', () => tip.classList.remove('fs-visible'), true);
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTooltip); else initTooltip();
    }

    global.FormatShield = {
        captureDocx, attach, attachSubtitleTags, convertShieldsToSubtitleTags, sourceHtml, targetBlockHtml, refreshBlock,
        applyShield, applyShieldBadgeToSelection, applyManual, clearSelection, onTargetEdit, resetTarget, copyFromSource,
        qa: qaIssues, openResolveDialog, gateExport, exportHtml, fmtKey, fmtSummary, takeCaptured,
        hasPending, buildSegments, renderStyleBadge,
        palette: PALETTE, refreshBlockById: (id) => { const s = getSeg(id); if (s) refreshBlock(s); }
    };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

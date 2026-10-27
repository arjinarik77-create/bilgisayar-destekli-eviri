/* ==========================================================
   TM / PROJE ALIŞVERİŞİ: TMX 1.4, XLIFF 1.2 ve CSV (içe + dışa aktarma)
   ----------------------------------------------------------
   CatIO.exportTMX() / importTMX()      -> aktif projenin çeviri belleği
   CatIO.exportTMCSV() / importTMCSV()  -> Source,Target,Date
   CatIO.exportXLIFF() / importXLIFF()  -> aktif belge (kalkan biçimleri cat: ad alanıyla korunur)
   ========================================================== */
(function (global) {
    'use strict';

    const NS_CAT = 'urn:cat-tool:shield';
    const esc = (s) => String(s == null ? '' : s)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const proj = () => (typeof global.getActiveProject === 'function' ? global.getActiveProject() : null);
    const langs = () => {
        const p = proj() || {};
        return { src: (p.sourceLang || 'en').toLowerCase().slice(0, 5), tgt: (p.targetLang || 'tr').toLowerCase().slice(0, 5) };
    };
    const norm = (s) => (typeof global.normalizeString === 'function' ? global.normalizeString(s) : String(s).toLowerCase().trim());
    const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

    function download(content, fileName, mime, bom) {
        const blob = new Blob([(bom ? '\ufeff' : '') + content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    function pick(accept, cb) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = accept; inp.style.display = 'none';
        inp.onchange = () => { const f = inp.files[0]; document.body.removeChild(inp); if (f) cb(f); };
        document.body.appendChild(inp); inp.click();
    }
    const readText = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).replace(/^\ufeff/, '')); r.onerror = rej; r.readAsText(file, 'UTF-8'); });
    function parseXml(text) {
        const dom = new DOMParser().parseFromString(text, 'application/xml');
        const err = dom.getElementsByTagName('parsererror')[0];
        if (err) throw new Error('XML ayrıştırılamadı: ' + err.textContent.slice(0, 120));
        return dom;
    }

    /* ---------------- TM havuzu ---------------- */
    function tmPool() {
        const st = global.appState; if (!st) return [];
        const pid = st.activeProjectId;
        return st.translationMemory.filter(t => !pid || !t.projectId || t.projectId === pid);
    }
    /** Yinelenenleri (kaynak normu) güncelleyerek toplu TM ekleme. */
    function mergeIntoTM(pairs) {
        const st = global.appState;
        const pid = st.activeProjectId || 'proj-default';
        const index = new Map();
        st.translationMemory.forEach((t, i) => { if (!t.projectId || t.projectId === pid) index.set(t.sourceNorm || norm(t.source), i); });
        let added = 0, updated = 0;
        const now = 'İçe aktarıldı ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const fresh = [];
        pairs.forEach(p => {
            const s = (p.source || '').trim(), t = (p.target || '').trim();
            if (!s || !t) return;
            const n = norm(s);
            if (index.has(n)) {
                const e = st.translationMemory[index.get(n)];
                if (e.target !== t) { e.target = t; e.date = now; updated++; }
            } else {
                const e = { id: 'tm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), projectId: pid, source: s, target: t, date: p.date || now, sourceNorm: n };
                fresh.push(e); index.set(n, -1); added++;
            }
        });
        st.translationMemory.unshift(...fresh);
        if (typeof global.updateTMStats === 'function') global.updateTMStats();
        if (typeof global.renderTMView === 'function') global.renderTMView();
        if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
        return { added, updated };
    }

    /* ---------------- TMX ---------------- */
    function exportTMX() {
        const pool = tmPool();
        if (!pool.length) return toast('Dışa aktarılacak TM kaydı yok.');
        const { src, tgt } = langs();
        const tus = pool.map(t => `    <tu tuid="${esc(t.id)}" creationdate="${stamp()}">\n      <tuv xml:lang="${src}"><seg>${esc(t.source)}</seg></tuv>\n      <tuv xml:lang="${tgt}"><seg>${esc(t.target)}</seg></tuv>\n    </tu>`).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE tmx SYSTEM "tmx14.dtd">\n<tmx version="1.4">\n  <header creationtool="CATtool" creationtoolversion="1.0" datatype="plaintext" segtype="sentence" adminlang="en" srclang="${src}" o-tmf="CATtool" creationdate="${stamp()}"/>\n  <body>\n${tus}\n  </body>\n</tmx>\n`;
        download(xml, 'ceviri_bellegi.tmx', 'application/x-tmx+xml;charset=utf-8');
        toast(`${pool.length} kayıt TMX olarak dışa aktarıldı.`);
    }
    function tmxSegText(seg) {
        let out = '';
        const walk = (n) => {
            for (const c of n.childNodes) {
                if (c.nodeType === 3 || c.nodeType === 4) out += c.nodeValue;
                else if (c.nodeType === 1) { const nm = c.localName; if (['bpt', 'ept', 'ph', 'it', 'sub'].includes(nm)) continue; walk(c); }
            }
        };
        walk(seg); return out.replace(/\s+/g, ' ').trim();
    }
    function parseTMX(text) {
        const dom = parseXml(text);
        const hdr = dom.getElementsByTagName('header')[0];
        const srcLang = ((hdr && hdr.getAttribute('srclang')) || '').toLowerCase();
        const want = langs();
        const pairs = [];
        for (const tu of dom.getElementsByTagName('tu')) {
            const tuvs = Array.from(tu.getElementsByTagName('tuv')).map(v => ({
                lang: (v.getAttribute('xml:lang') || v.getAttribute('lang') || '').toLowerCase(),
                text: tmxSegText(v.getElementsByTagName('seg')[0] || v)
            })).filter(v => v.text);
            if (tuvs.length < 2) continue;
            const pre = (l) => l.slice(0, 2);
            let s = tuvs.find(v => srcLang && pre(v.lang) === pre(srcLang)) || tuvs[0];
            let t = tuvs.find(v => v !== s && pre(v.lang) === pre(want.tgt)) || tuvs.find(v => v !== s);
            if (pre(s.lang) === pre(want.tgt) && pre(t.lang) === pre(want.src)) { const x = s; s = t; t = x; } // yön düzelt
            pairs.push({ source: s.text, target: t.text });
        }
        return pairs;
    }
    function importTMX() {
        pick('.tmx,.xml', async (f) => {
            try {
                const pairs = parseTMX(await readText(f));
                const r = mergeIntoTM(pairs);
                toast(`TMX içe aktarıldı: ${r.added} yeni, ${r.updated} güncellenen kayıt (toplam ${pairs.length}).`);
            } catch (e) { toast('❌ TMX hatası: ' + e.message); }
        });
    }

    /* ---------------- CSV ---------------- */
    const csvCell = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    function exportTMCSV() {
        const pool = tmPool();
        if (!pool.length) return toast('Dışa aktarılacak TM kaydı yok.');
        const { src, tgt } = langs();
        const rows = [`${csvCell('Source (' + src + ')')},${csvCell('Target (' + tgt + ')')},${csvCell('Date')}`]
            .concat(pool.map(t => `${csvCell(t.source)},${csvCell(t.target)},${csvCell(t.date || '')}`));
        download(rows.join('\r\n'), 'ceviri_bellegi.csv', 'text/csv;charset=utf-8', true);
        toast(`${pool.length} kayıt CSV olarak dışa aktarıldı.`);
    }
    function parseCSV(text) {
        const first = text.split(/\r?\n/, 1)[0] || '';
        const delim = [',', ';', '\t'].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
        const rows = []; let row = [], cell = '', q = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (q) {
                if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
            } else if (c === '"') q = true;
            else if (c === delim) { row.push(cell); cell = ''; }
            else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
            else cell += c;
        }
        if (cell.length || row.length) { row.push(cell); rows.push(row); }
        return rows.filter(r => r.some(x => x.trim()));
    }
    function importTMCSV() {
        pick('.csv,.tsv,.txt', async (f) => {
            try {
                let rows = parseCSV(await readText(f));
                if (rows.length && /^(source|kaynak|src)/i.test(rows[0][0].trim())) rows = rows.slice(1);
                const pairs = rows.filter(r => r.length >= 2).map(r => ({ source: r[0], target: r[1], date: r[2] || undefined }));
                const r = mergeIntoTM(pairs);
                toast(`CSV içe aktarıldı: ${r.added} yeni, ${r.updated} güncellenen kayıt.`);
            } catch (e) { toast('❌ CSV hatası: ' + e.message); }
        });
    }

    /* ---------------- XLIFF 1.2 ---------------- */
    const fmtAttrs = (f) => `cat:font="${esc(f.font)}" cat:size="${f.size}" cat:bold="${f.bold ? 1 : 0}" cat:italic="${f.italic ? 1 : 0}" cat:underline="${f.underline ? 1 : 0}" cat:color="${esc(f.color)}"`;
    const baseStr = (f) => [f.font, f.size, f.bold ? 1 : 0, f.italic ? 1 : 0, f.underline ? 1 : 0, f.color].join('|');
    function inlineXlf(seg, text, runs) {
        const fm = seg.fmt;
        if (!fm || !runs || !runs.length) return esc(text);
        const sorted = runs.filter(r => r && r.end > r.start && r.end <= text.length).sort((a, b) => a.start - b.start);
        let pos = 0, out = '', n = 1;
        for (const r of sorted) {
            if (r.start < pos) continue;
            out += esc(text.slice(pos, r.start));
            const sh = r.shieldId ? fm.shields.find(s => s.id === r.shieldId) : null;
            const f = sh ? sh.fmt : (r.fmt || fm.base);
            out += `<g id="${n++}" ctype="x-shield"${sh ? ` cat:shield="${sh.id}"` : ''} ${fmtAttrs(f)}>${esc(text.slice(r.start, r.end))}</g>`;
            pos = r.end;
        }
        return out + esc(text.slice(pos));
    }
    function exportXLIFF() {
        const doc = typeof global.getActiveDoc === 'function' ? global.getActiveDoc() : null;
        if (!doc || !doc.segments.length) return toast('Dışa aktarılacak belge yok.');
        const { src, tgt } = langs();
        const units = doc.segments.map(s => {
            const hasT = s.target && s.target.trim();
            const state = s.status === 'confirmed' ? 'translated' : (hasT ? 'needs-review-translation' : 'new');
            const attrs = `id="${s.id}"${s.status === 'confirmed' ? ' approved="yes"' : ''}${s.fmt ? ` cat:base="${esc(baseStr(s.fmt.base))}"` : ''}${s.startTime ? ` cat:start="${esc(s.startTime)}" cat:end="${esc(s.endTime || '')}"` : ''}`;
            return `      <trans-unit ${attrs}>\n        <source xml:lang="${src}">${inlineXlf(s, s.source || '', s.fmt && s.fmt.srcRuns)}</source>` +
                (hasT ? `\n        <target xml:lang="${tgt}" state="${state}">${inlineXlf(s, s.target, s.fmt && s.fmt.tgtRuns)}</target>` : '') +
                `\n      </trans-unit>`;
        }).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:cat="${NS_CAT}">\n  <file original="${esc(doc.name)}" source-language="${src}" target-language="${tgt}" datatype="plaintext">\n    <header><tool tool-id="cattool" tool-name="CATtool" tool-version="1.0"/></header>\n    <body>\n${units}\n    </body>\n  </file>\n</xliff>\n`;
        download(xml, doc.name.replace(/\.[^/.]+$/, '') + '.xlf', 'application/x-xliff+xml;charset=utf-8');
        toast(`"${doc.name}" XLIFF 1.2 olarak dışa aktarıldı.`);
    }

    function readInline(node) {
        let text = ''; const runs = [];
        const walk = (n) => {
            for (const c of n.childNodes) {
                if (c.nodeType === 3 || c.nodeType === 4) { text += c.nodeValue; continue; }
                if (c.nodeType !== 1) continue;
                const nm = c.localName;
                if (nm === 'g' && c.getAttributeNS(NS_CAT, 'font') !== null && c.hasAttributeNS(NS_CAT, 'font')) {
                    const start = text.length; walk(c);
                    runs.push({ start, end: text.length, shieldKey: c.getAttributeNS(NS_CAT, 'shield') || '', fmt: attrsToFmt(c) });
                } else if (['x', 'bx', 'ex', 'ph', 'bpt', 'ept', 'it', 'mrk', 'g'].includes(nm)) { if (nm === 'g' || nm === 'mrk') walk(c); }
                else walk(c);
            }
        };
        walk(node);
        return { text, runs };
    }
    function attrsToFmt(c) {
        const a = (n) => c.getAttributeNS(NS_CAT, n);
        return { font: a('font') || 'Calibri', size: parseFloat(a('size')) || 11, bold: a('bold') === '1', italic: a('italic') === '1', underline: a('underline') === '1', color: a('color') || '#000000' };
    }
    function parseXLIFF(textXml) {
        const dom = parseXml(textXml);
        const file = dom.getElementsByTagName('file')[0];
        if (!file) throw new Error('XLIFF <file> bulunamadı.');
        const segs = []; const confirmedPairs = [];
        const FS = global.FormatShield;
        let id = 1;
        for (const tu of dom.getElementsByTagName('trans-unit')) {
            const sNode = tu.getElementsByTagName('source')[0]; if (!sNode) continue;
            const tNode = tu.getElementsByTagName('target')[0];
            const s = readInline(sNode), t = tNode ? readInline(tNode) : { text: '', runs: [] };
            const approved = tu.getAttribute('approved') === 'yes' || /^(translated|final|signed-off)$/.test(tNode ? tNode.getAttribute('state') || '' : '');
            const seg = { id: id++, source: s.text.trim(), target: t.text, status: approved && t.text.trim() ? 'confirmed' : (t.text.trim() ? 'draft' : 'empty') };
            const cs = tu.getAttributeNS(NS_CAT, 'start'), ce = tu.getAttributeNS(NS_CAT, 'end');
            if (cs) { seg.startTime = cs; seg.endTime = ce; seg.durationSec = Math.max(0.1, (global.parseSrtTimestampToSeconds ? global.parseSrtTimestampToSeconds(ce) - global.parseSrtTimestampToSeconds(cs) : 3)); }
            if (!seg.source) continue;
            // kalkanlar (kaynak g'lerinden), hedef aralıklar anahtar eşlemesiyle
            const baseRaw = tu.getAttributeNS(NS_CAT, 'base');
            if (s.runs.length || baseRaw) {
                let base = { font: 'Calibri', size: 11, bold: false, italic: false, underline: false, color: '#000000' };
                if (baseRaw) { const p = baseRaw.split('|'); base = { font: p[0], size: parseFloat(p[1]), bold: p[2] === '1', italic: p[3] === '1', underline: p[4] === '1', color: p[5] }; }
                const pal = (FS && FS.palette) || ['#2563EB'];
                const shields = []; const keyOf = (f) => FS.fmtKey(f);
                const shieldFor = (fmt) => { let sh = shields.find(x => keyOf(x.fmt) === keyOf(fmt)); if (!sh) { sh = { id: 'sh' + (shields.length + 1), color: pal[shields.length % pal.length], fmt: Object.assign({}, fmt) }; shields.push(sh); } return sh; };
                const srcRuns = s.runs.map(r => ({ start: r.start, end: r.end, shieldId: shieldFor(r.fmt).id }));
                const tgtRuns = t.runs.map(r => {
                    const known = shields.find(x => keyOf(x.fmt) === keyOf(r.fmt));
                    return known ? { start: r.start, end: r.end, shieldId: known.id } : { start: r.start, end: r.end, shieldId: null, fmt: r.fmt };
                });
                seg.fmt = { base, baseDiffers: false, shields, srcRuns, tgtRuns, ignoreMissing: {} };
            }
            if (seg.status === 'confirmed') confirmedPairs.push({ source: seg.source, target: seg.target.trim() });
            segs.push(seg);
        }
        if (!segs.length) throw new Error('İçe aktarılacak trans-unit bulunamadı.');
        return { name: (file.getAttribute('original') || 'belge') , segs, confirmedPairs, srcLang: file.getAttribute('source-language'), tgtLang: file.getAttribute('target-language') };
    }
    function importXLIFF() {
        pick('.xlf,.xliff,.sdlxliff,.xml', async (f) => {
            try {
                const r = parseXLIFF(await readText(f));
                const p = proj();
                if (p && r.srcLang && !p.sourceLang) p.sourceLang = r.srcLang.slice(0, 2);
                if (p && r.tgtLang && !p.targetLang) p.targetLang = r.tgtLang.slice(0, 2);
                global.addNewDoc(r.name.replace(/\.xlf$|\.xliff$/i, '') + '.xlf', r.segs.map(s => s.source).join('\n\n'), r.segs);
                if (r.confirmedPairs.length) mergeIntoTM(r.confirmedPairs);
                toast(`XLIFF içe aktarıldı: ${r.segs.length} segment, ${r.confirmedPairs.length} onaylı çeviri TM'e eklendi.`);
            } catch (e) { toast('❌ XLIFF hatası: ' + e.message); }
        });
    }

    global.CatIO = { exportTMX, importTMX, exportTMCSV, importTMCSV, exportXLIFF, importXLIFF, parseTMX, parseCSV, parseXLIFF, mergeIntoTM };
})(window);

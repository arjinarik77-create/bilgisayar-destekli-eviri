/* ==========================================================
   SEGMENT İŞLEMLERİ: Bölme (Ctrl+Shift+S), Birleştirme (Ctrl+Shift+M),
   Otomatik Yayılma (Auto-Propagation)
   ----------------------------------------------------------
   Kalkan verileri (seg.fmt.shields / srcRuns / tgtRuns) bölme ve birleştirmede
   aralık ofsetleri yeniden hesaplanarak korunur; seg.docx paragraf eşlemesi taşınır.
   ========================================================== */
(function (global) {
    'use strict';

    const toast = (m) => { if (typeof global.showToast === 'function') global.showToast(m); };
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const docNow = () => global.getActiveDoc();
    const norm = (s) => (typeof global.normalizeString === 'function' ? global.normalizeString(s) : String(s).trim().toLowerCase());
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const keyOf = (f) => global.FormatShield.fmtKey(f);

    const style = document.createElement('style');
    style.textContent = `
    .co-words { line-height: 2.3; font-size: 13px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
    .co-gap { display: inline-block; width: 14px; height: 18px; margin: 0 1px; border-radius: 4px; vertical-align: middle; cursor: pointer; position: relative; transition: all .12s; }
    .co-gap:hover { background: #bfdbfe; }
    .co-gap.co-on { background: #2563eb; width: 18px; }
    .co-gap.co-on::after { content: '\\2702'; color: #fff; font-size: 11px; position: absolute; left: 3px; top: 0; line-height: 18px; }
    .co-half { padding: 6px 8px; border-radius: 8px; background: #fff; border: 1px dashed #cbd5e1; font-size: 12px; min-height: 28px; }
    .co-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; font-family: ui-monospace, Consolas, monospace; }
    `;
    document.head.appendChild(style);

    /* ---------------- Yardımcılar ---------------- */
    /** text.slice(a,b) alır, kırpar ve ilgili aralıkları yeni ofsetlere taşır. */
    function cutRuns(text, runs, a, b) {
        const raw = text.slice(a, b);
        const lead = raw.length - raw.trimStart().length;
        const out = raw.trim();
        const res = [];
        (runs || []).forEach(r => {
            const s = Math.max(r.start, a), e = Math.min(r.end, b);
            if (e <= s) return;
            const ns = Math.max(0, s - a - lead), ne = Math.min(out.length, e - a - lead);
            if (ne > ns) res.push(Object.assign({}, r, { start: ns, end: ne }));
        });
        return { text: out, runs: res };
    }
    function newId(doc) { return doc.segments.reduce((m, s) => Math.max(m, +s.id || 0), 0) + 1; }
    function finish(doc, focusSegId) {
        const per = typeof global.SEGMENTS_PER_PAGE !== 'undefined' ? global.SEGMENTS_PER_PAGE : 10;
        doc.totalPages = Math.max(1, Math.ceil(doc.segments.length / per));
        const idx = doc.segments.findIndex(s => s.id === focusSegId);
        if (idx >= 0) doc.currentPage = Math.floor(idx / per) + 1;
        global.renderSegments();
        if (typeof global.updateProgressStats === 'function') global.updateProgressStats();
        if (typeof global.debouncedAutoSave === 'function') global.debouncedAutoSave();
        setTimeout(() => { const el = document.getElementById(`targetInput-${focusSegId}`); if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 60);
    }
    function resetDerived(s) {
        s.status = (s.target && s.target.trim()) ? 'draft' : 'empty';
        delete s.isAutoFilled; s.geminiDraft = null; s.tmSuggestion = null;
    }

    /* ==========================================================
       BÖLME
       ========================================================== */
    /** Segmenti kaynakta `sPos`, hedefte `tPos` konumunda ikiye böler. */
    function splitSegment(segId, sPos, tPos) {
        const doc = docNow(); if (!doc) return false;
        const i = doc.segments.findIndex(s => s.id === segId); if (i < 0) return false;
        const seg = doc.segments[i];
        const srcText = seg.source || '', tgtText = seg.target || '';
        if (sPos <= 0 || sPos >= srcText.length) { toast('Geçerli bir bölme noktası seçin.'); return false; }
        const fm = seg.fmt;
        const sA = cutRuns(srcText, fm ? fm.srcRuns : [], 0, sPos), sB = cutRuns(srcText, fm ? fm.srcRuns : [], sPos, srcText.length);
        const hasT = tgtText.trim().length > 0;
        const tp = hasT ? Math.min(Math.max(tPos, 0), tgtText.length) : 0;
        const tA = hasT ? cutRuns(tgtText, fm ? fm.tgtRuns : [], 0, tp) : { text: '', runs: [] };
        const tB = hasT ? cutRuns(tgtText, fm ? fm.tgtRuns : [], tp, tgtText.length) : { text: '', runs: [] };

        const mkFmt = (srcRuns, tgtRuns) => {
            if (!fm) return undefined;
            const used = new Set(srcRuns.concat(tgtRuns).map(r => r.shieldId).filter(Boolean));
            const shields = fm.shields.filter(s => used.has(s.id)).map(clone);
            if (!shields.length && !fm.baseDiffers) return undefined;
            return { base: clone(fm.base), baseDiffers: fm.baseDiffers, shields, srcRuns, tgtRuns, ignoreMissing: {} };
        };
        const B = Object.assign({}, seg, { id: newId(doc), source: sB.text, target: tB.text, fmt: mkFmt(sB.runs, tB.runs), docx: seg.docx ? clone(seg.docx) : undefined });
        seg.source = sA.text; seg.target = tA.text; seg.fmt = mkFmt(sA.runs, tA.runs);
        if (!seg.fmt) delete seg.fmt; if (!B.fmt) delete B.fmt; if (!B.docx) delete B.docx;
        // altyazı zamanları: kaynak uzunluğuna oranla böl
        if (seg.startTime && typeof global.parseSrtTimestampToSeconds === 'function') {
            const t0 = global.parseSrtTimestampToSeconds(seg.startTime), t1 = global.parseSrtTimestampToSeconds(seg.endTime);
            const mid = t0 + (t1 - t0) * (sA.text.length / Math.max(1, sA.text.length + sB.text.length));
            B.startTime = global.formatSecondsToSrtTimestamp(mid); B.endTime = seg.endTime;
            seg.endTime = B.startTime; seg.durationSec = Math.max(0.1, mid - t0); B.durationSec = Math.max(0.1, t1 - mid);
        }
        resetDerived(seg); resetDerived(B);
        doc.segments.splice(i + 1, 0, B);
        // boş kalan yeni segmentler için TM tarama (birebir eşleşme otomatik dolar)
        if (typeof global.scanAndApplyTMToSegments === 'function') global.scanAndApplyTMToSegments([seg, B].filter(s => !s.target));
        finish(doc, seg.id);
        toast(`Segment #${seg.id} ikiye bölündü (yeni: #${B.id}). Kalkan verileri korundu.`);
        return true;
    }

    function openSplit(segId) {
        const doc = docNow(); const seg = doc && doc.segments.find(s => s.id === segId); if (!seg) return;
        const src = seg.source || '';
        const ta = document.getElementById(`targetInput-${segId}`);
        const tgt = ta ? ta.value : (seg.target || '');
        const cur = ta ? ta.selectionStart : 0;
        // aday boşluk konumları (kelime sınırları)
        const gaps = []; const re = /\s+/g; let m;
        while ((m = re.exec(src))) if (m.index > 0 && m.index + m[0].length < src.length) gaps.push(m.index);
        if (!gaps.length) { toast('Bu segment bölünemeyecek kadar kısa.'); return; }
        const ratio = tgt.trim() ? Math.min(0.95, Math.max(0.05, cur / Math.max(1, tgt.length))) : 0.5;
        let sel = gaps.reduce((best, g) => Math.abs(g / src.length - ratio) < Math.abs(best / src.length - ratio) ? g : best, gaps[0]);
        // hedef bölme konumu: imleç; boş/uç ise orana göre en yakın boşluk
        let tPos = cur;
        if (tgt.trim() && (tPos <= 0 || tPos >= tgt.length)) {
            const tg = []; const r2 = /\s+/g; let mm; while ((mm = r2.exec(tgt))) tg.push(mm.index);
            tPos = tg.length ? tg.reduce((b, g) => Math.abs(g / tgt.length - 0.5) < Math.abs(b / tgt.length - 0.5) ? g : b, tg[0]) : Math.floor(tgt.length / 2);
        }

        const old = document.getElementById('coSplitBackdrop'); if (old) old.remove();
        const back = document.createElement('div'); back.id = 'coSplitBackdrop'; back.className = 'fs-dialog-backdrop-co';
        back.style.cssText = 'position:fixed;inset:0;z-index:99991;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center';
        back.innerHTML = `<div class="fs-dialog" role="dialog" aria-modal="true">
            <div class="fs-dialog-head">\u2702 Segmenti Böl — #${seg.id}</div>
            <div class="fs-dialog-body">
                <div class="co-tag">Kaynak bölme noktası (boşluklara tıklayın)</div>
                <div class="co-words" id="coWords"></div>
                <div class="co-tag">Önizleme</div>
                <div class="co-half" id="coHalfA"></div><div class="co-half" id="coHalfB"></div>
                <div class="co-tag" style="text-transform:none">Hedef metin, düzenleyicideki imleç konumundan bölünür${tgt.trim() ? '' : ' (hedef boş)'}.</div>
            </div>
            <div class="fs-dialog-foot"><button class="fs-btn" id="coCancel">İptal</button><button class="fs-btn fs-btn-primary" id="coOk">Böl (Enter)</button></div></div>`;
        document.body.appendChild(back);
        const words = back.querySelector('#coWords');
        const paint = () => {
            let html = '', pos = 0;
            gaps.forEach(g => {
                html += esc(src.slice(pos, g)) + `<span class="co-gap ${g === sel ? 'co-on' : ''}" data-g="${g}" title="Buradan böl"></span>`;
                pos = g;
            });
            html += esc(src.slice(pos));
            words.innerHTML = html;
            back.querySelector('#coHalfA').innerHTML = `<b>A:</b> ${esc(src.slice(0, sel).trim())} <span style="color:#64748b">${tgt.trim() ? '→ ' + esc(tgt.slice(0, tPos).trim()) : ''}</span>`;
            back.querySelector('#coHalfB').innerHTML = `<b>B:</b> ${esc(src.slice(sel).trim())} <span style="color:#64748b">${tgt.trim() ? '→ ' + esc(tgt.slice(tPos).trim()) : ''}</span>`;
        };
        paint();
        words.addEventListener('click', e => { const g = e.target.closest('.co-gap'); if (g) { sel = +g.dataset.g; paint(); } });
        const close = () => { back.remove(); document.removeEventListener('keydown', onKey, true); };
        const ok = () => { close(); splitSegment(segId, sel, tPos); };
        const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); ok(); } };
        document.addEventListener('keydown', onKey, true);
        back.querySelector('#coCancel').onclick = close;
        back.querySelector('#coOk').onclick = ok;
        back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    }

    /* ==========================================================
       BİRLEŞTİRME
       ========================================================== */
    function mergeFmt(a, b) {
        const fa = a.fmt, fb = b.fmt;
        if (!fa && !fb) return undefined;
        const base = clone((fa || fb).base);
        const shields = fa ? clone(fa.shields) : [];
        const map = {};
        const pal = global.FormatShield.palette;
        (fb ? fb.shields : []).forEach(sh => {
            const f = shields.find(x => keyOf(x.fmt) === keyOf(sh.fmt));
            if (f) { map[sh.id] = f.id; return; }
            let n = shields.length + 1; while (shields.some(x => x.id === 'sh' + n)) n++;
            const ns = { id: 'sh' + n, color: pal[shields.length % pal.length], fmt: clone(sh.fmt) };
            shields.push(ns); map[sh.id] = ns.id;
        });
        const aSrcLen = (a.source || '').length + 1;
        const aTgtLen = (a.target || '').trim() ? (a.target.length + 1) : 0;
        const srcRuns = (fa ? clone(fa.srcRuns) : []).concat((fb ? clone(fb.srcRuns) : []).map(r => Object.assign(r, { start: r.start + aSrcLen, end: r.end + aSrcLen, shieldId: r.shieldId ? map[r.shieldId] : null })));
        const tgtRuns = (fa ? clone(fa.tgtRuns) : []).concat((fb ? clone(fb.tgtRuns) : []).map(r => Object.assign(r, { start: r.start + aTgtLen, end: r.end + aTgtLen, shieldId: r.shieldId ? map[r.shieldId] : null })));
        return { base, baseDiffers: !!((fa || fb).baseDiffers), shields, srcRuns, tgtRuns, ignoreMissing: {} };
    }

    function mergeWithNext(segId) {
        const doc = docNow(); if (!doc) return false;
        const i = doc.segments.findIndex(s => s.id === segId);
        if (i < 0 || i >= doc.segments.length - 1) { toast('Birleştirilecek alttaki segment yok.'); return false; }
        const a = doc.segments[i], b = doc.segments[i + 1];
        if (a.docx && b.docx && a.docx.p !== b.docx.p) {
            toast('⚠️ Farklı DOCX paragraflarındaki segmentler birleştirilemez (belge yapısı korunur).');
            return false;
        }
        const fmt = mergeFmt(a, b);
        const aT = (a.target || '').trim(), bT = (b.target || '').trim();
        const merged = {
            source: (a.source || '').trim() + ' ' + (b.source || '').trim(),
            target: aT && bT ? a.target + ' ' + b.target : (aT ? a.target : b.target)
        };
        a.source = merged.source; a.target = merged.target;
        if (fmt) a.fmt = fmt; else delete a.fmt;
        if (a.startTime && b.endTime) { a.endTime = b.endTime; a.durationSec = (a.durationSec || 0) + (b.durationSec || 0); }
        if (!a.docx && b.docx) a.docx = clone(b.docx);
        resetDerived(a);
        doc.segments.splice(i + 1, 1);
        if (!a.target) global.scanAndApplyTMToSegments([a]);
        finish(doc, a.id);
        toast(`Segment #${a.id} ve altındaki segment birleştirildi.`);
        return true;
    }

    /* ==========================================================
       OTOMATİK YAYILMA
       ========================================================== */
    /** Onaylanan segmentle aynı kaynağa sahip boş/onaysız segmentleri doldurur. */
    function propagate(seg) {
        if (!seg || !seg.target || !seg.target.trim()) return 0;
        const proj = typeof global.getActiveProject === 'function' ? global.getActiveProject() : null;
        const docs = (proj && proj.documents && proj.documents.length) ? proj.documents : [docNow()];
        const key = norm(seg.source);
        let n = 0;
        docs.forEach(d => (d.segments || []).forEach(s => {
            if (s === seg || s.status === 'confirmed' || (s.target && s.target.trim())) return;
            if (norm(s.source) !== key) return;
            s.target = seg.target; s.status = 'draft'; s.isAutoFilled = true; s.propagated = true; s.geminiDraft = null;
            if (s.fmt) {
                s.fmt.tgtRuns = [];
                (seg.fmt ? seg.fmt.tgtRuns : []).forEach(r => {
                    const sh = r.shieldId && seg.fmt.shields.find(x => x.id === r.shieldId);
                    const f = sh ? sh.fmt : r.fmt;
                    const same = f && s.fmt.shields.find(x => keyOf(x.fmt) === keyOf(f));
                    s.fmt.tgtRuns.push(same ? { start: r.start, end: r.end, shieldId: same.id } : { start: r.start, end: r.end, shieldId: null, fmt: clone(f) });
                });
            }
            n++;
        }));
        if (n) toast(`Otomatik yayılma: ${n} eşdeğer segment dolduruldu.`);
        return n;
    }

    /** onSegmentKeydown başında çağrılır; true dönerse olay işlenmiştir. */
    function handleKey(e, segId) {
        if (!(e.ctrlKey || e.metaKey) || !e.shiftKey || e.altKey) return false;
        const k = (e.key || '').toLowerCase();
        if (k === 's') { e.preventDefault(); openSplit(segId); return true; }
        if (k === 'm') { e.preventDefault(); mergeWithNext(segId); return true; }
        return false;
    }

    global.CatOps = { handleKey, openSplit, splitSegment, mergeWithNext, propagate, cutRuns };
})(window);

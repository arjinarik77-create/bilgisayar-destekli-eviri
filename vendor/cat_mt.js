/* ==========================================================
   MT DAYANIKLILIĞI: Retry + Exponential Backoff + AbortController + Kuyruk
   ----------------------------------------------------------
   CatMT.fetch(url, init, { tag, retries, baseDelay, maxDelay, timeout })
     - 429 ve 5xx ile ağ hatalarında yeniden dener (Retry-After desteklenir)
     - Gecikme: min(maxDelay, baseDelay * 2^n) * (0.5..1 jitter)
     - Aynı `tag` ile yeni tur başlatılınca eskisi iptal edilir (AbortController)
     - Eşzamanlılık sınırı + istekler arası minimum aralık (basit kuyruk)
   ========================================================== */
(function (global) {
    'use strict';

    const CFG = { concurrency: 2, minGapMs: 120, retries: 4, baseDelay: 800, maxDelay: 15000, timeout: 30000 };
    const controllers = new Map(); // tag -> { ctl, token }
    const queue = [];
    let running = 0, lastStart = 0, tokenSeq = 0;
    const stats = { ok: 0, retried: 0, failed: 0, aborted: 0 };
    let lastNote = 0;

    const note = (msg) => {
        const now = Date.now();
        if (now - lastNote < 1500) return;
        lastNote = now;
        if (typeof global.showToast === 'function') global.showToast(msg);
    };
    const sleep = (ms, signal) => new Promise((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });

    /** Etiket için yeni tur: öncekini iptal eder; geçerlilik jetonu döndürür. */
    function newRound(tag) {
        const prev = controllers.get(tag);
        if (prev) prev.ctl.abort();
        const token = ++tokenSeq;
        controllers.set(tag, { ctl: new AbortController(), token });
        return token;
    }
    const isCurrent = (tag, token) => { const c = controllers.get(tag); return !!c && c.token === token && !c.ctl.signal.aborted; };
    function cancel(tag) { const c = controllers.get(tag); if (c) c.ctl.abort(); }
    function cancelAll() {
        controllers.forEach(c => c.ctl.abort());
        queue.splice(0).forEach(t => t.reject(new DOMException('Aborted', 'AbortError')));
    }

    function pump() {
        while (running < CFG.concurrency && queue.length) {
            const wait = Math.max(0, lastStart + CFG.minGapMs - Date.now());
            const task = queue.shift();
            running++;
            setTimeout(() => {
                lastStart = Date.now();
                task.run().then(task.resolve, task.reject).finally(() => { running--; pump(); });
            }, wait);
        }
    }
    const enqueue = (run) => new Promise((resolve, reject) => { queue.push({ run, resolve, reject }); pump(); });

    async function attempt(url, init, o, signal) {
        const tctl = new AbortController();
        const timer = setTimeout(() => tctl.abort(), o.timeout);
        const onAbort = () => tctl.abort();
        if (signal) { if (signal.aborted) tctl.abort(); else signal.addEventListener('abort', onAbort, { once: true }); }
        try { return await fetch(url, Object.assign({}, init, { signal: tctl.signal })); }
        finally { clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); }
    }

    async function request(url, init, o) {
        const entry = o.tag ? controllers.get(o.tag) : null;
        const signal = entry ? entry.ctl.signal : null;
        let lastErr = null, lastRes = null;
        for (let n = 0; n <= o.retries; n++) {
            if (signal && signal.aborted) { stats.aborted++; throw new DOMException('Aborted', 'AbortError'); }
            let delay = Math.min(o.maxDelay, o.baseDelay * Math.pow(2, n)) * (0.5 + Math.random() * 0.5);
            try {
                const res = await attempt(url, init, o, signal);
                if (res.status !== 429 && res.status < 500) { stats.ok++; return res; }
                lastRes = res; lastErr = null;
                const ra = parseFloat(res.headers.get('Retry-After'));
                if (!isNaN(ra)) delay = Math.min(o.maxDelay, Math.max(delay, ra * 1000));
                if (n < o.retries) note(`MT: HTTP ${res.status} — ${(delay / 1000).toFixed(1)} sn sonra yeniden denenecek (${n + 1}/${o.retries})`);
            } catch (e) {
                if (signal && signal.aborted) { stats.aborted++; throw new DOMException('Aborted', 'AbortError'); }
                lastErr = e; // zaman aşımı veya ağ hatası
                if (n < o.retries) note(`MT: bağlantı hatası — yeniden deneniyor (${n + 1}/${o.retries})`);
            }
            if (n < o.retries) { stats.retried++; await sleep(delay, signal); }
        }
        stats.failed++;
        if (lastRes) return lastRes; // çağıran res.ok kontrolüyle düşer
        throw lastErr || new Error('MT isteği başarısız');
    }

    function mtFetch(url, init, opts) {
        const o = Object.assign({}, CFG, opts || {});
        return enqueue(() => request(url, init || {}, o));
    }

    global.CatMT = { fetch: mtFetch, newRound, isCurrent, cancel, cancelAll, stats, config: CFG };
})(window);

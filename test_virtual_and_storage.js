/* ==========================================================
   VIRTUAL SCROLLING, STORAGE & UI UNIT TEST SUITE (Node.js)
   ========================================================== */

const assert = require('assert');

// 1. DUMMY DOM ORTAMI (Node.js testleri için minimal mock)
global.window = global;
global.document = {
    createElement(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
                contains(c) { return this.classes.has(c); }
            },
            children: [],
            appendChild(child) { this.children.push(child); return child; },
            removeChild(child) {
                const idx = this.children.indexOf(child);
                if (idx !== -1) this.children.splice(idx, 1);
            },
            innerHTML: '',
            setAttribute(k, v) { this[k] = v; },
            getAttribute(k) { return this[k]; },
            getBoundingClientRect() { return { height: 180, width: 800 }; },
            addEventListener() {},
            removeEventListener() {}
        };
    },
    createDocumentFragment() {
        return {
            children: [],
            appendChild(c) { this.children.push(c); }
        };
    },
    documentElement: {
        attributes: {},
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); }
        },
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k]; }
    },
    getElementById(id) {
        return null;
    }
};

global.requestAnimationFrame = (fn) => setTimeout(fn, 0);

// Load vendor scripts
require('./vendor/cat_virtual_scroll.js');
require('./vendor/cat_ui_enhancements.js');

console.log('='.repeat(65));
console.log('⚡ VIRTUAL SCROLLING & UI ENHANCEMENTS UNIT TESTLERİ');
console.log('='.repeat(65));

// TEST 1: SANAL KAYDIRMA MOTORU 10.000+ SEGMENT BELLEK & HESAPLAMA TESTİ
{
    console.log('\n--- TEST 1: VirtualScroller (10.000 Segment Kapasitesi) ---');
    const container = document.createElement('div');
    container.scrollTop = 0;
    container.clientHeight = 800;

    const largeItemList = [];
    for (let i = 1; i <= 10000; i++) {
        largeItemList.push({
            id: i,
            source: `Bu kaynak segment #${i} için örnek test metnidir.`,
            target: `This is the target segment #${i} translated.`,
            status: i % 2 === 0 ? 'confirmed' : 'draft'
        });
    }

    let renderedNodesCount = 0;
    const scroller = CatVirtualScroll.create({
        container,
        items: largeItemList,
        estimatedHeight: 180,
        buffer: 5,
        renderItem: (item, idx) => {
            renderedNodesCount++;
            const el = document.createElement('div');
            el.innerHTML = `Segment #${item.id}: ${item.source}`;
            return el;
        }
    });

    assert.strictEqual(scroller.items.length, 10000, '10.000 segment listeye yüklenemedi!');
    const expectedTotalHeight = 10000 * 180;
    assert.strictEqual(scroller.phantom.style.height, `${expectedTotalHeight}px`, 'Spacer hayalet yüksekliği yanlış!');
    console.log(`✅ 1.1: 10.000 segment başarıyla yüklendi. Hesaplanan sanal yükseklik: ${scroller.phantom.style.height}`);

    // Başlangıçta sadece görünüm penceresi + tampon render edilmeli (yaklaşık 10-15 DOM düğümü)
    const initialRendered = scroller.content.children.length;
    console.log(`✅ 1.2: DOM düğüm sayısı: ${initialRendered} (Beklenen: 5-20 arası, DOM bloat önlendi!)`);
    assert(initialRendered <= 25, 'DOM düğüm sayısı aşırı yüksek!');

    // 5.000. segmente kaydırma (Scroll to segment 5000)
    scroller.container.scrollTop = 5000 * 180; // ~900.000px kaydırma
    scroller.render();

    const scrolledChildren = scroller.content.children;
    console.log(`✅ 1.3: 5000. segmente kaydırıldıktan sonra DOM düğüm sayısı: ${scrolledChildren.length}`);
    assert(scrolledChildren.length <= 25, 'Kaydırma sonrası DOM düğüm sayısı korunamadı!');
    assert(scroller.content.style.transform.includes('translate3d'), 'Translate3d GPU hızlandırması uygulanmadı!');
    console.log(`   ↳ GPU Katmanı: ${scroller.content.style.transform}`);
}

// TEST 2: TEMA YÖNETİMİ (LIGHT / DARK / SEPIA)
{
    console.log('\n--- TEST 2: CatUI Tema Seçenekleri & Döngü Testi ---');
    global.localStorage = {
        store: {},
        getItem(k) { return this.store[k] || null; },
        setItem(k, v) { this.store[k] = String(v); }
    };

    CatUI.setTheme('light');
    assert.strictEqual(document.documentElement.getAttribute('data-theme'), 'light', 'Aydınlık tema atanamadı!');
    console.log('✅ 2.1: Aydınlık Tema (Light) başarıyla aktif');

    CatUI.setTheme('dark');
    assert.strictEqual(document.documentElement.getAttribute('data-theme'), 'dark', 'Koyu tema atanamadı!');
    assert(document.documentElement.classList.classes.has('dark'), 'Tailwind .dark sınıfı eklenmedi!');
    console.log('✅ 2.2: Koyu Tema (Dark) başarıyla aktif');

    CatUI.setTheme('sepia');
    assert.strictEqual(document.documentElement.getAttribute('data-theme'), 'sepia', 'Sepya tema atanamadı!');
    console.log('✅ 2.3: Sepya Tema (Sepia / Kitap Okuma) başarıyla aktif');

    // Tema Döngüsü (Toggle theme)
    CatUI.toggleTheme(); // sepia -> light
    assert.strictEqual(CatUI.currentTheme, 'light');
    CatUI.toggleTheme(); // light -> dark
    assert.strictEqual(CatUI.currentTheme, 'dark');
    console.log('✅ 2.4: Tema döngü mekanizması (Toggle cycle) doğrulandı');
}

// TEST 3: KLAVYE KISAYOLLARI REHBERİ VE ARAMA
{
    console.log('\n--- TEST 3: CatUI Klavye Kısayolları ve Filtreleme ---');
    assert(CatUI.shortcuts.length >= 10, 'Kısayol listesi eksik!');
    console.log(`✅ 3.1: Toplam ${CatUI.shortcuts.length} adet endüstri standardı kısayol tanımlı`);

    const hasConfirm = CatUI.shortcuts.some(s => s.key === 'Ctrl + Enter');
    const hasSplit = CatUI.shortcuts.some(s => s.key === 'Ctrl + Shift + S');
    const hasMerge = CatUI.shortcuts.some(s => s.key === 'Ctrl + Shift + M');
    const hasShield = CatUI.shortcuts.some(s => s.key === 'Ctrl + Shift + F');
    const hasPreview = CatUI.shortcuts.some(s => s.key === 'Ctrl + P');

    assert(hasConfirm, 'Ctrl + Enter eksik!');
    assert(hasSplit, 'Ctrl + Shift + S (Split) eksik!');
    assert(hasMerge, 'Ctrl + Shift + M (Merge) eksik!');
    assert(hasShield, 'Ctrl + Shift + F (Kalkan) eksik!');
    assert(hasPreview, 'Ctrl + P (Live Preview) eksik!');
    console.log('✅ 3.2: Kritik CAT kısayolları (Onayla, Böl, Birleştir, Kalkan, Önizleme) doğrulandı');
}

console.log('\n' + '='.repeat(65));
console.log('🎉 TÜM VIRTUAL SCROLLING & UI BİRİM TESTLERİ EKSİKSİZ GEÇTİ!');
console.log('='.repeat(65));

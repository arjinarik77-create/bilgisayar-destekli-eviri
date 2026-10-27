/* ==========================================================
   YÜKSEK PERFORMANSLI SANAL KAYDIRMA (Virtual Scrolling Engine)
   ----------------------------------------------------------
   - 10.000+ segmentte bile 60 FPS akıcı kaydırma
   - Dinamik kart yüksekliği ölçümü ve bellek koruması
   - Görünüm penceresi (viewport) + tampon bölge (buffer)
   - DOM düğüm sayısını 15-25 aralığında sabit tutar
   ========================================================== */
(function (global) {
    'use strict';

    class VirtualScroller {
        constructor(config) {
            this.container = config.container;
            this.items = config.items || [];
            this.renderItem = config.renderItem;
            this.estimatedHeight = config.estimatedHeight || 170;
            this.buffer = config.buffer || 4;
            this.heights = new Map();
            this.onScrollBound = this.handleScroll.bind(this);
            this.ticking = false;
            this.wrapper = null;
            this.phantom = null;
            this.content = null;
            this.enabled = true;

            this.setupDOM();
            if (this.items && this.items.length) {
                this.updateTotalHeight();
                this.render();
            }
        }

        setupDOM() {
            this.container.innerHTML = '';
            this.container.classList.add('cat-virtual-container');
            this.container.style.overflowY = 'auto';
            this.container.style.position = 'relative';

            // Hayalet (Spacer) element: listenin gerçek tam yüksekliğini sağlar
            this.phantom = document.createElement('div');
            this.phantom.className = 'cat-virtual-phantom';
            this.phantom.style.width = '100%';
            this.phantom.style.position = 'absolute';
            this.phantom.style.top = '0';
            this.phantom.style.left = '0';
            this.phantom.style.pointerEvents = 'none';
            this.phantom.style.zIndex = '-1';

            // İçerik element: Görünür segmentleri barındırır
            this.content = document.createElement('div');
            this.content.className = 'cat-virtual-content flex flex-col gap-3.5';
            this.content.style.width = '100%';
            this.content.style.position = 'absolute';
            this.content.style.top = '0';
            this.content.style.left = '0';
            this.content.style.willChange = 'transform';

            this.container.appendChild(this.phantom);
            this.container.appendChild(this.content);

            this.container.addEventListener('scroll', this.onScrollBound, { passive: true });
        }

        setItems(newItems) {
            this.items = newItems || [];
            this.heights.clear();
            this.updateTotalHeight();
            this.render();
        }

        updateTotalHeight() {
            let total = 0;
            for (let i = 0; i < this.items.length; i++) {
                total += this.heights.get(i) || this.estimatedHeight;
            }
            if (this.phantom) {
                this.phantom.style.height = `${total}px`;
            }
        }

        getItemTop(index) {
            let top = 0;
            for (let i = 0; i < index; i++) {
                top += this.heights.get(i) || this.estimatedHeight;
            }
            return top;
        }

        handleScroll() {
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    this.render();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }

        render() {
            if (!this.container || !this.items.length) {
                if (this.content) this.content.innerHTML = '';
                return;
            }

            const scrollTop = this.container.scrollTop;
            const viewportHeight = this.container.clientHeight || 800;

            // Görünür aralığı hesapla
            let accumulated = 0;
            let startIndex = 0;
            let endIndex = this.items.length - 1;

            for (let i = 0; i < this.items.length; i++) {
                const h = this.heights.get(i) || this.estimatedHeight;
                if (accumulated + h >= scrollTop) {
                    startIndex = Math.max(0, i - this.buffer);
                    break;
                }
                accumulated += h;
            }

            accumulated = this.getItemTop(startIndex);
            for (let i = startIndex; i < this.items.length; i++) {
                const h = this.heights.get(i) || this.estimatedHeight;
                accumulated += h;
                if (accumulated >= scrollTop + viewportHeight) {
                    endIndex = Math.min(this.items.length - 1, i + this.buffer);
                    break;
                }
            }

            const offsetY = this.getItemTop(startIndex);
            this.content.style.transform = `translate3d(0, ${offsetY}px, 0)`;

            // Görünür segmentleri üret
            const fragment = document.createDocumentFragment();
            for (let i = startIndex; i <= endIndex; i++) {
                const item = this.items[i];
                const node = this.renderItem(item, i);
                if (node) {
                    node.setAttribute('data-virtual-index', i);
                    fragment.appendChild(node);
                }
            }

            this.content.innerHTML = '';
            this.content.appendChild(fragment);

            // Yeni basılan düğümlerin gerçek yüksekliklerini kaydet
            requestAnimationFrame(() => {
                const children = this.content.children;
                let heightChanged = false;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (!child || typeof child.getAttribute !== 'function') continue;
                    const attr = child.getAttribute('data-virtual-index');
                    if (attr == null) continue;
                    const idx = parseInt(attr, 10);
                    const realHeight = (child.getBoundingClientRect && child.getBoundingClientRect().height) || 0;
                    if (realHeight && this.heights.get(idx) !== realHeight) {
                        this.heights.set(idx, realHeight);
                        heightChanged = true;
                    }
                }
                if (heightChanged) {
                    this.updateTotalHeight();
                }
            });
        }

        scrollToIndex(index) {
            if (index < 0 || index >= this.items.length) return;
            const top = this.getItemTop(index);
            this.container.scrollTo({ top, behavior: 'smooth' });
        }

        destroy() {
            if (this.container) {
                this.container.removeEventListener('scroll', this.onScrollBound);
            }
        }
    }

    global.CatVirtualScroll = {
        create: (config) => new VirtualScroller(config)
    };
})(window);

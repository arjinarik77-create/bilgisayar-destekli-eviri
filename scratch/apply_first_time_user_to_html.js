const fs = require('fs');

console.log("Applying First-Time User Onboarding & Supabase integration to legacy_index.html and index.html...");

const modalMarkup = `
    <!-- ======================================================== -->
    <!-- İLK GİRİŞ KULLANICI ADI & DİL ÇİFTLERİ MODALI (SUPABASE ENTEGRASYONLU) -->
    <!-- ======================================================== -->
    <div id="firstTimeUserModal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <div class="fluent-card bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl animate-fadeIn relative">
            
            <!-- Kapatma Butonu (Yalnızca ilk kurulum tamamlandıktan sonraki düzenlemelerde görünür) -->
            <button id="ft_modal_close_btn" type="button" onclick="AuraCATFirstTimeUser.closeModal()" 
                class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer hidden"
                title="Kapat">
                <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <!-- Modal Başlık Çubuğu -->
            <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800 pr-8">
                <div class="w-10 h-10 rounded-xl bg-cobalt/10 text-cobalt flex items-center justify-center border border-cobalt/20 shrink-0">
                    <span class="material-symbols-outlined text-[24px]">person_add</span>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>AuraCAT'e Hoş Geldiniz</span>
                        <span id="ft_modal_badge" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">İlk Kurulum</span>
                    </h3>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Çalışma alanınızı kişiselleştirmek için kullanıcı adınızı ve dil çiftlerinizi belirleyin.</p>
                </div>
            </div>

            <!-- Form Alanları -->
            <form id="firstTimeUserForm" onsubmit="AuraCATFirstTimeUser.handleSubmit(event)" class="space-y-4 text-xs">
                
                <!-- 1. Kullanıcı Adı -->
                <div class="space-y-1">
                    <label class="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Kullanıcı Adı</span>
                        <span class="text-[10px] text-slate-400 font-normal">Zorunlu</span>
                    </label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono font-bold">@</span>
                        <input type="text" id="ft_username" required placeholder="kullanici_adi" pattern="[A-Za-z0-9_\\-\\.]+"
                            class="fluent-input w-full pl-8 pr-3 h-9 text-xs rounded-lg font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:outline-none focus:border-cobalt">
                    </div>
                    <p class="text-[10px] text-slate-400">Sistemde, çeviri belleğinde ve Supabase profillerinde görünecek adınız.</p>
                </div>

                <!-- 2. Dil Çiftleri Seçici Bileşeni -->
                <div class="space-y-2">
                    <label class="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Çalıştığınız Dil Çiftleri</span>
                        <span class="text-[10px] text-slate-400 font-normal">En az 1 çift gereklidir</span>
                    </label>
                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-2.5">
                        <div class="flex items-center gap-2">
                            <select id="ft_pair_source" class="h-8 px-2 text-xs rounded-md bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 font-mono text-slate-800 dark:text-slate-200">
                                <option value="EN">EN (İngilizce)</option>
                                <option value="DE">DE (Almanca)</option>
                                <option value="FR">FR (Fransızca)</option>
                                <option value="ES">ES (İspanyolca)</option>
                                <option value="IT">IT (İtalyanca)</option>
                                <option value="RU">RU (Rusça)</option>
                                <option value="TR">TR (Türkçe)</option>
                                <option value="AR">AR (Arapça)</option>
                                <option value="JA">JA (Japonca)</option>
                                <option value="ZH">ZH (Çince)</option>
                            </select>
                            <span class="font-mono text-slate-400 font-bold">➔</span>
                            <select id="ft_pair_target" class="h-8 px-2 text-xs rounded-md bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 font-mono text-slate-800 dark:text-slate-200">
                                <option value="TR" selected>TR (Türkçe)</option>
                                <option value="EN">EN (İngilizce)</option>
                                <option value="DE">DE (Almanca)</option>
                                <option value="FR">FR (Fransızca)</option>
                                <option value="ES">ES (İspanyolca)</option>
                                <option value="IT">IT (İtalyanca)</option>
                                <option value="RU">RU (Rusça)</option>
                            </select>
                            <button type="button" onclick="AuraCATFirstTimeUser.addPair()" class="h-8 px-3 rounded-md bg-white dark:bg-neutral-700 hover:bg-slate-100 border border-slate-300 dark:border-neutral-600 text-xs font-semibold text-cobalt dark:text-blue-400 transition-colors cursor-pointer">
                                + Ekle
                            </button>
                        </div>
                        
                        <!-- Eklenen Dil Çiftleri Kapsülleri -->
                        <div id="ft_pairs_container" class="flex flex-wrap gap-1.5 pt-1">
                            <!-- JS ile dinamik render edilir -->
                        </div>
                    </div>
                </div>

                <!-- 3. Supabase Bağlantı Durumu & Yapılandırma (İsteğe Bağlı Akordeon) -->
                <div class="pt-2 border-t border-slate-100 dark:border-neutral-800">
                    <button type="button" onclick="AuraCATFirstTimeUser.toggleSupabaseConfig()" class="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center justify-between w-full font-mono cursor-pointer">
                        <span class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Supabase Bulut Veritabanı Yapılandırması</span>
                        </span>
                        <span id="ft_supabase_toggle_icon">▾</span>
                    </button>
                    
                    <div id="ft_supabase_config_panel" class="hidden mt-2 p-3 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-2 text-[11px]">
                        <div>
                            <label class="font-mono text-slate-600 dark:text-slate-400">Supabase Project URL:</label>
                            <input type="text" id="ft_supabase_url" placeholder="https://xyzcompany.supabase.co"
                                class="fluent-input w-full h-7 px-2 text-xs rounded bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 font-mono">
                        </div>
                        <div>
                            <label class="font-mono text-slate-600 dark:text-slate-400">Supabase Anon Key:</label>
                            <input type="password" id="ft_supabase_anon_key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                class="fluent-input w-full h-7 px-2 text-xs rounded bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 font-mono">
                        </div>
                        <p class="text-[10px] text-slate-400">Belirttiğiniz Supabase projesindeki <code class="font-mono font-bold">user_profiles</code> tablosuna otomatik kaydedilir.</p>
                    </div>
                </div>

                <!-- Modal Alt Butonları -->
                <div class="pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                    <button type="submit" id="btnSaveFirstTimeUser" class="fluent-btn-primary px-6 h-10 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 bg-cobalt hover:bg-cobalt-hover text-white cursor-pointer transition-all">
                        <span class="material-symbols-outlined text-[18px]">check</span>
                        <span>Kaydet ve Çalışma Alanını Başlat</span>
                    </button>
                </div>
            </form>

        </div>
    </div>
`;

const jsEngine = `
        // ========================================================
        // AURACAT İLK GİRİŞ KULLANICI PROFİLİ VE SUPABASE MOTORU
        // ========================================================
        const AuraCATFirstTimeUser = {
            storageKeyProfile: 'auracat_user_profile',
            storageKeyOnboarded: 'auracat_user_onboarded',
            storageKeySupabaseUrl: 'auracat_supabase_url',
            storageKeySupabaseKey: 'auracat_supabase_anon_key',

            // Varsayılan Supabase Ayarları
            defaultSupabaseUrl: 'https://auracat-cloud.supabase.co',
            defaultSupabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demoKey',

            selectedPairs: new Set(['EN > TR']),

            getProfile: function() {
                try {
                    const data = localStorage.getItem(this.storageKeyProfile);
                    if (data) return JSON.parse(data);
                } catch(e) {}
                return null;
            },

            isOnboarded: function() {
                return localStorage.getItem(this.storageKeyOnboarded) === 'true';
            },

            checkAndPrompt: function() {
                if (!this.isOnboarded()) {
                    setTimeout(() => {
                        this.openModal();
                    }, 300);
                } else {
                    this.reflectProfileInUI();
                }
            },

            openModal: function() {
                const modal = document.getElementById('firstTimeUserModal');
                if (!modal) return;
                
                const isFirst = !this.isOnboarded();
                const closeBtn = document.getElementById('ft_modal_close_btn');
                const badge = document.getElementById('ft_modal_badge');
                
                if (closeBtn) {
                    if (isFirst) {
                        closeBtn.classList.add('hidden');
                    } else {
                        closeBtn.classList.remove('hidden');
                    }
                }

                if (badge) {
                    badge.textContent = isFirst ? 'İlk Kurulum' : 'Profili Düzenle';
                }

                // Mevcut profil varsa form alanlarına doldur
                const profile = this.getProfile();
                const userInput = document.getElementById('ft_username');
                if (profile && profile.username) {
                    if (userInput) userInput.value = profile.username.replace(/^@/, '');
                    if (profile.language_pairs && Array.isArray(profile.language_pairs) && profile.language_pairs.length > 0) {
                        this.selectedPairs = new Set(profile.language_pairs);
                    }
                } else {
                    if (userInput && !userInput.value) userInput.value = '';
                }

                // Supabase ayarlarını doldur
                const savedUrl = localStorage.getItem(this.storageKeySupabaseUrl);
                const savedKey = localStorage.getItem(this.storageKeySupabaseKey);
                const urlEl = document.getElementById('ft_supabase_url');
                const keyEl = document.getElementById('ft_supabase_anon_key');
                if (urlEl && savedUrl) urlEl.value = savedUrl;
                if (keyEl && savedKey) keyEl.value = savedKey;

                this.renderPairs();
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            },

            closeModal: function() {
                const modal = document.getElementById('firstTimeUserModal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            },

            toggleSupabaseConfig: function() {
                const panel = document.getElementById('ft_supabase_config_panel');
                const icon = document.getElementById('ft_supabase_toggle_icon');
                if (panel) {
                    panel.classList.toggle('hidden');
                    if (icon) icon.textContent = panel.classList.contains('hidden') ? '▾' : '▴';
                }
            },

            addPair: function() {
                const srcEl = document.getElementById('ft_pair_source');
                const tgtEl = document.getElementById('ft_pair_target');
                if (!srcEl || !tgtEl) return;
                const src = srcEl.value;
                const tgt = tgtEl.value;
                if (src === tgt) {
                    if (typeof showToast === 'function') showToast("⚠️ Kaynak dil ile hedef dil aynı olamaz.");
                    return;
                }
                this.selectedPairs.add(\`\${src} > \${tgt}\`);
                this.renderPairs();
            },

            removePair: function(pair) {
                if (this.selectedPairs.size <= 1) {
                    if (typeof showToast === 'function') showToast("⚠️ En az bir dil çifti seçili kalmalıdır.");
                    return;
                }
                this.selectedPairs.delete(pair);
                this.renderPairs();
            },

            renderPairs: function() {
                const container = document.getElementById('ft_pairs_container');
                if (!container) return;
                container.innerHTML = '';
                this.selectedPairs.forEach(p => {
                    const pill = document.createElement('span');
                    pill.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-cobalt border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 shadow-2xs';
                    pill.innerHTML = \`
                        <span>\${p}</span>
                        <button type="button" onclick="AuraCATFirstTimeUser.removePair('\${p}')" class="text-blue-400 hover:text-red-500 font-bold ml-1 cursor-pointer">&times;</button>
                    \`;
                    container.appendChild(pill);
                });
            },

            handleSubmit: async function(e) {
                if (e && e.preventDefault) e.preventDefault();
                const userEl = document.getElementById('ft_username');
                const userVal = userEl ? userEl.value.trim() : '';
                if (!userVal) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen geçerli bir kullanıcı adı girin.");
                    return;
                }

                if (this.selectedPairs.size === 0) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen en az bir dil çifti ekleyin.");
                    return;
                }

                const cleanUsername = userVal.startsWith('@') ? userVal : '@' + userVal;
                const pairsArray = Array.from(this.selectedPairs);

                // Supabase kimlikleri
                const urlEl = document.getElementById('ft_supabase_url');
                const keyEl = document.getElementById('ft_supabase_anon_key');
                const supabaseUrl = (urlEl && urlEl.value.trim()) ? urlEl.value.trim().replace(/\\/+$/, '') : (localStorage.getItem(this.storageKeySupabaseUrl) || this.defaultSupabaseUrl);
                const supabaseKey = (keyEl && keyEl.value.trim()) ? keyEl.value.trim() : (localStorage.getItem(this.storageKeySupabaseKey) || this.defaultSupabaseAnonKey);

                if (urlEl && urlEl.value.trim()) localStorage.setItem(this.storageKeySupabaseUrl, urlEl.value.trim());
                if (keyEl && keyEl.value.trim()) localStorage.setItem(this.storageKeySupabaseKey, keyEl.value.trim());

                // Profil nesnesi
                const profile = {
                    username: cleanUsername,
                    language_pairs: pairsArray,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    client_meta: {
                        user_agent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language
                    }
                };

                // Yerel hafızaya kaydet
                localStorage.setItem(this.storageKeyProfile, JSON.stringify(profile));
                localStorage.setItem(this.storageKeyOnboarded, 'true');

                // UI'ya anında yansıt
                this.reflectProfileInUI();
                this.closeModal();

                if (typeof showToast === 'function') {
                    showToast(\`🎉 Hoş geldiniz, \${cleanUsername}! Dil çiftleriniz ayarlandı.\`);
                }

                // Supabase'e gönder (Asenkron)
                this.sendToSupabase(profile, supabaseUrl, supabaseKey);
            },

            sendToSupabase: async function(profile, supabaseUrl, supabaseKey) {
                try {
                    // 1. Sayfada Supabase SDK varsa doğrudan kullan
                    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
                        const { data, error } = await client.from('user_profiles').upsert([
                            {
                                username: profile.username,
                                language_pairs: profile.language_pairs,
                                metadata: profile.client_meta,
                                updated_at: profile.updated_at
                            }
                        ], { onConflict: 'username' });

                        if (error) throw error;
                        console.log("Supabase Client ile başarıyla kaydedildi:", data);
                        if (typeof showToast === 'function') showToast("☁️ Profiliniz Supabase bulut veritabanına kaydedildi.");
                        return;
                    }

                    // 2. Fetch REST API ile doğrudan Supabase PostgREST uç noktasına gönder
                    const restEndpoint = \`\${supabaseUrl}/rest/v1/user_profiles\`;
                    const res = await fetch(restEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': \`Bearer \${supabaseKey}\`,
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            username: profile.username,
                            language_pairs: profile.language_pairs,
                            metadata: profile.client_meta,
                            updated_at: profile.updated_at
                        })
                    });

                    if (!res.ok) {
                        const errText = await res.text();
                        console.warn("Supabase REST API yanıtı:", res.status, errText);
                    } else {
                        console.log("Supabase REST API ile kayıt başarılı.");
                        if (typeof showToast === 'function') showToast("☁️ Profiliniz Supabase bulut veritabanına kaydedildi.");
                    }
                } catch (err) {
                    console.warn("Supabase bağlantısı (çevrimdışı/demo modu):", err.message || err);
                }
            },

            reflectProfileInUI: function() {
                const profile = this.getProfile();
                if (!profile) return;

                // Üst çubukta profil rozeti gösterimi
                const badge = document.getElementById('userProfileHeaderBadge');
                const usernameText = document.getElementById('headerUsernameText');
                if (usernameText) {
                    usernameText.textContent = profile.username;
                } else if (badge) {
                    badge.innerHTML = \`
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span class="font-bold text-slate-800 dark:text-slate-100 font-mono">\${profile.username}</span>
                        <span class="text-slate-400 font-mono text-[10px] hidden sm:inline">(\${(profile.language_pairs || []).join(', ')})</span>
                    \`;
                }

                // Varsayılan proje kaynak ve hedef dillerini güncelle
                if (profile.language_pairs && profile.language_pairs.length > 0) {
                    const firstPair = profile.language_pairs[0];
                    const parts = firstPair.split('>');
                    if (parts.length === 2) {
                        const src = parts[0].trim().toLowerCase();
                        const tgt = parts[1].trim().toLowerCase();
                        const srcSel = document.getElementById('projectSourceLang');
                        const tgtSel = document.getElementById('projectTargetLang');
                        if (srcSel) srcSel.value = src;
                        if (tgtSel) tgtSel.value = tgt;
                    }
                }
            }
        };
`;

const headerBadgeHtml = `
                <!-- Kullanıcı Profili ve Dil Çiftleri Başlık Rozeti (Supabase Entegre) -->
                <button onclick="AuraCATFirstTimeUser.openModal()" id="userProfileHeaderBadge"
                    class="flex items-center gap-1.5 px-3 h-8 rounded-full border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/90 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-all cursor-pointer text-xs font-mono text-slate-700 dark:text-neutral-200 shadow-2xs"
                    title="Kullanıcı Profili ve Dil Çiftlerini Güncelle (Supabase Eşzamanlı)">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span id="headerUsernameText">@misafir</span>
                </button>
`;

function processFile(filename) {
    let html = fs.readFileSync(filename, 'utf8');

    // 1. CDN Script in <head>
    const supabaseCdnTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
    if (!html.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')) {
        html = html.replace('</head>', `    ${supabaseCdnTag}\n</head>`);
        console.log(`[${filename}] Added Supabase CDN script.`);
    }

    // 2. Header Badge in <header>
    if (!html.includes('id="userProfileHeaderBadge"')) {
        // Find btnProfileDrawer and insert before it
        const targetBtn = '<button onclick="toggleProfileDrawer()" id="btnProfileDrawer"';
        if (html.includes(targetBtn)) {
            html = html.replace(targetBtn, `${headerBadgeHtml}\n                ${targetBtn}`);
            console.log(`[${filename}] Inserted userProfileHeaderBadge before btnProfileDrawer.`);
        } else {
            console.warn(`[${filename}] Could not find btnProfileDrawer to insert badge.`);
        }
    }

    // 3. Modal HTML before </body>
    if (!html.includes('id="firstTimeUserModal"')) {
        const lastBodyIdx = html.lastIndexOf('</body>');
        if (lastBodyIdx !== -1) {
            html = html.substring(0, lastBodyIdx) + `${modalMarkup}\n` + html.substring(lastBodyIdx);
            console.log(`[${filename}] Inserted #firstTimeUserModal before </body>.`);
        }
    }

    // 4. JS Engine
    if (!html.includes('const AuraCATFirstTimeUser =')) {
        // Insert right before window.addEventListener('DOMContentLoaded'
        const targetDomLoaded = "window.addEventListener('DOMContentLoaded', () => {";
        if (html.includes(targetDomLoaded)) {
            html = html.replace(targetDomLoaded, `${jsEngine}\n\n        ${targetDomLoaded}`);
            console.log(`[${filename}] Inserted AuraCATFirstTimeUser engine.`);
        } else {
            console.warn(`[${filename}] Could not find DOMContentLoaded to insert engine.`);
        }
    }

    // 5. Call checkAndPrompt() in DOMContentLoaded
    if (!html.includes('AuraCATFirstTimeUser.checkAndPrompt();')) {
        const targetInit = "initSidebarState();";
        if (html.includes(targetInit)) {
            html = html.replace(targetInit, `${targetInit}\n            AuraCATFirstTimeUser.checkAndPrompt();`);
            console.log(`[${filename}] Added AuraCATFirstTimeUser.checkAndPrompt() inside DOMContentLoaded.`);
        } else {
            console.warn(`[${filename}] Could not find initSidebarState to hook checkAndPrompt.`);
        }
    }

    fs.writeFileSync(filename, html, 'utf8');
    console.log(`[${filename}] Successfully written.`);
}

processFile('legacy_index.html');
processFile('index.html');
console.log("Both files updated successfully!");

const fs = require('fs');

console.log("Preparing updated modal (No Username, Custom Languages, Admin Panel Sync)...");

const updatedModalHtml = `
    <!-- ======================================================== -->
    <!-- İLK GİRİŞ: AD SOYAD & DİL ÇİFTLERİ (KULLANICI ADI İSTEMEZ) -->
    <!-- ======================================================== -->
    <div id="firstTimeUserModal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <div class="fluent-card bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl animate-fadeIn relative">
            
            <!-- Kapatma Butonu (Yalnızca ilk kurulum bittikten sonraki düzenlemelerde görünür) -->
            <button id="ft_modal_close_btn" type="button" onclick="AuraCATFirstTimeUser.closeModal()" 
                class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer hidden"
                title="Kapat">
                <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <!-- Modal Başlık Çubuğu -->
            <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800 pr-8">
                <div class="w-10 h-10 rounded-xl bg-cobalt/10 text-cobalt flex items-center justify-center border border-cobalt/20 shrink-0">
                    <span class="material-symbols-outlined text-[24px]">translate</span>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Tercüman Çalışma Alanı</span>
                        <span id="ft_modal_badge" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">İlk Kurulum</span>
                    </h3>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Çalışma alanınızı başlatmak için adınızı ve uzman olduğunuz dil çiftlerini belirleyin.</p>
                </div>
            </div>

            <!-- Form Alanları -->
            <form id="firstTimeUserForm" onsubmit="AuraCATFirstTimeUser.handleSubmit(event)" class="space-y-4 text-xs">
                
                <!-- 1. Ad Soyad (Tek ve Net Alan, Kullanıcı Adı İstenmez) -->
                <div class="space-y-1">
                    <label class="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Adınız ve Soyadınız</span>
                        <span class="text-[10px] text-slate-400 font-normal">Zorunlu</span>
                    </label>
                    <input type="text" id="ft_fullname" required placeholder="Örn: Ahmet Yılmaz"
                        class="fluent-input w-full px-3.5 h-10 text-sm font-medium rounded-xl text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:outline-none focus:border-cobalt">
                    <p class="text-[10px] text-slate-400">Tercüman kimliğiniz admin panelinde ve projelerinizde bu adla listelenecektir.</p>
                </div>

                <!-- 2. Dil Çiftleri Seçici & Genişletilmiş / Özel Dil Ekleme Alanı -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-slate-800 dark:text-slate-200">
                            <span>Çalıştığınız Dil Çiftleri</span>
                        </label>
                        <button type="button" onclick="AuraCATFirstTimeUser.toggleCustomLangInput()" class="text-[11px] text-cobalt hover:underline flex items-center gap-1 font-semibold cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">edit_note</span>
                            <span id="ft_custom_toggle_text">Özel / Başka Dil Yaz</span>
                        </button>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-3">
                        
                        <!-- Standart Zengin Dil Listesi Seçimi -->
                        <div id="ft_standard_pair_row" class="flex items-center gap-2">
                            <select id="ft_pair_source" class="h-9 px-2 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 font-mono text-slate-800 dark:text-slate-200 flex-1">
                                <option value="EN">EN (İngilizce)</option>
                                <option value="TR">TR (Türkçe)</option>
                                <option value="DE">DE (Almanca)</option>
                                <option value="FR">FR (Fransızca)</option>
                                <option value="ES">ES (İspanyolca)</option>
                                <option value="IT">IT (İtalyanca)</option>
                                <option value="RU">RU (Rusça)</option>
                                <option value="AR">AR (Arapça)</option>
                                <option value="ZH">ZH (Çince)</option>
                                <option value="JA">JA (Japonca)</option>
                                <option value="KO">KO (Korece)</option>
                                <option value="FA">FA (Farsça)</option>
                                <option value="AZ">AZ (Azerice)</option>
                                <option value="PT">PT (Portekizce)</option>
                                <option value="NL">NL (Flemenkçe)</option>
                                <option value="PL">PL (Lehçe)</option>
                                <option value="SV">SV (İsveççe)</option>
                                <option value="EL">EL (Yunanca)</option>
                                <option value="UK">UK (Ukraynaca)</option>
                                <option value="NO">NO (Norveççe)</option>
                            </select>
                            <span class="font-mono text-slate-400 font-bold">➔</span>
                            <select id="ft_pair_target" class="h-9 px-2 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 font-mono text-slate-800 dark:text-slate-200 flex-1">
                                <option value="TR" selected>TR (Türkçe)</option>
                                <option value="EN">EN (İngilizce)</option>
                                <option value="DE">DE (Almanca)</option>
                                <option value="FR">FR (Fransızca)</option>
                                <option value="ES">ES (İspanyolca)</option>
                                <option value="IT">IT (İtalyanca)</option>
                                <option value="RU">RU (Rusça)</option>
                                <option value="AR">AR (Arapça)</option>
                                <option value="ZH">ZH (Çince)</option>
                                <option value="JA">JA (Japonca)</option>
                                <option value="KO">KO (Korece)</option>
                                <option value="FA">FA (Farsça)</option>
                                <option value="AZ">AZ (Azerice)</option>
                                <option value="PT">PT (Portekizce)</option>
                                <option value="NL">NL (Flemenkçe)</option>
                                <option value="PL">PL (Lehçe)</option>
                                <option value="SV">SV (İsveççe)</option>
                                <option value="EL">EL (Yunanca)</option>
                                <option value="UK">UK (Ukraynaca)</option>
                                <option value="NO">NO (Norveççe)</option>
                            </select>
                            <button type="button" onclick="AuraCATFirstTimeUser.addPair()" class="h-9 px-3.5 rounded-lg bg-white dark:bg-neutral-700 hover:bg-slate-100 border border-slate-300 dark:border-neutral-600 text-xs font-semibold text-cobalt dark:text-blue-400 transition-colors cursor-pointer shrink-0">
                                + Ekle
                            </button>
                        </div>

                        <!-- Özel / Serbest Metin Dil Çifti Ekleme Satırı (Açılır / Kapanır) -->
                        <div id="ft_custom_pair_row" class="hidden flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-neutral-700">
                            <input type="text" id="ft_custom_source" placeholder="Kaynak Dil (Örn: Kürtçe, Kazakça)"
                                class="fluent-input h-9 px-2.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 flex-1">
                            <span class="font-mono text-slate-400 font-bold">➔</span>
                            <input type="text" id="ft_custom_target" placeholder="Hedef Dil (Örn: Türkçe, İngilizce)"
                                class="fluent-input h-9 px-2.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 flex-1">
                            <button type="button" onclick="AuraCATFirstTimeUser.addCustomPair()" class="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0">
                                + Ekle
                            </button>
                        </div>
                        
                        <!-- Eklenen Dil Çiftleri Kapsülleri -->
                        <div class="pt-1">
                            <div class="text-[10px] text-slate-400 mb-1.5 font-medium">Kayıt Edilecek Dil Çiftleriniz:</div>
                            <div id="ft_pairs_container" class="flex flex-wrap gap-1.5 min-h-[30px] p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800">
                                <!-- JS ile dinamik render edilir -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Bulut Durumu Bilgilendirmesi -->
                <div class="px-3 py-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                    <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Admin Paneli & Supabase Eşzamanlaması Aktif</span>
                    </span>
                    <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Otomatik Kayıt</span>
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

const updatedJsEngine = `// ========================================================
        // AURACAT GÜVENLİ SUPABASE KASA MODÜLÜ & İLK GİRİŞ MOTORU
        // ========================================================
        const _AURA_SUPABASE_VAULT = (function() {
            // Güvenli Obfuscated Supabase Üretim Kimlikleri
            const _u = atob('aHR0cHM6Ly9td2Zhc2hmdnd2aGhxcHl4bW1zcC5zdXBhYmFzZS5jbw==');
            const _k = atob('c2JfcHVibGlzaGFibGVfa3VkQXU3RVllamVQMVF1a284d0J4d18zenN1UjJocw==');
            return {
                getUrl: function() { return _u; },
                getKey: function() { return _k; }
            };
        })();

        const AuraCATFirstTimeUser = {
            storageKeyProfile: 'auracat_user_profile',
            storageKeyOnboarded: 'auracat_user_onboarded',
            storageKeyTranslatorsList: 'auracat_registered_translators',

            selectedPairs: new Set(['EN > TR']),

            getProfile: function() {
                try {
                    const data = localStorage.getItem(this.storageKeyProfile);
                    if (data) return JSON.parse(data);
                } catch(e) {}
                return null;
            },

            // Sadece bir kere sorma kuralı: 'auracat_user_onboarded' === 'true' ise bir daha asla sormaz
            isOnboarded: function() {
                return localStorage.getItem(this.storageKeyOnboarded) === 'true';
            },

            checkAndPrompt: function() {
                // Eğer daha önce kurulum yapılmışsa KESİNLİKLE tekrar açılmaz, yalnızca bilgileri UI'a yansıtır
                if (this.isOnboarded()) {
                    this.reflectProfileInUI();
                    return;
                }
                
                // Yalnızca İLK GİRİŞTE modal otomatik olarak açılır
                setTimeout(() => {
                    this.openModal();
                }, 300);
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
                const fullNameInput = document.getElementById('ft_fullname');
                
                if (profile) {
                    if (fullNameInput && profile.full_name) fullNameInput.value = profile.full_name;
                    if (profile.language_pairs && Array.isArray(profile.language_pairs) && profile.language_pairs.length > 0) {
                        this.selectedPairs = new Set(profile.language_pairs);
                    }
                }

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

            toggleCustomLangInput: function() {
                const row = document.getElementById('ft_custom_pair_row');
                const textEl = document.getElementById('ft_custom_toggle_text');
                if (row) {
                    row.classList.toggle('hidden');
                    if (textEl) {
                        textEl.textContent = row.classList.contains('hidden') ? 'Özel / Başka Dil Yaz' : 'Listeye Dön';
                    }
                }
            },

            addPair: function() {
                const srcEl = document.getElementById('ft_pair_source');
                const tgtEl = document.getElementById('ft_pair_target');
                if (!srcEl || !tgtEl) return;
                const src = srcEl.value.trim();
                const tgt = tgtEl.value.trim();
                if (src === tgt) {
                    if (typeof showToast === 'function') showToast("⚠️ Kaynak dil ile hedef dil aynı olamaz.");
                    return;
                }
                this.selectedPairs.add(\`\${src} > \${tgt}\`);
                this.renderPairs();
            },

            addCustomPair: function() {
                const srcInput = document.getElementById('ft_custom_source');
                const tgtInput = document.getElementById('ft_custom_target');
                if (!srcInput || !tgtInput) return;
                const src = srcInput.value.trim();
                const tgt = tgtInput.value.trim();
                if (!src || !tgt) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen kaynak ve hedef dili yazın.");
                    return;
                }
                if (src.toLowerCase() === tgt.toLowerCase()) {
                    if (typeof showToast === 'function') showToast("⚠️ Kaynak dil ile hedef dil aynı olamaz.");
                    return;
                }
                this.selectedPairs.add(\`\${src} > \${tgt}\`);
                srcInput.value = '';
                tgtInput.value = '';
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
                
                const fullNameEl = document.getElementById('ft_fullname');
                const fullNameVal = fullNameEl ? fullNameEl.value.trim() : '';

                if (!fullNameVal) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen adınızı ve soyadınızı girin.");
                    return;
                }

                if (this.selectedPairs.size === 0) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen en az bir dil çifti ekleyin.");
                    return;
                }

                // Kullanıcıdan kullanıcı adı istenmez; sistem arka planda Ad Soyad'dan temiz benzersiz bir kimlik üretir
                const baseSlug = fullNameVal.toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .slice(0, 20) || 'tercuman';
                const autoHandle = '@' + baseSlug + '_' + Math.random().toString(36).substring(2, 6);
                const pairsArray = Array.from(this.selectedPairs);

                // Profil nesnesi
                const profile = {
                    id: 'usr_' + Date.now(),
                    full_name: fullNameVal,
                    username: autoHandle,
                    language_pairs: pairsArray,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    client_meta: {
                        role: 'translator',
                        user_agent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language
                    }
                };

                // Yerel hafızaya kaydet (SADECE BİR KERE SORMA GÜVENCESİ)
                localStorage.setItem(this.storageKeyProfile, JSON.stringify(profile));
                localStorage.setItem(this.storageKeyOnboarded, 'true');

                // Admin Paneli İçin Yerel Havuz Senkronizasyonu
                try {
                    const listRaw = localStorage.getItem(this.storageKeyTranslatorsList);
                    let list = listRaw ? JSON.parse(listRaw) : [];
                    const existingIdx = list.findIndex(item => item.full_name === fullNameVal);
                    if (existingIdx !== -1) {
                        list[existingIdx] = profile;
                    } else {
                        list.unshift(profile);
                    }
                    localStorage.setItem(this.storageKeyTranslatorsList, JSON.stringify(list));
                } catch(err) {}

                // UI'ya anında yansıt ve modalı kapat
                this.reflectProfileInUI();
                this.closeModal();

                if (typeof showToast === 'function') {
                    showToast(\`🎉 Hoş geldiniz, \${fullNameVal}!\`);
                }

                // Gömülü güvenli Supabase kasasından kimlikleri al ve asenkron aktar
                const supabaseUrl = _AURA_SUPABASE_VAULT.getUrl();
                const supabaseKey = _AURA_SUPABASE_VAULT.getKey();
                this.sendToSupabase(profile, supabaseUrl, supabaseKey);
            },

            sendToSupabase: async function(profile, supabaseUrl, supabaseKey) {
                try {
                    const record = {
                        full_name: profile.full_name,
                        username: profile.username,
                        language_pairs: profile.language_pairs,
                        metadata: profile.client_meta,
                        updated_at: profile.updated_at
                    };

                    // 1. Sayfada Supabase SDK varsa doğrudan kullan
                    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
                        const { data, error } = await client.from('user_profiles').upsert([record], { onConflict: 'username' });

                        if (error) throw error;
                        console.log("Supabase Client ile başarıyla kaydedildi:", data);
                        if (typeof showToast === 'function') showToast("☁️ Profiliniz Supabase bulut veritabanına kaydedildi.");
                        return;
                    }

                    // 2. Fetch REST API ile doğrudan Supabase PostgREST uç noktasına aktar
                    const restEndpoint = \`\${supabaseUrl}/rest/v1/user_profiles\`;
                    const res = await fetch(restEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': \`Bearer \${supabaseKey}\`,
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify(record)
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
                
                const displayName = profile.full_name || 'Tercüman';
                
                if (usernameText) {
                    usernameText.textContent = displayName;
                }
                if (badge) {
                    badge.title = \`Tercüman: \${displayName} | Dil Çiftleri: \${(profile.language_pairs || []).join(', ')}\`;
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
        };`;

function updateHtmlFiles() {
    ['legacy_index.html', 'index.html'].forEach(filename => {
        let content = fs.readFileSync(filename, 'utf8');

        // 1. Replace modal
        const modalStartIdx = content.indexOf('<!-- İLK GİRİŞ');
        const modalRealStart = modalStartIdx !== -1 ? content.lastIndexOf('<!-- ======================================================== -->', modalStartIdx) : -1;
        const modalEndMarker = '<!-- Modal Alt Butonları -->';
        const modalEndIdx = content.indexOf('</div>\n    </div>', content.indexOf(modalEndMarker));

        if (modalRealStart !== -1 && modalEndIdx !== -1) {
            const cutEnd = modalEndIdx + '</div>\n    </div>'.length;
            content = content.substring(0, modalRealStart) + updatedModalHtml.trim() + "\n" + content.substring(cutEnd);
            console.log(`[${filename}] Replaced modal successfully.`);
        } else {
            console.warn(`[${filename}] Modal boundary not matched exactly, using regex...`);
            const modalRegex = /<!-- =+ -->\s*<!-- İLK GİRİŞ[\s\S]*?id="firstTimeUserModal"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;
            content = content.replace(modalRegex, updatedModalHtml.trim());
        }

        // 2. Replace engine
        const vaultStart = content.indexOf('// AURACAT GÜVENLİ SUPABASE KASA MODÜLÜ');
        const engineStart = vaultStart !== -1 ? content.lastIndexOf('// ========================================================', vaultStart) : -1;
        const domLoaded = "window.addEventListener('DOMContentLoaded', () => {";
        const engineEnd = content.indexOf(domLoaded, engineStart);

        if (engineStart !== -1 && engineEnd !== -1) {
            content = content.substring(0, engineStart) + updatedJsEngine + "\n\n        " + content.substring(engineEnd);
            console.log(`[${filename}] Replaced JS Engine successfully.`);
        } else {
            console.error(`[${filename}] Could not match engine boundaries!`);
        }

        fs.writeFileSync(filename, content, 'utf8');
        console.log(`[${filename}] Written successfully.`);
    });
}

updateHtmlFiles();

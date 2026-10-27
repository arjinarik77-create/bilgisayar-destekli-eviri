
        // ========================================================
        // AURACAT İLK GİRİŞ KULLANICI PROFİLİ VE SUPABASE MOTORU
        // ========================================================
        const AuraCATFirstTimeUser = {
            storageKeyProfile: 'auracat_user_profile',
            storageKeyOnboarded: 'auracat_user_onboarded',
            storageKeySupabaseUrl: 'auracat_supabase_url',
            storageKeySupabaseKey: 'auracat_supabase_anon_key',

            // Varsayılan Supabase Ayarları (Kullanıcı dilerse arayüzden veya koddan güncelleyebilir)
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
                    this.openModal();
                } else {
                    this.reflectProfileInUI();
                }
            },

            openModal: function() {
                const modal = document.getElementById('firstTimeUserModal');
                if (!modal) return;
                
                // Form alanlarını hazırla
                const profile = this.getProfile();
                if (profile && profile.username) {
                    const userInput = document.getElementById('ft_username');
                    if (userInput) userInput.value = profile.username.replace(/^@/, '');
                    if (profile.language_pairs && profile.language_pairs.length > 0) {
                        this.selectedPairs = new Set(profile.language_pairs);
                    }
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
                const src = document.getElementById('ft_pair_source').value;
                const tgt = document.getElementById('ft_pair_target').value;
                if (src === tgt) {
                    showToast("⚠️ Kaynak dil ile hedef dil aynı olamaz.");
                    return;
                }
                this.selectedPairs.add(`${src} > ${tgt}`);
                this.renderPairs();
            },

            removePair: function(pair) {
                if (this.selectedPairs.size <= 1) {
                    showToast("⚠️ En az bir dil çifti seçili kalmalıdır.");
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
                    pill.innerHTML = `
                        <span>${p}</span>
                        <button type="button" onclick="AuraCATFirstTimeUser.removePair('${p}')" class="text-blue-400 hover:text-red-500 font-bold ml-1 cursor-pointer">&times;</button>
                    `;
                    container.appendChild(pill);
                });
            },

            handleSubmit: async function(e) {
                e.preventDefault();
                const userVal = document.getElementById('ft_username').value.trim();
                if (!userVal) {
                    showToast("⚠️ Lütfen geçerli bir kullanıcı adı girin.");
                    return;
                }

                if (this.selectedPairs.size === 0) {
                    showToast("⚠️ Lütfen en az bir dil çifti ekleyin.");
                    return;
                }

                const cleanUsername = userVal.startsWith('@') ? userVal : '@' + userVal;
                const pairsArray = Array.from(this.selectedPairs);

                // Supabase kimlikleri
                const urlEl = document.getElementById('ft_supabase_url');
                const keyEl = document.getElementById('ft_supabase_anon_key');
                const supabaseUrl = (urlEl && urlEl.value.trim()) ? urlEl.value.trim().replace(/\/+$/, '') : (localStorage.getItem(this.storageKeySupabaseUrl) || this.defaultSupabaseUrl);
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

                showToast(`🎉 Hoş geldiniz, ${cleanUsername}! Dil çiftleriniz ayarlandı.`);

                // Supabase'e gönder (Asenkron)
                this.sendToSupabase(profile, supabaseUrl, supabaseKey);
            },

            sendToSupabase: async function(profile, supabaseUrl, supabaseKey) {
                try {
                    // 1. Eğer sayfada Supabase SDK varsa doğrudan kullan
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
                        showToast(`☁️ Profiliniz Supabase bulut veritabanına kaydedildi.`);
                        return;
                    }

                    // 2. Fetch REST API ile doğrudan Supabase PostgREST uç noktasına gönder
                    const restEndpoint = `${supabaseUrl}/rest/v1/user_profiles`;
                    const res = await fetch(restEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
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
                        showToast(`☁️ Profiliniz Supabase bulut veritabanına kaydedildi.`);
                    }
                } catch (err) {
                    console.warn("Supabase bağlantısı (çevrimdışı/demo modu):", err.message || err);
                    // Kullanıcı deneyimini bozmaz; yerel localStorage kaydı zaten hazırdır.
                }
            },

            reflectProfileInUI: function() {
                const profile = this.getProfile();
                if (!profile) return;

                // Üst çubukta profil rozeti gösterimi
                const badge = document.getElementById('userProfileHeaderBadge');
                if (badge) {
                    badge.innerHTML = `
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span class="font-bold text-slate-800 dark:text-slate-100 font-mono">${profile.username}</span>
                        <span class="text-slate-400 font-mono text-[10px] hidden sm:inline">(${(profile.language_pairs || []).join(', ')})</span>
                    `;
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

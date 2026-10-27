const fs = require('fs');

const completeModule = `// ========================================================
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
                const userInput = document.getElementById('ft_username');
                
                if (profile) {
                    if (fullNameInput && profile.full_name) fullNameInput.value = profile.full_name;
                    if (userInput && profile.username) userInput.value = profile.username.replace(/^@/, '');
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
                
                const fullNameEl = document.getElementById('ft_fullname');
                const userEl = document.getElementById('ft_username');
                
                const fullNameVal = fullNameEl ? fullNameEl.value.trim() : '';
                const userVal = userEl ? userEl.value.trim() : '';

                if (!fullNameVal) {
                    if (typeof showToast === 'function') showToast("⚠️ Lütfen adınızı ve soyadınızı girin.");
                    return;
                }

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

                // Profil nesnesi
                const profile = {
                    full_name: fullNameVal,
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

                // Yerel hafızaya kaydet (SADECE BİR KERE SORMA GÜVENCESİ)
                localStorage.setItem(this.storageKeyProfile, JSON.stringify(profile));
                localStorage.setItem(this.storageKeyOnboarded, 'true');

                // UI'ya anında yansıt ve modalı kapat
                this.reflectProfileInUI();
                this.closeModal();

                if (typeof showToast === 'function') {
                    showToast(\`🎉 Hoş geldiniz, \${fullNameVal} (\${cleanUsername})!\`);
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
                
                const displayName = profile.full_name ? \`\${profile.full_name} (\${profile.username})\` : profile.username;
                
                if (usernameText) {
                    usernameText.textContent = profile.full_name || profile.username;
                }
                if (badge) {
                    badge.title = \`Kullanıcı: \${displayName} | Dil Çiftleri: \${(profile.language_pairs || []).join(', ')}\`;
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

function fixHtml(filename) {
    let content = fs.readFileSync(filename, 'utf8');

    const vaultStart = content.indexOf('// AURACAT GÜVENLİ SUPABASE KASA MODÜLÜ');
    // If not found, look for const _AURA_SUPABASE_VAULT
    let startIdx = vaultStart !== -1 ? content.lastIndexOf('// ========================================================', vaultStart) : content.indexOf('const _AURA_SUPABASE_VAULT');
    const endMarker = "window.addEventListener('DOMContentLoaded', () => {";
    const endIdx = content.indexOf(endMarker, startIdx);

    if (startIdx !== -1 && endIdx !== -1) {
        console.log(`[${filename}] Found module from ${startIdx} to ${endIdx}. Replacing cleanly...`);
        content = content.substring(0, startIdx) + completeModule + "\n\n        " + content.substring(endIdx);
        fs.writeFileSync(filename, content, 'utf8');
        console.log(`[${filename}] Successfully replaced.`);
    } else {
        console.error(`[${filename}] Could not find startIdx: ${startIdx}, endIdx: ${endIdx}`);
    }
}

fixHtml('legacy_index.html');
fixHtml('index.html');

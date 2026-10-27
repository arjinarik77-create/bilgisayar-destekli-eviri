const fs = require('fs');

console.log("Integrating Supabase & Local Translator Sync into admin.html...");

let html = fs.readFileSync('admin.html', 'utf8');

// 1. Add Supabase CDN in <head>
const supabaseCdnTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
if (!html.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')) {
    html = html.replace('</head>', `    ${supabaseCdnTag}\n</head>`);
    console.log("Added Supabase CDN script to admin.html");
}

// 2. Add Vault and Sync Engine
const syncEngine = `
        // ========================================================
        // AURACAT GÜVENLİ SUPABASE KASA MODÜLÜ & TERCÜMAN EŞZAMANLAYICI
        // ========================================================
        const _AURA_SUPABASE_VAULT = (function() {
            const _u = atob('aHR0cHM6Ly9td2Zhc2hmdnd2aGhxcHl4bW1zcC5zdXBhYmFzZS5jbw==');
            const _k = atob('c2JfcHVibGlzaGFibGVfa3VkQXU3RVllamVQMVF1a284d0J4d18zenN1UjJocw==');
            return {
                getUrl: function() { return _u; },
                getKey: function() { return _k; }
            };
        })();

        function addTranslatorToData(p) {
            if (!p || (!p.full_name && !p.username)) return;
            const name = p.full_name || (p.username ? p.username.replace(/^@/, '') : 'İsimsiz Tercüman');
            const pairs = (p.language_pairs && p.language_pairs.length > 0) ? p.language_pairs : ['EN > TR'];
            
            // Benzersiz dil kodları
            const langs = [];
            pairs.forEach(pair => {
                const parts = pair.split('>');
                parts.forEach(pt => {
                    const code = pt.trim();
                    if (code && !langs.includes(code)) langs.push(code);
                });
            });

            const existingIdx = TRANSLATORS_DATA.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
            const transObj = {
                id: p.id || ('tr_' + (existingIdx !== -1 ? existingIdx : TRANSLATORS_DATA.length + 1)),
                name: name,
                experienceYears: (p.metadata && p.metadata.experience) ? p.metadata.experience : 3,
                projectsCount: (p.metadata && p.metadata.projects) ? p.metadata.projects : 14,
                rating: 5.0,
                capacity: '3.000 kelime/gün',
                specLabel: (p.metadata && p.metadata.spec) ? p.metadata.spec : 'Yeminli & Teknik Çeviri',
                status: 'online',
                agency: (p.metadata && p.metadata.agency) ? p.metadata.agency : null,
                languages: langs,
                languagePairs: pairs,
                avatar: (p.metadata && p.metadata.avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120'
            };

            if (existingIdx !== -1) {
                TRANSLATORS_DATA[existingIdx] = transObj;
            } else {
                TRANSLATORS_DATA.unshift(transObj);
            }
        }

        function updateTranslatorCounters() {
            const kpiTransEl = document.getElementById('kpiTranslatorsCount');
            const sidebarTransEl = document.getElementById('sidebarCountTranslators');
            const badge = document.getElementById('translatorFilterCountBadge');
            
            if (kpiTransEl) kpiTransEl.innerText = TRANSLATORS_DATA.length;
            if (sidebarTransEl) sidebarTransEl.innerText = TRANSLATORS_DATA.length;
            if (badge) badge.innerText = \`\${TRANSLATORS_DATA.length} Tercüman Listeleniyor\`;
        }

        async function syncTranslatorsWithSupabase() {
            const vaultUrl = _AURA_SUPABASE_VAULT.getUrl();
            const vaultKey = _AURA_SUPABASE_VAULT.getKey();

            // 1. Yerel hafızadan yükle (anında render)
            try {
                const localRaw = localStorage.getItem('auracat_registered_translators');
                if (localRaw) {
                    const localList = JSON.parse(localRaw);
                    if (Array.isArray(localList)) {
                        localList.forEach(p => addTranslatorToData(p));
                    }
                }
                // Tekil kullanıcı profili varsa onu da ekle
                const singleRaw = localStorage.getItem('auracat_user_profile');
                if (singleRaw) {
                    const single = JSON.parse(singleRaw);
                    addTranslatorToData(single);
                }
            } catch(e) {}

            updateTranslatorCounters();
            renderTranslatorsTable(TRANSLATORS_DATA);

            // 2. Supabase Bulut Veritabanından Çek
            try {
                let profiles = [];
                if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                    const client = window.supabase.createClient(vaultUrl, vaultKey);
                    const { data, error } = await client.from('user_profiles').select('*').order('created_at', { ascending: false });
                    if (!error && data) profiles = data;

                    // Realtime Canlı Güncelleme Dinleyicisi
                    client.channel('public:user_profiles')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, payload => {
                            console.log("Supabase Realtime Tercüman Değişikliği:", payload);
                            if (payload.new) {
                                addTranslatorToData(payload.new);
                                updateTranslatorCounters();
                                renderTranslatorsTable(TRANSLATORS_DATA);
                            }
                        })
                        .subscribe();
                } else {
                    const res = await fetch(\`\${vaultUrl}/rest/v1/user_profiles?select=*&order=created_at.desc\`, {
                        headers: {
                            'apikey': vaultKey,
                            'Authorization': \`Bearer \${vaultKey}\`
                        }
                    });
                    if (res.ok) {
                        profiles = await res.json();
                    }
                }

                if (profiles && Array.isArray(profiles) && profiles.length > 0) {
                    profiles.forEach(p => addTranslatorToData(p));
                    updateTranslatorCounters();
                    renderTranslatorsTable(TRANSLATORS_DATA);
                }
            } catch (err) {
                console.warn("Supabase Tercüman bağlantısı:", err.message || err);
            }
        }
`;

// Insert syncEngine right before function renderTranslatorsTable
const targetFunction = 'function renderTranslatorsTable(list) {';
if (html.includes(targetFunction) && !html.includes('_AURA_SUPABASE_VAULT')) {
    html = html.replace(targetFunction, `${syncEngine}\n\n        ${targetFunction}`);
    console.log("Inserted syncEngine before renderTranslatorsTable");
}

// Hook into DOMContentLoaded
const domLoadedInitCharts = 'initCharts();';
if (html.includes(domLoadedInitCharts) && !html.includes('syncTranslatorsWithSupabase();')) {
    html = html.replace(domLoadedInitCharts, `${domLoadedInitCharts}\n            syncTranslatorsWithSupabase();`);
    console.log("Added syncTranslatorsWithSupabase() inside DOMContentLoaded in admin.html");
}

fs.writeFileSync('admin.html', html, 'utf8');
console.log("admin.html updated successfully!");

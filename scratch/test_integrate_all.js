const fs = require('fs');

console.log("Preparing complete AuraCAT Onboarding and Admin Panel integration...");

// Let's create the javascript engine for Onboarding and Admin Panel
const jsEngine = `
        // ========================================================
        // 7. SUPABASE SCHEMA & REALTIME DATABASE ENGINE (AuraCATDB)
        // ========================================================
        const AuraCATDB = {
            storageKey: 'auracat_profiles_v1',
            listeners: [],
            getProfiles: function() {
                try {
                    const data = localStorage.getItem(this.storageKey);
                    if (data) return JSON.parse(data);
                } catch(e) {}
                // Varsayılan Tohum Verileri (Tüm 4 Rol İçin Gerçekçi Veriler)
                const seed = [
                    {
                        id: 'usr_t_01',
                        created_at: '2026-10-27T10:14:20Z',
                        role: 'translator',
                        full_name: 'Zeynep Kaya',
                        username: '@zeynep_trans',
                        email: 'zeynep.kaya@linguist.net',
                        language_pairs: ['EN > TR', 'DE > TR'],
                        specialties: ['Tıp', 'Hukuk', 'Yazılım Yerelleştirme'],
                        status: 'approved'
                    },
                    {
                        id: 'usr_s_01',
                        created_at: '2026-10-27T11:05:42Z',
                        role: 'student',
                        full_name: 'Caner Demir',
                        username: '@caner_d',
                        email: 'caner.demir@boun.edu.tr',
                        university: 'Boğaziçi Üniversitesi - Çeviribilim',
                        language_pairs: ['EN > TR', 'FR > TR'],
                        specialties: ['Edebiyat', 'Alt Yazı Çevirisi'],
                        status: 'pending'
                    },
                    {
                        id: 'usr_a_01',
                        created_at: '2026-10-27T11:22:15Z',
                        role: 'academic',
                        full_name: 'Doç. Dr. Emre Arslan',
                        username: '@dr_emre_arslan',
                        email: 'emre.arslan@hacettepe.edu.tr',
                        university: 'Hacettepe Üniversitesi',
                        language_pairs: ['EN > TR', 'DE > TR'],
                        specialties: ['Terminoloji', 'Bilgisayar Destekli Çeviri (CAT)', 'Kuramsal Çeviri'],
                        status: 'approved'
                    },
                    {
                        id: 'usr_g_01',
                        created_at: '2026-10-27T11:45:00Z',
                        role: 'agency',
                        full_name: 'Apex Global Localization Ltd.',
                        username: '@apex_localization',
                        email: 'operations@apextranslate.com',
                        agency_name: 'Apex Global Localization Ltd.',
                        translator_capacity: '16-50 Tercüman',
                        language_pairs: ['EN > TR', 'DE > TR', 'ES > TR', 'AR > TR'],
                        specialties: ['Hukuk', 'Finans', 'Teknik', 'Patent'],
                        status: 'pending'
                    }
                ];
                this.saveProfiles(seed);
                return seed;
            },
            saveProfiles: function(profiles) {
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
                } catch(e) {}
                this.notifyListeners(profiles);
            },
            insertProfile: function(profileData) {
                const profiles = this.getProfiles();
                const newRecord = {
                    id: 'usr_' + Date.now().toString(36),
                    created_at: new Date().toISOString(),
                    status: 'pending', // Yönetici onayı bekler
                    ...profileData
                };
                profiles.unshift(newRecord);
                this.saveProfiles(profiles);
                return newRecord;
            },
            updateStatus: function(id, newStatus) {
                const profiles = this.getProfiles();
                const target = profiles.find(p => p.id === id);
                if (target) {
                    target.status = newStatus;
                    this.saveProfiles(profiles);
                }
            },
            subscribe: function(callback) {
                this.listeners.push(callback);
            },
            notifyListeners: function(profiles) {
                this.listeners.forEach(cb => {
                    try { cb(profiles); } catch(e) {}
                });
            }
        };

        // ----------------------------------------------------
        // 8. ONBOARDING SİHİRBAZI DURUM VE MANTIK YÖNETİCİSİ
        // ----------------------------------------------------
        const OnboardingWizard = {
            currentRole: null,
            currentStep: 0, // 0: Rol Seçimi, 1-4: Rol Adımları
            formData: {
                role: null,
                fullName: '',
                username: '',
                university: '',
                agencyName: '',
                translatorCapacity: '1-5',
                primaryPair: 'EN > TR',
                additionalPairs: [],
                specialties: [],
                email: '',
                password: ''
            },
            open: function(initialRole = null) {
                const modal = document.getElementById('onboardingWizardModal');
                if (!modal) return;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                if (initialRole) {
                    this.selectRole(initialRole);
                } else {
                    this.showRoleSelection();
                }
            },
            close: function() {
                const modal = document.getElementById('onboardingWizardModal');
                if (!modal) return;
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            },
            showRoleSelection: function() {
                this.currentRole = null;
                this.currentStep = 0;
                document.getElementById('wizardStepIndicatorBar').classList.add('hidden');
                document.getElementById('wizardBtnBack').classList.add('hidden');
                document.getElementById('wizardBtnNext').classList.add('hidden');
                document.getElementById('wizardMainTitle').innerText = 'AuraCAT Yetkilendirme Kapısı';
                document.getElementById('wizardSubtitle').innerText = 'Lütfen sisteme katılacağınız kullanıcı rolünü seçin';

                const container = document.getElementById('wizardContentContainer');
                container.innerHTML = \`
                    <div class="space-y-4">
                        <div class="text-center max-w-md mx-auto space-y-1 pb-2">
                            <h4 class="text-base font-bold text-slate-100">Kullanıcı Rolü ile Başlayın</h4>
                            <p class="text-slate-400 text-xs">AuraCAT çalışma alanınızı ve çeviri araçlarınızı yetkinliğinize göre otomatik yapılandırıyoruz.</p>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            <!-- 1. Tercüman -->
                            <div onclick="OnboardingWizard.selectRole('translator')"
                                class="p-4 rounded-xl border border-white/10 hover:border-cobalt/60 bg-black/20 hover:bg-cobalt/[0.04] transition-all cursor-pointer group flex flex-col justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-cobalt/20 text-cobalt-light border border-cobalt/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                            <path d="M8 9h8"/>
                                            <path d="M8 13h5"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-slate-100 group-hover:text-cobalt-light transition-colors">Tercüman</div>
                                        <p class="text-[11px] text-slate-400 mt-1">Bireysel profesyonel çevirmen ve yerelleştirme uzmanı.</p>
                                    </div>
                                </div>
                                <div class="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-cobalt-light font-semibold">
                                    <span>4 Adımlı Kurulum</span>
                                    <span>→</span>
                                </div>
                            </div>

                            <!-- 2. Öğrenci -->
                            <div onclick="OnboardingWizard.selectRole('student')"
                                class="p-4 rounded-xl border border-white/10 hover:border-emerald/60 bg-black/20 hover:bg-emerald/[0.04] transition-all cursor-pointer group flex flex-col justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-emerald-subtle text-emerald border border-emerald/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-slate-100 group-hover:text-emerald transition-colors">Öğrenci</div>
                                        <p class="text-[11px] text-slate-400 mt-1">Mütercim-Tercümanlık lisans veya lisansüstü öğrencisi.</p>
                                    </div>
                                </div>
                                <div class="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-emerald font-semibold">
                                    <span>.edu Doğrulamalı</span>
                                    <span>→</span>
                                </div>
                            </div>

                            <!-- 3. Akademisyen -->
                            <div onclick="OnboardingWizard.selectRole('academic')"
                                class="p-4 rounded-xl border border-white/10 hover:border-amber/60 bg-black/20 hover:bg-amber/[0.04] transition-all cursor-pointer group flex flex-col justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-amber-subtle text-amber border border-amber/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                            <line x1="9" y1="7" x2="15" y2="7"/>
                                            <line x1="9" y1="11" x2="13" y2="11"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-slate-100 group-hover:text-amber transition-colors">Akademisyen</div>
                                        <p class="text-[11px] text-slate-400 mt-1">Üniversite bünyesinde görev yapan öğretim üyesi ve araştırmacı.</p>
                                    </div>
                                </div>
                                <div class="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-amber font-semibold">
                                    <span>Kurumsal Lisans</span>
                                    <span>→</span>
                                </div>
                            </div>

                            <!-- 4. Çeviri Bürosu -->
                            <div onclick="OnboardingWizard.selectRole('agency')"
                                class="p-4 rounded-xl border border-white/10 hover:border-purple-500/60 bg-black/20 hover:bg-purple-500/[0.04] transition-all cursor-pointer group flex flex-col justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-slate-100 group-hover:text-purple-400 transition-colors">Çeviri Bürosu</div>
                                        <p class="text-[11px] text-slate-400 mt-1">Çoklu tercüman kadrosu yöneten kurumsal ajans.</p>
                                    </div>
                                </div>
                                <div class="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-purple-400 font-semibold">
                                    <span>LSP Çoklu Lisans</span>
                                    <span>→</span>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            },
            selectRole: function(role) {
                this.currentRole = role;
                this.formData.role = role;
                this.currentStep = 1;
                this.renderStep();
            },
            renderStep: function() {
                const role = this.currentRole;
                const step = this.currentStep;

                document.getElementById('wizardStepIndicatorBar').classList.remove('hidden');
                document.getElementById('wizardBtnBack').classList.remove('hidden');
                document.getElementById('wizardBtnNext').classList.remove('hidden');

                // Update Stepper Visuals
                for (let i = 1; i <= 4; i++) {
                    const el = document.getElementById('stepIndicator-' + i);
                    if (!el) continue;
                    const circle = el.querySelector('span:first-child');
                    const text = el.querySelector('span:last-child');
                    if (i < step) {
                        el.classList.remove('opacity-50');
                        circle.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-emerald text-white';
                        circle.innerHTML = '✓';
                        text.className = 'text-slate-300 font-medium';
                    } else if (i === step) {
                        el.classList.remove('opacity-50');
                        circle.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-cobalt text-white';
                        circle.innerText = '0' + i;
                        text.className = 'text-cobalt-light font-bold';
                    } else {
                        el.classList.add('opacity-50');
                        circle.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/10 text-slate-400';
                        circle.innerText = '0' + i;
                        text.className = 'text-slate-400 font-medium';
                    }
                }

                // Buton yazısı: 4. adımda "Kaydı Tamamla ve Gönder"
                const nextBtnText = document.getElementById('wizardBtnNextText');
                if (step === 4) {
                    nextBtnText.innerText = 'Kaydı Tamamla ve Başvuruyu Gönder';
                } else {
                    nextBtnText.innerText = 'Devam Et';
                }

                const container = document.getElementById('wizardContentContainer');

                // ---------------- ROL 1: TERCÜMAN ----------------
                if (role === 'translator') {
                    document.getElementById('wizardMainTitle').innerText = 'Tercüman Başvuru ve Kayıt Sihirbazı';
                    document.getElementById('wizardSubtitle').innerText = 'Adım ' + step + ' / 04: Profesyonel çevirmen profili oluşturun';

                    if (step === 1) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Adınız ve Soyadınız</label>
                                    <input type="text" id="wiz_fullName" value="\${this.formData.fullName || ''}" placeholder="Örn: Zeynep Kaya"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">AuraCAT Kullanıcı Adı</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-xs">@</span>
                                        <input type="text" id="wiz_username" value="\${this.formData.username ? this.formData.username.replace('@','') : ''}" placeholder="zeynep_trans"
                                            class="w-full h-9 pl-7 pr-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                    </div>
                                    <p class="text-[10px] text-slate-500 font-mono">Platformdaki çeviri projelerinde ve TM geçmişinde bu isimle görüneceksiniz.</p>
                                </div>
                            </div>
                        \`;
                    } else if (step === 2) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1.5">
                                    <label class="text-slate-300 font-semibold text-xs">Birincil Çalışma Dil Çifti</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <select id="wiz_srcLang" class="h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                            <option value="EN" selected>İngilizce (EN)</option>
                                            <option value="DE">Almanca (DE)</option>
                                            <option value="FR">Fransızca (FR)</option>
                                            <option value="ES">İspanyolca (ES)</option>
                                            <option value="RU">Rusça (RU)</option>
                                            <option value="TR">Türkçe (TR)</option>
                                        </select>
                                        <select id="wiz_tgtLang" class="h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                            <option value="TR" selected>Türkçe (TR)</option>
                                            <option value="EN">İngilizce (EN)</option>
                                            <option value="DE">Almanca (DE)</option>
                                            <option value="FR">Fransızca (FR)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-slate-300 font-semibold text-xs">Yetkin Olduğunuz Diğer Diller</label>
                                    <div class="flex flex-wrap gap-1.5" id="wiz_langPillContainer">
                                        <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'DE > TR')" class="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">DE > TR</button>
                                        <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'FR > TR')" class="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">FR > TR</button>
                                        <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'ES > TR')" class="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">ES > TR</button>
                                        <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'IT > TR')" class="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">IT > TR</button>
                                        <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'RU > TR')" class="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">RU > TR</button>
                                        <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'AR > TR')" class="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">AR > TR</button>
                                    </div>
                                </div>
                            </div>
                        \`;
                    } else if (step === 3) {
                        const allSpecs = ['Hukuk', 'Tıp & Klinik', 'Teknik & Mühendislik', 'Yazılım Yerelleştirme', 'Finans & Bankacılık', 'Edebiyat & Sanat', 'Oyun Yerelleştirme', 'Patent'];
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Uzmanlık Alanlarınız (Birden fazla seçebilirsiniz)</label>
                                    <p class="text-[11px] text-slate-400">Çeviri projeleri ve Concordance terim eşleşmeleri bu alanlara göre önceliklendirilir.</p>
                                </div>
                                <div class="grid grid-cols-2 gap-2" id="wiz_specContainer">
                                    \${allSpecs.map(s => {
                                        const isSel = (this.formData.specialties || []).includes(s);
                                        return \`<div onclick="OnboardingWizard.toggleSpecTag(this, '\${s}')" class="p-2.5 rounded-lg border \${isSel ? 'border-cobalt bg-cobalt/20 text-white' : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/20'} cursor-pointer flex items-center justify-between font-mono text-[11px] transition-colors">
                                            <span>\${s}</span>
                                            <span class="\${isSel ? 'text-cobalt-light' : 'text-slate-500'}">✓</span>
                                        </div>\`;
                                    }).join('')}
                                </div>
                            </div>
                        \`;
                    } else if (step === 4) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">E-posta Adresi</label>
                                    <input type="email" id="wiz_email" value="\${this.formData.email || ''}" placeholder="zeynep.kaya@linguist.net"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre</label>
                                    <input type="password" id="wiz_pwd" oninput="OnboardingWizard.checkPasswordStrength(this.value)" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                    <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                        <div id="pwdStrengthBar" class="h-full w-0 bg-amber transition-all duration-300"></div>
                                    </div>
                                    <span id="pwdStrengthText" class="text-[10px] font-mono text-slate-400">En az 8 karakter</span>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre Tekrarı</label>
                                    <input type="password" id="wiz_pwdConfirm" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                            </div>
                        \`;
                    }
                }

                // ---------------- ROL 2: ÖĞRENCİ ----------------
                else if (role === 'student') {
                    document.getElementById('wizardMainTitle').innerText = 'Öğrenci Kayıt ve Doğrulama';
                    document.getElementById('wizardSubtitle').innerText = 'Adım ' + step + ' / 04: Üniversite e-postasıyla akademik erişim';

                    if (step === 1) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Adınız ve Soyadınız</label>
                                    <input type="text" id="wiz_fullName" value="\${this.formData.fullName || ''}" placeholder="Örn: Caner Demir"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                            </div>
                        \`;
                    } else if (step === 2) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Öğrenim Gördüğünüz Üniversite ve Bölüm</label>
                                    <input type="text" id="wiz_university" value="\${this.formData.university || ''}" placeholder="Örn: Boğaziçi Üniversitesi - Çeviribilim"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                    <p class="text-[10px] text-slate-400 font-mono">Akademik araştırma ve bitirme projeleri için ücretsiz kurumsal lisans sağlanır.</p>
                                </div>
                            </div>
                        \`;
                    } else if (step === 3) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Çalıştığınız Dil Çifti</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <select id="wiz_srcLang" class="h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                            <option value="EN" selected>İngilizce (EN)</option>
                                            <option value="DE">Almanca (DE)</option>
                                            <option value="FR">Fransızca (FR)</option>
                                        </select>
                                        <select id="wiz_tgtLang" class="h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                            <option value="TR" selected>Türkçe (TR)</option>
                                            <option value="EN">İngilizce (EN)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        \`;
                    } else if (step === 4) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Öğrenci E-posta Adresi (.edu / .edu.tr)</label>
                                    <input type="email" id="wiz_email" value="\${this.formData.email || ''}" placeholder="caner.demir@boun.edu.tr"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                    <p class="text-[10px] text-emerald font-mono">.edu uzantılı adresler anında doğrulanır.</p>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre</label>
                                    <input type="password" id="wiz_pwd" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre Tekrarı</label>
                                    <input type="password" id="wiz_pwdConfirm" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                            </div>
                        \`;
                    }
                }

                // ---------------- ROL 3: AKADEMİSYEN ----------------
                else if (role === 'academic') {
                    document.getElementById('wizardMainTitle').innerText = 'Akademisyen Başvuru Portalı';
                    document.getElementById('wizardSubtitle').innerText = 'Adım ' + step + ' / 04: Araştırmacı ve öğretim üyesi kaydı';

                    if (step === 1) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Unvan, Ad ve Soyad</label>
                                    <input type="text" id="wiz_fullName" value="\${this.formData.fullName || ''}" placeholder="Örn: Doç. Dr. Emre Arslan"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Görev Yapılan Üniversite ve Enstitü</label>
                                    <input type="text" id="wiz_university" value="\${this.formData.university || ''}" placeholder="Örn: Hacettepe Üniversitesi - Çeviribilim Bölümü"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                            </div>
                        \`;
                    } else if (step === 2) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Akademik Araştırma Dil Çifti</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <select id="wiz_srcLang" class="h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                            <option value="EN" selected>İngilizce (EN)</option>
                                            <option value="DE">Almanca (DE)</option>
                                            <option value="FR">Fransızca (FR)</option>
                                            <option value="ES">İspanyolca (ES)</option>
                                        </select>
                                        <select id="wiz_tgtLang" class="h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                            <option value="TR" selected>Türkçe (TR)</option>
                                            <option value="EN">İngilizce (EN)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        \`;
                    } else if (step === 3) {
                        const acadSpecs = ['Çeviribilim Kuramları', 'Terminoloji Standartları', 'Bilgisayar Destekli Çeviri (CAT)', 'Sözlü Çeviri & AVT', 'Makine Çevirisi & Post-Editing', 'Derlem Dilbilim'];
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Akademik Uzmanlık ve Araştırma Alanı</label>
                                </div>
                                <div class="grid grid-cols-1 gap-2" id="wiz_specContainer">
                                    \${acadSpecs.map(s => {
                                        const isSel = (this.formData.specialties || []).includes(s);
                                        return \`<div onclick="OnboardingWizard.toggleSpecTag(this, '\${s}')" class="p-2.5 rounded-lg border \${isSel ? 'border-amber bg-amber/20 text-white' : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/20'} cursor-pointer flex items-center justify-between font-mono text-[11px] transition-colors">
                                            <span>\${s}</span>
                                            <span class="\${isSel ? 'text-amber' : 'text-slate-500'}">✓</span>
                                        </div>\`;
                                    }).join('')}
                                </div>
                            </div>
                        \`;
                    } else if (step === 4) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Kurumsal Üniversite E-posta Adresi</label>
                                    <input type="email" id="wiz_email" value="\${this.formData.email || ''}" placeholder="emre.arslan@hacettepe.edu.tr"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre</label>
                                    <input type="password" id="wiz_pwd" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre Tekrarı</label>
                                    <input type="password" id="wiz_pwdConfirm" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                            </div>
                        \`;
                    }
                }

                // ---------------- ROL 4: ÇEVİRİ BÜROSU ----------------
                else if (role === 'agency') {
                    document.getElementById('wizardMainTitle').innerText = 'Çeviri Bürosu / LSP Kurumsal Başvuru';
                    document.getElementById('wizardSubtitle').innerText = 'Adım ' + step + ' / 04: Ajans ve ekip lisansı yapılandırması';

                    if (step === 1) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Çeviri Bürosu / Şirket Adı</label>
                                    <input type="text" id="wiz_agencyName" value="\${this.formData.agencyName || ''}" placeholder="Örn: Apex Global Localization Ltd."
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Sisteme Katılacak Tercüman Kapasitesi</label>
                                    <select id="wiz_capacity" class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-cobalt-light">
                                        <option value="1-5">1 - 5 Tercüman (Başlangıç LSP)</option>
                                        <option value="6-15" selected>6 - 15 Tercüman (Büyüyen Ajans)</option>
                                        <option value="16-50">16 - 50 Tercüman (Kurumsal LSP)</option>
                                        <option value="50+">50+ Tercüman (Enterprise Global)</option>
                                    </select>
                                </div>
                            </div>
                        \`;
                    } else if (step === 2) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Hizmet Verilen Temel Dil Çiftleri</label>
                                    <p class="text-[11px] text-slate-400">Ajansınızın aktif çalıştığı diller:</p>
                                </div>
                                <div class="grid grid-cols-2 gap-2" id="wiz_langPillContainer">
                                    <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'EN > TR')" class="p-2 rounded bg-cobalt/20 border border-cobalt text-white font-mono text-[11px] cursor-pointer">EN > TR (Seçili)</button>
                                    <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'DE > TR')" class="p-2 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">DE > TR</button>
                                    <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'FR > TR')" class="p-2 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">FR > TR</button>
                                    <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'ES > TR')" class="p-2 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">ES > TR</button>
                                    <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'AR > TR')" class="p-2 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">AR > TR</button>
                                    <button type="button" onclick="OnboardingWizard.toggleLanguageTag(this, 'RU > TR')" class="p-2 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 hover:border-cobalt-light cursor-pointer">RU > TR</button>
                                </div>
                            </div>
                        \`;
                    } else if (step === 3) {
                        const agencySpecs = ['Hukuk & Sözleşmeler', 'Tıbbi Cihaz & Farmasötik', 'Yazılım ve Web Yerelleştirme', 'Finans & İzahname', 'Otomotiv & Ağır Sanayi', 'Patent & Fikri Mülkiyet'];
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Kurumsal Uzmanlık Alanları</label>
                                </div>
                                <div class="grid grid-cols-2 gap-2" id="wiz_specContainer">
                                    \${agencySpecs.map(s => {
                                        const isSel = (this.formData.specialties || []).includes(s);
                                        return \`<div onclick="OnboardingWizard.toggleSpecTag(this, '\${s}')" class="p-2.5 rounded-lg border \${isSel ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/20'} cursor-pointer flex items-center justify-between font-mono text-[11px] transition-colors">
                                            <span>\${s}</span>
                                            <span class="\${isSel ? 'text-purple-400' : 'text-slate-500'}">✓</span>
                                        </div>\`;
                                    }).join('')}
                                </div>
                            </div>
                        \`;
                    } else if (step === 4) {
                        container.innerHTML = \`
                            <div class="space-y-4 max-w-md mx-auto py-2">
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Büro Resmi E-posta Adresi (İletişim & Fatura)</label>
                                    <input type="email" id="wiz_email" value="\${this.formData.email || ''}" placeholder="operations@apextranslate.com"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-sans">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Yönetici Şifresi</label>
                                    <input type="password" id="wiz_pwd" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-slate-300 font-semibold text-xs">Şifre Tekrarı</label>
                                    <input type="password" id="wiz_pwdConfirm" placeholder="••••••••••••"
                                        class="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-cobalt-light font-mono">
                                </div>
                            </div>
                        \`;
                    }
                }
            },
            toggleLanguageTag: function(btn, pair) {
                if (!this.formData.additionalPairs) this.formData.additionalPairs = [];
                const idx = this.formData.additionalPairs.indexOf(pair);
                if (idx > -1) {
                    this.formData.additionalPairs.splice(idx, 1);
                    btn.classList.remove('bg-cobalt/20', 'border-cobalt', 'text-white');
                    btn.classList.add('bg-white/5', 'border-white/10', 'text-slate-300');
                } else {
                    this.formData.additionalPairs.push(pair);
                    btn.classList.add('bg-cobalt/20', 'border-cobalt', 'text-white');
                    btn.classList.remove('bg-white/5', 'border-white/10', 'text-slate-300');
                }
            },
            toggleSpecTag: function(el, spec) {
                if (!this.formData.specialties) this.formData.specialties = [];
                const idx = this.formData.specialties.indexOf(spec);
                if (idx > -1) {
                    this.formData.specialties.splice(idx, 1);
                    el.classList.remove('border-cobalt', 'bg-cobalt/20', 'border-amber', 'bg-amber/20', 'border-purple-500', 'bg-purple-500/20', 'text-white');
                    el.classList.add('border-white/10', 'bg-black/20', 'text-slate-300');
                } else {
                    this.formData.specialties.push(spec);
                    el.classList.add('border-cobalt', 'bg-cobalt/20', 'text-white');
                    el.classList.remove('border-white/10', 'bg-black/20', 'text-slate-300');
                }
            },
            checkPasswordStrength: function(val) {
                const bar = document.getElementById('pwdStrengthBar');
                const text = document.getElementById('pwdStrengthText');
                if (!bar || !text) return;
                const len = val.length;
                if (len < 6) {
                    bar.style.width = '25%';
                    bar.className = 'h-full bg-red-500 transition-all duration-300';
                    text.innerText = 'Zayıf (En az 8 karakter önerilir)';
                    text.className = 'text-[10px] font-mono text-red-400';
                } else if (len < 10) {
                    bar.style.width = '65%';
                    bar.className = 'h-full bg-amber transition-all duration-300';
                    text.innerText = 'Orta Düzey';
                    text.className = 'text-[10px] font-mono text-amber';
                } else {
                    bar.style.width = '100%';
                    bar.className = 'h-full bg-emerald transition-all duration-300';
                    text.innerText = 'Güçlü Şifre';
                    text.className = 'text-[10px] font-mono text-emerald';
                }
            },
            saveCurrentStepData: function() {
                const step = this.currentStep;
                const role = this.currentRole;

                if (step === 1) {
                    const fn = document.getElementById('wiz_fullName');
                    if (fn) this.formData.fullName = fn.value.trim();
                    const un = document.getElementById('wiz_username');
                    if (un) this.formData.username = '@' + un.value.trim().replace(/^@/, '');
                    const ag = document.getElementById('wiz_agencyName');
                    if (ag) this.formData.agencyName = ag.value.trim();
                    const cap = document.getElementById('wiz_capacity');
                    if (cap) this.formData.translatorCapacity = cap.value;
                } else if (step === 2) {
                    const unv = document.getElementById('wiz_university');
                    if (unv) this.formData.university = unv.value.trim();
                    const src = document.getElementById('wiz_srcLang');
                    const tgt = document.getElementById('wiz_tgtLang');
                    if (src && tgt) this.formData.primaryPair = \`\${src.value} > \${tgt.value}\`;
                } else if (step === 4) {
                    const em = document.getElementById('wiz_email');
                    if (em) this.formData.email = em.value.trim();
                    const pw = document.getElementById('wiz_pwd');
                    if (pw) this.formData.password = pw.value;
                }
            },
            next: function() {
                this.saveCurrentStepData();

                // 4. adım tamamlandığında Supabase'e gönder
                if (this.currentStep === 4) {
                    this.submitToSupabase();
                    return;
                }

                if (this.currentStep < 4) {
                    this.currentStep++;
                    this.renderStep();
                }
            },
            back: function() {
                this.saveCurrentStepData();
                if (this.currentStep > 1) {
                    this.currentStep--;
                    this.renderStep();
                } else {
                    this.showRoleSelection();
                }
            },
            submitToSupabase: function() {
                const f = this.formData;
                if (!f.email) {
                    showToast("Lütfen e-posta adresinizi giriniz.");
                    return;
                }

                const pairs = [f.primaryPair, ...(f.additionalPairs || [])].filter(Boolean);
                const record = AuraCATDB.insertProfile({
                    role: f.role,
                    full_name: f.fullName || f.agencyName || 'Kayıtlı Kullanıcı',
                    username: f.username || ('@' + (f.email.split('@')[0])),
                    email: f.email,
                    university: f.university || '',
                    agency_name: f.agencyName || '',
                    translator_capacity: f.translatorCapacity || '',
                    language_pairs: pairs.length ? pairs : ['EN > TR'],
                    specialties: (f.specialties && f.specialties.length) ? f.specialties : ['Genel Yerelleştirme']
                });

                this.close();
                showToast(\`✓ Başvurunuz Supabase Realtime veritabanına kaydedildi. Yönetici onayından sonra bilgilendirileceksiniz.\`);
            }
        };

        function openOnboardingWizard(role = null) {
            OnboardingWizard.open(role);
        }
        function closeOnboardingWizard() {
            OnboardingWizard.close();
        }
        function handleWizardNext() {
            OnboardingWizard.next();
        }
        function handleWizardBack() {
            OnboardingWizard.back();
        }

        // ----------------------------------------------------
        // 9. YÖNETİCİ PANELİ (ADMIN DASHBOARD CONTROLLER)
        // ----------------------------------------------------
        let adminCurrentRoleFilter = 'all';

        function openAdminPanel() {
            const modal = document.getElementById('adminPanelModal');
            if (!modal) return;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            renderAdminTable();
        }

        function closeAdminPanel() {
            const modal = document.getElementById('adminPanelModal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function setAdminRoleFilter(role) {
            adminCurrentRoleFilter = role;
            const roles = ['all', 'translator', 'student', 'academic', 'agency'];
            roles.forEach(r => {
                const btn = document.getElementById('adminFilter-' + r);
                if (btn) {
                    if (r === role) {
                        btn.className = 'px-3 py-1 rounded-md font-mono text-[11px] font-bold bg-white/10 text-white cursor-pointer transition-colors';
                    } else {
                        btn.className = 'px-3 py-1 rounded-md font-mono text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer transition-colors';
                    }
                }
            });
            renderAdminTable();
        }

        function renderAdminTable() {
            const tbody = document.getElementById('adminTableBody');
            if (!tbody) return;

            const allProfiles = AuraCATDB.getProfiles();
            const searchInput = document.getElementById('adminSearchInput');
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

            // İstatistikleri güncelle
            updateAdminStats(allProfiles);

            // Filtreleme
            const filtered = allProfiles.filter(p => {
                const matchesRole = (adminCurrentRoleFilter === 'all' || p.role === adminCurrentRoleFilter);
                const matchesSearch = !query || 
                    (p.full_name && p.full_name.toLowerCase().includes(query)) ||
                    (p.email && p.email.toLowerCase().includes(query)) ||
                    (p.university && p.university.toLowerCase().includes(query)) ||
                    (p.username && p.username.toLowerCase().includes(query));
                return matchesRole && matchesSearch;
            });

            // Alt bilgi
            const footerInfo = document.getElementById('adminTableFooterInfo');
            if (footerInfo) footerInfo.innerText = \`\${filtered.length} Kayıt Gösteriliyor (Toplam \${allProfiles.length})\`;

            if (filtered.length === 0) {
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="8" class="p-8 text-center text-slate-500 font-mono text-xs">
                            Kriterlere uygun başvuru kaydı bulunamadı.
                        </td>
                    </tr>
                \`;
                return;
            }

            const roleBadges = {
                translator: { label: 'Tercüman', color: 'bg-cobalt/20 text-cobalt-light border-cobalt/30' },
                student: { label: 'Öğrenci', color: 'bg-emerald-subtle text-emerald border-emerald/30' },
                academic: { label: 'Akademisyen', color: 'bg-amber-subtle text-amber border-amber/30' },
                agency: { label: 'Çeviri Bürosu', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
            };

            const statusBadges = {
                approved: '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-subtle text-emerald border border-emerald/30">Onaylandı</span>',
                pending: '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-subtle text-amber border border-amber/30">Beklemede</span>',
                suspended: '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">Askıya Alındı</span>'
            };

            tbody.innerHTML = filtered.map(p => {
                const rb = roleBadges[p.role] || { label: p.role, color: 'bg-white/10 text-slate-300' };
                const sb = statusBadges[p.status] || p.status;
                const pairsStr = (p.language_pairs || []).slice(0, 2).join(', ') + ((p.language_pairs || []).length > 2 ? ' +' : '');
                const specsStr = (p.specialties || []).slice(0, 2).join(', ');
                const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '-';
                const subTitle = p.university || p.agency_name || p.username || '';

                return \`
                    <tr class="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                        <td class="p-3 pl-6">
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border \${rb.color}">\${rb.label}</span>
                        </td>
                        <td class="p-3 font-medium text-slate-100">
                            <div>\${p.full_name}</div>
                            \${subTitle ? \`<div class="text-[10px] text-slate-500 font-mono">\${subTitle}</div>\` : ''}
                        </td>
                        <td class="p-3 font-mono text-[11px] text-slate-400">
                            <div>\${p.email}</div>
                            <div class="text-[10px] text-slate-500">\${p.username || ''}</div>
                        </td>
                        <td class="p-3 font-mono text-[11px] text-slate-300">
                            \${pairsStr}
                        </td>
                        <td class="p-3 text-[11px] text-slate-400">
                            \${specsStr || '-'}
                        </td>
                        <td class="p-3 font-mono text-[10px] text-slate-500">
                            \${dateStr}
                        </td>
                        <td class="p-3 text-center">
                            \${sb}
                        </td>
                        <td class="p-3 pr-6 text-right space-x-1.5 whitespace-nowrap">
                            <button type="button" onclick="viewProfileDetail('\${p.id}')" class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono cursor-pointer border border-white/10" title="Detay Dosyayı İncele">
                                Detay
                            </button>
                            \${p.status !== 'approved' ? \`
                                <button type="button" onclick="updateProfileStatus('\${p.id}', 'approved')" class="px-2 py-1 rounded bg-emerald hover:bg-emerald-600 text-white text-[10px] font-mono font-bold cursor-pointer transition-colors shadow-xs">
                                    Onayla
                                </button>
                            \` : ''}
                            \${p.status !== 'suspended' ? \`
                                <button type="button" onclick="updateProfileStatus('\${p.id}', 'suspended')" class="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-mono cursor-pointer transition-colors border border-red-500/30">
                                    Askıya Al
                                </button>
                            \` : ''}
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function updateAdminStats(profiles) {
            const total = profiles.length;
            const approved = profiles.filter(p => p.status === 'approved').length;
            const pending = profiles.filter(p => p.status === 'pending').length;
            const agencies = profiles.filter(p => p.role === 'agency').length;
            const academics = profiles.filter(p => p.role === 'academic').length;

            const tEl = document.getElementById('adminStatTotal');
            const aEl = document.getElementById('adminStatApproved');
            const pEl = document.getElementById('adminStatPending');
            const gEl = document.getElementById('adminStatAgency');

            if (tEl) tEl.innerText = total;
            if (aEl) aEl.innerText = approved;
            if (pEl) pEl.innerText = pending;
            if (gEl) gEl.innerText = \`\${agencies} Büro + \${academics} Üniv.\`;

            // Sayaçlar
            const cAll = document.getElementById('count-all');
            const cT = document.getElementById('count-translator');
            const cS = document.getElementById('count-student');
            const cAc = document.getElementById('count-academic');
            const cAg = document.getElementById('count-agency');

            if (cAll) cAll.innerText = total;
            if (cT) cT.innerText = profiles.filter(p => p.role === 'translator').length;
            if (cS) cS.innerText = profiles.filter(p => p.role === 'student').length;
            if (cAc) cAc.innerText = academics;
            if (cAg) cAg.innerText = agencies;
        }

        function updateProfileStatus(id, newStatus) {
            AuraCATDB.updateStatus(id, newStatus);
            renderAdminTable();
            showToast(\`Profil durumu "\${newStatus === 'approved' ? 'Onaylandı' : 'Askıya Alındı'}" olarak güncellendi.\`);
        }

        function viewProfileDetail(id) {
            const profiles = AuraCATDB.getProfiles();
            const p = profiles.find(item => item.id === id);
            if (!p) return;

            const detailModal = document.getElementById('adminDetailModal');
            const content = document.getElementById('adminDetailContent');
            const actions = document.getElementById('adminDetailActions');
            if (!detailModal || !content || !actions) return;

            content.innerHTML = \`
                <div class="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2 text-xs">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Rol:</span>
                        <span class="font-bold text-cobalt-light uppercase">\${p.role}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Ad Soyad / Kurum:</span>
                        <span class="text-slate-100 font-semibold">\${p.full_name}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Kullanıcı Adı:</span>
                        <span class="text-slate-300">\${p.username || '-'}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">E-posta:</span>
                        <span class="text-slate-300">\${p.email}</span>
                    </div>
                    \${p.university ? \`
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Üniversite:</span>
                        <span class="text-slate-200">\${p.university}</span>
                    </div>\` : ''}
                    \${p.translator_capacity ? \`
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Tercüman Kapasitesi:</span>
                        <span class="text-purple-400">\${p.translator_capacity}</span>
                    </div>\` : ''}
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Dil Çiftleri:</span>
                        <span class="text-emerald font-semibold">\${(p.language_pairs || []).join(', ')}</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <span class="text-slate-400">Uzmanlıklar:</span>
                        <span class="text-slate-200 text-right">\${(p.specialties || []).join(', ') || '-'}</span>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-white/10">
                        <span class="text-slate-400">Mevcut Durum:</span>
                        <span class="font-bold \${p.status === 'approved' ? 'text-emerald' : (p.status === 'pending' ? 'text-amber' : 'text-red-400')}">\${p.status.toUpperCase()}</span>
                    </div>
                </div>
            \`;

            actions.innerHTML = \`
                <button type="button" onclick="closeAdminDetailModal()" class="px-3 py-1.5 rounded-md text-slate-400 hover:text-white bg-white/5 border border-white/10">Kapat</button>
                \${p.status !== 'approved' ? \`<button type="button" onclick="updateProfileStatus('\${p.id}', 'approved'); closeAdminDetailModal();" class="px-4 py-1.5 rounded-md bg-emerald hover:bg-emerald-600 text-white font-bold">Başvuruyu Onayla</button>\` : ''}
                \${p.status !== 'suspended' ? \`<button type="button" onclick="updateProfileStatus('\${p.id}', 'suspended'); closeAdminDetailModal();" class="px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30">Askıya Al</button>\` : ''}
            \`;

            detailModal.classList.remove('hidden');
            detailModal.classList.add('flex');
        }

        function closeAdminDetailModal() {
            const detailModal = document.getElementById('adminDetailModal');
            if (detailModal) {
                detailModal.classList.add('hidden');
                detailModal.classList.remove('flex');
            }
        }

        function resetDatabaseDemo() {
            localStorage.removeItem(AuraCATDB.storageKey);
            AuraCATDB.getProfiles();
            renderAdminTable();
            showToast("Veritabanı örnek kayıtlarla sıfırlandı.");
        }

        // Realtime Abone Ol: Veri tabanında herhangi bir profil eklendiğinde veya güncellendiğinde Admin Tablosunu anında tazele
        AuraCATDB.subscribe(() => {
            renderAdminTable();
        });
`;

fs.writeFileSync('scratch/onboarding_and_admin.js', jsEngine, 'utf8');
console.log("Successfully created scratch/onboarding_and_admin.js");

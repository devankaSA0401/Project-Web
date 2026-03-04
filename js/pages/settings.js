/**
 * TOKO NADYN POS – Settings Page
 */
const SettingsPage = {
    render(el) {
        const currentTheme = localStorage.getItem('nadyn_theme') || 'dark';
        const currentLang = localStorage.getItem('nadyn_lang') || 'id';

        el.innerHTML = `
        <div class="page-header">
            <div class="page-header-left">
                <div class="page-title">⚙️ Pengaturan</div>
                <div class="page-subtitle">Konfigurasi tampilan & informasi aplikasi</div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;max-width:900px">

            <!-- TEMA -->
            <div class="card" style="padding:28px">
                <div style="font-size:18px;font-weight:700;margin-bottom:6px">🎨 Tema Tampilan</div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Pilih tampilan gelap atau terang sesuai preferensi Anda</div>
                <div style="display:flex;gap:12px">
                    <button id="btn-theme-dark" class="btn ${currentTheme === 'dark' ? 'btn-primary' : 'btn-outline'}" style="flex:1;padding:16px;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:8px;height:auto">
                        <span style="font-size:28px">🌙</span>
                        <span style="font-weight:700">Gelap</span>
                        <span style="font-size:11px;opacity:0.7">Dark Mode</span>
                    </button>
                    <button id="btn-theme-light" class="btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-outline'}" style="flex:1;padding:16px;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:8px;height:auto">
                        <span style="font-size:28px">☀️</span>
                        <span style="font-weight:700">Terang</span>
                        <span style="font-size:11px;opacity:0.7">Light Mode</span>
                    </button>
                </div>
            </div>

            <!-- BAHASA -->
            <div class="card" style="padding:28px">
                <div style="font-size:18px;font-weight:700;margin-bottom:6px">🌐 Bahasa / Language</div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Pilih bahasa yang digunakan pada antarmuka</div>
                <div style="display:flex;gap:12px">
                    <button id="btn-lang-id" class="btn ${currentLang === 'id' ? 'btn-primary' : 'btn-outline'}" style="flex:1;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;height:auto">
                        <span style="font-size:28px">🇮🇩</span>
                        <span style="font-weight:700">Indonesia</span>
                    </button>
                    <button id="btn-lang-en" class="btn ${currentLang === 'en' ? 'btn-primary' : 'btn-outline'}" style="flex:1;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;height:auto">
                        <span style="font-size:28px">🇬🇧</span>
                        <span style="font-weight:700">English</span>
                        <span style="font-size:11px;opacity:0.7">Coming soon</span>
                    </button>
                </div>
            </div>

            <!-- ABOUT -->
            <div class="card" style="padding:28px">
                <div style="font-size:18px;font-weight:700;margin-bottom:20px">ℹ️ Tentang Aplikasi</div>
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
                    <div style="font-size:48px;filter:drop-shadow(0 0 16px rgba(99,102,241,.5))">⚡</div>
                    <div>
                        <div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#fff,var(--primary-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent">TOKO NADYN</div>
                        <div style="color:var(--text-muted);font-size:13px">Point of Sale System</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px">
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                        <span style="color:var(--text-muted)">Versi Aplikasi</span>
                        <span class="badge badge-success">v1.0.0</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                        <span style="color:var(--text-muted)">Database Engine</span>
                        <span style="font-weight:600">Microsoft SQL Server</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                        <span style="color:var(--text-muted)">Backend</span>
                        <span style="font-weight:600">Node.js + Express</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                        <span style="color:var(--text-muted)">Platform</span>
                        <span style="font-weight:600">Web App (Standalone)</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                        <span style="color:var(--text-muted)">Domain</span>
                        <span style="font-weight:600">tokonadin.com</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0">
                        <span style="color:var(--text-muted)">Dibuat untuk</span>
                        <span style="font-weight:600">Toko Listrik NADYN</span>
                    </div>
                </div>
            </div>

            <!-- DATA MANAGEMENT -->
            <div class="card" style="padding:28px">
                <div style="font-size:18px;font-weight:700;margin-bottom:6px">🗄️ Manajemen Data</div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Opsi pengelolaan data dan sesi aplikasi</div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <button onclick="Auth.logout(); location.reload();" class="btn btn-outline" style="justify-content:flex-start;gap:12px;padding:14px 16px">
                        <span>🚪</span> Keluar / Logout
                    </button>
                    <div style="padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);font-size:12px;color:var(--text-muted)">
                        ⚠️ Untuk hapus data atau backup database, hubungi administrator sistem atau gunakan SQL Server Management Studio (SSMS).
                    </div>
                </div>
            </div>

        </div>`;

        // Theme toggle
        el.querySelector('#btn-theme-dark').addEventListener('click', () => {
            localStorage.setItem('nadyn_theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
            SettingsPage.render(el);
            Utils.toast('Tema Gelap diaktifkan 🌙', 'success');
        });
        el.querySelector('#btn-theme-light').addEventListener('click', () => {
            localStorage.setItem('nadyn_theme', 'light');
            document.body.setAttribute('data-theme', 'light');
            SettingsPage.render(el);
            Utils.toast('Tema Terang diaktifkan ☀️', 'success');
        });

        // Language (Indonesia only for now)
        el.querySelector('#btn-lang-id').addEventListener('click', () => {
            localStorage.setItem('nadyn_lang', 'id');
            SettingsPage.render(el);
            Utils.toast('Bahasa Indonesia dipilih 🇮🇩', 'success');
        });
        el.querySelector('#btn-lang-en').addEventListener('click', () => {
            Utils.toast('Bahasa Inggris belum tersedia, coming soon! 🇬🇧', 'info');
        });
    }
};

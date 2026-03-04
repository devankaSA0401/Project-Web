/**
 * TOKO NADYN POS – App Orchestrator (SQL Server Version)
 */

const App = {
    currentPage: 'dashboard',
    pages: null,

    _initPages() {
        this.pages = {
            dashboard: DashboardPage,
            pos: POSPage,
            pembelian: PembelianPage,
            stok: StokPage,
            cashflow: CashFlowPage,
            akuntansi: AkuntansiPage,
            laporan: LaporanPage,
            barang: BarangPage,
            supplier: SupplierPage,
            customer: CustomerPage,
            'user-mgmt': UserMgmtPage,
            settings: SettingsPage
        };
    },

    async init() {
        try {
            this._initPages();

            // 2. Setup login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    console.log('Login attempt initiated...');
                    const username = document.getElementById('login-username').value;
                    const password = document.getElementById('login-password').value;
                    try {
                        const success = await Auth.login(username, password);
                        if (success) {
                            this.showApp();
                        } else {
                            Utils.toast('Username atau password salah atau backend offline!', 'error');
                        }
                    } catch (err) {
                        console.error('Error during login:', err);
                        Utils.toast('Gagal menghubungi server. Pastikan backend aktif!', 'error');
                    }
                });
                console.log('✅ Login listener attached.');
            }

            // 3. Initial session check
            if (Auth.init()) {
                this.showApp();
            }
        } catch (err) {
            console.error('App init failed:', err);
            Utils.toast('Inisialisasi aplikasi gagal! Cek console.', 'error');
        }
    },

    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('user-avatar').textContent = Auth.currentUser?.nama?.[0]?.toUpperCase() || 'A';
        document.getElementById('user-name').textContent = Auth.currentUser?.nama || 'User';
        document.getElementById('user-role').textContent = Auth.currentUser?.role === 'admin' ? 'Administrator' : 'Kasir';

        if (!Auth.isAdmin()) {
            const navUser = document.getElementById('nav-user-mgmt');
            if (navUser) navUser.style.display = 'none';
        }

        // Apply saved theme on login
        const savedTheme = localStorage.getItem('nadyn_theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);

        this.setupNavigation();
        this.navigate('dashboard');
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(newItem.dataset.page);
                // On mobile: close sidebar after click
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('mobile-active');
                }
            });
        });

        // Single unified toggle button
        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (toggle) {
            toggle.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    // Mobile: show/hide overlay
                    sidebar.classList.toggle('mobile-active');
                } else {
                    // Desktop/Tablet: collapse/expand
                    sidebar.classList.toggle('collapsed');
                }
            });
        }

        const logout = document.getElementById('logout-btn');
        if (logout) {
            logout.addEventListener('click', () => {
                Utils.confirm('Yakin ingin keluar?', () => {
                    Auth.logout();
                    location.reload();
                });
            });
        }
    },

    async navigate(page) {
        if (!this.pages || !this.pages[page]) return;
        this.currentPage = page;

        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(`page-${page}`);
        if (!pageEl) return;
        pageEl.classList.add('active');

        const mod = this.pages[page];
        if (mod && typeof mod.render === 'function') {
            pageEl.innerHTML = '<div class="page-header"><div class="page-title">⌛ Loading...</div></div>';
            try {
                // Ensure page rendering is waited if it's async
                await mod.render(pageEl);
            } catch (err) {
                pageEl.innerHTML = `<div class="page-header"><div class="page-title">⚠️ Connection Error</div></div>
                                   <div class="empty-state"><p>Pastikan Backend Node.js & SQL Server sudah running.</p>
                                   <pre style="font-size:11px">${err.message}</pre></div>`;
            }
        }
        document.getElementById('main-content').scrollTo(0, 0);
    }
};

document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.classList.contains('input-number')) {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val) {
            e.target.value = parseInt(val, 10).toLocaleString('id-ID');
        } else {
            e.target.value = '';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => App.init());

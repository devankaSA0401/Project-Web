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
            'user-mgmt': UserMgmtPage
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
        document.getElementById('sidebar-toggle-mobile').style.display = 'flex';
        document.getElementById('user-avatar').textContent = Auth.currentUser?.nama?.[0]?.toUpperCase() || 'A';
        document.getElementById('user-name').textContent = Auth.currentUser?.nama || 'User';
        document.getElementById('user-role').textContent = Auth.currentUser?.role === 'admin' ? 'Administrator' : 'Kasir';

        if (!Auth.isAdmin()) {
            const navUser = document.getElementById('nav-user-mgmt');
            if (navUser) navUser.style.display = 'none';
            // Removed nav-db-mgmt as per instruction
        }

        this.setupNavigation();
        this.navigate('dashboard');
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            // Remove existing listener if any
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(newItem.dataset.page);
            });
        });

        const toggle = document.getElementById('sidebar-toggle');
        const mobileToggle = document.getElementById('sidebar-toggle-mobile');
        const sidebar = document.getElementById('sidebar');

        if (toggle) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-active');
            });
        }

        // Close mobile sidebar on nav click
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                sidebar.classList.remove('mobile-active');
            });
        });

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

document.addEventListener('DOMContentLoaded', () => App.init());

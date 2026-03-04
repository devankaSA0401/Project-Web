/**
 * TOKO NADYN POS – POS / Kasir Page (Responsive & Simplified Version)
 */
const POSPage = {
  cart: [],
  selectedCustomer: null,
  activeFilter: 'all', // 'all' means showing category grid
  searchQuery: '',

  async render(el) {
    el.style.padding = '0';

    el.innerHTML = `
    <div class="pos-layout">
      <!-- Left: Product Navigation -->
      <div class="pos-left">
        <div class="pos-search-bar">
          <div id="pos-nav-header" style="display:flex;align-items:center;width:100%">
             <input type="search" id="pos-search" placeholder="🔍 Cari barang..." style="flex:1" />
          </div>
        </div>
        <div id="pos-main-area" style="flex:1;overflow-y:auto">
           <!-- Content loaded dynamicly: category grid or product grid -->
        </div>
      </div>

      <!-- Right: Cart -->
      <div class="pos-right">
        <div class="pos-cart-header">
          <div style="display:flex;justify-content:space-between;align-items:center;">
             <h3 id="cart-title-mobile">🛒 Keranjang (<span id="cart-count-badge">0</span>)</h3>
             <span class="badge badge-violet" style="font-size:10px">SQL Engine</span>
          </div>
          <div class="pos-cart-customer" id="cart-customer-select" style="cursor:pointer;font-size:13px;padding-top:8px;color:var(--text-secondary)">
            👤 <span id="cart-customer-name">Umum / Walk-in</span> ▾
          </div>
        </div>
        <div class="pos-cart-items" id="pos-cart-items"></div>
        
        <div class="pos-cart-footer">
          <div class="cart-summary-row" style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:12px;color:var(--text-secondary)">Subtotal</span>
            <span id="cart-subtotal" style="font-size:13px;font-weight:700">Rp 0</span>
          </div>
          <div class="cart-summary-row total" style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px">
            <span style="font-size:14px;font-weight:bold">TOTAL</span>
            <span id="cart-total" style="font-size:20px;font-weight:800;color:var(--primary-light)">Rp 0</span>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px;">
            <button class="btn btn-outline" id="pos-clear-btn" title="Kosongkan" style="padding:10px;flex-shrink:0">🗑️</button>
            <button class="btn btn-success" id="pos-bayar-btn" style="flex:1;font-size:18px;font-weight:bold;height:54px;box-shadow:0 4px 15px var(--primary-glow)">BAYAR SEKARANG 💳</button>
          </div>
        </div>
      </div>
    </div>`;

    this._bindEvents(el);
    this.renderMainArea();
    this.renderCart();
  },

  async _bindEvents(el) {
    const searchEl = el.querySelector('#pos-search');
    searchEl.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      if (this.searchQuery) {
        this.activeFilter = 'search';
      } else {
        this.activeFilter = 'all';
      }
      this.renderMainArea();
    });

    el.querySelector('#pos-clear-btn').addEventListener('click', () => {
      if (this.cart.length === 0) return;
      Utils.confirm('Kosongkan keranjang?', () => { this.cart = []; this.renderCart(); });
    });
    el.querySelector('#pos-bayar-btn').addEventListener('click', () => this.showPayment());
    el.querySelector('#cart-customer-select').addEventListener('click', () => this.selectCustomer());

    // Barcode scanner listener
    let barcodeString = '';
    let barcodeTimeout;
    if (!this._barcodeListenerAdded) {
      document.addEventListener('keydown', async (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; // Ignore if typing in input
        if (e.key === 'Enter') {
          if (barcodeString) {
            const barang = await DB.getAll('barang');
            const match = barang.find(b => b.kode.toLowerCase() === barcodeString.toLowerCase());
            if (match) { this.handleProductClick(match.id); Utils.toast(`Barcode: ${match.kode} ditambahkan`, 'success'); }
            else { Utils.toast(`Barang tidak ditemukan: ${barcodeString}`, 'error'); }
            barcodeString = '';
          }
        } else if (e.key.length === 1) {
          barcodeString += e.key;
          clearTimeout(barcodeTimeout);
          barcodeTimeout = setTimeout(() => barcodeString = '', 50); // Scanner enters keys very fast
        }
      });
      this._barcodeListenerAdded = true;
    }
  },

  async renderMainArea() {
    const area = document.getElementById('pos-main-area');
    if (!area) return;

    if (this.activeFilter === 'all') {
      await this.renderCategories(area);
    } else {
      await this.renderProducts(area);
    }
  },

  async renderCategories(container) {
    const barang = await DB.getAll('barang');
    const categories = [...new Set(barang.map(b => b.kategori))];

    container.innerHTML = `
      <div class="category-grid">
        ${categories.map(cat => `
          <div class="category-card" onclick="POSPage.setCategory('${cat}')">
            <div class="category-card-icon">${Utils.categoryIcon(cat)}</div>
            <div class="category-card-name">${cat}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:5px">${barang.filter(b => b.kategori === cat).length} Produk</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  setCategory(cat) {
    this.activeFilter = cat;
    this.searchQuery = '';
    const searchInput = document.getElementById('pos-search');
    if (searchInput) searchInput.value = '';
    this.renderMainArea();
  },

  async renderProducts(container) {
    let items = await DB.getAll('barang');

    if (this.activeFilter === 'search') {
      items = items.filter(b => b.nama.toLowerCase().includes(this.searchQuery) || b.kode.toLowerCase().includes(this.searchQuery));
    } else {
      items = items.filter(b => b.kategori === this.activeFilter);
    }

    const headerHtml = this.activeFilter !== 'search' ? `
      <div style="padding:15px 24px 0;display:flex;align-items:center">
        <button class="pos-back-btn" onclick="POSPage.setCategory('all')">⬅</button>
        <span style="font-weight:700;font-size:16px">${this.activeFilter}</span>
      </div>
    ` : '';

    container.innerHTML = `
      ${headerHtml}
      <div class="pos-products-grid">
        ${items.map(b => `
          <div class="pos-product-card ${b.stok <= 0 && !b.isMeter ? 'no-stock' : ''}" onclick="POSPage.handleProductClick(${b.id})">
            <div class="ppc-icon" style="font-size:24px">${Utils.categoryIcon(b.kategori)}</div>
            <div class="ppc-name" style="height:32px;overflow:hidden">${b.nama}</div>
            <div class="ppc-price">${Utils.formatRupiah(b.hargaJual)}</div>
            <div class="ppc-stock">${Utils.formatStock(b.stok, b.isMeter ? 'm' : 'pcs')}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async handleProductClick(id) {
    const b = await DB.getById('barang', id);
    if (!b) return;
    if (b.isMeter) { this.addMeterItem(b); }
    else { this.addToCart(b); }
  },

  addToCart(b) {
    let item = this.cart.find(c => c.barangId === b.id);
    if (item) {
      if (!b.isMeter && item.qty >= b.stok) { Utils.toast(`Stok tidak cukup`, 'warning'); return; }
      item.qty++;
    } else {
      this.cart.push({ ...b, barangId: b.id, qty: 1, diskon: 0 });
    }
    this.renderCart();

    // Smooth scroll to the cart items to show something was added
    const cartWrapper = document.getElementById('pos-cart-items');
    if (cartWrapper && window.innerWidth <= 900) {
      // Optional: you could scroll to top of cart instead of bot, but sticking is better
    }
  },

  addMeterItem(b) {
    Modal.open(`📏 Input Panjang: ${b.nama}`, `
      <div class="form-group"><label>Panjang (meter)</label><input type="text" inputmode="numeric" class="input-number" id="pm-qty" value="1" autofocus style="font-size:20px;text-align:center" /></div>`,
      [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
      {
        label: 'Tambah', cls: 'btn-primary', action: () => {
          const qty = Utils.parseRupiah(document.getElementById('pm-qty').value) || 0;
          if (qty <= 0 || qty > b.stok) { Utils.toast('Cek stok!', 'warning'); return; }
          this.cart.push({ ...b, barangId: b.id, qty, diskon: 0 });
          Modal.close(); this.renderCart();
        }
      }]
    );
  },

  updateCartQty(idx, delta) {
    const it = this.cart[idx];
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) this.cart.splice(idx, 1);
    this.renderCart();
  },

  renderCart() {
    const wrapper = document.getElementById('pos-cart-items');
    if (!wrapper) return;

    // Update badge/count
    const countBadge = document.getElementById('cart-count-badge');
    if (countBadge) countBadge.textContent = this.cart.length;

    if (this.cart.length === 0) {
      wrapper.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>Belum ada produk</p></div>`;
      document.getElementById('cart-subtotal').textContent = 'Rp 0';
      document.getElementById('cart-total').textContent = 'Rp 0';
      return;
    }

    wrapper.innerHTML = this.cart.map((it, i) => `
      <div class="cart-item" style="padding:12px;margin-bottom:8px;background:var(--bg-card);border-radius:var(--radius-md);border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px">
          <div style="font-size:13px;font-weight:600;line-height:1.2;color:var(--text-primary)">${it.nama}</div>
          <div style="color:var(--text-muted);cursor:pointer;font-size:12px" onclick="POSPage.updateCartQty(${i}, -${it.qty})">✕</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
             <button class="btn-sm" onclick="POSPage.updateCartQty(${i}, -${it.isMeter ? 0.5 : 1})" style="padding:4px 10px;background:rgba(255,255,255,0.05);border-radius:4px">－</button>
             <input type="text" class="input-number cart-qty-input" data-idx="${i}" value="${Utils.formatNum(it.qty)}" style="width:50px;text-align:center;font-size:15px;font-weight:800;padding:4px;border:1px solid var(--border);border-radius:4px;background:var(--bg-main)" />
             <button class="btn-sm" onclick="POSPage.updateCartQty(${i}, ${it.isMeter ? 0.5 : 1})" style="padding:4px 10px;background:rgba(255,255,255,0.05);border-radius:4px">＋</button>
          </div>
          <div style="font-weight:800;color:var(--primary-light);font-size:14px">${Utils.formatRupiah(it.hargaJual * it.qty)}</div>
        </div>
      </div>`).join('');

    // Attach qty input listener
    wrapper.querySelectorAll('.cart-qty-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const val = Utils.parseRupiah(e.target.value);
        if (val > 0) { this.cart[idx].qty = val; this.renderCart(); }
        else { this.cart.splice(idx, 1); this.renderCart(); }
      });
    });

    const subtotal = this.cart.reduce((s, it) => s + (it.qty * it.hargaJual), 0);
    document.getElementById('cart-subtotal').textContent = Utils.formatRupiah(subtotal);
    document.getElementById('cart-total').textContent = Utils.formatRupiah(subtotal);

    // Auto scroll to bottom of cart items
    wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: 'smooth' });
  },

  async selectCustomer() {
    const customers = await DB.getAll('customers');
    Modal.open('👥 Pilih Pelanggan', `
      <div class="form-group"><input type="search" id="cust-search" placeholder="Cari nama pelanggan..." style="margin-bottom:10px" /></div>
      <div id="cust-list" style="max-height:350px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-md)">
        <div class="list-item" onclick="POSPage._setCust(null)" style="padding:12px;cursor:pointer;border-bottom:1px solid var(--border);transition:0.2s">👤 Umum / Walk-in</div>
        ${customers.map(c => `<div class="list-item" onclick="POSPage._setCust(${c.id}, '${c.nama}')" style="padding:12px;cursor:pointer;border-bottom:1px solid var(--border);transition:0.2s">👤 ${c.nama}</div>`).join('')}
      </div>`,
      [{ label: 'Tutup', cls: 'btn-outline', action: () => Modal.close() }]
    );
  },

  _setCust(id, name) {
    this.selectedCustomer = id ? { id, nama: name } : null;
    document.getElementById('cart-customer-name').textContent = name || 'Umum / Walk-in';
    Modal.close();
  },

  async showPayment() {
    if (this.cart.length === 0) { Utils.toast('Keranjang kosong', 'warning'); return; }
    const total = this.cart.reduce((s, it) => s + (it.qty * it.hargaJual), 0);

    // Track selected payment method reactively
    let selectedMetode = 'Tunai';

    Modal.open('💳 Pembayaran', `
      <div style="font-size:32px;font-weight:900;margin-bottom:20px;text-align:center;color:var(--primary-light);letter-spacing:1px">${Utils.formatRupiah(total)}</div>
      
      <div class="form-group">
        <label style="margin-bottom:10px;display:block">Pilih Metode Pembayaran</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" id="pay-method-grid">
          <button type="button" class="pay-method-btn active" data-method="Tunai" style="padding:16px 8px;border-radius:12px;border:2px solid var(--primary);background:rgba(99,102,241,0.15);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--font);transition:all .2s">
            <span style="font-size:28px">💵</span>
            <span style="font-size:12px;font-weight:700;color:var(--primary-light)">TUNAI</span>
            <span style="font-size:10px;color:var(--text-muted)">Cash</span>
          </button>
          <button type="button" class="pay-method-btn" data-method="Transfer" style="padding:16px 8px;border-radius:12px;border:2px solid var(--border);background:var(--bg-card);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--font);transition:all .2s">
            <span style="font-size:28px">🏦</span>
            <span style="font-size:12px;font-weight:700;color:var(--text-primary)">TRANSFER</span>
            <span style="font-size:10px;color:var(--text-muted)">Via Bank</span>
          </button>
          <button type="button" class="pay-method-btn" data-method="QRIS" style="padding:16px 8px;border-radius:12px;border:2px solid var(--border);background:var(--bg-card);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--font);transition:all .2s">
            <span style="font-size:28px">📱</span>
            <span style="font-size:12px;font-weight:700;color:var(--text-primary)">QRIS</span>
            <span style="font-size:10px;color:var(--text-muted)">GoPay/OVO/Dana</span>
          </button>
        </div>
      </div>

      <div class="form-group"><label>Uang Dibayar</label><input type="text" inputmode="numeric" class="input-number" id="pay-cash" value="${Utils.formatNum(total)}" style="font-size:28px;text-align:center;font-weight:900;padding:15px;border:2px solid var(--primary)" /></div>
      <div style="text-align:center;font-size:18px;margin:20px 0;background:rgba(16,185,129,0.1);padding:10px;border-radius:10px">Kembali: <span id="pay-change" style="font-weight:900;color:var(--success)">Rp 0</span></div>`,
      [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
      {
        label: 'Pratinjau Nota', cls: 'btn-primary btn-lg', action: async () => {
          const bayar = Utils.parseRupiah(document.getElementById('pay-cash').value) || 0;
          if (bayar < total) { Utils.toast('Uang kurang!', 'error'); return; }
          const metode = selectedMetode;

          const payload = {
            nota: {
              noNota: Utils.generateKode('INV'),
              tanggal: Utils.today(),
              customerId: this.selectedCustomer?.id || null,
              subtotal: total,
              diskon: 0,
              total,
              bayar,
              kembali: bayar - total,
              metode,
              userCreated: Auth.currentUser.username
            },
            items: this.cart.map(it => ({
              barangId: it.barangId,
              namaBarang: it.nama,
              qty: it.qty,
              hargaBeli: it.hargaBeli,
              hargaJual: it.hargaJual,
              diskon: 0,
              subtotal: it.qty * it.hargaJual
            })),
            jurnal: { keterangan: `POS: ${metode}`, items: [{ akun: 'kas', debit: total }, { akun: 'penjualan', kredit: total }] }
          };

          const content = `
            <div style="font-family:'Courier New', Courier, monospace; font-size:12px; color:#000;">
              <div style="border-top:1px dashed #000; padding:5px 0; font-size:10px;">
                <div style="display:flex; justify-content:space-between;">
                  <span>No: ${payload.nota.noNota}</span>
                  <span>${Utils.formatDate(new Date())}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>Kasir: ${Auth.currentUser.nama || Auth.currentUser.username}</span>
                  <span>Cust: ${this.selectedCustomer?.nama || 'Umum'}</span>
                </div>
              </div>

              <div style="border-top:1px dashed #000; border-bottom:1px dashed #000; padding:8px 0;">
                ${payload.items.map(it => `
                  <div style="margin-bottom:5px;">
                    <div style="display:flex; justify-content:space-between;">
                      <span style="flex:1;">${it.namaBarang}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding-left:10px;">
                      <span>${Utils.formatNum(it.qty)} x ${Utils.formatNum(it.hargaJual)}</span>
                      <span>${Utils.formatNum(it.subtotal)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top:8px; font-weight:bold;">
                <div style="display:flex; justify-content:space-between;">
                  <span>TOTAL</span>
                  <span>${Utils.formatNum(total)}</span>
                </div>
              </div>

              <div style="margin-top:5px; font-size:11px;">
                <div style="display:flex; justify-content:space-between;">
                  <span>BAYAR (${metode})</span>
                  <span>${Utils.formatNum(bayar)}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>KEMBALI</span>
                  <span>${Utils.formatNum(bayar - total)}</span>
                </div>
              </div>
            </div>`;

          // Show preview before processing
          Modal.open('📜 Preview Nota Pembelian', `<div style="max-height:450px;overflow-y:auto;background:#fff;padding:20px;border-radius:10px;box-shadow:inset 0 0 10px rgba(0,0,0,0.1)">${content}</div>`,
            [{ label: 'Batal / Revisi', cls: 'btn-outline', action: () => Modal.close() },
            {
              label: '🔥 Simpan Transaksi & Cetak Nota', cls: 'btn-success btn-lg', action: async () => {
                const res = await DB.insert('penjualan', payload);
                if (res?.success) {
                  Modal.close(); // Close preview modal
                  this.cart = []; // Clear cart
                  this.renderCart(); // Refresh UI
                  Utils.print('Nota Penjualan', content, 'receipt');

                  // Tampilkan toast bahwa transaksi selesai
                  Utils.toast('Transaksi Berhasil Disimpan', 'success');
                }
              }
            }]);
        }
      }]
    );

    // Payment method button interactions
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMetode = btn.dataset.method;
        // Update visual state
        document.querySelectorAll('.pay-method-btn').forEach(b => {
          b.style.border = '2px solid var(--border)';
          b.style.background = 'var(--bg-card)';
          b.querySelector('span:nth-child(2)').style.color = 'var(--text-primary)';
        });
        btn.style.border = '2px solid var(--primary)';
        btn.style.background = 'rgba(99,102,241,0.15)';
        btn.querySelector('span:nth-child(2)').style.color = 'var(--primary-light)';

        // For non-cash, set payment = total (assumed full)
        if (selectedMetode !== 'Tunai') {
          document.getElementById('pay-cash').value = Utils.formatNum(total);
          document.getElementById('pay-change').textContent = 'Rp 0';
        }
      });
    });

    const cashInput = document.getElementById('pay-cash');
    const changeEl = document.getElementById('pay-change');
    cashInput.addEventListener('input', () => {
      const val = Utils.parseRupiah(cashInput.value) || 0;
      changeEl.textContent = Utils.formatRupiah(Math.max(0, val - total));
    });
  }
};

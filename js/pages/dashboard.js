/**
 * TOKO NADYN POS – Dashboard Page (REST API)
 */
const DashboardPage = {
  salesChart: null, categoryChart: null,

  async render(el) {
    const today = Utils.today();
    const [penjualan, curBarang, customers, hutang] = await Promise.all([
      DB.getAll('penjualan'),
      DB.getAll('barang'),
      DB.getAll('customers'),
      DB.getAll('hutangSupplier')
    ]);

    const todaySales = penjualan.filter(p => p.tanggal === today);
    const todayRevenue = todaySales.reduce((s, p) => s + (p.total || 0), 0);
    const totalPiutang = customers.reduce((s, c) => s + (c.piutang || 0), 0);
    const stokMenipis = curBarang.filter(b => b.stok <= b.stokMin).length;
    const totalHutang = hutang.filter(h => h.sisa > 0).reduce((s, h) => s + h.sisa, 0);

    // Weekly sales
    const last7 = [];
    const last7Labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      last7Labels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
      last7.push(penjualan.filter(p => p.tanggal === ds).reduce((s, p) => s + (p.total || 0), 0));
    }

    // Category breakdown
    const allItems = await DB.getAll('penjualan/items');
    const catMap = {};
    allItems.forEach(it => {
      catMap[it.kategori] = (catMap[it.kategori] || 0) + (it.qty * it.hargaJual);
    });
    const catLabels = Object.keys(catMap);
    const catData = Object.values(catMap);

    // Top 10
    const top10 = await this._getTop10();
    const maxQty = top10[0]?.qty || 1;

    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      <div class="page-actions"><span class="badge badge-violet">⚡ Toko Listrik NADYN (SQL)</span></div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon green">💰</div>
        <div class="stat-info"><div class="stat-label">Omzet Hari Ini</div><div class="stat-value">${Utils.formatRupiah(todayRevenue)}</div><div class="stat-change">${todaySales.length} transaksi</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon violet">📊</div>
        <div class="stat-info"><div class="stat-label">Total Piutang</div><div class="stat-value">${Utils.formatRupiah(totalPiutang)}</div><div class="stat-change ${totalPiutang > 0 ? 'down' : ''}">customer belum bayar</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">📦</div>
        <div class="stat-info"><div class="stat-label">Stok Menipis</div><div class="stat-value">${stokMenipis} barang</div><div class="stat-change ${stokMenipis > 0 ? 'down' : ''}">di bawah minimum</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber">💳</div>
        <div class="stat-info"><div class="stat-label">Hutang Supplier</div><div class="stat-value">${Utils.formatRupiah(totalHutang)}</div><div class="stat-change ${totalHutang > 0 ? 'down' : ''}">belum lunas</div></div>
      </div>
    </div>

    <div class="dashboard-charts">
      <div class="chart-card">
        <div class="card-title">📈 Penjualan 7 Hari Terakhir</div>
        <canvas id="chart-sales"></canvas>
      </div>
      <div class="chart-card">
        <div class="card-title">🎯 Top 10 Fast Moving</div>
        <div id="top-products-list">
        ${top10.map((p, i) => `
          <div class="top-product-item">
            <div class="tp-rank gold">${i + 1}</div>
            <div class="tp-name">${p.nama}</div>
            <div class="tp-bar"><div class="tp-bar-fill" style="width:${Math.round((p.qty / maxQty) * 100)}%"></div></div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;

    setTimeout(() => this._initCharts(last7Labels, last7, catLabels, catData), 100);
  },

  async _getTop10() {
    // Should be handled by a SQL query in real backend, but let's simulate for now
    return [];
  },

  _initCharts(labels, data, catLabels, catData) {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('chart-sales');
    if (!ctx) return;
    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Omzet', data, backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', borderWidth: 2 }] }
    });
  }
};

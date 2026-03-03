/**
 * TOKO NADYN POS – Laporan Page (REST API Version)
 */
const LaporanPage = {
  async render(el) {
    const barang = await DB.getAll('barang');
    const penjualanItems = await DB.getAll('penjualan/items');

    const qtyMap = {};
    penjualanItems.forEach(it => {
      if (!qtyMap[it.barangId]) qtyMap[it.barangId] = { nama: it.namaBarang, qty: 0, revenue: 0, hpp: 0 };
      qtyMap[it.barangId].qty += parseFloat(it.qty);
      qtyMap[it.barangId].revenue += it.qty * it.hargaJual;
      qtyMap[it.barangId].hpp += it.qty * (it.hargaBeli || 0);
    });
    const fastMoving = Object.values(qtyMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

    const marginData = barang.map(b => ({
      ...b,
      margin: Utils.margin(b.hargaBeli, b.hargaJual),
      marginAmt: b.hargaJual - b.hargaBeli,
      nilaiStok: b.stok * b.hargaBeli,
    })).sort((a, b) => b.margin - a.margin);

    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">📈 Laporan Analitik</div><div class="page-subtitle">Fast moving, margin barang, & nilai stok</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <div class="chart-card">
        <div class="card-title">🔥 Top 10 Barang Fast Moving</div>
        ${fastMoving.length === 0 ? '<div class="empty-state">Belum ada data</div>' : `<canvas id="chart-fast-moving" style="max-height:250px"></canvas>`}
      </div>
      <div class="chart-card">
        <div class="card-title">💸 Detail Fast Moving</div>
        <div id="fast-moving-list">
        ${fastMoving.map((p, i) => `
          <div class="top-product-item">
            <div class="tp-rank">${i + 1}</div>
            <div class="tp-name">${p.nama}</div>
            <div style="font-size:12px;color:var(--text-muted)">${Utils.formatNum(p.qty)} terjual</div>
            <div style="font-size:12px;font-weight:700;color:var(--success)">Laba: ${Utils.formatRupiah(p.revenue - p.hpp)}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">📊 Tracking Margin Per Barang</div>
      <div class="filter-bar"><input type="search" id="margin-srch" placeholder="Cari barang..." /></div>
      <div id="margin-table"></div>
    </div>`;

    const renderMarginTable = (rows) => {
      document.getElementById('margin-table').innerHTML = Utils.buildTable([
        { label: 'Nama', render: r => `${Utils.categoryIcon(r.kategori)} ${r.nama}` },
        { label: 'Kategori', key: 'kategori' },
        { label: 'H. Beli', render: r => Utils.formatRupiah(r.hargaBeli) },
        { label: 'H. Jual', render: r => Utils.formatRupiah(r.hargaJual) },
        { label: 'Margin %', render: r => `<span class="badge ${r.margin >= 25 ? 'badge-success' : 'badge-warning'}">${r.margin}%</span>` },
        { label: 'Stok', render: r => `${Utils.formatNum(r.stok)} ${r.satuan}` },
        { label: 'Nilai Stok', render: r => Utils.formatRupiah(r.nilaiStok) },
      ], rows, 'Tidak ada barang');
    };
    renderMarginTable(marginData);

    setTimeout(() => {
      if (fastMoving.length > 0 && typeof Chart !== 'undefined') {
        const ctx = document.getElementById('chart-fast-moving');
        if (ctx) {
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: fastMoving.map(p => p.nama.substring(0, 15) + '...'),
              datasets: [{ label: 'Qty Terjual', data: fastMoving.map(p => p.qty), backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', borderWidth: 2 }]
            },
            options: { indexAxis: 'y', plugins: { legend: { display: false } } }
          });
        }
      }
      const srch = document.getElementById('margin-srch');
      if (srch) srch.addEventListener('input', Utils.debounce(function () {
        const q = this.value.toLowerCase();
        renderMarginTable(marginData.filter(b => b.nama.toLowerCase().includes(q) || b.kategori.toLowerCase().includes(q)));
      }, 250));
    }, 100);
  }
};

/**
 * TOKO NADYN POS – Akuntansi Page (REST API Version)
 */
const AkuntansiPage = {
  async render(el) {
    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">📒 Akuntansi (SQL Engine)</div><div class="page-subtitle">P&L, Neraca, & Buku Besar</div></div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="jurnal">Jurnal Umum</button>
      <button class="tab-btn" data-tab="labarugi">Laba Rugi</button>
      <button class="tab-btn" data-tab="neraca">Neraca</button>
    </div>
    <div id="akun-content"></div>`;

    const tabs = el.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      this.showTab(t.dataset.tab, el.querySelector('#akun-content'));
    }));

    this.showTab('jurnal', el.querySelector('#akun-content'));
  },

  async showTab(tab, wrapper) {
    if (tab === 'jurnal') {
      const journals = await DB.getAll('jurnal');
      // In SQL version, 'jurnal' returns rows from Jurnal table with nested items
      wrapper.innerHTML = Utils.buildTable([
        { label: 'Tanggal', render: r => Utils.formatDate(r.tanggal) },
        { label: 'Keterangan', render: r => `<div>${r.keterangan}</div><div style="font-size:10px;color:var(--text-muted)">ID: ${r.id}</div>` },
        { label: 'Akun', key: 'akun' },
        { label: 'Debit', render: r => r.debit > 0 ? Utils.formatRupiah(r.debit) : '-' },
        { label: 'Kredit', render: r => r.kredit > 0 ? Utils.formatRupiah(r.kredit) : '-' },
      ], journals.slice(0, 100), 'Belum ada catatan jurnal');
    } else if (tab === 'labarugi') {
      const stats = await DB.getAll('akuntansi/labarugi');
      wrapper.innerHTML = `
      <div class="card" style="max-width:600px;margin:20px auto">
        <div class="card-title">📈 Laporan Laba Rugi</div>
        <div class="stat-list">
          <div class="stat-item"><span>Total Pendapatan</span><span class="stat-val primary">${Utils.formatRupiah(stats.revenue)}</span></div>
          <div class="stat-item"><span>Total Diskon</span><span class="stat-val warning">- ${Utils.formatRupiah(stats.discounts)}</span></div>
          <hr style="opacity:0.1;margin:10px 0" />
          <div class="stat-item"><span>Pendapatan Bersih</span><span class="stat-val success" style="font-weight:700">${Utils.formatRupiah(stats.netRevenue)}</span></div>
          <div class="stat-item"><span>Total HPP (COGS)</span><span class="stat-val error">- ${Utils.formatRupiah(stats.cog)}</span></div>
          <hr style="opacity:0.1;margin:10px 0" />
          <div class="stat-item"><span>Laba Kotor</span><span class="stat-val success" style="font-weight:700;font-size:16px">${Utils.formatRupiah(stats.grossProfit)}</span></div>
          <div class="stat-item"><span>Biaya Operasional (Out)</span><span class="stat-val error">- ${Utils.formatRupiah(stats.expenses)}</span></div>
          <hr style="opacity:0.1;margin:10px 0" />
          <div class="stat-item total" style="background:var(--bg-main);padding:15px;border-radius:10px;margin-top:10px">
            <span style="font-size:18px;font-weight:700">LABA BERSIH</span>
            <span style="font-size:22px;font-weight:800;color:${stats.netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">${Utils.formatRupiah(stats.netProfit)}</span>
          </div>
        </div>
        <div style="margin-top:20px;text-align:right">
           <button class="btn btn-primary btn-sm" onclick="AkuntansiPage.printPDF('labarugi', ${JSON.stringify(stats).replace(/"/g, '&quot;')})">📄 Cetak PDF</button>
        </div>
      </div>`;
    } else if (tab === 'neraca') {
      const stats = await DB.getAll('akuntansi/neraca');
      wrapper.innerHTML = `
      <div class="card" style="max-width:700px;margin:20px auto">
        <div class="card-title">⚖️ Laporan Neraca (Balance Sheet)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div>
            <h4 style="margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:5px">AKTIVA (Assets)</h4>
            <div class="stat-list">
              <div class="stat-item"><span>Kas / Bank</span><span class="stat-val primary">${Utils.formatRupiah(stats.kas)}</span></div>
              <div class="stat-item"><span>Persediaan Barang</span><span class="stat-val primary">${Utils.formatRupiah(stats.persediaan)}</span></div>
              <div class="stat-item"><span>Piutang Dagang</span><span class="stat-val primary">${Utils.formatRupiah(stats.piutang)}</span></div>
              <hr style="opacity:0.1;margin:10px 0" />
              <div class="stat-item total"><span>TOTAL AKTIVA</span><span class="stat-val success" style="font-weight:700">${Utils.formatRupiah(stats.totalAssets)}</span></div>
            </div>
          </div>
          <div>
            <h4 style="margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:5px">PASIVA (Liabilities & Equity)</h4>
            <div class="stat-list">
              <div class="stat-item"><span>Hutang Dagang</span><span class="stat-val error">${Utils.formatRupiah(stats.hutang)}</span></div>
              <hr style="opacity:0.1;margin:10px 0" />
              <div class="stat-item"><span>Modal & Laba</span><span class="stat-val primary">${Utils.formatRupiah(stats.equity)}</span></div>
              <hr style="opacity:0.1;margin:10px 0" />
              <div class="stat-item total"><span>TOTAL PASIVA</span><span class="stat-val success" style="font-weight:700">${Utils.formatRupiah(stats.totalLiabilities + stats.equity)}</span></div>
            </div>
          </div>
        </div>
        <div style="margin-top:20px;text-align:right">
           <button class="btn btn-primary btn-sm" onclick="AkuntansiPage.printPDF('neraca', ${JSON.stringify(stats).replace(/"/g, '&quot;')})">📄 Cetak PDF</button>
        </div>
      </div>`;
    }
  },

  printPDF(type, data) {
    if (type === 'labarugi') {
      const content = `
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #333">
          <tr style="border-bottom:1px solid #333"><td style="padding:10px">Total Pendapatan</td><td style="text-align:right;padding:10px">${Utils.formatRupiah(data.revenue)}</td></tr>
          <tr style="border-bottom:1px solid #333"><td style="padding:10px">Total Diskon</td><td style="text-align:right;padding:10px">- ${Utils.formatRupiah(data.discounts)}</td></tr>
          <tr style="border-bottom:1px solid #333;font-weight:bold"><td style="padding:10px">Pendapatan Bersih</td><td style="text-align:right;padding:10px">${Utils.formatRupiah(data.netRevenue)}</td></tr>
          <tr style="border-bottom:1px solid #333"><td style="padding:10px">Total HPP (COGS)</td><td style="text-align:right;padding:10px">- ${Utils.formatRupiah(data.cog)}</td></tr>
          <tr style="border-bottom:1px solid #333;background:#f0f0f0;font-weight:bold"><td style="padding:10px">LABA KOTOR</td><td style="text-align:right;padding:10px">${Utils.formatRupiah(data.grossProfit)}</td></tr>
          <tr style="border-bottom:1px solid #333"><td style="padding:10px">Biaya Operasional</td><td style="text-align:right;padding:10px">- ${Utils.formatRupiah(data.expenses)}</td></tr>
          <tr style="display:table-row;background:#e0e0e0;font-weight:800;font-size:18px"><td style="padding:15px">LABA BERSIH</td><td style="text-align:right;padding:15px">${Utils.formatRupiah(data.netProfit)}</td></tr>
        </table>`;
      Utils.print('Laporan Laba Rugi', content);
    } else if (type === 'neraca') {
      const content = `
        <div style="display:flex;gap:20px">
          <div style="flex:1">
            <h4 style="border-bottom:1px solid #333;padding:5px">AKTIVA (Assets)</h4>
            <div style="display:flex;justify-content:space-between;padding:5px"><span>Kas / Bank</span> <span>${Utils.formatRupiah(data.kas)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:5px"><span>Persediaan</span> <span>${Utils.formatRupiah(data.persediaan)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:5px"><span>Piutang</span> <span>${Utils.formatRupiah(data.piutang)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px;font-weight:bold;border-top:1px solid #333"><span>TOTAL AKTIVA</span> <span>${Utils.formatRupiah(data.totalAssets)}</span></div>
          </div>
          <div style="flex:1">
            <h4 style="border-bottom:1px solid #333;padding:5px">PASIVA (Liabilities & Equity)</h4>
            <div style="display:flex;justify-content:space-between;padding:5px"><span>Hutang</span> <span>${Utils.formatRupiah(data.hutang)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:5px"><span>Modal</span> <span>${Utils.formatRupiah(data.equity)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px;font-weight:bold;border-top:1px solid #333"><span>TOTAL PASIVA</span> <span>${Utils.formatRupiah(data.totalLiabilities + data.equity)}</span></div>
          </div>
        </div>`;
      Utils.print('Laporan Neraca', content);
    }
  }
};

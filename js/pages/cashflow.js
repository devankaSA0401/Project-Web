/**
 * TOKO NADYN POS – Cash Flow Page (REST API Version)
 */
const CashFlowPage = {
  async render(el) {
    const rows = await DB.getAll('cashflow');
    const [todayIn, todayOut] = [
      rows.filter(r => r.tanggal === Utils.today() && r.tipe === 'in').reduce((s, r) => s + r.jumlah, 0),
      rows.filter(r => r.tanggal === Utils.today() && r.tipe === 'out').reduce((s, r) => s + r.jumlah, 0)
    ];

    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">💵 Arus Kas (Cash Flow)</div><div class="page-subtitle">Pemasukan & pengeluaran operasional</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="btn-add-cash">➕ Catat Kas</button></div>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon green">📈</div><div class="stat-info"><div class="stat-label">Masuk Hari Ini</div><div class="stat-value">${Utils.formatRupiah(todayIn)}</div></div></div>
      <div class="stat-card"><div class="stat-icon red">📉</div><div class="stat-info"><div class="stat-label">Keluar Hari Ini</div><div class="stat-value">${Utils.formatRupiah(todayOut)}</div></div></div>
      <div class="stat-card"><div class="stat-icon violet">💰</div><div class="stat-info"><div class="stat-label">Saldo Saat Ini</div><div class="stat-value" id="total-saldo-display">Menghitung...</div></div></div>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="filter-bar"><input type="search" id="cash-search" placeholder="Cari keterangan..." /></div>
      <div id="cash-table-wrapper"></div>
    </div>`;

    const totalSaldo = rows.reduce((s, r) => s + (r.tipe === 'in' ? r.jumlah : -r.jumlah), 0);
    document.getElementById('total-saldo-display').textContent = Utils.formatRupiah(totalSaldo);

    el.querySelector('#btn-add-cash').addEventListener('click', () => this.openForm(el));
    el.querySelector('#cash-search').addEventListener('input', Utils.debounce(() => this.renderTable(el), 250));
    await this.renderTable(el);
  },

  async renderTable(el) {
    const q = el.querySelector('#cash-search')?.value?.toLowerCase() || '';
    let rows = await DB.getAll('cashflow');
    if (q) rows = rows.filter(r => r.keterangan.toLowerCase().includes(q) || r.kategori.toLowerCase().includes(q));

    el.querySelector('#cash-table-wrapper').innerHTML = Utils.buildTable([
      { label: 'Tanggal', render: r => Utils.formatDate(r.tanggal) },
      { label: 'Tipe', render: r => `<span class="badge ${r.tipe === 'in' ? 'badge-success' : 'badge-danger'}">${r.tipe === 'in' ? 'MASUK' : 'KELUAR'}</span>` },
      { label: 'Kategori', key: 'kategori' },
      { label: 'Keterangan', key: 'keterangan' },
      { label: 'Jumlah', render: r => `<b style="color:${r.tipe === 'in' ? 'var(--success)' : 'var(--danger)'}">${Utils.formatRupiah(r.jumlah)}</b>` },
      { label: 'Aksi', render: r => `<button class="btn btn-sm btn-ghost btn-del" data-id="${r.id}" style="color:var(--danger)">🗑️</button>` },
    ], rows.reverse().slice(0, 100), 'Belum ada catatan kas');

    el.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', async () => {
      Utils.confirm('Hapus catatan ini?', async () => {
        await DB.delete('cashflow', parseFloat(btn.dataset.id));
        this.render(el);
        Utils.toast('Catatan dihapus', 'success');
      });
    }));
  },

  async openForm(container) {
    Modal.open('💸 Tambah Catatan Kas', `
      <div class="form-row cols-2">
        <div class="form-group"><label>Tipe *</label><select id="fc-tipe"><option value="out">📉 Pengeluaran (Out)</option><option value="in">📈 Pemasukan (In)</option></select></div>
        <div class="form-group"><label>Kategori</label><input type="text" id="fc-kat" placeholder="Misal: Gaji, Listrik, Sewa..." /></div>
      </div>
      <div class="form-group"><label>Keterangan *</label><input type="text" id="fc-ket" /></div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Jumlah (Rp) *</label><input type="text" inputmode="numeric" class="input-number" id="fc-jumlah" value="0" /></div>
        <div class="form-group"><label>Tanggal</label><input type="date" id="fc-tgl" value="${Utils.today()}" /></div>
      </div>`,
      [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
      {
        label: '💾 Simpan', cls: 'btn-primary', action: async () => {
          const data = {
            tipe: document.getElementById('fc-tipe').value,
            kategori: document.getElementById('fc-kat').value || 'Operasional',
            keterangan: document.getElementById('fc-ket').value,
            jumlah: Utils.parseRupiah(document.getElementById('fc-jumlah').value) || 0,
            tanggal: document.getElementById('fc-tgl').value
          };
          if (!data.keterangan || data.jumlah <= 0) { Utils.toast('Lengkapi data kas', 'error'); return; }

          await DB.insert('cashflow', data);
          // Automatic Jurnal
          const akunDebit = data.tipe === 'in' ? 'kas' : 'biaya';
          const akunKredit = data.tipe === 'in' ? 'penjualan' : 'kas';
          await Utils.createJurnal(`Kas ${data.tipe}: ${data.keterangan}`, [{ akun: akunDebit, debit: data.jumlah }, { akun: akunKredit, kredit: data.jumlah }]);

          Modal.close();
          this.render(container);
          Utils.toast('Catatan kas berhasil disimpan', 'success');
        }
      }]
    );
  }
};

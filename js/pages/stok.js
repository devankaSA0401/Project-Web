/**
 * TOKO NADYN POS – Stok / Inventory Page (REST API Version)
 */
const StokPage = {
    async render(el) {
        el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">🏭 Manajemen Stok</div><div class="page-subtitle">History pergerakan & stock opname</div></div>
      <div class="page-actions"><button class="btn btn-violet" id="btn-opname">📋 Stock Opname</button></div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="history">History Pergerakan</button>
      <button class="tab-btn" data-tab="stok-real">Stok Real-time</button>
    </div>
    <div id="stok-content"></div>`;

        const tabs = el.querySelectorAll('.tab-btn');
        tabs.forEach(t => t.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            t.classList.add('active');
            this.showTab(t.dataset.tab, el.querySelector('#stok-content'));
        }));

        this.showTab('history', el.querySelector('#stok-content'));
        el.querySelector('#btn-opname').addEventListener('click', () => this.openOpname(el));
    },

    async showTab(tab, wrapper) {
        const barang = await DB.getAll('barang');
        if (tab === 'history') {
            const mvs = await DB.getAll('stockMovements');
            wrapper.innerHTML = Utils.buildTable([
                { label: 'Waktu', render: r => Utils.formatDateTime(r.createdAt) },
                { label: 'Barang', render: r => barang.find(b => b.id === r.barangId)?.nama || '-' },
                { label: 'Tipe', render: r => `<span class="badge ${r.tipe === 'in' ? 'badge-success' : r.tipe === 'out' ? 'badge-danger' : 'badge-violet'}">${r.tipe.toUpperCase()}</span>` },
                { label: 'Qty', render: r => `<b>${(r.tipe === 'out' ? '-' : '+') + Utils.formatNum(r.qty)}</b>` },
                { label: 'Keterangan', key: 'keterangan' },
            ], mvs.reverse().slice(0, 100), 'Belum ada pergerakan stok');
        } else {
            wrapper.innerHTML = Utils.buildTable([
                { label: 'Kode', key: 'kode' },
                { label: 'Nama', render: r => `${Utils.categoryIcon(r.kategori)} ${r.nama}` },
                { label: 'Stok Sistem', render: r => `<b>${Utils.formatNum(r.stok)} ${r.satuan}</b>` },
                { label: 'Kategori', key: 'kategori' },
                { label: 'Status', render: r => r.stok <= r.stokMin ? '<span class="badge badge-danger">Kritis</span>' : '<span class="badge badge-success">Aman</span>' }
            ], barang, 'Data barang kosong');
        }
    },

    async openOpname(container) {
        const barangList = await DB.getAll('barang');
        let selisihList = [];

        Modal.open('📋 Stock Opname (Penyesuaian Fisik)', `
      <div class="form-group"><label>Pilih Barang</label><select id="so-brg">${barangList.map(b => `<option value="${b.id}">${b.nama} (Sistem: ${b.stok})</option>`).join('')}</select></div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Stok Fisik Sebenarnya</label><input type="number" id="so-fisik" value="0" /></div>
        <div class="form-group"><label>Keterangan</label><input type="text" id="so-ket" value="Stock opname bulanan" /></div>
      </div>
      <div id="so-preview" style="padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;margin-top:10px">
        <div style="font-size:12px;color:var(--text-muted)">Selisih: <span id="so-selisih-val" style="font-weight:700">0</span></div>
      </div>`,
            [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
            {
                label: '💾 Simpan Penyesuaian', cls: 'btn-violet', action: async () => {
                    const bId = parseFloat(document.getElementById('so-brg').value);
                    const fisik = parseFloat(document.getElementById('so-fisik').value) || 0;
                    const ket = document.getElementById('so-ket').value;
                    const b = barangList.find(x => x.id === bId);
                    if (!b) return;

                    const selisih = fisik - b.stok;
                    if (selisih === 0) { Utils.toast('Tidak ada selisih stok', 'info'); Modal.close(); return; }

                    // Sync persistence
                    await DB.update('barang', bId, { stok: fisik });
                    await Utils.logStock(bId, 'adj', Math.abs(selisih), `Opname: ${ket} (${selisih > 0 ? '+' : '-'}${Math.abs(selisih)})`);

                    // Jurnal selisih
                    const totalVal = Math.abs(selisih * b.hargaBeli);
                    if (selisih > 0) {
                        await Utils.createJurnal('Stock Opname (Surplus)', [{ akun: 'persediaan', debit: totalVal }, { akun: 'modal', kredit: totalVal }]);
                    } else {
                        await Utils.createJurnal('Stock Opname (Kurang)', [{ akun: 'biaya', debit: totalVal }, { akun: 'persediaan', kredit: totalVal }]);
                    }

                    Modal.close();
                    this.showTab('stok-real', document.getElementById('stok-content'));
                    Utils.toast('Stok opname berhasil disimpan', 'success');
                }
            }]
        );

        const brgEl = document.getElementById('so-brg');
        const fisikEl = document.getElementById('so-fisik');
        const diffEl = document.getElementById('so-selisih-val');
        const updateDiff = () => {
            const b = barangList.find(x => x.id === parseFloat(brgEl.value));
            const f = parseFloat(fisikEl.value) || 0;
            const diff = f - b.stok;
            diffEl.textContent = (diff > 0 ? '+' : '') + diff;
            diffEl.style.color = diff > 0 ? 'var(--success)' : (diff < 0 ? 'var(--danger)' : 'var(--text-muted)');
        };
        brgEl.addEventListener('change', updateDiff);
        fisikEl.addEventListener('input', updateDiff);
        brgEl.dispatchEvent(new Event('change'));
    }
};

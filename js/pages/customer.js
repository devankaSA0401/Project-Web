/**
 * TOKO NADYN POS – Customer Page (REST API Version)
 */
const CustomerPage = {
    async render(el) {
        el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">👥 Data Pelanggan</div><div class="page-subtitle">Master data customer & piutang</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="btn-add-customer">➕ Tambah Pelanggan</button></div>
    </div>
    <div class="filter-bar"><input type="search" id="cus-search" placeholder="Cari nama pelanggan..." /></div>
    <div id="cus-table-wrapper"></div>`;
        el.querySelector('#btn-add-customer').addEventListener('click', () => this.openForm(null, el));
        el.querySelector('#cus-search').addEventListener('input', Utils.debounce(() => this.renderTable(el), 250));
        await this.renderTable(el);
    },

    async renderTable(el) {
        const q = el.querySelector('#cus-search')?.value?.toLowerCase() || '';
        let rows = await DB.getAll('customers');
        if (q) rows = rows.filter(s => s.nama.toLowerCase().includes(q));
        const wrapper = el.querySelector('#cus-table-wrapper');
        wrapper.innerHTML = Utils.buildTable([
            { label: 'Nama', render: r => `<div style="font-weight:600">👤 ${r.nama}</div>` },
            { label: 'Telepon', key: 'telepon' },
            { label: 'Alamat', key: 'alamat' },
            {
                label: 'Piutang', render: r => {
                    const p = r.piutang || 0;
                    return p > 0 ? `<div class="badge badge-danger">${Utils.formatRupiah(p)}</div>` : '<div class="badge badge-success">Lunas</div>';
                }
            },
            {
                label: 'Aksi', render: r => `<div class="actions">
        ${(r.piutang || 0) > 0 ? `<button class="badge badge-violet btn-pay-piutang" data-id="${r.id}" style="cursor:pointer">Bayar</button>` : ''}
        <button class="btn btn-sm btn-ghost btn-edit" data-id="${r.id}">✏️</button>
        <button class="btn btn-sm btn-ghost btn-del" data-id="${r.id}" style="color:var(--danger)">🗑️</button>
      </div>` },
        ], rows, 'Belum ada pelanggan');

        wrapper.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => this.openForm(parseFloat(btn.dataset.id), el)));
        wrapper.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', async () => {
            Utils.confirm('Hapus pelanggan ini?', async () => {
                await DB.delete('customers', parseFloat(btn.dataset.id));
                this.renderTable(el);
                Utils.toast('Customer dihapus', 'success');
            });
        }));
        wrapper.querySelectorAll('.btn-pay-piutang').forEach(btn => btn.addEventListener('click', () => this.openPayment(parseFloat(btn.dataset.id), el)));
    },

    async openForm(id, container) {
        const item = id ? await DB.getById('customers', id) : null;
        const isEdit = !!item;
        Modal.open(isEdit ? '✏️ Edit Customer' : '➕ Tambah Customer', `
      <div class="form-group"><label>Nama Pelanggan *</label><input type="text" id="fc-nama" value="${item?.nama || ''}" /></div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Telepon</label><input type="text" id="fc-telp" value="${item?.telepon || ''}" /></div>
      </div>
      <div class="form-group"><label>Alamat</label><textarea id="fc-alamat">${item?.alamat || ''}</textarea></div>`,
            [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
            {
                label: isEdit ? '💾 Simpan' : '➕ Tambah', cls: 'btn-primary', action: async () => {
                    const data = {
                        nama: document.getElementById('fc-nama').value,
                        telepon: document.getElementById('fc-telp').value,
                        alamat: document.getElementById('fc-alamat').value
                    };
                    if (!data.nama) { Utils.toast('Nama wajib diisi', 'error'); return; }
                    if (isEdit) await DB.update('customers', id, data); else await DB.insert('customers', data);
                    Modal.close(); this.renderTable(container);
                    Utils.toast(isEdit ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan', 'success');
                }
            }]
        );
    },

    async openPayment(id, container) {
        const item = await DB.getById('customers', id);
        if (!item) return;
        Modal.open('💸 Pembayaran Piutang', `
      <div class="form-group"><label>Nama Pelanggan</label><div class="stat-value" style="font-size:16px">${item.nama}</div></div>
      <div class="form-group"><label>Sisa Piutang</label><div class="stat-value" style="font-size:20px;color:var(--danger)">${Utils.formatRupiah(item.piutang)}</div></div>
      <div class="form-group"><label>Jumlah Bayar</label><input type="number" id="pay-piutang-amt" value="${item.piutang}" /></div>
      <div class="form-group"><label>Keterangan</label><input type="text" id="pay-piutang-ket" value="Bayar piutang" /></div>`,
            [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
            {
                label: '💾 Simpan', cls: 'btn-primary', action: async () => {
                    const amt = parseFloat(document.getElementById('pay-piutang-amt').value) || 0;
                    if (amt <= 0 || amt > item.piutang) { Utils.toast('Jumlah tidak valid', 'error'); return; }
                    const newP = item.piutang - amt;
                    await DB.update('customers', id, { piutang: newP });
                    await DB.insert('cashflow', { tipe: 'in', kategori: 'Piutang', keterangan: `Bayar dari ${item.nama}`, jumlah: amt, tanggal: Utils.today() });
                    Utils.createJurnal(`Bayar Piutang: ${item.nama}`, [{ akun: 'kas', debit: amt }, { akun: 'piutang', kredit: amt }]);
                    Modal.close(); this.renderTable(container);
                    Utils.toast('Pembayaran piutang berhasil', 'success');
                }
            }]
        );
    }
};

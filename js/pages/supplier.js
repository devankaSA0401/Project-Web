/**
 * TOKO NADYN POS – Supplier Page (REST API Version)
 */
const SupplierPage = {
    async render(el) {
        el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">🏪 Data Supplier</div><div class="page-subtitle">Master data pemasok / vendor</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="btn-add-supplier">➕ Tambah Supplier</button></div>
    </div>
    <div class="filter-bar"><input type="search" id="sup-search" placeholder="Cari nama supplier..." /></div>
    <div id="sup-table-wrapper"></div>`;
        el.querySelector('#btn-add-supplier').addEventListener('click', () => this.openForm(null, el));
        el.querySelector('#sup-search').addEventListener('input', Utils.debounce(() => this.renderTable(el), 250));
        await this.renderTable(el);
    },

    async renderTable(el) {
        const q = el.querySelector('#sup-search')?.value?.toLowerCase() || '';
        let rows = await DB.getAll('suppliers');
        if (q) rows = rows.filter(s => s.nama.toLowerCase().includes(q));
        const wrapper = el.querySelector('#sup-table-wrapper');
        const hutang = await DB.getAll('hutangSupplier');

        wrapper.innerHTML = Utils.buildTable([
            { label: 'Nama', render: r => `<div style="font-weight:600">🏪 ${r.nama}</div>` },
            { label: 'Kontak / PIC', key: 'kontak' },
            { label: 'Telepon', key: 'telepon' },
            { label: 'Alamat', key: 'alamat' },
            {
                label: 'Hutang', render: r => {
                    const h = hutang.filter(x => x.supplierId === r.id && x.sisa > 0).reduce((s, x) => s + x.sisa, 0);
                    return h > 0 ? `<span class="badge badge-warning">${Utils.formatRupiah(h)}</span>` : '<span class="badge badge-success">Lunas</span>';
                }
            },
            {
                label: 'Aksi', render: r => `<div class="actions">
        <button class="btn btn-sm btn-ghost btn-edit" data-id="${r.id}">✏️</button>
        <button class="btn btn-sm btn-ghost btn-del" data-id="${r.id}" style="color:var(--danger)">🗑️</button>
      </div>` },
        ], rows, 'Belum ada supplier');
        wrapper.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => this.openForm(parseFloat(btn.dataset.id), el)));
        wrapper.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', async () => {
            Utils.confirm('Hapus supplier ini?', async () => {
                await DB.delete('suppliers', parseFloat(btn.dataset.id));
                this.renderTable(el);
                Utils.toast('Supplier dihapus', 'success');
            });
        }));
    },

    async openForm(id, container) {
        const item = id ? await DB.getById('suppliers', id) : null;
        const isEdit = !!item;
        Modal.open(isEdit ? '✏️ Edit Supplier' : '➕ Tambah Supplier', `
      <div class="form-group"><label>Nama Supplier *</label><input type="text" id="fs-nama" value="${item?.nama || ''}" /></div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Kontak / PIC</label><input type="text" id="fs-kontak" value="${item?.kontak || ''}" /></div>
        <div class="form-group"><label>Telepon</label><input type="text" id="fs-telp" value="${item?.telepon || ''}" /></div>
      </div>
      <div class="form-group"><label>Alamat</label><textarea id="fs-alamat">${item?.alamat || ''}</textarea></div>`,
            [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
            {
                label: isEdit ? '💾 Simpan' : '➕ Tambah', cls: 'btn-primary', action: async () => {
                    const data = {
                        nama: document.getElementById('fs-nama').value,
                        kontak: document.getElementById('fs-kontak').value,
                        telepon: document.getElementById('fs-telp').value,
                        alamat: document.getElementById('fs-alamat').value
                    };
                    if (!data.nama) { Utils.toast('Nama wajib diisi', 'error'); return; }
                    if (isEdit) await DB.update('suppliers', id, data); else await DB.insert('suppliers', data);
                    Modal.close(); this.renderTable(container);
                    Utils.toast(isEdit ? 'Supplier diperbarui' : 'Supplier ditambahkan', 'success');
                }
            }]
        );
    }
};

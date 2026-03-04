/**
 * TOKO NADYN POS – Barang (Product) Page (REST API Version)
 */
const BarangPage = {
  async render(el) {
    const barang = await DB.getAll('barang');
    const suppliers = await DB.getAll('suppliers');

    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">📦 Data Barang</div><div class="page-subtitle">Master data stok & harga</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="btn-add-barang">➕ Tambah Barang</button></div>
    </div>
    <div class="filter-bar">
      <input type="search" id="brg-search" placeholder="Cari nama / kode..." />
      <select id="brg-filter-cat">
        <option value="all">Semua Kategori</option>
        ${[...new Set(barang.map(b => b.kategori))].map(k => `<option value="${k}">${k}</option>`).join('')}
      </select>
    </div>
    <div id="brg-table-wrapper"></div>`;

    el.querySelector('#btn-add-barang').addEventListener('click', () => this.openForm(null, el));
    el.querySelector('#brg-search').addEventListener('input', Utils.debounce(() => this.renderTable(el), 250));
    el.querySelector('#brg-filter-cat').addEventListener('change', () => this.renderTable(el));
    this.renderTable(el);
  },

  async renderTable(el) {
    const q = el.querySelector('#brg-search')?.value?.toLowerCase() || '';
    const cat = el.querySelector('#brg-filter-cat')?.value || 'all';
    let rows = await DB.getAll('barang');
    const suppliers = await DB.getAll('suppliers');

    if (q) rows = rows.filter(b => b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q));
    if (cat !== 'all') rows = rows.filter(b => b.kategori === cat);

    const wrapper = el.querySelector('#brg-table-wrapper');
    wrapper.innerHTML = Utils.buildTable([
      { label: 'Kode', key: 'kode' },
      { label: 'Nama', render: r => `<div style="font-weight:600">${Utils.categoryIcon(r.kategori)} ${r.nama}</div>` },
      { label: 'Kategori', key: 'kategori' },
      { label: 'H. Beli', render: r => Utils.formatRupiah(r.hargaBeli) },
      { label: 'H. Jual', render: r => Utils.formatRupiah(r.hargaJual) },
      { label: 'Stok', render: r => `<span class="${r.stok <= r.stokMin ? 'stok-low' : 'stok-ok'}">${Utils.formatStock(r.stok, r.satuan)}</span>` },
      { label: 'Supplier', render: r => suppliers.find(s => s.id === r.supplierId)?.nama || '-' },
      {
        label: 'Aksi', render: r => `<div class="actions">
        <button class="btn btn-sm btn-ghost btn-edit" data-id="${r.id}">✏️</button>
        <button class="btn btn-sm btn-ghost btn-del" data-id="${r.id}" style="color:var(--danger)">🗑️</button>
      </div>` },
    ], rows, 'Belum ada data barang');

    wrapper.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => this.openForm(parseFloat(btn.dataset.id), el)));
    wrapper.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', async () => {
      Utils.confirm('Hapus barang ini?', async () => {
        await DB.delete('barang', parseFloat(btn.dataset.id));
        this.renderTable(el);
        Utils.toast('Barang dihapus', 'success');
      });
    }));
  },

  async openForm(id, container) {
    const item = id ? await DB.getById('barang', id) : null;
    const isEdit = !!item;
    const suppliers = await DB.getAll('suppliers');
    const categories = [...new Set((await DB.getAll('barang')).map(b => b.kategori))];

    Modal.open(isEdit ? '✏️ Edit Barang' : '➕ Tambah Barang', `
      <div class="form-row cols-2">
        <div class="form-group"><label>Kode Barang *</label><input type="text" id="fb-kode" value="${item?.kode || Utils.generateKode('BRG')}" ${isEdit ? 'readonly' : ''} /></div>
        <div class="form-group"><label>Nama Barang *</label><input type="text" id="fb-nama" value="${item?.nama || ''}" /></div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Kategori</label>
            <input list="categories" id="fb-kat" value="${item?.kategori || ''}" placeholder="Pilih atau ketik baru..." />
            <datalist id="categories">${categories.map(k => `<option value="${k}">`).join('')}</datalist>
        </div>
        <div class="form-group"><label>Satuan</label><input type="text" id="fb-sat" value="${item?.satuan || 'pcs'}" /></div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Harga Beli (Rp)</label><input type="number" id="fb-hbeli" value="${item?.hargaBeli || 0}" /></div>
        <div class="form-group"><label>Harga Jual (Rp)</label><input type="number" id="fb-hjual" value="${item?.hargaJual || 0}" /></div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Stok Awal</label><input type="number" id="fb-stok" value="${item?.stok || 0}" /></div>
        <div class="form-group"><label>Stok Minim</label><input type="number" id="fb-stokmin" value="${item?.stokMin || 5}" /></div>
      </div>
      <div class="form-group"><label>Supplier</label><select id="fb-sup"><option value="">- Pilih Supplier -</option>${suppliers.map(s => `<option value="${s.id}" ${s.id === item?.supplierId ? 'selected' : ''}>${s.nama}</option>`).join('')}</select></div>
      <div class="form-group"><label style="display:flex;align-items:center;gap:10px;text-transform:none"><input type="checkbox" id="fb-meter" ${item?.isMeter ? 'checked' : ''} style="width:auto" /> Barang ini dijual per meter (kabel)</label></div>`,
      [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
      {
        label: isEdit ? '💾 Simpan' : '➕ Tambah', cls: 'btn-primary', action: async () => {
          const data = {
            kode: document.getElementById('fb-kode').value,
            nama: document.getElementById('fb-nama').value,
            kategori: document.getElementById('fb-kat').value,
            satuan: document.getElementById('fb-sat').value,
            hargaBeli: parseFloat(document.getElementById('fb-hbeli').value) || 0,
            hargaJual: parseFloat(document.getElementById('fb-hjual').value) || 0,
            stok: parseFloat(document.getElementById('fb-stok').value) || 0,
            stokMin: parseFloat(document.getElementById('fb-stokmin').value) || 0,
            supplierId: parseFloat(document.getElementById('fb-sup').value) || null,
            isMeter: document.getElementById('fb-meter').checked
          };
          if (!data.kode || !data.nama) { Utils.toast('Kode dan Nama wajib diisi', 'error'); return; }
          if (isEdit) await DB.update('barang', id, data); else await DB.insert('barang', data);
          Modal.close(); this.renderTable(container);
          Utils.toast(isEdit ? 'Barang diperbarui' : 'Barang ditambahkan', 'success');
        }
      }]
    );
  }
};

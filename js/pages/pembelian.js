/**
 * TOKO NADYN POS – Pembelian (Purchase) Page (REST API Version)
 */
const PembelianPage = {
  async render(el) {
    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">🏗️ Pembelian Barang</div><div class="page-subtitle">Input stok masuk & faktur supplier</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="btn-new-pembelian">➕ Input Pembelian</button></div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="riwayat">Riwayat Faktur</button>
      <button class="tab-btn" data-tab="hutang">Hutang Supplier</button>
    </div>
    <div id="pembelian-content"></div>`;

    const tabs = el.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      this.showTab(t.dataset.tab, el.querySelector('#pembelian-content'));
    }));

    this.showTab('riwayat', el.querySelector('#pembelian-content'));
    el.querySelector('#btn-new-pembelian').addEventListener('click', () => this.openForm(el));
  },

  async showTab(tab, wrapper) {
    if (tab === 'riwayat') {
      const rows = await DB.getAll('pembelian');
      const suppliers = await DB.getAll('suppliers');
      wrapper.innerHTML = Utils.buildTable([
        { label: 'No Faktur', key: 'noFaktur' },
        { label: 'Tanggal', render: r => Utils.formatDate(r.tanggal) },
        { label: 'Supplier', render: r => suppliers.find(s => s.id === r.supplierId)?.nama || '-' },
        { label: 'Total', render: r => Utils.formatRupiah(r.total) },
        { label: 'Status', render: r => r.lunas ? '<span class="badge badge-success">Lunas</span>' : '<span class="badge badge-warning">Hutang</span>' },
      ], rows, 'Belum ada transaksi pembelian');
    } else {
      const hutang = await DB.getAll('hutangSupplier');
      const suppliers = await DB.getAll('suppliers');
      wrapper.innerHTML = Utils.buildTable([
        { label: 'Supplier', render: r => suppliers.find(s => s.id === r.supplierId)?.nama || '-' },
        { label: 'Faktur', key: 'noFaktur' },
        { label: 'Tgl Faktur', render: r => Utils.formatDate(r.tanggalFaktur) },
        { label: 'Total', render: r => Utils.formatRupiah(r.total) },
        { label: 'Sisa Hutang', render: r => `<span style="color:var(--danger);font-weight:700">${Utils.formatRupiah(r.sisa)}</span>` },
        { label: 'Jatuh Tempo', render: r => Utils.formatDate(r.jatuhTempo) },
        { label: 'Aksi', render: r => r.sisa > 0 ? `<button class="badge badge-violet btn-cicil" data-id="${r.id}" style="cursor:pointer">Cicil Bayar</button>` : '' }
      ], hutang.filter(h => h.sisa > 0), 'Tidak ada hutang supplier');

      wrapper.querySelectorAll('.btn-cicil').forEach(btn => btn.addEventListener('click', () => this.openCicilan(parseFloat(btn.dataset.id), wrapper)));
    }
  },

  async openForm(container) {
    const suppliers = await DB.getAll('suppliers');
    const barang = await DB.getAll('barang');
    let fakturItems = [];

    Modal.open('📝 Input Pembelian Baru', `
      <div class="form-row cols-2">
        <div class="form-group"><label>No. Faktur *</label><input type="text" id="ff-no" value="${Utils.generateKode('PUR')}" /></div>
        <div class="form-group"><label>Tanggal Faktur</label><input type="date" id="ff-tgl" value="${Utils.today()}" /></div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Supplier</label><select id="ff-sup">${suppliers.map(s => `<option value="${s.id}">${s.nama}</option>`).join('')}</select></div>
        <div class="form-group"><label>Jatuh Tempo (Jika Hutang)</label><input type="date" id="ff-jatem" value="${Utils.today()}" /></div>
      </div>
      <hr style="opacity:0.1;margin:15px 0" />
      <div class="form-row" style="gap:10px;align-items:flex-end">
        <div class="form-group" style="flex:2"><label>Pilih Barang</label><select id="ff-brg">${barang.map(b => `<option value="${b.id}">${b.nama} (${b.kode})</option>`).join('')}</select></div>
        <div class="form-group" style="flex:1"><label>Qty</label><input type="number" id="ff-qty" value="1" /></div>
        <div class="form-group" style="flex:1"><label>H. Beli Satuan (Rp)</label><input type="number" id="ff-hbeli" value="0" /></div>
        <button class="btn btn-violet" id="ff-add-item" style="height:38px;padding:0 15px">Tambahkan</button>
      </div>
      <div id="ff-items-wrapper" style="margin-top:15px;max-height:200px;overflow-y:auto"></div>
      <div class="form-group" style="margin-top:10px"><label style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="ff-lunas" checked style="width:auto" /> Faktur ini SUDAH LUNAS (Bayar dari Kas)</label></div>`,
      [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
      {
        label: '💾 Simpan Pembelian', cls: 'btn-primary', action: async () => {
          const noFaktur = document.getElementById('ff-no').value;
          const tgl = document.getElementById('ff-tgl').value;
          const supId = parseFloat(document.getElementById('ff-sup').value);
          const lunas = document.getElementById('ff-lunas').checked;
          if (!noFaktur || !supId || fakturItems.length === 0) { Utils.toast('Lengkapi data faktur', 'error'); return; }

          const subtotal = fakturItems.reduce((s, it) => s + it.qty * it.hargaBeli, 0);
          const disc = 0; // add if needed
          const total = subtotal - disc;

          const payload = {
            nota: {
              noFaktur: noFaktur,
              tanggal: tgl,
              supplierId: supId,
              subtotal: subtotal,
              diskon: disc,
              total: total,
              bayar: lunas ? total : 0,
              kembali: 0,
              metode: lunas ? 'Tunai' : 'Hutang',
              userCreated: Auth.currentUser.username
            },
            items: fakturItems.map(it => ({
              barangId: it.barangId,
              namaBarang: barang.find(b => b.id === it.barangId)?.nama,
              qty: it.qty,
              hargaBeli: it.hargaBeli,
              subtotal: it.qty * it.hargaBeli
            })),
            jurnal: {
              keterangan: `Pembelian Stok: ${noFaktur}`,
              items: lunas ? [
                { akun: 'persediaan', debit: total },
                { akun: 'kas', kredit: total }
              ] : [
                { akun: 'persediaan', debit: total },
                { akun: 'hutang', kredit: total }
              ]
            },
            hutang: lunas ? null : {
              sisa: total,
              jatuhTempo: document.getElementById('ff-jatem').value
            }
          };

          const res = await DB.insert('pembelian', payload);

          if (res && res.success) {
            Modal.close();
            this.showTab('riwayat', document.getElementById('pembelian-content'));
            Utils.toast('Pembelian berhasil disimpan', 'success');
          }
        }
      }]
    );

    const renderItems = () => {
      document.getElementById('ff-items-wrapper').innerHTML = Utils.buildTable([
        { label: 'Barang', render: r => barang.find(b => b.id === r.barangId)?.nama },
        { label: 'Qty', key: 'qty' },
        { label: 'H. Beli', render: r => Utils.formatRupiah(r.hargaBeli) },
        { label: 'Subtotal', render: r => Utils.formatRupiah(r.qty * r.hargaBeli) },
        { label: 'Hapus', render: r => `<button class="btn-del-it" style="cursor:pointer;border:none;background:none">❌</button>` }
      ], fakturItems);
      // Re-bind delete
      document.querySelectorAll('.btn-del-it').forEach((btn, i) => btn.addEventListener('click', () => { fakturItems.splice(i, 1); renderItems(); }));
    };

    const brgEl = document.getElementById('ff-brg');
    const hbeliEl = document.getElementById('ff-hbeli');
    brgEl.addEventListener('change', () => {
      const b = barang.find(x => x.id === parseFloat(brgEl.value));
      if (b) hbeliEl.value = b.hargaBeli;
    });
    brgEl.dispatchEvent(new Event('change'));

    document.getElementById('ff-add-item').addEventListener('click', () => {
      const bId = parseFloat(brgEl.value);
      const qty = parseFloat(document.getElementById('ff-qty').value) || 0;
      const hb = parseFloat(hbeliEl.value) || 0;
      if (qty <= 0) return;
      fakturItems.push({ barangId: bId, qty, hargaBeli: hb });
      renderItems();
    });
  },

  async openCicilan(id, container) {
    const item = await DB.getById('hutangSupplier', id);
    if (!item) return;
    Modal.open('💸 Pembayaran Hutang Supplier', `
      <div class="form-group"><label>Sisa Hutang</label><div class="stat-value" style="font-size:24px;color:var(--danger)">${Utils.formatRupiah(item.sisa)}</div></div>
      <div class="form-group"><label>Jumlah Bayar</label><input type="number" id="pay-hutang-amt" value="${item.sisa}" /></div>
      <div class="form-group"><label>Tanggal Bayar</label><input type="date" id="pay-hutang-tgl" value="${Utils.today()}" /></div>
      <div class="form-group"><label>Keterangan</label><input type="text" id="pay-hutang-ket" value="Cicilan faktur ${item.noFaktur}" /></div>`,
      [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
      {
        label: '💾 Simpan', cls: 'btn-primary', action: async () => {
          const amt = parseFloat(document.getElementById('pay-hutang-amt').value) || 0;
          if (amt <= 0 || amt > item.sisa) { Utils.toast('Jumlah tidak valid', 'error'); return; }

          const res = await DB.insert(`hutangSupplier/${id}/cicilan`, {
            jumlah: amt,
            tanggal: document.getElementById('pay-hutang-tgl').value,
            keterangan: document.getElementById('pay-hutang-ket').value
          });

          if (res && res.success) {
            Modal.close();
            this.showTab('hutang', document.getElementById('pembelian-content'));
            Utils.toast('Cicilan berhasil disimpan', 'success');
          } else {
            Utils.toast('Gagal menyimpan cicilan', 'error');
          }
        }
      }]
    );
  }
};

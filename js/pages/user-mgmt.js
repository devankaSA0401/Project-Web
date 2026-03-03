/**
 * TOKO NADYN POS – User Management Page (REST API Version)
 */
const UserMgmtPage = {
    async render(el) {
        if (!Auth.isAdmin()) {
            el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔐</div><div class="empty-title">Akses Dibatasi</div><p>Anda tidak memiliki izin untuk mengelola user.</p></div>`;
            return;
        }

        el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">👤 Kelola Pengguna</div><div class="page-subtitle">Tambah & atur hak akses admin / kasir</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="btn-add-user">➕ Tambah User</button></div>
    </div>
    <div id="user-table-wrapper"></div>`;

        el.querySelector('#btn-add-user').addEventListener('click', () => this.openForm(null, el));
        await this.renderTable(el);
    },

    async renderTable(el) {
        const rows = await DB.getAll('users');
        const wrapper = el.querySelector('#user-table-wrapper');
        wrapper.innerHTML = Utils.buildTable([
            { label: 'Username', key: 'username' },
            { label: 'Nama Lengkap', key: 'nama' },
            { label: 'Role / Akses', render: r => `<span class="badge ${r.role === 'admin' ? 'badge-violet' : 'badge-success'}">${r.role.toUpperCase()}</span>` },
            { label: 'Dibuat Pada', render: r => Utils.formatDate(r.createdAt) },
            {
                label: 'Aksi', render: r => `<div class="actions">
        <button class="btn btn-sm btn-ghost btn-edit" data-id="${r.id}">✏️</button>
        <button class="btn btn-sm btn-ghost btn-del" data-id="${r.id}" style="color:var(--danger)">🗑️</button>
      </div>` },
        ], rows, 'Tidak ada user');

        wrapper.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => this.openForm(parseFloat(btn.dataset.id), el)));
        wrapper.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', async () => {
            Utils.confirm('Hapus user ini?', async () => {
                await DB.delete('users', parseFloat(btn.dataset.id));
                this.renderTable(el);
                Utils.toast('User dihapus', 'success');
            });
        }));
    },

    async openForm(id, container) {
        const item = id ? await DB.getById('users', id) : null;
        const isEdit = !!item;
        Modal.open(isEdit ? '✏️ Edit User' : '➕ Tambah User', `
      <div class="form-group"><label>Username *</label><input type="text" id="fu-user" value="${item?.username || ''}" /></div>
      <div class="form-group"><label>Password ${isEdit ? '(kosongkan jika tidak ganti)' : '*'}</label><input type="password" id="fu-pass" /></div>
      <div class="form-group"><label>Nama Lengkap *</label><input type="text" id="fu-nama" value="${item?.nama || ''}" /></div>
      <div class="form-group"><label>Role / Akses *</label><select id="fu-role"><option value="kasir" ${item?.role === 'kasir' ? 'selected' : ''}>Kasir</option><option value="admin" ${item?.role === 'admin' ? 'selected' : ''}>Admin</option></select></div>`,
            [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
            {
                label: isEdit ? '💾 Simpan' : '➕ Tambah', cls: 'btn-primary', action: async () => {
                    const data = {
                        username: document.getElementById('fu-user').value,
                        nama: document.getElementById('fu-nama').value,
                        role: document.getElementById('fu-role').value
                    };
                    const pass = document.getElementById('fu-pass').value;
                    if (pass) data.password = pass;
                    if (!data.username || !data.nama || (!isEdit && !pass)) { Utils.toast('Lengkapi data user', 'error'); return; }

                    if (isEdit) await DB.update('users', id, data); else await DB.insert('users', data);
                    Modal.close(); this.renderTable(container);
                    Utils.toast(isEdit ? 'User diperbarui' : 'User ditambahkan', 'success');
                }
            }]
        );
    }
};

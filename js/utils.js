/**
 * TOKO NADYN POS – Utility Functions (SQL Server / REST API Version)
 */

const Utils = {
    formatRupiah(n, prefix = 'Rp') {
        if (n === undefined || n === null || isNaN(n)) return (prefix + ' 0');
        return prefix + ' ' + Math.round(Number(n)).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },
    formatNum(n) {
        return Math.round(Number(n || 0)).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },
    formatStock(n, unit) {
        const val = this.formatNum(n);
        if (!unit) return val;
        const u = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
        return `${val} ${u}`;
    },
    parseRupiah(s) { return parseInt(String(s).replace(/[^0-9]/g, '')) || 0; },

    formatDate(d) {
        if (!d) return '-';
        const dt = new Date(d);
        return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    formatDateInput(d) {
        if (!d) return new Date().toISOString().split('T')[0];
        return new Date(d).toISOString().split('T')[0];
    },
    formatDateTime(d) {
        if (!d) return '-';
        const dt = new Date(d);
        return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
            dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },
    today() { return new Date().toISOString().split('T')[0]; },
    nowISO() { return new Date().toISOString(); },

    margin(hargaBeli, hargaJual) {
        if (!hargaBeli || hargaBeli === 0) return 0;
        return Math.round(((hargaJual - hargaBeli) / hargaBeli) * 100);
    },

    generateKode(prefix) {
        return prefix + '-' + Date.now().toString().slice(-6);
    },

    // Toast notifications
    toast(msg, type = 'success', duration = 3000) {
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const container = document.getElementById('toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => {
            el.classList.add('toast-out');
            setTimeout(() => el.remove(), 350);
        }, duration);
    },

    // Confirm dialog (updated for async)
    confirm(msg, onYes) {
        Modal.open('Konfirmasi', `<p style="font-size:14px;color:var(--text-secondary)">${msg}</p>`,
            [{ label: 'Batal', cls: 'btn-outline', action: () => Modal.close() },
            {
                label: 'Ya, Lanjutkan', cls: 'btn-danger', action: async () => {
                    Modal.close();
                    if (typeof onYes === 'function') await onYes();
                }
            }]
        );
    },

    // Debounce
    debounce(fn, ms = 300) {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    },

    categoryIcon(kat) {
        const map = { 'Kabel': '🔌', 'MCB/Sekring': '⚡', 'Lampu': '💡', 'Stop Kontak': '🔋', 'Instalasi': '🔧', 'Alat Ukur': '📏', 'Grounding': '⬇️', 'Panel Listrik': '📦' };
        return map[kat] || '📦';
    },

    // Build simple HTML table
    buildTable(cols, rows, emptyMsg = 'Tidak ada data') {
        if (!rows || rows.length === 0) {
            return `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">${emptyMsg}</div></div>`;
        }
        let html = `<div class="table-wrapper"><table class="table"><thead><tr>`;
        cols.forEach(c => { html += `<th>${c.label}</th>`; });
        html += `</tr></thead><tbody>`;
        rows.forEach(r => {
            html += `<tr>`;
            cols.forEach(c => { html += `<td>${typeof c.render === 'function' ? c.render(r) : (r[c.key] ?? '-')}</td>`; });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
        return html;
    },

    // Jurnal Otomatis (REST API Version)
    async createJurnal(keterangan, items) {
        // items = [{akun, debit, kredit}]
        return await DB.insert('jurnal', {
            keterangan,
            items,
            tanggal: this.today()
        });
    },

    // Stock movement log (REST API Version)
    async logStock(barangId, tipe, qty, keterangan, refId = null) {
        return await DB.insert('stockMovements', {
            barangId, tipe, qty, keterangan, refId
        });
    },

    // PDF Simulation / Print
    print(title, content, type = 'report') {
        const printArea = document.getElementById('print-area');
        if (!printArea) return;

        printArea.classList.remove('hidden');
        printArea.className = 'print-area ' + (type === 'receipt' ? 'print-receipt' : 'print-report');

        let html = '';
        if (type === 'receipt') {
            html = `
                <div class="receipt-wrapper">
                    <div class="receipt-header">
                        <h2 style="margin:0; font-size:16px;">TOKO LISTRIK NADYN</h2>
                        <p style="margin:2px 0; font-size:10px;">Jl. Raya Listrik No. 123, Indonesia</p>
                        <p style="margin:2px 0; font-size:10px;">Telp: 021-12345678</p>
                    </div>
                    <div class="receipt-body">
                        ${content}
                    </div>
                    <div class="receipt-footer">
                        <p style="margin:0; font-size:11px; font-weight:bold;">TERIMA KASIH</p>
                        <p style="margin:2px 0; font-size:10px;">Selamat Belanja Kembali</p>
                        <div style="margin-top:10px; font-size:9px; color:#666;">
                            Dicetak: ${this.formatDateTime(new Date())}
                        </div>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="report-wrapper">
                    <div class="report-header">
                        <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:10px;color:#000">
                            <h2 style="margin:0">TOKO LISTRIK NADYN</h2>
                            <p style="margin:5px 0">Jl. Raya Listrik No. 123, Indonesia</p>
                            <p style="margin:2px 0">Telp: 021-12345678</p>
                        </div>
                        <h3 style="text-align:center;margin-bottom:15px;text-transform:uppercase;color:#000">${title}</h3>
                    </div>
                    <div class="report-body" style="color:#000">
                        ${content}
                    </div>
                    <div class="report-footer">
                        <div style="margin-top:40px;display:flex;justify-content:space-between;color:#000">
                            <div style="font-size:12px">Dicetak pada: ${this.formatDateTime(new Date())}</div>
                            <div style="text-align:center;width:150px;border-top:1px solid #333;margin-top:20px;padding-top:5px">Admin</div>
                        </div>
                    </div>
                </div>
            `;
        }

        printArea.innerHTML = html;
        window.print();
        setTimeout(() => {
            printArea.classList.add('hidden');
            printArea.className = 'print-area hidden';
        }, 500);
    }
};

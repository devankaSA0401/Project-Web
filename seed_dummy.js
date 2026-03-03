require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'admin',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'TokoNadyn',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
    }
};

async function seed() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('🚀 Starting Seeder...');

        // 1. Clean data (Except Users)
        await pool.request().query('DELETE FROM JurnalItems; DELETE FROM Jurnal; DELETE FROM CicilanHutang; DELETE FROM HutangSupplier; DELETE FROM PembelianItems; DELETE FROM Pembelian; DELETE FROM PenjualanItems; DELETE FROM Penjualan; DELETE FROM StockMovements; DELETE FROM Barang; DELETE FROM Suppliers; DELETE FROM Customers; DELETE FROM CashFlow;');
        console.log('✅ Data cleaned.');

        // 2. Generate Suppliers (20)
        const suppliers = [];
        for (let i = 1; i <= 20; i++) {
            const res = await pool.request()
                .input('n', sql.NVarChar, `Supplier Listrik ${i}`)
                .input('cp', sql.NVarChar, `Bpk ${i}`)
                .input('t', sql.NVarChar, `08123456789${i % 10}`)
                .input('a', sql.NVarChar, `Alamat Supplier ${i}`)
                .query('INSERT INTO Suppliers (Nama, Kontak, Telepon, Alamat) OUTPUT INSERTED.Id VALUES (@n, @cp, @t, @a)');
            suppliers.push(res.recordset[0].Id);
        }
        console.log('✅ 20 Suppliers created.');

        // 3. Generate Customers (50)
        const customers = [];
        for (let i = 1; i <= 50; i++) {
            const res = await pool.request()
                .input('n', sql.NVarChar, `Customer ${i}`)
                .input('t', sql.NVarChar, `08998765432${i % 10}`)
                .input('a', sql.NVarChar, `Alamat Customer ${i}`)
                .query('INSERT INTO Customers (Nama, Telepon, Alamat) OUTPUT INSERTED.Id VALUES (@n, @t, @a)');
            customers.push(res.recordset[0].Id);
        }
        console.log('✅ 50 Customers created.');

        // 3. Barang (Electrical Products)
        const items = [
            { n: 'Kabel NYM 2x1.5 50m', c: 'Kabel', s: 'roll' },
            { n: 'Lampu LED 9W Philips', c: 'Lampu', s: 'pcs' },
            { n: 'Saklar Tunggal Broco', c: 'Saklar', s: 'pcs' },
            { n: 'Stop Kontak 4 Lubang', c: 'Peralatan Listrik', s: 'pcs' },
            { n: 'Tang Kombinasi Tekiro', c: 'Alat Teknik', s: 'pcs' },
            { n: 'Isolasi Listrik Nitto', c: 'Peralatan Listrik', s: 'pcs' },
            { n: 'Lampu TL 36W', c: 'Lampu', s: 'pcs' },
            { n: 'MCB 1 Phase 10A Schneider', c: 'Peralatan Listrik', s: 'pcs' },
            { n: 'Kabel Eterna 2x2.5 50m', c: 'Kabel', s: 'roll' },
            { n: 'Fitting Lampu E27 Broco', c: 'Saklar', s: 'pcs' }
        ];

        const barangs = [];
        for (let i = 1; i <= 100; i++) {
            const itIdx = (i - 1) % items.length;
            const item = items[itIdx];
            const name = i > 10 ? `${item.n} - Tipe ${i}` : item.n;
            const res = await pool.request()
                .input('kd', sql.NVarChar, `ELC-${1000 + i}`)
                .input('nm', sql.NVarChar, name)
                .input('kt', sql.NVarChar, item.c)
                .input('st', sql.NVarChar, item.s)
                .input('hb', sql.Decimal(18, 2), 5000 + (Math.random() * 50000))
                .input('hj', sql.Decimal(18, 2), 7000 + (Math.random() * 70000))
                .input('sk', sql.Decimal(18, 2), 10 + (Math.random() * 100))
                .input('sm', sql.Decimal(18, 2), 5)
                .input('mt', sql.Bit, i % 5 === 0 ? 1 : 0)
                .query('INSERT INTO Barang (Kode, Nama, Kategori, Satuan, HargaBeli, HargaJual, Stok, StokMin, IsMeter) OUTPUT INSERTED.* VALUES (@kd, @nm, @kt, @st, @hb, @hj, @sk, @sm, @mt)');
            barangs.push(res.recordset[0]);
        }
        console.log('✅ 100 Electrical products created.');

        // 4. Generate Sales & Jurnal
        for (let i = 1; i <= 50; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 10));
            const cId = customers[Math.floor(Math.random() * customers.length)];
            const b = barangs[Math.floor(Math.random() * barangs.length)];
            const qty = Math.floor(Math.random() * 5) + 1;
            const total = qty * b.HargaJual;

            const resP = await pool.request()
                .input('nota', sql.NVarChar, `INV-${i.toString().padStart(5, '0')}`)
                .input('tgl', sql.Date, date)
                .input('cid', sql.Int, cId)
                .input('tot', sql.Decimal(18, 2), total)
                .input('usr', sql.NVarChar, 'admin')
                .query('INSERT INTO Penjualan (NoNota, Tanggal, CustomerId, Subtotal, Diskon, Total, Bayar, Kembali, Metode, UserCreated) OUTPUT INSERTED.Id VALUES (@nota, @tgl, @cid, @tot, 0, @tot, @tot, 0, \'Tunai\', @usr)');

            const saleId = resP.recordset[0].Id;

            // Penjualan Items
            await pool.request()
                .input('sid', sql.Int, saleId)
                .input('bid', sql.Int, b.Id)
                .input('nb', sql.NVarChar, b.Nama)
                .input('qty', sql.Decimal(18, 2), qty)
                .input('hb', sql.Decimal(18, 2), b.HargaBeli)
                .input('hj', sql.Decimal(18, 2), b.HargaJual)
                .input('sub', sql.Decimal(18, 2), total)
                .query('INSERT INTO PenjualanItems (PenjualanId, BarangId, NamaBarang, Qty, HargaBeli, HargaJual, Diskon, Subtotal) VALUES (@sid, @bid, @nb, @qty, @hb, @hj, 0, @sub)');

            // Jurnal Penjualan
            const resJ = await pool.request()
                .input('tgl', sql.DateTime, date)
                .input('ket', sql.NVarChar, `Penjualan Tunai ${saleId}`)
                .query('INSERT INTO Jurnal (Tanggal, Keterangan) OUTPUT INSERTED.Id VALUES (@tgl, @ket)');
            const jId = resJ.recordset[0].Id;

            await pool.request().input('jid', sql.Int, jId).input('deb', sql.Decimal(18, 2), total).query('INSERT INTO JurnalItems (JurnalId, Akun, Debit, Kredit) VALUES (@jid, \'kas\', @deb, 0)');
            await pool.request().input('jid', sql.Int, jId).input('kre', sql.Decimal(18, 2), total).query('INSERT INTO JurnalItems (JurnalId, Akun, Debit, Kredit) VALUES (@jid, \'penjualan\', 0, @kre)');
        }
        console.log('✅ 50 Sales entries with journals created.');

        // 5. Generate CashFlow
        const cfCats = ['Listrik', 'Gaji', 'Sewa', 'Lainnya'];
        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            await pool.request()
                .input('t', sql.NVarChar, 'out')
                .input('k', sql.NVarChar, cfCats[Math.floor(Math.random() * cfCats.length)])
                .input('ket', sql.NVarChar, `Biaya Operasional ${i}`)
                .input('j', sql.Decimal(18, 2), Math.floor(Math.random() * 50000) + 10000)
                .input('tgl', sql.Date, date)
                .query('INSERT INTO CashFlow (Tipe, Kategori, Keterangan, Jumlah, Tanggal) VALUES (@t, @k, @ket, @j, @tgl)');
        }
        console.log('✅ 30 CashFlow entries created.');

        console.log('🏁 Seeding Finished Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeder Failed:', err.message);
        process.exit(1);
    }
}
seed();

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Pembelian ORDER BY Id DESC');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/', async (req, res) => {
    const { nota, items, jurnal, hutang } = req.body;
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        // 1. Insert Pembelian
        const request = new sql.Request(transaction);
        const np = await request
            .input('nota', sql.NVarChar, nota.noFaktur)
            .input('tgl', sql.Date, nota.tanggal)
            .input('supId', sql.Int, nota.supplierId)
            .input('tot', sql.Decimal(18, 2), nota.total)
            .input('lun', sql.Bit, hutang && hutang.sisa > 0 ? 0 : 1)
            .input('jatem', sql.Date, hutang && hutang.sisa > 0 ? hutang.jatuhTempo : nota.tanggal)
            .query('INSERT INTO Pembelian (NoFaktur, Tanggal, SupplierId, Total, Lunas, JatuhTempo) OUTPUT INSERTED.Id VALUES (@nota, @tgl, @supId, @tot, @lun, @jatem)');

        const purchaseId = np.recordset[0].Id;

        // 2. Insert Items & Update Stock
        for (const it of items) {
            await new sql.Request(transaction)
                .input('pid', sql.Int, purchaseId)
                .input('bid', sql.Int, it.barangId)
                .input('name', sql.NVarChar, it.namaBarang)
                .input('qty', sql.Decimal(18, 2), it.qty)
                .input('hb', sql.Decimal(18, 2), it.hargaBeli)
                .query('INSERT INTO PembelianItems (PembelianId, BarangId, NamaBarang, Qty, HargaBeli) VALUES (@pid, @bid, @name, @qty, @hb)');

            // 2. Insert Items & Update Stock (Moving Average HPP)
            await new sql.Request(transaction)
                .input('bid', sql.Int, it.barangId)
                .input('qty', sql.Decimal(18, 2), it.qty)
                .input('hb', sql.Decimal(18, 2), it.hargaBeli)
                .query(`
                    UPDATE Barang SET 
                        HargaBeli = CASE 
                            WHEN (Stok + @qty) > 0 THEN ((Stok * HargaBeli) + (@qty * @hb)) / (Stok + @qty)
                            ELSE @hb 
                        END,
                        Stok = Stok + @qty 
                    WHERE Id = @bid
                `);
        }

        // 3. Hutang Supplier (if credit)
        if (hutang && hutang.sisa > 0) {
            await new sql.Request(transaction)
                .input('supId', sql.Int, nota.supplierId)
                .input('pid', sql.Int, purchaseId)
                .input('nota', sql.NVarChar, nota.noFaktur)
                .input('tgl', sql.Date, nota.tanggal)
                .input('tot', sql.Decimal(18, 2), nota.total)
                .input('sis', sql.Decimal(18, 2), hutang.sisa)
                .input('jt', sql.Date, hutang.jatuhTempo)
                .query('INSERT INTO HutangSupplier (SupplierId, PembelianId, NoFaktur, TanggalFaktur, Total, Sisa, Lunas, JatuhTempo) VALUES (@supId, @pid, @nota, @tgl, @tot, @sis, 0, @jt)');
        }

        // 4. Jurnal
        if (jurnal) {
            const njur = await new sql.Request(transaction)
                .input('tgl', sql.DateTime, new Date())
                .input('ket', sql.NVarChar, jurnal.keterangan)
                .query('INSERT INTO Jurnal (Tanggal, Keterangan) OUTPUT INSERTED.Id VALUES (@tgl, @ket)');
            const jId = njur.recordset[0].Id;
            for (const jit of jurnal.items) {
                await new sql.Request(transaction)
                    .input('jid', sql.Int, jId)
                    .input('akun', sql.NVarChar, jit.akun)
                    .input('deb', sql.Decimal(18, 2), jit.debit || 0)
                    .input('kre', sql.Decimal(18, 2), jit.kredit || 0)
                    .query('INSERT INTO JurnalItems (JurnalId, Akun, Debit, Kredit) VALUES (@jid, @akun, @deb, @kre)');
            }
        }

        await transaction.commit();
        res.json({ success: true, id: purchaseId });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).send(err.message);
    }
});

module.exports = router;

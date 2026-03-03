const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Penjualan ORDER BY Id DESC');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/', async (req, res) => {
    const { nota, items, jurnal } = req.body;
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        // 1. Insert Penjualan
        const nj = await new sql.Request(transaction)
            .input('nota', sql.NVarChar, nota.noNota)
            .input('tgl', sql.Date, nota.tanggal)
            .input('custId', sql.Int, nota.customerId)
            .input('sub', sql.Decimal(18, 2), nota.subtotal)
            .input('disc', sql.Decimal(18, 2), nota.diskon)
            .input('tot', sql.Decimal(18, 2), nota.total)
            .input('bay', sql.Decimal(18, 2), nota.bayar)
            .input('kem', sql.Decimal(18, 2), nota.kembali)
            .input('met', sql.NVarChar, nota.metode)
            .input('usr', sql.NVarChar, nota.userCreated)
            .query('INSERT INTO Penjualan (NoNota, Tanggal, CustomerId, Subtotal, Diskon, Total, Bayar, Kembali, Metode, UserCreated) OUTPUT INSERTED.Id VALUES (@nota, @tgl, @custId, @sub, @disc, @tot, @bay, @kem, @met, @usr)');

        const saleId = nj.recordset[0].Id;

        // 2. Insert Items & Update Stock
        for (const it of items) {
            await new sql.Request(transaction)
                .input('sid', sql.Int, saleId)
                .input('bid', sql.Int, it.barangId)
                .input('name', sql.NVarChar, it.namaBarang)
                .input('qty', sql.Decimal(18, 2), it.qty)
                .input('hb', sql.Decimal(18, 2), it.hargaBeli)
                .input('hj', sql.Decimal(18, 2), it.hargaJual)
                .input('dc', sql.Decimal(18, 2), it.diskon)
                .input('sub', sql.Decimal(18, 2), it.subtotal)
                .query('INSERT INTO PenjualanItems (PenjualanId, BarangId, NamaBarang, Qty, HargaBeli, HargaJual, Diskon, Subtotal) VALUES (@sid,@bid,@name,@qty,@hb,@hj,@dc,@sub)');

            await new sql.Request(transaction)
                .input('bid', sql.Int, it.barangId)
                .input('qty', sql.Decimal(18, 2), it.qty)
                .query('UPDATE Barang SET Stok = Stok - @qty WHERE Id = @bid');
        }

        // 3. Jurnal
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
        res.json({ success: true, id: saleId });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).send(err.message);
    }
});

router.get('/items', async (req, res) => {
    try {
        const pool = await sql.connect();
        let query = 'SELECT * FROM PenjualanItems';
        const request = pool.request();
        if (req.query.penjualanId) {
            query += ' WHERE PenjualanId = @sid';
            request.input('sid', sql.Int, req.query.penjualanId);
        }
        const result = await request.query(query);
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

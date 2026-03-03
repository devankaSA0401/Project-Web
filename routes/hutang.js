const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

// GET all debt to suppliers
router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM HutangSupplier ORDER BY Lunas, JatuhTempo');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// GET by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM HutangSupplier WHERE Id = @id');
        res.json(toCamel(result.recordset[0]));
    } catch (err) { res.status(500).send(err.message); }
});

// GET installments for a debt
router.get('/:id/cicilan', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM CicilanHutang WHERE HutangId = @id ORDER BY Tanggal DESC');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// POST add installment
router.post('/:id/cicilan', async (req, res) => {
    const { jumlah, keterangan, tanggal } = req.body;
    try {
        const pool = await sql.connect();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 1. Insert Cicilan
        await new sql.Request(transaction)
            .input('hid', sql.Int, req.params.id)
            .input('tgl', sql.Date, tanggal)
            .input('amt', sql.Decimal(18, 2), jumlah)
            .input('ket', sql.NVarChar, keterangan)
            .query('INSERT INTO CicilanHutang (HutangId, Tanggal, Jumlah, Keterangan) VALUES (@hid, @tgl, @amt, @ket)');

        // 2. Update Hutang Sisa
        await new sql.Request(transaction)
            .input('hid', sql.Int, req.params.id)
            .input('amt', sql.Decimal(18, 2), jumlah)
            .query('UPDATE HutangSupplier SET Sisa = Sisa - @amt, Lunas = CASE WHEN (Sisa - @amt) <= 0 THEN 1 ELSE 0 END WHERE Id = @hid');

        // 3. Cashflow record (type: out)
        await new sql.Request(transaction)
            .input('tgl', sql.Date, tanggal)
            .input('amt', sql.Decimal(18, 2), jumlah)
            .input('ket', sql.NVarChar, `Bayar Hutang: ${keterangan}`)
            .query("INSERT INTO CashFlow (Tanggal, Tipe, Kategori, Keterangan, Jumlah) VALUES (@tgl, 'out', 'Hutang Supplier', @ket, @amt)");

        await transaction.commit();
        res.json({ success: true, message: 'Cicilan berhasil dicatat' });
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

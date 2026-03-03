const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

// GET all stock movements
router.get('/movements', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM StockMovements ORDER BY CreatedAt DESC');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// Stock status (low stocks)
router.get('/low-stock', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Barang WHERE Stok <= StokMin');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// POST adjustment
router.post('/adjust', async (req, res) => {
    const { barangId, tipe, qty, keterangan } = req.body;
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        // 1. Log Movement
        await new sql.Request(transaction)
            .input('bid', sql.Int, barangId)
            .input('tip', sql.NVarChar, tipe)
            .input('qty', sql.Decimal(18, 2), qty)
            .input('ket', sql.NVarChar, keterangan)
            .query('INSERT INTO StockMovements (BarangId, Tipe, Qty, Keterangan) VALUES (@bid, @tip, @qty, @ket)');

        // 2. Update Stok
        const finalQty = tipe === 'in' ? qty : (tipe === 'out' ? -qty : qty);
        await new sql.Request(transaction)
            .input('bid', sql.Int, barangId)
            .input('qty', sql.Decimal(18, 2), finalQty)
            .query('UPDATE Barang SET Stok = Stok + @qty WHERE Id = @bid');

        await transaction.commit();
        res.json({ success: true });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).send(err.message);
    }
});

module.exports = router;

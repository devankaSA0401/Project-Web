const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM CashFlow ORDER BY Tanggal DESC, Id DESC');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/', async (req, res) => {
    const c = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('type', sql.NVarChar, c.tipe)
            .input('kat', sql.NVarChar, c.kategori)
            .input('ket', sql.NVarChar, c.keterangan)
            .input('amt', sql.Decimal(18, 2), c.jumlah)
            .input('tgl', sql.Date, c.tanggal)
            .query('INSERT INTO CashFlow (Tipe, Kategori, Keterangan, Jumlah, Tanggal) VALUES (@type, @kat, @ket, @amt, @tgl)');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM CashFlow WHERE Id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Customers ORDER BY Nama');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/', async (req, res) => {
    const c = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('nama', sql.NVarChar, c.nama)
            .input('telp', sql.NVarChar, c.telepon)
            .input('alamat', sql.NVarChar, c.alamat)
            .input('piutang', sql.Decimal(18, 2), c.piutang || 0)
            .query('INSERT INTO Customers (Nama, Telepon, Alamat, Piutang) VALUES (@nama, @telp, @alamat, @piutang)');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.put('/:id', async (req, res) => {
    const c = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nama', sql.NVarChar, c.nama)
            .input('telp', sql.NVarChar, c.telepon)
            .input('alamat', sql.NVarChar, c.alamat)
            .input('piutang', sql.Decimal(18, 2), c.piutang)
            .query('UPDATE Customers SET Nama=@nama, Telepon=@telp, Alamat=@alamat, Piutang=@piutang WHERE Id=@id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Customers WHERE Id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

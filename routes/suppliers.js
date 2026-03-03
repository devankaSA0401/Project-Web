const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Suppliers ORDER BY Nama');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/', async (req, res) => {
    const s = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('nama', sql.NVarChar, s.nama)
            .input('kontak', sql.NVarChar, s.kontak)
            .input('telp', sql.NVarChar, s.telepon)
            .input('alamat', sql.NVarChar, s.alamat)
            .query('INSERT INTO Suppliers (Nama, Kontak, Telepon, Alamat) VALUES (@nama, @kontak, @telp, @alamat)');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.put('/:id', async (req, res) => {
    const s = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nama', sql.NVarChar, s.nama)
            .input('kontak', sql.NVarChar, s.kontak)
            .input('telp', sql.NVarChar, s.telepon)
            .input('alamat', sql.NVarChar, s.alamat)
            .query('UPDATE Suppliers SET Nama=@nama, Kontak=@kontak, Telepon=@telp, Alamat=@alamat WHERE Id=@id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Suppliers WHERE Id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

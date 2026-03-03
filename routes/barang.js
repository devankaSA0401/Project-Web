const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

// GET all barang
router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Barang');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// GET barang by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Barang WHERE Id = @id');
        if (result.recordset.length === 0) return res.status(404).send('Barang not found');
        res.json(toCamel(result.recordset[0]));
    } catch (err) { res.status(500).send(err.message); }
});

// INSERT barang
router.post('/', async (req, res) => {
    const b = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('kode', sql.NVarChar, b.kode)
            .input('nama', sql.NVarChar, b.nama)
            .input('kat', sql.NVarChar, b.kategori)
            .input('sat', sql.NVarChar, b.satuan)
            .input('hbeli', sql.Decimal(18, 2), b.hargaBeli)
            .input('hjual', sql.Decimal(18, 2), b.hargaJual)
            .input('stok', sql.Decimal(18, 2), b.stok)
            .input('stokmin', sql.Decimal(18, 2), b.stokMin)
            .input('supId', sql.Int, b.supplierId)
            .input('isMeter', sql.Bit, b.isMeter ? 1 : 0)
            .query(`INSERT INTO Barang (Kode, Nama, Kategori, Satuan, HargaBeli, HargaJual, Stok, StokMin, SupplierId, IsMeter)
                    VALUES (@kode, @nama, @kat, @sat, @hbeli, @hjual, @stok, @stokmin, @supId, @isMeter)`);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// UPDATE barang
router.put('/:id', async (req, res) => {
    const b = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nama', sql.NVarChar, b.nama)
            .input('kat', sql.NVarChar, b.kategori)
            .input('sat', sql.NVarChar, b.satuan)
            .input('hbeli', sql.Decimal(18, 2), b.hargaBeli)
            .input('hjual', sql.Decimal(18, 2), b.hargaJual)
            .input('stok', sql.Decimal(18, 2), b.stok)
            .input('stokmin', sql.Decimal(18, 2), b.stokMin)
            .input('supId', sql.Int, b.supplierId)
            .input('isMeter', sql.Bit, b.isMeter ? 1 : 0)
            .query(`UPDATE Barang SET 
                        Nama = @nama, Kategori = @kat, Satuan = @sat, 
                        HargaBeli = @hbeli, HargaJual = @hjual, 
                        Stok = @stok, StokMin = @stokmin, SupplierId = @supId, IsMeter = @isMeter
                    WHERE Id = @id`);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// DELETE barang
router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Barang WHERE Id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

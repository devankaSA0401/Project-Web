const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Users ORDER BY Nama');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/', async (req, res) => {
    const u = req.body;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('u', sql.NVarChar, u.username)
            .input('p', sql.NVarChar, u.password)
            .input('n', sql.NVarChar, u.nama)
            .input('r', sql.NVarChar, u.role)
            .query('INSERT INTO Users (Username, Password, Nama, Role) VALUES (@u, @p, @n, @r)');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.put('/:id', async (req, res) => {
    const u = req.body;
    try {
        const pool = await sql.connect();
        let query = 'UPDATE Users SET Username=@u, Nama=@n, Role=@r';
        const request = pool.request()
            .input('id', sql.Int, req.params.id)
            .input('u', sql.NVarChar, u.username)
            .input('n', sql.NVarChar, u.nama)
            .input('r', sql.NVarChar, u.role);

        if (u.password) {
            query += ', Password=@p';
            request.input('p', sql.NVarChar, u.password);
        }
        query += ' WHERE Id=@id';
        await request.query(query);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Users WHERE Id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('u', sql.NVarChar, username)
            .input('p', sql.NVarChar, password)
            .query('SELECT Id, Username, Nama, Role FROM Users WHERE Username = @u AND Password = @p');

        if (result.recordset.length > 0) {
            res.json(toCamel(result.recordset[0]));
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

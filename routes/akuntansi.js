const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { toCamel } = require('../backend_utils');

// GET all journal entries
router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query(`
            SELECT j.Id, j.Tanggal, j.Keterangan, ji.Akun, ji.Debit, ji.Kredit 
            FROM Jurnal j 
            LEFT JOIN JurnalItems ji ON j.Id = ji.JurnalId 
            ORDER BY j.Tanggal DESC, j.Id DESC
        `);
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// GET items for a journal entry
router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM JurnalItems WHERE JurnalId = @id');
        res.json(toCamel(result.recordset));
    } catch (err) { res.status(500).send(err.message); }
});

// POST to create a journal entry manually or automatically
router.post('/', async (req, res) => {
    const data = req.body;
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1. Insert Jurnal
        const njur = await request
            .input('tgl', sql.DateTime, data.tanggal || new Date())
            .input('ket', sql.NVarChar, data.keterangan || 'Jurnal Umum')
            .input('user', sql.NVarChar, data.user || 'admin')
            .query('INSERT INTO Jurnal (Tanggal, Keterangan, CreatedBy) OUTPUT INSERTED.Id VALUES (@tgl, @ket, @user)');

        const jId = njur.recordset[0].Id;

        // 2. Insert Jurnal Items
        if (data.items && Array.isArray(data.items)) {
            for (const jit of data.items) {
                await new sql.Request(transaction)
                    .input('jid', sql.Int, jId)
                    .input('akun', sql.NVarChar, jit.akun)
                    .input('deb', sql.Decimal(18, 2), jit.debit || 0)
                    .input('kre', sql.Decimal(18, 2), jit.kredit || 0)
                    .query('INSERT INTO JurnalItems (JurnalId, Akun, Debit, Kredit) VALUES (@jid, @akun, @deb, @kre)');
            }
        }

        await transaction.commit();
        res.json({ success: true, id: jId });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).send(err.message);
    }
});

// GET financial highlights (dashboard data)
router.get('/highlights', async (req, res) => {
    try {
        const pool = await sql.connect();
        const omzet = await pool.request().query("SELECT ISNULL(SUM(Total), 0) as tot FROM Penjualan WHERE CAST(Tanggal AS DATE) = CAST(GETDATE() AS DATE)");
        const piutang = await pool.request().query("SELECT ISNULL(SUM(Total - Bayar), 0) as tot FROM Penjualan WHERE Bayar < Total");
        const lowStock = await pool.request().query("SELECT COUNT(*) as cnt FROM Barang WHERE Stok <= StokMin");
        const hutang = await pool.request().query("SELECT ISNULL(SUM(Sisa), 0) as tot FROM HutangSupplier WHERE Lunas = 0");

        res.json(toCamel({
            omzet: omzet.recordset[0].tot,
            piutang: piutang.recordset[0].tot,
            lowStock: lowStock.recordset[0].cnt,
            hutang: hutang.recordset[0].tot
        }));
    } catch (err) { res.status(500).send(err.message); }
});

// GET laba rugi stats
router.get('/labarugi', async (req, res) => {
    try {
        const pool = await sql.connect();
        const sales = await pool.request().query("SELECT ISNULL(SUM(Total), 0) as rev, ISNULL(SUM(Diskon), 0) as disc FROM Penjualan");
        const hpp = await pool.request().query("SELECT ISNULL(SUM(Qty * HargaBeli), 0) as cost FROM PenjualanItems");
        const expenses = await pool.request().query("SELECT ISNULL(SUM(Jumlah), 0) as tot FROM CashFlow WHERE Tipe = 'out'");

        const rev = sales.recordset[0].rev;
        const disc = sales.recordset[0].disc;
        const cost = hpp.recordset[0].cost;
        const exp = expenses.recordset[0].tot;

        res.json(toCamel({
            revenue: rev,
            discounts: disc,
            netRevenue: rev - disc,
            cog: cost,
            grossProfit: (rev - disc) - cost,
            expenses: exp,
            netProfit: (rev - disc) - cost - exp
        }));
    } catch (err) { res.status(500).send(err.message); }
});

// GET neraca (Balance Sheet)
router.get('/neraca', async (req, res) => {
    try {
        const pool = await sql.connect();

        // Assets
        const kasRes = await pool.request().query("SELECT ISNULL(SUM(Debit) - SUM(Kredit), 0) as bal FROM JurnalItems WHERE Akun = 'kas'");
        const persediaanRes = await pool.request().query("SELECT ISNULL(SUM(Stok * HargaBeli), 0) as bal FROM Barang");
        const piutangRes = await pool.request().query("SELECT ISNULL(SUM(Piutang), 0) as bal FROM Customers");

        // Liabilities
        const hutangRes = await pool.request().query("SELECT ISNULL(SUM(Sisa), 0) as bal FROM HutangSupplier WHERE Lunas = 0");

        const kas = kasRes.recordset[0].bal;
        const persediaan = persediaanRes.recordset[0].bal;
        const piutang = piutangRes.recordset[0].bal;
        const hutang = hutangRes.recordset[0].bal;

        const totalAssets = kas + persediaan + piutang;
        const totalLiabilities = hutang;
        const equity = totalAssets - totalLiabilities;

        res.json(toCamel({
            kas,
            persediaan,
            piutang,
            totalAssets,
            hutang,
            totalLiabilities,
            equity
        }));
    } catch (err) { res.status(500).send(err.message); }
});

module.exports = router;

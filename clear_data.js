require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'TokoNadyn',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
    }
};

async function cleanDB() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('🧹 Membersihkan database (kecuali User Account)...');

        // Delete data in order of foreign key dependencies
        await pool.request().query(`
            DELETE FROM JurnalItems;
            DELETE FROM Jurnal;
            DELETE FROM CicilanHutang;
            DELETE FROM HutangSupplier;
            DELETE FROM PembelianItems;
            DELETE FROM Pembelian;
            DELETE FROM PenjualanItems;
            DELETE FROM Penjualan;
            DELETE FROM StockMovements;
            DELETE FROM Barang;
            DELETE FROM Suppliers;
            DELETE FROM Customers;
            DELETE FROM CashFlow;
            
            -- Reset Identity (Auto Increment) Columns
            DBCC CHECKIDENT ('JurnalItems', RESEED, 0);
            DBCC CHECKIDENT ('Jurnal', RESEED, 0);
            DBCC CHECKIDENT ('CicilanHutang', RESEED, 0);
            DBCC CHECKIDENT ('HutangSupplier', RESEED, 0);
            DBCC CHECKIDENT ('PembelianItems', RESEED, 0);
            DBCC CHECKIDENT ('Pembelian', RESEED, 0);
            DBCC CHECKIDENT ('PenjualanItems', RESEED, 0);
            DBCC CHECKIDENT ('Penjualan', RESEED, 0);
            DBCC CHECKIDENT ('StockMovements', RESEED, 0);
            DBCC CHECKIDENT ('Barang', RESEED, 0);
            DBCC CHECKIDENT ('Suppliers', RESEED, 0);
            DBCC CHECKIDENT ('Customers', RESEED, 0);
            DBCC CHECKIDENT ('CashFlow', RESEED, 0);
        `);
        console.log('✅ Semua data dummy berhasil dihapus! Aplikasi sekarang kembali kosong.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal membersihkan database:', err.message);
        process.exit(1);
    }
}
cleanDB();

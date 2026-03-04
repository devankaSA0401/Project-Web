require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 3000;

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

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('.')); // Serve static files from current directory

// Establish connection pool
let pool;
async function connectDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server');
    } catch (err) {
        console.error('❌ Database Connection Failed!', err.message);
        console.log('💡 Note: Ensure SQL Server is running and TCP/IP is enabled on port 1433 in SQL Config Manager.');
    }
}

// Import Modular Routes
const barangRoutes = require('./routes/barang');
const penjualanRoutes = require('./routes/penjualan');
const suppliersRoutes = require('./routes/suppliers');
const customersRoutes = require('./routes/customers');
const usersRoutes = require('./routes/users');
const cashflowRoutes = require('./routes/cashflow');
const hutangRoutes = require('./routes/hutang');
const pembelianRoutes = require('./routes/pembelian');
const stokRoutes = require('./routes/stok');
const akuntansiRoutes = require('./routes/akuntansi');

// Hook Routes
app.use('/api/barang', barangRoutes);
app.use('/api/penjualan', penjualanRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cashflow', cashflowRoutes);
app.use('/api/hutangSupplier', hutangRoutes);
app.use('/api/pembelian', pembelianRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/jurnal', akuntansiRoutes);
app.use('/api/akuntansi', akuntansiRoutes);



async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`🚀 Toko NADYN Backend running at http://tokonadin.com`);
        });
    } catch (err) {
        console.error('❌ FATAL: Server failed to start!', err);
    }
}
startServer().catch(err => console.error('Unhandled Rejection at startServer:', err));

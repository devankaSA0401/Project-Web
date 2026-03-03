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

async function test() {
    console.log('Testing connection to:', dbConfig.server);
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✅ Connection Successful!');
        const res = await pool.request().query('SELECT COUNT(*) as cnt FROM Users');
        console.log('✅ Users record count:', res.recordset[0].cnt);
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    }
}
test();

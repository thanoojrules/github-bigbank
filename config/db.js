require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    user: "thanooj",
    host: "bigbankdbserver.postgres.database.azure.com",
    database: "bigbankdb",  // ✅ Check that this is the correct database
    password: "T#@nOOj@0899",
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// ✅ Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error("❌ Database connection error:", err.stack);
    } else {
        console.log("✅ Connected to Azure PostgreSQL");
        release();
    }
});

module.exports = pool;

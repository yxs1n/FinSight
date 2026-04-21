const mysql = require('mysql2');
require('dotenv').config();

// Aiven and most managed MySQL providers require SSL in production
const sslConfig = process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;

// Create a connection pool to the database
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the pool for use in other modules
module.exports = pool.promise();
const express = require('express');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Sample route to test database connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT "Connection Succesful" as status');
        res.json(rows);
    } catch (err) {
        res.status(500).send('Database connection failed: ' + err.message);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
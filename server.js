const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();

// ---------Middleware------------

// Parse JSON data from incoming requests
app.use(express.json());

// Serve static files from the public folder
app.use(express.static('public'));

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'finsight-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: false
    }
}));

// -----------Routes--------------

// Authentication Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Expense Routes
const expenseRoutes = require('./routes/expenses');
app.use('/expenses', expenseRoutes);

// Check if the user is currently logged in
app.get('/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            loggedIn: true,
            user: { id: req.session.userId, first_name: req.session.firstName }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

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
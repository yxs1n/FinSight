const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();

// Detect if we're running in production (Render sets NODE_ENV=production automatically)
const isProduction = process.env.NODE_ENV === 'production';

// ---------Middleware------------

// Trust the first proxy in front of us (Render's load balancer)
// Required so Express knows requests are HTTPS, which enables secure cookies
if (isProduction) {
    app.set('trust proxy', 1);
}

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
        secure: isProduction,
        sameSite: isProduction ? 'lax' : undefined
    }
}));

// -----------Routes--------------

// Authentication Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Expense Routes
const expenseRoutes = require('./routes/expenses');
app.use('/expenses', expenseRoutes);

// Budget Routes
const budgetRoutes = require('./routes/budgets');
app.use('/budgets', budgetRoutes);

// Dashboard Routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

// Streak Routes
const streakRoutes = require('./routes/streak');
app.use('/streak', streakRoutes);

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

// Start the server only after verifying the database connection works
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Test the database connection with a simple query
        await db.query('SELECT 1');
        console.log('Database connection successful');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to database:', err.message);
        process.exit(1);
    }
}

startServer();
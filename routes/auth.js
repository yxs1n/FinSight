const express = require('express');
const router = express.Router();

/**
 * POST /auth/register
 * Create a new account
 */
router.post('/register', async (req, res) => {
    // Store the data the user sent from the register form
    const { first_name, email, password } = req.body;

    // Check if all fields are filled in
    if (!first_name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if a user with entered email already exists
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new user into database
        const [result] = await db.query(
            'INSERT INTO users (first_name, email, password_hash) VALUES (?, ?, ?)',
            [first_name, email, password_hash]
        );

        // Automatically log registered user in
        req.session.userId = result.insertId;
        req.session.firstName = first_name;

        // Success message
        res.status(201).json({
            message: 'Account created successfully',
            user: { id: result.insertId, first_name, email }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

/**
 * POST /auth/login
 * Log into an existing account
 */
router.post('/login', async (req, res) => {
    // Get the data user sent from login form
    const {email, password} = req.body;

    // Check all fields are filled in
    if (!emaill || !password) {
        return res.status(400).json({error: 'Email and password are required'});
    }

    try {
        // Look up the user by their email
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        // If no user exists with that email, send error
        if (users.length === 0) {
            return res.status(401).json({error: 'User does not exist. Please try again'});
        }

        const user = users[0];

        // Compare typed password to hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({error: 'Invalid email or password'});
        }

        // Password correct -> create a session
        req.session.userId = user.id;
        req.session.firstName = user.first_name;

        // Send success message
        res.json({
            message: 'Logged in successfully',
            user: {id: user.id, first_name: user.first_name, email: user.email}
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({error: 'Something went wrong. Please try again.'});
    }
});

/**
 * POST /auth/logout
 * Log out of current session
 */
router.post('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({error: 'Could not log out. Please try again.'});
        }

        // Clear session cookie from browser
        res.clearCookie('connect.sid');

        // Send back success
        res.json({message: 'Logged out successfully'});
    });
});

module.exports = router;
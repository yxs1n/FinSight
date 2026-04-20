const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

/**
 * POST /expenses
 * Add a new expense
 */
router.post('/', isAuthenticated, async (req, res) => {
    // Get the data sent from the form
    const {category_id, amount, description, expense_date} = req.body;

    // Check if all required fields are filled in
    if (!category_id || !amount || !expense_date) {
        return res.status(400).json({error: 'Category, amount, and date are required'});
    }

    // Validate amount is a positive number
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({error: 'Amount must be a positive number'});
    }

    try {
        // Insert the expense into the database
        // req.session.userId links this expense to the logged in user
        const [result] = await db.query(
            'INSERT INTO expenses (user_id, category_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, category_id, amount, description || null, expense_date]
        );

        // Return the newly created expense
        res.status(201).json({
            message: 'Expense added successfully',
            expense: {
                id: result.insertId,
                category_id,
                amount,
                description,
                expense_date
            }
        });
    } catch (err) {
        console.error('Error adding expense:', err);
        res.status(500).json({error: 'Something went wrong. Please try again.'});
    }
});

/**
 * GET /expenses
 * Get all expenses for the logged in user
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Fetch all expenses for this user, joining with categories to get the category name
        // ORDER by expense_date DESC to show most recent expenses first
        const [expenses] = await db.query(
            'SELECT expenses.id, expenses.amount, expenses.description, expenses.expense_date, expenses.category_id, categories.name AS category_name ' +
            'FROM expenses ' +
            'JOIN categories ON expenses.category_id = categories.id ' +
            'WHERE expenses.user_id = ? ' +
            'ORDER BY expenses.expense_date DESC',
            [req.session.userId]
        );

        res.json({expenses});
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({error: 'Could not fetch expenses. Please try again.'});
    }
});

/**
 * GET /expenses/categories
 * Get all available categories (for dropdowns, etc.) 
 */
router.get('/categories', isAuthenticated, async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT id, name, icon_name FROM categories ORDER BY name ASC'
        );

        res.json({categories});
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({error: 'Could not fetch categories. Please try again.'});
    }
});

/**
 *  PUT /expenses/:id
 *  Update an existing expense
 */
router.put('/:id', isAuthenticated, async (req, res) => {
    // Get the expense ID from the URL
    const expenseId = req.params.id;
    // Get updated values from the request body
    const { category_id, amount, description, expense_date} = req.body;

    // Validate input
    if (!category_id || !amount || !expense_date) {
        return res.status(400).json({error: 'Category, amount, and date are required'});
    }

    if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({error: 'Amount must be a positive number'});
    }

    try {
        // Update the expense, but only if it belongs to the logged in user
        const [result] = await db.query(
            'UPDATE expenses SET category_id = ?, amount = ?, description = ?, expense_date = ? WHERE id = ? AND user_id = ?',
            [category_id, amount, description || null, expense_date, expenseId, req.session.userId]
        );

        // affectedRows tells us if the update actually changed anything
        // If 0, either the expense doesn't exist or it belongs to a different user
        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Expense not found'});
        }

        res.json({ message: 'Expense updated successfully' });
    } catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).json({error: 'Could not update expense. Please try again.'});
    }
});

/**
 * DELETE /expenses/:id
 * Delete an existing expense
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    // Get the expense ID from the URL
    const expenseId = req.params.id;

    try {
        // Delete the expense, but only if it belongs to the logged in user
        // The "AND user_id = ?" is critical - it stops a user from deleting
        // another user's expense by guessing the ID
        const [result] = await db.query(
            'DELETE FROM expenses WHERE id = ? AND user_id = ?',
            [expenseId, req.session.userId]
        );

        // If no rows were affected, the expense either doesn't exist
        // or belongs to a different user - either way, 404
        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Expense not found'});
        }

        res.json({message: 'Expense deleted successfully'});
    } catch (err) {
        console.error('Error deleting expense:', err);
        res.status(500).json({error: 'Could not delete expense. Please try again.'});
    }
});

module.exports = router;
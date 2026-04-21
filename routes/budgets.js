const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

/**
 * Helper: Given a Date object or date string, return the first day of that month
 * as a YYYY-MM-DD string (e.g. "2026-04-01"). Ensures all budgets for a month
 * are stored with the same date, so queries can compare cleanly.
 */
function firstOfMonth(dateInput) {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    // Months are 0-indexed in JS, pad to 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}

/**
 * POST /budgets
 * Create a new budget for a category and month
 * If a budget already exists for that category + month, update it instead
 */
router.post('/', isAuthenticated, async (req, res) => {
    const { category_id, amount_limit, month_year } = req.body;

    // Validate required fields
    if (!category_id || !amount_limit || !month_year) {
        return res.status(400).json({error: 'Category, amount, and month are required'});
    }

    // Validate amount is a positive number
    if (isNaN(amount_limit) || Number(amount_limit) <= 0) {
        return res.status(400).json({error: 'Amount must be a positive number'});
    }

    // Normalise to the 1st of the given month
    const normalisedMonth = firstOfMonth(month_year);

    try {
        // Check if a budget already exists for this user + category + month
        const [existing] = await db.query(
            'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month_year = ?',
            [req.session.userId, category_id, normalisedMonth]
        );

        if (existing.length > 0) {
            // Budget exists - update it instead of creating a duplicate
            await db.query(
                'UPDATE budgets SET amount_limit = ? WHERE id = ?',
                [amount_limit, existing[0].id]
            );
            return res.json({
                message: 'Budget updated successfully',
                budget: { id: existing[0].id, category_id, amount_limit, month_year: normalisedMonth }
            });
        }

        // No existing budget - create a new one
        const [result] = await db.query(
            'INSERT INTO budgets (user_id, category_id, amount_limit, month_year) VALUES (?, ?, ?, ?)',
            [req.session.userId, category_id, amount_limit, normalisedMonth]
        );

        res.status(201).json({
            message: 'Budget created successfully',
            budget: {
                id: result.insertId,
                category_id,
                amount_limit,
                month_year: normalisedMonth
            }
        });
    } catch (err) {
        console.error('Error saving budget:', err);
        res.status(500).json({error: 'Something went wrong. Please try again.'});
    }
});

/**
 * GET /budgets
 * Get all budgets for the logged in user
 * Optional query param: ?month=YYYY-MM-DD to filter to a specific month
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let sql =
            'SELECT budgets.id, budgets.amount_limit, budgets.month_year, budgets.category_id, categories.name AS category_name ' +
            'FROM budgets ' +
            'JOIN categories ON budgets.category_id = categories.id ' +
            'WHERE budgets.user_id = ?';
        const params = [req.session.userId];

        // If a month filter is provided, normalise and filter by it
        if (req.query.month) {
            sql += ' AND budgets.month_year = ?';
            params.push(firstOfMonth(req.query.month));
        }

        sql += ' ORDER BY budgets.month_year DESC, categories.name ASC';

        const [budgets] = await db.query(sql, params);
        res.json({budgets});
    } catch (err) {
        console.error('Error fetching budgets:', err);
        res.status(500).json({error: 'Could not fetch budgets. Please try again.'});
    }
});

/**
 * DELETE /budgets/:id
 * Delete a budget (only if it belongs to the logged in user)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    const budgetId = req.params.id;

    try {
        const [result] = await db.query(
            'DELETE FROM budgets WHERE id = ? AND user_id = ?',
            [budgetId, req.session.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Budget not found'});
        }

        res.json({message: 'Budget deleted successfully'});
    } catch (err) {
        console.error('Error deleting budget:', err);
        res.status(500).json({error: 'Could not delete budget. Please try again.'});
    }
});

module.exports = router;
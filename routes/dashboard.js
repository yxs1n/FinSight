const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

/**
 * Helper: Get the first day of the current month as a YYYY-MM-DD string.
 * Used to filter budgets and expenses to "this month"
 */
function firstOfCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}

/**
 * GET /dashboard
 * Returns aggregated data for the current month:
 * - total_spent: sum of all expenses this month
 * - spending_by_category: array of {category_id, category_name, total} for this month
 * - budgets: array of budgets for this month, each with spent amount joined in
 */
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const monthStart = firstOfCurrentMonth();

    try {
        // 1. Total spent this month
        // COALESCE returns 0 if the user has no expenses (otherwise SUM returns NULL)
        const [totalRows] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) AS total_spent ' +
            'FROM expenses ' +
            'WHERE user_id = ? AND expense_date >= ? AND expense_date < DATE_ADD(?, INTERVAL 1 MONTH)',
            [userId, monthStart, monthStart]
        );
        const totalSpent = Number(totalRows[0].total_spent);

        // 2. Spending by category this month
        // LEFT JOIN so we still get the category name even if spending is 0 (not needed here, but good habit)
        const [categoryRows] = await db.query(
            'SELECT categories.id AS category_id, categories.name AS category_name, ' +
            'COALESCE(SUM(expenses.amount), 0) AS total ' +
            'FROM expenses ' +
            'JOIN categories ON expenses.category_id = categories.id ' +
            'WHERE expenses.user_id = ? ' +
            'AND expenses.expense_date >= ? ' +
            'AND expenses.expense_date < DATE_ADD(?, INTERVAL 1 MONTH) ' +
            'GROUP BY categories.id, categories.name ' +
            'ORDER BY total DESC',
            [userId, monthStart, monthStart]
        );

        // 3. Budgets for this month, with spent amount calculated per category
        // Subquery sums the user's expenses for each budget's category in the same month
        const [budgetRows] = await db.query(
            'SELECT budgets.id, budgets.amount_limit, budgets.category_id, ' +
            'categories.name AS category_name, ' +
            'COALESCE(( ' +
            '  SELECT SUM(amount) FROM expenses ' +
            '  WHERE expenses.user_id = budgets.user_id ' +
            '  AND expenses.category_id = budgets.category_id ' +
            '  AND expenses.expense_date >= budgets.month_year ' +
            '  AND expenses.expense_date < DATE_ADD(budgets.month_year, INTERVAL 1 MONTH) ' +
            '), 0) AS spent ' +
            'FROM budgets ' +
            'JOIN categories ON budgets.category_id = categories.id ' +
            'WHERE budgets.user_id = ? AND budgets.month_year = ? ' +
            'ORDER BY categories.name ASC',
            [userId, monthStart]
        );

        res.json({
            total_spent: totalSpent,
            spending_by_category: categoryRows.map(row => ({
                category_id: row.category_id,
                category_name: row.category_name,
                total: Number(row.total)
            })),
            budgets: budgetRows.map(row => ({
                id: row.id,
                category_id: row.category_id,
                category_name: row.category_name,
                amount_limit: Number(row.amount_limit),
                spent: Number(row.spent)
            }))
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({error: 'Could not load dashboard. Please try again.'});
    }
});

module.exports = router;
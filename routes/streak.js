const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

/**
 * Helper: Format a Date object as YYYY-MM-DD (no time component)
 * Matches the format MySQL returns for DATE columns
 */
function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Helper: Return a new Date representing the day before the given one
 */
function previousDay(date) {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    return previous;
}

/**
 * GET /streak
 * Returns the user's current expense-logging streak (consecutive days)
 * Today counts whether or not the user has logged yet, so users aren't
 * punished for checking the dashboard before logging their daily expense.
 */
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;

    try {
        // Fetch all distinct dates on which the user has logged expenses
        // DISTINCT because a user might log multiple expenses on the same day
        const [rows] = await db.query(
            'SELECT DISTINCT DATE(created_at) AS log_date FROM expenses WHERE user_id = ? ORDER BY log_date DESC',
            [userId]
        );

        // Edge case: user has never logged an expense
        if (rows.length === 0) {
            return res.json({ streak: 0 });
        }

        // Convert MySQL dates to YYYY-MM-DD strings for comparison
        // Use a Set for O(1) lookups when we check each day
        const loggedDates = new Set(
            rows.map(row => toDateString(new Date(row.log_date)))
        );

        // Start the walk from today
        // If today has no log, we silently allow it and start checking from yesterday
        // This means logging in at 8am doesn't show a "0-day streak" just because
        // the user hasn't logged today's first expense yet
        let cursor = new Date();
        let streak = 0;

        // If today isn't logged, move the cursor to yesterday to start counting
        if (!loggedDates.has(toDateString(cursor))) {
            cursor = previousDay(cursor);
        }

        // Walk backwards: as long as the cursor day is in the logged set, extend
        // the streak and move to the previous day
        while (loggedDates.has(toDateString(cursor))) {
            streak++;
            cursor = previousDay(cursor);
        }

        res.json({ streak });
    } catch (err) {
        console.error('Error calculating streak:', err);
        res.status(500).json({ error: 'Could not calculate streak.' });
    }
});

module.exports = router;
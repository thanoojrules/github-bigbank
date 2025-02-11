const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Get upcoming reminders for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const reminders = await pool.query(
            `SELECT id, description, amount, due_date, status 
             FROM transactions 
             WHERE user_id = $1 AND due_date >= CURRENT_DATE 
             ORDER BY due_date ASC`, 
            [req.user.id]
        );

        res.json(reminders.rows);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ✅ Mark a reminder as paid
router.post('/mark-paid/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE transactions SET status = 'paid' WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        res.json({ message: 'Reminder marked as paid' });
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
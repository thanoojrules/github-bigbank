const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Fetch user transactions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await pool.query(
            `SELECT id, user_id, recipient_id, type, amount, created_at, status 
             FROM transactions 
             WHERE user_id = $1 OR recipient_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json(transactions.rows);
    } catch (error) {
        console.error("Transaction Fetch Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
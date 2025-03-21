const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Fetch Transaction History API
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`📌 Fetching transactions for User ID: ${userId}`);

        const transactions = await pool.query(
            `SELECT t.id, t.transaction_type, t.amount, t.status, t.created_at,
                    sender.email AS sender_email,
                    recipient.email AS recipient_email
             FROM transactions t
             LEFT JOIN users sender ON t.user_id = sender.id
             LEFT JOIN users recipient ON t.recipient_id = recipient.id
             WHERE t.user_id = $1 OR t.recipient_id = $1
             ORDER BY t.created_at DESC`,
            [userId]
        );

        console.log(`✅ Transactions Fetched: ${transactions.rows.length} records`);
        res.json(transactions.rows);
    } catch (error) {
        console.error("❌ Transaction Fetch Error:", error);
        res.status(500).json({ error: "Internal server error while fetching transactions" });
    }
});

module.exports = router;

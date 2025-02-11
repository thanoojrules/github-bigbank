const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Fetch User Profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT id, email, balance, savings 
             FROM users WHERE id = $1`, 
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "❌ User not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Profile Fetch Error:", error);
        res.status(500).json({ error: "Server error while fetching profile" });
    }
});

// ✅ Update Email & Password (Stored as Plain Text)
router.put("/update", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, password } = req.body;

        if (!email && !password) {
            return res.status(400).json({ error: "⚠️ Provide email or password to update" });
        }

        let updateQuery = "UPDATE users SET ";
        let queryParams = [];
        let paramIndex = 1;

        if (email) {
            updateQuery += `email = $${paramIndex}, `;
            queryParams.push(email);
            paramIndex++;
        }

        if (password) {
            updateQuery += `password = $${paramIndex}, `;
            queryParams.push(password);
            paramIndex++;
        }

        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = $${paramIndex} RETURNING id, email`;
        queryParams.push(userId);

        const result = await pool.query(updateQuery, queryParams);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "❌ User not found" });
        }

        res.json({ message: "✅ Profile updated successfully", updatedUser: result.rows[0] });
    } catch (error) {
        console.error("❌ Profile Update Error:", error);
        res.status(500).json({ error: "Server error while updating profile" });
    }
});

// ✅ Get Transaction History
router.get("/transactions", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT id, type, amount, created_at, recipient_id 
             FROM transactions WHERE user_id = $1 OR recipient_id = $1
             ORDER BY created_at DESC LIMIT 10`, 
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Transaction Fetch Error:", error);
        res.status(500).json({ error: "Error fetching transactions" });
    }
});

module.exports = router;
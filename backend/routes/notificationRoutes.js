const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Get Notifications
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT message, created_at FROM notifications 
             WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, 
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Notification Fetch Error:", error);
        res.status(500).json({ error: "Error fetching notifications" });
    }
});

module.exports = router;
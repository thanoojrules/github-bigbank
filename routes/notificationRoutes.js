const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Fetch Notifications API (User)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await pool.query(
            "SELECT id, message, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        console.log(`✅ Notifications Fetched: ${notifications.rows.length} records`);
        res.json(notifications.rows);
    } catch (error) {
        console.error("❌ Notification Fetch Error:", error);
        res.status(500).json({ error: "Internal server error while fetching notifications" });
    }
});

// ✅ Add Notification API (For Loan Events)
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ error: "❌ User ID and message are required!" });
        }

        await pool.query(
            "INSERT INTO notifications (user_id, message, created_at) VALUES ($1, $2, NOW())",
            [userId, message]
        );

        console.log(`✅ Notification Added for User ID ${userId}: "${message}"`);
        res.json({ message: "✅ Notification added successfully!" });
    } catch (error) {
        console.error("❌ Notification Add Error:", error);
        res.status(500).json({ error: "Internal server error while adding notification" });
    }
});

// ✅ Delete Notification API
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "❌ Notification not found or unauthorized!" });
        }

        console.log(`✅ Notification ID ${id} deleted successfully.`);
        res.json({ message: "✅ Notification deleted successfully!" });
    } catch (error) {
        console.error("❌ Notification Delete Error:", error);
        res.status(500).json({ error: "Internal server error while deleting notification" });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Fetch User Profile API
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`📌 Fetching Profile for User ID: ${userId}`);

        const result = await pool.query("SELECT email, balance, savings FROM users WHERE id = $1", [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "❌ User not found!" });
        }

        console.log("✅ Profile Fetched Successfully:", result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Profile Fetch Error:", error);
        res.status(500).json({ error: "❌ Server error while fetching profile." });
    }
});

// ✅ Update Profile API (Fixed)
router.put("/update", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, password } = req.body;

        if (!email && !password) {
            return res.status(400).json({ error: "❌ Please provide an email or password to update." });
        }

        console.log(`📌 Profile Update Request: UserID=${userId}, NewEmail=${email}, NewPassword=${password ? "Provided" : "Not Provided"}`);

        let query = "UPDATE users SET ";
        let values = [];
        let count = 1;

        if (email) {
            query += `email = $${count}`;
            values.push(email);
            count++;
        }
        if (password) {
            if (values.length > 0) query += ", ";
            query += `password = $${count}`;
            values.push(password);
            count++;
        }

        query += ` WHERE id = $${count} RETURNING email`;
        values.push(userId);

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "❌ User not found!" });
        }

        console.log("✅ Profile Updated Successfully:", result.rows[0]);
        res.json({ message: "✅ Profile updated successfully!", email: result.rows[0].email });
    } catch (error) {
        console.error("❌ Profile Update Error:", error);
        res.status(500).json({ error: "❌ Server error while updating profile." });
    }
});

module.exports = router;

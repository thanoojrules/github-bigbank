// ✅ routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const ADMIN_EMAIL = "admin@bigbank.com";
const ADMIN_PASSWORD = "Admin@123";

// ✅ Admin Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.status(200).send("✅ Admin login successful.");
    } else {
        res.status(401).send("❌ Invalid admin credentials.");
    }
});

// ✅ Get All Users
router.get("/users", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    try {
        const users = await pool.query(
            `SELECT id, email, balance, restricted, transfer_limit, daily_transaction_limit 
             FROM users`
        );
        res.json(users.rows);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).send("Failed to fetch users.");
    }
});


// ✅ Get User Transactions (For Admin)
router.get("/users/:email/transactions", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    const { email } = req.params;

    try {
        const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(404).send("❌ User not found.");
        }

        const userId = user.rows[0].id;
        const transactions = await pool.query(
            `SELECT t.id, t.amount, t.sender_email, t.recipient_email, t.created_at
             FROM transactions t
             WHERE t.sender_email = $1 OR t.recipient_email = $1
             ORDER BY t.created_at DESC`,
            [email]
        );

        res.json(transactions.rows);
    } catch (error) {
        console.error("❌ Error fetching user transactions:", error);
        res.status(500).send("Failed to fetch user transactions.");
    }
});

// ✅ Delete User
router.delete("/users/:email", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    const { email } = req.params;
    try {
        await pool.query("DELETE FROM users WHERE email = $1", [email]);
        res.send(`✅ User ${email} deleted successfully.`);
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).send("Failed to delete user.");
    }
});

// ✅ Restrict or Unrestrict User
router.post("/users/:email/:action", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    const { email, action } = req.params;
    const restricted = action === "restrict";

    try {
        // Update restriction and reset limits if unrestricted
        if (restricted) {
            await pool.query("UPDATE users SET restricted = true WHERE email = $1", [email]);
        } else {
            await pool.query(
                "UPDATE users SET restricted = false, transfer_limit = NULL, daily_transaction_limit = NULL WHERE email = $1",
                [email]
            );
        }
        res.send(`✅ User ${email} ${restricted ? "restricted" : "unrestricted"} successfully.`);
    } catch (error) {
        console.error("❌ Error updating user restriction:", error);
        res.status(500).send("Failed to update restriction.");
    }
});

// ✅ Set Transfer Amount Limit and Restrict User
router.post("/users/:email/limit", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    const { email } = req.params;
    const { limit } = req.body;

    if (!limit || isNaN(limit) || limit <= 0) {
        return res.status(400).send("❌ Invalid transfer limit value.");
    }

    try {
        // Set transfer limit and restrict the user
        await pool.query(
            "UPDATE users SET transfer_limit = $1, restricted = true WHERE email = $2",
            [limit, email]
        );
        res.send(`✅ Transfer limit for ${email} set to $${limit} and user restricted.`);
    } catch (error) {
        console.error("❌ Error setting transfer limit:", error);
        res.status(500).send("Failed to set transfer limit.");
    }
});

// ✅ Set Daily Transaction Limit
router.post("/users/:email/daily-limit", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    const { email } = req.params;
    const { dailyLimit } = req.body;

    if (!dailyLimit || isNaN(dailyLimit) || dailyLimit <= 0) {
        return res.status(400).send("❌ Invalid daily transaction limit.");
    }

    try {
        // Set daily limit and restrict user
        await pool.query(
            "UPDATE users SET daily_transaction_limit = $1, restricted = true WHERE email = $2",
            [dailyLimit, email]
        );
        res.send(`✅ Daily transaction limit for ${email} set to ${dailyLimit} transactions per day.`);
    } catch (error) {
        console.error("❌ Error setting daily transaction limit:", error);
        res.status(500).send("Failed to set daily transaction limit.");
    }
});

// ✅ Get User Info by Email (For Dashboard Update)
router.get("/users/:email", async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("❌ Unauthorized access.");
    const { email } = req.params;

    try {
        const user = await pool.query(
            `SELECT email, balance, restricted, transfer_limit, daily_transaction_limit 
             FROM users WHERE email = $1`,
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(404).send("❌ User not found.");
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching user info:", error);
        res.status(500).send("Failed to fetch user info.");
    }
});

// ✅ Admin Logout
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Error during logout:", err);
            res.status(500).send("Failed to logout.");
        } else {
            res.send("✅ Admin logged out successfully.");
        }
    });
});

module.exports = router;

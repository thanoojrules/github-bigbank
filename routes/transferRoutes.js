// ✅ routes/transferRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Transfer Money API
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { recipientEmail, amount } = req.body;
        const senderId = req.user.id;
        const amountNum = parseFloat(amount);

        if (!recipientEmail || isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: "❌ Invalid recipient email or amount!" });
        }

        console.log(`📌 Transfer Request: SenderID=${senderId}, Recipient=${recipientEmail}, Amount=${amountNum}`);

        // ✅ Check Recipient
        const recipientQuery = await pool.query("SELECT id, email FROM users WHERE email = $1", [recipientEmail]);
        if (recipientQuery.rows.length === 0) {
            console.log(`❌ Recipient Not Found: ${recipientEmail}`);
            return res.status(400).json({ error: "❌ Recipient not found!" });
        }
        const recipientId = recipientQuery.rows[0].id;
        const recipientEmailDb = recipientQuery.rows[0].email;

        if (recipientId === senderId) {
            console.log("❌ Self-transfer Attempt Blocked");
            return res.status(400).json({ error: "❌ You cannot send money to yourself!" });
        }

        // ✅ Check Sender Balance and Limits
        const senderQuery = await pool.query(
            "SELECT email, balance, transfer_limit, daily_transaction_limit, restricted FROM users WHERE id = $1",
            [senderId]
        );

        if (senderQuery.rows.length === 0) {
            console.log("❌ Sender Not Found");
            return res.status(400).json({ error: "❌ Sender not found!" });
        }

        const { email: senderEmail, balance, transfer_limit, daily_transaction_limit, restricted } = senderQuery.rows[0];

        // 🚫 Check Restriction
        if (restricted) {
            return res.status(403).json({ error: "🚫 Your account is restricted from making transactions!" });
        }

        // 💰 Check Transfer Limit
        if (transfer_limit && amountNum > transfer_limit) {
            return res.status(403).json({ error: `⚠️ Transfer limit exceeded. Max allowed: $${transfer_limit}.` });
        }

        // 🔄 Check Daily Transaction Count
        const today = new Date().toISOString().split("T")[0];
        const dailyCount = await pool.query(
            `SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND DATE(created_at) = $2`,
            [senderId, today]
        );

        if (daily_transaction_limit && parseInt(dailyCount.rows[0].count) >= daily_transaction_limit) {
            return res.status(403).json({ error: `⚠️ Daily transaction limit reached (${daily_transaction_limit} per day).` });
        }

        // 💵 Check Balance
        if (balance < amountNum) {
            console.log("❌ Insufficient Balance");
            return res.status(400).json({ error: "❌ Insufficient balance!" });
        }

        // ✅ Process Transfer
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // ✅ Deduct from Sender
            await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amountNum, senderId]);

            // ✅ Add to Recipient
            await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amountNum, recipientId]);

            // ✅ Record Transaction with Emails
            const transaction = await client.query(
                `INSERT INTO transactions (user_id, sender_email, recipient_email, amount, created_at) 
                 VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
                [senderId, senderEmail, recipientEmailDb, amountNum]
            );

            // ✅ Insert Notifications
            await client.query(
                `INSERT INTO notifications (user_id, message, created_at) VALUES 
                 ($1, $2, NOW()), 
                 ($3, $4, NOW())`,
                [
                    senderId, `You sent $${amountNum} to ${recipientEmailDb}.`,
                    recipientId, `You received $${amountNum} from ${senderEmail}.`
                ]
            );

            await client.query("COMMIT");

            console.log(`✅ Transfer Successful: Sender=${senderEmail}, Recipient=${recipientEmailDb}, Amount=$${amountNum}`);

            res.json({
                message: "✅ Transfer successful!",
                updatedBalance: balance - amountNum,
                transaction: transaction.rows[0]
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("❌ Transaction Error:", error);
            res.status(500).json({ error: "Internal server error during transaction!" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("❌ Transfer Error:", error);
        res.status(500).json({ error: "Internal server error!" });
    }
});

// ✅ Get User Transfer History
// ✅ Get User Transfer History (Fully Corrected)
router.get("/history/:userId", authMiddleware, async (req, res) => {
    const { userId } = req.params;

    try {
        const userEmailResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
        if (userEmail.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userEmail = userEmail.rows[0].email;

        const transactions = await pool.query(
            `SELECT id, transaction_type, amount, sender_email, recipient_email, created_at
             FROM transactions
             WHERE sender_email = $1 OR recipient_email = $1
             ORDER BY created_at DESC`,
            [userEmail]
        );

        res.json(transactions.rows);
    } catch (error) {
        console.error("❌ Error fetching transaction history:", error);
        res.status(500).json({ error: "Failed to fetch transaction history." });
    }
});

// ✅ Transfer from Savings to Account Balance
router.post("/savings-to-balance", authMiddleware, async (req, res) => { 
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        // Fetch user's balance & savings
        const user = await pool.query("SELECT balance, savings FROM users WHERE id = $1", [userId]);

        if (!user.rows.length || user.rows[0].savings < amount) {
            return res.status(400).json({ error: "Insufficient savings balance." });
        }

        // Update balances
        await pool.query("UPDATE users SET balance = balance + $1, savings = savings - $1 WHERE id = $2", [amount, userId]);

        res.json({ message: "Transfer successful", newBalance: user.rows[0].balance + amount, newSavings: user.rows[0].savings - amount });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Transfer from Account Balance to Savings
router.post("/balance-to-savings", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        // Get user's balance & savings
        const user = await pool.query("SELECT balance, savings FROM users WHERE id = $1", [userId]);

        if (!user.rows.length || user.rows[0].balance < amount) {
            return res.status(400).json({ error: "Insufficient account balance." });
        }

        // Update balances
        await pool.query("UPDATE users SET balance = balance - $1, savings = savings + $1 WHERE id = $2", [amount, userId]);

        res.json({ message: "Transfer successful", newBalance: user.rows[0].balance - amount, newSavings: user.rows[0].savings + amount });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



module.exports = router;



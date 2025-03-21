const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ User Loan Subscription API
router.post("/subscribe", authMiddleware, async (req, res) => {
    const { loanType, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!loanType || !paymentMethod) {
        return res.status(400).json({ error: "❌ Loan type and payment method are required!" });
    }

    try {
        // ✅ Insert Loan Subscription
        const result = await pool.query(
            `INSERT INTO loan_subscriptions (user_id, loan_type, payment_method, status, created_at)
             VALUES ($1, $2, $3, 'pending', NOW()) RETURNING *`,
            [userId, loanType, paymentMethod]
        );

        // ✅ Notify Admin about Loan Request
        await pool.query(
            `INSERT INTO notifications (user_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [1, `🚨 Loan Request: ${req.user.email} subscribed for a ${loanType} loan. Please review and approve.`]
        );

        res.json({ message: "✅ Loan subscription request submitted successfully!", subscription: result.rows[0] });
    } catch (error) {
        console.error("❌ Loan Subscription Error:", error);
        res.status(500).json({ error: "❌ Internal server error during loan subscription." });
    }
});

// ✅ Admin Approve Loan API
router.post("/admin/approve-loan/:subscriptionId", authMiddleware, async (req, res) => {
    const { subscriptionId } = req.params;
    const { loanAmount, interestRate, loanTerm } = req.body;

    if (!loanAmount || !interestRate || !loanTerm) {
        return res.status(400).json({ error: "❌ All fields are required for loan approval!" });
    }

    try {
        // ✅ Update Loan Details and Approve
        const result = await pool.query(
            `UPDATE loan_subscriptions
             SET loan_amount = $1, interest_rate = $2, loan_term = $3, status = 'approved'
             WHERE id = $4 RETURNING *`,
            [loanAmount, interestRate, loanTerm, subscriptionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "❌ Loan subscription not found!" });
        }

        const userId = result.rows[0].user_id;

        // ✅ Notify User for Confirmation
        await pool.query(
            `INSERT INTO notifications (user_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [userId, `✅ Your ${result.rows[0].loan_type} loan of $${loanAmount} has been approved. Please confirm subscription.`]
        );

        res.json({ message: "✅ Loan approved successfully!", loan: result.rows[0] });
    } catch (error) {
        console.error("❌ Loan Approval Error:", error);
        res.status(500).json({ error: "❌ Failed to approve loan." });
    }
});

// ✅ Confirm Loan Subscription (User Side)
router.post("/confirm", authMiddleware, async (req, res) => {
    const { subscriptionId } = req.body;
    const userId = req.user.id;

    if (!subscriptionId) {
        return res.status(400).json({ error: "❌ Subscription ID is required!" });
    }

    try {
        // ✅ Fetch Loan Details
        const loan = await pool.query(
            "SELECT * FROM loan_subscriptions WHERE id = $1 AND user_id = $2",
            [subscriptionId, userId]
        );

        if (loan.rows.length === 0) {
            return res.status(404).json({ error: "❌ Loan subscription not found!" });
        }

        const loanDetails = loan.rows[0];
        const monthlyEMI = (loanDetails.loan_amount * (1 + loanDetails.interest_rate / 100)) / loanDetails.loan_term;

        // ✅ Deduct First EMI for Debit Card Users
        if (loanDetails.payment_method === "debit") {
            const balance = await pool.query("SELECT balance FROM users WHERE id = $1", [userId]);
            if (balance.rows[0].balance < monthlyEMI) {
                return res.status(400).json({ error: "❌ Insufficient balance for first EMI!" });
            }
            await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [monthlyEMI, userId]);
        }

        // ✅ Confirm Loan and Activate
        await pool.query("UPDATE loan_subscriptions SET status = 'active' WHERE id = $1", [subscriptionId]);

        // ✅ Notify User about Activation
        await pool.query(
            `INSERT INTO notifications (user_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [userId, `🎉 Your loan has been confirmed and activated. Monthly EMI will be deducted automatically.`]
        );

        res.json({ message: "✅ Loan confirmed and activated!" });
    } catch (error) {
        console.error("❌ Loan Confirmation Error:", error);
        res.status(500).json({ error: "❌ Failed to confirm loan." });
    }
});

// ✅ Automatic EMI Deduction (Cron Job)
router.post("/deduct-emi", async (req, res) => {
    try {
        const activeLoans = await pool.query(
            "SELECT * FROM loan_subscriptions WHERE status = 'active'"
        );

        for (const loan of activeLoans.rows) {
            const monthlyEMI = (loan.loan_amount * (1 + loan.interest_rate / 100)) / loan.loan_term;

            // ✅ Check User Balance for EMI Deduction
            const userBalance = await pool.query("SELECT balance FROM users WHERE id = $1", [loan.user_id]);
            if (userBalance.rows[0].balance >= monthlyEMI) {
                // ✅ Deduct EMI from User Balance
                await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [monthlyEMI, loan.user_id]);
                console.log(`✅ EMI of $${monthlyEMI.toFixed(2)} deducted for user ID: ${loan.user_id}`);
            } else {
                // ❌ Low Balance Notification
                await pool.query(
                    `INSERT INTO notifications (user_id, message, created_at)
                     VALUES ($1, '⚠️ Low balance! Unable to deduct EMI. Please add funds.', NOW())`,
                    [loan.user_id]
                );
                console.warn(`⚠️ EMI deduction failed due to low balance for user ID: ${loan.user_id}`);
            }
        }

        res.json({ message: "✅ EMI deduction process completed!" });
    } catch (error) {
        console.error("❌ EMI Deduction Error:", error);
        res.status(500).json({ error: "❌ Failed to process EMI deduction." });
    }
});

// ✅ Fetch User Loans
router.get("/user-loans", authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const loans = await pool.query(
            `SELECT * FROM loan_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(loans.rows);
    } catch (error) {
        console.error("❌ Fetch Loans Error:", error);
        res.status(500).json({ error: "❌ Failed to fetch user loans." });
    }
});

// ✅ Fetch All Loan Subscriptions (Admin Side)
router.get("/admin/loan-subscriptions", authMiddleware, async (req, res) => {
    try {
        const loans = await pool.query(
            `SELECT ls.*, u.email AS user_email
             FROM loan_subscriptions ls
             JOIN users u ON ls.user_id = u.id
             WHERE ls.status = 'pending'
             ORDER BY ls.created_at DESC`
        );

        res.json(loans.rows);
    } catch (error) {
        console.error("❌ Loan Fetch Error (Admin):", error);
        res.status(500).json({ error: "❌ Failed to fetch loan subscriptions." });
    }
});

module.exports = router;


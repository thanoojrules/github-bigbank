const express = require("express");
const pool = require("../config/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// ✅ Generate Credit Card Statement in PDF
router.get("/statement/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // ✅ Fetch transactions for the last 30 days
        const result = await pool.query(`
            SELECT id, user_id, recipient_id, amount, created_at AS transaction_date, transaction_type 
            FROM transactions 
            WHERE user_id = $1 
            AND created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
        `, [userId]);

        const transactions = result.rows;

        if (transactions.length === 0) {
            return res.status(404).json({ error: "❌ No transactions found in the last 30 days." });
        }

        // ✅ Generate PDF Statement
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, "../statements", `statement_${userId}.pdf`);
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // ✅ PDF Header
        doc.fontSize(22).text("BigBank Credit Card Statement", { align: "center" });
        doc.moveDown();

        // ✅ User Info
        doc.fontSize(14).text(`📄 User ID: ${userId}`);
        doc.text(`🗓️ Statement Period: Last 30 Days`);
        doc.moveDown();

        // ✅ Table Header
        doc.fontSize(12).text("📜 Transaction Details:");
        doc.moveDown();
        doc.font("Helvetica-Bold");
        doc.text("ID | Date       | Recipient ID | Amount  | Type", { underline: true });
        doc.font("Helvetica");
        doc.moveDown();

        // ✅ List Transactions
        transactions.forEach((tx) => {
            const formattedDate = new Date(tx.transaction_date).toISOString().split("T")[0];
            doc.text(`${tx.id} | ${formattedDate} | ${tx.recipient_id} | $${tx.amount} | ${tx.transaction_type}`);
        });

        doc.end();

        // ✅ Ensure PDF is Ready Before Sending
        writeStream.on("finish", () => {
            console.log(`✅ PDF generated at: ${pdfPath}`);
            res.download(pdfPath, `Statement_${userId}.pdf`, (err) => {
                if (err) {
                    console.error("❌ Error sending PDF:", err);
                    res.status(500).json({ error: "❌ Failed to download statement." });
                } else {
                    console.log("✅ PDF sent successfully!");
                }
            });
        });

    } catch (error) {
        console.error("❌ Error generating statement:", error);
        res.status(500).json({ error: "❌ Failed to generate statement." });
    }
});

module.exports = router;

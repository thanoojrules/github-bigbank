const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query("SELECT id, email, password FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0 || result.rows[0].password !== password) {
            return res.status(401).json({ error: "❌ Invalid credentials" });
        }

        const user = result.rows[0];

        // Generate JWT Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "✅ Login successful!", token });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

// ✅ User Signup API (Ensures DB Commit)
router.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "❌ All fields are required!" });
        }

        // ✅ Check if Email Already Exists
        const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "❌ Email already exists!" });
        }

        // ✅ Insert User and Commit Transaction
        const newUser = await pool.query(
            "INSERT INTO users (email, password, balance, savings) VALUES ($1, $2, 2000, 1000) RETURNING id, email, balance, savings",
            [email, password]
        );

        // ✅ Log to Confirm Data Insertion
        console.log("🔥 User Added Successfully: ", newUser.rows[0]);

        // ✅ Generate JWT Token
        const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ message: "✅ Account created successfully!", token, user: newUser.rows[0] });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ error: `Server error during signup. Details: ${error.message}` });
    }
});
// ✅ User Login API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "❌ Email and password are required!" });
        }

        console.log("📌 Login Request Received:", email);

        // ✅ Check if User Exists
        const result = await pool.query("SELECT id, email, password FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            console.log("❌ User not found:", email);
            return res.status(401).json({ error: "❌ Invalid credentials" });
        }

        const user = result.rows[0];

        // ✅ Compare Passwords
        if (password !== user.password) {
            console.log("❌ Incorrect password for:", email);
            return res.status(401).json({ error: "❌ Invalid credentials" });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        console.log("✅ Login Successful:", email);

        res.json({ message: "✅ Login successful!", token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ error: `Server error during login. Details: ${error.message}` });
    }
});

module.exports = router;

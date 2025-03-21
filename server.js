// ✅ Updated server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const cron = require("node-cron");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const transferRoutes = require("./routes/transferRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const creditCardRoutes = require("./routes/creditCardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const loanRoutes = require("./routes/loanRoutes"); // ✅ Added Loan Routes

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ✅ Session Middleware for Admin
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bigbanksecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// ✅ User ID Middleware for Authentication
app.use((req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userEmail = decoded.email; // ✅ Capture User Email for Loan Notifications
      console.log("✅ Extracted User ID:", req.userId);
    } catch (err) {
      console.warn("⚠️ Invalid or expired token.");
    }
  }
  next();
});

// ✅ Frontend Path
const frontendPath = path.join(__dirname, "../frontend/public");
app.use(express.static(frontendPath));

// ✅ Home Route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ Serve Pages
app.get("/customer.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "customer.html"));
});

app.get("/adminLogin.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "adminLogin.html"));
});

app.get("/adminDashboard.html", (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(frontendPath, "adminDashboard.html"));
  } else {
    res.redirect("/adminLogin.html");
  }
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/credit", creditCardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/loans", loanRoutes); // ✅ Loan API Routes

// ✅ Connect to PostgreSQL
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection error:", err));

// ✅ Cron Job to Reset Daily Transaction Count at Midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Resetting daily transaction count...");
  try {
    await pool.query("UPDATE users SET transaction_count = 0");
    console.log("✅ Daily transaction count reset.");
  } catch (error) {
    console.error("❌ Failed to reset transaction count:", error);
  }
});

// ✅ Cron Job for Monthly EMI Deduction
cron.schedule("0 0 1 * *", async () => {
  console.log("💰 Processing Monthly EMI Deduction...");
  try {
    const activeLoans = await pool.query(
      `SELECT * FROM loan_subscriptions WHERE status = 'active'`
    );

    for (const loan of activeLoans.rows) {
      const monthlyEMI = (loan.loan_amount * (1 + loan.interest_rate / 100)) / loan.loan_term;
      const userBalance = await pool.query("SELECT balance FROM users WHERE id = $1", [loan.user_id]);

      if (userBalance.rows[0].balance >= monthlyEMI) {
        await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [monthlyEMI, loan.user_id]);
        console.log(`✅ EMI of $${monthlyEMI.toFixed(2)} deducted for user ID: ${loan.user_id}`);
      } else {
        await pool.query(
          `INSERT INTO notifications (user_id, message, created_at)
           VALUES ($1, '⚠️ Low balance! Unable to deduct EMI. Please add funds.', NOW())`,
          [loan.user_id]
        );
        console.warn(`⚠️ EMI deduction failed due to low balance for user ID: ${loan.user_id}`);
      }
    }

    console.log("✅ Monthly EMI Deduction Completed.");
  } catch (error) {
    console.error("❌ EMI Deduction Error:", error);
  }
});

// ✅ 404 Error Handling
app.use((req, res) => {
  res.status(404).json({ error: "❌ Route not found!" });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://20.151.166.147:${PORT}`)
);

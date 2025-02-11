const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const transferRoutes = require("./routes/transferRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const frontendPath = path.join(__dirname, "frontend/public");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ Connect to PostgreSQL
pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL database"))
    .catch(err => console.error("❌ Database connection error:", err));

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
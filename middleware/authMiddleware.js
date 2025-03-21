const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    console.log("🔍 Received Authorization Header:", authHeader); // Log token

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "❌ Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("📌 Extracted Token:", token); // Log extracted token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded); // Log decoded token
        req.user = decoded;
        next();
    } catch (error) {
        console.error("❌ JWT Verification Error:", error);
        return res.status(401).json({ error: "❌ Unauthorized: Invalid token" });
    }
};

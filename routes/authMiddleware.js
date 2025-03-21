const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            console.log("❌ No token provided");
            return res.status(401).json({ error: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        console.log("🔍 Decoded Token:", decoded);

        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

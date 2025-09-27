const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ message: "Invalid token or user not active" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Admin authorization
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({ message: "Server error in authorization" });
  }
};

module.exports = { auth, adminAuth };

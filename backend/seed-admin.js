const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL || "admin@offroad.com",
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: "Administrator",
      email: process.env.ADMIN_EMAIL || "admin@offroad.com",
      phone: "+1234567890",
      password: process.env.ADMIN_PASSWORD || "admin123",
      role: "admin",
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully");
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔒 Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
    console.log("⚠️  Please change the default password after first login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();

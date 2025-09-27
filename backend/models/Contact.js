const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[1-9]\d{0,15}$/, "Please enter a valid phone number"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot be more than 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot be more than 2000 characters"],
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    responseDate: {
      type: Date,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
    whatsappSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);

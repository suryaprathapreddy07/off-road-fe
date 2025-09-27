const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    participantDetails: {
      name: {
        type: String,
        required: [true, "Participant name is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
      },
      emergencyContact: {
        name: {
          type: String,
          required: [true, "Emergency contact name is required"],
          trim: true,
        },
        phone: {
          type: String,
          required: [true, "Emergency contact phone is required"],
          trim: true,
        },
        relationship: {
          type: String,
          required: [true, "Relationship is required"],
          trim: true,
        },
      },
      medicalConditions: {
        type: String,
        trim: true,
        default: "None",
      },
      experience: {
        type: String,
        required: [true, "Experience level is required"],
        enum: ["Beginner", "Some Experience", "Experienced", "Expert"],
      },
      vehicleDetails: {
        make: {
          type: String,
          required: [true, "Vehicle make is required"],
          trim: true,
        },
        model: {
          type: String,
          required: [true, "Vehicle model is required"],
          trim: true,
        },
        year: {
          type: Number,
          required: [true, "Vehicle year is required"],
          min: [1900, "Invalid vehicle year"],
        },
        modifications: {
          type: String,
          trim: true,
          default: "None",
        },
      },
      additionalNotes: {
        type: String,
        trim: true,
        maxlength: [500, "Additional notes cannot exceed 500 characters"],
      },
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    paymentDate: {
      type: Date,
    },
    paymentAmount: {
      type: Number,
      required: [true, "Payment amount is required"],
    },
    waiverSigned: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one registration per user per event
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for better query performance
registrationSchema.index({ registrationStatus: 1 });
registrationSchema.index({ registrationDate: -1 });

module.exports = mongoose.model("Registration", registrationSchema);

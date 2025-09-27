const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [200, "Short description cannot be more than 200 characters"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: function (date) {
          return date > new Date();
        },
        message: "Event date must be in the future",
      },
    },
    location: {
      address: {
        type: String,
        required: [true, "Event address is required"],
        trim: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    price: {
      type: Number,
      required: [true, "Event price is required"],
      min: [0, "Price cannot be negative"],
    },
    maxParticipants: {
      type: Number,
      required: [true, "Maximum participants is required"],
      min: [1, "Maximum participants must be at least 1"],
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: [0, "Current participants cannot be negative"],
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty level is required"],
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },
    duration: {
      type: String,
      required: [true, "Event duration is required"],
      trim: true,
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    includes: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "cancelled", "completed", "draft"],
      default: "active",
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ location: "2dsphere" });
eventSchema.index({ tags: 1 });

// Virtual for checking if event is full
eventSchema.virtual("isFull").get(function () {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for available spots
eventSchema.virtual("availableSpots").get(function () {
  return this.maxParticipants - this.currentParticipants;
});

// Method to check if registration is still open
eventSchema.methods.isRegistrationOpen = function () {
  const now = new Date();
  return (
    now <= this.registrationDeadline && this.status === "active" && !this.isFull
  );
};

module.exports = mongoose.model("Event", eventSchema);

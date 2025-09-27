const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Image title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    altText: {
      type: String,
      required: [true, "Alt text is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Events",
        "Vehicles",
        "Landscapes",
        "Action",
        "Group Photos",
        "Other",
      ],
      default: "Other",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
gallerySchema.index({ category: 1, isActive: 1 });
gallerySchema.index({ featured: -1, createdAt: -1 });
gallerySchema.index({ tags: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);

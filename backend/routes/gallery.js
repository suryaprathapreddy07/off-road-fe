const express = require("express");
const multer = require("multer");
const path = require("path");
const { body, validationResult, query } = require("express-validator");
const Gallery = require("../models/Gallery");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Configure multer for gallery uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/gallery/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `gallery-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// @route   GET /api/gallery
// @desc    Get gallery images (with filtering and pagination)
// @access  Public
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("category")
      .optional()
      .isIn([
        "Events",
        "Vehicles",
        "Landscapes",
        "Action",
        "Group Photos",
        "Other",
      ]),
    query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = { isActive: true };

      if (req.query.category) filter.category = req.query.category;
      if (req.query.featured !== undefined)
        filter.featured = req.query.featured === "true";
      if (req.query.eventId) filter.event = req.query.eventId;
      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
          { tags: { $in: [new RegExp(req.query.search, "i")] } },
        ];
      }

      const sortOptions = {};
      if (req.query.featured === "true") {
        sortOptions.featured = -1;
      }
      sortOptions.createdAt = -1;

      const images = await Gallery.find(filter)
        .populate("event", "title date")
        .populate("uploadedBy", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const total = await Gallery.countDocuments(filter);

      res.json({
        images,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalImages: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Get gallery error:", error);
      res.status(500).json({ message: "Server error fetching gallery images" });
    }
  }
);

// @route   GET /api/gallery/:id
// @desc    Get single gallery image
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id)
      .populate("event", "title date location")
      .populate("uploadedBy", "name");

    if (!image || !image.isActive) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Increment views
    await Gallery.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(image);
  } catch (error) {
    console.error("Get gallery image error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Image not found" });
    }
    res.status(500).json({ message: "Server error fetching image" });
  }
});

// @route   POST /api/gallery
// @desc    Upload new gallery image
// @access  Private (Admin only)
router.post(
  "/",
  [
    auth,
    adminAuth,
    upload.single("image"),
    body("title")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Title must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("altText").trim().notEmpty().withMessage("Alt text is required"),
    body("category")
      .isIn([
        "Events",
        "Vehicles",
        "Landscapes",
        "Action",
        "Group Photos",
        "Other",
      ])
      .withMessage("Invalid category"),
    body("event").optional().isMongoId().withMessage("Valid event ID required"),
    body("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const {
        title,
        description,
        altText,
        category,
        event,
        featured = false,
        tags,
      } = req.body;

      // Process tags
      const processedTags = tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim().toLowerCase())
        : [];

      const galleryImage = new Gallery({
        title,
        description,
        imageUrl: `/uploads/gallery/${req.file.filename}`,
        altText,
        category,
        tags: processedTags,
        event: event || null,
        uploadedBy: req.user._id,
        featured,
      });

      await galleryImage.save();
      await galleryImage.populate(["event", "uploadedBy"]);

      res.status(201).json({
        message: "Image uploaded successfully",
        image: galleryImage,
      });
    } catch (error) {
      console.error("Upload gallery image error:", error);
      res.status(500).json({ message: "Server error uploading image" });
    }
  }
);

// @route   PUT /api/gallery/:id
// @desc    Update gallery image
// @access  Private (Admin only)
router.put(
  "/:id",
  [
    auth,
    adminAuth,
    upload.single("image"),
    body("title").optional().trim().isLength({ min: 2, max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("altText").optional().trim().notEmpty(),
    body("category")
      .optional()
      .isIn([
        "Events",
        "Vehicles",
        "Landscapes",
        "Action",
        "Group Photos",
        "Other",
      ]),
    body("event").optional().isMongoId(),
    body("featured").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const image = await Gallery.findById(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Update fields
      const updateFields = { ...req.body };

      // Handle new uploaded image
      if (req.file) {
        updateFields.imageUrl = `/uploads/gallery/${req.file.filename}`;
      }

      // Process tags if provided
      if (updateFields.tags) {
        updateFields.tags = Array.isArray(updateFields.tags)
          ? updateFields.tags
          : updateFields.tags.split(",").map((tag) => tag.trim().toLowerCase());
      }

      const updatedImage = await Gallery.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      ).populate(["event", "uploadedBy"]);

      res.json({
        message: "Image updated successfully",
        image: updatedImage,
      });
    } catch (error) {
      console.error("Update gallery image error:", error);
      if (error.name === "CastError") {
        return res.status(404).json({ message: "Image not found" });
      }
      res.status(500).json({ message: "Server error updating image" });
    }
  }
);

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery image
// @access  Private (Admin only)
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Soft delete - mark as inactive instead of removing
    await Gallery.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete gallery image error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Image not found" });
    }
    res.status(500).json({ message: "Server error deleting image" });
  }
});

// @route   PATCH /api/gallery/:id/featured
// @desc    Toggle featured status
// @access  Private (Admin only)
router.patch(
  "/:id/featured",
  [
    auth,
    adminAuth,
    body("featured").isBoolean().withMessage("Featured must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const image = await Gallery.findByIdAndUpdate(
        req.params.id,
        { featured: req.body.featured },
        { new: true, runValidators: true }
      ).populate(["event", "uploadedBy"]);

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json({
        message: "Featured status updated successfully",
        image,
      });
    } catch (error) {
      console.error("Update featured status error:", error);
      if (error.name === "CastError") {
        return res.status(404).json({ message: "Image not found" });
      }
      res
        .status(500)
        .json({ message: "Server error updating featured status" });
    }
  }
);

// @route   POST /api/gallery/:id/like
// @desc    Like/unlike gallery image
// @access  Public
router.post("/:id/like", async (req, res) => {
  try {
    const image = await Gallery.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!image || !image.isActive) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({
      message: "Image liked successfully",
      likes: image.likes,
    });
  } catch (error) {
    console.error("Like image error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Image not found" });
    }
    res.status(500).json({ message: "Server error liking image" });
  }
});

module.exports = router;

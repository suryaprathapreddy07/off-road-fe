const express = require("express");
const multer = require("multer");
const path = require("path");
const { body, validationResult, query } = require("express-validator");
const Event = require("../models/Event");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/events/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `event-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// @route   GET /api/events
// @desc    Get all events (with filtering and pagination)
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
    query("difficulty")
      .optional()
      .isIn(["Beginner", "Intermediate", "Advanced", "Expert"]),
    query("status")
      .optional()
      .isIn(["active", "cancelled", "completed", "draft"]),
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
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};

      // Only show active events to non-admin users
      if (!req.user || req.user.role !== "admin") {
        filter.status = "active";
        filter.date = { $gte: new Date() }; // Only future events
      }

      if (req.query.difficulty) filter.difficulty = req.query.difficulty;
      if (req.query.status && req.user && req.user.role === "admin") {
        filter.status = req.query.status;
      }
      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
          { "location.address": { $regex: req.query.search, $options: "i" } },
        ];
      }

      const events = await Event.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Event.countDocuments(filter);

      res.json({
        events,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Server error fetching events" });
    }
  }
);

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Only show active events to non-admin users
    if (!req.user || req.user.role !== "admin") {
      if (event.status !== "active") {
        return res.status(404).json({ message: "Event not found" });
      }
    }

    res.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(500).json({ message: "Server error fetching event" });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Admin only)
router.post(
  "/",
  [
    auth,
    adminAuth,
    upload.array("images", 5),
    body("title")
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Title must be between 5 and 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage("Description must be between 20 and 2000 characters"),
    body("shortDescription")
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage("Short description must be between 10 and 200 characters"),
    body("date").isISO8601().withMessage("Please provide a valid date"),
    body("location.address")
      .trim()
      .notEmpty()
      .withMessage("Location address is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("maxParticipants")
      .isInt({ min: 1 })
      .withMessage("Maximum participants must be at least 1"),
    body("difficulty")
      .isIn(["Beginner", "Intermediate", "Advanced", "Expert"])
      .withMessage("Invalid difficulty level"),
    body("duration").trim().notEmpty().withMessage("Duration is required"),
    body("registrationDeadline")
      .isISO8601()
      .withMessage("Please provide a valid registration deadline"),
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

      const {
        title,
        description,
        shortDescription,
        date,
        location,
        price,
        maxParticipants,
        difficulty,
        duration,
        equipment,
        requirements,
        includes,
        registrationDeadline,
        tags,
      } = req.body;

      // Validate dates
      const eventDate = new Date(date);
      const regDeadline = new Date(registrationDeadline);
      const now = new Date();

      if (eventDate <= now) {
        return res
          .status(400)
          .json({ message: "Event date must be in the future" });
      }

      if (regDeadline >= eventDate) {
        return res
          .status(400)
          .json({ message: "Registration deadline must be before event date" });
      }

      // Process uploaded images
      const images = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          images.push({
            url: `/uploads/events/${file.filename}`,
            alt: `${title} - Image ${index + 1}`,
            isPrimary: index === 0,
          });
        });
      }

      // Create event
      const event = new Event({
        title,
        description,
        shortDescription,
        date: eventDate,
        location: {
          address: location.address,
          coordinates: location.coordinates || {},
        },
        price,
        maxParticipants,
        difficulty,
        duration,
        images,
        equipment: equipment
          ? Array.isArray(equipment)
            ? equipment
            : [equipment]
          : [],
        requirements: requirements
          ? Array.isArray(requirements)
            ? requirements
            : [requirements]
          : [],
        includes: includes
          ? Array.isArray(includes)
            ? includes
            : [includes]
          : [],
        registrationDeadline: regDeadline,
        createdBy: req.user._id,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      });

      await event.save();
      await event.populate("createdBy", "name email");

      res.status(201).json({
        message: "Event created successfully",
        event,
      });
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ message: "Server error creating event" });
    }
  }
);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin only)
router.put(
  "/:id",
  [
    auth,
    adminAuth,
    upload.array("images", 5),
    body("title").optional().trim().isLength({ min: 5, max: 100 }),
    body("description").optional().trim().isLength({ min: 20, max: 2000 }),
    body("shortDescription").optional().trim().isLength({ min: 10, max: 200 }),
    body("date").optional().isISO8601(),
    body("price").optional().isFloat({ min: 0 }),
    body("maxParticipants").optional().isInt({ min: 1 }),
    body("difficulty")
      .optional()
      .isIn(["Beginner", "Intermediate", "Advanced", "Expert"]),
    body("registrationDeadline").optional().isISO8601(),
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

      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Update fields
      const updateFields = { ...req.body };

      // Handle new uploaded images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file, index) => ({
          url: `/uploads/events/${file.filename}`,
          alt: `${updateFields.title || event.title} - Image ${index + 1}`,
          isPrimary: index === 0 && event.images.length === 0,
        }));

        updateFields.images = [...event.images, ...newImages];
      }

      // Validate dates if provided
      if (updateFields.date || updateFields.registrationDeadline) {
        const eventDate = new Date(updateFields.date || event.date);
        const regDeadline = new Date(
          updateFields.registrationDeadline || event.registrationDeadline
        );

        if (eventDate <= new Date()) {
          return res
            .status(400)
            .json({ message: "Event date must be in the future" });
        }

        if (regDeadline >= eventDate) {
          return res
            .status(400)
            .json({
              message: "Registration deadline must be before event date",
            });
        }
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      ).populate("createdBy", "name email");

      res.json({
        message: "Event updated successfully",
        event: updatedEvent,
      });
    } catch (error) {
      console.error("Update event error:", error);
      if (error.name === "CastError") {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(500).json({ message: "Server error updating event" });
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin only)
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event has registrations
    if (event.currentParticipants > 0) {
      return res.status(400).json({
        message:
          "Cannot delete event with existing registrations. Consider cancelling instead.",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(500).json({ message: "Server error deleting event" });
  }
});

// @route   PATCH /api/events/:id/status
// @desc    Update event status
// @access  Private (Admin only)
router.patch(
  "/:id/status",
  [
    auth,
    adminAuth,
    body("status")
      .isIn(["active", "cancelled", "completed", "draft"])
      .withMessage("Invalid status"),
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

      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      ).populate("createdBy", "name email");

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({
        message: "Event status updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update event status error:", error);
      if (error.name === "CastError") {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(500).json({ message: "Server error updating event status" });
    }
  }
);

module.exports = router;

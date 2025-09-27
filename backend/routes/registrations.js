const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { auth, adminAuth } = require("../middleware/auth");
const whatsappService = require("../utils/whatsapp");

const router = express.Router();

// @route   POST /api/registrations
// @desc    Register for an event
// @access  Private
router.post(
  "/",
  [
    auth,
    body("eventId").isMongoId().withMessage("Valid event ID is required"),
    body("participantDetails.name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("participantDetails.email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("participantDetails.phone")
      .matches(/^[+]?[1-9]\d{0,15}$/)
      .withMessage("Valid phone number is required"),
    body("participantDetails.emergencyContact.name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Emergency contact name is required"),
    body("participantDetails.emergencyContact.phone")
      .matches(/^[+]?[1-9]\d{0,15}$/)
      .withMessage("Valid emergency contact phone is required"),
    body("participantDetails.emergencyContact.relationship")
      .trim()
      .notEmpty()
      .withMessage("Relationship is required"),
    body("participantDetails.experience")
      .isIn(["Beginner", "Some Experience", "Experienced", "Expert"])
      .withMessage("Valid experience level is required"),
    body("participantDetails.vehicleDetails.make")
      .trim()
      .notEmpty()
      .withMessage("Vehicle make is required"),
    body("participantDetails.vehicleDetails.model")
      .trim()
      .notEmpty()
      .withMessage("Vehicle model is required"),
    body("participantDetails.vehicleDetails.year")
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Valid vehicle year is required"),
    body("participantDetails.medicalConditions")
      .optional()
      .trim()
      .isLength({ max: 500 }),
    body("participantDetails.vehicleDetails.modifications")
      .optional()
      .trim()
      .isLength({ max: 500 }),
    body("participantDetails.additionalNotes")
      .optional()
      .trim()
      .isLength({ max: 500 }),
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

      const { eventId, participantDetails } = req.body;

      // Check if event exists and is available for registration
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (!event.isRegistrationOpen()) {
        return res.status(400).json({
          message: "Registration is closed for this event",
        });
      }

      // Check if user already registered for this event
      const existingRegistration = await Registration.findOne({
        event: eventId,
        user: req.user._id,
      });

      if (existingRegistration) {
        return res.status(400).json({
          message: "You have already registered for this event",
        });
      }

      // Create registration
      const registration = new Registration({
        event: eventId,
        user: req.user._id,
        participantDetails,
        paymentAmount: event.price,
      });

      await registration.save();

      // Update event participant count
      await Event.findByIdAndUpdate(eventId, {
        $inc: { currentParticipants: 1 },
      });

      // Populate registration for response
      await registration.populate(["event", "user"]);

      // Send WhatsApp notification to admin
      try {
        await whatsappService.sendEventRegistrationNotification(
          registration,
          event
        );
      } catch (whatsappError) {
        console.error("WhatsApp notification error:", whatsappError);
        // Don't fail the registration if WhatsApp fails
      }

      res.status(201).json({
        message: "Registration submitted successfully",
        registration: {
          id: registration._id,
          event: {
            id: event._id,
            title: event.title,
            date: event.date,
            price: event.price,
          },
          participantDetails: registration.participantDetails,
          registrationStatus: registration.registrationStatus,
          paymentStatus: registration.paymentStatus,
          registrationDate: registration.registrationDate,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

// @route   GET /api/registrations
// @desc    Get registrations (user gets their own, admin gets all)
// @access  Private
router.get(
  "/",
  [
    auth,
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "cancelled", "completed"]),
    query("eventId")
      .optional()
      .isMongoId()
      .withMessage("Valid event ID required"),
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

      // Build filter
      const filter = {};

      // Non-admin users can only see their own registrations
      if (req.user.role !== "admin") {
        filter.user = req.user._id;
      }

      if (req.query.status) filter.registrationStatus = req.query.status;
      if (req.query.eventId) filter.event = req.query.eventId;

      const registrations = await Registration.find(filter)
        .populate("event", "title date location price difficulty status")
        .populate("user", "name email phone")
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Registration.countDocuments(filter);

      res.json({
        registrations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRegistrations: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Get registrations error:", error);
      res.status(500).json({ message: "Server error fetching registrations" });
    }
  }
);

// @route   GET /api/registrations/:id
// @desc    Get single registration
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate("event")
      .populate("user", "name email phone");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Non-admin users can only view their own registrations
    if (
      req.user.role !== "admin" &&
      registration.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(registration);
  } catch (error) {
    console.error("Get registration error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(500).json({ message: "Server error fetching registration" });
  }
});

// @route   PATCH /api/registrations/:id/status
// @desc    Update registration status
// @access  Private (Admin only)
router.patch(
  "/:id/status",
  [
    auth,
    adminAuth,
    body("status")
      .isIn(["pending", "confirmed", "cancelled", "completed"])
      .withMessage("Invalid status"),
    body("notes").optional().trim().isLength({ max: 500 }),
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

      const { status, notes } = req.body;

      const registration = await Registration.findById(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      const oldStatus = registration.registrationStatus;

      // Update registration
      registration.registrationStatus = status;
      if (notes) registration.notes = notes;

      await registration.save();

      // Update event participant count if status changed to/from confirmed
      if (oldStatus !== status) {
        const event = await Event.findById(registration.event);
        if (event) {
          if (status === "confirmed" && oldStatus !== "confirmed") {
            // Don't increment if already counted
          } else if (oldStatus === "confirmed" && status !== "confirmed") {
            await Event.findByIdAndUpdate(registration.event, {
              $inc: { currentParticipants: -1 },
            });
          }
        }
      }

      await registration.populate(["event", "user"]);

      res.json({
        message: "Registration status updated successfully",
        registration,
      });
    } catch (error) {
      console.error("Update registration status error:", error);
      if (error.name === "CastError") {
        return res.status(404).json({ message: "Registration not found" });
      }
      res
        .status(500)
        .json({ message: "Server error updating registration status" });
    }
  }
);

// @route   PATCH /api/registrations/:id/payment
// @desc    Update payment status
// @access  Private (Admin only)
router.patch(
  "/:id/payment",
  [
    auth,
    adminAuth,
    body("paymentStatus")
      .isIn(["pending", "paid", "refunded"])
      .withMessage("Invalid payment status"),
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

      const { paymentStatus } = req.body;

      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        {
          paymentStatus,
          paymentDate: paymentStatus === "paid" ? new Date() : undefined,
        },
        { new: true, runValidators: true }
      ).populate(["event", "user"]);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      res.json({
        message: "Payment status updated successfully",
        registration,
      });
    } catch (error) {
      console.error("Update payment status error:", error);
      if (error.name === "CastError") {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.status(500).json({ message: "Server error updating payment status" });
    }
  }
);

// @route   DELETE /api/registrations/:id
// @desc    Cancel registration
// @access  Private (User can cancel their own, Admin can cancel any)
router.delete("/:id", auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Non-admin users can only cancel their own registrations
    if (
      req.user.role !== "admin" &&
      registration.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if cancellation is allowed (e.g., not too close to event date)
    const event = await Event.findById(registration.event);
    if (event) {
      const daysDiff = Math.ceil(
        (event.date - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff < 3) {
        return res.status(400).json({
          message: "Cancellation not allowed within 3 days of the event",
        });
      }
    }

    // Update registration status to cancelled instead of deleting
    registration.registrationStatus = "cancelled";
    await registration.save();

    // Update event participant count if registration was confirmed
    if (registration.registrationStatus === "confirmed") {
      await Event.findByIdAndUpdate(registration.event, {
        $inc: { currentParticipants: -1 },
      });
    }

    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Cancel registration error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(500).json({ message: "Server error cancelling registration" });
  }
});

module.exports = router;

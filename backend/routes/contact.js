const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Contact = require("../models/Contact");
const { auth, adminAuth } = require("../middleware/auth");
const whatsappService = require("../utils/whatsapp");

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("phone")
      .optional()
      .matches(/^[+]?[1-9]\d{0,15}$/)
      .withMessage("Valid phone number required"),
    body("subject")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Subject must be between 5 and 200 characters"),
    body("message")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be between 10 and 2000 characters"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority level"),
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
        name,
        email,
        phone,
        subject,
        message,
        priority = "medium",
      } = req.body;

      // Create contact submission
      const contact = new Contact({
        name,
        email,
        phone,
        subject,
        message,
        priority,
      });

      await contact.save();

      // Send WhatsApp notification to admin
      try {
        const result = await whatsappService.sendContactNotification(contact);
        if (result.success) {
          contact.whatsappSent = true;
          contact.whatsappSentAt = new Date();
          await contact.save();
        }
      } catch (whatsappError) {
        console.error("WhatsApp notification error:", whatsappError);
        // Don't fail the contact submission if WhatsApp fails
      }

      res.status(201).json({
        message:
          "Contact form submitted successfully. We will get back to you soon!",
        contact: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
          status: contact.status,
          createdAt: contact.createdAt,
        },
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Server error submitting contact form" });
    }
  }
);

// @route   GET /api/contact
// @desc    Get all contact submissions (Admin only)
// @access  Private (Admin only)
router.get(
  "/",
  [
    auth,
    adminAuth,
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
      .isIn(["new", "in-progress", "resolved", "closed"]),
    query("priority").optional().isIn(["low", "medium", "high", "urgent"]),
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
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};

      if (req.query.status) filter.status = req.query.status;
      if (req.query.priority) filter.priority = req.query.priority;
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
          { subject: { $regex: req.query.search, $options: "i" } },
          { message: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const contacts = await Contact.find(filter)
        .sort({ priority: -1, createdAt: -1 }) // Show urgent/high priority first
        .skip(skip)
        .limit(limit);

      const total = await Contact.countDocuments(filter);

      // Get counts by status for dashboard
      const statusCounts = await Contact.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const priorityCounts = await Contact.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        contacts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalContacts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        stats: {
          statusCounts,
          priorityCounts,
        },
      });
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Server error fetching contacts" });
    }
  }
);

// @route   GET /api/contact/:id
// @desc    Get single contact submission
// @access  Private (Admin only)
router.get("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Contact submission not found" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Get contact error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Contact submission not found" });
    }
    res
      .status(500)
      .json({ message: "Server error fetching contact submission" });
  }
});

// @route   PATCH /api/contact/:id/status
// @desc    Update contact status
// @access  Private (Admin only)
router.patch(
  "/:id/status",
  [
    auth,
    adminAuth,
    body("status")
      .isIn(["new", "in-progress", "resolved", "closed"])
      .withMessage("Invalid status"),
    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Admin notes cannot exceed 1000 characters"),
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

      const { status, adminNotes } = req.body;

      const updateFields = { status };
      if (adminNotes) updateFields.adminNotes = adminNotes;
      if (status === "resolved" || status === "closed") {
        updateFields.responseDate = new Date();
      }

      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res
          .status(404)
          .json({ message: "Contact submission not found" });
      }

      res.json({
        message: "Contact status updated successfully",
        contact,
      });
    } catch (error) {
      console.error("Update contact status error:", error);
      if (error.name === "CastError") {
        return res
          .status(404)
          .json({ message: "Contact submission not found" });
      }
      res.status(500).json({ message: "Server error updating contact status" });
    }
  }
);

// @route   PATCH /api/contact/:id/priority
// @desc    Update contact priority
// @access  Private (Admin only)
router.patch(
  "/:id/priority",
  [
    auth,
    adminAuth,
    body("priority")
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority level"),
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

      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { priority: req.body.priority },
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res
          .status(404)
          .json({ message: "Contact submission not found" });
      }

      res.json({
        message: "Contact priority updated successfully",
        contact,
      });
    } catch (error) {
      console.error("Update contact priority error:", error);
      if (error.name === "CastError") {
        return res
          .status(404)
          .json({ message: "Contact submission not found" });
      }
      res
        .status(500)
        .json({ message: "Server error updating contact priority" });
    }
  }
);

// @route   DELETE /api/contact/:id
// @desc    Delete contact submission
// @access  Private (Admin only)
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Contact submission not found" });
    }

    res.json({ message: "Contact submission deleted successfully" });
  } catch (error) {
    console.error("Delete contact error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Contact submission not found" });
    }
    res
      .status(500)
      .json({ message: "Server error deleting contact submission" });
  }
});

// @route   GET /api/contact/stats/dashboard
// @desc    Get contact statistics for admin dashboard
// @access  Private (Admin only)
router.get("/stats/dashboard", [auth, adminAuth], async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $facet: {
          totalContacts: [{ $count: "count" }],
          newContacts: [{ $match: { status: "new" } }, { $count: "count" }],
          urgentContacts: [
            { $match: { priority: "urgent" } },
            { $count: "count" },
          ],
          recentContacts: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            { $count: "count" },
          ],
          statusBreakdown: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          priorityBreakdown: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 },
              },
            },
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 },
          ],
        },
      },
    ]);

    const result = {
      totalContacts: stats[0].totalContacts[0]?.count || 0,
      newContacts: stats[0].newContacts[0]?.count || 0,
      urgentContacts: stats[0].urgentContacts[0]?.count || 0,
      recentContacts: stats[0].recentContacts[0]?.count || 0,
      statusBreakdown: stats[0].statusBreakdown,
      priorityBreakdown: stats[0].priorityBreakdown,
      monthlyTrend: stats[0].monthlyTrend,
    };

    res.json(result);
  } catch (error) {
    console.error("Get contact stats error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching contact statistics" });
  }
});

module.exports = router;

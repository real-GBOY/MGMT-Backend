/** @format */

const express = require("express");
const notificationController = require("../controllers/notificationController");
const {
	authenticate,
	adminOnly,
	teamLeadershipOrAdmin,
	teamResourceAccess,
} = require("../middlewares/auth");

const router = express.Router();

// Apply authentication to all notification routes
router.use(authenticate);

// ===== USER NOTIFICATIONS =====

// Get all notifications for current user
router.get("/", notificationController.getNotifications);

// Get notification by ID
router.get("/:id", notificationController.getNotification);

// Mark notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark multiple notifications as read
router.patch("/mark-multiple-read", notificationController.markMultipleAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", notificationController.markAllAsRead);

// Archive notification
router.patch("/:id/archive", notificationController.archiveNotification);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

// Get notification statistics
router.get("/stats/overview", notificationController.getNotificationStats);

// ===== NOTIFICATION PREFERENCES =====

// Get notification preferences
router.get("/preferences/settings", notificationController.getPreferences);

// Update notification preferences
router.patch("/preferences/settings", notificationController.updatePreferences);

// ===== TEAM NOTIFICATIONS (Team Heads & Admin) =====

// Get team notifications
router.get(
	"/team/overview",
	teamLeadershipOrAdmin,
	notificationController.getTeamNotifications
);

// ===== CREATE NOTIFICATIONS (Team Heads & Admin) =====

// Create notification for specific users
router.post(
	"/create",
	teamLeadershipOrAdmin,
	notificationController.createNotification
);

// Create team-wide notification
router.post(
	"/team/broadcast",
	teamLeadershipOrAdmin,
	teamResourceAccess,
	notificationController.createNotification
);

// ===== ADMIN ONLY ROUTES =====

// Get all notifications (admin only)
router.get("/admin/all", adminOnly, async (req, res) => {
	try {
		const { page = 1, limit = 50, status, type, category } = req.query;
		const skip = (page - 1) * limit;

		const filter = {};
		if (status) filter.status = status;
		if (type) filter.type = type;
		if (category) filter.category = category;

		const notifications = await require("../models/Notification")
			.find(filter)
			.populate("recipient", "firstName lastName email")
			.populate("sender", "firstName lastName email")
			.populate("team", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		const total = await require("../models/Notification").countDocuments(
			filter
		);

		res.status(200).json({
			status: "success",
			data: {
				notifications,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / limit),
					totalItems: total,
					itemsPerPage: parseInt(limit),
				},
			},
		});
	} catch (error) {
		console.error("Admin get all notifications error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to fetch all notifications",
		});
	}
});

// System-wide announcement (admin only)
router.post("/admin/announcement", adminOnly, async (req, res) => {
	try {
		const { title, message, priority, recipients } = req.body;

		if (!title || !message) {
			return res.status(400).json({
				status: "fail",
				message: "Title and message are required",
			});
		}

		// If no specific recipients, send to all users
		let targetRecipients = recipients;
		if (!targetRecipients || targetRecipients.length === 0) {
			const allUsers = await require("../models/Users")
				.find({ isActive: true })
				.select("_id");
			targetRecipients = allUsers.map((user) => user._id);
		}

		const notifications =
			await require("../models/Notification").createSystemAnnouncement(
				targetRecipients,
				title,
				message,
				priority || "medium"
			);

		res.status(201).json({
			status: "success",
			message: `System announcement sent to ${notifications.length} users`,
			data: {
				notifications,
			},
		});
	} catch (error) {
		console.error("System announcement error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to send system announcement",
		});
	}
});

// Clean up expired notifications (admin only)
router.delete("/admin/cleanup", adminOnly, async (req, res) => {
	try {
		const result = await require("../models/Notification").deleteMany({
			expiresAt: { $lt: new Date() },
		});

		res.status(200).json({
			status: "success",
			message: `${result.deletedCount} expired notifications cleaned up`,
		});
	} catch (error) {
		console.error("Cleanup error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to cleanup expired notifications",
		});
	}
});

// ===== NOTIFICATION TYPES =====

// Get available notification types
router.get("/types/available", (req, res) => {
	const notificationTypes = [
		{
			value: "task_assigned",
			label: "Task Assigned",
			description: "When a task is assigned to you",
			category: "task",
		},
		{
			value: "task_completed",
			label: "Task Completed",
			description: "When a task is marked as completed",
			category: "task",
		},
		{
			value: "task_overdue",
			label: "Task Overdue",
			description: "When a task is overdue",
			category: "task",
		},
		{
			value: "meeting_created",
			label: "Meeting Created",
			description: "When a new meeting is created",
			category: "meeting",
		},
		{
			value: "meeting_reminder",
			label: "Meeting Reminder",
			description: "Reminder for upcoming meetings",
			category: "meeting",
		},
		{
			value: "meeting_cancelled",
			label: "Meeting Cancelled",
			description: "When a meeting is cancelled",
			category: "meeting",
		},
		{
			value: "attendance_marked",
			label: "Attendance Marked",
			description: "When attendance is recorded",
			category: "attendance",
		},
		{
			value: "attendance_required",
			label: "Attendance Required",
			description: "Reminder to mark attendance",
			category: "attendance",
		},
		{
			value: "feedback_submitted",
			label: "Feedback Submitted",
			description: "When feedback is submitted",
			category: "feedback",
		},
		{
			value: "feedback_reviewed",
			label: "Feedback Reviewed",
			description: "When feedback is reviewed",
			category: "feedback",
		},
		{
			value: "file_uploaded",
			label: "File Uploaded",
			description: "When a new file is uploaded",
			category: "file",
		},
		{
			value: "file_shared",
			label: "File Shared",
			description: "When a file is shared with you",
			category: "file",
		},
		{
			value: "system_announcement",
			label: "System Announcement",
			description: "System-wide announcements",
			category: "system",
		},
		{
			value: "role_changed",
			label: "Role Changed",
			description: "When your role is changed",
			category: "system",
		},
		{
			value: "team_joined",
			label: "Team Joined",
			description: "When you join a team",
			category: "team",
		},
		{
			value: "team_left",
			label: "Team Left",
			description: "When you leave a team",
			category: "team",
		},
		{
			value: "deadline_approaching",
			label: "Deadline Approaching",
			description: "When a deadline is approaching",
			category: "general",
		},
		{
			value: "general",
			label: "General",
			description: "General notifications",
			category: "general",
		},
	];

	res.status(200).json({
		status: "success",
		data: {
			types: notificationTypes,
		},
	});
});

// Get notification categories
router.get("/categories/available", (req, res) => {
	const categories = [
		{
			value: "task",
			label: "Tasks",
			description: "Task-related notifications",
			icon: "📋",
		},
		{
			value: "meeting",
			label: "Meetings",
			description: "Meeting-related notifications",
			icon: "📅",
		},
		{
			value: "attendance",
			label: "Attendance",
			description: "Attendance-related notifications",
			icon: "✅",
		},
		{
			value: "feedback",
			label: "Feedback",
			description: "Feedback-related notifications",
			icon: "💬",
		},
		{
			value: "file",
			label: "Files",
			description: "File-related notifications",
			icon: "📁",
		},
		{
			value: "system",
			label: "System",
			description: "System-related notifications",
			icon: "⚙️",
		},
		{
			value: "team",
			label: "Team",
			description: "Team-related notifications",
			icon: "👥",
		},
	];

	res.status(200).json({
		status: "success",
		data: {
			categories,
		},
	});
});

module.exports = router;

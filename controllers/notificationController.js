/** @format */

const Notification = require("../models/Notification");
const User = require("../models/Users");
const Team = require("../models/Team");

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			status,
			type,
			category,
			priority,
		} = req.query;
		const skip = (page - 1) * limit;

		// Build filter object
		const filter = { recipient: req.user._id };

		if (status) filter.status = status;
		if (type) filter.type = type;
		if (category) filter.category = category;
		if (priority) filter.priority = priority;

		// Get notifications with pagination
		const notifications = await Notification.find(filter)
			.populate("sender", "firstName lastName profilePicture")
			.populate("team", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		// Get total count for pagination
		const total = await Notification.countDocuments(filter);

		// Get unread count
		const unreadCount = await Notification.countDocuments({
			recipient: req.user._id,
			status: "unread",
		});

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
				unreadCount,
			},
		});
	} catch (error) {
		console.error("Get notifications error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to fetch notifications",
		});
	}
};

// Get notification by ID
exports.getNotification = async (req, res) => {
	try {
		const notification = await Notification.findOne({
			_id: req.params.id,
			recipient: req.user._id,
		})
			.populate("sender", "firstName lastName profilePicture")
			.populate("team", "name");

		if (!notification) {
			return res.status(404).json({
				status: "fail",
				message: "Notification not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				notification,
			},
		});
	} catch (error) {
		console.error("Get notification error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to fetch notification",
		});
	}
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
	try {
		const notification = await Notification.findOne({
			_id: req.params.id,
			recipient: req.user._id,
		});

		if (!notification) {
			return res.status(404).json({
				status: "fail",
				message: "Notification not found",
			});
		}

		await notification.markAsRead();

		res.status(200).json({
			status: "success",
			message: "Notification marked as read",
		});
	} catch (error) {
		console.error("Mark as read error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to mark notification as read",
		});
	}
};

// Mark multiple notifications as read
exports.markMultipleAsRead = async (req, res) => {
	try {
		const { notificationIds } = req.body;

		if (!notificationIds || !Array.isArray(notificationIds)) {
			return res.status(400).json({
				status: "fail",
				message: "Notification IDs array is required",
			});
		}

		const result = await Notification.updateMany(
			{
				_id: { $in: notificationIds },
				recipient: req.user._id,
			},
			{
				status: "read",
				readAt: new Date(),
			}
		);

		res.status(200).json({
			status: "success",
			message: `${result.modifiedCount} notifications marked as read`,
		});
	} catch (error) {
		console.error("Mark multiple as read error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to mark notifications as read",
		});
	}
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
	try {
		const result = await Notification.updateMany(
			{
				recipient: req.user._id,
				status: "unread",
			},
			{
				status: "read",
				readAt: new Date(),
			}
		);

		res.status(200).json({
			status: "success",
			message: `${result.modifiedCount} notifications marked as read`,
		});
	} catch (error) {
		console.error("Mark all as read error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to mark all notifications as read",
		});
	}
};

// Archive notification
exports.archiveNotification = async (req, res) => {
	try {
		const notification = await Notification.findOne({
			_id: req.params.id,
			recipient: req.user._id,
		});

		if (!notification) {
			return res.status(404).json({
				status: "fail",
				message: "Notification not found",
			});
		}

		await notification.archive();

		res.status(200).json({
			status: "success",
			message: "Notification archived",
		});
	} catch (error) {
		console.error("Archive notification error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to archive notification",
		});
	}
};

// Delete notification
exports.deleteNotification = async (req, res) => {
	try {
		const notification = await Notification.findOneAndDelete({
			_id: req.params.id,
			recipient: req.user._id,
		});

		if (!notification) {
			return res.status(404).json({
				status: "fail",
				message: "Notification not found",
			});
		}

		res.status(200).json({
			status: "success",
			message: "Notification deleted",
		});
	} catch (error) {
		console.error("Delete notification error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to delete notification",
		});
	}
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
	try {
		const stats = await Notification.aggregate([
			{
				$match: { recipient: req.user._id },
			},
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
				},
			},
		]);

		const typeStats = await Notification.aggregate([
			{
				$match: { recipient: req.user._id },
			},
			{
				$group: {
					_id: "$type",
					count: { $sum: 1 },
				},
			},
		]);

		const priorityStats = await Notification.aggregate([
			{
				$match: { recipient: req.user._id },
			},
			{
				$group: {
					_id: "$priority",
					count: { $sum: 1 },
				},
			},
		]);

		// Convert to object format
		const statusCounts = stats.reduce((acc, stat) => {
			acc[stat._id] = stat.count;
			return acc;
		}, {});

		const typeCounts = typeStats.reduce((acc, stat) => {
			acc[stat._id] = stat.count;
			return acc;
		}, {});

		const priorityCounts = priorityStats.reduce((acc, stat) => {
			acc[stat._id] = stat.count;
			return acc;
		}, {});

		res.status(200).json({
			status: "success",
			data: {
				statusCounts,
				typeCounts,
				priorityCounts,
				total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
			},
		});
	} catch (error) {
		console.error("Get notification stats error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to fetch notification statistics",
		});
	}
};

// Create notification (for admin/team heads)
exports.createNotification = async (req, res) => {
	try {
		const {
			recipients,
			type,
			title,
			message,
			priority,
			category,
			teamId,
			scheduledFor,
		} = req.body;

		// Validate required fields
		if (!recipients || !type || !title || !message) {
			return res.status(400).json({
				status: "fail",
				message: "Recipients, type, title, and message are required",
			});
		}

		// Check if user has permission to create notifications
		if (!["admin", "teamHead", "teamViceHead"].includes(req.user.role)) {
			return res.status(403).json({
				status: "fail",
				message:
					"Access denied. Only admins and team heads can create notifications",
			});
		}

		// If teamId is provided, verify user belongs to that team
		if (teamId && req.user.role !== "admin") {
			if (req.user.team.toString() !== teamId.toString()) {
				return res.status(403).json({
					status: "fail",
					message:
						"Access denied. You can only create notifications for your own team",
				});
			}
		}

		const notifications = [];

		// Create notifications for each recipient
		for (const recipientId of recipients) {
			const notificationData = {
				recipient: recipientId,
				sender: req.user._id,
				type,
				title,
				message,
				priority: priority || "medium",
				category: category || "general",
			};

			if (teamId) {
				notificationData.team = teamId;
			}

			if (scheduledFor) {
				notificationData.scheduledFor = new Date(scheduledFor);
			}

			notifications.push(notificationData);
		}

		const createdNotifications = await Notification.insertMany(notifications);

		res.status(201).json({
			status: "success",
			message: `${createdNotifications.length} notifications created`,
			data: {
				notifications: createdNotifications,
			},
		});
	} catch (error) {
		console.error("Create notification error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to create notification",
		});
	}
};

// Get team notifications (for team heads)
exports.getTeamNotifications = async (req, res) => {
	try {
		const { page = 1, limit = 20, status, type } = req.query;
		const skip = (page - 1) * limit;

		// Check if user has permission
		if (!["admin", "teamHead", "teamViceHead"].includes(req.user.role)) {
			return res.status(403).json({
				status: "fail",
				message:
					"Access denied. Only admins and team heads can view team notifications",
			});
		}

		// Build filter
		const filter = { team: req.user.team };

		if (req.user.role !== "admin") {
			// Team heads can only see notifications for their team
			filter.team = req.user.team;
		}

		if (status) filter.status = status;
		if (type) filter.type = type;

		const notifications = await Notification.find(filter)
			.populate("recipient", "firstName lastName profilePicture")
			.populate("sender", "firstName lastName profilePicture")
			.populate("team", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		const total = await Notification.countDocuments(filter);

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
		console.error("Get team notifications error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to fetch team notifications",
		});
	}
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
	try {
		const { emailNotifications, pushNotifications, categories } = req.body;

		// Update user preferences
		const user = await User.findByIdAndUpdate(
			req.user._id,
			{
				notificationPreferences: {
					email:
						emailNotifications !== undefined
							? emailNotifications
							: req.user.notificationPreferences?.email,
					push:
						pushNotifications !== undefined
							? pushNotifications
							: req.user.notificationPreferences?.push,
					categories:
						categories || req.user.notificationPreferences?.categories,
				},
			},
			{ new: true }
		);

		res.status(200).json({
			status: "success",
			message: "Notification preferences updated",
			data: {
				preferences: user.notificationPreferences,
			},
		});
	} catch (error) {
		console.error("Update preferences error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to update notification preferences",
		});
	}
};

// Get notification preferences
exports.getPreferences = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"notificationPreferences"
		);

		res.status(200).json({
			status: "success",
			data: {
				preferences: user.notificationPreferences || {
					email: true,
					push: true,
					categories: [
						"task",
						"meeting",
						"attendance",
						"feedback",
						"file",
						"system",
						"team",
					],
				},
			},
		});
	} catch (error) {
		console.error("Get preferences error:", error);
		res.status(500).json({
			status: "fail",
			message: "Failed to fetch notification preferences",
		});
	}
};

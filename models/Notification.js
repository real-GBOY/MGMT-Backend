/** @format */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		// Recipient of the notification
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		// Sender of the notification (optional for system notifications)
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},

		// Team context (optional for team-wide notifications)
		team: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			required: false,
		},

		// Notification type
		type: {
			type: String,
			required: true,
			enum: [
				"task_assigned",
				"task_completed",
				"task_overdue",
				"meeting_created",
				"meeting_reminder",
				"meeting_cancelled",
				"attendance_marked",
				"attendance_required",
				"feedback_submitted",
				"feedback_reviewed",
				"file_uploaded",
				"file_shared",
				"system_announcement",
				"role_changed",
				"team_joined",
				"team_left",
				"deadline_approaching",
				"general",
			],
			index: true,
		},

		// Priority level
		priority: {
			type: String,
			required: true,
			enum: ["low", "medium", "high", "urgent"],
			default: "medium",
		},

		// Notification title
		title: {
			type: String,
			required: true,
			maxlength: 200,
		},

		// Notification message
		message: {
			type: String,
			required: true,
			maxlength: 1000,
		},

		// Related resource (optional)
		relatedResource: {
			model: {
				type: String,
				enum: [
					"Task",
					"Meeting",
					"Attendance",
					"Feedback",
					"File",
					"User",
					"Team",
				],
			},
			id: {
				type: mongoose.Schema.Types.ObjectId,
			},
		},

		// Additional data for rich notifications
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},

		// Notification status
		status: {
			type: String,
			required: true,
			enum: ["unread", "read", "archived"],
			default: "unread",
			index: true,
		},

		// Read timestamp
		readAt: {
			type: Date,
			default: null,
		},

		// Scheduled notification (for future notifications)
		scheduledFor: {
			type: Date,
			default: null,
			index: true,
		},

		// Expiration date (for auto-archiving)
		expiresAt: {
			type: Date,
			default: null,
			index: true,
		},

		// Action buttons (for interactive notifications)
		actions: [
			{
				label: {
					type: String,
					required: true,
				},
				action: {
					type: String,
					required: true,
				},
				url: {
					type: String,
					required: false,
				},
			},
		],

		// Notification category for filtering
		category: {
			type: String,
			required: true,
			enum: [
				"task",
				"meeting",
				"attendance",
				"feedback",
				"file",
				"system",
				"team",
			],
			default: "general",
		},

		// Whether notification should be sent via email
		sendEmail: {
			type: Boolean,
			default: false,
		},

		// Whether notification should be sent via push notification
		sendPush: {
			type: Boolean,
			default: true,
		},

		// Email sent status
		emailSent: {
			type: Boolean,
			default: false,
		},

		// Push notification sent status
		pushSent: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes for better query performance
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ team: 1, status: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1, status: 1 });

// Virtual for checking if notification is expired
notificationSchema.virtual("isExpired").get(function () {
	if (!this.expiresAt) return false;
	return new Date() > this.expiresAt;
});

// Virtual for checking if notification is scheduled
notificationSchema.virtual("isScheduled").get(function () {
	if (!this.scheduledFor) return false;
	return new Date() < this.scheduledFor;
});

// Virtual for checking if notification can be sent
notificationSchema.virtual("canBeSent").get(function () {
	if (this.isExpired) return false;
	if (this.isScheduled) return false;
	return this.status === "unread";
});

// Pre-save middleware to set default expiration
notificationSchema.pre("save", function (next) {
	// Set default expiration to 30 days from creation
	if (!this.expiresAt) {
		this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	}
	next();
});

// Static method to create task assignment notification
notificationSchema.statics.createTaskAssignment = function (
	taskId,
	assigneeId,
	assignerId,
	taskTitle
) {
	return this.create({
		recipient: assigneeId,
		sender: assignerId,
		type: "task_assigned",
		priority: "medium",
		title: "New Task Assigned",
		message: `You have been assigned a new task: "${taskTitle}"`,
		relatedResource: {
			model: "Task",
			id: taskId,
		},
		category: "task",
		actions: [
			{
				label: "View Task",
				action: "view_task",
				url: `/tasks/${taskId}`,
			},
			{
				label: "Mark Complete",
				action: "complete_task",
				url: `/tasks/${taskId}/complete`,
			},
		],
	});
};

// Static method to create meeting reminder notification
notificationSchema.statics.createMeetingReminder = function (
	meetingId,
	attendeeId,
	meetingTitle,
	meetingTime
) {
	return this.create({
		recipient: attendeeId,
		type: "meeting_reminder",
		priority: "high",
		title: "Meeting Reminder",
		message: `Reminder: "${meetingTitle}" starts in 30 minutes`,
		relatedResource: {
			model: "Meeting",
			id: meetingId,
		},
		category: "meeting",
		scheduledFor: new Date(meetingTime.getTime() - 30 * 60 * 1000), // 30 minutes before
		actions: [
			{
				label: "Join Meeting",
				action: "join_meeting",
				url: `/meetings/${meetingId}/join`,
			},
			{
				label: "View Details",
				action: "view_meeting",
				url: `/meetings/${meetingId}`,
			},
		],
	});
};

// Static method to create system announcement
notificationSchema.statics.createSystemAnnouncement = function (
	recipientIds,
	title,
	message,
	priority = "medium"
) {
	const notifications = recipientIds.map((recipientId) => ({
		recipient: recipientId,
		type: "system_announcement",
		priority,
		title,
		message,
		category: "system",
		sendEmail: true,
	}));

	return this.insertMany(notifications);
};

// Static method to create team-wide notification
notificationSchema.statics.createTeamNotification = function (
	teamId,
	senderId,
	type,
	title,
	message,
	priority = "medium"
) {
	return this.create({
		team: teamId,
		sender: senderId,
		type,
		priority,
		title,
		message,
		category: "team",
	});
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
	this.status = "read";
	this.readAt = new Date();
	return this.save();
};

// Instance method to archive
notificationSchema.methods.archive = function () {
	this.status = "archived";
	return this.save();
};

// Instance method to reschedule
notificationSchema.methods.reschedule = function (newTime) {
	this.scheduledFor = newTime;
	this.status = "unread";
	return this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);

/** @format */

const Notification = require("../models/Notification");
const User = require("../models/Users");
const Team = require("../models/Team");

class NotificationService {
	/**
	 * Create a task assignment notification
	 */
	static async createTaskAssignmentNotification(
		taskId,
		assigneeId,
		assignerId,
		taskTitle
	) {
		try {
			await Notification.createTaskAssignment(
				taskId,
				assigneeId,
				assignerId,
				taskTitle
			);
			console.log(
				`Task assignment notification created for user ${assigneeId}`
			);
		} catch (error) {
			console.error("Error creating task assignment notification:", error);
		}
	}

	/**
	 * Create a task completion notification
	 */
	static async createTaskCompletionNotification(
		taskId,
		assigneeId,
		assignerId,
		taskTitle
	) {
		try {
			await Notification.create({
				recipient: assignerId,
				sender: assigneeId,
				type: "task_completed",
				priority: "medium",
				title: "Task Completed",
				message: `Task "${taskTitle}" has been marked as completed`,
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
				],
			});
			console.log(
				`Task completion notification created for user ${assignerId}`
			);
		} catch (error) {
			console.error("Error creating task completion notification:", error);
		}
	}

	/**
	 * Create a task overdue notification
	 */
	static async createTaskOverdueNotification(
		taskId,
		assigneeId,
		taskTitle,
		dueDate
	) {
		try {
			await Notification.create({
				recipient: assigneeId,
				type: "task_overdue",
				priority: "high",
				title: "Task Overdue",
				message: `Task "${taskTitle}" is overdue. Due date was ${dueDate.toLocaleDateString()}`,
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
			console.log(`Task overdue notification created for user ${assigneeId}`);
		} catch (error) {
			console.error("Error creating task overdue notification:", error);
		}
	}

	/**
	 * Create a meeting creation notification
	 */
	static async createMeetingNotification(
		meetingId,
		attendeeIds,
		creatorId,
		meetingTitle,
		meetingTime
	) {
		try {
			const notifications = attendeeIds.map((attendeeId) => ({
				recipient: attendeeId,
				sender: creatorId,
				type: "meeting_created",
				priority: "medium",
				title: "New Meeting Created",
				message: `You have been invited to "${meetingTitle}" on ${meetingTime.toLocaleDateString()} at ${meetingTime.toLocaleTimeString()}`,
				relatedResource: {
					model: "Meeting",
					id: meetingId,
				},
				category: "meeting",
				actions: [
					{
						label: "View Meeting",
						action: "view_meeting",
						url: `/meetings/${meetingId}`,
					},
					{
						label: "Join Meeting",
						action: "join_meeting",
						url: `/meetings/${meetingId}/join`,
					},
				],
			}));

			await Notification.insertMany(notifications);
			console.log(
				`Meeting notifications created for ${attendeeIds.length} attendees`
			);
		} catch (error) {
			console.error("Error creating meeting notifications:", error);
		}
	}

	/**
	 * Create meeting reminder notifications
	 */
	static async createMeetingReminders(
		meetingId,
		attendeeIds,
		meetingTitle,
		meetingTime
	) {
		try {
			const reminderTime = new Date(meetingTime.getTime() - 30 * 60 * 1000); // 30 minutes before

			const notifications = attendeeIds.map((attendeeId) => ({
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
				scheduledFor: reminderTime,
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
			}));

			await Notification.insertMany(notifications);
			console.log(
				`Meeting reminders scheduled for ${attendeeIds.length} attendees`
			);
		} catch (error) {
			console.error("Error creating meeting reminders:", error);
		}
	}

	/**
	 * Create attendance notification
	 */
	static async createAttendanceNotification(
		attendanceId,
		userId,
		teamHeadId,
		date,
		status
	) {
		try {
			await Notification.create({
				recipient: teamHeadId,
				sender: userId,
				type: "attendance_marked",
				priority: "low",
				title: "Attendance Marked",
				message: `Attendance marked as ${status} for ${date.toLocaleDateString()}`,
				relatedResource: {
					model: "Attendance",
					id: attendanceId,
				},
				category: "attendance",
				actions: [
					{
						label: "View Attendance",
						action: "view_attendance",
						url: `/attendance/${attendanceId}`,
					},
				],
			});
			console.log(
				`Attendance notification created for team head ${teamHeadId}`
			);
		} catch (error) {
			console.error("Error creating attendance notification:", error);
		}
	}

	/**
	 * Create feedback notification
	 */
	static async createFeedbackNotification(
		feedbackId,
		submitterId,
		reviewerId,
		feedbackTitle
	) {
		try {
			await Notification.create({
				recipient: reviewerId,
				sender: submitterId,
				type: "feedback_submitted",
				priority: "medium",
				title: "New Feedback Submitted",
				message: `New feedback submitted: "${feedbackTitle}"`,
				relatedResource: {
					model: "Feedback",
					id: feedbackId,
				},
				category: "feedback",
				actions: [
					{
						label: "Review Feedback",
						action: "review_feedback",
						url: `/feedback/${feedbackId}`,
					},
				],
			});
			console.log(`Feedback notification created for reviewer ${reviewerId}`);
		} catch (error) {
			console.error("Error creating feedback notification:", error);
		}
	}

	/**
	 * Create file upload notification
	 */
	static async createFileUploadNotification(
		fileId,
		uploaderId,
		teamId,
		fileName
	) {
		try {
			// Get team members
			const teamMembers = await User.find({
				team: teamId,
				_id: { $ne: uploaderId },
			}).select("_id");

			const notifications = teamMembers.map((member) => ({
				recipient: member._id,
				sender: uploaderId,
				type: "file_uploaded",
				priority: "low",
				title: "New File Uploaded",
				message: `New file "${fileName}" has been uploaded to the team folder`,
				relatedResource: {
					model: "File",
					id: fileId,
				},
				category: "file",
				team: teamId,
				actions: [
					{
						label: "View File",
						action: "view_file",
						url: `/files/${fileId}`,
					},
				],
			}));

			await Notification.insertMany(notifications);
			console.log(
				`File upload notifications created for ${teamMembers.length} team members`
			);
		} catch (error) {
			console.error("Error creating file upload notifications:", error);
		}
	}

	/**
	 * Create role change notification
	 */
	static async createRoleChangeNotification(userId, newRole, changedBy) {
		try {
			await Notification.create({
				recipient: userId,
				sender: changedBy,
				type: "role_changed",
				priority: "high",
				title: "Role Changed",
				message: `Your role has been changed to ${newRole}`,
				category: "system",
				actions: [
					{
						label: "View Profile",
						action: "view_profile",
						url: `/auth/profile`,
					},
				],
			});
			console.log(`Role change notification created for user ${userId}`);
		} catch (error) {
			console.error("Error creating role change notification:", error);
		}
	}

	/**
	 * Create team join notification
	 */
	static async createTeamJoinNotification(userId, teamId, teamName) {
		try {
			await Notification.create({
				recipient: userId,
				type: "team_joined",
				priority: "medium",
				title: "Welcome to Team",
				message: `Welcome to team "${teamName}"!`,
				relatedResource: {
					model: "Team",
					id: teamId,
				},
				category: "team",
				actions: [
					{
						label: "View Team",
						action: "view_team",
						url: `/teams/${teamId}`,
					},
				],
			});
			console.log(`Team join notification created for user ${userId}`);
		} catch (error) {
			console.error("Error creating team join notification:", error);
		}
	}

	/**
	 * Create deadline approaching notification
	 */
	static async createDeadlineNotification(
		taskId,
		assigneeId,
		taskTitle,
		dueDate
	) {
		try {
			const daysUntilDue = Math.ceil(
				(dueDate - new Date()) / (1000 * 60 * 60 * 24)
			);

			await Notification.create({
				recipient: assigneeId,
				type: "deadline_approaching",
				priority: daysUntilDue <= 1 ? "urgent" : "high",
				title: "Deadline Approaching",
				message: `Task "${taskTitle}" is due in ${daysUntilDue} day${
					daysUntilDue !== 1 ? "s" : ""
				}`,
				relatedResource: {
					model: "Task",
					id: taskId,
				},
				category: "general",
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
			console.log(`Deadline notification created for user ${assigneeId}`);
		} catch (error) {
			console.error("Error creating deadline notification:", error);
		}
	}

	/**
	 * Create system announcement
	 */
	static async createSystemAnnouncement(
		recipientIds,
		title,
		message,
		priority = "medium"
	) {
		try {
			const notifications = await Notification.createSystemAnnouncement(
				recipientIds,
				title,
				message,
				priority
			);
			console.log(`System announcement sent to ${notifications.length} users`);
			return notifications;
		} catch (error) {
			console.error("Error creating system announcement:", error);
			throw error;
		}
	}

	/**
	 * Create team-wide notification
	 */
	static async createTeamNotification(
		teamId,
		senderId,
		type,
		title,
		message,
		priority = "medium"
	) {
		try {
			await Notification.createTeamNotification(
				teamId,
				senderId,
				type,
				title,
				message,
				priority
			);
			console.log(`Team notification created for team ${teamId}`);
		} catch (error) {
			console.error("Error creating team notification:", error);
		}
	}

	/**
	 * Clean up expired notifications
	 */
	static async cleanupExpiredNotifications() {
		try {
			const result = await Notification.deleteMany({
				expiresAt: { $lt: new Date() },
			});
			console.log(`Cleaned up ${result.deletedCount} expired notifications`);
			return result.deletedCount;
		} catch (error) {
			console.error("Error cleaning up expired notifications:", error);
			throw error;
		}
	}

	/**
	 * Send scheduled notifications
	 */
	static async sendScheduledNotifications() {
		try {
			const scheduledNotifications = await Notification.find({
				scheduledFor: { $lte: new Date() },
				status: "unread",
			});

			console.log(
				`Found ${scheduledNotifications.length} scheduled notifications to send`
			);
			return scheduledNotifications;
		} catch (error) {
			console.error("Error sending scheduled notifications:", error);
			throw error;
		}
	}

	/**
	 * Get notification statistics for a user
	 */
	static async getUserNotificationStats(userId) {
		try {
			const stats = await Notification.aggregate([
				{
					$match: { recipient: userId },
				},
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
			]);

			const unreadCount = await Notification.countDocuments({
				recipient: userId,
				status: "unread",
			});

			return {
				statusCounts: stats.reduce((acc, stat) => {
					acc[stat._id] = stat.count;
					return acc;
				}, {}),
				unreadCount,
			};
		} catch (error) {
			console.error("Error getting user notification stats:", error);
			throw error;
		}
	}
}

module.exports = NotificationService;

/** @format */

const Meeting = require("../models/Meetings");
const User = require("../models/Users");
const Team = require("../models/Team");

// Create new meeting (only team leaders and vice heads)
exports.createMeeting = async (req, res) => {
	try {
		const {
			title,
			description,
			date,
			startTime,
			endTime,
			location,
			meetingType,
			team,
			attendees,
			agenda,
		} = req.body;

		// Get the user creating the meeting (should be set by auth middleware)
		const organizerId = req.user?._id;
		const organizer = await User.findById(organizerId);

		if (!organizer) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team_leader or vice_head can create meetings
		if (!["team_leader", "vice_head"].includes(organizer.role)) {
			return res.status(403).json({
				status: "fail",
				message: "Only team leaders or vice heads can create meetings",
			});
		}

		// Input validation
		if (
			!title ||
			!description ||
			!date ||
			!startTime ||
			!endTime ||
			!location ||
			!meetingType ||
			!team
		) {
			return res.status(400).json({
				status: "fail",
				message:
					"Title, description, date, startTime, endTime, location, meetingType, and team are required",
			});
		}

		// Check if team exists
		const teamExists = await Team.findById(team);
		if (!teamExists) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		// Ensure organizer is in the specified team
		if (!organizer.team.equals(team)) {
			return res.status(403).json({
				status: "fail",
				message: "You can only create meetings for your own team",
			});
		}

		// Validate time format and logic
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
			return res.status(400).json({
				status: "fail",
				message: "Invalid time format. Use HH:MM format",
			});
		}

		// Check if end time is after start time
		const start = new Date(`2000-01-01T${startTime}:00`);
		const end = new Date(`2000-01-01T${endTime}:00`);
		if (end <= start) {
			return res.status(400).json({
				status: "fail",
				message: "End time must be after start time",
			});
		}

		// Validate attendees if provided
		if (attendees && attendees.length > 0) {
			for (const attendee of attendees) {
				const user = await User.findById(attendee.user);
				if (!user) {
					return res.status(404).json({
						status: "fail",
						message: `User ${attendee.user} not found`,
					});
				}
				if (!user.team.equals(team)) {
					return res.status(400).json({
						status: "fail",
						message: `User ${user.firstName} ${user.lastName} is not in the specified team`,
					});
				}
			}
		}

		// Create meeting
		const newMeeting = await Meeting.create({
			title,
			description,
			date,
			startTime,
			endTime,
			location,
			meetingType,
			team,
			organizer: organizerId,
			attendees: attendees || [],
			agenda: agenda || [],
		});

		// Populate references
		const populatedMeeting = await Meeting.findById(newMeeting._id)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName");

		res.status(201).json({
			status: "success",
			data: {
				meeting: populatedMeeting,
			},
		});
	} catch (err) {
		console.error("Create meeting error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while creating meeting",
		});
	}
};

// Get all meetings
exports.getAllMeetings = async (req, res) => {
	try {
		const meetings = await Meeting.find()
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName")
			.sort({ date: 1, startTime: 1 });

		res.status(200).json({
			status: "success",
			results: meetings.length,
			data: {
				meetings,
			},
		});
	} catch (err) {
		console.error("Get meetings error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching meetings",
		});
	}
};

// Get single meeting
exports.getMeeting = async (req, res) => {
	try {
		const meeting = await Meeting.findById(req.params.id)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName")
			.populate("minutes.recordedBy", "firstName lastName")
			.populate("attachments.uploadedBy", "firstName lastName");

		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				meeting,
			},
		});
	} catch (err) {
		console.error("Get meeting error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching meeting",
		});
	}
};

// Update meeting (only organizer or team leaders)
exports.updateMeeting = async (req, res) => {
	try {
		const {
			title,
			description,
			date,
			startTime,
			endTime,
			location,
			meetingType,
			status,
		} = req.body;

		// Check if meeting exists
		const meeting = await Meeting.findById(req.params.id);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: organizer, team leader, or admin can update
		const canUpdate =
			meeting.organizer.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canUpdate) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the organizer, team leader, or admin can update this meeting",
			});
		}

		// Validate time if being updated
		if (startTime && endTime) {
			const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
			if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
				return res.status(400).json({
					status: "fail",
					message: "Invalid time format. Use HH:MM format",
				});
			}

			const start = new Date(`2000-01-01T${startTime}:00`);
			const end = new Date(`2000-01-01T${endTime}:00`);
			if (end <= start) {
				return res.status(400).json({
					status: "fail",
					message: "End time must be after start time",
				});
			}
		}

		// Update meeting
		const updatedMeeting = await Meeting.findByIdAndUpdate(
			req.params.id,
			{
				title,
				description,
				date,
				startTime,
				endTime,
				location,
				meetingType,
				status,
			},
			{ new: true, runValidators: true }
		)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				meeting: updatedMeeting,
			},
		});
	} catch (err) {
		console.error("Update meeting error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating meeting",
		});
	}
};

// Delete meeting (only organizer or team leaders)
exports.deleteMeeting = async (req, res) => {
	try {
		const meeting = await Meeting.findById(req.params.id);

		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: organizer, team leader, or admin can delete
		const canDelete =
			meeting.organizer.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canDelete) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the organizer, team leader, or admin can delete this meeting",
			});
		}

		await Meeting.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete meeting error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting meeting",
		});
	}
};

// Get meetings by team
exports.getMeetingsByTeam = async (req, res) => {
	try {
		const meetings = await Meeting.find({ team: req.params.teamId })
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName")
			.sort({ date: 1, startTime: 1 });

		res.status(200).json({
			status: "success",
			results: meetings.length,
			data: {
				meetings,
			},
		});
	} catch (err) {
		console.error("Get meetings by team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team meetings",
		});
	}
};

// Get meetings by status
exports.getMeetingsByStatus = async (req, res) => {
	try {
		const validStatuses = [
			"scheduled",
			"in_progress",
			"completed",
			"cancelled",
		];

		if (!validStatuses.includes(req.params.status)) {
			return res.status(400).json({
				status: "fail",
				message:
					"Invalid status. Must be scheduled, in_progress, completed, or cancelled",
			});
		}

		const meetings = await Meeting.find({ status: req.params.status })
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName")
			.sort({ date: 1, startTime: 1 });

		res.status(200).json({
			status: "success",
			results: meetings.length,
			data: {
				meetings,
			},
		});
	} catch (err) {
		console.error("Get meetings by status error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching meetings by status",
		});
	}
};

// Add attendee to meeting
exports.addAttendee = async (req, res) => {
	try {
		const { userId, status } = req.body;
		const meetingId = req.params.id;

		// Check if meeting exists
		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Check if user exists and is in the same team
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		if (!user.team.equals(meeting.team)) {
			return res.status(400).json({
				status: "fail",
				message: "User is not in the same team as the meeting",
			});
		}

		// Check if user is already an attendee
		const existingAttendee = meeting.attendees.find(
			(attendee) => attendee.user.toString() === userId
		);

		if (existingAttendee) {
			return res.status(400).json({
				status: "fail",
				message: "User is already an attendee",
			});
		}

		// Add attendee
		meeting.attendees.push({
			user: userId,
			status: status || "invited",
		});

		await meeting.save();

		const updatedMeeting = await Meeting.findById(meetingId)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				meeting: updatedMeeting,
			},
		});
	} catch (err) {
		console.error("Add attendee error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while adding attendee",
		});
	}
};

// Update attendee status
exports.updateAttendeeStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const { meetingId, userId } = req.params;

		const validStatuses = [
			"invited",
			"confirmed",
			"declined",
			"attended",
			"absent",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				status: "fail",
				message: "Invalid status",
			});
		}

		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		const attendee = meeting.attendees.find(
			(att) => att.user.toString() === userId
		);

		if (!attendee) {
			return res.status(404).json({
				status: "fail",
				message: "Attendee not found",
			});
		}

		attendee.status = status;
		attendee.responseDate = new Date();

		await meeting.save();

		const updatedMeeting = await Meeting.findById(meetingId)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				meeting: updatedMeeting,
			},
		});
	} catch (err) {
		console.error("Update attendee status error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating attendee status",
		});
	}
};

// Add agenda item
exports.addAgendaItem = async (req, res) => {
	try {
		const { item, description, duration, assignedTo } = req.body;
		const meetingId = req.params.id;

		if (!item) {
			return res.status(400).json({
				status: "fail",
				message: "Agenda item is required",
			});
		}

		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Check if assignedTo user exists and is in the same team
		if (assignedTo) {
			const user = await User.findById(assignedTo);
			if (!user || !user.team.equals(meeting.team)) {
				return res.status(400).json({
					status: "fail",
					message: "Assigned user not found or not in the same team",
				});
			}
		}

		meeting.agenda.push({
			item,
			description,
			duration,
			assignedTo,
		});

		await meeting.save();

		const updatedMeeting = await Meeting.findById(meetingId)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				meeting: updatedMeeting,
			},
		});
	} catch (err) {
		console.error("Add agenda item error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while adding agenda item",
		});
	}
};

// Record meeting minutes
exports.recordMinutes = async (req, res) => {
	try {
		const { content } = req.body;
		const meetingId = req.params.id;

		if (!content) {
			return res.status(400).json({
				status: "fail",
				message: "Minutes content is required",
			});
		}

		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only organizer, team leader, or admin can record minutes
		const canRecord =
			meeting.organizer.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canRecord) {
			return res.status(403).json({
				status: "fail",
				message: "Only the organizer, team leader, or admin can record minutes",
			});
		}

		meeting.minutes = {
			content,
			recordedBy: userId,
			recordedAt: new Date(),
		};

		await meeting.save();

		const updatedMeeting = await Meeting.findById(meetingId)
			.populate("team", "name")
			.populate("organizer", "firstName lastName email")
			.populate("attendees.user", "firstName lastName email")
			.populate("agenda.assignedTo", "firstName lastName")
			.populate("minutes.recordedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				meeting: updatedMeeting,
			},
		});
	} catch (err) {
		console.error("Record minutes error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while recording minutes",
		});
	}
};

// Get meeting statistics
exports.getMeetingStats = async (req, res) => {
	try {
		const totalMeetings = await Meeting.countDocuments();
		const scheduledMeetings = await Meeting.countDocuments({
			status: "scheduled",
		});
		const completedMeetings = await Meeting.countDocuments({
			status: "completed",
		});
		const cancelledMeetings = await Meeting.countDocuments({
			status: "cancelled",
		});

		// Meetings today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const todayMeetings = await Meeting.countDocuments({
			date: {
				$gte: today,
				$lt: tomorrow,
			},
		});

		// Upcoming meetings (next 7 days)
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		const upcomingMeetings = await Meeting.countDocuments({
			date: {
				$gte: tomorrow,
				$lte: nextWeek,
			},
			status: "scheduled",
		});

		res.status(200).json({
			status: "success",
			data: {
				totalMeetings,
				scheduledMeetings,
				completedMeetings,
				cancelledMeetings,
				todayMeetings,
				upcomingMeetings,
			},
		});
	} catch (err) {
		console.error("Get meeting stats error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching meeting statistics",
		});
	}
};

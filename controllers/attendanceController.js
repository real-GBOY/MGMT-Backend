/** @format */

const Attendance = require("../models/Attendance");
const Meeting = require("../models/Meetings");
const User = require("../models/Users");
const Team = require("../models/Team");

// Record attendance for a meeting
exports.recordAttendance = async (req, res) => {
	try {
		const {
			meetingId,
			userId,
			status,
			checkInTime,
			checkOutTime,
			notes,
			location,
			device,
		} = req.body;

		// Get the user recording attendance (should be set by auth middleware)
		const recordedById = req.user?._id;
		const recordedBy = await User.findById(recordedById);

		if (!recordedBy) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team_leader, vice_head, or admin can record attendance
		if (!["team_leader", "vice_head", "admin"].includes(recordedBy.role)) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only team leaders, vice heads, or admins can record attendance",
			});
		}

		// Input validation
		if (!meetingId || !userId || !status) {
			return res.status(400).json({
				status: "fail",
				message: "Meeting ID, user ID, and status are required",
			});
		}

		// Check if meeting exists
		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Check if user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		// Ensure user is in the same team as the meeting
		if (!user.team.equals(meeting.team)) {
			return res.status(400).json({
				status: "fail",
				message: "User is not in the same team as the meeting",
			});
		}

		// Ensure recorder is in the same team (unless admin)
		if (recordedBy.role !== "admin" && !recordedBy.team.equals(meeting.team)) {
			return res.status(403).json({
				status: "fail",
				message: "You can only record attendance for your own team meetings",
			});
		}

		// Check if attendance already exists
		const existingAttendance = await Attendance.findOne({
			meeting: meetingId,
			user: userId,
		});

		if (existingAttendance) {
			return res.status(400).json({
				status: "fail",
				message: "Attendance already recorded for this user and meeting",
			});
		}

		// Create attendance record
		const attendance = await Attendance.create({
			meeting: meetingId,
			user: userId,
			team: meeting.team,
			status,
			checkInTime: checkInTime || null,
			checkOutTime: checkOutTime || null,
			notes,
			recordedBy: recordedById,
			location,
			device,
		});

		// Populate references
		const populatedAttendance = await Attendance.findById(attendance._id)
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName");

		res.status(201).json({
			status: "success",
			data: {
				attendance: populatedAttendance,
			},
		});
	} catch (err) {
		console.error("Record attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while recording attendance",
		});
	}
};

// Bulk record attendance for multiple users
exports.bulkRecordAttendance = async (req, res) => {
	try {
		const { meetingId, attendances } = req.body;

		// Get the user recording attendance
		const recordedById = req.user?._id;
		const recordedBy = await User.findById(recordedById);

		if (!recordedBy) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team_leader, vice_head, or admin can record attendance
		if (!["team_leader", "vice_head", "admin"].includes(recordedBy.role)) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only team leaders, vice heads, or admins can record attendance",
			});
		}

		if (!meetingId || !attendances || !Array.isArray(attendances)) {
			return res.status(400).json({
				status: "fail",
				message: "Meeting ID and attendances array are required",
			});
		}

		// Check if meeting exists
		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Ensure recorder is in the same team (unless admin)
		if (recordedBy.role !== "admin" && !recordedBy.team.equals(meeting.team)) {
			return res.status(403).json({
				status: "fail",
				message: "You can only record attendance for your own team meetings",
			});
		}

		const attendanceRecords = [];
		const errors = [];

		for (const attendanceData of attendances) {
			try {
				const {
					userId,
					status,
					checkInTime,
					checkOutTime,
					notes,
					location,
					device,
				} = attendanceData;

				if (!userId || !status) {
					errors.push(`Missing required fields for user ${userId}`);
					continue;
				}

				// Check if user exists and is in the same team
				const user = await User.findById(userId);
				if (!user) {
					errors.push(`User ${userId} not found`);
					continue;
				}

				if (!user.team.equals(meeting.team)) {
					errors.push(
						`User ${user.firstName} ${user.lastName} is not in the same team`
					);
					continue;
				}

				// Check if attendance already exists
				const existingAttendance = await Attendance.findOne({
					meeting: meetingId,
					user: userId,
				});

				if (existingAttendance) {
					errors.push(
						`Attendance already recorded for user ${user.firstName} ${user.lastName}`
					);
					continue;
				}

				// Create attendance record
				const attendance = await Attendance.create({
					meeting: meetingId,
					user: userId,
					team: meeting.team,
					status,
					checkInTime: checkInTime || null,
					checkOutTime: checkOutTime || null,
					notes,
					recordedBy: recordedById,
					location,
					device,
				});

				attendanceRecords.push(attendance);
			} catch (error) {
				errors.push(
					`Error processing attendance for user ${attendanceData.userId}: ${error.message}`
				);
			}
		}

		// Populate references for successful records
		const populatedAttendances = await Attendance.find({
			_id: { $in: attendanceRecords.map((a) => a._id) },
		})
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName");

		res.status(201).json({
			status: "success",
			data: {
				attendances: populatedAttendances,
				successCount: attendanceRecords.length,
				errorCount: errors.length,
				errors: errors.length > 0 ? errors : undefined,
			},
		});
	} catch (err) {
		console.error("Bulk record attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while recording attendance",
		});
	}
};

// Get all attendance records
exports.getAllAttendance = async (req, res) => {
	try {
		const attendances = await Attendance.find()
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName")
			.sort({ attendanceDate: -1, createdAt: -1 });

		res.status(200).json({
			status: "success",
			results: attendances.length,
			data: {
				attendances,
			},
		});
	} catch (err) {
		console.error("Get attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching attendance",
		});
	}
};

// Get single attendance record
exports.getAttendance = async (req, res) => {
	try {
		const attendance = await Attendance.findById(req.params.id)
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName");

		if (!attendance) {
			return res.status(404).json({
				status: "fail",
				message: "Attendance record not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				attendance,
			},
		});
	} catch (err) {
		console.error("Get attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching attendance",
		});
	}
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
	try {
		const { status, checkInTime, checkOutTime, notes, location, device } =
			req.body;

		// Check if attendance exists
		const attendance = await Attendance.findById(req.params.id);
		if (!attendance) {
			return res.status(404).json({
				status: "fail",
				message: "Attendance record not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: recordedBy, team leader, or admin can update
		const canUpdate =
			attendance.recordedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canUpdate) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the recorder, team leader, or admin can update this attendance",
			});
		}

		// Update attendance
		const updatedAttendance = await Attendance.findByIdAndUpdate(
			req.params.id,
			{ status, checkInTime, checkOutTime, notes, location, device },
			{ new: true, runValidators: true }
		)
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				attendance: updatedAttendance,
			},
		});
	} catch (err) {
		console.error("Update attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating attendance",
		});
	}
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
	try {
		const attendance = await Attendance.findById(req.params.id);

		if (!attendance) {
			return res.status(404).json({
				status: "fail",
				message: "Attendance record not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: recordedBy, team leader, or admin can delete
		const canDelete =
			attendance.recordedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canDelete) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the recorder, team leader, or admin can delete this attendance",
			});
		}

		await Attendance.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting attendance",
		});
	}
};

// Get attendance by meeting
exports.getAttendanceByMeeting = async (req, res) => {
	try {
		const attendances = await Attendance.find({ meeting: req.params.meetingId })
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName")
			.sort({ createdAt: 1 });

		res.status(200).json({
			status: "success",
			results: attendances.length,
			data: {
				attendances,
			},
		});
	} catch (err) {
		console.error("Get attendance by meeting error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching meeting attendance",
		});
	}
};

// Get attendance by user
exports.getAttendanceByUser = async (req, res) => {
	try {
		const attendances = await Attendance.find({ user: req.params.userId })
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName")
			.sort({ attendanceDate: -1 });

		res.status(200).json({
			status: "success",
			results: attendances.length,
			data: {
				attendances,
			},
		});
	} catch (err) {
		console.error("Get attendance by user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching user attendance",
		});
	}
};

// Get attendance by team
exports.getAttendanceByTeam = async (req, res) => {
	try {
		const attendances = await Attendance.find({ team: req.params.teamId })
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName")
			.sort({ attendanceDate: -1 });

		res.status(200).json({
			status: "success",
			results: attendances.length,
			data: {
				attendances,
			},
		});
	} catch (err) {
		console.error("Get attendance by team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team attendance",
		});
	}
};

// Check-in for a meeting
exports.checkIn = async (req, res) => {
	try {
		const { meetingId, location, device } = req.body;
		const userId = req.user?._id;

		if (!userId) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		if (!meetingId) {
			return res.status(400).json({
				status: "fail",
				message: "Meeting ID is required",
			});
		}

		// Check if meeting exists
		const meeting = await Meeting.findById(meetingId);
		if (!meeting) {
			return res.status(404).json({
				status: "fail",
				message: "Meeting not found",
			});
		}

		// Check if user is in the meeting team
		const user = await User.findById(userId);
		if (!user.team.equals(meeting.team)) {
			return res.status(403).json({
				status: "fail",
				message: "You are not part of this meeting's team",
			});
		}

		// Check if attendance already exists
		let attendance = await Attendance.findOne({
			meeting: meetingId,
			user: userId,
		});

		const checkInTime = new Date();

		if (attendance) {
			// Update existing attendance
			attendance.checkInTime = checkInTime;
			attendance.location = location;
			attendance.device = device;
			await attendance.save();
		} else {
			// Create new attendance record
			attendance = await Attendance.create({
				meeting: meetingId,
				user: userId,
				team: meeting.team,
				status: "present",
				checkInTime,
				recordedBy: userId,
				location,
				device,
			});
		}

		// Populate references
		const populatedAttendance = await Attendance.findById(attendance._id)
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				attendance: populatedAttendance,
			},
		});
	} catch (err) {
		console.error("Check-in error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while checking in",
		});
	}
};

// Check-out from a meeting
exports.checkOut = async (req, res) => {
	try {
		const { meetingId } = req.body;
		const userId = req.user?._id;

		if (!userId) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		if (!meetingId) {
			return res.status(400).json({
				status: "fail",
				message: "Meeting ID is required",
			});
		}

		// Find attendance record
		const attendance = await Attendance.findOne({
			meeting: meetingId,
			user: userId,
		});

		if (!attendance) {
			return res.status(404).json({
				status: "fail",
				message: "No attendance record found for this meeting",
			});
		}

		// Update check-out time
		attendance.checkOutTime = new Date();
		await attendance.save();

		// Populate references
		const populatedAttendance = await Attendance.findById(attendance._id)
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				attendance: populatedAttendance,
			},
		});
	} catch (err) {
		console.error("Check-out error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while checking out",
		});
	}
};

// Verify attendance record
exports.verifyAttendance = async (req, res) => {
	try {
		const attendance = await Attendance.findById(req.params.id);

		if (!attendance) {
			return res.status(404).json({
				status: "fail",
				message: "Attendance record not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team leaders, vice heads, or admins can verify attendance
		if (!["team_leader", "vice_head", "admin"].includes(user.role)) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only team leaders, vice heads, or admins can verify attendance",
			});
		}

		// Update verification
		attendance.verified = true;
		attendance.verifiedBy = userId;
		attendance.verifiedAt = new Date();

		await attendance.save();

		// Populate references
		const populatedAttendance = await Attendance.findById(attendance._id)
			.populate("meeting", "title date startTime endTime")
			.populate("user", "firstName lastName email")
			.populate("team", "name")
			.populate("recordedBy", "firstName lastName")
			.populate("verifiedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				attendance: populatedAttendance,
			},
		});
	} catch (err) {
		console.error("Verify attendance error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while verifying attendance",
		});
	}
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
	try {
		const totalAttendance = await Attendance.countDocuments();
		const presentCount = await Attendance.countDocuments({ status: "present" });
		const absentCount = await Attendance.countDocuments({ status: "absent" });
		const lateCount = await Attendance.countDocuments({ status: "late" });
		const excusedCount = await Attendance.countDocuments({ status: "excused" });
		const leftEarlyCount = await Attendance.countDocuments({
			status: "left_early",
		});

		// Today's attendance
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const todayAttendance = await Attendance.countDocuments({
			attendanceDate: {
				$gte: today,
				$lt: tomorrow,
			},
		});

		// This week's attendance
		const startOfWeek = new Date(today);
		startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(endOfWeek.getDate() + 7);

		const weekAttendance = await Attendance.countDocuments({
			attendanceDate: {
				$gte: startOfWeek,
				$lt: endOfWeek,
			},
		});

		// Verified attendance
		const verifiedCount = await Attendance.countDocuments({ verified: true });
		const unverifiedCount = await Attendance.countDocuments({
			verified: false,
		});

		res.status(200).json({
			status: "success",
			data: {
				totalAttendance,
				presentCount,
				absentCount,
				lateCount,
				excusedCount,
				leftEarlyCount,
				todayAttendance,
				weekAttendance,
				verifiedCount,
				unverifiedCount,
				attendanceRate:
					totalAttendance > 0
						? Math.round((presentCount / totalAttendance) * 100)
						: 0,
			},
		});
	} catch (err) {
		console.error("Get attendance stats error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching attendance statistics",
		});
	}
};

/** @format */

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
	{
		meeting: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Meeting reference is required"],
			ref: "Meeting",
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "User reference is required"],
			ref: "User",
		},
		team: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Team reference is required"],
			ref: "Team",
		},
		status: {
			type: String,
			required: [true, "Attendance status is required"],
			enum: {
				values: ["present", "absent", "late", "excused", "left_early"],
				message: "Status must be present, absent, late, excused, or left_early",
			},
		},
		checkInTime: {
			type: Date,
			default: null,
		},
		checkOutTime: {
			type: Date,
			default: null,
		},
		lateMinutes: {
			type: Number,
			default: 0,
			min: [0, "Late minutes cannot be negative"],
		},
		earlyLeaveMinutes: {
			type: Number,
			default: 0,
			min: [0, "Early leave minutes cannot be negative"],
		},
		attendanceDate: {
			type: Date,
			required: [true, "Attendance date is required"],
			default: Date.now,
		},
		notes: {
			type: String,
			maxlength: [500, "Notes cannot exceed 500 characters"],
			trim: true,
		},
		recordedBy: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Recorded by user is required"],
			ref: "User",
		},
		verified: {
			type: Boolean,
			default: false,
		},
		verifiedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		verifiedAt: {
			type: Date,
		},
		location: {
			type: String,
			trim: true,
		},
		device: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

// Compound index for unique attendance per user per meeting
attendanceSchema.index({ meeting: 1, user: 1 }, { unique: true });

// Indexes for better performance
attendanceSchema.index({ team: 1, attendanceDate: 1 });
attendanceSchema.index({ user: 1, attendanceDate: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ meeting: 1 });

// Virtual for attendance duration
attendanceSchema.virtual("duration").get(function () {
	if (this.checkInTime && this.checkOutTime) {
		return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60)); // Duration in minutes
	}
	return 0;
});

// Virtual for attendance percentage
attendanceSchema.virtual("attendancePercentage").get(function () {
	if (this.status === "present") return 100;
	if (this.status === "late") return 75;
	if (this.status === "left_early") return 50;
	if (this.status === "excused") return 0;
	if (this.status === "absent") return 0;
	return 0;
});

// Ensure virtual fields are serialized
attendanceSchema.set("toJSON", { virtuals: true });
attendanceSchema.set("toObject", { virtuals: true });

// Pre-save middleware to calculate late/early minutes
attendanceSchema.pre("save", async function (next) {
	if (this.isModified("checkInTime") && this.checkInTime) {
		const meeting = await mongoose.model("Meeting").findById(this.meeting);
		if (meeting) {
			const meetingStartTime = new Date(meeting.date);
			const [hours, minutes] = meeting.startTime.split(":");
			meetingStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

			if (this.checkInTime > meetingStartTime) {
				this.lateMinutes = Math.round(
					(this.checkInTime - meetingStartTime) / (1000 * 60)
				);
			}
		}
	}

	if (this.isModified("checkOutTime") && this.checkOutTime) {
		const meeting = await mongoose.model("Meeting").findById(this.meeting);
		if (meeting) {
			const meetingEndTime = new Date(meeting.date);
			const [hours, minutes] = meeting.endTime.split(":");
			meetingEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

			if (this.checkOutTime < meetingEndTime) {
				this.earlyLeaveMinutes = Math.round(
					(meetingEndTime - this.checkOutTime) / (1000 * 60)
				);
			}
		}
	}

	next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);

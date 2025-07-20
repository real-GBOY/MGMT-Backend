/** @format */

const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Meeting title is required"],
			trim: true,
			maxlength: [100, "Title cannot exceed 100 characters"],
		},
		description: {
			type: String,
			required: [true, "Meeting description is required"],
			trim: true,
			maxlength: [500, "Description cannot exceed 500 characters"],
		},
		date: {
			type: Date,
			required: [true, "Meeting date is required"],
			validate: {
				validator: function (value) {
					return value > new Date();
				},
				message: "Meeting date must be in the future",
			},
		},
		startTime: {
			type: String,
			required: [true, "Start time is required"],
			match: [
				/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
				"Please enter a valid time format (HH:MM)",
			],
		},
		endTime: {
			type: String,
			required: [true, "End time is required"],
			match: [
				/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
				"Please enter a valid time format (HH:MM)",
			],
		},
		location: {
			type: String,
			required: [true, "Meeting location is required"],
			trim: true,
		},
		meetingType: {
			type: String,
			required: [true, "Meeting type is required"],
			enum: {
				values: [
					"team_meeting",
					"project_meeting",
					"general_assembly",
					"workshop",
					"presentation",
				],
				message:
					"Meeting type must be team_meeting, project_meeting, general_assembly, workshop, or presentation",
			},
		},
		status: {
			type: String,
			required: [true, "Meeting status is required"],
			enum: {
				values: ["scheduled", "in_progress", "completed", "cancelled"],
				message:
					"Status must be scheduled, in_progress, completed, or cancelled",
			},
			default: "scheduled",
		},
		team: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Meeting must belong to a team"],
			ref: "Team",
		},
		organizer: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Meeting organizer is required"],
			ref: "User",
		},
		attendees: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				status: {
					type: String,
					enum: ["invited", "confirmed", "declined", "attended", "absent"],
					default: "invited",
				},
				responseDate: {
					type: Date,
					default: Date.now,
				},
			},
		],
		agenda: [
			{
				item: {
					type: String,
					required: true,
				},
				description: String,
				duration: Number, // in minutes
				assignedTo: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			},
		],
		minutes: {
			content: String,
			recordedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			recordedAt: {
				type: Date,
				default: Date.now,
			},
		},
		attachments: [
			{
				fileName: String,
				fileUrl: String,
				uploadedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		reminderSent: {
			type: Boolean,
			default: false,
		},
		reminderDate: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
meetingSchema.index({ team: 1, date: 1 });
meetingSchema.index({ organizer: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ date: 1 });

// Virtual for meeting duration
meetingSchema.virtual("duration").get(function () {
	if (this.startTime && this.endTime) {
		const start = new Date(`2000-01-01T${this.startTime}:00`);
		const end = new Date(`2000-01-01T${this.endTime}:00`);
		return Math.round((end - start) / (1000 * 60)); // Duration in minutes
	}
	return 0;
});

// Ensure virtual fields are serialized
meetingSchema.set("toJSON", { virtuals: true });
meetingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Meeting", meetingSchema);

/** @format */

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Task title is required"],
			trim: true,
			maxlength: [100, "Title cannot exceed 100 characters"],
		},
		description: {
			type: String,
			required: [true, "Task description is required"],
			trim: true,
			maxlength: [500, "Description cannot exceed 500 characters"],
		},
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Task must be assigned to someone"],
			ref: "User",
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Task creator is required"],
			ref: "User",
		},
		status: {
			type: String,
			required: [true, "Task status is required"],
			enum: {
				values: ["pending", "in_progress", "completed", "cancelled"],
				message: "Status must be pending, in_progress, completed, or cancelled",
			},
			default: "pending",
		},
		dueDate: {
			type: Date,
			required: [true, "Due date is required"],
			validate: {
				validator: function (value) {
					return value > new Date();
				},
				message: "Due date must be in the future",
			},
		},
		// Team will be automatically determined from assignedTo user's team
		// No need to store team separately as it can be populated from assignedTo
	
		attachments: [
			{
				fileName: String,
				fileUrl: String,
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		comments: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				comment: String,
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Task", taskSchema);

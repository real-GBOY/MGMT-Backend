/** @format */

const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Feedback title is required"],
			trim: true,
			maxlength: [100, "Title cannot exceed 100 characters"],
		},
		content: {
			type: String,
			required: [true, "Feedback content is required"],
			trim: true,
			maxlength: [2000, "Content cannot exceed 2000 characters"],
		},
		category: {
			type: String,
			required: [true, "Feedback category is required"],
			enum: {
				values: [
					"general",
					"task",
					"meeting",
					"team",
					"project",
					"suggestion",
					"complaint",
					"appreciation",
				],
				message:
					"Category must be general, task, meeting, team, project, suggestion, complaint, or appreciation",
			},
		},
		type: {
			type: String,
			required: [true, "Feedback type is required"],
			enum: {
				values: ["positive", "negative", "neutral", "constructive"],
				message: "Type must be positive, negative, neutral, or constructive",
			},
		},
		rating: {
			type: Number,
			min: [1, "Rating must be at least 1"],
			max: [5, "Rating cannot exceed 5"],
			required: [true, "Rating is required"],
		},
		status: {
			type: String,
			required: [true, "Feedback status is required"],
			enum: {
				values: ["pending", "reviewed", "in_progress", "resolved", "closed"],
				message:
					"Status must be pending, reviewed, in_progress, resolved, or closed",
			},
			default: "pending",
		},
		priority: {
			type: String,
			required: [true, "Feedback priority is required"],
			enum: {
				values: ["low", "medium", "high", "urgent"],
				message: "Priority must be low, medium, high, or urgent",
			},
			default: "medium",
		},
		submittedBy: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Submitted by user is required"],
			ref: "User",
		},
		submittedFor: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Submitted for user/team is required"],
			ref: "User",
		},
		team: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Team reference is required"],
			ref: "Team",
		},
		relatedTask: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Task",
		},
		relatedMeeting: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Meeting",
		},
		relatedProject: {
			type: String,
			trim: true,
		},
		anonymous: {
			type: Boolean,
			default: false,
		},
		tags: [
			{
				type: String,
				trim: true,
				maxlength: [20, "Tag cannot exceed 20 characters"],
			},
		],
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
		reviewedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		reviewedAt: {
			type: Date,
		},
		reviewNotes: {
			type: String,
			maxlength: [1000, "Review notes cannot exceed 1000 characters"],
			trim: true,
		},
		resolvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		resolvedAt: {
			type: Date,
		},
		resolutionNotes: {
			type: String,
			maxlength: [1000, "Resolution notes cannot exceed 1000 characters"],
			trim: true,
		},
		response: {
			content: String,
			respondedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			respondedAt: {
				type: Date,
				default: Date.now,
			},
		},
		upvotes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		downvotes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		visibility: {
			type: String,
			required: [true, "Visibility is required"],
			enum: {
				values: ["public", "team", "private"],
				message: "Visibility must be public, team, or private",
			},
			default: "team",
		},
		submittedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
feedbackSchema.index({ team: 1, submittedAt: -1 });
feedbackSchema.index({ submittedBy: 1, submittedAt: -1 });
feedbackSchema.index({ submittedFor: 1, submittedAt: -1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ type: 1 });

// Virtual for vote count
feedbackSchema.virtual("voteCount").get(function () {
	return this.upvotes.length - this.downvotes.length;
});

// Virtual for total votes
feedbackSchema.virtual("totalVotes").get(function () {
	return this.upvotes.length + this.downvotes.length;
});

// Virtual for average rating
feedbackSchema.virtual("averageRating").get(function () {
	return this.rating;
});

// Ensure virtual fields are serialized
feedbackSchema.set("toJSON", { virtuals: true });
feedbackSchema.set("toObject", { virtuals: true });

// Pre-save middleware to set reviewedAt when status changes
feedbackSchema.pre("save", function (next) {
	if (
		this.isModified("status") &&
		this.status === "reviewed" &&
		!this.reviewedAt
	) {
		this.reviewedAt = new Date();
	}
	if (
		this.isModified("status") &&
		this.status === "resolved" &&
		!this.resolvedAt
	) {
		this.resolvedAt = new Date();
	}
	next();
});

module.exports = mongoose.model("Feedback", feedbackSchema);

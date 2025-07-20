/** @format */

const Feedback = require("../models/Feedback");
const User = require("../models/Users");
const Team = require("../models/Team");
const Task = require("../models/Tasks");
const Meeting = require("../models/Meetings");

// Submit new feedback
exports.submitFeedback = async (req, res) => {
	try {
		const {
			title,
			content,
			category,
			type,
			rating,
			priority,
			submittedFor,
			relatedTask,
			relatedMeeting,
			relatedProject,
			anonymous,
			tags,
			visibility,
		} = req.body;

		// Get the user submitting feedback (should be set by auth middleware)
		const submittedById = req.user?._id;
		const submittedBy = await User.findById(submittedById);

		if (!submittedBy) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Input validation
		if (!title || !content || !category || !type || !rating || !submittedFor) {
			return res.status(400).json({
				status: "fail",
				message:
					"Title, content, category, type, rating, and submittedFor are required",
			});
		}

		// Validate rating
		if (rating < 1 || rating > 5) {
			return res.status(400).json({
				status: "fail",
				message: "Rating must be between 1 and 5",
			});
		}

		// Check if submittedFor user exists
		const submittedForUser = await User.findById(submittedFor);
		if (!submittedForUser) {
			return res.status(404).json({
				status: "fail",
				message: "User to submit feedback for not found",
			});
		}

		// Ensure both users are in the same team
		if (!submittedBy.team.equals(submittedForUser.team)) {
			return res.status(403).json({
				status: "fail",
				message: "You can only submit feedback for users in your team",
			});
		}

		// Validate related task if provided
		if (relatedTask) {
			const task = await Task.findById(relatedTask);
			if (!task) {
				return res.status(404).json({
					status: "fail",
					message: "Related task not found",
				});
			}
		}

		// Validate related meeting if provided
		if (relatedMeeting) {
			const meeting = await Meeting.findById(relatedMeeting);
			if (!meeting) {
				return res.status(404).json({
					status: "fail",
					message: "Related meeting not found",
				});
			}
		}

		// Create feedback
		const feedback = await Feedback.create({
			title,
			content,
			category,
			type,
			rating,
			priority: priority || "medium",
			submittedBy: submittedById,
			submittedFor,
			team: submittedBy.team,
			relatedTask,
			relatedMeeting,
			relatedProject,
			anonymous: anonymous || false,
			tags: tags || [],
			visibility: visibility || "team",
		});

		// Populate references
		const populatedFeedback = await Feedback.findById(feedback._id)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title");

		res.status(201).json({
			status: "success",
			data: {
				feedback: populatedFeedback,
			},
		});
	} catch (err) {
		console.error("Submit feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while submitting feedback",
		});
	}
};

// Get all feedback
exports.getAllFeedback = async (req, res) => {
	try {
		const { category, type, status, priority, team } = req.query;

		// Build filter object
		const filter = {};

		if (category) filter.category = category;
		if (type) filter.type = type;
		if (status) filter.status = status;
		if (priority) filter.priority = priority;
		if (team) filter.team = team;

		const feedback = await Feedback.find(filter)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("reviewedBy", "firstName lastName")
			.populate("resolvedBy", "firstName lastName")
			.populate("response.respondedBy", "firstName lastName")
			.sort({ submittedAt: -1 });

		res.status(200).json({
			status: "success",
			results: feedback.length,
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Get feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching feedback",
		});
	}
};

// Get single feedback
exports.getFeedback = async (req, res) => {
	try {
		const feedback = await Feedback.findById(req.params.id)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("reviewedBy", "firstName lastName")
			.populate("resolvedBy", "firstName lastName")
			.populate("response.respondedBy", "firstName lastName")
			.populate("upvotes", "firstName lastName")
			.populate("downvotes", "firstName lastName");

		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Get feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching feedback",
		});
	}
};

// Update feedback
exports.updateFeedback = async (req, res) => {
	try {
		const {
			title,
			content,
			category,
			type,
			rating,
			priority,
			tags,
			visibility,
		} = req.body;

		// Check if feedback exists
		const feedback = await Feedback.findById(req.params.id);
		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: submittedBy, team leader, or admin can update
		const canUpdate =
			feedback.submittedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canUpdate) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the submitter, team leader, or admin can update this feedback",
			});
		}

		// Update feedback
		const updatedFeedback = await Feedback.findByIdAndUpdate(
			req.params.id,
			{ title, content, category, type, rating, priority, tags, visibility },
			{ new: true, runValidators: true }
		)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title");

		res.status(200).json({
			status: "success",
			data: {
				feedback: updatedFeedback,
			},
		});
	} catch (err) {
		console.error("Update feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating feedback",
		});
	}
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
	try {
		const feedback = await Feedback.findById(req.params.id);

		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: submittedBy, team leader, or admin can delete
		const canDelete =
			feedback.submittedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canDelete) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the submitter, team leader, or admin can delete this feedback",
			});
		}

		await Feedback.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting feedback",
		});
	}
};

// Get feedback by team
exports.getFeedbackByTeam = async (req, res) => {
	try {
		const feedback = await Feedback.find({ team: req.params.teamId })
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("reviewedBy", "firstName lastName")
			.populate("resolvedBy", "firstName lastName")
			.populate("response.respondedBy", "firstName lastName")
			.sort({ submittedAt: -1 });

		res.status(200).json({
			status: "success",
			results: feedback.length,
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Get feedback by team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team feedback",
		});
	}
};

// Get feedback by user (submitted by)
exports.getFeedbackByUser = async (req, res) => {
	try {
		const feedback = await Feedback.find({ submittedBy: req.params.userId })
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("reviewedBy", "firstName lastName")
			.populate("resolvedBy", "firstName lastName")
			.populate("response.respondedBy", "firstName lastName")
			.sort({ submittedAt: -1 });

		res.status(200).json({
			status: "success",
			results: feedback.length,
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Get feedback by user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching user feedback",
		});
	}
};

// Get feedback for user (submitted for)
exports.getFeedbackForUser = async (req, res) => {
	try {
		const feedback = await Feedback.find({ submittedFor: req.params.userId })
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("reviewedBy", "firstName lastName")
			.populate("resolvedBy", "firstName lastName")
			.populate("response.respondedBy", "firstName lastName")
			.sort({ submittedAt: -1 });

		res.status(200).json({
			status: "success",
			results: feedback.length,
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Get feedback for user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching feedback for user",
		});
	}
};

// Review feedback (team leaders and admins)
exports.reviewFeedback = async (req, res) => {
	try {
		const { status, reviewNotes } = req.body;

		const feedback = await Feedback.findById(req.params.id);
		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team leaders and admins can review feedback
		if (!["team_leader", "admin"].includes(user.role)) {
			return res.status(403).json({
				status: "fail",
				message: "Only team leaders or admins can review feedback",
			});
		}

		// Update feedback status and review info
		feedback.status = status;
		feedback.reviewedBy = userId;
		feedback.reviewedAt = new Date();
		feedback.reviewNotes = reviewNotes;

		await feedback.save();

		// Populate references
		const populatedFeedback = await Feedback.findById(feedback._id)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("reviewedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				feedback: populatedFeedback,
			},
		});
	} catch (err) {
		console.error("Review feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while reviewing feedback",
		});
	}
};

// Resolve feedback (team leaders and admins)
exports.resolveFeedback = async (req, res) => {
	try {
		const { resolutionNotes } = req.body;

		const feedback = await Feedback.findById(req.params.id);
		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team leaders and admins can resolve feedback
		if (!["team_leader", "admin"].includes(user.role)) {
			return res.status(403).json({
				status: "fail",
				message: "Only team leaders or admins can resolve feedback",
			});
		}

		// Update feedback status and resolution info
		feedback.status = "resolved";
		feedback.resolvedBy = userId;
		feedback.resolvedAt = new Date();
		feedback.resolutionNotes = resolutionNotes;

		await feedback.save();

		// Populate references
		const populatedFeedback = await Feedback.findById(feedback._id)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("resolvedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				feedback: populatedFeedback,
			},
		});
	} catch (err) {
		console.error("Resolve feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while resolving feedback",
		});
	}
};

// Respond to feedback
exports.respondToFeedback = async (req, res) => {
	try {
		const { content } = req.body;

		if (!content) {
			return res.status(400).json({
				status: "fail",
				message: "Response content is required",
			});
		}

		const feedback = await Feedback.findById(req.params.id);
		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only the person the feedback is for, team leaders, or admins can respond
		const canRespond =
			feedback.submittedFor.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canRespond) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the feedback recipient, team leader, or admin can respond",
			});
		}

		// Update feedback response
		feedback.response = {
			content,
			respondedBy: userId,
			respondedAt: new Date(),
		};

		await feedback.save();

		// Populate references
		const populatedFeedback = await Feedback.findById(feedback._id)
			.populate("submittedBy", "firstName lastName email")
			.populate("submittedFor", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("response.respondedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				feedback: populatedFeedback,
			},
		});
	} catch (err) {
		console.error("Respond to feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while responding to feedback",
		});
	}
};

// Upvote feedback
exports.upvoteFeedback = async (req, res) => {
	try {
		const feedback = await Feedback.findById(req.params.id);
		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		const userId = req.user?._id;
		if (!userId) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Remove from downvotes if exists
		feedback.downvotes = feedback.downvotes.filter(
			(vote) => !vote.equals(userId)
		);

		// Add to upvotes if not already there
		if (!feedback.upvotes.includes(userId)) {
			feedback.upvotes.push(userId);
		}

		await feedback.save();

		res.status(200).json({
			status: "success",
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Upvote feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while upvoting feedback",
		});
	}
};

// Downvote feedback
exports.downvoteFeedback = async (req, res) => {
	try {
		const feedback = await Feedback.findById(req.params.id);
		if (!feedback) {
			return res.status(404).json({
				status: "fail",
				message: "Feedback not found",
			});
		}

		const userId = req.user?._id;
		if (!userId) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Remove from upvotes if exists
		feedback.upvotes = feedback.upvotes.filter((vote) => !vote.equals(userId));

		// Add to downvotes if not already there
		if (!feedback.downvotes.includes(userId)) {
			feedback.downvotes.push(userId);
		}

		await feedback.save();

		res.status(200).json({
			status: "success",
			data: {
				feedback,
			},
		});
	} catch (err) {
		console.error("Downvote feedback error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while downvoting feedback",
		});
	}
};

// Get feedback statistics
exports.getFeedbackStats = async (req, res) => {
	try {
		const totalFeedback = await Feedback.countDocuments();
		const pendingFeedback = await Feedback.countDocuments({
			status: "pending",
		});
		const reviewedFeedback = await Feedback.countDocuments({
			status: "reviewed",
		});
		const resolvedFeedback = await Feedback.countDocuments({
			status: "resolved",
		});
		const closedFeedback = await Feedback.countDocuments({ status: "closed" });

		// Feedback by type
		const positiveFeedback = await Feedback.countDocuments({
			type: "positive",
		});
		const negativeFeedback = await Feedback.countDocuments({
			type: "negative",
		});
		const neutralFeedback = await Feedback.countDocuments({ type: "neutral" });
		const constructiveFeedback = await Feedback.countDocuments({
			type: "constructive",
		});

		// Feedback by category
		const categoryStats = await Feedback.aggregate([
			{
				$group: {
					_id: "$category",
					count: { $sum: 1 },
				},
			},
		]);

		// Average rating
		const ratingStats = await Feedback.aggregate([
			{
				$group: {
					_id: null,
					averageRating: { $avg: "$rating" },
					totalRatings: { $sum: 1 },
				},
			},
		]);

		// This month's feedback
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const monthFeedback = await Feedback.countDocuments({
			submittedAt: { $gte: startOfMonth },
		});

		res.status(200).json({
			status: "success",
			data: {
				totalFeedback,
				pendingFeedback,
				reviewedFeedback,
				resolvedFeedback,
				closedFeedback,
				positiveFeedback,
				negativeFeedback,
				neutralFeedback,
				constructiveFeedback,
				categoryStats,
				averageRating: ratingStats[0]?.averageRating || 0,
				totalRatings: ratingStats[0]?.totalRatings || 0,
				monthFeedback,
			},
		});
	} catch (err) {
		console.error("Get feedback stats error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching feedback statistics",
		});
	}
};

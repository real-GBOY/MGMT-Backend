/** @format */

const express = require("express");
const feedbackController = require("../controllers/feedbackController");

const router = express.Router();

// Get all feedback
router.get("/", feedbackController.getAllFeedback);

// Get feedback statistics
router.get("/stats", feedbackController.getFeedbackStats);

// Get feedback by team
router.get("/team/:teamId", feedbackController.getFeedbackByTeam);

// Get feedback by user (submitted by)
router.get("/user/:userId", feedbackController.getFeedbackByUser);

// Get feedback for user (submitted for)
router.get("/for/:userId", feedbackController.getFeedbackForUser);

// Submit new feedback
router.post("/", feedbackController.submitFeedback);

// Get single feedback
router.get("/:id", feedbackController.getFeedback);

// Update feedback
router.patch("/:id", feedbackController.updateFeedback);

// Delete feedback
router.delete("/:id", feedbackController.deleteFeedback);

// Review feedback
router.patch("/:id/review", feedbackController.reviewFeedback);

// Resolve feedback
router.patch("/:id/resolve", feedbackController.resolveFeedback);

// Respond to feedback
router.post("/:id/respond", feedbackController.respondToFeedback);

// Upvote feedback
router.post("/:id/upvote", feedbackController.upvoteFeedback);

// Downvote feedback
router.post("/:id/downvote", feedbackController.downvoteFeedback);

module.exports = router;

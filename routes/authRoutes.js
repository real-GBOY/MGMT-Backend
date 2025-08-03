/** @format */

const express = require("express");
const authController = require("../controllers/authController");
const { fileUploadSecurity } = require("../middlewares/security");
const upload = require("../middlewares/upload");

const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
	if (error) {
		console.error("Upload error:", error);
		return res.status(400).json({
			status: "fail",
			message: error.message || "File upload failed",
		});
	}
	next();
};

// Test route to check if server is working
router.get("/test", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Auth routes are working",
	});
});

// Get teams for registration form
router.get("/teams", authController.getTeamsForRegistration);

// Register route
router.post(
	"/register",
	upload.single("profilePicture"),
	fileUploadSecurity,
	handleMulterError,
	authController.register
);

// Login route
router.post("/login", authController.login);

// Refresh token
router.post("/refresh", authController.refreshToken);

// Logout user
router.post("/logout", authController.logout);

// Get current user profile (protected)
router.get("/profile", authController.getProfile);

// Update user profile (protected)
router.patch(
	"/profile",
	upload.single("profilePicture"),
	handleMulterError,
	authController.updateProfile
);

// Change password (protected)
router.patch("/change-password", authController.changePassword);

module.exports = router;

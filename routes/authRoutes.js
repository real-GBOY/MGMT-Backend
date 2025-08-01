/** @format */

const express = require("express");
const multer = require("multer");
const authController = require("../controllers/authController");
const { fileUploadSecurity } = require("../middlewares/security");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only image files
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"), false);
		}
	},
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({
				status: "fail",
				message: "File size too large. Maximum size is 5MB",
			});
		}
		return res.status(400).json({
			status: "fail",
			message: error.message,
		});
	} else if (error) {
		return res.status(400).json({
			status: "fail",
			message: error.message,
		});
	}
	next();
};

// Debug middleware to log request details
const debugRequest = (req, res, next) => {
	console.log("=== Request Debug Info ===");
	console.log("Headers:", req.headers);
	console.log("Body:", req.body);
	console.log("Files:", req.files);
	console.log("File:", req.file);
	console.log("==========================");
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
	debugRequest,
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

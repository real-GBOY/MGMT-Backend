/** @format */

const bcrypt = require("bcryptjs");
const cloudinary = require("../utils/cloudinary");
const User = require("../models/Users");
const Team = require("../models/Team");
const { generateTokenPair, refreshAccessToken } = require("../utils/jwt");

exports.register = async (req, res) => {
	try {
		console.log("=== Controller Debug ===");
		console.log("Request body:", req.body);
		console.log("Request file:", req.file);
		console.log("Request files:", req.files);
		console.log("========================");

		const {
			firstName,
			lastName,
			nationalID,
			dateOfBirth,
			email,
			password,
			phoneNumber,
			team,
			role,
		} = req.body;

		// Input validation
		if (
			!firstName ||
			!lastName ||
			!nationalID ||
			!email ||
			!password ||
			!phoneNumber ||
			!role
		) {
			return res.status(400).json({
				status: "fail",
				message:
					"Required fields: firstName, lastName, nationalID, email, password, phoneNumber, role",
			});
		}

		// Validate role
		const validRoles = ["admin", "team_leader", "vice_head", "member"];
		if (!validRoles.includes(role)) {
			return res.status(400).json({
				status: "fail",
				message: "Role must be one of: admin, team_leader, vice_head, member",
			});
		}

		// Profile picture is optional for testing
		if (!req.file) {
			console.log("No profile picture provided, using default");
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				status: "fail",
				message: "User with this email already exists",
			});
		}

		// Upload image to Cloudinary if provided
		let cloudinaryResult = null;
		if (req.file) {
			const uploadPromise = new Promise((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						folder: "profiles",
						resource_type: "image",
						transformation: [{ width: 300, height: 300, crop: "fill" }],
					},
					(error, result) => {
						if (error) {
							reject(error);
						} else {
							resolve(result);
						}
					}
				);

				// Pipe the buffer to the upload stream
				uploadStream.end(req.file.buffer);
			});

			cloudinaryResult = await uploadPromise;
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const userData = {
			firstName,
			lastName,
			nationalID,
			email,
			password: hashedPassword,
			phoneNumber,
			role,
		};

		// Add optional fields if provided
		if (dateOfBirth) {
			userData.dateOfBirth = new Date(dateOfBirth);
		}
		if (team) {
			userData.team = team;
		}
		if (cloudinaryResult) {
			userData.profilePicture = cloudinaryResult.secure_url;
		} else {
			// Set a default profile picture URL
			userData.profilePicture =
				"https://res.cloudinary.com/your-cloud-name/image/upload/v1/profiles/default-avatar.png";
		}

		const newUser = await User.create(userData);

		// Generate JWT tokens for the new user
		const tokens = generateTokenPair(newUser._id, newUser.role, newUser.team);

		// Set token in cookie (optional)
		res.cookie("token", tokens.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(201).json({
			status: "success",
			message: "User registered successfully",
			data: {
				user: {
					id: newUser._id,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					email: newUser.email,
					role: newUser.role,
					profilePicture: newUser.profilePicture || null,
				},
				token: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			},
		});
	} catch (err) {
		console.error("Registration error:", err);
		console.error("Error stack:", err.stack);

		// More specific error messages
		if (err.name === "ValidationError") {
			return res.status(400).json({
				status: "fail",
				message: "Validation error",
				details: err.message,
			});
		}

		if (err.name === "MongoError" && err.code === 11000) {
			return res.status(400).json({
				status: "fail",
				message: "Duplicate field value",
				details: "A user with this email or national ID already exists",
			});
		}

		res.status(500).json({
			status: "fail",
			message: "Server error during registration",
			details: process.env.NODE_ENV === "development" ? err.message : undefined,
		});
	}
};

// Login user
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Input validation
		if (!email || !password) {
			return res.status(400).json({
				status: "fail",
				message: "Email and password are required",
			});
		}

		// Find user by email
		const user = await User.findOne({ email }).select("+password");
		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid email or password",
			});
		}

		// Check password
		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid email or password",
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(401).json({
				status: "fail",
				message: "Account is deactivated. Please contact administrator.",
			});
		}

		// Generate JWT tokens
		const tokens = generateTokenPair(user._id, user.role, user.team);

		// Remove password from response
		user.password = undefined;

		// Set token in cookie (optional)
		res.cookie("token", tokens.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(200).json({
			status: "success",
			data: {
				user,
				tokens,
			},
		});
	} catch (err) {
		console.error("Login error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error during login",
		});
	}
};

// Refresh token
exports.refreshToken = async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({
				status: "fail",
				message: "Refresh token is required",
			});
		}

		// Refresh the access token
		const newTokens = refreshAccessToken(refreshToken);

		// Set new token in cookie
		res.cookie("token", newTokens.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(200).json({
			status: "success",
			data: {
				tokens: newTokens,
			},
		});
	} catch (err) {
		console.error("Token refresh error:", err);
		res.status(401).json({
			status: "fail",
			message: err.message || "Invalid refresh token",
		});
	}
};

// Logout user
exports.logout = async (req, res) => {
	try {
		// Clear token from cookies
		res.clearCookie("token");

		res.status(200).json({
			status: "success",
			message: "Logged out successfully",
		});
	} catch (err) {
		console.error("Logout error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error during logout",
		});
	}
};

// Get current user profile
exports.getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id)
			.select("-password")
			.populate("team", "name");

		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				user,
			},
		});
	} catch (err) {
		console.error("Get profile error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching profile",
		});
	}
};

// Update user profile
exports.updateProfile = async (req, res) => {
	try {
		const { firstName, lastName, phoneNumber, dateOfBirth } = req.body;

		// Build update object
		const updateData = {};
		if (firstName) updateData.firstName = firstName;
		if (lastName) updateData.lastName = lastName;
		if (phoneNumber) updateData.phoneNumber = phoneNumber;
		if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

		// Handle profile picture upload if provided
		if (req.file) {
			const uploadPromise = new Promise((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						folder: "profiles",
						resource_type: "image",
						transformation: [{ width: 300, height: 300, crop: "fill" }],
					},
					(error, result) => {
						if (error) {
							reject(error);
						} else {
							resolve(result);
						}
					}
				);

				uploadStream.end(req.file.buffer);
			});

			const cloudinaryResult = await uploadPromise;
			updateData.profilePicture = cloudinaryResult.secure_url;
		}

		// Update user
		const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
			new: true,
			runValidators: true,
		})
			.select("-password")
			.populate("team", "name");

		res.status(200).json({
			status: "success",
			data: {
				user: updatedUser,
			},
		});
	} catch (err) {
		console.error("Update profile error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating profile",
		});
	}
};

// Change password
exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				status: "fail",
				message: "Current password and new password are required",
			});
		}

		// Get user with password
		const user = await User.findById(req.user._id).select("+password");

		// Verify current password
		const isCurrentPasswordCorrect = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isCurrentPasswordCorrect) {
			return res.status(400).json({
				status: "fail",
				message: "Current password is incorrect",
			});
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 12);

		// Update password
		user.password = hashedNewPassword;
		await user.save();

		res.status(200).json({
			status: "success",
			message: "Password changed successfully",
		});
	} catch (err) {
		console.error("Change password error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while changing password",
		});
	}
};

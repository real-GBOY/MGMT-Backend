/** @format */

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const cloudinary = require("../utils/cloudinary");
const User = require("../models/Users");
const Team = require("../models/Team");
const { generateTokenPair, refreshAccessToken } = require("../utils/jwt");

exports.register = async (req, res) => {
	try {
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

		// Check if user already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { nationalID }],
		});

		if (existingUser) {
			return res.status(400).json({
				status: "fail",
				message:
					existingUser.email === email
						? "Email already registered"
						: "National ID already registered",
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Prepare user data
		const userData = {
			firstName,
			lastName,
			nationalID,
			email,
			password: hashedPassword,
			phoneNumber,
			role,
		};

		if (dateOfBirth) userData.dateOfBirth = dateOfBirth;

		// Handle team assignment (by ID or name)
		if (team) {
			if (mongoose.Types.ObjectId.isValid(team)) {
				userData.team = team;
			} else {
				const teamDoc = await Team.findOne({ name: team });
				if (teamDoc) {
					userData.team = teamDoc._id;
				} else {
					return res.status(400).json({
						status: "fail",
						message: `Team "${team}" not found`,
					});
				}
			}
		}

		// Handle profile picture upload URL from multer + cloudinary
		if (req.file && req.file.path) {
			userData.profilePicture = req.file.path; // Cloudinary URL from multer-storage-cloudinary
		} else {
			// Default avatar if no file uploaded - use UI Avatars service
			const userName = `${firstName} ${lastName}`.trim();
			userData.profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
				userName
			)}&background=random&color=fff&size=200`;
		}

		// Create user
		const newUser = await User.create(userData);

		// Send response (exclude password)
		const userResponse = newUser.toObject();
		delete userResponse.password;

		res.status(201).json({
			status: "success",
			message: "User registered successfully",
			data: {
				user: userResponse,
			},
			token: generateTokenPair(newUser._id),
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			status: "fail",
			message: "Server error during registration",
		});
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find user by email
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid email or password",
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(401).json({
				status: "fail",
				message: "Account is deactivated",
			});
		}

		// Verify password
		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid email or password",
			});
		}

		// Send response (exclude password)
		const userResponse = user.toObject();
		delete userResponse.password;

		res.status(200).json({
			status: "success",
			data: { user: userResponse },
			token: generateTokenPair(user._id),
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
		if (req.file && req.file.path) {
			updateData.profilePicture = req.file.path; // Cloudinary URL from multer-storage-cloudinary
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

// Get all teams for registration form
exports.getTeamsForRegistration = async (req, res) => {
	try {
		const teams = await Team.find().select("name description");

		res.status(200).json({
			status: "success",
			data: {
				teams: teams.map((team) => ({
					id: team._id,
					name: team.name,
					description: team.description,
				})),
			},
		});
	} catch (err) {
		console.error("Get teams for registration error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching teams",
		});
	}
};

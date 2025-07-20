/** @format */

const User = require("../models/Users");
const Team = require("../models/Team");

// Get all users
exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.find()
			.select("firstName lastName email role profilePicture team createdAt")
			.populate("team", "name");

		res.status(200).json({
			status: "success",
			results: users.length,
			data: {
				users,
			},
		});
	} catch (err) {
		console.error("Get users error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching users",
		});
	}
};

// Get single user
exports.getUser = async (req, res) => {
	try {
		const user = await User.findById(req.params.id)
			.select("-password")
			.populate("team", "name description");

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
		console.error("Get user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching user",
		});
	}
};

// Update user
exports.updateUser = async (req, res) => {
	try {
		const { firstName, lastName, email, phoneNumber, role, team } = req.body;

		// Check if user exists
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		// Check if email is being changed and if it's already taken
		if (email && email !== user.email) {
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				return res.status(400).json({
					status: "fail",
					message: "Email already in use",
				});
			}
		}

		// Update user
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ firstName, lastName, email, phoneNumber, role, team },
			{ new: true, runValidators: true }
		)
			.select("-password")
			.populate("team", "name");

		res.status(200).json({
			status: "success",
			data: {
				user: updatedUser,
			},
		});
	} catch (err) {
		console.error("Update user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating user",
		});
	}
};

// Delete user
exports.deleteUser = async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);

		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting user",
		});
	}
};

// Get user profile (placeholder for authenticated user)
exports.getProfile = async (req, res) => {
	try {
		// This would typically get the authenticated user's profile
		// For now, return a placeholder response
		res.status(200).json({
			status: "success",
			message: "Profile endpoint - requires authentication middleware",
			data: {
				profile: "User profile data would be here",
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

// Get users by team
exports.getUsersByTeam = async (req, res) => {
	try {
		const users = await User.find({ team: req.params.teamId })
			.select("firstName lastName email role profilePicture")
			.populate("team", "name");

		res.status(200).json({
			status: "success",
			results: users.length,
			data: {
				users,
			},
		});
	} catch (err) {
		console.error("Get users by team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team users",
		});
	}
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
	try {
		const users = await User.find({ role: req.params.role })
			.select("firstName lastName email profilePicture team")
			.populate("team", "name");

		res.status(200).json({
			status: "success",
			results: users.length,
			data: {
				users,
			},
		});
	} catch (err) {
		console.error("Get users by role error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching users by role",
		});
	}
};

/** @format */

const Team = require("../models/Team");
const User = require("../models/Users");

// Create a new team
exports.createTeam = async (req, res) => {
	try {
		const { name, description, teamLeader, teamViceHead } = req.body;

		// Input validation
		if (!name || !description) {
			return res.status(400).json({
				status: "fail",
				message: "Team name and description are required",
			});
		}

		// Check if team already exists
		const existingTeam = await Team.findOne({ name });
		if (existingTeam) {
			return res.status(400).json({
				status: "fail",
				message: "Team with this name already exists",
			});
		}

		// Create team (teamLeader and teamViceHead can be added later)
		const newTeam = await Team.create({
			name,
			description,
			teamLeader: teamLeader || null,
			teamViceHead: teamViceHead || [],
		});

		res.status(201).json({
			status: "success",
			data: {
				team: {
					id: newTeam._id,
					name: newTeam.name,
					description: newTeam.description,
					teamLeader: newTeam.teamLeader,
					teamViceHead: newTeam.teamViceHead,
				},
			},
		});
	} catch (err) {
		console.error("Team creation error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error during team creation",
		});
	}
};

// Get all teams
exports.getAllTeams = async (req, res) => {
	try {
		const teams = await Team.find()
			.select("name description teamLeader teamViceHead createdAt")
			.populate(
				"teamLeader teamViceHead",
				"firstName lastName email role profilePicture"
			);

		res.status(200).json({
			status: "success",
			results: teams.length,
			data: {
				teams,
			},
		});
	} catch (err) {
		console.error("Get teams error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching teams",
		});
	}
};

// Get single team
exports.getTeam = async (req, res) => {
	try {
		const team = await Team.findById(req.params.id);

		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				team,
			},
		});
	} catch (err) {
		console.error("Get team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team",
		});
	}
};

// Update team
exports.updateTeam = async (req, res) => {
	try {
		const { name, description, teamLeader, teamViceHead } = req.body;

		const updatedTeam = await Team.findByIdAndUpdate(
			req.params.id,
			{ name, description, teamLeader, teamViceHead },
			{ new: true, runValidators: true }
		);

		if (!updatedTeam) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				team: updatedTeam,
			},
		});
	} catch (err) {
		console.error("Update team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating team",
		});
	}
};

// Delete team
exports.deleteTeam = async (req, res) => {
	try {
		const team = await Team.findByIdAndDelete(req.params.id);

		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting team",
		});
	}
};

// Get team members
exports.getTeamMembers = async (req, res) => {
	try {
		const team = await Team.findById(req.params.id);

		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		const members = await User.find({ team: req.params.id }).select(
			"firstName lastName email role profilePicture"
		);

		res.status(200).json({
			status: "success",
			data: {
				team: {
					id: team._id,
					name: team.name,
					description: team.description,
				},
				members,
			},
		});
	} catch (err) {
		console.error("Get team members error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team members",
		});
	}
};

// Get team statistics
exports.getTeamStats = async (req, res) => {
	try {
		const totalTeams = await Team.countDocuments();
		const teamsWithMembers = await Team.aggregate([
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "team",
					as: "members",
				},
			},
			{
				$project: {
					name: 1,
					memberCount: { $size: "$members" },
				},
			},
		]);

		const totalMembers = teamsWithMembers.reduce(
			(sum, team) => sum + team.memberCount,
			0
		);

		res.status(200).json({
			status: "success",
			data: {
				totalTeams,
				totalMembers,
				teamsWithMembers,
			},
		});
	} catch (err) {
		console.error("Get team stats error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team statistics",
		});
	}
};

// Add member to team
exports.addMemberToTeam = async (req, res) => {
	try {
		const { userId } = req.body;
		const teamId = req.params.id;

		// Check if team exists
		const team = await Team.findById(teamId);
		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		// Check if user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		// Update user's team
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ team: teamId },
			{ new: true }
		).populate("team", "name");

		res.status(200).json({
			status: "success",
			data: {
				user: updatedUser,
			},
		});
	} catch (err) {
		console.error("Add member to team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while adding member to team",
		});
	}
};

// Remove member from team
exports.removeMemberFromTeam = async (req, res) => {
	try {
		const { userId } = req.params;
		const teamId = req.params.id;

		// Check if user exists and is in the team
		const user = await User.findOne({ _id: userId, team: teamId });
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found in this team",
			});
		}

		// Remove user from team (set team to null or another team)
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ team: null },
			{ new: true }
		);

		res.status(200).json({
			status: "success",
			data: {
				user: updatedUser,
			},
		});
	} catch (err) {
		console.error("Remove member from team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while removing member from team",
		});
	}
};

// Get team by name
exports.getTeamByName = async (req, res) => {
	try {
		const { name } = req.params;
		const team = await Team.findOne({ name }).populate(
			"teamLeader teamViceHead",
			"firstName lastName email role profilePicture"
		);

		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				team,
			},
		});
	} catch (err) {
		console.error("Get team by name error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team",
		});
	}
};

// Check if team name exists
exports.checkTeamName = async (req, res) => {
	try {
		const { name } = req.params;
		const team = await Team.findOne({ name });

		res.status(200).json({
			status: "success",
			data: {
				exists: !!team,
				team: team
					? {
							id: team._id,
							name: team.name,
							description: team.description,
					  }
					: null,
			},
		});
	} catch (err) {
		console.error("Check team name error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while checking team name",
		});
	}
};

// Get team members by team name
exports.getTeamMembersByName = async (req, res) => {
	try {
		const { name } = req.params;
		const team = await Team.findOne({ name });

		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		const members = await User.find({ team: team._id }).select(
			"firstName lastName email role profilePicture"
		);

		res.status(200).json({
			status: "success",
			data: {
				team: {
					id: team._id,
					name: team.name,
					description: team.description,
				},
				members,
			},
		});
	} catch (err) {
		console.error("Get team members by name error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team members",
		});
	}
};

// Add member to team by team name
exports.addMemberToTeamByName = async (req, res) => {
	try {
		const { name } = req.params;
		const { userId } = req.body;

		// Check if team exists
		const team = await Team.findOne({ name });
		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		// Check if user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}

		// Update user's team
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ team: team._id },
			{ new: true }
		).populate("team", "name");

		res.status(200).json({
			status: "success",
			data: {
				user: updatedUser,
			},
		});
	} catch (err) {
		console.error("Add member to team by name error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while adding member to team",
		});
	}
};

// Assign team leader
exports.assignTeamLeader = async (req, res) => {
	try {
		const { teamId } = req.params;
		const { userId } = req.body;

		// Check if team exists
		const team = await Team.findById(teamId);
		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		// Check if user exists and is in the team
		const user = await User.findOne({ _id: userId, team: teamId });
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found or not a member of this team",
			});
		}

		// Update user role to team_leader
		await User.findByIdAndUpdate(userId, { role: "team_leader" });

		// Update team with new leader
		const updatedTeam = await Team.findByIdAndUpdate(
			teamId,
			{ teamLeader: userId },
			{ new: true }
		).populate("teamLeader", "firstName lastName email role");

		res.status(200).json({
			status: "success",
			message: "Team leader assigned successfully",
			data: {
				team: updatedTeam,
			},
		});
	} catch (err) {
		console.error("Assign team leader error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while assigning team leader",
		});
	}
};

// Assign team vice head
exports.assignTeamViceHead = async (req, res) => {
	try {
		const { teamId } = req.params;
		const { userId } = req.body;

		// Check if team exists
		const team = await Team.findById(teamId);
		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		// Check if user exists and is in the team
		const user = await User.findOne({ _id: userId, team: teamId });
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found or not a member of this team",
			});
		}

		// Update user role to vice_head
		await User.findByIdAndUpdate(userId, { role: "vice_head" });

		// Add user to team vice heads (if not already there)
		const updatedTeam = await Team.findByIdAndUpdate(
			teamId,
			{ $addToSet: { teamViceHead: userId } },
			{ new: true }
		).populate("teamViceHead", "firstName lastName email role");

		res.status(200).json({
			status: "success",
			message: "Team vice head assigned successfully",
			data: {
				team: updatedTeam,
			},
		});
	} catch (err) {
		console.error("Assign team vice head error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while assigning team vice head",
		});
	}
};

// Remove team vice head
exports.removeTeamViceHead = async (req, res) => {
	try {
		const { teamId, userId } = req.params;

		// Check if team exists
		const team = await Team.findById(teamId);
		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		// Remove user from team vice heads
		const updatedTeam = await Team.findByIdAndUpdate(
			teamId,
			{ $pull: { teamViceHead: userId } },
			{ new: true }
		).populate("teamViceHead", "firstName lastName email role");

		// Update user role back to member
		await User.findByIdAndUpdate(userId, { role: "member" });

		res.status(200).json({
			status: "success",
			message: "Team vice head removed successfully",
			data: {
				team: updatedTeam,
			},
		});
	} catch (err) {
		console.error("Remove team vice head error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while removing team vice head",
		});
	}
};

// Get team leadership
exports.getTeamLeadership = async (req, res) => {
	try {
		const { teamId } = req.params;

		const team = await Team.findById(teamId)
			.populate("teamLeader", "firstName lastName email role profilePicture")
			.populate("teamViceHead", "firstName lastName email role profilePicture");

		if (!team) {
			return res.status(404).json({
				status: "fail",
				message: "Team not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				team: {
					id: team._id,
					name: team.name,
					description: team.description,
					teamLeader: team.teamLeader,
					teamViceHead: team.teamViceHead,
				},
			},
		});
	} catch (err) {
		console.error("Get team leadership error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team leadership",
		});
	}
};

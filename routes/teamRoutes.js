/** @format */

const express = require("express");
const teamController = require("../controllers/teamController");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

// Get all teams
router.get("/", teamController.getAllTeams);

// Create new team
router.post("/", teamController.createTeam);

// Get team statistics
router.get("/stats", teamController.getTeamStats);

// Get my team members (for team leaders and vice heads only) - MUST BE BEFORE PARAMETERIZED ROUTES
router.get(
	"/my-team/members",
	authenticate,
	authorize("team_leader", "vice_head"),
	teamController.getMyTeamMembers
);

// Check if team name exists
router.get("/check/:name", teamController.checkTeamName);

// Get team by name
router.get("/name/:name", teamController.getTeamByName);

// Get team members by team name
router.get("/name/:name/members", teamController.getTeamMembersByName);

// Add member to team by team name
router.post("/name/:name/members", teamController.addMemberToTeamByName);

// Get single team
router.get("/:id", teamController.getTeam);

// Update team
router.patch("/:id", teamController.updateTeam);

// Delete team
router.delete("/:id", teamController.deleteTeam);

// Get team members
router.get("/:id/members", teamController.getTeamMembers);

// Add member to team
router.post("/:id/members", teamController.addMemberToTeam);

// Remove member from team
router.delete("/:id/members/:userId", teamController.removeMemberFromTeam);

// Team leadership management
router.get("/:teamId/leadership", teamController.getTeamLeadership);
router.post("/:teamId/leader", teamController.assignTeamLeader);
router.post("/:teamId/vice-head", teamController.assignTeamViceHead);
router.delete("/:teamId/vice-head/:userId", teamController.removeTeamViceHead);

module.exports = router;

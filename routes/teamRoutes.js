/** @format */

const express = require("express");
const teamController = require("../controllers/teamController");

const router = express.Router();

// Get all teams
router.get("/", teamController.getAllTeams);

// Create new team
router.post("/", teamController.createTeam);

// Get team statistics
router.get("/stats", teamController.getTeamStats);

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

module.exports = router;

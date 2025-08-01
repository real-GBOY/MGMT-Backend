/** @format */

const express = require("express");
const {
	authenticate,
	optionalAuth,
	authorize,
	adminOnly,
	teamLeaderOrAdmin,
	teamHeadViceHeadOrAdmin,
	teamLeadership,
	teamLeadershipOrAdmin,
	memberAccess,
	teamResourceAccess,
	sameTeam,
	ownerOrAdmin,
	resourceOwnerOrTeamLeaderOrAdmin,
} = require("../middlewares/auth");

const router = express.Router();

// Example: Route that requires authentication
router.get("/protected", authenticate, (req, res) => {
	res.json({
		status: "success",
		message: "This is a protected route",
		user: req.user,
	});
});

// Example: Route with optional authentication
router.get("/optional", optionalAuth, (req, res) => {
	res.json({
		status: "success",
		message: "This route works with or without authentication",
		user: req.user || null,
	});
});

// Example: Admin only route
router.get("/admin-only", authenticate, adminOnly, (req, res) => {
	res.json({
		status: "success",
		message: "Admin only content",
		user: req.user,
	});
});

// Example: Team leader or admin route
router.get("/team-leader", authenticate, teamLeaderOrAdmin, (req, res) => {
	res.json({
		status: "success",
		message: "Team leader or admin content",
		user: req.user,
	});
});

// Example: Team head, vice head, or admin route
router.get("/leadership", authenticate, teamHeadViceHeadOrAdmin, (req, res) => {
	res.json({
		status: "success",
		message: "Leadership content",
		user: req.user,
	});
});

// Example: Route with specific role authorization
router.get(
	"/specific-roles",
	authenticate,
	authorize("admin", "teamHead"),
	(req, res) => {
		res.json({
			status: "success",
			message: "Specific roles content",
			user: req.user,
		});
	}
);

// Example: Route without rate limiting
router.get("/no-rate-limit", (req, res) => {
	res.json({
		status: "success",
		message: "No rate limit route",
	});
});

// Example: Route with multiple middleware
router.get(
	"/complex",
	authenticate, // Must be authenticated
	teamLeaderOrAdmin, // Must be team leader or admin
	(req, res) => {
		res.json({
			status: "success",
			message: "Complex protected route",
			user: req.user,
		});
	}
);

// Example: Team leadership only (team head or vice head)
router.get("/team-leadership", authenticate, teamLeadership, (req, res) => {
	res.json({
		status: "success",
		message: "Team leadership content",
		user: req.user,
	});
});

// Example: Member access (user can only access their own resources)
router.get(
	"/member-resource/:userId",
	authenticate,
	memberAccess,
	(req, res) => {
		res.json({
			status: "success",
			message: "Member resource access",
			user: req.user,
			resourceUserId: req.params.userId,
		});
	}
);

// Example: Team resource access (ensures team-based access)
router.get(
	"/team-resource/:teamId",
	authenticate,
	teamResourceAccess,
	(req, res) => {
		res.json({
			status: "success",
			message: "Team resource access",
			user: req.user,
			teamId: req.params.teamId,
		});
	}
);

// Example: All roles demonstration
router.get("/roles-demo", authenticate, (req, res) => {
	const rolePermissions = {
		admin: "Can access and modify any data",
		teamHead: "Can access and modify team data",
		teamViceHead: "Can access and modify team data",
		member: "Can only access their own data",
	};

	res.json({
		status: "success",
		message: "Role permissions demonstration",
		user: req.user,
		userRole: req.user.role,
		permissions: rolePermissions[req.user.role] || "Unknown role",
		allRoles: Object.keys(rolePermissions),
	});
});

module.exports = router;

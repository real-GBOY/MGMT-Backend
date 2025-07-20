/** @format */

const { verifyToken } = require("../utils/jwt");
const User = require("../models/Users");

// Main authentication middleware
const authenticate = async (req, res, next) => {
	try {
		// Get token from header
		const authHeader = req.headers.authorization;
		let token;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7); // Remove "Bearer " prefix
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		if (!token) {
			return res.status(401).json({
				status: "fail",
				message: "Access denied. No token provided.",
			});
		}

		// Verify token
		const result = verifyToken(token);

		if (!result.valid) {
			return res.status(401).json({
				status: "fail",
				message: result.error || "Invalid token",
			});
		}

		// Get user from database
		const user = await User.findById(result.decoded.id)
			.select("-password")
			.populate("team", "name");

		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "User not found",
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(401).json({
				status: "fail",
				message: "Account is deactivated",
			});
		}

		// Set user in request object
		req.user = user;
		req.token = token;

		next();
	} catch (error) {
		console.error("Authentication error:", error);
		return res.status(500).json({
			status: "fail",
			message: "Authentication failed",
		});
	}
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		let token;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7);
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		if (token) {
			const result = verifyToken(token);

			if (result.valid) {
				const user = await User.findById(result.decoded.id)
					.select("-password")
					.populate("team", "name");

				if (user && user.isActive) {
					req.user = user;
					req.token = token;
				}
			}
		}

		next();
	} catch (error) {
		console.error("Optional authentication error:", error);
		next();
	}
};

// Role-based authorization middleware
const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				status: "fail",
				message: "Authentication required",
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				status: "fail",
				message: `Access denied. Required roles: ${roles.join(", ")}`,
			});
		}

		next();
	};
};

// Admin only middleware
const adminOnly = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	if (req.user.role !== "admin") {
		return res.status(403).json({
			status: "fail",
			message: "Access denied. Admin privileges required",
		});
	}

	next();
};

// Team leader or admin middleware
const teamLeaderOrAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	if (!["teamHead", "admin"].includes(req.user.role)) {
		return res.status(403).json({
			status: "fail",
			message: "Access denied. Team head or admin privileges required",
		});
	}

	next();
};

// Team head, vice head, or admin middleware
const teamHeadViceHeadOrAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	if (!["teamHead", "teamViceHead", "admin"].includes(req.user.role)) {
		return res.status(403).json({
			status: "fail",
			message:
				"Access denied. Team head, vice head, or admin privileges required",
		});
	}

	next();
};

// Same team middleware (user must be in the same team as the resource)
const sameTeam = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	// Admin can access all teams
	if (req.user.role === "admin") {
		return next();
	}

	const resourceTeamId = req.params.teamId || req.body.team || req.query.team;

	if (!resourceTeamId) {
		return res.status(400).json({
			status: "fail",
			message: "Team ID is required",
		});
	}

	if (req.user.team.toString() !== resourceTeamId.toString()) {
		return res.status(403).json({
			status: "fail",
			message:
				"Access denied. You can only access resources from your own team",
		});
	}

	next();
};

// Owner or admin middleware (user must own the resource or be admin)
const ownerOrAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	// Admin can access all resources
	if (req.user.role === "admin") {
		return next();
	}

	const resourceUserId =
		req.params.userId || req.body.userId || req.query.userId;

	if (!resourceUserId) {
		return res.status(400).json({
			status: "fail",
			message: "User ID is required",
		});
	}

	if (req.user._id.toString() !== resourceUserId.toString()) {
		return res.status(403).json({
			status: "fail",
			message: "Access denied. You can only access your own resources",
		});
	}

	next();
};

// Resource owner or team leader or admin middleware
const resourceOwnerOrTeamLeaderOrAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	// Admin can access all resources
	if (req.user.role === "admin") {
		return next();
	}

	// Team head can access team resources
	if (req.user.role === "teamHead") {
		return next();
	}

	// Check if user owns the resource
	const resourceOwnerId =
		req.params.userId || req.body.userId || req.query.userId;

	if (
		resourceOwnerId &&
		req.user._id.toString() === resourceOwnerId.toString()
	) {
		return next();
	}

	return res.status(403).json({
		status: "fail",
		message:
			"Access denied. You can only access your own resources or team resources as team head",
	});
};

// Team leadership middleware (team head or vice head)
const teamLeadership = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	if (!["teamHead", "teamViceHead"].includes(req.user.role)) {
		return res.status(403).json({
			status: "fail",
			message: "Access denied. Team leadership privileges required",
		});
	}

	next();
};

// Team leadership or admin middleware
const teamLeadershipOrAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	if (!["teamHead", "teamViceHead", "admin"].includes(req.user.role)) {
		return res.status(403).json({
			status: "fail",
			message: "Access denied. Team leadership or admin privileges required",
		});
	}

	next();
};

// Member access middleware (user can only access their own resources)
const memberAccess = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	// Admin can access all resources
	if (req.user.role === "admin") {
		return next();
	}

	// Team heads and vice heads can access team resources
	if (["teamHead", "teamViceHead"].includes(req.user.role)) {
		return next();
	}

	// Members can only access their own resources
	const resourceUserId =
		req.params.userId || req.body.userId || req.query.userId;

	if (resourceUserId && req.user._id.toString() === resourceUserId.toString()) {
		return next();
	}

	return res.status(403).json({
		status: "fail",
		message: "Access denied. You can only access your own resources",
	});
};

// Team resource access middleware (ensures users can only access their team's resources)
const teamResourceAccess = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			status: "fail",
			message: "Authentication required",
		});
	}

	// Admin can access all team resources
	if (req.user.role === "admin") {
		return next();
	}

	const resourceTeamId = req.params.teamId || req.body.team || req.query.team;

	if (!resourceTeamId) {
		return res.status(400).json({
			status: "fail",
			message: "Team ID is required",
		});
	}

	// Check if user belongs to the team
	if (req.user.team.toString() !== resourceTeamId.toString()) {
		return res.status(403).json({
			status: "fail",
			message:
				"Access denied. You can only access resources from your own team",
		});
	}

	next();
};

// Rate limiting middleware (basic implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
	const requests = new Map();

	return (req, res, next) => {
		const clientId = req.ip || req.connection.remoteAddress;
		const now = Date.now();
		const windowStart = now - windowMs;

		// Clean old requests
		if (requests.has(clientId)) {
			requests.set(
				clientId,
				requests.get(clientId).filter((timestamp) => timestamp > windowStart)
			);
		} else {
			requests.set(clientId, []);
		}

		const clientRequests = requests.get(clientId);

		if (clientRequests.length >= maxRequests) {
			return res.status(429).json({
				status: "fail",
				message: "Too many requests. Please try again later.",
			});
		}

		clientRequests.push(now);
		next();
	};
};

// Logout middleware (clear token)
const logout = (req, res, next) => {
	// Clear token from cookies if exists
	if (req.cookies && req.cookies.token) {
		res.clearCookie("token");
	}

	// Clear user from request
	req.user = null;
	req.token = null;

	next();
};

// Validate token middleware (for token refresh)
const validateToken = (req, res, next) => {
	try {
		const { token } = req.body;

		if (!token) {
			return res.status(400).json({
				status: "fail",
				message: "Token is required",
			});
		}

		const result = verifyToken(token);

		if (!result.valid) {
			return res.status(401).json({
				status: "fail",
				message: result.error || "Invalid token",
			});
		}

		req.tokenData = result.decoded;
		next();
	} catch (error) {
		console.error("Token validation error:", error);
		return res.status(500).json({
			status: "fail",
			message: "Token validation failed",
		});
	}
};

module.exports = {
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
	rateLimit,
	logout,
	validateToken,
};

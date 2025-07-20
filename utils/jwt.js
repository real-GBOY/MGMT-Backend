/** @format */

const jwt = require("jsonwebtoken");

// JWT Secret from environment variables
const JWT_SECRET =
	process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// Generate JWT token
const generateToken = (userId, role, team) => {
	try {
		const payload = {
			id: userId,
			role: role,
			team: team,
			iat: Math.floor(Date.now() / 1000),
		};

		const token = jwt.sign(payload, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN,
			algorithm: "HS256",
		});

		return token;
	} catch (error) {
		console.error("JWT generation error:", error);
		throw new Error("Failed to generate authentication token");
	}
};

// Generate refresh token
const generateRefreshToken = (userId) => {
	try {
		const payload = {
			id: userId,
			type: "refresh",
			iat: Math.floor(Date.now() / 1000),
		};

		const refreshToken = jwt.sign(payload, JWT_SECRET, {
			expiresIn: JWT_REFRESH_EXPIRES_IN,
			algorithm: "HS256",
		});

		return refreshToken;
	} catch (error) {
		console.error("Refresh token generation error:", error);
		throw new Error("Failed to generate refresh token");
	}
};

// Verify JWT token
const verifyToken = (token) => {
	try {
		if (!token) {
			throw new Error("No token provided");
		}

		const decoded = jwt.verify(token, JWT_SECRET, {
			algorithms: ["HS256"],
		});

		return {
			valid: true,
			decoded,
			error: null,
		};
	} catch (error) {
		let errorMessage = "Invalid token";

		if (error.name === "TokenExpiredError") {
			errorMessage = "Token has expired";
		} else if (error.name === "JsonWebTokenError") {
			errorMessage = "Invalid token format";
		} else if (error.name === "NotBeforeError") {
			errorMessage = "Token not active yet";
		}

		return {
			valid: false,
			decoded: null,
			error: errorMessage,
		};
	}
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
	try {
		return jwt.decode(token);
	} catch (error) {
		console.error("Token decode error:", error);
		return null;
	}
};

// Check if token is expired
const isTokenExpired = (token) => {
	try {
		const decoded = jwt.decode(token);
		if (!decoded || !decoded.exp) {
			return true;
		}

		const currentTime = Math.floor(Date.now() / 1000);
		return decoded.exp < currentTime;
	} catch (error) {
		console.error("Token expiration check error:", error);
		return true;
	}
};

// Get token expiration time
const getTokenExpiration = (token) => {
	try {
		const decoded = jwt.decode(token);
		if (!decoded || !decoded.exp) {
			return null;
		}

		return new Date(decoded.exp * 1000);
	} catch (error) {
		console.error("Get token expiration error:", error);
		return null;
	}
};

// Generate token pair (access + refresh)
const generateTokenPair = (userId, role, team) => {
	try {
		const accessToken = generateToken(userId, role, team);
		const refreshToken = generateRefreshToken(userId);

		return {
			accessToken,
			refreshToken,
			expiresIn: JWT_EXPIRES_IN,
		};
	} catch (error) {
		console.error("Token pair generation error:", error);
		throw new Error("Failed to generate token pair");
	}
};

// Refresh access token using refresh token
const refreshAccessToken = (refreshToken) => {
	try {
		const result = verifyToken(refreshToken);

		if (!result.valid) {
			throw new Error("Invalid refresh token");
		}

		if (result.decoded.type !== "refresh") {
			throw new Error("Invalid token type");
		}

		// Generate new access token (without role/team info)
		const newAccessToken = generateToken(
			result.decoded.id,
			result.decoded.role,
			result.decoded.team
		);

		return {
			accessToken: newAccessToken,
			expiresIn: JWT_EXPIRES_IN,
		};
	} catch (error) {
		console.error("Token refresh error:", error);
		throw new Error("Failed to refresh token");
	}
};

module.exports = {
	generateToken,
	generateRefreshToken,
	verifyToken,
	decodeToken,
	isTokenExpired,
	getTokenExpiration,
	generateTokenPair,
	refreshAccessToken,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	JWT_REFRESH_EXPIRES_IN,
};

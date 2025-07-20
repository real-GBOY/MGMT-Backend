/** @format */

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssFilter = require("xss");
const hpp = require("hpp");
const cors = require("cors");
const validator = require("validator");

// CORS configuration
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);

		const allowedOrigins = process.env.ALLOWED_ORIGINS
			? process.env.ALLOWED_ORIGINS.split(",")
			: [
					"http://localhost:3000",
					"http://localhost:3001",
					"https://yourdomain.com",
			  ];

		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
	optionsSuccessStatus: 200,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Origin",
	],
};

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
	return rateLimit({
		windowMs,
		max,
		message: {
			status: "fail",
			message:
				message || "Too many requests from this IP, please try again later.",
		},
		standardHeaders: true,
		legacyHeaders: false,
		handler: (req, res) => {
			res.status(429).json({
				status: "fail",
				message:
					message || "Too many requests from this IP, please try again later.",
				retryAfter: Math.ceil(windowMs / 1000),
			});
		},
	});
};

// Global rate limiter
const globalLimiter = createRateLimit(
	15 * 60 * 1000,
	100,
	"Too many requests from this IP"
);

// Auth rate limiter (more strict)
const authLimiter = createRateLimit(
	15 * 60 * 1000,
	5,
	"Too many authentication attempts"
);

// API rate limiter
const apiLimiter = createRateLimit(
	15 * 60 * 1000,
	1000,
	"API rate limit exceeded"
);

// File upload rate limiter
const uploadLimiter = createRateLimit(
	60 * 60 * 1000,
	10,
	"Too many file uploads"
);

// Input validation middleware
const validateInput = (req, res, next) => {
	// Sanitize all string inputs
	const sanitizeObject = (obj) => {
		for (let key in obj) {
			if (typeof obj[key] === "string") {
				obj[key] = validator.escape(validator.trim(obj[key]));
			} else if (typeof obj[key] === "object" && obj[key] !== null) {
				sanitizeObject(obj[key]);
			}
		}
	};

	if (req.body) sanitizeObject(req.body);
	if (req.query) sanitizeObject(req.query);
	if (req.params) sanitizeObject(req.params);

	next();
};

// SQL injection prevention
const preventSQLInjection = (req, res, next) => {
	const sqlPattern =
		/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;

	const checkForSQL = (obj) => {
		for (let key in obj) {
			if (typeof obj[key] === "string" && sqlPattern.test(obj[key])) {
				return res.status(400).json({
					status: "fail",
					message: "Invalid input detected",
				});
			} else if (typeof obj[key] === "object" && obj[key] !== null) {
				if (checkForSQL(obj[key])) return true;
			}
		}
		return false;
	};

	if (req.body && checkForSQL(req.body)) return;
	if (req.query && checkForSQL(req.query)) return;
	if (req.params && checkForSQL(req.params)) return;

	next();
};

// File upload security
const fileUploadSecurity = (req, res, next) => {
	// Check file size
	const maxFileSize = 10 * 1024 * 1024; // 10MB

	if (req.file && req.file.size > maxFileSize) {
		return res.status(400).json({
			status: "fail",
			message: "File size too large. Maximum size is 10MB",
		});
	}

	// Check file type
	const allowedMimeTypes = [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"text/plain",
	];

	if (req.file && !allowedMimeTypes.includes(req.file.mimetype)) {
		return res.status(400).json({
			status: "fail",
			message: "File type not allowed",
		});
	}

	next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
	const maxRequestSize = 50 * 1024 * 1024; // 50MB

	if (
		req.headers["content-length"] &&
		parseInt(req.headers["content-length"]) > maxRequestSize
	) {
		return res.status(413).json({
			status: "fail",
			message: "Request entity too large",
		});
	}

	next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
	// Remove server information
	res.removeHeader("X-Powered-By");

	// Add security headers
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
	res.setHeader(
		"Permissions-Policy",
		"geolocation=(), microphone=(), camera=()"
	);

	// Content Security Policy
	res.setHeader(
		"Content-Security-Policy",
		"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self'; " +
			"connect-src 'self'; " +
			"media-src 'self'; " +
			"object-src 'none'; " +
			"base-uri 'self'; " +
			"form-action 'self';"
	);

	next();
};

// JWT token security
const jwtSecurity = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (token) {
		// Check token format
		if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid token format",
			});
		}
	}

	next();
};

// IP blocking middleware
const ipBlocking = (req, res, next) => {
	const blockedIPs = process.env.BLOCKED_IPS
		? process.env.BLOCKED_IPS.split(",")
		: [];
	const clientIP = req.ip || req.connection.remoteAddress;

	if (blockedIPs.includes(clientIP)) {
		return res.status(403).json({
			status: "fail",
			message: "Access denied",
		});
	}

	next();
};

// Request logging for security
const securityLogging = (req, res, next) => {
	const securityEvents = [
		"login_attempt",
		"file_upload",
		"admin_action",
		"role_change",
		"data_export",
	];

	const logSecurityEvent = (event, details) => {
		console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, {
			ip: req.ip,
			userAgent: req.get("User-Agent"),
			userId: req.user?._id,
			...details,
		});
	};

	// Log suspicious activities
	if (req.path.includes("/auth/login") && req.method === "POST") {
		logSecurityEvent("login_attempt", { email: req.body?.email || "unknown" });
	}

	if (req.path.includes("/files/upload") && req.method === "POST") {
		logSecurityEvent("file_upload", {
			fileName: req.file?.originalname || "unknown",
		});
	}

	if (req.user?.role === "admin" && req.method !== "GET") {
		logSecurityEvent("admin_action", {
			action: req.method,
			path: req.path,
			body: req.body || {},
		});
	}

	next();
};

// Session security
const sessionSecurity = (req, res, next) => {
	// Clear sensitive data from response
	res.on("finish", () => {
		if (req.body && req.body.password) {
			delete req.body.password;
		}
	});

	next();
};

// Environment check middleware
const environmentCheck = (req, res, next) => {
	if (process.env.NODE_ENV === "production") {
		// Additional security checks for production
		if (!req.headers["user-agent"]) {
			return res.status(400).json({
				status: "fail",
				message: "User-Agent header required",
			});
		}
	}

	next();
};

// Export all security middleware
module.exports = {
	corsOptions,
	globalLimiter,
	authLimiter,
	apiLimiter,
	uploadLimiter,
	validateInput,
	preventSQLInjection,
	fileUploadSecurity,
	requestSizeLimiter,
	securityHeaders,
	jwtSecurity,
	ipBlocking,
	securityLogging,
	sessionSecurity,
	environmentCheck,
};

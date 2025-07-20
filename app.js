/** @format */

// Load environment variables first
const path = require("path");

// Try to load from config.env first, then fallback to .env
try {
	require("dotenv").config({ path: path.join(__dirname, "config.env") });
	console.log("✅ Loaded config.env");
} catch (error) {
	console.log("⚠️ config.env not found, trying .env");
	require("dotenv").config();
}

// Debug: Check if env vars are loaded
console.log("🔍 Environment check:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
	"CLOUDINARY_API_KEY:",
	process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING"
);
console.log(
	"CLOUDINARY_API_SECRET:",
	process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING"
);

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
const xssFilter = require("xss");
const hpp = require("hpp");

// Import security middleware
const {
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
} = require("./middlewares/security");

const app = express();

// ===== SECURITY MIDDLEWARE =====

// 1. Environment check
app.use(environmentCheck);

// 2. IP blocking
app.use(ipBlocking);

// 3. Security headers
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", "data:", "https:"],
				connectSrc: ["'self'"],
				fontSrc: ["'self'"],
				objectSrc: ["'none'"],
				mediaSrc: ["'self'"],
				frameSrc: ["'none'"],
			},
		},
		crossOriginEmbedderPolicy: false,
	})
);

// 4. CORS configuration
app.use(cors(corsOptions));

// 5. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 6. XSS protection
app.use((req, res, next) => {
	// Sanitize request body, query, and params
	if (req.body) {
		Object.keys(req.body).forEach((key) => {
			if (typeof req.body[key] === "string") {
				req.body[key] = xssFilter(req.body[key]);
			}
		});
	}
	if (req.query) {
		Object.keys(req.query).forEach((key) => {
			if (typeof req.query[key] === "string") {
				req.query[key] = xssFilter(req.query[key]);
			}
		});
	}
	if (req.params) {
		Object.keys(req.params).forEach((key) => {
			if (typeof req.params[key] === "string") {
				req.params[key] = xssFilter(req.params[key]);
			}
		});
	}
	next();
});

// 7. HTTP Parameter Pollution protection
app.use(hpp());

// 8. Request size limiting
app.use(requestSizeLimiter);

// 9. Security headers
app.use(securityHeaders);

// 10. JWT token security
app.use(jwtSecurity);

// 11. Input validation and sanitization
app.use(validateInput);

// 12. SQL injection prevention
app.use(preventSQLInjection);

// 13. Session security
app.use(sessionSecurity);

// 14. Security logging
app.use(securityLogging);

// 15. Global rate limiting
app.use(globalLimiter);

// ===== BASIC MIDDLEWARE =====

// 16. Request logging
app.use(
	morgan("combined", {
		skip: (req, res) => res.statusCode < 400,
		stream: {
			write: (message) => {
				console.log(message.trim());
			},
		},
	})
);

// 17. Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 18. Cookie parsing
app.use(cookieParser());

// Custom middleware for request time
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	console.log(req.requestTime);
	next();
});

// Import routes
const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const fileCenterHubRoutes = require("./routes/fileCenterHubRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Welcome route
app.get("/", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "🎉 Enactus Management API is running!",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
		version: "1.0.0",
		security: {
			enabled: true,
			features: [
				"JWT Authentication",
				"Role-Based Access Control",
				"Rate Limiting",
				"Input Validation",
				"XSS Protection",
				"SQL Injection Prevention",
				"CORS Protection",
				"Security Headers",
				"File Upload Security",
				"Request Size Limiting",
			],
		},
	});
});

// API status route
app.get("/api/v1/status", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "API is healthy",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
		database: "connected",
		features: [
			"Express server",
			"MongoDB connection",
			"Security middleware (helmet)",
			"Request logging (morgan)",
			"Cookie parsing",
			"MongoDB sanitization",
		],
	});
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/files", fileCenterHubRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Handle undefined routes
app.all("*", (req, res) => {
	res.status(404).json({
		status: "fail",
		message: `Can't find ${req.originalUrl} on this server!`,
	});
});

module.exports = app;

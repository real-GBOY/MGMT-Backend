/** @format */

module.exports = {
	// JWT Configuration
	jwt: {
		secret:
			process.env.JWT_SECRET ||
			"your-super-secret-jwt-key-change-in-production",
		expiresIn: process.env.JWT_EXPIRES_IN || "7d",
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
		algorithm: "HS256",
		issuer: "enactus-management-system",
		audience: "enactus-users",
	},

	// Password Configuration
	password: {
		minLength: 8,
		maxLength: 128,
		requireUppercase: true,
		requireLowercase: true,
		requireNumbers: true,
		requireSpecialChars: true,
		bcryptRounds: 12,
	},

	// File Upload Security
	fileUpload: {
		maxFileSize: 10 * 1024 * 1024, // 10MB
		maxRequestSize: 50 * 1024 * 1024, // 50MB
		allowedMimeTypes: [
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
			"application/zip",
			"application/x-zip-compressed",
		],
		allowedExtensions: [
			".jpg",
			".jpeg",
			".png",
			".gif",
			".webp",
			".pdf",
			".doc",
			".docx",
			".xls",
			".xlsx",
			".txt",
			".zip",
			".rar",
		],
		scanForViruses: true,
		validateFileContent: true,
	},

	// Security Headers
	headers: {
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
				workerSrc: ["'self'"],
				manifestSrc: ["'self'"],
			},
		},
		xContentTypeOptions: "nosniff",
		xFrameOptions: "DENY",
		xXSSProtection: "1; mode=block",
		referrerPolicy: "strict-origin-when-cross-origin",
		permissionsPolicy: "geolocation=(), microphone=(), camera=()",
		strictTransportSecurity: {
			maxAge: 31536000, // 1 year
			includeSubDomains: true,
			preload: true,
		},
	},

	// Session Security
	session: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		sameSite: "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		rolling: true,
	},

	// Input Validation
	validation: {
		maxStringLength: 1000,
		maxArrayLength: 100,
		maxObjectDepth: 10,
		sanitizeHtml: true,
		escapeSpecialChars: true,
		validateEmail: true,
		validatePhone: true,
		validateUrl: true,
	},

	// Database Security
	database: {
		maxQueryTime: 30000, // 30 seconds
		maxResults: 1000,
		enableQueryLogging: process.env.NODE_ENV === "development",
		connectionPoolSize: 10,
		connectionTimeout: 30000,
		socketTimeout: 45000,
	},

	// API Security
	api: {
		version: "v1",
		enableVersioning: true,
		requireApiKey: false,
		apiKeyHeader: "X-API-Key",
		maxRequestSize: "10mb",
		enableCompression: true,
		enableCaching: true,
		cacheDuration: 300, // 5 minutes
	},

	// Logging Configuration
	logging: {
		level: process.env.LOG_LEVEL || "info",
		enableSecurityLogging: true,
		enableAccessLogging: true,
		enableErrorLogging: true,
		logFile: "logs/app.log",
		maxLogSize: "10m",
		maxLogFiles: 5,
		logFormat: "combined",
	},

	// Monitoring Configuration
	monitoring: {
		enableHealthChecks: true,
		healthCheckInterval: 300000, // 5 minutes
		enableMetrics: true,
		enableAlerts: true,
		alertThresholds: {
			errorRate: 0.05, // 5%
			responseTime: 5000, // 5 seconds
			memoryUsage: 0.8, // 80%
			cpuUsage: 0.8, // 80%
		},
	},

	// Backup Configuration
	backup: {
		enableAutoBackup: true,
		backupInterval: 24 * 60 * 60 * 1000, // 24 hours
		backupRetention: 30, // 30 days
		backupLocation: "backups/",
		encryptBackups: true,
	},

	// Environment-specific settings
	environment: {
		development: {
			enableDebugMode: true,
			showErrorDetails: true,
			enableHotReload: true,
		},
		production: {
			enableDebugMode: false,
			showErrorDetails: false,
			enableHotReload: false,
			enableCompression: true,
			enableCaching: true,
			forceHTTPS: true,
		},
		test: {
			enableDebugMode: true,
			showErrorDetails: true,
			enableHotReload: false,
		},
	},

	// Security Checklist
	securityChecklist: {
		authentication: {
			enabled: true,
			jwtEnabled: true,
			bcryptEnabled: true,
			sessionEnabled: true,
			refreshTokensEnabled: true,
		},
		authorization: {
			enabled: true,
			roleBasedAccess: true,
			resourceBasedAccess: true,
			teamBasedAccess: true,
		},
		inputValidation: {
			enabled: true,
			sanitization: true,
			escaping: true,
			typeChecking: true,
		},
		outputEncoding: {
			enabled: true,
			htmlEncoding: true,
			jsonEncoding: true,
			urlEncoding: true,
		},
		errorHandling: {
			enabled: true,
			genericErrors: true,
			noStackTraces: true,
			logging: true,
		},
		logging: {
			enabled: true,
			securityEvents: true,
			accessLogs: true,
			errorLogs: true,
		},
		monitoring: {
			enabled: true,
			healthChecks: true,
			metrics: true,
			alerts: true,
		},
	},
};

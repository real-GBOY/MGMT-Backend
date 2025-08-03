/** @format */

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

// Task file upload storage configuration
const taskFileStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "enactus/tasks",
		allowed_formats: [
			"jpg",
			"png",
			"jpeg",
			"pdf",
			"doc",
			"docx",
			"xls",
			"xlsx",
			"ppt",
			"pptx",
			"txt",
			"zip",
			"rar",
		],
		resource_type: "auto",
		transformation: [
			{
				width: 1920,
				height: 1080,
				crop: "limit",
			},
		],
	},
});

// File filter function
const fileFilter = (req, file, cb) => {
	// Allowed file types
	const allowedTypes = [
		"image/jpeg",
		"image/png",
		"image/jpg",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"text/plain",
		"application/zip",
		"application/x-rar-compressed",
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only images, documents, and archives are allowed."
			),
			false
		);
	}
};

// Task file upload middleware
const uploadTaskFile = multer({
	storage: taskFileStorage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
		files: 1, // Only one file at a time
	},
});

// Multiple task files upload middleware
const uploadMultipleTaskFiles = multer({
	storage: taskFileStorage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit per file
		files: 5, // Maximum 5 files at a time
	},
});

// Comment with file attachment upload middleware
const uploadCommentFile = multer({
	storage: taskFileStorage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit for comment attachments
		files: 1, // Only one file per comment
	},
});

module.exports = {
	uploadTaskFile,
	uploadMultipleTaskFiles,
	uploadCommentFile,
};

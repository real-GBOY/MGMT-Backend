/** @format */

const FileCenterHub = require("../models/FileCenterHub");
const User = require("../models/Users");
const Team = require("../models/Team");
const Task = require("../models/Tasks");
const Meeting = require("../models/Meetings");
const cloudinary = require("../utils/cloudinary");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");

// Upload file
exports.uploadFile = async (req, res) => {
	try {
		const {
			description,
			category,
			subcategory,
			tags,
			visibility,
			relatedTask,
			relatedMeeting,
			relatedProject,
			folder,
			expiryDate,
		} = req.body;

		// Get the user uploading the file
		const uploadedById = req.user?._id;
		const uploadedBy = await User.findById(uploadedById);

		if (!uploadedBy) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check if file was uploaded
		if (!req.file) {
			return res.status(400).json({
				status: "fail",
				message: "No file uploaded",
			});
		}

		// Input validation
		if (!category) {
			return res.status(400).json({
				status: "fail",
				message: "File category is required",
			});
		}

		// Validate related task if provided
		if (relatedTask) {
			const task = await Task.findById(relatedTask);
			if (!task) {
				return res.status(404).json({
					status: "fail",
					message: "Related task not found",
				});
			}
		}

		// Validate related meeting if provided
		if (relatedMeeting) {
			const meeting = await Meeting.findById(relatedMeeting);
			if (!meeting) {
				return res.status(404).json({
					status: "fail",
					message: "Related meeting not found",
				});
			}
		}

		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(req.file.path, {
			folder: `enactus/${uploadedBy.team}/${folder || "root"}`,
			resource_type: "auto",
		});

		// Calculate file checksum
		const fileBuffer = fs.readFileSync(req.file.path);
		const checksum = crypto.createHash("md5").update(fileBuffer).digest("hex");

		// Determine file type from MIME type
		const mimeType = req.file.mimetype;
		let fileType = "other";

		if (mimeType.startsWith("image/")) fileType = "image";
		else if (mimeType.startsWith("video/")) fileType = "video";
		else if (mimeType.startsWith("audio/")) fileType = "audio";
		else if (mimeType.includes("pdf") || mimeType.includes("document"))
			fileType = "document";
		else if (mimeType.includes("presentation")) fileType = "presentation";
		else if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
			fileType = "spreadsheet";
		else if (
			mimeType.includes("zip") ||
			mimeType.includes("rar") ||
			mimeType.includes("tar")
		)
			fileType = "archive";

		// Create file record
		const file = await FileCenterHub.create({
			fileName: req.file.originalname,
			originalName: req.file.originalname,
			description: description || "",
			fileUrl: result.secure_url,
			fileType,
			fileSize: req.file.size,
			mimeType,
			category,
			subcategory: subcategory || "",
			tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
			uploadedBy: uploadedById,
			team: uploadedBy.team,
			visibility: visibility || "team",
			relatedTask,
			relatedMeeting,
			relatedProject,
			folder: folder || "root",
			expiryDate: expiryDate ? new Date(expiryDate) : null,
			checksum,
		});

		// Clean up uploaded file
		fs.unlinkSync(req.file.path);

		// Populate references
		const populatedFile = await FileCenterHub.findById(file._id)
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title");

		res.status(201).json({
			status: "success",
			data: {
				file: populatedFile,
			},
		});
	} catch (err) {
		console.error("Upload file error:", err);
		// Clean up uploaded file if exists
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({
			status: "fail",
			message: "Server error while uploading file",
		});
	}
};

// Get all files
exports.getAllFiles = async (req, res) => {
	try {
		const { category, visibility, folder, team, search } = req.query;

		// Build filter object
		const filter = {};

		if (category) filter.category = category;
		if (visibility) filter.visibility = visibility;
		if (folder) filter.folder = folder;
		if (team) filter.team = team;
		if (search) {
			filter.$text = { $search: search };
		}

		const files = await FileCenterHub.find(filter)
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.sort({ uploadedAt: -1 });

		res.status(200).json({
			status: "success",
			results: files.length,
			data: {
				files,
			},
		});
	} catch (err) {
		console.error("Get files error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching files",
		});
	}
};

// Get single file
exports.getFile = async (req, res) => {
	try {
		const file = await FileCenterHub.findById(req.params.id)
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("parentFile", "fileName version")
			.populate("versions.uploadedBy", "firstName lastName");

		if (!file) {
			return res.status(404).json({
				status: "fail",
				message: "File not found",
			});
		}

		// Increment view count
		file.viewCount += 1;
		await file.save();

		res.status(200).json({
			status: "success",
			data: {
				file,
			},
		});
	} catch (err) {
		console.error("Get file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching file",
		});
	}
};

// Update file
exports.updateFile = async (req, res) => {
	try {
		const {
			fileName,
			description,
			category,
			subcategory,
			tags,
			visibility,
			folder,
			expiryDate,
		} = req.body;

		// Check if file exists
		const file = await FileCenterHub.findById(req.params.id);
		if (!file) {
			return res.status(404).json({
				status: "fail",
				message: "File not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: uploadedBy, team leader, or admin can update
		const canUpdate =
			file.uploadedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canUpdate) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the uploader, team leader, or admin can update this file",
			});
		}

		// Update file
		const updatedFile = await FileCenterHub.findByIdAndUpdate(
			req.params.id,
			{
				fileName,
				description,
				category,
				subcategory,
				tags: tags ? tags.split(",").map((tag) => tag.trim()) : file.tags,
				visibility,
				folder,
				expiryDate: expiryDate ? new Date(expiryDate) : null,
			},
			{ new: true, runValidators: true }
		)
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title");

		res.status(200).json({
			status: "success",
			data: {
				file: updatedFile,
			},
		});
	} catch (err) {
		console.error("Update file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating file",
		});
	}
};

// Delete file
exports.deleteFile = async (req, res) => {
	try {
		const file = await FileCenterHub.findById(req.params.id);

		if (!file) {
			return res.status(404).json({
				status: "fail",
				message: "File not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: uploadedBy, team leader, or admin can delete
		const canDelete =
			file.uploadedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canDelete) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the uploader, team leader, or admin can delete this file",
			});
		}

		// Delete from Cloudinary
		try {
			const publicId = file.fileUrl.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(publicId);
		} catch (cloudinaryError) {
			console.error("Cloudinary delete error:", cloudinaryError);
		}

		await FileCenterHub.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting file",
		});
	}
};

// Get files by team
exports.getFilesByTeam = async (req, res) => {
	try {
		const files = await FileCenterHub.find({ team: req.params.teamId })
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.sort({ uploadedAt: -1 });

		res.status(200).json({
			status: "success",
			results: files.length,
			data: {
				files,
			},
		});
	} catch (err) {
		console.error("Get files by team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team files",
		});
	}
};

// Get files by user
exports.getFilesByUser = async (req, res) => {
	try {
		const files = await FileCenterHub.find({ uploadedBy: req.params.userId })
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.sort({ uploadedAt: -1 });

		res.status(200).json({
			status: "success",
			results: files.length,
			data: {
				files,
			},
		});
	} catch (err) {
		console.error("Get files by user error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching user files",
		});
	}
};

// Upload new version of file
exports.uploadNewVersion = async (req, res) => {
	try {
		const { changeNotes } = req.body;
		const fileId = req.params.id;

		// Check if original file exists
		const originalFile = await FileCenterHub.findById(fileId);
		if (!originalFile) {
			return res.status(404).json({
				status: "fail",
				message: "Original file not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions: uploadedBy, team leader, or admin can upload new version
		const canUploadVersion =
			originalFile.uploadedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin";

		if (!canUploadVersion) {
			return res.status(403).json({
				status: "fail",
				message:
					"Only the uploader, team leader, or admin can upload new versions",
			});
		}

		// Check if file was uploaded
		if (!req.file) {
			return res.status(400).json({
				status: "fail",
				message: "No file uploaded",
			});
		}

		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(req.file.path, {
			folder: `enactus/${user.team}/${originalFile.folder}`,
			resource_type: "auto",
		});

		// Calculate file checksum
		const fileBuffer = fs.readFileSync(req.file.path);
		const checksum = crypto.createHash("md5").update(fileBuffer).digest("hex");

		// Create new version record
		const newVersion = {
			version: originalFile.version + 1,
			fileUrl: result.secure_url,
			uploadedAt: new Date(),
			uploadedBy: userId,
			changeNotes: changeNotes || "",
		};

		// Update original file
		originalFile.versions.push(newVersion);
		originalFile.version = newVersion.version;
		originalFile.fileUrl = result.secure_url;
		originalFile.fileSize = req.file.size;
		originalFile.checksum = checksum;

		await originalFile.save();

		// Clean up uploaded file
		fs.unlinkSync(req.file.path);

		// Populate references
		const populatedFile = await FileCenterHub.findById(originalFile._id)
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("relatedTask", "title")
			.populate("relatedMeeting", "title")
			.populate("versions.uploadedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				file: populatedFile,
			},
		});
	} catch (err) {
		console.error("Upload new version error:", err);
		// Clean up uploaded file if exists
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({
			status: "fail",
			message: "Server error while uploading new version",
		});
	}
};

// Download file
exports.downloadFile = async (req, res) => {
	try {
		const file = await FileCenterHub.findById(req.params.id);

		if (!file) {
			return res.status(404).json({
				status: "fail",
				message: "File not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Check permissions
		const canDownload =
			file.visibility === "public" ||
			file.uploadedBy.equals(userId) ||
			user.role === "team_leader" ||
			user.role === "admin" ||
			file.permissions.download.includes(userId);

		if (!canDownload) {
			return res.status(403).json({
				status: "fail",
				message: "You don't have permission to download this file",
			});
		}

		// Increment download count
		file.downloadCount += 1;
		await file.save();

		res.status(200).json({
			status: "success",
			data: {
				downloadUrl: file.fileUrl,
				fileName: file.originalName,
			},
		});
	} catch (err) {
		console.error("Download file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while downloading file",
		});
	}
};

// Archive file
exports.archiveFile = async (req, res) => {
	try {
		const file = await FileCenterHub.findById(req.params.id);

		if (!file) {
			return res.status(404).json({
				status: "fail",
				message: "File not found",
			});
		}

		// Get current user
		const userId = req.user?._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team leaders and admins can archive files
		if (!["team_leader", "admin"].includes(user.role)) {
			return res.status(403).json({
				status: "fail",
				message: "Only team leaders or admins can archive files",
			});
		}

		// Archive file
		file.isArchived = true;
		file.archivedAt = new Date();
		file.archivedBy = userId;

		await file.save();

		// Populate references
		const populatedFile = await FileCenterHub.findById(file._id)
			.populate("uploadedBy", "firstName lastName email")
			.populate("team", "name")
			.populate("archivedBy", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				file: populatedFile,
			},
		});
	} catch (err) {
		console.error("Archive file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while archiving file",
		});
	}
};

// Get file statistics
exports.getFileStats = async (req, res) => {
	try {
		const totalFiles = await FileCenterHub.countDocuments();
		const archivedFiles = await FileCenterHub.countDocuments({
			isArchived: true,
		});
		const activeFiles = await FileCenterHub.countDocuments({
			isArchived: false,
		});

		// Files by category
		const categoryStats = await FileCenterHub.aggregate([
			{
				$group: {
					_id: "$category",
					count: { $sum: 1 },
					totalSize: { $sum: "$fileSize" },
				},
			},
		]);

		// Files by visibility
		const visibilityStats = await FileCenterHub.aggregate([
			{
				$group: {
					_id: "$visibility",
					count: { $sum: 1 },
				},
			},
		]);

		// Total storage used
		const storageStats = await FileCenterHub.aggregate([
			{
				$group: {
					_id: null,
					totalSize: { $sum: "$fileSize" },
					averageSize: { $avg: "$fileSize" },
				},
			},
		]);

		// This month's uploads
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const monthUploads = await FileCenterHub.countDocuments({
			uploadedAt: { $gte: startOfMonth },
		});

		// Most downloaded files
		const mostDownloaded = await FileCenterHub.find()
			.sort({ downloadCount: -1 })
			.limit(5)
			.populate("uploadedBy", "firstName lastName")
			.select("fileName downloadCount uploadedBy");

		res.status(200).json({
			status: "success",
			data: {
				totalFiles,
				archivedFiles,
				activeFiles,
				categoryStats,
				visibilityStats,
				totalStorage: storageStats[0]?.totalSize || 0,
				averageFileSize: storageStats[0]?.averageSize || 0,
				monthUploads,
				mostDownloaded,
			},
		});
	} catch (err) {
		console.error("Get file stats error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching file statistics",
		});
	}
};

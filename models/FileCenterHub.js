/** @format */

const mongoose = require("mongoose");

const fileCenterHubSchema = new mongoose.Schema(
	{
		fileName: {
			type: String,
			required: [true, "File name is required"],
			trim: true,
			maxlength: [255, "File name cannot exceed 255 characters"],
		},
		originalName: {
			type: String,
			required: [true, "Original file name is required"],
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},
		fileUrl: {
			type: String,
			required: [true, "File URL is required"],
		},
		fileType: {
			type: String,
			required: [true, "File type is required"],
		},
		fileSize: {
			type: Number,
			required: [true, "File size is required"],
			min: [0, "File size cannot be negative"],
		},
		mimeType: {
			type: String,
			required: [true, "MIME type is required"],
		},
		category: {
			type: String,
			required: [true, "File category is required"],
			enum: {
				values: [
					"document",
					"image",
					"video",
					"audio",
					"presentation",
					"spreadsheet",
					"archive",
					"other",
				],
				message:
					"Category must be document, image, video, audio, presentation, spreadsheet, archive, or other",
			},
		},
		subcategory: {
			type: String,
			trim: true,
			maxlength: [100, "Subcategory cannot exceed 100 characters"],
		},
		tags: [
			{
				type: String,
				trim: true,
				maxlength: [50, "Tag cannot exceed 50 characters"],
			},
		],
		uploadedBy: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Uploader is required"],
			ref: "User",
		},
		team: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "Team reference is required"],
			ref: "Team",
		},
		visibility: {
			type: String,
			required: [true, "Visibility is required"],
			enum: {
				values: ["public", "team", "private"],
				message: "Visibility must be public, team, or private",
			},
			default: "team",
		},
		permissions: {
			view: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			],
			edit: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			],
			download: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			],
			delete: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			],
		},
		relatedTask: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Task",
		},
		relatedMeeting: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Meeting",
		},
		relatedProject: {
			type: String,
			trim: true,
		},
		folder: {
			type: String,
			trim: true,
			default: "root",
		},
		version: {
			type: Number,
			default: 1,
			min: [1, "Version must be at least 1"],
		},
		parentFile: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "FileCenterHub",
		},
		versions: [
			{
				version: Number,
				fileUrl: String,
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
				uploadedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				changeNotes: String,
			},
		],
		downloadCount: {
			type: Number,
			default: 0,
			min: [0, "Download count cannot be negative"],
		},
		viewCount: {
			type: Number,
			default: 0,
			min: [0, "View count cannot be negative"],
		},
		lastAccessed: {
			type: Date,
			default: Date.now,
		},
		expiryDate: {
			type: Date,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
		archivedAt: {
			type: Date,
		},
		archivedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		metadata: {
			width: Number, // for images/videos
			height: Number, // for images/videos
			duration: Number, // for audio/video in seconds
			pages: Number, // for documents
			language: String,
			author: String,
			keywords: [String],
			customFields: mongoose.Schema.Types.Mixed,
		},
		checksum: {
			type: String,
			trim: true,
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
fileCenterHubSchema.index({ team: 1, uploadedAt: -1 });
fileCenterHubSchema.index({ uploadedBy: 1, uploadedAt: -1 });
fileCenterHubSchema.index({ category: 1 });
fileCenterHubSchema.index({ visibility: 1 });
fileCenterHubSchema.index({ folder: 1 });
fileCenterHubSchema.index({ tags: 1 });
fileCenterHubSchema.index({ fileName: "text", description: "text" });

// Virtual for file extension
fileCenterHubSchema.virtual("fileExtension").get(function () {
	return this.originalName.split(".").pop().toLowerCase();
});

// Virtual for formatted file size
fileCenterHubSchema.virtual("formattedSize").get(function () {
	const bytes = this.fileSize;
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual for isExpired
fileCenterHubSchema.virtual("isExpired").get(function () {
	if (!this.expiryDate) return false;
	return new Date() > this.expiryDate;
});

// Ensure virtual fields are serialized
fileCenterHubSchema.set("toJSON", { virtuals: true });
fileCenterHubSchema.set("toObject", { virtuals: true });

// Pre-save middleware to update lastAccessed
fileCenterHubSchema.pre("save", function (next) {
	if (this.isModified("viewCount") || this.isModified("downloadCount")) {
		this.lastAccessed = new Date();
	}
	next();
});

module.exports = mongoose.model("FileCenterHub", fileCenterHubSchema);

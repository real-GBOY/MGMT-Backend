/** @format */

const express = require("express");
const fileCenterHubController = require("../controllers/fileCenterHubController");
const upload = require("../middlewares/upload");

const router = express.Router();

// Get all files
router.get("/", fileCenterHubController.getAllFiles);

// Get file statistics
router.get("/stats", fileCenterHubController.getFileStats);

// Get files by team
router.get("/team/:teamId", fileCenterHubController.getFilesByTeam);

// Get files by user
router.get("/user/:userId", fileCenterHubController.getFilesByUser);

// Upload new file
router.post(
	"/upload",
	upload.single("file"),
	fileCenterHubController.uploadFile
);

// Get single file
router.get("/:id", fileCenterHubController.getFile);

// Update file
router.patch("/:id", fileCenterHubController.updateFile);

// Delete file
router.delete("/:id", fileCenterHubController.deleteFile);

// Upload new version of file
router.post(
	"/:id/version",
	upload.single("file"),
	fileCenterHubController.uploadNewVersion
);

// Download file
router.get("/:id/download", fileCenterHubController.downloadFile);

// Archive file
router.patch("/:id/archive", fileCenterHubController.archiveFile);

module.exports = router;

/** @format */

const express = require("express");
const taskController = require("../controllers/taskController");
const { authenticate, authorize } = require("../middlewares/auth");
const {
	uploadTaskFile,
	uploadCommentFile,
} = require("../middlewares/taskUpload");

const router = express.Router();

// Get all tasks (admin only)
router.get("/", authenticate, authorize("admin"), taskController.getAllTasks);

// Create new task (team leaders and vice heads only) - with form data support
router.post(
	"/",
	authenticate,
	authorize("team_leader", "vice_head"),
	taskController.createTask
);

// Get my team tasks (all team members can view)
router.get("/my-team", authenticate, taskController.getMyTeamTasks);

// Get my assigned tasks (individual user tasks)
router.get("/my-tasks", authenticate, taskController.getMyTasks);

// Create task for team (team leaders and vice heads only) - supports both with and without file
router.post(
	"/team",
	authenticate,
	authorize("team_leader", "vice_head"),
	uploadTaskFile.single("file"),
	taskController.createTeamTask
);

// Get task statistics
router.get("/stats", authenticate, taskController.getTaskStats);

// Get tasks by assignee
router.get(
	"/assignee/:userId",
	authenticate,
	taskController.getTasksByAssignee
);

// Get tasks by status
router.get("/status/:status", authenticate, taskController.getTasksByStatus);

// Get tasks by team
router.get("/team/:teamId", authenticate, taskController.getTasksByTeam);

// Get single task
router.get("/:id", authenticate, taskController.getTask);

// Update task (team leaders and admins only) - with form data support
router.patch(
	"/:id",
	authenticate,
	authorize("team_leader", "vice_head", "admin"),
	taskController.updateTask
);

// Update task status (assigned users can update their own task status) - with form data support
router.patch("/:id/status", authenticate, taskController.updateTaskStatus);

// Delete task (team leaders and admins only)
router.delete(
	"/:id",
	authenticate,
	authorize("team_leader", "vice_head", "admin"),
	taskController.deleteTask
);

// Add comment to task - supports both with and without file attachment
router.post(
	"/:id/comments",
	authenticate,
	uploadCommentFile.single("file"),
	taskController.addComment
);

// Upload file to task
router.post(
	"/:id/upload-file",
	authenticate,
	uploadTaskFile.single("file"),
	taskController.uploadTaskFile
);

// Get task files
router.get("/:id/files", authenticate, taskController.getTaskFiles);

// Delete task file
router.delete(
	"/:taskId/files/:fileId",
	authenticate,
	taskController.deleteTaskFile
);

module.exports = router;

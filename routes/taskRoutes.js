/** @format */

const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

// Get all tasks
router.get("/", taskController.getAllTasks);

// Create new task
router.post("/", taskController.createTask);

// Get task statistics
router.get("/stats", taskController.getTaskStats);

// Get tasks by assignee
router.get("/assignee/:userId", taskController.getTasksByAssignee);

// Get tasks by status
router.get("/status/:status", taskController.getTasksByStatus);

// Get tasks by team
router.get("/team/:teamId", taskController.getTasksByTeam);

// Get single task
router.get("/:id", taskController.getTask);

// Update task
router.patch("/:id", taskController.updateTask);

// Delete task
router.delete("/:id", taskController.deleteTask);

// Add comment to task
router.post("/:id/comments", taskController.addComment);

module.exports = router;

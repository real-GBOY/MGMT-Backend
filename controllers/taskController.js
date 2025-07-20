/** @format */

const Task = require("../models/Tasks");
const User = require("../models/Users");
const Team = require("../models/Team");

// Create new task (only team leaders and vice heads for their own team)
exports.createTask = async (req, res) => {
	try {
		const { title, description, assignedTo, dueDate, priority } = req.body;

		// Get the user creating the task (should be set by auth middleware)
		const creatorId = req.user?._id;
		const creator = await User.findById(creatorId);

		if (!creator) {
			return res.status(401).json({ status: "fail", message: "Unauthorized" });
		}

		// Only team_leader or vice_head can assign tasks
		if (!["team_leader", "vice_head"].includes(creator.role)) {
			return res.status(403).json({
				status: "fail",
				message: "Only team leaders or vice heads can assign tasks",
			});
		}

		// Input validation
		if (!title || !description || !assignedTo || !dueDate) {
			return res.status(400).json({
				status: "fail",
				message: "Title, description, assignedTo, and dueDate are required",
			});
		}

		// Check if assigned user exists
		const assignedUser = await User.findById(assignedTo);
		if (!assignedUser) {
			return res.status(404).json({
				status: "fail",
				message: "Assigned user not found",
			});
		}

		// Ensure both users are in the same team
		if (!creator.team.equals(assignedUser.team)) {
			return res.status(403).json({
				status: "fail",
				message: "You can only assign tasks to members of your own team",
			});
		}

		// Create task
		const newTask = await Task.create({
			title,
			description,
			assignedTo,
			createdBy: creatorId,
			dueDate,
			priority: priority || "medium",
		});

		// Populate references
		const populatedTask = await Task.findById(newTask._id)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name");

		res.status(201).json({
			status: "success",
			data: {
				task: populatedTask,
			},
		});
	} catch (err) {
		console.error("Create task error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while creating task",
		});
	}
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
	try {
		const tasks = await Task.find()
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.sort({ createdAt: -1 });

		res.status(200).json({
			status: "success",
			results: tasks.length,
			data: {
				tasks,
			},
		});
	} catch (err) {
		console.error("Get tasks error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching tasks",
		});
	}
};

// Get single task
exports.getTask = async (req, res) => {
	try {
		const task = await Task.findById(req.params.id)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.populate("comments.user", "firstName lastName");

		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				task,
			},
		});
	} catch (err) {
		console.error("Get task error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching task",
		});
	}
};

// Update task (only team leaders and admins)
exports.updateTask = async (req, res) => {
	try {
		const { title, description, assignedTo, status, dueDate, priority } =
			req.body;

		// Check if task exists
		const task = await Task.findById(req.params.id);
		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		// TODO: Add role-based permission check here
		// Only team leaders and admins should be able to update tasks
		// const user = await User.findById(req.user.id);
		// if (!user || (user.role !== 'admin' && user.role !== 'team_leader')) {
		//   return res.status(403).json({
		//     status: "fail",
		//     message: "Only team leaders and admins can update tasks"
		//   });
		// }

		// Check if assigned user exists (if being updated)
		if (assignedTo) {
			const assignedUser = await User.findById(assignedTo);
			if (!assignedUser) {
				return res.status(404).json({
					status: "fail",
					message: "Assigned user not found",
				});
			}
		}

		// Update task
		const updatedTask = await Task.findByIdAndUpdate(
			req.params.id,
			{ title, description, assignedTo, status, dueDate, priority },
			{ new: true, runValidators: true }
		)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name");

		res.status(200).json({
			status: "success",
			data: {
				task: updatedTask,
			},
		});
	} catch (err) {
		console.error("Update task error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating task",
		});
	}
};

// Delete task (only team leaders and admins)
exports.deleteTask = async (req, res) => {
	try {
		const task = await Task.findById(req.params.id);

		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		// TODO: Add role-based permission check here
		// Only team leaders and admins should be able to delete tasks
		// const user = await User.findById(req.user.id);
		// if (!user || (user.role !== 'admin' && user.role !== 'team_leader')) {
		//   return res.status(403).json({
		//     status: "fail",
		//     message: "Only team leaders and admins can delete tasks"
		//   });
		// }

		await Task.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (err) {
		console.error("Delete task error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting task",
		});
	}
};

// Get tasks by assignee
exports.getTasksByAssignee = async (req, res) => {
	try {
		const tasks = await Task.find({ assignedTo: req.params.userId })
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.sort({ dueDate: 1 });

		res.status(200).json({
			status: "success",
			results: tasks.length,
			data: {
				tasks,
			},
		});
	} catch (err) {
		console.error("Get tasks by assignee error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching tasks by assignee",
		});
	}
};

// Get tasks by status
exports.getTasksByStatus = async (req, res) => {
	try {
		const validStatuses = ["pending", "in_progress", "completed", "cancelled"];

		if (!validStatuses.includes(req.params.status)) {
			return res.status(400).json({
				status: "fail",
				message:
					"Invalid status. Must be pending, in_progress, completed, or cancelled",
			});
		}

		const tasks = await Task.find({ status: req.params.status })
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.sort({ dueDate: 1 });

		res.status(200).json({
			status: "success",
			results: tasks.length,
			data: {
				tasks,
			},
		});
	} catch (err) {
		console.error("Get tasks by status error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching tasks by status",
		});
	}
};

// Get tasks by team
exports.getTasksByTeam = async (req, res) => {
	try {
		// Find tasks where assignedTo user belongs to the specified team
		const tasks = await Task.find()
			.populate({
				path: "assignedTo",
				match: { team: req.params.teamId },
				select: "firstName lastName email team",
			})
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.sort({ dueDate: 1 });

		// Filter out tasks where assignedTo is null (user not found or not in team)
		const filteredTasks = tasks.filter((task) => task.assignedTo);

		res.status(200).json({
			status: "success",
			results: filteredTasks.length,
			data: {
				tasks: filteredTasks,
			},
		});
	} catch (err) {
		console.error("Get tasks by team error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching tasks by team",
		});
	}
};

// Add comment to task
exports.addComment = async (req, res) => {
	try {
		const { comment } = req.body;
		const taskId = req.params.id;

		// TODO: Get actual user from authentication middleware
		const userId = req.body.userId || "507f1f77bcf86cd799439011"; // Placeholder

		if (!comment) {
			return res.status(400).json({
				status: "fail",
				message: "Comment is required",
			});
		}

		const task = await Task.findById(taskId);
		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		task.comments.push({
			user: userId,
			comment,
		});

		await task.save();

		const updatedTask = await Task.findById(taskId)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.populate("comments.user", "firstName lastName");

		res.status(200).json({
			status: "success",
			data: {
				task: updatedTask,
			},
		});
	} catch (err) {
		console.error("Add comment error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while adding comment",
		});
	}
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
	try {
		const totalTasks = await Task.countDocuments();
		const pendingTasks = await Task.countDocuments({ status: "pending" });
		const inProgressTasks = await Task.countDocuments({
			status: "in_progress",
		});
		const completedTasks = await Task.countDocuments({ status: "completed" });
		const cancelledTasks = await Task.countDocuments({ status: "cancelled" });

		// Tasks due today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const dueToday = await Task.countDocuments({
			dueDate: {
				$gte: today,
				$lt: tomorrow,
			},
			status: { $ne: "completed" },
		});

		// Overdue tasks
		const overdueTasks = await Task.countDocuments({
			dueDate: { $lt: today },
			status: { $ne: "completed" },
		});

		res.status(200).json({
			status: "success",
			data: {
				totalTasks,
				pendingTasks,
				inProgressTasks,
				completedTasks,
				cancelledTasks,
				dueToday,
				overdueTasks,
			},
		});
	} catch (err) {
		console.error("Get task stats error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching task statistics",
		});
	}
};

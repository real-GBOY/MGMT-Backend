/** @format */

const Task = require("../models/Tasks");
const User = require("../models/Users");
const Team = require("../models/Team");

// Create new task (only team leaders and vice heads for their own team)
exports.createTask = async (req, res) => {
	try {
		// Handle form data instead of JSON
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

		// Input validation for form data
		if (!title || !description || !assignedTo || !dueDate) {
			return res.status(400).json({
				status: "fail",
				message:
					"Title, description, assignedTo, and dueDate are required fields",
				missing: {
					title: !title,
					description: !description,
					assignedTo: !assignedTo,
					dueDate: !dueDate,
				},
				debug: {
					receivedBody: req.body,
					contentType: req.headers["content-type"],
					extractedFields: {
						title,
						description,
						assignedTo,
						dueDate,
						priority,
					},
				},
			});
		}

		// Validate due date format
		const parsedDueDate = new Date(dueDate);
		if (isNaN(parsedDueDate.getTime())) {
			return res.status(400).json({
				status: "fail",
				message: "Invalid due date format. Please use YYYY-MM-DD format",
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
			title: title.trim(),
			description: description.trim(),
			assignedTo,
			createdBy: creatorId,
			dueDate: parsedDueDate,
			priority: priority || "medium",
		});

		// Populate references
		const populatedTask = await Task.findById(newTask._id)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name");

		res.status(201).json({
			status: "success",
			message: "Task created successfully",
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

// Get my team tasks (for team members to see only their team's tasks)
exports.getMyTeamTasks = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate("team", "name");

		if (!user.team) {
			return res.status(404).json({
				status: "fail",
				message: "You are not assigned to any team",
			});
		}

		// Get all tasks assigned to team members
		const teamMembers = await User.find({ team: user.team._id }).select("_id");
		const teamMemberIds = teamMembers.map((member) => member._id);

		const tasks = await Task.find({
			$or: [
				{ assignedTo: { $in: teamMemberIds } },
				{ createdBy: { $in: teamMemberIds } },
			],
		})
			.populate("assignedTo", "firstName lastName email role")
			.populate("createdBy", "firstName lastName email role")
			.sort({ createdAt: -1 });

		res.status(200).json({
			status: "success",
			data: {
				team: {
					id: user.team._id,
					name: user.team.name,
				},
				tasks: {
					total: tasks.length,
					list: tasks,
				},
				userRole: user.role,
			},
		});
	} catch (err) {
		console.error("Get my team tasks error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching team tasks",
		});
	}
};

// Get tasks assigned to me (for individual users)
exports.getMyTasks = async (req, res) => {
	try {
		const userId = req.user._id;

		const tasks = await Task.find({ assignedTo: userId })
			.populate("assignedTo", "firstName lastName email role")
			.populate("createdBy", "firstName lastName email role")
			.sort({ createdAt: -1 });

		res.status(200).json({
			status: "success",
			data: {
				tasks: {
					total: tasks.length,
					list: tasks,
				},
			},
		});
	} catch (err) {
		console.error("Get my tasks error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching your tasks",
		});
	}
};

// Create task for team (enhanced version for team leaders and vice heads)
exports.createTeamTask = async (req, res) => {
	try {
		// Handle form data instead of JSON
		const { title, description, assignedTo, dueDate, priority } = req.body;
		const creatorId = req.user._id;
		const creator = await User.findById(creatorId).populate("team", "name");

		if (!creator) {
			return res.status(401).json({
				status: "fail",
				message: "Unauthorized",
			});
		}

		// Only team_leader or vice_head can create tasks
		if (!["team_leader", "vice_head"].includes(creator.role)) {
			return res.status(403).json({
				status: "fail",
				message: "Only team leaders and vice heads can create tasks",
			});
		}

		// Input validation for form data
		if (!title || !description || !assignedTo || !dueDate) {
			return res.status(400).json({
				status: "fail",
				message:
					"Title, description, assignedTo, and dueDate are required fields",
				missing: {
					title: !title,
					description: !description,
					assignedTo: !assignedTo,
					dueDate: !dueDate,
				},
			});
		}

		// Validate due date format
		const parsedDueDate = new Date(dueDate);
		if (isNaN(parsedDueDate.getTime())) {
			return res.status(400).json({
				status: "fail",
				message: "Invalid due date format. Please use YYYY-MM-DD format",
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
		if (
			!creator.team ||
			!assignedUser.team ||
			!creator.team.equals(assignedUser.team)
		) {
			return res.status(403).json({
				status: "fail",
				message: "You can only assign tasks to members of your own team",
			});
		}

		// Create task object
		const taskData = {
			title: title.trim(),
			description: description.trim(),
			assignedTo,
			createdBy: creatorId,
			dueDate: parsedDueDate,
			priority: priority || "medium",
		};

		// Handle file upload if provided
		if (req.file && req.file.path) {
			taskData.attachments = [
				{
					fileName: req.file.originalname,
					fileUrl: req.file.path,
					uploadedBy: creatorId,
				},
			];
		}

		// Create task
		const newTask = await Task.create(taskData);

		// Populate references
		const populatedTask = await Task.findById(newTask._id)
			.populate("assignedTo", "firstName lastName email role")
			.populate("createdBy", "firstName lastName email role")
			.populate("assignedTo.team", "name");

		res.status(201).json({
			status: "success",
			message: req.file
				? "Task created successfully with file attachment"
				: "Task created successfully",
			data: {
				task: populatedTask,
			},
		});
	} catch (err) {
		console.error("Create team task error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while creating task",
			error: process.env.NODE_ENV === "development" ? err.message : undefined,
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
		// Handle form data instead of JSON
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

		// Validate due date format if provided
		let parsedDueDate = null;
		if (dueDate) {
			parsedDueDate = new Date(dueDate);
			if (isNaN(parsedDueDate.getTime())) {
				return res.status(400).json({
					status: "fail",
					message: "Invalid due date format. Please use YYYY-MM-DD format",
				});
			}
		}

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

		// Prepare update object
		const updateData = {};
		if (title) updateData.title = title.trim();
		if (description) updateData.description = description.trim();
		if (assignedTo) updateData.assignedTo = assignedTo;
		if (status) updateData.status = status;
		if (parsedDueDate) updateData.dueDate = parsedDueDate;
		if (priority) updateData.priority = priority;

		// Update task
		const updatedTask = await Task.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true, runValidators: true }
		)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name");

		res.status(200).json({
			status: "success",
			message: "Task updated successfully",
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

// Update task status (for assigned users)
exports.updateTaskStatus = async (req, res) => {
	try {
		// Handle form data instead of JSON
		const { status } = req.body;
		const userId = req.user._id;

		// Check if task exists
		const task = await Task.findById(req.params.id);
		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		// Check if user is assigned to this task
		if (!task.assignedTo.equals(userId)) {
			return res.status(403).json({
				status: "fail",
				message: "You can only update tasks assigned to you",
			});
		}

		// Validate status
		const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
		if (!status || !validStatuses.includes(status)) {
			return res.status(400).json({
				status: "fail",
				message:
					"Status is required and must be one of: pending, in_progress, completed, cancelled",
				validStatuses,
			});
		}

		// Update task status
		const updatedTask = await Task.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true, runValidators: true }
		)
			.populate("assignedTo", "firstName lastName email role")
			.populate("createdBy", "firstName lastName email role");

		res.status(200).json({
			status: "success",
			message: "Task status updated successfully",
			data: {
				task: updatedTask,
			},
		});
	} catch (err) {
		console.error("Update task status error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while updating task status",
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
		// Handle form data instead of JSON
		const { comment } = req.body;
		const taskId = req.params.id;
		const userId = req.user._id;

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

		// Check if user is assigned to this task or is team leader/vice head
		const user = await User.findById(userId);
		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "Unauthorized",
			});
		}

		// Allow comments if user is assigned to task, created the task, or is team leadership
		const canComment =
			task.assignedTo.equals(userId) ||
			task.createdBy.equals(userId) ||
			["team_leader", "vice_head", "admin"].includes(user.role);

		if (!canComment) {
			return res.status(403).json({
				status: "fail",
				message:
					"You can only comment on tasks assigned to you or tasks you created",
			});
		}

		// Create comment object
		const commentObj = {
			user: userId,
			comment: comment.trim(),
		};

		// Add file attachment if uploaded
		if (req.file && req.file.path) {
			commentObj.attachment = {
				fileName: req.file.originalname,
				fileUrl: req.file.path,
			};
		}

		task.comments.push(commentObj);

		await task.save();

		const updatedTask = await Task.findById(taskId)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name")
			.populate("comments.user", "firstName lastName");

		res.status(200).json({
			status: "success",
			message: req.file
				? "Comment with attachment added successfully"
				: "Comment added successfully",
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

// Upload file to task
exports.uploadTaskFile = async (req, res) => {
	try {
		const taskId = req.params.id;
		const userId = req.user._id;

		if (!req.file) {
			return res.status(400).json({
				status: "fail",
				message: "No file uploaded",
			});
		}

		const task = await Task.findById(taskId);
		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		// Check if user is assigned to this task or is team leader/vice head
		const user = await User.findById(userId);
		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "Unauthorized",
			});
		}

		// Allow file upload if user is assigned to task, created the task, or is team leadership
		const canUpload =
			task.assignedTo.equals(userId) ||
			task.createdBy.equals(userId) ||
			["team_leader", "vice_head", "admin"].includes(user.role);

		if (!canUpload) {
			return res.status(403).json({
				status: "fail",
				message:
					"You can only upload files to tasks assigned to you or tasks you created",
			});
		}

		// Add file to task attachments
		task.attachments.push({
			fileName: req.file.originalname,
			fileUrl: req.file.path,
			uploadedBy: userId,
		});

		await task.save();

		const updatedTask = await Task.findById(taskId)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email")
			.populate("assignedTo.team", "name");

		res.status(200).json({
			status: "success",
			message: "File uploaded successfully",
			data: {
				task: updatedTask,
				file: {
					fileName: req.file.originalname,
					fileUrl: req.file.path,
				},
			},
		});
	} catch (err) {
		console.error("Upload task file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while uploading file",
		});
	}
};

// Get task files
exports.getTaskFiles = async (req, res) => {
	try {
		const taskId = req.params.id;
		const userId = req.user._id;

		const task = await Task.findById(taskId)
			.populate("assignedTo", "firstName lastName email team")
			.populate("createdBy", "firstName lastName email");

		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		// Check if user can view this task
		const user = await User.findById(userId);
		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "Unauthorized",
			});
		}

		// Allow viewing if user is assigned to task, created the task, or is team leadership
		const canView =
			task.assignedTo.equals(userId) ||
			task.createdBy.equals(userId) ||
			["team_leader", "vice_head", "admin"].includes(user.role);

		if (!canView) {
			return res.status(403).json({
				status: "fail",
				message:
					"You can only view files for tasks assigned to you or tasks you created",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				task: {
					id: task._id,
					title: task.title,
					attachments: task.attachments,
					comments: task.comments.filter((comment) => comment.attachment),
				},
			},
		});
	} catch (err) {
		console.error("Get task files error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while fetching task files",
		});
	}
};

// Delete task file
exports.deleteTaskFile = async (req, res) => {
	try {
		const { taskId, fileId } = req.params;
		const userId = req.user._id;

		const task = await Task.findById(taskId);
		if (!task) {
			return res.status(404).json({
				status: "fail",
				message: "Task not found",
			});
		}

		// Check if user can delete files from this task
		const user = await User.findById(userId);
		if (!user) {
			return res.status(401).json({
				status: "fail",
				message: "Unauthorized",
			});
		}

		// Allow deletion if user is assigned to task, created the task, or is team leadership
		const canDelete =
			task.assignedTo.equals(userId) ||
			task.createdBy.equals(userId) ||
			["team_leader", "vice_head", "admin"].includes(user.role);

		if (!canDelete) {
			return res.status(403).json({
				status: "fail",
				message:
					"You can only delete files from tasks assigned to you or tasks you created",
			});
		}

		// Find and remove the file
		const fileIndex = task.attachments.findIndex(
			(file) => file._id.toString() === fileId
		);
		if (fileIndex === -1) {
			return res.status(404).json({
				status: "fail",
				message: "File not found",
			});
		}

		task.attachments.splice(fileIndex, 1);
		await task.save();

		res.status(200).json({
			status: "success",
			message: "File deleted successfully",
			data: {
				task: {
					id: task._id,
					title: task.title,
					attachments: task.attachments,
				},
			},
		});
	} catch (err) {
		console.error("Delete task file error:", err);
		res.status(500).json({
			status: "fail",
			message: "Server error while deleting file",
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

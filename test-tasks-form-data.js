/** @format */

const axios = require("axios");
const FormData = require("form-data");

// Test configuration
const BASE_URL = "http://localhost:3000/api/v1";
const AUTH_TOKEN = "YOUR_JWT_TOKEN_HERE"; // Replace with actual token

// Helper function to create form data
function createTaskFormData(data) {
	const formData = new FormData();

	if (data.title) formData.append("title", data.title);
	if (data.description) formData.append("description", data.description);
	if (data.assignedTo) formData.append("assignedTo", data.assignedTo);
	if (data.dueDate) formData.append("dueDate", data.dueDate);
	if (data.priority) formData.append("priority", data.priority);

	return formData;
}

// Helper function to create comment form data
function createCommentFormData(comment) {
	const formData = new FormData();
	formData.append("comment", comment);
	return formData;
}

// Test functions
async function testCreateTask() {
	try {
		console.log("🧪 Testing Create Task with Form Data...");

		const taskData = {
			title: "Test Task Form Data",
			description: "This is a test task created using form data",
			assignedTo: "USER_ID_HERE", // Replace with actual user ID
			dueDate: "2024-12-31",
			priority: "high",
		};

		const formData = createTaskFormData(taskData);

		const response = await axios.post(`${BASE_URL}/tasks`, formData, {
			headers: {
				...formData.getHeaders(),
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
		});

		console.log("✅ Create Task Success:", response.data);
		return response.data.data.task._id;
	} catch (error) {
		console.error(
			"❌ Create Task Error:",
			error.response?.data || error.message
		);
	}
}

async function testCreateTeamTask() {
	try {
		console.log("🧪 Testing Create Team Task with Form Data...");

		const taskData = {
			title: "Team Task Form Data",
			description: "This is a team task created using form data",
			assignedTo: "USER_ID_HERE", // Replace with actual user ID
			dueDate: "2024-12-31",
			priority: "medium",
		};

		const formData = createTaskFormData(taskData);

		const response = await axios.post(`${BASE_URL}/tasks/team`, formData, {
			headers: {
				...formData.getHeaders(),
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
		});

		console.log("✅ Create Team Task Success:", response.data);
		return response.data.data.task._id;
	} catch (error) {
		console.error(
			"❌ Create Team Task Error:",
			error.response?.data || error.message
		);
	}
}

async function testUpdateTask(taskId) {
	try {
		console.log("🧪 Testing Update Task with Form Data...");

		const updateData = {
			title: "Updated Task Form Data",
			description: "This task has been updated using form data",
			priority: "low",
		};

		const formData = createTaskFormData(updateData);

		const response = await axios.patch(
			`${BASE_URL}/tasks/${taskId}`,
			formData,
			{
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${AUTH_TOKEN}`,
				},
			}
		);

		console.log("✅ Update Task Success:", response.data);
	} catch (error) {
		console.error(
			"❌ Update Task Error:",
			error.response?.data || error.message
		);
	}
}

async function testUpdateTaskStatus(taskId) {
	try {
		console.log("🧪 Testing Update Task Status with Form Data...");

		const statusData = {
			status: "in_progress",
		};

		const formData = new FormData();
		formData.append("status", statusData.status);

		const response = await axios.patch(
			`${BASE_URL}/tasks/${taskId}/status`,
			formData,
			{
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${AUTH_TOKEN}`,
				},
			}
		);

		console.log("✅ Update Task Status Success:", response.data);
	} catch (error) {
		console.error(
			"❌ Update Task Status Error:",
			error.response?.data || error.message
		);
	}
}

async function testAddComment(taskId) {
	try {
		console.log("🧪 Testing Add Comment with Form Data...");

		const commentData = {
			comment: "This is a test comment added using form data",
		};

		const formData = createCommentFormData(commentData.comment);

		const response = await axios.post(
			`${BASE_URL}/tasks/${taskId}/comments`,
			formData,
			{
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${AUTH_TOKEN}`,
				},
			}
		);

		console.log("✅ Add Comment Success:", response.data);
	} catch (error) {
		console.error(
			"❌ Add Comment Error:",
			error.response?.data || error.message
		);
	}
}

async function testAddCommentWithFile(taskId) {
	try {
		console.log("🧪 Testing Add Comment with File using Form Data...");

		const fs = require("fs");
		const path = require("path");

		// Create a test file
		const testFilePath = path.join(__dirname, "test-file.txt");
		fs.writeFileSync(
			testFilePath,
			"This is a test file for comment attachment"
		);

		const formData = new FormData();
		formData.append("comment", "This comment has a file attachment");
		formData.append("file", fs.createReadStream(testFilePath));

		const response = await axios.post(
			`${BASE_URL}/tasks/${taskId}/comments/with-file`,
			formData,
			{
				headers: {
					...formData.getHeaders(),
					Authorization: `Bearer ${AUTH_TOKEN}`,
				},
			}
		);

		console.log("✅ Add Comment with File Success:", response.data);

		// Clean up test file
		fs.unlinkSync(testFilePath);
	} catch (error) {
		console.error(
			"❌ Add Comment with File Error:",
			error.response?.data || error.message
		);
	}
}

// Main test function
async function runTests() {
	console.log("🚀 Starting Task Controller Form Data Tests...\n");

	try {
		// Test 1: Create Task
		const taskId = await testCreateTask();

		if (taskId) {
			console.log("\n" + "=".repeat(50) + "\n");

			// Test 2: Create Team Task
			await testCreateTeamTask();

			console.log("\n" + "=".repeat(50) + "\n");

			// Test 3: Update Task
			await testUpdateTask(taskId);

			console.log("\n" + "=".repeat(50) + "\n");

			// Test 4: Update Task Status
			await testUpdateTaskStatus(taskId);

			console.log("\n" + "=".repeat(50) + "\n");

			// Test 5: Add Comment
			await testAddComment(taskId);

			console.log("\n" + "=".repeat(50) + "\n");

			// Test 6: Add Comment with File
			await testAddCommentWithFile(taskId);
		}

		console.log("\n🎉 All tests completed!");
	} catch (error) {
		console.error("❌ Test execution error:", error);
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	runTests();
}

module.exports = {
	testCreateTask,
	testCreateTeamTask,
	testUpdateTask,
	testUpdateTaskStatus,
	testAddComment,
	testAddCommentWithFile,
	runTests,
};

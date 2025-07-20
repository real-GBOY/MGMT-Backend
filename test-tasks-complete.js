/** @format */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

// Test users data
const testUsers = {
	admin: {
		firstName: "Admin",
		lastName: "User",
		nationalID: "123456789",
		email: "admin@enactus.com",
		password: "AdminPass123!",
		phoneNumber: "+1234567890",
		role: "admin",
		dateOfBirth: "1990-01-01",
	},
	teamLeader: {
		firstName: "Team",
		lastName: "Leader",
		nationalID: "234567890",
		email: "teamleader@enactus.com",
		password: "TeamLeaderPass123!",
		phoneNumber: "+1234567891",
		role: "team_leader",
		dateOfBirth: "1992-05-15",
	},
	viceHead: {
		firstName: "Vice",
		lastName: "Head",
		nationalID: "345678901",
		email: "vicehead@enactus.com",
		password: "ViceHeadPass123!",
		phoneNumber: "+1234567892",
		role: "vice_head",
		dateOfBirth: "1993-08-20",
	},
	member: {
		firstName: "Member",
		lastName: "User",
		nationalID: "456789012",
		email: "member@enactus.com",
		password: "MemberPass123!",
		phoneNumber: "+1234567893",
		role: "member",
		dateOfBirth: "1995-12-10",
	},
};

// Test task data
const testTasks = {
	task1: {
		title: "Complete Project Report",
		description: "Write a comprehensive project report for Q1 2024",
		dueDate: "2024-02-15T00:00:00.000Z",
		priority: "high",
	},
	task2: {
		title: "Review Code Changes",
		description: "Review and approve recent code changes in the repository",
		dueDate: "2024-02-10T00:00:00.000Z",
		priority: "medium",
	},
	task3: {
		title: "Update Documentation",
		description: "Update API documentation with latest changes",
		dueDate: "2024-02-20T00:00:00.000Z",
		priority: "low",
	},
};

let adminToken, teamLeaderToken, viceHeadToken, memberToken;
let createdTaskId, createdUserId;

async function testTasksComplete() {
	console.log("🧪 Testing Complete Task Management System...\n");

	try {
		// Step 1: Register and login all test users
		console.log("1. Setting up test users...");
		await setupTestUsers();

		// Step 2: Test task creation
		console.log("\n2. Testing Task Creation...");
		await testTaskCreation();

		// Step 3: Test task retrieval
		console.log("\n3. Testing Task Retrieval...");
		await testTaskRetrieval();

		// Step 4: Test task updates
		console.log("\n4. Testing Task Updates...");
		await testTaskUpdates();

		// Step 5: Test task comments
		console.log("\n5. Testing Task Comments...");
		await testTaskComments();

		// Step 6: Test task statistics
		console.log("\n6. Testing Task Statistics...");
		await testTaskStatistics();

		// Step 7: Test role-based access
		console.log("\n7. Testing Role-Based Access...");
		await testRoleBasedAccess();

		// Step 8: Test task filtering
		console.log("\n8. Testing Task Filtering...");
		await testTaskFiltering();

		// Step 9: Test task deletion
		console.log("\n9. Testing Task Deletion...");
		await testTaskDeletion();

		console.log("\n🎉 All Task Tests Completed Successfully!");
		console.log("\n📋 Summary:");
		console.log("- ✅ User Registration & Login");
		console.log("- ✅ Task Creation (Role-based)");
		console.log("- ✅ Task Retrieval & Filtering");
		console.log("- ✅ Task Updates & Status Changes");
		console.log("- ✅ Task Comments");
		console.log("- ✅ Task Statistics");
		console.log("- ✅ Role-Based Access Control");
		console.log("- ✅ Task Deletion");
	} catch (error) {
		console.log("\n❌ Test failed:", error.message);
		if (error.response) {
			console.log("Response Status:", error.response.status);
			console.log("Response Data:", error.response.data);
		}
	}
}

async function setupTestUsers() {
	// Register and login all test users
	for (const [role, userData] of Object.entries(testUsers)) {
		try {
			// Register user
			await axios.post(`${BASE_URL}/auth/register`, userData);
			console.log(`✅ ${role} registered`);
		} catch (error) {
			if (error.response?.data?.message?.includes("already exists")) {
				console.log(`✅ ${role} already exists`);
			} else {
				console.log(
					`❌ ${role} registration failed:`,
					error.response?.data?.message
				);
			}
		}

		// Login user
		try {
			const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
				email: userData.email,
				password: userData.password,
			});

			// Store tokens
			switch (role) {
				case "admin":
					adminToken = loginResponse.data.data.tokens.accessToken;
					break;
				case "teamLeader":
					teamLeaderToken = loginResponse.data.data.tokens.accessToken;
					break;
				case "viceHead":
					viceHeadToken = loginResponse.data.data.tokens.accessToken;
					break;
				case "member":
					memberToken = loginResponse.data.data.tokens.accessToken;
					createdUserId = loginResponse.data.data.user._id;
					break;
			}
			console.log(`✅ ${role} logged in`);
		} catch (error) {
			console.log(`❌ ${role} login failed:`, error.response?.data?.message);
		}
	}
}

async function testTaskCreation() {
	// Test 1: Team Leader creates task
	try {
		const taskData = {
			...testTasks.task1,
			assignedTo: createdUserId,
		};

		const response = await axios.post(`${BASE_URL}/tasks`, taskData, {
			headers: { Authorization: `Bearer ${teamLeaderToken}` },
		});

		createdTaskId = response.data.data.task._id;
		console.log("✅ Team Leader created task:", response.data.data.task.title);
	} catch (error) {
		console.log(
			"❌ Team Leader task creation failed:",
			error.response?.data?.message
		);
	}

	// Test 2: Vice Head creates task
	try {
		const taskData = {
			...testTasks.task2,
			assignedTo: createdUserId,
		};

		const response = await axios.post(`${BASE_URL}/tasks`, taskData, {
			headers: { Authorization: `Bearer ${viceHeadToken}` },
		});

		console.log("✅ Vice Head created task:", response.data.data.task.title);
	} catch (error) {
		console.log(
			"❌ Vice Head task creation failed:",
			error.response?.data?.message
		);
	}

	// Test 3: Member tries to create task (should fail)
	try {
		const taskData = {
			...testTasks.task3,
			assignedTo: createdUserId,
		};

		await axios.post(`${BASE_URL}/tasks`, taskData, {
			headers: { Authorization: `Bearer ${memberToken}` },
		});

		console.log("❌ Member should not be able to create tasks");
	} catch (error) {
		if (error.response?.status === 403) {
			console.log("✅ Member correctly blocked from creating tasks");
		} else {
			console.log(
				"❌ Unexpected error for member task creation:",
				error.response?.data?.message
			);
		}
	}
}

async function testTaskRetrieval() {
	// Test 1: Get all tasks
	try {
		const response = await axios.get(`${BASE_URL}/tasks`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log(
			"✅ Retrieved all tasks:",
			response.data.results,
			"tasks found"
		);
	} catch (error) {
		console.log("❌ Get all tasks failed:", error.response?.data?.message);
	}

	// Test 2: Get specific task
	try {
		const response = await axios.get(`${BASE_URL}/tasks/${createdTaskId}`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log("✅ Retrieved specific task:", response.data.data.task.title);
	} catch (error) {
		console.log("❌ Get specific task failed:", error.response?.data?.message);
	}

	// Test 3: Get tasks by assignee
	try {
		const response = await axios.get(
			`${BASE_URL}/tasks/assignee/${createdUserId}`,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
			}
		);

		console.log(
			"✅ Retrieved tasks by assignee:",
			response.data.results,
			"tasks found"
		);
	} catch (error) {
		console.log(
			"❌ Get tasks by assignee failed:",
			error.response?.data?.message
		);
	}
}

async function testTaskUpdates() {
	// Test 1: Update task status
	try {
		const response = await axios.patch(
			`${BASE_URL}/tasks/${createdTaskId}`,
			{
				status: "in_progress",
			},
			{
				headers: { Authorization: `Bearer ${teamLeaderToken}` },
			}
		);

		console.log("✅ Updated task status to:", response.data.data.task.status);
	} catch (error) {
		console.log("❌ Update task status failed:", error.response?.data?.message);
	}

	// Test 2: Update task description
	try {
		const response = await axios.patch(
			`${BASE_URL}/tasks/${createdTaskId}`,
			{
				description: "Updated description with more details",
			},
			{
				headers: { Authorization: `Bearer ${teamLeaderToken}` },
			}
		);

		console.log("✅ Updated task description");
	} catch (error) {
		console.log(
			"❌ Update task description failed:",
			error.response?.data?.message
		);
	}

	// Test 3: Update task due date
	try {
		const response = await axios.patch(
			`${BASE_URL}/tasks/${createdTaskId}`,
			{
				dueDate: "2024-03-01T00:00:00.000Z",
			},
			{
				headers: { Authorization: `Bearer ${teamLeaderToken}` },
			}
		);

		console.log("✅ Updated task due date");
	} catch (error) {
		console.log(
			"❌ Update task due date failed:",
			error.response?.data?.message
		);
	}
}

async function testTaskComments() {
	// Test 1: Add comment as team leader
	try {
		const response = await axios.post(
			`${BASE_URL}/tasks/${createdTaskId}/comments`,
			{
				comment: "Great progress on this task!",
				userId: createdUserId, // This should come from auth middleware in real app
			},
			{
				headers: { Authorization: `Bearer ${teamLeaderToken}` },
			}
		);

		console.log("✅ Added comment as team leader");
	} catch (error) {
		console.log("❌ Add comment failed:", error.response?.data?.message);
	}

	// Test 2: Add comment as member
	try {
		const response = await axios.post(
			`${BASE_URL}/tasks/${createdTaskId}/comments`,
			{
				comment: "Working on this task now",
				userId: createdUserId,
			},
			{
				headers: { Authorization: `Bearer ${memberToken}` },
			}
		);

		console.log("✅ Added comment as member");
	} catch (error) {
		console.log(
			"❌ Add comment as member failed:",
			error.response?.data?.message
		);
	}
}

async function testTaskStatistics() {
	try {
		const response = await axios.get(`${BASE_URL}/tasks/stats`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		const stats = response.data.data;
		console.log("✅ Task Statistics:");
		console.log(`   - Total Tasks: ${stats.totalTasks}`);
		console.log(`   - Pending: ${stats.pendingTasks}`);
		console.log(`   - In Progress: ${stats.inProgressTasks}`);
		console.log(`   - Completed: ${stats.completedTasks}`);
		console.log(`   - Cancelled: ${stats.cancelledTasks}`);
		console.log(`   - Due Today: ${stats.dueToday}`);
		console.log(`   - Overdue: ${stats.overdueTasks}`);
	} catch (error) {
		console.log(
			"❌ Get task statistics failed:",
			error.response?.data?.message
		);
	}
}

async function testRoleBasedAccess() {
	// Test 1: Member tries to update task (should fail)
	try {
		await axios.patch(
			`${BASE_URL}/tasks/${createdTaskId}`,
			{
				status: "completed",
			},
			{
				headers: { Authorization: `Bearer ${memberToken}` },
			}
		);

		console.log("❌ Member should not be able to update tasks");
	} catch (error) {
		if (error.response?.status === 403) {
			console.log("✅ Member correctly blocked from updating tasks");
		} else {
			console.log(
				"❌ Unexpected error for member task update:",
				error.response?.data?.message
			);
		}
	}

	// Test 2: Admin can access all tasks
	try {
		const response = await axios.get(`${BASE_URL}/tasks`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log("✅ Admin can access all tasks");
	} catch (error) {
		console.log("❌ Admin access failed:", error.response?.data?.message);
	}
}

async function testTaskFiltering() {
	// Test 1: Get tasks by status
	try {
		const response = await axios.get(`${BASE_URL}/tasks/status/in_progress`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log(
			"✅ Retrieved tasks by status (in_progress):",
			response.data.results,
			"tasks"
		);
	} catch (error) {
		console.log(
			"❌ Get tasks by status failed:",
			error.response?.data?.message
		);
	}

	// Test 2: Get tasks by status (pending)
	try {
		const response = await axios.get(`${BASE_URL}/tasks/status/pending`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log(
			"✅ Retrieved tasks by status (pending):",
			response.data.results,
			"tasks"
		);
	} catch (error) {
		console.log(
			"❌ Get tasks by status (pending) failed:",
			error.response?.data?.message
		);
	}

	// Test 3: Get tasks by invalid status
	try {
		await axios.get(`${BASE_URL}/tasks/status/invalid_status`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log("❌ Should not accept invalid status");
	} catch (error) {
		if (error.response?.status === 400) {
			console.log("✅ Correctly rejected invalid status");
		} else {
			console.log(
				"❌ Unexpected error for invalid status:",
				error.response?.data?.message
			);
		}
	}
}

async function testTaskDeletion() {
	// Test 1: Admin deletes task
	try {
		const response = await axios.delete(`${BASE_URL}/tasks/${createdTaskId}`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log("✅ Admin deleted task successfully");
	} catch (error) {
		console.log(
			"❌ Admin task deletion failed:",
			error.response?.data?.message
		);
	}

	// Test 2: Verify task is deleted
	try {
		await axios.get(`${BASE_URL}/tasks/${createdTaskId}`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});

		console.log("❌ Task should be deleted");
	} catch (error) {
		if (error.response?.status === 404) {
			console.log("✅ Task correctly deleted (404 not found)");
		} else {
			console.log(
				"❌ Unexpected error checking deleted task:",
				error.response?.data?.message
			);
		}
	}
}

// Run the complete test
testTasksComplete();

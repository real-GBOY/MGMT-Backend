/** @format */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

// Simple test data
const testUser = {
	firstName: "Test",
	lastName: "User",
	nationalID: "999999999",
	email: "testuser@enactus.com",
	password: "TestPass123!",
	phoneNumber: "+1234567899",
	role: "member",
	dateOfBirth: "1995-01-01",
};

const testTask = {
	title: "Test Task",
	description: "This is a test task for testing purposes",
	dueDate: "2024-03-01T00:00:00.000Z",
	priority: "medium",
};

async function testTasksSimple() {
	console.log("🧪 Simple Task Testing...\n");

	try {
		// Step 1: Register and login user
		console.log("1. Setting up test user...");
		let userId, userToken;

		try {
			await axios.post(`${BASE_URL}/auth/register`, testUser);
			console.log("✅ User registered");
		} catch (error) {
			if (error.response?.data?.message?.includes("already exists")) {
				console.log("✅ User already exists");
			} else {
				console.log("❌ Registration failed:", error.response?.data?.message);
				return;
			}
		}

		try {
			const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
				email: testUser.email,
				password: testUser.password,
			});
			userToken = loginResponse.data.data.tokens.accessToken;
			userId = loginResponse.data.data.user._id;
			console.log("✅ User logged in");
		} catch (error) {
			console.log("❌ Login failed:", error.response?.data?.message);
			return;
		}

		// Step 2: Test task statistics (no auth required)
		console.log("\n2. Testing Task Statistics...");
		try {
			const statsResponse = await axios.get(`${BASE_URL}/tasks/stats`);
			console.log("✅ Task Statistics:", statsResponse.data.data);
		} catch (error) {
			console.log("❌ Task statistics failed:", error.response?.data?.message);
		}

		// Step 3: Test getting all tasks
		console.log("\n3. Testing Get All Tasks...");
		try {
			const tasksResponse = await axios.get(`${BASE_URL}/tasks`);
			console.log(
				"✅ Retrieved tasks:",
				tasksResponse.data.results,
				"tasks found"
			);
		} catch (error) {
			console.log("❌ Get tasks failed:", error.response?.data?.message);
		}

		// Step 4: Test getting tasks by status
		console.log("\n4. Testing Get Tasks by Status...");
		try {
			const pendingResponse = await axios.get(
				`${BASE_URL}/tasks/status/pending`
			);
			console.log("✅ Pending tasks:", pendingResponse.data.results, "tasks");
		} catch (error) {
			console.log(
				"❌ Get pending tasks failed:",
				error.response?.data?.message
			);
		}

		// Step 5: Test getting tasks by assignee
		console.log("\n5. Testing Get Tasks by Assignee...");
		try {
			const assigneeResponse = await axios.get(
				`${BASE_URL}/tasks/assignee/${userId}`
			);
			console.log(
				"✅ Tasks assigned to user:",
				assigneeResponse.data.results,
				"tasks"
			);
		} catch (error) {
			console.log(
				"❌ Get tasks by assignee failed:",
				error.response?.data?.message
			);
		}

		// Step 6: Test task creation (should fail for member)
		console.log("\n6. Testing Task Creation (Member should fail)...");
		try {
			const taskData = {
				...testTask,
				assignedTo: userId,
			};

			await axios.post(`${BASE_URL}/tasks`, taskData, {
				headers: { Authorization: `Bearer ${userToken}` },
			});

			console.log("❌ Member should not be able to create tasks");
		} catch (error) {
			if (error.response?.status === 403) {
				console.log("✅ Member correctly blocked from creating tasks");
			} else {
				console.log("❌ Unexpected error:", error.response?.data?.message);
			}
		}

		console.log("\n🎉 Simple Task Tests Completed!");
		console.log("\n📋 What was tested:");
		console.log("- ✅ Task Statistics");
		console.log("- ✅ Get All Tasks");
		console.log("- ✅ Get Tasks by Status");
		console.log("- ✅ Get Tasks by Assignee");
		console.log("- ✅ Role-based Task Creation (Member blocked)");
	} catch (error) {
		console.log("\n❌ Test failed:", error.message);
		if (error.response) {
			console.log("Response Status:", error.response.status);
			console.log("Response Data:", error.response.data);
		}
	}
}

// Run the simple test
testTasksSimple();

/** @format */

const axios = require("axios");

// Test configuration - UPDATE THESE VALUES
const BASE_URL = "http://localhost:3000/api/v1";
const AUTH_TOKEN = "YOUR_JWT_TOKEN_HERE"; // Replace with your actual JWT token
const USER_ID = "USER_ID_HERE"; // Replace with an actual user ID from your database

// Test function using URLSearchParams (recommended method)
async function testCreateTaskWithURLSearchParams() {
	console.log("🧪 Testing Create Task with URLSearchParams...");

	try {
		const formData = new URLSearchParams();
		formData.append("title", "Test Task Form Data");
		formData.append(
			"description",
			"This is a test task created using form data"
		);
		formData.append("assignedTo", USER_ID);
		formData.append("dueDate", "2024-12-31");
		formData.append("priority", "high");

		const response = await axios.post(`${BASE_URL}/tasks`, formData, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
		});

		console.log("✅ Success:", response.data);
		return response.data.data.task._id;
	} catch (error) {
		console.error("❌ Error:", error.response?.data || error.message);
		if (error.response?.data?.debug) {
			console.log("🔍 Debug Info:", error.response.data.debug);
		}
	}
}

// Test function using FormData
async function testCreateTaskWithFormData() {
	console.log("🧪 Testing Create Task with FormData...");

	try {
		const FormData = require("form-data");
		const formData = new FormData();
		formData.append("title", "Test Task FormData");
		formData.append(
			"description",
			"This is a test task created using FormData"
		);
		formData.append("assignedTo", USER_ID);
		formData.append("dueDate", "2024-12-31");
		formData.append("priority", "medium");

		const response = await axios.post(`${BASE_URL}/tasks`, formData, {
			headers: {
				...formData.getHeaders(),
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
		});

		console.log("✅ Success:", response.data);
		return response.data.data.task._id;
	} catch (error) {
		console.error("❌ Error:", error.response?.data || error.message);
		if (error.response?.data?.debug) {
			console.log("🔍 Debug Info:", error.response.data.debug);
		}
	}
}

// Test function using fetch (browser-style)
async function testCreateTaskWithFetch() {
	console.log("🧪 Testing Create Task with Fetch...");

	try {
		const formData = new URLSearchParams();
		formData.append("title", "Test Task Fetch");
		formData.append("description", "This is a test task created using fetch");
		formData.append("assignedTo", USER_ID);
		formData.append("dueDate", "2024-12-31");
		formData.append("priority", "low");

		const response = await fetch(`${BASE_URL}/tasks`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
			body: formData.toString(),
		});

		const result = await response.json();
		console.log("✅ Success:", result);
		return result.data?.task?._id;
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

// Main test function
async function runAllTests() {
	console.log("🚀 Starting Form Data Tests...\n");
	console.log("📝 Make sure to update AUTH_TOKEN and USER_ID in this file!\n");

	// Test 1: URLSearchParams
	console.log("=".repeat(50));
	await testCreateTaskWithURLSearchParams();

	// Test 2: FormData
	console.log("\n" + "=".repeat(50));
	await testCreateTaskWithFormData();

	// Test 3: Fetch
	console.log("\n" + "=".repeat(50));
	await testCreateTaskWithFetch();

	console.log("\n🎉 All tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
	// Check if configuration is set
	if (AUTH_TOKEN === "YOUR_JWT_TOKEN_HERE" || USER_ID === "USER_ID_HERE") {
		console.log("❌ Please update the configuration in this file:");
		console.log("   - AUTH_TOKEN: Replace with your actual JWT token");
		console.log(
			"   - USER_ID: Replace with an actual user ID from your database"
		);
		console.log("\nExample:");
		console.log(
			"   const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';"
		);
		console.log("   const USER_ID = '507f1f77bcf86cd799439011';");
	} else {
		runAllTests();
	}
}

module.exports = {
	testCreateTaskWithURLSearchParams,
	testCreateTaskWithFormData,
	testCreateTaskWithFetch,
	runAllTests,
};

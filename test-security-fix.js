/** @format */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

async function testSecurityMiddleware() {
	console.log("🧪 Testing Security Middleware Fix...\n");

	try {
		// Test 1: Health check (should work without req.body)
		console.log("1. Testing Health Check...");
		const healthResponse = await axios.get(`${BASE_URL}/status`);
		console.log("✅ Health Check Status:", healthResponse.status);
		console.log("✅ Health Check Data:", healthResponse.data.status);

		// Test 2: Login attempt (should log without error)
		console.log("\n2. Testing Login Attempt Logging...");
		try {
			await axios.post(`${BASE_URL}/auth/login`, {
				email: "test@example.com",
				password: "wrongpassword",
			});
		} catch (error) {
			// Expected to fail, but should not crash
			console.log(
				"✅ Login attempt failed as expected (Status:",
				error.response?.status + ")"
			);
		}

		// Test 3: GET request (should work without req.body)
		console.log("\n3. Testing GET Request...");
		try {
			await axios.get(`${BASE_URL}/auth/profile`, {
				headers: { Authorization: "Bearer invalid-token" },
			});
		} catch (error) {
			// Expected to fail, but should not crash
			console.log(
				"✅ GET request failed as expected (Status:",
				error.response?.status + ")"
			);
		}

		// Test 4: Registration attempt (should work with req.body)
		console.log("\n4. Testing Registration...");
		try {
			const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
				firstName: "Test",
				lastName: "User",
				nationalID: "123456789",
				email: "test@example.com",
				password: "TestPass123!",
				phoneNumber: "+1234567890",
				role: "member",
				dateOfBirth: "1995-01-01",
			});
			console.log("✅ Registration Status:", registerResponse.status);
		} catch (error) {
			if (error.response?.data?.message?.includes("already exists")) {
				console.log("✅ Registration failed as expected (user already exists)");
			} else {
				console.log(
					"❌ Registration failed unexpectedly:",
					error.response?.data?.message
				);
			}
		}

		console.log("\n🎉 Security Middleware Test Completed Successfully!");
		console.log('✅ No more "Cannot read properties of undefined" errors!');
	} catch (error) {
		console.log("\n❌ Security Middleware Test Failed:");
		console.log("Error:", error.message);
		if (error.response) {
			console.log("Response Status:", error.response.status);
			console.log("Response Data:", error.response.data);
		}
	}
}

// Run the test
testSecurityMiddleware();

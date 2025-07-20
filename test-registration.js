/** @format */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

async function testRegistration() {
	console.log("🧪 Testing User Registration...\n");

	try {
		// Test data
		const userData = {
			firstName: "Test",
			lastName: "User",
			nationalID: "123456789",
			email: "test@example.com",
			password: "TestPass123!",
			phoneNumber: "+1234567890",
			role: "member",
			dateOfBirth: "1995-01-01",
		};

		console.log("📝 Registration Data:", userData);

		// Make registration request
		const response = await axios.post(`${BASE_URL}/auth/register`, userData, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		console.log("\n✅ Registration Response:");
		console.log("Status:", response.status);
		console.log("Status Text:", response.statusText);
		console.log("Response Data:", JSON.stringify(response.data, null, 2));

		// Check if token is present
		if (response.data.data && response.data.data.token) {
			console.log("\n🎉 SUCCESS: Token is present in response!");
			console.log("Token:", response.data.data.token.substring(0, 50) + "...");
			console.log(
				"Refresh Token:",
				response.data.data.refreshToken ? "Present" : "Missing"
			);
		} else {
			console.log("\n❌ FAILED: Token is missing from response!");
		}

		// Test login with the same credentials
		console.log("\n🔐 Testing Login...");
		const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
			email: userData.email,
			password: userData.password,
		});

		console.log("Login Status:", loginResponse.status);
		console.log("Login Token Present:", !!loginResponse.data.data?.token);
	} catch (error) {
		console.log("\n❌ Registration Test Failed:");
		if (error.response) {
			console.log("Status:", error.response.status);
			console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
		} else {
			console.log("Error:", error.message);
		}
	}
}

// Run the test
testRegistration();

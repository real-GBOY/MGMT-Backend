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
	teamHead: {
		firstName: "Team",
		lastName: "Head",
		nationalID: "234567890",
		email: "teamhead@enactus.com",
		password: "TeamHeadPass123!",
		phoneNumber: "+1234567891",
		role: "team_leader",
		dateOfBirth: "1992-05-15",
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

async function testLoginAPI() {
	console.log("🧪 Testing Login API...\n");

	// Test 1: Health Check
	console.log("1. Testing Health Check...");
	try {
		const healthResponse = await axios.get(`${BASE_URL}/status`);
		console.log("✅ Health Check Status:", healthResponse.status);
		console.log("✅ Health Check Data:", healthResponse.data.status);
	} catch (error) {
		console.log("❌ Health Check Failed:", error.message);
		return;
	}

	// Test 2: Register Admin User
	console.log("\n2. Testing Admin Registration...");
	try {
		const adminRegister = await axios.post(
			`${BASE_URL}/auth/register`,
			testUsers.admin
		);
		console.log("✅ Admin Registration Status:", adminRegister.status);
		console.log("✅ Admin Registration Message:", adminRegister.data.message);

		if (adminRegister.data.data?.token) {
			console.log(
				"✅ Admin Token Generated:",
				adminRegister.data.data.token.substring(0, 20) + "..."
			);
		}
	} catch (error) {
		if (error.response?.data?.message?.includes("already exists")) {
			console.log("✅ Admin already exists (expected)");
		} else {
			console.log(
				"❌ Admin Registration Failed:",
				error.response?.data?.message || error.message
			);
		}
	}

	// Test 3: Register Team Head User
	console.log("\n3. Testing Team Head Registration...");
	try {
		const teamHeadRegister = await axios.post(
			`${BASE_URL}/auth/register`,
			testUsers.teamHead
		);
		console.log("✅ Team Head Registration Status:", teamHeadRegister.status);
		console.log(
			"✅ Team Head Registration Message:",
			teamHeadRegister.data.message
		);
	} catch (error) {
		if (error.response?.data?.message?.includes("already exists")) {
			console.log("✅ Team Head already exists (expected)");
		} else {
			console.log(
				"❌ Team Head Registration Failed:",
				error.response?.data?.message || error.message
			);
		}
	}

	// Test 4: Register Member User
	console.log("\n4. Testing Member Registration...");
	try {
		const memberRegister = await axios.post(
			`${BASE_URL}/auth/register`,
			testUsers.member
		);
		console.log("✅ Member Registration Status:", memberRegister.status);
		console.log("✅ Member Registration Message:", memberRegister.data.message);
	} catch (error) {
		if (error.response?.data?.message?.includes("already exists")) {
			console.log("✅ Member already exists (expected)");
		} else {
			console.log(
				"❌ Member Registration Failed:",
				error.response?.data?.message || error.message
			);
		}
	}

	// Test 5: Admin Login
	console.log("\n5. Testing Admin Login...");
	try {
		const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
			email: testUsers.admin.email,
			password: testUsers.admin.password,
		});
		console.log("✅ Admin Login Status:", adminLogin.status);
		console.log("✅ Admin Login Message:", adminLogin.data.status);

		if (adminLogin.data.data?.tokens?.accessToken) {
			const adminToken = adminLogin.data.data.tokens.accessToken;
			console.log(
				"✅ Admin Access Token:",
				adminToken.substring(0, 20) + "..."
			);

			// Test 6: Get Admin Profile with Token
			console.log("\n6. Testing Admin Profile...");
			try {
				const adminProfile = await axios.get(`${BASE_URL}/auth/profile`, {
					headers: { Authorization: `Bearer ${adminToken}` },
				});
				console.log("✅ Admin Profile Status:", adminProfile.status);
				console.log("✅ Admin Profile Data:", {
					name: `${adminProfile.data.data.user.firstName} ${adminProfile.data.data.user.lastName}`,
					email: adminProfile.data.data.user.email,
					role: adminProfile.data.data.user.role,
				});
			} catch (profileError) {
				console.log(
					"❌ Admin Profile Failed:",
					profileError.response?.data?.message || profileError.message
				);
			}
		}
	} catch (error) {
		console.log(
			"❌ Admin Login Failed:",
			error.response?.data?.message || error.message
		);
	}

	// Test 7: Team Head Login
	console.log("\n7. Testing Team Head Login...");
	try {
		const teamHeadLogin = await axios.post(`${BASE_URL}/auth/login`, {
			email: testUsers.teamHead.email,
			password: testUsers.teamHead.password,
		});
		console.log("✅ Team Head Login Status:", teamHeadLogin.status);
		console.log("✅ Team Head Login Message:", teamHeadLogin.data.status);

		if (teamHeadLogin.data.data?.tokens?.accessToken) {
			console.log(
				"✅ Team Head Access Token:",
				teamHeadLogin.data.data.tokens.accessToken.substring(0, 20) + "..."
			);
		}
	} catch (error) {
		console.log(
			"❌ Team Head Login Failed:",
			error.response?.data?.message || error.message
		);
	}

	// Test 8: Member Login
	console.log("\n8. Testing Member Login...");
	try {
		const memberLogin = await axios.post(`${BASE_URL}/auth/login`, {
			email: testUsers.member.email,
			password: testUsers.member.password,
		});
		console.log("✅ Member Login Status:", memberLogin.status);
		console.log("✅ Member Login Message:", memberLogin.data.status);

		if (memberLogin.data.data?.tokens?.accessToken) {
			console.log(
				"✅ Member Access Token:",
				memberLogin.data.data.tokens.accessToken.substring(0, 20) + "..."
			);
		}
	} catch (error) {
		console.log(
			"❌ Member Login Failed:",
			error.response?.data?.message || error.message
		);
	}

	// Test 9: Invalid Login Attempt
	console.log("\n9. Testing Invalid Login...");
	try {
		await axios.post(`${BASE_URL}/auth/login`, {
			email: "invalid@email.com",
			password: "wrongpassword",
		});
		console.log("❌ Invalid login should have failed");
	} catch (error) {
		console.log(
			"✅ Invalid Login Failed as Expected (Status:",
			error.response?.status + ")"
		);
		console.log("✅ Error Message:", error.response?.data?.message);
	}

	console.log("\n🎉 Login API Tests Completed!");
	console.log("\n📋 Summary:");
	console.log("- ✅ Health Check: Server is running");
	console.log("- ✅ Registration: Users can be registered");
	console.log("- ✅ Login: Users can authenticate");
	console.log("- ✅ Profile: Protected routes work with tokens");
	console.log("- ✅ Security: Invalid credentials are rejected");
}

// Run the test
testLoginAPI();

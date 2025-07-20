/** @format */

const { generateTokenPair, verifyToken } = require("./utils/jwt");

async function testJWTGeneration() {
	console.log("🧪 Testing JWT Generation...\n");

	try {
		// Test data
		const userId = "507f1f77bcf86cd799439011";
		const role = "member";
		const team = "507f1f77bcf86cd799439012";

		console.log("📝 Test Data:");
		console.log("User ID:", userId);
		console.log("Role:", role);
		console.log("Team:", team);

		// Generate token pair
		console.log("\n🔐 Generating Token Pair...");
		const tokens = generateTokenPair(userId, role, team);

		console.log("✅ Token Generation Successful!");
		console.log("Access Token:", tokens.accessToken.substring(0, 50) + "...");
		console.log("Refresh Token:", tokens.refreshToken.substring(0, 50) + "...");
		console.log("Expires In:", tokens.expiresIn);

		// Verify the access token
		console.log("\n🔍 Verifying Access Token...");
		const verification = verifyToken(tokens.accessToken);

		if (verification.valid) {
			console.log("✅ Token Verification Successful!");
			console.log("Decoded Payload:", verification.decoded);
		} else {
			console.log("❌ Token Verification Failed:", verification.error);
		}

		// Verify the refresh token
		console.log("\n🔍 Verifying Refresh Token...");
		const refreshVerification = verifyToken(tokens.refreshToken);

		if (refreshVerification.valid) {
			console.log("✅ Refresh Token Verification Successful!");
			console.log("Decoded Payload:", refreshVerification.decoded);
		} else {
			console.log(
				"❌ Refresh Token Verification Failed:",
				refreshVerification.error
			);
		}

		console.log("\n🎉 JWT Generation Test Completed Successfully!");
	} catch (error) {
		console.log("\n❌ JWT Generation Test Failed:");
		console.log("Error:", error.message);
		console.log("Stack:", error.stack);
	}
}

// Run the test
testJWTGeneration();

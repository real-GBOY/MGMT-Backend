/** @format */

const http = require("http");

// Configuration
const BASE_URL = "http://localhost:3000/api/v1";
const TEAM_ID = "688bcd0aae16916ad2a8a217";
const USER_ID = "688f7931599e6c4d13e5ac46";

// You need to get a valid access token first
// Replace this with your actual access token
const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE";

function makeRequest(method, path, data = null, headers = {}) {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: "localhost",
			port: 3000,
			path: `/api/v1${path}`,
			method: method,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ACCESS_TOKEN}`,
				...headers,
			},
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({ status: res.statusCode, data: jsonData });
				} catch (e) {
					resolve({ status: res.statusCode, data: data });
				}
			});
		});

		req.on("error", (e) => {
			reject(e);
		});

		if (data) {
			req.write(JSON.stringify(data));
		}
		req.end();
	});
}

async function fixTeamLeader() {
	console.log("🔧 Fixing Team Leader Assignment...\n");

	try {
		// Step 1: Check current team leadership
		console.log("1️⃣ Checking current team leadership...");
		const leadershipResponse = await makeRequest(
			"GET",
			`/teams/${TEAM_ID}/leadership`
		);
		console.log("Leadership Status:", leadershipResponse.status);
		console.log(
			"Leadership Data:",
			JSON.stringify(leadershipResponse.data, null, 2)
		);

		// Step 2: Assign team leader
		console.log("\n2️⃣ Assigning team leader...");
		const assignResponse = await makeRequest(
			"POST",
			`/teams/${TEAM_ID}/leader`,
			{
				userId: USER_ID,
			}
		);
		console.log("Assign Status:", assignResponse.status);
		console.log("Assign Data:", JSON.stringify(assignResponse.data, null, 2));

		// Step 3: Check team leadership again
		console.log("\n3️⃣ Checking team leadership after assignment...");
		const leadershipResponse2 = await makeRequest(
			"GET",
			`/teams/${TEAM_ID}/leadership`
		);
		console.log("Leadership Status:", leadershipResponse2.status);
		console.log(
			"Leadership Data:",
			JSON.stringify(leadershipResponse2.data, null, 2)
		);

		// Step 4: Test the my-team/members endpoint
		console.log("\n4️⃣ Testing my-team/members endpoint...");
		const membersResponse = await makeRequest("GET", "/teams/my-team/members");
		console.log("Members Status:", membersResponse.status);
		console.log("Members Data:", JSON.stringify(membersResponse.data, null, 2));

		console.log("\n✅ Process completed!");
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

// Instructions for use:
console.log("📋 INSTRUCTIONS:");
console.log("1. Replace ACCESS_TOKEN with your actual token");
console.log("2. Run: node fix-team-leader.js");
console.log("3. Check the output to see if it worked\n");

// Uncomment the line below after you set your access token
// fixTeamLeader();

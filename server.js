/** @format */

// Load environment variables first
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

// Start the server
const app = require("./app");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
// Connect to the database

mongoose
	.connect(
		process.env.DATABASE_LOCAL || "mongodb://127.0.0.1:27017/enactusMGMT"
	)
	.then(() => {
		console.log("✅ DB connection successful!");
	})
	.catch((err) => {
		console.error("❌ DB connection error:", err);
	});
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

// Export the app for testing purposes
module.exports = app;

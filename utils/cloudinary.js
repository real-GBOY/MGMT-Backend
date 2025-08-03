/** @format */

const cloudinary = require("cloudinary").v2;

// Fallback configuration if env vars are not loaded
const cloudinaryConfig = {
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dbpb1lkwh",
	api_key: process.env.CLOUDINARY_API_KEY || "313851463382223",
	api_secret:
		process.env.CLOUDINARY_API_SECRET || "dcS_zcZVs1U26E1JAZcvxsSgkDY",
};

cloudinary.config(cloudinaryConfig);

// Verify configuration
if (
	!process.env.CLOUDINARY_CLOUD_NAME ||
	!process.env.CLOUDINARY_API_KEY ||
	!process.env.CLOUDINARY_API_SECRET
) {

	console.log("Cloudinary config:", {
		cloud_name: cloudinaryConfig.cloud_name,
		api_key: cloudinaryConfig.api_key,
		api_secret: "***" + cloudinaryConfig.api_secret.slice(-4),
	});
} else {
	console.log("✅ Cloudinary configuration loaded from environment variables");
}

module.exports = cloudinary;

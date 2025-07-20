/** @format */

const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	teamLeader: {
		type: mongoose.Schema.Types.ObjectId,
		required: false,
		ref: "User",
	},
	teamViceHead: {
		type: [mongoose.Schema.Types.ObjectId],
		required: false,
		ref: "User",
		default: [],
	},

	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Team", teamSchema);

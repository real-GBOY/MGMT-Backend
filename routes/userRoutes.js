/** @format */

const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Get all users
router.get("/", userController.getAllUsers);

// Get users by team
router.get("/team/:teamId", userController.getUsersByTeam);

// Get users by role
router.get("/role/:role", userController.getUsersByRole);

// Get user profile (should be before /:id to avoid conflicts)
router.get("/profile/me", userController.getProfile);

// Get single user
router.get("/:id", userController.getUser);

// Update user
router.patch("/:id", userController.updateUser);

// Delete user
router.delete("/:id", userController.deleteUser);

module.exports = router;

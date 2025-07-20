/** @format */

const express = require("express");
const attendanceController = require("../controllers/attendanceController");

const router = express.Router();

// Get all attendance records
router.get("/", attendanceController.getAllAttendance);

// Get attendance statistics
router.get("/stats", attendanceController.getAttendanceStats);

// Get attendance by meeting
router.get("/meeting/:meetingId", attendanceController.getAttendanceByMeeting);

// Get attendance by user
router.get("/user/:userId", attendanceController.getAttendanceByUser);

// Get attendance by team
router.get("/team/:teamId", attendanceController.getAttendanceByTeam);

// Record single attendance
router.post("/record", attendanceController.recordAttendance);

// Bulk record attendance
router.post("/bulk-record", attendanceController.bulkRecordAttendance);

// Check-in for a meeting
router.post("/check-in", attendanceController.checkIn);

// Check-out from a meeting
router.post("/check-out", attendanceController.checkOut);

// Get single attendance record
router.get("/:id", attendanceController.getAttendance);

// Update attendance record
router.patch("/:id", attendanceController.updateAttendance);

// Delete attendance record
router.delete("/:id", attendanceController.deleteAttendance);

// Verify attendance record
router.patch("/:id/verify", attendanceController.verifyAttendance);

module.exports = router;

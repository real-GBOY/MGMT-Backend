/** @format */

const express = require("express");
const meetingController = require("../controllers/meetingController");

const router = express.Router();

// Get all meetings
router.get("/", meetingController.getAllMeetings);

// Create new meeting
router.post("/", meetingController.createMeeting);

// Get meeting statistics
router.get("/stats", meetingController.getMeetingStats);

// Get meetings by team
router.get("/team/:teamId", meetingController.getMeetingsByTeam);

// Get meetings by status
router.get("/status/:status", meetingController.getMeetingsByStatus);

// Get single meeting
router.get("/:id", meetingController.getMeeting);

// Update meeting
router.patch("/:id", meetingController.updateMeeting);

// Delete meeting
router.delete("/:id", meetingController.deleteMeeting);

// Add attendee to meeting
router.post("/:id/attendees", meetingController.addAttendee);

// Update attendee status
router.patch(
	"/:meetingId/attendees/:userId",
	meetingController.updateAttendeeStatus
);

// Add agenda item
router.post("/:id/agenda", meetingController.addAgendaItem);

// Record meeting minutes
router.post("/:id/minutes", meetingController.recordMinutes);

module.exports = router;

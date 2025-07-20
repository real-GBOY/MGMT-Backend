<!-- @format -->

# Notification System Documentation

## Overview

The Enactus Management System includes a comprehensive notification system that provides real-time alerts and updates for various activities across the platform. The system supports multiple notification types, priorities, and delivery methods.

## Features

### 🔔 Notification Types

- **Task Notifications**: Assignment, completion, overdue alerts
- **Meeting Notifications**: Creation, reminders, cancellations
- **Attendance Notifications**: Marking, requirements
- **Feedback Notifications**: Submission, review
- **File Notifications**: Uploads, sharing
- **System Notifications**: Announcements, role changes
- **Team Notifications**: Joining, leaving
- **General Notifications**: Deadlines, custom messages

### 📊 Priority Levels

- **Low**: Informational updates
- **Medium**: Standard notifications
- **High**: Important alerts
- **Urgent**: Critical notifications

### 📱 Delivery Methods

- **In-App Notifications**: Real-time notifications in the application
- **Email Notifications**: Optional email delivery
- **Push Notifications**: Browser push notifications (future)

### 🎯 Status Management

- **Unread**: New notifications
- **Read**: Viewed notifications
- **Archived**: Archived notifications

## API Endpoints

### User Notifications

#### Get All Notifications

```http
GET /api/v1/notifications?page=1&limit=20&status=unread&type=task_assigned&category=task&priority=high
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (unread, read, archived)
- `type`: Filter by notification type
- `category`: Filter by category
- `priority`: Filter by priority

**Response:**

```json
{
  "status": "success",
  "data": {
    "notifications": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    },
    "unreadCount": 15
  }
}
```

#### Get Notification by ID

```http
GET /api/v1/notifications/:id
```

#### Mark Notification as Read

```http
PATCH /api/v1/notifications/:id/read
```

#### Mark Multiple Notifications as Read

```http
PATCH /api/v1/notifications/mark-multiple-read
Content-Type: application/json

{
  "notificationIds": ["id1", "id2", "id3"]
}
```

#### Mark All Notifications as Read

```http
PATCH /api/v1/notifications/mark-all-read
```

#### Archive Notification

```http
PATCH /api/v1/notifications/:id/archive
```

#### Delete Notification

```http
DELETE /api/v1/notifications/:id
```

#### Get Notification Statistics

```http
GET /api/v1/notifications/stats/overview
```

**Response:**

```json
{
	"status": "success",
	"data": {
		"statusCounts": {
			"unread": 15,
			"read": 85,
			"archived": 10
		},
		"typeCounts": {
			"task_assigned": 20,
			"meeting_created": 15,
			"feedback_submitted": 5
		},
		"priorityCounts": {
			"low": 30,
			"medium": 50,
			"high": 15,
			"urgent": 5
		},
		"total": 100
	}
}
```

### Notification Preferences

#### Get Preferences

```http
GET /api/v1/notifications/preferences/settings
```

#### Update Preferences

```http
PATCH /api/v1/notifications/preferences/settings
Content-Type: application/json

{
  "emailNotifications": true,
  "pushNotifications": true,
  "categories": ["task", "meeting", "attendance", "feedback", "file", "system", "team"]
}
```

### Team Notifications (Team Heads & Admin)

#### Get Team Notifications

```http
GET /api/v1/notifications/team/overview?page=1&limit=20&status=unread&type=meeting_created
```

#### Create Team Notification

```http
POST /api/v1/notifications/team/broadcast
Content-Type: application/json

{
  "recipients": ["user1", "user2", "user3"],
  "type": "general",
  "title": "Team Meeting Tomorrow",
  "message": "Don't forget about the team meeting tomorrow at 10 AM",
  "priority": "high",
  "category": "meeting",
  "teamId": "team123"
}
```

### Admin Only Routes

#### Get All Notifications (Admin)

```http
GET /api/v1/notifications/admin/all?page=1&limit=50&status=unread&type=system_announcement
```

#### System Announcement

```http
POST /api/v1/notifications/admin/announcement
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "The system will be down for maintenance on Sunday from 2-4 AM",
  "priority": "high",
  "recipients": ["user1", "user2"] // Optional, sends to all if empty
}
```

#### Cleanup Expired Notifications

```http
DELETE /api/v1/notifications/admin/cleanup
```

### Notification Types & Categories

#### Get Available Types

```http
GET /api/v1/notifications/types/available
```

#### Get Available Categories

```http
GET /api/v1/notifications/categories/available
```

## Notification Service Usage

### Creating Notifications from Other Modules

```javascript
const NotificationService = require("../utils/notificationService");

// Task assignment notification
await NotificationService.createTaskAssignmentNotification(
	taskId,
	assigneeId,
	assignerId,
	taskTitle
);

// Meeting notification
await NotificationService.createMeetingNotification(
	meetingId,
	attendeeIds,
	creatorId,
	meetingTitle,
	meetingTime
);

// File upload notification
await NotificationService.createFileUploadNotification(
	fileId,
	uploaderId,
	teamId,
	fileName
);

// System announcement
await NotificationService.createSystemAnnouncement(
	recipientIds,
	title,
	message,
	priority
);
```

### Integration Examples

#### Task Controller Integration

```javascript
// In taskController.js
const NotificationService = require("../utils/notificationService");

exports.assignTask = async (req, res) => {
	try {
		// ... task assignment logic ...

		// Create notification
		await NotificationService.createTaskAssignmentNotification(
			task._id,
			task.assignee,
			req.user._id,
			task.title
		);

		res.status(200).json({ status: "success", data: { task } });
	} catch (error) {
		// ... error handling ...
	}
};
```

#### Meeting Controller Integration

```javascript
// In meetingController.js
const NotificationService = require("../utils/notificationService");

exports.createMeeting = async (req, res) => {
	try {
		// ... meeting creation logic ...

		// Create notifications for attendees
		await NotificationService.createMeetingNotification(
			meeting._id,
			meeting.attendees,
			req.user._id,
			meeting.title,
			meeting.dateTime
		);

		// Schedule reminders
		await NotificationService.createMeetingReminders(
			meeting._id,
			meeting.attendees,
			meeting.title,
			meeting.dateTime
		);

		res.status(201).json({ status: "success", data: { meeting } });
	} catch (error) {
		// ... error handling ...
	}
};
```

## Notification Model Schema

```javascript
{
  recipient: ObjectId,        // Required: User receiving notification
  sender: ObjectId,          // Optional: User sending notification
  team: ObjectId,            // Optional: Team context
  type: String,              // Required: Notification type
  priority: String,          // Required: low, medium, high, urgent
  title: String,             // Required: Notification title
  message: String,           // Required: Notification message
  relatedResource: {         // Optional: Related resource
    model: String,
    id: ObjectId
  },
  metadata: Object,          // Optional: Additional data
  status: String,            // Required: unread, read, archived
  readAt: Date,              // Optional: When notification was read
  scheduledFor: Date,        // Optional: Scheduled notification time
  expiresAt: Date,           // Optional: Expiration date
  actions: [{                // Optional: Action buttons
    label: String,
    action: String,
    url: String
  }],
  category: String,          // Required: task, meeting, attendance, etc.
  sendEmail: Boolean,        // Optional: Send via email
  sendPush: Boolean,         // Optional: Send push notification
  emailSent: Boolean,        // Optional: Email sent status
  pushSent: Boolean          // Optional: Push sent status
}
```

## Notification Types Reference

| Type                   | Description              | Category   | Priority |
| ---------------------- | ------------------------ | ---------- | -------- |
| `task_assigned`        | Task assigned to user    | task       | medium   |
| `task_completed`       | Task marked as completed | task       | medium   |
| `task_overdue`         | Task is overdue          | task       | high     |
| `meeting_created`      | New meeting created      | meeting    | medium   |
| `meeting_reminder`     | Meeting reminder         | meeting    | high     |
| `meeting_cancelled`    | Meeting cancelled        | meeting    | medium   |
| `attendance_marked`    | Attendance recorded      | attendance | low      |
| `attendance_required`  | Attendance reminder      | attendance | medium   |
| `feedback_submitted`   | Feedback submitted       | feedback   | medium   |
| `feedback_reviewed`    | Feedback reviewed        | feedback   | medium   |
| `file_uploaded`        | File uploaded            | file       | low      |
| `file_shared`          | File shared              | file       | medium   |
| `system_announcement`  | System announcement      | system     | medium   |
| `role_changed`         | User role changed        | system     | high     |
| `team_joined`          | User joined team         | team       | medium   |
| `team_left`            | User left team           | team       | medium   |
| `deadline_approaching` | Deadline approaching     | general    | high     |
| `general`              | General notification     | general    | medium   |

## Best Practices

### 1. Notification Timing

- Send task assignments immediately
- Schedule meeting reminders 30 minutes before
- Send overdue notifications daily
- Send deadline reminders 1-2 days before

### 2. Priority Guidelines

- **Urgent**: System outages, security alerts
- **High**: Deadlines, meeting reminders, role changes
- **Medium**: Task assignments, feedback, general updates
- **Low**: File uploads, attendance confirmations

### 3. Message Content

- Keep titles concise (max 200 characters)
- Provide clear, actionable messages
- Include relevant context and links
- Use appropriate tone for the notification type

### 4. Performance Considerations

- Use bulk operations for multiple notifications
- Implement proper indexing on frequently queried fields
- Clean up expired notifications regularly
- Monitor notification volume and user engagement

### 5. User Experience

- Allow users to customize notification preferences
- Provide easy ways to mark notifications as read
- Include action buttons for quick responses
- Support notification filtering and search

## Security Considerations

1. **Access Control**: Users can only access their own notifications
2. **Team Isolation**: Team heads can only create notifications for their team
3. **Admin Privileges**: Only admins can send system-wide announcements
4. **Data Validation**: All notification data is validated before creation
5. **Rate Limiting**: Implement rate limiting for notification creation

## Monitoring & Analytics

### Key Metrics to Track

- Notification delivery rates
- User engagement (read rates)
- Notification preferences usage
- System performance impact
- User feedback on notification relevance

### Health Checks

- Monitor notification queue processing
- Track failed notification deliveries
- Monitor database performance
- Check for notification spam or abuse

## Future Enhancements

1. **Real-time Push Notifications**: WebSocket integration
2. **Email Templates**: Rich HTML email notifications
3. **Mobile Push Notifications**: Native mobile app support
4. **Notification Channels**: Slack, Teams integration
5. **Advanced Filtering**: AI-powered notification relevance
6. **Notification Analytics**: Detailed user behavior tracking
7. **Custom Notification Rules**: User-defined notification triggers

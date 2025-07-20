<!-- @format -->

# Role-Based Access Control System

## Overview

The Enactus Management System implements a comprehensive role-based access control (RBAC) system with four distinct roles, each with specific permissions and access levels.

## Roles Hierarchy

### 1. **Admin** 👑

- **Access Level**: Global
- **Permissions**:
  - Can access and modify ANY data across all teams
  - Can manage all users, teams, and system settings
  - Can view all statistics and reports
  - Can create, update, and delete any resource
  - Has full system administration privileges

### 2. **Team Head** 🎯

- **Access Level**: Team-specific
- **Permissions**:
  - Can access and modify data within their assigned team only
  - Can manage team members, tasks, meetings, and files
  - Can view team statistics and reports
  - Can assign tasks to team members
  - Can create and manage team meetings
  - Can record and manage team attendance
  - Can access team files and resources

### 3. **Team Vice Head** 🎯

- **Access Level**: Team-specific
- **Permissions**:
  - Can access and modify data within their assigned team only
  - Can perform most team head functions
  - Can manage team members, tasks, meetings, and files
  - Can view team statistics and reports
  - Can assign tasks to team members
  - Can create and manage team meetings
  - Can record and manage team attendance
  - Can access team files and resources

### 4. **Member** 👤

- **Access Level**: Personal
- **Permissions**:
  - Can only access their own personal data
  - Can view and update their own profile
  - Can view tasks assigned to them
  - Can view meetings they're invited to
  - Can mark their own attendance
  - Can submit feedback
  - Can access files they have permission for

## Middleware Functions

### Authentication Middleware

```javascript
const { authenticate } = require("../middlewares/auth");

// Basic authentication - requires valid JWT token
router.get("/protected", authenticate, controller.function);
```

### Role-Based Authorization

```javascript
const {
	adminOnly,
	teamLeaderOrAdmin,
	teamHeadViceHeadOrAdmin,
	teamLeadership,
	teamLeadershipOrAdmin,
	memberAccess,
	teamResourceAccess,
} = require("../middlewares/auth");

// Admin only access
router.get("/admin", authenticate, adminOnly, controller.function);

// Team head or admin access
router.get("/team-head", authenticate, teamLeaderOrAdmin, controller.function);

// Team leadership (head or vice head) or admin access
router.get(
	"/leadership",
	authenticate,
	teamHeadViceHeadOrAdmin,
	controller.function
);

// Team leadership only (no admin)
router.get(
	"/team-leadership",
	authenticate,
	teamLeadership,
	controller.function
);

// Team leadership or admin
router.get(
	"/team-leadership-admin",
	authenticate,
	teamLeadershipOrAdmin,
	controller.function
);

// Member access (own resources only)
router.get("/member/:userId", authenticate, memberAccess, controller.function);

// Team resource access (same team only)
router.get(
	"/team/:teamId",
	authenticate,
	teamResourceAccess,
	controller.function
);
```

### Custom Role Authorization

```javascript
const { authorize } = require("../middlewares/auth");

// Specific roles only
router.get(
	"/custom",
	authenticate,
	authorize("admin", "teamHead"),
	controller.function
);
```

## Access Control Matrix

| Resource Type         | Admin          | Team Head      | Team Vice Head | Member         |
| --------------------- | -------------- | -------------- | -------------- | -------------- |
| **All Teams Data**    | ✅ Full Access | ❌ No Access   | ❌ No Access   | ❌ No Access   |
| **Own Team Data**     | ✅ Full Access | ✅ Full Access | ✅ Full Access | ❌ No Access   |
| **Own Personal Data** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Other Users' Data** | ✅ Full Access | ❌ No Access   | ❌ No Access   | ❌ No Access   |
| **System Settings**   | ✅ Full Access | ❌ No Access   | ❌ No Access   | ❌ No Access   |

## Implementation Examples

### 1. Team-Specific Resource Access

```javascript
// Only team heads/vice heads can create meetings for their team
router.post(
	"/meetings",
	authenticate,
	teamLeadershipOrAdmin,
	teamResourceAccess,
	meetingController.createMeeting
);
```

### 2. Personal Resource Access

```javascript
// Users can only update their own profile
router.patch(
	"/profile/:userId",
	authenticate,
	memberAccess,
	userController.updateProfile
);
```

### 3. Admin-Only Operations

```javascript
// Only admins can manage teams
router.post("/teams", authenticate, adminOnly, teamController.createTeam);
```

### 4. Team Leadership Operations

```javascript
// Team heads/vice heads can assign tasks to team members
router.post(
	"/tasks",
	authenticate,
	teamLeadershipOrAdmin,
	teamResourceAccess,
	taskController.assignTask
);
```

## JWT Token Structure

```javascript
{
  "userId": "user_id_here",
  "role": "admin|teamHead|teamViceHead|member",
  "team": "team_id_here",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Error Responses

### Authentication Errors (401)

```json
{
	"status": "fail",
	"message": "Access denied. No token provided."
}
```

### Authorization Errors (403)

```json
{
	"status": "fail",
	"message": "Access denied. Team leadership or admin privileges required."
}
```

### Team Access Errors (403)

```json
{
	"status": "fail",
	"message": "Access denied. You can only access resources from your own team."
}
```

## Best Practices

1. **Always use authentication middleware** for protected routes
2. **Use specific role middleware** instead of generic authorization
3. **Implement team-based access control** for team resources
4. **Validate team membership** before allowing access
5. **Use member access middleware** for personal resources
6. **Log access attempts** for security monitoring
7. **Implement rate limiting** for sensitive operations

## Security Considerations

- JWT tokens are stored in HTTP-only cookies
- Tokens have expiration times (7 days for access, 30 days for refresh)
- All sensitive operations require authentication
- Team-based access prevents cross-team data access
- Rate limiting prevents abuse
- Input validation and sanitization on all endpoints

## Testing Roles

Use the `/api/v1/protected/roles-demo` endpoint to test role permissions:

```bash
GET /api/v1/protected/roles-demo
Authorization: Bearer <your-jwt-token>
```

This will return the current user's role and permissions information.

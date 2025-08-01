<!-- @format -->

# Role-Based Accessibility Guide

## Overview

The system implements a hierarchical role-based access control (RBAC) system with four main roles. Each role has specific permissions and accessibilities across different features of the application.

## Role Hierarchy

```
Admin (Highest Level)
├── Team Leader & Vice Head (Equal Level)
└── Member (Lowest Level)
```

## Role Definitions

### 1. **Admin** 👑

- **Level:** System Administrator
- **Permissions:** Full system access
- **Scope:** Global (all teams and users)

### 2. **Team Leader** 🎯

- **Level:** Team Management
- **Permissions:** Team-specific administrative access
- **Scope:** Own team and team members

### 3. **Vice Head** 👥

- **Level:** Team Management (Same as Team Leader)
- **Permissions:** Team-specific administrative access (Same as Team Leader)
- **Scope:** Own team and team members (Same as Team Leader)

### 4. **Member** 👤

- **Level:** Basic User
- **Permissions:** Personal and team member access
- **Scope:** Own resources and team collaboration

---

## Feature-Based Accessibility

### 🔐 **Authentication & User Management**

| Feature                  | Admin          | Team Leader     | Vice Head       | Member          |
| ------------------------ | -------------- | --------------- | --------------- | --------------- |
| **User Registration**    | ✅ Full Access | ❌ No Access    | ❌ No Access    | ❌ No Access    |
| **User Login**           | ✅ Full Access | ✅ Full Access  | ✅ Full Access  | ✅ Full Access  |
| **Profile Management**   | ✅ All Users   | ✅ Own Profile  | ✅ Own Profile  | ✅ Own Profile  |
| **Password Change**      | ✅ All Users   | ✅ Own Password | ✅ Own Password | ✅ Own Password |
| **Account Deactivation** | ✅ All Users   | ❌ No Access    | ❌ No Access    | ❌ No Access    |

### 👥 **Team Management**

| Feature                 | Admin          | Team Leader  | Vice Head    | Member       |
| ----------------------- | -------------- | ------------ | ------------ | ------------ |
| **Create Teams**        | ✅ Full Access | ❌ No Access | ❌ No Access | ❌ No Access |
| **View All Teams**      | ✅ Full Access | ✅ Own Team  | ✅ Own Team  | ✅ Own Team  |
| **Update Team Info**    | ✅ All Teams   | ✅ Own Team  | ✅ Own Team  | ❌ No Access |
| **Delete Teams**        | ✅ All Teams   | ❌ No Access | ❌ No Access | ❌ No Access |
| **Add Team Members**    | ✅ All Teams   | ✅ Own Team  | ✅ Own Team  | ❌ No Access |
| **Remove Team Members** | ✅ All Teams   | ✅ Own Team  | ✅ Own Team  | ❌ No Access |
| **Assign Team Leaders** | ✅ All Teams   | ❌ No Access | ❌ No Access | ❌ No Access |

### 📋 **Task Management**

| Feature           | Admin        | Team Leader     | Vice Head       | Member       |
| ----------------- | ------------ | --------------- | --------------- | ------------ |
| **Create Tasks**  | ✅ All Teams | ✅ Own Team     | ✅ Own Team     | ✅ Own Tasks |
| **View Tasks**    | ✅ All Tasks | ✅ Team Tasks   | ✅ Team Tasks   | ✅ Own Tasks |
| **Update Tasks**  | ✅ All Tasks | ✅ Team Tasks   | ✅ Team Tasks   | ✅ Own Tasks |
| **Delete Tasks**  | ✅ All Tasks | ✅ Team Tasks   | ✅ Team Tasks   | ❌ No Access |
| **Assign Tasks**  | ✅ All Users | ✅ Team Members | ✅ Team Members | ❌ No Access |
| **Mark Complete** | ✅ All Tasks | ✅ Team Tasks   | ✅ Team Tasks   | ✅ Own Tasks |

### 📅 **Meeting Management**

| Feature             | Admin           | Team Leader      | Vice Head        | Member           |
| ------------------- | --------------- | ---------------- | ---------------- | ---------------- |
| **Create Meetings** | ✅ All Teams    | ✅ Own Team      | ✅ Own Team      | ❌ No Access     |
| **View Meetings**   | ✅ All Meetings | ✅ Team Meetings | ✅ Team Meetings | ✅ Team Meetings |
| **Update Meetings** | ✅ All Meetings | ✅ Team Meetings | ✅ Team Meetings | ❌ No Access     |
| **Delete Meetings** | ✅ All Meetings | ✅ Team Meetings | ✅ Team Meetings | ❌ No Access     |
| **Join Meetings**   | ✅ All Meetings | ✅ Team Meetings | ✅ Team Meetings | ✅ Team Meetings |

### 📊 **Attendance Management**

| Feature              | Admin          | Team Leader     | Vice Head       | Member            |
| -------------------- | -------------- | --------------- | --------------- | ----------------- |
| **View Attendance**  | ✅ All Users   | ✅ Team Members | ✅ Team Members | ✅ Own Attendance |
| **Mark Attendance**  | ✅ All Users   | ✅ Team Members | ✅ Team Members | ✅ Own Attendance |
| **Generate Reports** | ✅ All Reports | ✅ Team Reports | ✅ Team Reports | ❌ No Access      |
| **Export Data**      | ✅ All Data    | ✅ Team Data    | ✅ Team Data    | ❌ No Access      |

### 💬 **Feedback System**

| Feature                 | Admin           | Team Leader      | Vice Head        | Member          |
| ----------------------- | --------------- | ---------------- | ---------------- | --------------- |
| **Submit Feedback**     | ✅ All Users    | ✅ Team Members  | ✅ Team Members  | ✅ Own Feedback |
| **View Feedback**       | ✅ All Feedback | ✅ Team Feedback | ✅ Team Feedback | ✅ Own Feedback |
| **Respond to Feedback** | ✅ All Feedback | ✅ Team Feedback | ✅ Team Feedback | ❌ No Access    |
| **Delete Feedback**     | ✅ All Feedback | ❌ No Access     | ❌ No Access     | ❌ No Access    |

### 📁 **File Center Hub**

| Feature            | Admin            | Team Leader    | Vice Head      | Member         |
| ------------------ | ---------------- | -------------- | -------------- | -------------- |
| **Upload Files**   | ✅ All Locations | ✅ Team Folder | ✅ Team Folder | ✅ Team Folder |
| **View Files**     | ✅ All Files     | ✅ Team Files  | ✅ Team Files  | ✅ Team Files  |
| **Download Files** | ✅ All Files     | ✅ Team Files  | ✅ Team Files  | ✅ Team Files  |
| **Delete Files**   | ✅ All Files     | ✅ Team Files  | ✅ Team Files  | ❌ No Access   |
| **Organize Files** | ✅ All Locations | ✅ Team Folder | ✅ Team Folder | ❌ No Access   |

### 🔔 **Notifications**

| Feature                  | Admin                | Team Leader           | Vice Head             | Member               |
| ------------------------ | -------------------- | --------------------- | --------------------- | -------------------- |
| **Send Notifications**   | ✅ All Users         | ✅ Team Members       | ✅ Team Members       | ❌ No Access         |
| **View Notifications**   | ✅ All Notifications | ✅ Team Notifications | ✅ Team Notifications | ✅ Own Notifications |
| **Mark as Read**         | ✅ All Notifications | ✅ Team Notifications | ✅ Team Notifications | ✅ Own Notifications |
| **Delete Notifications** | ✅ All Notifications | ✅ Team Notifications | ❌ No Access          | ❌ No Access         |

---

## Detailed Role Permissions

### 🎯 **Admin Role**

**Full System Access:**

- ✅ **User Management:** Create, read, update, delete all users
- ✅ **Team Management:** Full control over all teams
- ✅ **System Configuration:** Access to all system settings
- ✅ **Data Access:** View all data across the system
- ✅ **Reporting:** Generate system-wide reports
- ✅ **Security:** Manage security settings and access controls

**Key Capabilities:**

- Assign roles to any user
- Create and manage teams
- Access all features without restrictions
- Monitor system performance
- Manage system-wide notifications

### 🎯 **Team Leader Role**

**Team-Specific Administrative Access:**

- ✅ **Team Management:** Manage own team and members
- ✅ **Task Assignment:** Assign tasks to team members
- ✅ **Meeting Organization:** Create and manage team meetings
- ✅ **Team Reports:** Generate team-specific reports
- ✅ **Member Management:** Add/remove team members

**Key Capabilities:**

- Lead team activities and projects
- Manage team resources and files
- Coordinate team meetings and events
- Monitor team performance and attendance
- Provide feedback and guidance to team members

### 🎯 **Vice Head Role** (Updated - Same as Team Leader)

**Team-Specific Administrative Access:**

- ✅ **Team Management:** Manage own team and members (Same as Team Leader)
- ✅ **Task Assignment:** Assign tasks to team members (Same as Team Leader)
- ✅ **Meeting Organization:** Create and manage team meetings (Same as Team Leader)
- ✅ **Team Reports:** Generate team-specific reports (Same as Team Leader)
- ✅ **Member Management:** Add/remove team members (Same as Team Leader)

**Key Capabilities:**

- Lead team activities and projects (Same as Team Leader)
- Manage team resources and files (Same as Team Leader)
- Coordinate team meetings and events (Same as Team Leader)
- Monitor team performance and attendance (Same as Team Leader)
- Provide feedback and guidance to team members (Same as Team Leader)

### 🎯 **Member Role**

**Basic User Access:**

- ✅ **Personal Management:** Manage own profile and settings
- ✅ **Task Participation:** Work on assigned tasks
- ✅ **Meeting Attendance:** Join and participate in meetings
- ✅ **Team Collaboration:** Access team resources
- ✅ **Feedback Submission:** Submit feedback and suggestions

**Key Capabilities:**

- Complete assigned tasks
- Attend team meetings and events
- Access team files and resources
- Submit feedback and suggestions
- Track personal attendance and progress

---

## Access Control Implementation

### **Middleware Functions Available:**

```javascript
// Authentication
authenticate; // Required for all protected routes
optionalAuth; // Optional authentication

// Role-based Authorization
authorize(...roles); // Check specific roles
adminOnly; // Admin only access
teamLeaderOrAdmin; // Team leader, vice head, or admin
teamHeadViceHeadOrAdmin; // Team leadership or admin
teamLeadership; // Team head or vice head only
teamLeadershipOrAdmin; // Team leadership or admin

// Resource-based Access
memberAccess; // Own resources only
ownerOrAdmin; // Resource owner or admin
resourceOwnerOrTeamLeaderOrAdmin; // Owner, team leader, vice head, or admin
sameTeam; // Same team access
teamResourceAccess; // Team resource access
```

### **Usage Examples:**

```javascript
// Admin only route
router.get("/admin/users", authenticate, adminOnly, userController.getAllUsers);

// Team leader, vice head, or admin route
router.post(
	"/teams/:id/members",
	authenticate,
	teamLeaderOrAdmin,
	teamController.addMember
);

// Team leadership access (both team leader and vice head)
router.patch(
	"/tasks/:id",
	authenticate,
	teamLeadershipOrAdmin,
	taskController.updateTask
);

// Resource owner access
router.get(
	"/profile/:userId",
	authenticate,
	ownerOrAdmin,
	userController.getProfile
);
```

---

## Security Considerations

### **Data Isolation:**

- Users can only access data within their permission scope
- Team-based data isolation for non-admin users
- Personal data protection for all users

### **Audit Trail:**

- All actions are logged for security monitoring
- Role-based activity tracking
- Access attempt monitoring

### **Session Management:**

- Token-based authentication
- Automatic session timeout
- Secure logout functionality

---

## Frontend Implementation Guide

### **Role-Based UI Rendering:**

```javascript
// Check user role for UI elements
const canCreateTeam = user.role === "admin";
const canManageTeam = ["admin", "team_leader", "vice_head"].includes(user.role);
const canAssignTasks = ["admin", "team_leader", "vice_head"].includes(
	user.role
);

// Conditional rendering
{
	canCreateTeam && <CreateTeamButton />;
}
{
	canManageTeam && <TeamManagementPanel />;
}
{
	canAssignTasks && <TaskAssignmentForm />;
}
```

### **Permission Checking:**

```javascript
// Check specific permissions
const hasPermission = (permission) => {
	const permissions = {
		create_team: ["admin"],
		manage_team: ["admin", "team_leader", "vice_head"],
		assign_tasks: ["admin", "team_leader", "vice_head"],
		view_reports: ["admin", "team_leader", "vice_head"],
		delete_files: ["admin", "team_leader", "vice_head"],
	};

	return permissions[permission]?.includes(user.role) || false;
};
```

### **API Call Authorization:**

```javascript
// Include authorization header
const apiCall = async (endpoint, options = {}) => {
	const token = localStorage.getItem("token");

	return fetch(endpoint, {
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${token}`,
		},
	});
};
```

---

## Best Practices

### **For Developers:**

1. Always use appropriate middleware for route protection
2. Implement role-based UI rendering
3. Validate permissions on both frontend and backend
4. Log all access attempts for security monitoring

### **For Administrators:**

1. Regularly review user roles and permissions
2. Monitor system access logs
3. Update role permissions as needed
4. Train users on their role responsibilities

### **For Users:**

1. Understand your role permissions
2. Report any access issues immediately
3. Follow security best practices
4. Respect data privacy and confidentiality

---

## Important Update

**Vice Head now has the same accessibilities as Team Leader!**

- ✅ **Equal Team Management:** Vice Head can manage team members, tasks, and meetings
- ✅ **Equal Task Assignment:** Vice Head can assign tasks to team members
- ✅ **Equal Meeting Management:** Vice Head can create, update, and delete team meetings
- ✅ **Equal File Management:** Vice Head can organize and delete team files
- ✅ **Equal Reporting:** Vice Head can generate team reports

This change provides better team management flexibility and allows Vice Heads to fully support Team Leaders in their responsibilities.

---

## Conclusion

This role-based accessibility system ensures secure, organized, and efficient access to system features while maintaining data integrity and user privacy. Each role has clearly defined permissions that align with organizational responsibilities and security requirements. **Vice Head and Team Leader now have equal team management capabilities.**

<!-- @format -->

# Team Leadership Management Guide

## Overview

This guide explains how to assign and manage team leaders and vice heads for specific teams in the system.

## Available Endpoints

### **1. Get Team Leadership**

- **Endpoint:** `GET /api/v1/teams/:teamId/leadership`
- **Purpose:** View current team leader and vice heads
- **Access:** Admin, Team Leader, Vice Head, Member (own team)

**Response:**

```json
{
	"status": "success",
	"data": {
		"team": {
			"id": "64f8a1b2c3d4e5f678901234",
			"name": "Development Team",
			"description": "Software development team",
			"teamLeader": {
				"_id": "64f8a1b2c3d4e5f678901235",
				"firstName": "John",
				"lastName": "Doe",
				"email": "john@example.com",
				"role": "team_leader",
				"profilePicture": "https://..."
			},
			"teamViceHead": [
				{
					"_id": "64f8a1b2c3d4e5f678901236",
					"firstName": "Jane",
					"lastName": "Smith",
					"email": "jane@example.com",
					"role": "vice_head",
					"profilePicture": "https://..."
				}
			]
		}
	}
}
```

### **2. Assign Team Leader**

- **Endpoint:** `POST /api/v1/teams/:teamId/leader`
- **Purpose:** Assign a team member as team leader
- **Access:** Admin only
- **Body:**

```json
{
	"userId": "64f8a1b2c3d4e5f678901235"
}
```

**Response:**

```json
{
	"status": "success",
	"message": "Team leader assigned successfully",
	"data": {
		"team": {
			"_id": "64f8a1b2c3d4e5f678901234",
			"name": "Development Team",
			"teamLeader": {
				"_id": "64f8a1b2c3d4e5f678901235",
				"firstName": "John",
				"lastName": "Doe",
				"email": "john@example.com",
				"role": "team_leader"
			}
		}
	}
}
```

### **3. Assign Team Vice Head**

- **Endpoint:** `POST /api/v1/teams/:teamId/vice-head`
- **Purpose:** Assign a team member as vice head
- **Access:** Admin only
- **Body:**

```json
{
	"userId": "64f8a1b2c3d4e5f678901236"
}
```

**Response:**

```json
{
	"status": "success",
	"message": "Team vice head assigned successfully",
	"data": {
		"team": {
			"_id": "64f8a1b2c3d4e5f678901234",
			"name": "Development Team",
			"teamViceHead": [
				{
					"_id": "64f8a1b2c3d4e5f678901236",
					"firstName": "Jane",
					"lastName": "Smith",
					"email": "jane@example.com",
					"role": "vice_head"
				}
			]
		}
	}
}
```

### **4. Remove Team Vice Head**

- **Endpoint:** `DELETE /api/v1/teams/:teamId/vice-head/:userId`
- **Purpose:** Remove a vice head from the team
- **Access:** Admin only

**Response:**

```json
{
	"status": "success",
	"message": "Team vice head removed successfully",
	"data": {
		"team": {
			"_id": "64f8a1b2c3d4e5f678901234",
			"name": "Development Team",
			"teamViceHead": []
		}
	}
}
```

## How to Use

### **Step 1: Get Team Members**

First, get the team members to see who you can assign as leaders:

```javascript
// Get team members
const getTeamMembers = async (teamId) => {
	const response = await fetch(`/api/v1/teams/${teamId}/members`);
	const data = await response.json();
	return data.data.members;
};
```

### **Step 2: Assign Team Leader**

```javascript
// Assign team leader
const assignTeamLeader = async (teamId, userId) => {
	const response = await fetch(`/api/v1/teams/${teamId}/leader`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId }),
	});

	return await response.json();
};
```

### **Step 3: Assign Team Vice Head**

```javascript
// Assign team vice head
const assignTeamViceHead = async (teamId, userId) => {
	const response = await fetch(`/api/v1/teams/${teamId}/vice-head`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId }),
	});

	return await response.json();
};
```

### **Step 4: Remove Team Vice Head**

```javascript
// Remove team vice head
const removeTeamViceHead = async (teamId, userId) => {
	const response = await fetch(`/api/v1/teams/${teamId}/vice-head/${userId}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return await response.json();
};
```

## Frontend Implementation

### **React Component Example:**

```javascript
import { useState, useEffect } from "react";

const TeamLeadershipManager = ({ teamId }) => {
	const [teamMembers, setTeamMembers] = useState([]);
	const [leadership, setLeadership] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadTeamData();
	}, [teamId]);

	const loadTeamData = async () => {
		try {
			// Get team members
			const membersResponse = await fetch(`/api/v1/teams/${teamId}/members`);
			const membersData = await membersResponse.json();
			setTeamMembers(membersData.data.members);

			// Get current leadership
			const leadershipResponse = await fetch(
				`/api/v1/teams/${teamId}/leadership`
			);
			const leadershipData = await leadershipResponse.json();
			setLeadership(leadershipData.data.team);
		} catch (error) {
			console.error("Error loading team data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAssignLeader = async (userId) => {
		try {
			const response = await assignTeamLeader(teamId, userId);
			if (response.status === "success") {
				alert("Team leader assigned successfully!");
				loadTeamData(); // Refresh data
			}
		} catch (error) {
			console.error("Error assigning team leader:", error);
		}
	};

	const handleAssignViceHead = async (userId) => {
		try {
			const response = await assignTeamViceHead(teamId, userId);
			if (response.status === "success") {
				alert("Team vice head assigned successfully!");
				loadTeamData(); // Refresh data
			}
		} catch (error) {
			console.error("Error assigning team vice head:", error);
		}
	};

	const handleRemoveViceHead = async (userId) => {
		try {
			const response = await removeTeamViceHead(teamId, userId);
			if (response.status === "success") {
				alert("Team vice head removed successfully!");
				loadTeamData(); // Refresh data
			}
		} catch (error) {
			console.error("Error removing team vice head:", error);
		}
	};

	if (loading) return <div>Loading...</div>;

	return (
		<div className='team-leadership-manager'>
			<h2>Team Leadership Management</h2>

			{/* Current Leadership */}
			<div className='current-leadership'>
				<h3>Current Leadership</h3>
				{leadership?.teamLeader && (
					<div className='team-leader'>
						<strong>Team Leader:</strong> {leadership.teamLeader.firstName}{" "}
						{leadership.teamLeader.lastName}
					</div>
				)}
				{leadership?.teamViceHead?.length > 0 && (
					<div className='team-vice-heads'>
						<strong>Vice Heads:</strong>
						{leadership.teamViceHead.map((viceHead) => (
							<div key={viceHead._id}>
								{viceHead.firstName} {viceHead.lastName}
								<button onClick={() => handleRemoveViceHead(viceHead._id)}>
									Remove
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Team Members */}
			<div className='team-members'>
				<h3>Team Members</h3>
				{teamMembers.map((member) => (
					<div key={member._id} className='member-item'>
						<span>
							{member.firstName} {member.lastName} ({member.role})
						</span>
						<div className='member-actions'>
							<button
								onClick={() => handleAssignLeader(member._id)}
								disabled={member.role === "team_leader"}>
								Make Leader
							</button>
							<button
								onClick={() => handleAssignViceHead(member._id)}
								disabled={member.role === "vice_head"}>
								Make Vice Head
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TeamLeadershipManager;
```

## Using Postman

### **1. Get Team Leadership:**

```
GET http://localhost:3000/api/v1/teams/64f8a1b2c3d4e5f678901234/leadership
Headers: Authorization: Bearer YOUR_TOKEN
```

### **2. Assign Team Leader:**

```
POST http://localhost:3000/api/v1/teams/64f8a1b2c3d4e5f678901234/leader
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN
Body:
{
    "userId": "64f8a1b2c3d4e5f678901235"
}
```

### **3. Assign Team Vice Head:**

```
POST http://localhost:3000/api/v1/teams/64f8a1b2c3d4e5f678901234/vice-head
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN
Body:
{
    "userId": "64f8a1b2c3d4e5f678901236"
}
```

### **4. Remove Team Vice Head:**

```
DELETE http://localhost:3000/api/v1/teams/64f8a1b2c3d4e5f678901234/vice-head/64f8a1b2c3d4e5f678901236
Headers: Authorization: Bearer YOUR_TOKEN
```

## Important Notes

### **Prerequisites:**

1. **User must be a team member** - Only existing team members can be assigned as leaders
2. **Admin access required** - Only admins can assign team leadership
3. **Valid team ID** - Team must exist in the system

### **Role Changes:**

- When assigned as **Team Leader**, user role changes to `team_leader`
- When assigned as **Vice Head**, user role changes to `vice_head`
- When removed as Vice Head, user role changes back to `member`

### **Validation:**

- System checks if user exists and is a member of the team
- Prevents duplicate assignments
- Ensures proper role transitions

### **Error Handling:**

```javascript
// Common error responses
{
    "status": "fail",
    "message": "Team not found"
}

{
    "status": "fail",
    "message": "User not found or not a member of this team"
}

{
    "status": "fail",
    "message": "Access denied. Admin privileges required"
}
```

## Best Practices

1. **Always verify team membership** before assigning leadership
2. **Check current leadership** to avoid conflicts
3. **Notify users** when their roles change
4. **Maintain audit trail** of leadership changes
5. **Validate permissions** before making changes

This system provides a complete solution for managing team leadership with proper validation and role management.

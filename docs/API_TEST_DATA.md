<!-- @format -->

# 🧪 API Test Data & Endpoints - Enactus Management System

## 📋 Test Environment Setup

### **Base URL**

```
http://localhost:5000/api/v1
```

### **Headers**

```json
{
	"Content-Type": "application/json",
	"Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

---

## 👥 Test Users Data

### **1. Admin User**

```json
{
	"firstName": "Admin",
	"lastName": "User",
	"nationalID": "123456789",
	"email": "admin@enactus.com",
	"password": "AdminPass123!",
	"phoneNumber": "+1234567890",
	"role": "admin",
	"dateOfBirth": "1990-01-01"
}
```

### **2. Team Head User**

```json
{
	"firstName": "Team",
	"lastName": "Head",
	"nationalID": "234567890",
	"email": "teamhead@enactus.com",
	"password": "TeamHeadPass123!",
	"phoneNumber": "+1234567891",
	"role": "team_leader",
	"dateOfBirth": "1992-05-15"
}
```

### **3. Team Vice Head User**

```json
{
	"firstName": "Vice",
	"lastName": "Head",
	"nationalID": "345678901",
	"email": "vicehead@enactus.com",
	"password": "ViceHeadPass123!",
	"phoneNumber": "+1234567892",
	"role": "vice_head",
	"dateOfBirth": "1993-08-20"
}
```

### **4. Member User**

```json
{
	"firstName": "Member",
	"lastName": "User",
	"nationalID": "456789012",
	"email": "member@enactus.com",
	"password": "MemberPass123!",
	"phoneNumber": "+1234567893",
	"role": "member",
	"dateOfBirth": "1995-12-10"
}
```

---

## 🔐 Authentication API Tests

### **1. User Registration**

```bash
POST /auth/register
```

**Request Body:**

```json
{
	"firstName": "Test",
	"lastName": "User",
	"nationalID": "123456789",
	"email": "test@enactus.com",
	"password": "TestPass123!",
	"phoneNumber": "+1234567890",
	"role": "member",
	"dateOfBirth": "1995-01-01"
}
```

**Expected Response:**

```json
{
	"status": "success",
	"message": "User registered successfully",
	"data": {
		"user": {
			"id": "...",
			"firstName": "Test",
			"lastName": "User",
			"email": "test@enactus.com",
			"role": "member",
			"profilePicture": "https://res.cloudinary.com/..."
		},
		"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

### **2. User Login**

```bash
POST /auth/login
```

**Request Body:**

```json
{
	"email": "admin@enactus.com",
	"password": "AdminPass123!"
}
```

**Expected Response:**

```json
{
	"status": "success",
	"data": {
		"user": {
			"_id": "...",
			"firstName": "Admin",
			"lastName": "User",
			"email": "admin@enactus.com",
			"role": "admin"
		},
		"tokens": {
			"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			"expiresIn": "7d"
		}
	}
}
```

### **3. Get User Profile**

```bash
GET /auth/profile
```

**Headers:**

```json
{
	"Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Response:**

```json
{
	"status": "success",
	"data": {
		"user": {
			"_id": "...",
			"firstName": "Admin",
			"lastName": "User",
			"email": "admin@enactus.com",
			"role": "admin",
			"team": {
				"_id": "...",
				"name": "Development Team"
			}
		}
	}
}
```

### **4. Refresh Token**

```bash
POST /auth/refresh
```

**Request Body:**

```json
{
	"refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

### **5. Logout**

```bash
POST /auth/logout
```

**Headers:**

```json
{
	"Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

---

## 👥 Team Management API Tests

### **1. Create Team**

```bash
POST /teams
```

**Headers:**

```json
{
	"Authorization": "Bearer ADMIN_TOKEN_HERE"
}
```

**Request Body:**

```json
{
	"name": "Development Team",
	"description": "Software development and programming team",
	"headId": "TEAM_HEAD_USER_ID",
	"viceHeadId": "VICE_HEAD_USER_ID"
}
```

### **2. Get All Teams**

```bash
GET /teams
```

**Headers:**

```json
{
	"Authorization": "Bearer ADMIN_TOKEN_HERE"
}
```

### **3. Get Team by ID**

```bash
GET /teams/TEAM_ID
```

### **4. Add Member to Team**

```bash
POST /teams/TEAM_ID/members
```

**Request Body:**

```json
{
	"memberId": "MEMBER_USER_ID"
}
```

---

## 📋 Task Management API Tests

### **1. Create Task**

```bash
POST /tasks
```

**Headers:**

```json
{
	"Authorization": "Bearer TEAM_HEAD_TOKEN_HERE"
}
```

**Request Body:**

```json
{
	"title": "Complete Project Report",
	"description": "Write a comprehensive project report for Q1",
	"assignedTo": "MEMBER_USER_ID",
	"dueDate": "2024-02-01T00:00:00.000Z",
	"priority": "high",
	"teamId": "TEAM_ID"
}
```

### **2. Get Team Tasks**

```bash
GET /tasks/team/TEAM_ID
```

### **3. Update Task Status**

```bash
PATCH /tasks/TASK_ID/status
```

**Request Body:**

```json
{
	"status": "in_progress"
}
```

### **4. Get User Tasks**

```bash
GET /tasks/user
```

---

## 📅 Meeting Management API Tests

### **1. Create Meeting**

```bash
POST /meetings
```

**Request Body:**

```json
{
	"title": "Weekly Team Meeting",
	"description": "Discuss project progress and upcoming tasks",
	"date": "2024-01-15T10:00:00.000Z",
	"duration": 60,
	"location": "Conference Room A",
	"teamId": "TEAM_ID",
	"attendees": ["MEMBER_1_ID", "MEMBER_2_ID"]
}
```

### **2. RSVP to Meeting**

```bash
POST /meetings/MEETING_ID/rsvp
```

**Request Body:**

```json
{
	"status": "attending"
}
```

### **3. Get Team Meetings**

```bash
GET /meetings/team/TEAM_ID
```

---

## 📊 Attendance API Tests

### **1. Mark Attendance**

```bash
POST /attendance
```

**Request Body:**

```json
{
	"meetingId": "MEETING_ID",
	"status": "present",
	"notes": "Arrived on time"
}
```

### **2. Get Attendance Report**

```bash
GET /attendance/report/TEAM_ID
```

---

## 📝 Feedback API Tests

### **1. Submit Feedback**

```bash
POST /feedback
```

**Request Body:**

```json
{
	"type": "suggestion",
	"title": "Improve Meeting Structure",
	"description": "Meetings could be more organized and focused",
	"priority": "medium",
	"category": "process_improvement"
}
```

### **2. Get Feedback**

```bash
GET /feedback
```

---

## 📁 File Management API Tests

### **1. Upload File**

```bash
POST /files/upload
```

**Headers:**

```json
{
	"Authorization": "Bearer USER_TOKEN_HERE"
}
```

**Form Data:**

```
file: [FILE]
title: "Project Document"
description: "Important project document"
category: "documents"
teamId: "TEAM_ID"
```

### **2. Get Team Files**

```bash
GET /files/team/TEAM_ID
```

---

## 📢 Notification API Tests

### **1. Get User Notifications**

```bash
GET /notifications/user
```

### **2. Mark Notification as Read**

```bash
PATCH /notifications/NOTIFICATION_ID/read
```

### **3. Get Team Notifications**

```bash
GET /notifications/team
```

---

## 🧪 Complete Test Script

### **Test All Features**

```javascript
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

// Test data
const testUsers = {
	admin: {
		email: "admin@enactus.com",
		password: "AdminPass123!",
	},
	teamHead: {
		email: "teamhead@enactus.com",
		password: "TeamHeadPass123!",
	},
	member: {
		email: "member@enactus.com",
		password: "MemberPass123!",
	},
};

async function runAllTests() {
	console.log("🧪 Running Complete API Tests...\n");

	// Test 1: Health Check
	try {
		const health = await axios.get(`${BASE_URL}/status`);
		console.log("✅ Health Check:", health.data.status);
	} catch (error) {
		console.log("❌ Health Check Failed:", error.message);
	}

	// Test 2: Admin Login
	try {
		const adminLogin = await axios.post(
			`${BASE_URL}/auth/login`,
			testUsers.admin
		);
		const adminToken = adminLogin.data.data.tokens.accessToken;
		console.log("✅ Admin Login:", adminLogin.data.status);

		// Test 3: Get Admin Profile
		const adminProfile = await axios.get(`${BASE_URL}/auth/profile`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});
		console.log("✅ Admin Profile:", adminProfile.data.status);
	} catch (error) {
		console.log(
			"❌ Admin Tests Failed:",
			error.response?.data?.message || error.message
		);
	}

	// Test 4: Team Head Login
	try {
		const teamHeadLogin = await axios.post(
			`${BASE_URL}/auth/login`,
			testUsers.teamHead
		);
		const teamHeadToken = teamHeadLogin.data.data.tokens.accessToken;
		console.log("✅ Team Head Login:", teamHeadLogin.data.status);
	} catch (error) {
		console.log(
			"❌ Team Head Tests Failed:",
			error.response?.data?.message || error.message
		);
	}

	// Test 5: Member Login
	try {
		const memberLogin = await axios.post(
			`${BASE_URL}/auth/login`,
			testUsers.member
		);
		const memberToken = memberLogin.data.data.tokens.accessToken;
		console.log("✅ Member Login:", memberLogin.data.status);
	} catch (error) {
		console.log(
			"❌ Member Tests Failed:",
			error.response?.data?.message || error.message
		);
	}

	console.log("\n🎉 API Tests Completed!");
}

runAllTests();
```

---

## 📊 Test Results Template

### **Test Report**

```markdown
# API Test Report

## Test Date: [Date]

## Environment: [Development/Staging/Production]

## ✅ Passed Tests

- [ ] Health Check
- [ ] User Registration
- [ ] User Login
- [ ] Get Profile
- [ ] Team Management
- [ ] Task Management
- [ ] Meeting Management
- [ ] Attendance Tracking
- [ ] Feedback System
- [ ] File Upload
- [ ] Notifications

## ❌ Failed Tests

- [ ] Test Name - Issue Description

## 🔧 Issues Found

1. **Issue 1**: Description
2. **Issue 2**: Description

## 📈 Performance Metrics

- Response Time: [X]ms
- Success Rate: [X]%
- Error Rate: [X]%

## 🎯 Recommendations

1. Recommendation 1
2. Recommendation 2
```

---

## 🚀 Quick Start Testing

### **1. Test Health Check**

```bash
curl http://localhost:5000/api/v1/status
```

### **2. Test Registration**

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "nationalID": "123456789",
    "email": "test@enactus.com",
    "password": "TestPass123!",
    "phoneNumber": "+1234567890",
    "role": "member",
    "dateOfBirth": "1995-01-01"
  }'
```

### **3. Test Login**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@enactus.com",
    "password": "AdminPass123!"
  }'
```

### **4. Test Protected Route**

```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📞 Testing Support

For testing-related questions:

1. **Check Server Logs** - Monitor for errors
2. **Verify Database** - Check if data is saved
3. **Test Token Validity** - Ensure JWT tokens work
4. **Check CORS** - Verify cross-origin requests
5. **Monitor Security** - Check security headers

**Happy Testing! 🧪✨**

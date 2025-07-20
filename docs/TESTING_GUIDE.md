<!-- @format -->

# 🧪 Complete Testing Guide - Enactus Management System

## Overview

This guide provides comprehensive testing procedures for all features of the Enactus Management System, including authentication, authorization, security, notifications, and core functionality.

---

## 📋 Testing Prerequisites

### **1. Environment Setup**

```bash
# Install dependencies
npm install

# Set up environment variables
cp config.env.example config.env
# Edit config.env with your values

# Start the server
npm start
```

### **2. Testing Tools**

- **Postman** or **Insomnia** for API testing
- **Browser Developer Tools** for frontend testing
- **MongoDB Compass** for database inspection
- **curl** for command-line testing

---

## 🔐 Authentication Testing

### **1. User Registration**

```bash
# Test user registration
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "nationalID": "123456789",
    "phoneNumber": "+1234567890",
    "role": "member"
  }'
```

**Expected Response:**

```json
{
	"status": "success",
	"message": "User registered successfully",
	"data": {
		"user": {
			"id": "...",
			"firstName": "John",
			"lastName": "Doe",
			"email": "john.doe@example.com",
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
# Test user login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**

```json
{
	"status": "success",
	"message": "Login successful",
	"data": {
		"user": {
			"_id": "...",
			"email": "john.doe@example.com",
			"role": "member"
		},
		"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

### **3. Password Validation Testing**

```bash
# Test weak password (should fail)
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "weak",
    "nationalID": "987654321",
    "phoneNumber": "+1234567890",
    "role": "member"
  }'
```

**Expected Response:**

```json
{
	"status": "fail",
	"message": "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
}
```

---

## 🛡️ Security Testing

### **1. Rate Limiting Testing**

```bash
# Test rate limiting by making multiple requests
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpass"}'
  echo "Request $i"
done
```

**Expected Response (after 5 attempts):**

```json
{
	"status": "fail",
	"message": "Too many authentication attempts"
}
```

### **2. XSS Protection Testing**

```bash
# Test XSS protection
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "<script>alert(\"XSS\")</script>",
    "lastName": "Doe",
    "email": "xss@example.com",
    "password": "SecurePass123!",
    "nationalID": "123456789",
    "phone": "+1234567890",
    "role": "member"
  }'
```

**Expected Response:** The script tags should be escaped in the database.

### **3. SQL Injection Testing**

```bash
# Test SQL injection protection
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com\" OR 1=1 --",
    "password": "anypassword"
  }'
```

**Expected Response:** Should not allow unauthorized access.

### **4. JWT Token Validation**

```bash
# Test with invalid token
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer invalid-token"
```

**Expected Response:**

```json
{
	"status": "fail",
	"message": "Invalid token"
}
```

---

## 🔒 Authorization Testing

### **1. Role-Based Access Control**

#### **Admin Access Testing**

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPass123!"}' | jq -r '.data.token')

# Test admin access to all resources
curl -X GET http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### **TeamHead Access Testing**

```bash
# Login as team head
TEAMHEAD_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teamhead@example.com", "password": "TeamHeadPass123!"}' | jq -r '.data.token')

# Test team head access to team resources
curl -X GET http://localhost:5000/api/v1/teams/my-team \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN"
```

#### **Member Access Testing**

```bash
# Login as member
MEMBER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "member@example.com", "password": "MemberPass123!"}' | jq -r '.data.token')

# Test member access to personal resources only
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

### **2. Resource Isolation Testing**

```bash
# Test that members can't access other users' data
curl -X GET http://localhost:5000/api/v1/users/other-user-id \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Response:**

```json
{
	"status": "fail",
	"message": "Access denied"
}
```

---

## 📢 Notification System Testing

### **1. Create Notification**

```bash
# Create a notification
curl -X POST http://localhost:5000/api/v1/notifications \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-id",
    "type": "task_assigned",
    "title": "New Task Assigned",
    "message": "You have been assigned a new task",
    "priority": "high",
    "data": {
      "taskId": "task-123",
      "taskTitle": "Complete Project Report"
    }
  }'
```

### **2. Get User Notifications**

```bash
# Get user's notifications
curl -X GET http://localhost:5000/api/v1/notifications/user \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

### **3. Mark Notification as Read**

```bash
# Mark notification as read
curl -X PATCH http://localhost:5000/api/v1/notifications/notification-id/read \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

### **4. Get Team Notifications**

```bash
# Get team notifications (for team heads)
curl -X GET http://localhost:5000/api/v1/notifications/team \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN"
```

---

## 👥 Team Management Testing

### **1. Create Team**

```bash
# Create a new team
curl -X POST http://localhost:5000/api/v1/teams \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Team",
    "description": "Software development team",
    "headId": "team-head-user-id",
    "viceHeadId": "vice-head-user-id"
  }'
```

### **2. Add Member to Team**

```bash
# Add member to team
curl -X POST http://localhost:5000/api/v1/teams/team-id/members \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "member-user-id"
  }'
```

### **3. Get Team Members**

```bash
# Get team members
curl -X GET http://localhost:5000/api/v1/teams/team-id/members \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN"
```

---

## 📋 Task Management Testing

### **1. Create Task**

```bash
# Create a new task
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Project Report",
    "description": "Write a comprehensive project report",
    "assignedTo": "member-user-id",
    "dueDate": "2024-02-01T00:00:00.000Z",
    "priority": "high",
    "teamId": "team-id"
  }'
```

### **2. Update Task Status**

```bash
# Update task status
curl -X PATCH http://localhost:5000/api/v1/tasks/task-id/status \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### **3. Get Team Tasks**

```bash
# Get team tasks
curl -X GET http://localhost:5000/api/v1/tasks/team/team-id \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN"
```

---

## 📅 Meeting Management Testing

### **1. Create Meeting**

```bash
# Create a new meeting
curl -X POST http://localhost:5000/api/v1/meetings \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Team Meeting",
    "description": "Discuss project progress",
    "date": "2024-01-15T10:00:00.000Z",
    "duration": 60,
    "location": "Conference Room A",
    "teamId": "team-id",
    "attendees": ["member-1-id", "member-2-id"]
  }'
```

### **2. RSVP to Meeting**

```bash
# RSVP to meeting
curl -X POST http://localhost:5000/api/v1/meetings/meeting-id/rsvp \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "attending"
  }'
```

---

## 📊 Attendance Testing

### **1. Mark Attendance**

```bash
# Mark attendance
curl -X POST http://localhost:5000/api/v1/attendance \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "meeting-id",
    "status": "present",
    "notes": "Arrived on time"
  }'
```

### **2. Get Attendance Report**

```bash
# Get attendance report
curl -X GET http://localhost:5000/api/v1/attendance/report/team-id \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN"
```

---

## 📝 Feedback Testing

### **1. Submit Feedback**

```bash
# Submit feedback
curl -X POST http://localhost:5000/api/v1/feedback \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "suggestion",
    "title": "Improve Meeting Structure",
    "description": "Meetings could be more organized",
    "priority": "medium",
    "category": "process_improvement"
  }'
```

### **2. Get Feedback**

```bash
# Get feedback (admin/team head)
curl -X GET http://localhost:5000/api/v1/feedback \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📁 File Management Testing

### **1. Upload File**

```bash
# Upload a file
curl -X POST http://localhost:5000/api/v1/files/upload \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "title=Project Document" \
  -F "description=Important project document" \
  -F "category=documents" \
  -F "teamId=team-id"
```

### **2. Get Files**

```bash
# Get team files
curl -X GET http://localhost:5000/api/v1/files/team/team-id \
  -H "Authorization: Bearer $TEAMHEAD_TOKEN"
```

---

## 🔍 Security Headers Testing

### **1. Check Security Headers**

```bash
# Check security headers
curl -I http://localhost:5000/api/v1/status
```

**Expected Headers:**

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### **2. Test CORS**

```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:5000/api/v1/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

---

## 📈 Performance Testing

### **1. Load Testing**

```bash
# Install Apache Bench
# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/api/v1/status
```

### **2. Memory Usage Testing**

```bash
# Monitor memory usage
node --inspect server.js
# Use Chrome DevTools to monitor memory
```

---

## 🧪 Automated Testing Scripts

### **1. Create Test Script**

```javascript
// test-api.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

async function runTests() {
	console.log("🧪 Starting API Tests...\n");

	// Test 1: Health Check
	try {
		const health = await axios.get(`${BASE_URL}/status`);
		console.log("✅ Health Check:", health.data.status);
	} catch (error) {
		console.log("❌ Health Check Failed:", error.message);
	}

	// Test 2: Authentication
	try {
		const login = await axios.post(`${BASE_URL}/auth/login`, {
			email: "admin@example.com",
			password: "AdminPass123!",
		});
		console.log("✅ Authentication:", login.data.status);

		const token = login.data.data.token;

		// Test 3: Protected Route
		const profile = await axios.get(`${BASE_URL}/auth/profile`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log("✅ Protected Route:", profile.data.status);
	} catch (error) {
		console.log("❌ Authentication Failed:", error.message);
	}

	console.log("\n🎉 Tests completed!");
}

runTests();
```

### **2. Run Tests**

```bash
# Install axios
npm install axios

# Run tests
node test-api.js
```

---

## 📊 Test Results Template

### **Test Report**

```markdown
# Test Report - Enactus Management System

## Test Date: [Date]

## Tester: [Name]

## Environment: [Development/Staging/Production]

## ✅ Passed Tests

- [ ] Authentication
- [ ] Authorization
- [ ] Security Headers
- [ ] Rate Limiting
- [ ] Input Validation
- [ ] File Upload
- [ ] Notifications
- [ ] Team Management
- [ ] Task Management
- [ ] Meeting Management
- [ ] Attendance Tracking
- [ ] Feedback System

## ❌ Failed Tests

- [ ] Test Name - Issue Description

## 🔧 Issues Found

1. **Issue 1**: Description
2. **Issue 2**: Description

## 📈 Performance Metrics

- Response Time: [X]ms
- Memory Usage: [X]MB
- CPU Usage: [X]%

## 🎯 Recommendations

1. Recommendation 1
2. Recommendation 2
```

---

## 🚀 Production Testing Checklist

### **Pre-Deployment Tests**

- [ ] All authentication flows work
- [ ] Authorization rules enforced
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] File uploads secure
- [ ] Notifications functional
- [ ] Database connections stable
- [ ] Error handling proper
- [ ] Logging functional

### **Post-Deployment Tests**

- [ ] SSL/TLS working
- [ ] Domain configuration correct
- [ ] Database performance acceptable
- [ ] Monitoring alerts configured
- [ ] Backup system tested
- [ ] Load balancer configured
- [ ] CDN working (if applicable)
- [ ] Email notifications working
- [ ] Mobile responsiveness (frontend)
- [ ] Cross-browser compatibility (frontend)

---

## 📞 Testing Support

For testing-related questions:

1. **Check API Documentation** - Review route definitions
2. **Monitor Server Logs** - Check for errors and warnings
3. **Use Browser DevTools** - For frontend testing
4. **Database Inspection** - Use MongoDB Compass
5. **Performance Monitoring** - Use built-in monitoring

---

## 🎯 Conclusion

This testing guide covers all major features of the Enactus Management System. Regular testing ensures system reliability, security, and performance. Always test in a staging environment before deploying to production.

**Happy Testing! 🧪✨**

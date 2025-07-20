<!-- @format -->

# 🧪 Task Management Testing Guide

## 📋 Overview

This guide covers comprehensive testing of all task-related functionality in the Enactus Management System, including creation, updates, comments, statistics, and role-based access control.

---

## 🎯 Task Model Structure

### **Task Schema** (`models/Tasks.js`)

```javascript
{
  title: String (required, max 100 chars),
  description: String (required, max 500 chars),
  assignedTo: ObjectId (required, ref: User),
  createdBy: ObjectId (required, ref: User),
  status: String (enum: pending, in_progress, completed, cancelled),
  dueDate: Date (required, must be future),
  priority: String (optional),
  attachments: Array,
  comments: Array
}
```

### **Task Statuses**

- `pending` - Task is created but not started
- `in_progress` - Task is currently being worked on
- `completed` - Task is finished
- `cancelled` - Task is cancelled

---

## 🔐 Role-Based Access Control

### **Task Creation Permissions**

- ✅ **Team Leader** - Can create tasks for their team members
- ✅ **Vice Head** - Can create tasks for their team members
- ❌ **Member** - Cannot create tasks
- ✅ **Admin** - Can create tasks for anyone

### **Task Update Permissions**

- ✅ **Team Leader** - Can update tasks in their team
- ✅ **Admin** - Can update any task
- ❌ **Member** - Cannot update tasks
- ❌ **Vice Head** - Cannot update tasks (TODO: implement)

### **Task Deletion Permissions**

- ✅ **Team Leader** - Can delete tasks in their team
- ✅ **Admin** - Can delete any task
- ❌ **Member** - Cannot delete tasks
- ❌ **Vice Head** - Cannot delete tasks (TODO: implement)

---

## 🧪 Test Scripts

### **1. Simple Task Test** (`test-tasks-simple.js`)

```bash
node test-tasks-simple.js
```

**Tests:**

- ✅ Task Statistics
- ✅ Get All Tasks
- ✅ Get Tasks by Status
- ✅ Get Tasks by Assignee
- ✅ Role-based Task Creation

### **2. Complete Task Test** (`test-tasks-complete.js`)

```bash
node test-tasks-complete.js
```

**Tests:**

- ✅ User Registration & Login
- ✅ Task Creation (Role-based)
- ✅ Task Retrieval & Filtering
- ✅ Task Updates & Status Changes
- ✅ Task Comments
- ✅ Task Statistics
- ✅ Role-Based Access Control
- ✅ Task Deletion

---

## 📡 API Endpoints

### **Task Management Endpoints**

#### **1. Create Task**

```bash
POST /api/v1/tasks
```

**Headers:**

```json
{
	"Authorization": "Bearer YOUR_TOKEN",
	"Content-Type": "application/json"
}
```

**Request Body:**

```json
{
	"title": "Complete Project Report",
	"description": "Write a comprehensive project report for Q1 2024",
	"assignedTo": "USER_ID_HERE",
	"dueDate": "2024-03-01T00:00:00.000Z",
	"priority": "high"
}
```

**Expected Response:**

```json
{
	"status": "success",
	"data": {
		"task": {
			"_id": "...",
			"title": "Complete Project Report",
			"description": "Write a comprehensive project report for Q1 2024",
			"status": "pending",
			"assignedTo": {
				"_id": "...",
				"firstName": "John",
				"lastName": "Doe",
				"email": "john@example.com"
			},
			"createdBy": {
				"_id": "...",
				"firstName": "Team",
				"lastName": "Leader"
			},
			"dueDate": "2024-03-01T00:00:00.000Z",
			"priority": "high"
		}
	}
}
```

#### **2. Get All Tasks**

```bash
GET /api/v1/tasks
```

**Expected Response:**

```json
{
  "status": "success",
  "results": 5,
  "data": {
    "tasks": [...]
  }
}
```

#### **3. Get Task by ID**

```bash
GET /api/v1/tasks/TASK_ID
```

#### **4. Update Task**

```bash
PATCH /api/v1/tasks/TASK_ID
```

**Request Body:**

```json
{
	"status": "in_progress",
	"description": "Updated description"
}
```

#### **5. Delete Task**

```bash
DELETE /api/v1/tasks/TASK_ID
```

#### **6. Get Tasks by Status**

```bash
GET /api/v1/tasks/status/pending
GET /api/v1/tasks/status/in_progress
GET /api/v1/tasks/status/completed
GET /api/v1/tasks/status/cancelled
```

#### **7. Get Tasks by Assignee**

```bash
GET /api/v1/tasks/assignee/USER_ID
```

#### **8. Get Tasks by Team**

```bash
GET /api/v1/tasks/team/TEAM_ID
```

#### **9. Add Comment to Task**

```bash
POST /api/v1/tasks/TASK_ID/comments
```

**Request Body:**

```json
{
	"comment": "Great progress on this task!",
	"userId": "USER_ID_HERE"
}
```

#### **10. Get Task Statistics**

```bash
GET /api/v1/tasks/stats
```

**Expected Response:**

```json
{
	"status": "success",
	"data": {
		"totalTasks": 25,
		"pendingTasks": 10,
		"inProgressTasks": 8,
		"completedTasks": 5,
		"cancelledTasks": 2,
		"dueToday": 3,
		"overdueTasks": 1
	}
}
```

---

## 🧪 Manual Testing with cURL

### **1. Test Task Statistics**

```bash
curl -X GET http://localhost:5000/api/v1/tasks/stats
```

### **2. Test Get All Tasks**

```bash
curl -X GET http://localhost:5000/api/v1/tasks
```

### **3. Test Task Creation (with token)**

```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "assignedTo": "USER_ID_HERE",
    "dueDate": "2024-03-01T00:00:00.000Z",
    "priority": "medium"
  }'
```

### **4. Test Task Update**

```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### **5. Test Add Comment**

```bash
curl -X POST http://localhost:5000/api/v1/tasks/TASK_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Working on this task now",
    "userId": "USER_ID_HERE"
  }'
```

---

## 🔍 Testing Scenarios

### **Scenario 1: Team Leader Workflow**

1. **Register Team Leader**
2. **Register Team Member**
3. **Login as Team Leader**
4. **Create task for team member**
5. **Update task status**
6. **Add comment to task**
7. **View task statistics**

### **Scenario 2: Member Workflow**

1. **Login as Member**
2. **View assigned tasks**
3. **Try to create task (should fail)**
4. **Try to update task (should fail)**
5. **Add comment to assigned task**

### **Scenario 3: Admin Workflow**

1. **Login as Admin**
2. **View all tasks**
3. **Create task for any user**
4. **Update any task**
5. **Delete any task**
6. **View comprehensive statistics**

### **Scenario 4: Task Filtering**

1. **Create tasks with different statuses**
2. **Filter by status (pending, in_progress, completed, cancelled)**
3. **Filter by assignee**
4. **Filter by team**

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Only team leaders or vice heads can assign tasks"**

**Cause:** User doesn't have proper role
**Solution:** Ensure user has `team_leader` or `vice_head` role

### **Issue 2: "You can only assign tasks to members of your own team"**

**Cause:** Trying to assign task to user from different team
**Solution:** Ensure both users are in the same team

### **Issue 3: "Due date must be in the future"**

**Cause:** Due date is in the past
**Solution:** Set due date to future date

### **Issue 4: "Task not found"**

**Cause:** Invalid task ID
**Solution:** Use valid task ID from database

### **Issue 5: "Access denied"**

**Cause:** Insufficient permissions
**Solution:** Use appropriate role (admin, team_leader)

---

## 📊 Expected Test Results

### **Successful Test Run Should Show:**

```
🧪 Testing Complete Task Management System...

1. Setting up test users...
✅ admin registered
✅ admin logged in
✅ teamLeader registered
✅ teamLeader logged in
✅ viceHead registered
✅ viceHead logged in
✅ member registered
✅ member logged in

2. Testing Task Creation...
✅ Team Leader created task: Complete Project Report
✅ Vice Head created task: Review Code Changes
✅ Member correctly blocked from creating tasks

3. Testing Task Retrieval...
✅ Retrieved all tasks: 2 tasks found
✅ Retrieved specific task: Complete Project Report
✅ Retrieved tasks by assignee: 2 tasks found

4. Testing Task Updates...
✅ Updated task status to: in_progress
✅ Updated task description
✅ Updated task due date

5. Testing Task Comments...
✅ Added comment as team leader
✅ Added comment as member

6. Testing Task Statistics...
✅ Task Statistics: { totalTasks: 2, pendingTasks: 1, ... }

7. Testing Role-Based Access...
✅ Member correctly blocked from updating tasks
✅ Admin can access all tasks

8. Testing Task Filtering...
✅ Retrieved tasks by status (in_progress): 1 tasks
✅ Retrieved tasks by status (pending): 1 tasks
✅ Correctly rejected invalid status

9. Testing Task Deletion...
✅ Admin deleted task successfully
✅ Task correctly deleted (404 not found)

🎉 All Task Tests Completed Successfully!
```

---

## 🎯 Next Steps

### **1. Run Tests**

```bash
# Simple test
node test-tasks-simple.js

# Complete test
node test-tasks-complete.js
```

### **2. Manual Testing**

- Use Postman or cURL to test individual endpoints
- Test with different user roles
- Verify role-based access control

### **3. Database Verification**

- Check MongoDB for created tasks
- Verify task relationships with users
- Confirm task status updates

### **4. Frontend Integration**

- Test task creation from frontend
- Verify real-time updates
- Test task filtering and search

---

## 📞 Support

For task-related issues:

1. **Check server logs** for detailed error messages
2. **Verify user roles** in database
3. **Confirm team assignments** for users
4. **Check JWT token validity**
5. **Verify task IDs** are correct

**Happy Testing! 🧪✨**

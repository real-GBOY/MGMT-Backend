<!-- @format -->

# Fixed Testing Guide - My Team Members Endpoint

## The Issue

The error "Access denied. You are not the team leader or vice head of this team" means the user is not properly assigned to the team or not set as the team leader/vice head.

## Complete Step-by-Step Fix

### Step 1: Register a Team Leader

**POST** `http://localhost:3000/api/v1/auth/register`

```json
{
	"firstName": "John",
	"lastName": "TeamLeader",
	"nationalID": "TL123456789",
	"email": "teamleader@enactus.com",
	"password": "TeamLeaderPass123!",
	"phoneNumber": "+1234567890",
	"role": "team_leader"
}
```

### Step 2: Login and Get Token

**POST** `http://localhost:3000/api/v1/auth/login`

```json
{
	"email": "teamleader@enactus.com",
	"password": "TeamLeaderPass123!"
}
```

**Save the access token and user ID from the response.**

### Step 3: Create a Team

**POST** `http://localhost:3000/api/v1/teams`
Headers: `Authorization: Bearer YOUR_TOKEN`

```json
{
	"name": "Test Team",
	"description": "A test team for testing"
}
```

**Save the team ID from the response.**

### Step 4: Add User to Team (CRITICAL STEP)

**POST** `http://localhost:3000/api/v1/teams/{TEAM_ID}/members`
Headers: `Authorization: Bearer YOUR_TOKEN`

```json
{
	"userId": "USER_ID_FROM_REGISTRATION"
}
```

### Step 5: Assign Team Leader (CRITICAL STEP)

**POST** `http://localhost:3000/api/v1/teams/{TEAM_ID}/leader`
Headers: `Authorization: Bearer YOUR_TOKEN`

```json
{
	"userId": "USER_ID_FROM_REGISTRATION"
}
```

### Step 6: Verify Team Assignment

**GET** `http://localhost:3000/api/v1/teams/{TEAM_ID}/leadership`
Headers: `Authorization: Bearer YOUR_TOKEN`

This should show the team leader properly assigned.

### Step 7: Test the Endpoint

**GET** `http://localhost:3000/api/v1/teams/my-team/members`
Headers: `Authorization: Bearer YOUR_TOKEN`

## Common Issues and Solutions

### Issue 1: User not assigned to team

**Solution**: Make sure you completed Step 4 (Add User to Team)

### Issue 2: User not set as team leader

**Solution**: Make sure you completed Step 5 (Assign Team Leader)

### Issue 3: Wrong user ID

**Solution**: Use the exact user ID from the registration response

### Issue 4: Wrong team ID

**Solution**: Use the exact team ID from the team creation response

## Verification Steps

### Check User's Team Assignment

**GET** `http://localhost:3000/api/v1/users/{USER_ID}`
Headers: `Authorization: Bearer YOUR_TOKEN`

The response should show the user has a `team` field with the team ID.

### Check Team Leadership

**GET** `http://localhost:3000/api/v1/teams/{TEAM_ID}/leadership`
Headers: `Authorization: Bearer YOUR_TOKEN`

The response should show the team leader properly assigned.

## Complete Test Script

Here's the exact sequence to test:

1. **Register**: Save user ID
2. **Login**: Save access token
3. **Create Team**: Save team ID
4. **Add to Team**: Use user ID and team ID
5. **Assign Leader**: Use user ID and team ID
6. **Test Endpoint**: Should work now

## Alternative: Use Admin to Set Up

If you have admin access, you can also:

1. **Login as admin**
2. **Create team**
3. **Add user to team**
4. **Assign team leader**
5. **Test with team leader's token**

## Debugging

If it still doesn't work, check:

1. **Database**: Verify the user has `team` field set
2. **Team Document**: Verify `teamLeader` field is set
3. **User Role**: Verify user has `team_leader` role
4. **Token**: Verify you're using the correct user's token

## Expected Database State

After setup, your database should have:

**User Document**:

```json
{
	"_id": "user_id",
	"team": "team_id",
	"role": "team_leader"
}
```

**Team Document**:

```json
{
	"_id": "team_id",
	"teamLeader": "user_id",
	"teamViceHead": []
}
```

This ensures the endpoint can properly verify the user's leadership role.

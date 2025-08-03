<!-- @format -->

# Postman Testing Guide for My Team Members Endpoint

## Correct API Base URL

**Base URL**: `http://localhost:3000/api/v1`

## Step-by-Step Testing Guide

### Step 1: Register a Team Leader

**Request**:

- Method: `POST`
- URL: `http://localhost:3000/api/v1/auth/register`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
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

**Expected Response**:

```json
{
	"status": "success",
	"message": "User registered successfully",
	"data": {
		"user": {
			"_id": "user_id_here",
			"firstName": "John",
			"lastName": "TeamLeader",
			"email": "teamleader@enactus.com",
			"role": "team_leader"
		}
	}
}
```

### Step 2: Login to Get Access Token

**Request**:

- Method: `POST`
- URL: `http://localhost:3000/api/v1/auth/login`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
  	"email": "teamleader@enactus.com",
  	"password": "TeamLeaderPass123!"
  }
  ```

**Expected Response**:

```json
{
	"status": "success",
	"data": {
		"tokens": {
			"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
		},
		"user": {
			"_id": "user_id_here",
			"firstName": "John",
			"lastName": "TeamLeader",
			"email": "teamleader@enactus.com",
			"role": "team_leader"
		}
	}
}
```

**Save the access token** for the next requests.

### Step 3: Create a Team

**Request**:

- Method: `POST`
- URL: `http://localhost:3000/api/v1/teams`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  ```
- Body (raw JSON):
  ```json
  {
  	"name": "Test Team",
  	"description": "A test team for testing the my-team/members endpoint"
  }
  ```

**Expected Response**:

```json
{
	"status": "success",
	"data": {
		"team": {
			"id": "team_id_here",
			"name": "Test Team",
			"description": "A test team for testing the my-team/members endpoint",
			"teamLeader": null,
			"teamViceHead": []
		}
	}
}
```

**Save the team ID** for the next requests.

### Step 4: Assign Team Leader to Team

**Request**:

- Method: `POST`
- URL: `http://localhost:3000/api/v1/teams/{TEAM_ID}/leader`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  ```
- Body (raw JSON):
  ```json
  {
  	"userId": "USER_ID_FROM_REGISTRATION"
  }
  ```

**Expected Response**:

```json
{
	"status": "success",
	"message": "Team leader assigned successfully",
	"data": {
		"team": {
			"_id": "team_id_here",
			"name": "Test Team",
			"teamLeader": {
				"_id": "user_id_here",
				"firstName": "John",
				"lastName": "TeamLeader",
				"email": "teamleader@enactus.com",
				"role": "team_leader"
			}
		}
	}
}
```

### Step 5: Test the My Team Members Endpoint

**Request**:

- Method: `GET`
- URL: `http://localhost:3000/api/v1/teams/my-team/members`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  ```

**Expected Success Response (200 OK)**:

```json
{
	"status": "success",
	"data": {
		"team": {
			"id": "team_id_here",
			"name": "Test Team",
			"description": "A test team for testing the my-team/members endpoint",
			"teamLeader": {
				"id": "user_id_here",
				"firstName": "John",
				"lastName": "TeamLeader",
				"email": "teamleader@enactus.com",
				"role": "team_leader",
				"profilePicture": "profile_url"
			},
			"teamViceHead": []
		},
		"members": {
			"total": 1,
			"list": [
				{
					"id": "user_id_here",
					"firstName": "John",
					"lastName": "TeamLeader",
					"email": "teamleader@enactus.com",
					"role": "team_leader",
					"profilePicture": "profile_url",
					"phoneNumber": "+1234567890",
					"dateOfBirth": null,
					"isActive": true,
					"createdAt": "2024-01-01T00:00:00.000Z"
				}
			]
		},
		"userRole": "team_leader",
		"isTeamLeader": true,
		"isViceHead": false
	}
}
```

## Testing Different Scenarios

### Scenario 1: Vice Head Access

1. **Register a Vice Head**:

   ```json
   {
   	"firstName": "Jane",
   	"lastName": "ViceHead",
   	"nationalID": "VH123456789",
   	"email": "vicehead@enactus.com",
   	"password": "ViceHeadPass123!",
   	"phoneNumber": "+1234567891",
   	"role": "vice_head"
   }
   ```

2. **Login and get token**

3. **Assign as Vice Head**:

   - Method: `POST`
   - URL: `http://localhost:3000/api/v1/teams/{TEAM_ID}/vice-head`
   - Body: `{ "userId": "VICE_HEAD_USER_ID" }`

4. **Test the endpoint** with vice head's token

### Scenario 2: Regular Member (Should Fail)

1. **Register a regular member**:

   ```json
   {
   	"firstName": "Bob",
   	"lastName": "Member",
   	"nationalID": "MB123456789",
   	"email": "member@enactus.com",
   	"password": "MemberPass123!",
   	"phoneNumber": "+1234567892",
   	"role": "member"
   }
   ```

2. **Login and get token**

3. **Test the endpoint** - Should get 403 error:
   ```json
   {
   	"status": "fail",
   	"message": "Access denied. Only team leaders and vice heads can view team members"
   }
   ```

### Scenario 3: No Authentication (Should Fail)

1. **Test without Authorization header** - Should get 401 error:
   ```json
   {
   	"status": "fail",
   	"message": "Access denied. No token provided."
   }
   ```

### Scenario 4: Invalid Token (Should Fail)

1. **Test with fake token**:
   ```
   Authorization: Bearer fake_token_here
   ```
   - Should get 401 error

## Postman Collection Variables

Set up these variables in your Postman collection:

1. **baseUrl**: `http://localhost:3000/api/v1`
2. **accessToken**: (from login response)
3. **teamId**: (from team creation response)
4. **userId**: (from registration response)

## Quick Test URLs

- **Register**: `{{baseUrl}}/auth/register`
- **Login**: `{{baseUrl}}/auth/login`
- **Create Team**: `{{baseUrl}}/teams`
- **Assign Leader**: `{{baseUrl}}/teams/{{teamId}}/leader`
- **My Team Members**: `{{baseUrl}}/teams/my-team/members`

## Troubleshooting

### Common Issues:

1. **404 Error**: Make sure you're using `/api/v1/` not `/api/`
2. **401 Error**: Check that your Authorization header is correct
3. **403 Error**: Verify the user has the correct role and is assigned to a team
4. **500 Error**: Check server logs for detailed error information

### Server Status Check:

Test the server is running:

- Method: `GET`
- URL: `http://localhost:3000/`
- Should return API welcome message

### Database Connection Check:

- Method: `GET`
- URL: `http://localhost:3000/api/v1/status`
- Should return API health status

<!-- @format -->

# Team Name Selection for Frontend

## Overview

The system now supports team name-based operations for frontend use. This allows the frontend to work with team names instead of IDs, making the user experience more intuitive.

## New Endpoints Added

### 1. Check Team Name Existence

- **Endpoint:** `GET /api/v1/teams/check/:name`
- **Purpose:** Check if a team name exists (useful for validation)
- **Response:**

```json
{
	"status": "success",
	"data": {
		"exists": true,
		"team": {
			"id": "64f8a1b2c3d4e5f678901234",
			"name": "Development Team",
			"description": "Software development team"
		}
	}
}
```

### 2. Get Team by Name

- **Endpoint:** `GET /api/v1/teams/name/:name`
- **Purpose:** Get full team details using team name
- **Response:**

```json
{
	"status": "success",
	"data": {
		"team": {
			"_id": "64f8a1b2c3d4e5f678901234",
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
			"teamViceHead": [],
			"createdAt": "2024-01-15T10:30:00.000Z"
		}
	}
}
```

### 3. Get Team Members by Name

- **Endpoint:** `GET /api/v1/teams/name/:name/members`
- **Purpose:** Get all members of a team using team name
- **Response:**

```json
{
	"status": "success",
	"data": {
		"team": {
			"id": "64f8a1b2c3d4e5f678901234",
			"name": "Development Team",
			"description": "Software development team"
		},
		"members": [
			{
				"_id": "64f8a1b2c3d4e5f678901235",
				"firstName": "John",
				"lastName": "Doe",
				"email": "john@example.com",
				"role": "team_leader",
				"profilePicture": "https://..."
			}
		]
	}
}
```

### 4. Add Member to Team by Name

- **Endpoint:** `POST /api/v1/teams/name/:name/members`
- **Purpose:** Add a user to a team using team name
- **Body:**

```json
{
	"userId": "64f8a1b2c3d4e5f678901236"
}
```

- **Response:**

```json
{
	"status": "success",
	"data": {
		"user": {
			"_id": "64f8a1b2c3d4e5f678901236",
			"firstName": "Jane",
			"lastName": "Smith",
			"email": "jane@example.com",
			"team": {
				"_id": "64f8a1b2c3d4e5f678901234",
				"name": "Development Team"
			}
		}
	}
}
```

## Frontend Implementation Guide

### 1. Team Selection Dropdown

```javascript
// Get all teams for dropdown
const fetchTeams = async () => {
	try {
		const response = await fetch("/api/v1/teams");
		const data = await response.json();

		if (data.status === "success") {
			return data.data.teams.map((team) => ({
				value: team.name,
				label: team.name,
				description: team.description,
			}));
		}
	} catch (error) {
		console.error("Error fetching teams:", error);
	}
};
```

### 2. Team Name Validation

```javascript
// Check if team name exists
const validateTeamName = async (teamName) => {
	try {
		const response = await fetch(
			`/api/v1/teams/check/${encodeURIComponent(teamName)}`
		);
		const data = await response.json();

		return {
			exists: data.data.exists,
			team: data.data.team,
		};
	} catch (error) {
		console.error("Error validating team name:", error);
		return { exists: false, team: null };
	}
};
```

### 3. Get Team Details by Name

```javascript
// Get team details using name
const getTeamByName = async (teamName) => {
	try {
		const response = await fetch(
			`/api/v1/teams/name/${encodeURIComponent(teamName)}`
		);
		const data = await response.json();

		if (data.status === "success") {
			return data.data.team;
		}
	} catch (error) {
		console.error("Error fetching team:", error);
	}
};
```

### 4. Add User to Team by Name

```javascript
// Add user to team using team name
const addUserToTeam = async (teamName, userId) => {
	try {
		const response = await fetch(
			`/api/v1/teams/name/${encodeURIComponent(teamName)}/members`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId }),
			}
		);

		const data = await response.json();

		if (data.status === "success") {
			return data.data.user;
		}
	} catch (error) {
		console.error("Error adding user to team:", error);
	}
};
```

## Benefits of Team Name Selection

### ✅ **Advantages:**

1. **User-Friendly**: Users can select teams by name instead of remembering IDs
2. **Intuitive**: More natural for frontend forms and dropdowns
3. **Readable URLs**: URLs with team names are more readable
4. **Better UX**: Easier for users to understand and work with

### ⚠️ **Considerations:**

1. **URL Encoding**: Team names with special characters need proper URL encoding
2. **Performance**: Name lookups are slightly slower than ID lookups
3. **Case Sensitivity**: Team names are case-sensitive
4. **Special Characters**: Team names with spaces or special characters need proper handling

## Best Practices

### 1. URL Encoding

Always encode team names in URLs:

```javascript
const encodedTeamName = encodeURIComponent(teamName);
```

### 2. Error Handling

Handle cases where team names don't exist:

```javascript
if (!data.data.exists) {
	// Handle team not found
	showError("Team not found");
}
```

### 3. Loading States

Show loading states during team name operations:

```javascript
const [isLoading, setIsLoading] = useState(false);

const handleTeamSelection = async (teamName) => {
	setIsLoading(true);
	try {
		const team = await getTeamByName(teamName);
		// Handle team data
	} catch (error) {
		// Handle error
	} finally {
		setIsLoading(false);
	}
};
```

### 4. Caching

Consider caching team data to improve performance:

```javascript
const teamCache = new Map();

const getTeamByNameCached = async (teamName) => {
	if (teamCache.has(teamName)) {
		return teamCache.get(teamName);
	}

	const team = await getTeamByName(teamName);
	if (team) {
		teamCache.set(teamName, team);
	}
	return team;
};
```

## Migration Strategy

### Phase 1: Add New Endpoints ✅

- ✅ Add team name-based endpoints
- ✅ Test all new endpoints
- ✅ Document the new functionality

### Phase 2: Frontend Implementation

- [ ] Update frontend forms to use team names
- [ ] Implement team name validation
- [ ] Add team selection dropdowns
- [ ] Update user assignment flows

### Phase 3: Gradual Migration

- [ ] Keep ID-based endpoints for backward compatibility
- [ ] Gradually migrate frontend components
- [ ] Monitor performance and user feedback

### Phase 4: Optimization

- [ ] Add caching for team name lookups
- [ ] Optimize database queries
- [ ] Consider adding team name indexes if needed

## Conclusion

The system is now ready for frontend team name selection! The new endpoints provide a complete solution for working with team names instead of IDs, making the user experience more intuitive and user-friendly.

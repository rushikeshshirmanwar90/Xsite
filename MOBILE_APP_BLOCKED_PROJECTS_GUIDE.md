# Mobile App - Handling Blocked Projects

## Overview

Projects now include license status information. For staff users, projects with expired client licenses are marked as `isAccessible: false` and should show a "Project Blocked" message instead of the "View Details" button.

## API Response Structure

### For Staff Users

When fetching projects, each project now includes:

```typescript
{
  _id: "project_id",
  name: "Project Name",
  clientId: "client_id",
  // ... other project fields
  
  // NEW FIELDS:
  isAccessible: boolean,        // true if can access, false if blocked
  licenseStatus: string,        // 'active', 'lifetime', 'expired', 'unknown'
  blockReason?: string          // Only present if isAccessible is false
}
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "proj1",
      "name": "Building A",
      "clientId": "client1",
      "isAccessible": true,
      "licenseStatus": "active"
    },
    {
      "_id": "proj2",
      "name": "Building B",
      "clientId": "client2",
      "isAccessible": false,
      "licenseStatus": "expired",
      "blockReason": "Client's license has expired. Contact client to renew."
    },
    {
      "_id": "proj3",
      "name": "Building C",
      "clientId": "client3",
      "isAccessible": true,
      "licenseStatus": "lifetime"
    }
  ],
  "message": "Retrieved 3 project(s) successfully"
}
```

## Mobile App Implementation

### 1. Update API Call

Add `userRole` parameter when fetching projects:

```typescript
// Get user role from AsyncStorage
const userDetailsString = await AsyncStorage.getItem("user");
const userData = JSON.parse(userDetailsString);
const userRole = userData.role || 'admin';

// Fetch projects with role
const response = await axios.get(
  `${domain}/api/project?clientId=${clientId}&userRole=${userRole}`
);

const projects = response.data.data; // Array of projects with license status
```

### 2. Update Project Card Component

Modify the project card to show different UI based on `isAccessible`:

```tsx
interface Project {
  _id: string;
  name: string;
  clientId: string;
  // ... other fields
  isAccessible: boolean;
  licenseStatus: string;
  blockReason?: string;
}

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.projectName}>{project.name}</Text>
      
      {/* Show different button based on accessibility */}
      {project.isAccessible ? (
        // Normal "View Details" button
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigateToProject(project._id)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      ) : (
        // Blocked message
        <View style={styles.blockedContainer}>
          <Ionicons name="lock-closed" size={20} color="#EF4444" />
          <View style={styles.blockedTextContainer}>
            <Text style={styles.blockedTitle}>Project Blocked</Text>
            <Text style={styles.blockedReason}>
              {project.blockReason || "Access denied"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  blockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  blockedTextContainer: {
    flex: 1,
  },
  blockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  blockedReason: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
  },
});
```

### 3. Prevent Navigation to Blocked Projects

Add a check before navigating:

```typescript
const navigateToProject = (projectId: string) => {
  const project = projects.find(p => p._id === projectId);
  
  if (!project?.isAccessible) {
    Alert.alert(
      "Access Denied",
      project?.blockReason || "This project is currently blocked.",
      [{ text: "OK" }]
    );
    return;
  }
  
  // Navigate to project details
  router.push(`/project-details?id=${projectId}`);
};
```

### 4. Handle Direct Access Attempts

If a staff user tries to access a blocked project directly (e.g., via deep link):

```typescript
const fetchProjectDetails = async (projectId: string) => {
  try {
    const userRole = userData.role || 'admin';
    const response = await axios.get(
      `${domain}/api/project?id=${projectId}&clientId=${clientId}&userRole=${userRole}`
    );
    
    setProject(response.data.data);
  } catch (error) {
    if (error.response?.status === 403) {
      // Project blocked
      Alert.alert(
        "Access Denied",
        error.response?.data?.message || "This project's client license has expired.",
        [
          {
            text: "Go Back",
            onPress: () => router.back()
          }
        ]
      );
    } else {
      // Other error
      Alert.alert("Error", "Failed to load project details");
    }
  }
};
```

## UI Examples

### Accessible Project Card

```
┌─────────────────────────────────┐
│ Building A                      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │     View Details            │ │ ← Blue button
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Blocked Project Card

```
┌─────────────────────────────────┐
│ Building B                      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔒  Project Blocked         │ │ ← Red background
│ │     Client's license has    │ │
│ │     expired. Contact client │ │
│ │     to renew.               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Testing

### Test Scenario 1: Mixed Projects

**Setup**:
- Admin A: Active license (30 days)
- Admin B: Expired license (0 days)
- Staff assigned to both

**Expected UI**:
- Admin A's projects: Show "View Details" button ✅
- Admin B's projects: Show "Project Blocked" message ❌
- Both types visible in list

### Test Scenario 2: All Accessible

**Setup**:
- All admins have active licenses

**Expected UI**:
- All projects show "View Details" button ✅
- No blocked messages

### Test Scenario 3: All Blocked

**Setup**:
- All admins have expired licenses

**Expected UI**:
- All projects show "Project Blocked" message ❌
- No "View Details" buttons

## Summary

### For Admin Users:
- `isAccessible` is always `true`
- All projects show "View Details" button
- No blocked messages

### For Staff Users:
- `isAccessible` depends on client's license
- Accessible projects: Show "View Details" button
- Blocked projects: Show "Project Blocked" message with reason
- Projects remain visible in list (not filtered out)

### Key Points:
1. ✅ Projects are NOT filtered out - they're all returned
2. ✅ Each project has `isAccessible` flag
3. ✅ Blocked projects show message instead of button
4. ✅ Staff can see which projects are blocked and why
5. ✅ Clear communication about license status

This approach provides better UX by:
- Showing staff all their assigned projects
- Clearly indicating which are accessible
- Explaining why projects are blocked
- Preventing confusion about missing projects

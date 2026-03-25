# Complete License Control Solution

## Problem

Staff users could still access and modify data for projects with expired client licenses because:
1. Mobile app wasn't passing `userRole` parameter
2. Labor and Equipment APIs weren't checking project access
3. No validation when staff tried to add/edit data for blocked projects

## Complete Solution

### 1. Backend - Project License Status

**File**: `real-estate-apis/lib/middleware/projectLicenseFilter.ts`

**Functions**:
- `checkClientLicense(clientId)` - Check if client's license is active
- `addLicenseStatusToProjects(projects, userRole)` - Add `isAccessible` flag to projects
- `canAccessProject(clientId)` - Validate staff can access project
- `withProjectAccessCheck()` - Middleware wrapper for API routes

### 2. Backend - Project API

**File**: `real-estate-apis/app/api/project/route.ts`

**Implementation**:
```typescript
// GET projects with license status
export const GET = async (req: NextRequest) => {
  const userRole = searchParams.get("userRole") || 'admin';
  
  let projects = await Projects.find(query);
  
  // Add license status to each project
  projects = await addLicenseStatusToProjects(projects, userRole);
  
  return successResponse(projects);
};
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "proj1",
      "name": "Building A",
      "isAccessible": true,
      "licenseStatus": "active"
    },
    {
      "_id": "proj2",
      "name": "Building B",
      "isAccessible": false,
      "licenseStatus": "expired",
      "blockReason": "Client's license has expired. Contact client to renew."
    }
  ]
}
```

### 3. Backend - Labor API Protection

**File**: `real-estate-apis/app/api/labor/route.ts`

**Implementation**:
```typescript
// Helper function to check staff access
async function checkStaffProjectAccess(req: NextRequest, projectId: string) {
  const userRole = searchParams.get("userRole") || 'admin';
  
  if (userRole === 'admin') {
    return null; // Admin can access
  }
  
  // Staff: check project's client license
  const project = await Projects.findById(projectId);
  const accessCheck = await canAccessProject(project.clientId);
  
  if (!accessCheck.canAccess) {
    return errorResponse(accessCheck.reason, 403);
  }
  
  return null; // Access granted
}

// POST - Add labor
export async function POST(req: NextRequest) {
  // ... get projectId ...
  
  // Check staff access
  const accessError = await checkStaffProjectAccess(req, projectId);
  if (accessError) {
    return accessError; // 403 Forbidden
  }
  
  // Proceed with adding labor
}
```

### 4. Backend - Equipment API Protection

**File**: `real-estate-apis/app/api/equipment/route.ts`

**Same implementation as Labor API**:
- Added `checkStaffProjectAccess()` helper
- Validates staff access before creating/updating equipment
- Returns 403 if project's client license is expired

### 5. Mobile App - API Calls

**CRITICAL**: Mobile app MUST pass `userRole` parameter in ALL API calls:

```typescript
// Get user role from storage
const userDetailsString = await AsyncStorage.getItem("user");
const userData = JSON.parse(userDetailsString);
const userRole = userData.role || 'admin';

// Fetch projects with userRole
const response = await axios.get(
  `${domain}/api/project?clientId=${clientId}&userRole=${userRole}`
);

// Add labor with userRole
await axios.post(
  `${domain}/api/labor?userRole=${userRole}`,
  laborData
);

// Add equipment with userRole
await axios.post(
  `${domain}/api/equipment?userRole=${userRole}`,
  equipmentData
);
```

### 6. Mobile App - Project Card UI

```tsx
const ProjectCard = ({ project }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{project.name}</Text>
      
      {project.isAccessible ? (
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigate(project._id)}
        >
          <Text>View Details</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.blocked}>
          <Ionicons name="lock-closed" size={20} color="#EF4444" />
          <View>
            <Text style={styles.blockedTitle}>Project Blocked</Text>
            <Text style={styles.blockedReason}>
              {project.blockReason}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
```

## How It Works

### For Admin Users

1. **Login** → Check own license
2. **If expired** → Full-screen block (cannot access app)
3. **If active** → Full access to all features

### For Staff Users

1. **Login** → Always get app access
2. **Fetch projects** → API adds `isAccessible` flag to each project
3. **View project list**:
   - Accessible projects: Show "View Details" button
   - Blocked projects: Show "🔒 Project Blocked" message
4. **Try to access blocked project**:
   - API returns 403 error
   - Show alert with reason
5. **Try to add labor/equipment to blocked project**:
   - API returns 403 error
   - Show alert: "Cannot modify blocked project"

## API Protection Summary

### Protected Endpoints

1. **GET /api/project**
   - Returns all projects with `isAccessible` flag
   - Staff see which projects are blocked

2. **GET /api/project?id=PROJECT_ID**
   - Staff accessing blocked project → 403 error

3. **POST /api/labor**
   - Staff adding labor to blocked project → 403 error

4. **POST /api/equipment**
   - Staff adding equipment to blocked project → 403 error

5. **PUT /api/labor**
   - Staff updating labor in blocked project → 403 error

6. **PUT /api/equipment**
   - Staff updating equipment in blocked project → 403 error

### Error Response

```json
{
  "success": false,
  "message": "This project's client license has expired. Please contact the client to renew their subscription.",
  "error": "PROJECT_ACCESS_DENIED"
}
```
**Status Code**: 403

## Mobile App Changes Required

### 1. Add userRole to ALL API calls

```typescript
// Create a helper function
const getApiUrl = (endpoint: string, params: Record<string, string> = {}) => {
  const userRole = userData.role || 'admin';
  const queryParams = new URLSearchParams({
    ...params,
    userRole
  });
  return `${domain}${endpoint}?${queryParams}`;
};

// Usage
const url = getApiUrl('/api/project', { clientId });
const response = await axios.get(url);
```

### 2. Update Project Card Component

Check `project.isAccessible` and show appropriate UI:
- `true`: Show "View Details" button
- `false`: Show "Project Blocked" message

### 3. Handle 403 Errors

```typescript
try {
  await axios.post(url, data);
} catch (error) {
  if (error.response?.status === 403) {
    Alert.alert(
      "Access Denied",
      error.response?.data?.message || "Cannot access this project"
    );
  }
}
```

### 4. Prevent Actions on Blocked Projects

```typescript
const handleAddLabor = async (projectId: string) => {
  const project = projects.find(p => p._id === projectId);
  
  if (!project?.isAccessible) {
    Alert.alert(
      "Project Blocked",
      project?.blockReason || "Cannot modify blocked project"
    );
    return;
  }
  
  // Proceed with adding labor
};
```

## Testing

### Test 1: Staff with Mixed Projects

**Setup**:
```javascript
// Admin A - Active
db.clients.updateOne(
  { email: "adminA@example.com" },
  { $set: { license: 30, isLicenseActive: true } }
)

// Admin B - Expired
db.clients.updateOne(
  { email: "adminB@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)
```

**Test**:
1. Login as staff
2. Fetch projects with `userRole=staff`
3. **Expected**:
   - Admin A's projects: `isAccessible: true`
   - Admin B's projects: `isAccessible: false`

### Test 2: Staff Tries to Add Labor to Blocked Project

**Test**:
```bash
curl -X POST "http://localhost:3000/api/labor?userRole=staff" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "BLOCKED_PROJECT_ID",
    "laborEntries": [...]
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "This project's client license has expired. Please contact the client to renew their subscription.",
  "error": "PROJECT_ACCESS_DENIED"
}
```
**Status**: 403

### Test 3: Admin with Expired License

**Test**:
1. Login as admin with expired license
2. **Expected**: Full-screen block, cannot access app

## Summary

### Complete Protection

✅ **Frontend**: Projects show blocked status in UI
✅ **Backend - Projects API**: Returns license status with each project
✅ **Backend - Labor API**: Validates staff access before modifications
✅ **Backend - Equipment API**: Validates staff access before modifications
✅ **Mobile App**: Must pass `userRole` parameter in all API calls

### Key Points

1. **Mobile app MUST pass `userRole` parameter** - Without this, API treats everyone as admin
2. **Check `isAccessible` flag** - Use this to show/hide UI elements
3. **Handle 403 errors** - Show appropriate error messages
4. **Prevent actions on blocked projects** - Check before allowing modifications

### User Experience

- **Admin**: Blocked at app level if license expires
- **Staff**: Can access app, see all projects, but blocked projects show message
- **Clear communication**: Staff know exactly which projects are blocked and why
- **No data loss**: Projects remain visible, just not accessible

This solution provides complete protection while maintaining good UX for staff users working with multiple clients.

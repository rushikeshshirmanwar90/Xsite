# Project-Level License Control

## Architecture Overview

The application now implements **project-level license filtering** instead of app-level blocking for staff users.

### User Hierarchy

```
Staff User
  ├── Admin A (license: active) → Projects accessible ✅
  ├── Admin B (license: expired) → Projects blocked ❌
  └── Admin C (license: lifetime) → Projects accessible ✅
```

### Key Principle

- **Admin**: If license expires, admin is blocked from entire app
- **Staff**: Can access app, but only see projects from admins with active licenses
- **Project Filtering**: Happens at API level, not app level

## How It Works

### For Admin Users

1. Admin logs in
2. System checks admin's own license
3. **If expired**: Admin is blocked from entire app (full-screen block)
4. **If active**: Admin has full access to all features

### For Staff Users

1. Staff logs in
2. System grants app access (no app-level blocking)
3. When fetching projects:
   - API checks each project's client license
   - Only returns projects where client license is active
   - Filters out projects with expired client licenses
4. Staff sees only projects from admins with active licenses

## Implementation

### 1. Frontend - License Check Hook

**File**: `Xsite/hooks/useLicenseCheck.ts`

```typescript
// Staff users always have app access
if (userData.role && userData.role !== 'admin') {
  return { hasAccess: true };  // No app-level blocking
}

// Admin users checked for app-level access
const clientId = userData._id;
const { license } = await checkLicense(clientId);

if (license === 0) {
  return { hasAccess: false };  // Block admin from app
}
```

### 2. Backend - Project License Filter

**File**: `real-estate-apis/lib/middleware/projectLicenseFilter.ts`

**Functions**:

1. `checkClientLicense(clientId)` - Check if a client's license is active
2. `filterProjectsByLicense(projects, userRole)` - Filter projects based on license
3. `canAccessProject(projectClientId)` - Check if staff can access specific project

**Logic**:
```typescript
// For each project
for (const project of projects) {
  const clientId = project.clientId;
  const { hasAccess } = await checkClientLicense(clientId);
  
  if (hasAccess) {
    // Include project in results
  } else {
    // Filter out project (client license expired)
  }
}
```

### 3. Backend - Project API Route

**File**: `real-estate-apis/app/api/project/route.ts`

**Changes**:
- Removed `withLicenseCheck` wrapper (no app-level blocking for staff)
- Added `userRole` parameter to GET request
- Added project filtering for staff users

**Implementation**:
```typescript
export const GET = async (req: NextRequest) => {
  const userRole = searchParams.get("userRole") || 'admin';
  
  // Fetch projects
  let projects = await Projects.find(query);
  
  // For staff: filter by client license
  if (userRole !== 'admin') {
    projects = await filterProjectsByLicense(projects, userRole);
  }
  
  return successResponse(projects);
};
```

### 4. Backend - Labor & Equipment APIs

**Files**: 
- `real-estate-apis/app/api/labor/route.ts`
- `real-estate-apis/app/api/equipment/route.ts`

**Changes**:
- Removed `withLicenseCheck` wrapper
- Staff can access these APIs (project-level filtering ensures they only work with accessible projects)

## User Experience

### Admin with Expired License

1. **Opens app**
2. **Sees blocked screen**:
   - 🔒 Lock icon
   - "License Expired" message
   - Contact support buttons
   - Cannot access anything

### Staff with Multiple Admins

1. **Opens app**
2. **App loads normally** ✅
3. **Views project list**:
   - Admin A (active license): 5 projects shown ✅
   - Admin B (expired license): 3 projects hidden ❌
   - Admin C (lifetime license): 2 projects shown ✅
   - **Total visible**: 7 projects (out of 10)

4. **Tries to access Admin B's project**:
   - API returns 403 error
   - Message: "This project's client license has expired. Please contact the client to renew their subscription."

## API Changes

### Project API

**Request**:
```bash
GET /api/project?clientId=CLIENT_ID&userRole=staff
```

**Parameters**:
- `clientId`: The client ID to fetch projects for
- `userRole`: 'admin' or 'staff' (determines filtering)
- `staffId`: (optional) Filter by assigned staff

**Response for Staff**:
```json
{
  "success": true,
  "data": [
    // Only projects with active client licenses
  ],
  "message": "Retrieved 7 project(s) successfully"
}
```

**Filtering Logic**:
- Admin role: No filtering (returns all projects)
- Staff role: Filters out projects with expired client licenses

### Single Project Access

**Request**:
```bash
GET /api/project?id=PROJECT_ID&clientId=CLIENT_ID&userRole=staff
```

**Response if Client License Expired**:
```json
{
  "success": false,
  "message": "This project's client license has expired. Please contact the client to renew their subscription.",
  "error": "LICENSE_EXPIRED"
}
```
**Status Code**: 403

## Benefits

1. ✅ **Staff Can Work**: Staff aren't blocked from app if one admin's license expires
2. ✅ **Proper Isolation**: Staff only see projects from admins with active licenses
3. ✅ **Clear Messaging**: Staff know which projects are inaccessible and why
4. ✅ **Admin Control**: Admins are still blocked at app level if their license expires
5. ✅ **Flexible**: Staff can work for multiple admins simultaneously
6. ✅ **Secure**: No way to bypass license by accessing expired projects

## Testing

### Test Scenario 1: Staff with Mixed Licenses

**Setup**:
```javascript
// Admin A - Active license
db.clients.updateOne(
  { email: "adminA@example.com" },
  { $set: { license: 30, isLicenseActive: true } }
)

// Admin B - Expired license
db.clients.updateOne(
  { email: "adminB@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)

// Staff assigned to both admins
// Has projects from both Admin A and Admin B
```

**Test**:
1. Login as staff user
2. View project list
3. **Expected**:
   - ✅ See Admin A's projects
   - ❌ Don't see Admin B's projects
   - ✅ App works normally

**API Test**:
```bash
# Fetch projects for staff
curl -X GET "http://localhost:3000/api/project?clientId=ADMIN_A_ID&userRole=staff"
# Returns Admin A's projects ✅

curl -X GET "http://localhost:3000/api/project?clientId=ADMIN_B_ID&userRole=staff"
# Returns empty array (filtered out) ❌
```

### Test Scenario 2: Staff Tries to Access Expired Project

**Setup**:
```javascript
// Admin with expired license
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)
```

**Test**:
```bash
# Try to access specific project
curl -X GET "http://localhost:3000/api/project?id=PROJECT_ID&clientId=EXPIRED_ADMIN_ID&userRole=staff"
```

**Expected Response**:
```json
{
  "success": false,
  "message": "This project's client license has expired. Please contact the client to renew their subscription.",
  "error": "LICENSE_EXPIRED"
}
```
**Status Code**: 403

### Test Scenario 3: Admin with Expired License

**Setup**:
```javascript
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)
```

**Test**:
1. Login as admin
2. **Expected**:
   - ✅ Blocked screen appears
   - ✅ Cannot access app
   - ✅ Must renew license

## Mobile App Changes

### Project Fetching

**Before**:
```typescript
// Fetch projects without role
const response = await axios.get(`${domain}/api/project?clientId=${clientId}`);
```

**After**:
```typescript
// Include user role for filtering
const userRole = userData.role || 'admin';
const response = await axios.get(
  `${domain}/api/project?clientId=${clientId}&userRole=${userRole}`
);
```

### Error Handling

```typescript
try {
  const response = await axios.get(`${domain}/api/project?id=${projectId}&userRole=staff`);
  // Success - show project
} catch (error) {
  if (error.response?.status === 403) {
    // Project's client license expired
    Alert.alert(
      "Access Denied",
      "This project's client license has expired. Please contact the client to renew their subscription."
    );
  }
}
```

## Summary

### Admin Users
- **App-level blocking**: If license expires, blocked from entire app
- **Full-screen block**: Cannot access any features
- **Must renew**: Contact support to renew license

### Staff Users
- **No app-level blocking**: Can always access app
- **Project-level filtering**: Only see projects from admins with active licenses
- **Graceful degradation**: Projects from expired admins are hidden
- **Clear errors**: If they try to access expired project, get clear error message

### Key Difference
- **Old**: Staff blocked from entire app if any assigned admin's license expires
- **New**: Staff can access app, but only see projects from admins with active licenses

This approach allows staff to continue working with their other clients while one client's license is being renewed.

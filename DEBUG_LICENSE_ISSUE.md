# Debug License Issue - Step by Step

## Issue
Staff user still sees "View Details" button for projects whose admin's license has expired.

## Changes Made

### 1. Backend Changes
- ✅ Added `addLicenseStatusToProjects` import to `/api/users/staff` route
- ✅ Added license status checking after populating staff projects
- ✅ Added `skipCache` parameter support
- ✅ Added detailed console logging

### 2. Frontend Changes
- ✅ Updated mobile app to use `skipCache=true` parameter
- ✅ Added extraction of license status fields from project data
- ✅ Added detailed console logging

### 3. Debug Tools Created
- ✅ Created `/api/debug-license` endpoint to check actual database values
- ✅ Created test script to verify license logic

## Debugging Steps

### Step 1: Check Database Values

**Get your staff ID from the mobile app console or database**

Then call the debug endpoint:
```bash
# Replace STAFF_ID with actual staff ID
curl "http://localhost:8080/api/debug-license?staffId=STAFF_ID"
```

This will show you:
- All clients the staff is assigned to
- Each client's license value and status
- Which projects belong to which client
- Expected behavior for each project

**Example output:**
```json
{
  "success": true,
  "debug": {
    "staff": {
      "_id": "staff123",
      "name": "John Doe",
      "assignedProjectsCount": 5
    },
    "clients": [
      {
        "_id": "client1",
        "name": "Admin 1",
        "license": 365,
        "isLicenseActive": true,
        "hasAccess": true,
        "status": "✅ ACTIVE"
      },
      {
        "_id": "client2",
        "name": "Admin 2",
        "license": 0,
        "isLicenseActive": false,
        "hasAccess": false,
        "status": "❌ EXPIRED"
      }
    ],
    "projectsByClient": [
      {
        "clientId": "client1",
        "clientName": "Admin 1",
        "clientStatus": "✅ ACTIVE",
        "projects": [
          { "_id": "proj1", "name": "Project A" },
          { "_id": "proj2", "name": "Project B" }
        ]
      },
      {
        "clientId": "client2",
        "clientName": "Admin 2",
        "clientStatus": "❌ EXPIRED",
        "projects": [
          { "_id": "proj3", "name": "Project C" }
        ]
      }
    ]
  }
}
```

### Step 2: Check Backend Logs

When the mobile app fetches staff data, look for these logs in your backend console:

```
🔍 Staff API (users/staff) called with: { id: 'staff123', getAllProjects: 'true', skipCache: 'true' }
⚡ Skipping cache - fetching fresh data
🌟 Getting ALL projects for staff user: staff123
🔐 Adding license status to staff projects...
📋 License check result for "Project A": { hasAccess: true, license: 365 }
✅ Project "Project A" is accessible
📋 License check result for "Project C": { hasAccess: false, license: 0 }
🚫 Project "Project C" is BLOCKED - license: 0
🔍 Projects with license status: [
  {
    "name": "Project A",
    "isAccessible": true,
    "licenseStatus": "active"
  },
  {
    "name": "Project C",
    "isAccessible": false,
    "licenseStatus": "expired",
    "blockReason": "Client's license has expired. Contact client to renew."
  }
]
✅ License status added to all staff projects
```

### Step 3: Check Mobile App Console

Look for these logs in your mobile app console (React Native debugger or Expo):

```
👤 Staff user detected - fetching staff data with populated projects
✅ Staff data fetched: { _id: 'staff123', firstName: 'John', ... }
📊 Found 3 populated projects for staff user
🔍 Sample project with license status: { name: 'Project A', isAccessible: true, ... }
Project 1: Project A { isAccessible: true, licenseStatus: 'active', clientName: 'Admin 1' }
Project 2: Project B { isAccessible: true, licenseStatus: 'active', clientName: 'Admin 1' }
Project 3: Project C { isAccessible: false, licenseStatus: 'expired', blockReason: '...', clientName: 'Admin 2' }
🎴 ProjectCard for "Project A": { isAccessible: true, licenseStatus: 'active', userType: 'staff' }
🎴 ProjectCard for "Project C": { isAccessible: false, licenseStatus: 'expired', userType: 'staff' }
```

### Step 4: Verify Client License in Database

If the debug endpoint shows a client has `license: 365` but you expect it to be `0`, update it:

```javascript
// In MongoDB shell or Compass
db.clients.updateOne(
  { _id: ObjectId("CLIENT_ID") },
  { 
    $set: { 
      license: 0,
      isLicenseActive: false
    } 
  }
)
```

### Step 5: Force Fresh Data

1. **Clear app cache** - Close and reopen the mobile app
2. **Pull to refresh** - Swipe down on the projects list
3. **Check skipCache** - Verify the API call includes `skipCache=true`

## Common Issues

### Issue 1: All projects show "View Details"

**Possible causes:**
1. Cache is being used (skipCache not working)
2. License values in database are not 0
3. Backend code not deployed/restarted

**Solutions:**
- Check backend logs for "⚡ Skipping cache"
- Verify license values with debug endpoint
- Restart backend server

### Issue 2: Backend logs don't show license checking

**Possible causes:**
1. Code changes not saved
2. Backend not restarted
3. Wrong API endpoint being called

**Solutions:**
- Verify file changes are saved
- Restart backend: `npm run dev` or `yarn dev`
- Check mobile app is calling `/api/users/staff?getAllProjects=true&skipCache=true`

### Issue 3: Mobile app doesn't show license status in logs

**Possible causes:**
1. Frontend code not updated
2. App not reloaded
3. Data structure mismatch

**Solutions:**
- Verify frontend changes are saved
- Reload app: Shake device → Reload
- Check API response structure matches frontend expectations

## Quick Fix Checklist

- [ ] Backend changes saved and server restarted
- [ ] Frontend changes saved and app reloaded
- [ ] Database has at least one client with `license: 0`
- [ ] Staff is assigned to projects from that client
- [ ] Mobile app uses `skipCache=true` parameter
- [ ] Backend logs show license checking
- [ ] Mobile app logs show license status
- [ ] ProjectCard receives `isAccessible: false` for blocked projects

## Test Command

Run this to test the entire flow:

```bash
# 1. Check staff's clients and their licenses
curl "http://localhost:8080/api/debug-license?staffId=YOUR_STAFF_ID"

# 2. Check specific client license
curl "http://localhost:8080/api/debug-license?clientId=YOUR_CLIENT_ID"

# 3. Fetch staff data (same as mobile app)
curl "http://localhost:8080/api/users/staff?id=YOUR_STAFF_ID&getAllProjects=true&skipCache=true"
```

## Expected API Response Structure

```json
{
  "success": true,
  "data": {
    "_id": "staff123",
    "firstName": "John",
    "lastName": "Doe",
    "assignedProjects": [
      {
        "projectId": "proj1",
        "projectName": "Project A",
        "clientId": "client1",
        "clientName": "Admin 1",
        "projectData": {
          "_id": "proj1",
          "name": "Project A",
          "isAccessible": true,
          "licenseStatus": "active"
        }
      },
      {
        "projectId": "proj3",
        "projectName": "Project C",
        "clientId": "client2",
        "clientName": "Admin 2",
        "projectData": {
          "_id": "proj3",
          "name": "Project C",
          "isAccessible": false,
          "licenseStatus": "expired",
          "blockReason": "Client's license has expired. Contact client to renew."
        }
      }
    ]
  }
}
```

## Next Steps

1. Run the debug endpoint to see actual database values
2. Check backend logs when mobile app fetches data
3. Check mobile app console logs
4. Share the logs if issue persists

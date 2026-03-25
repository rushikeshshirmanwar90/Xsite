# Testing Staff License Blocking Feature

## Quick Test Guide

### Setup Test Scenario

You need:
1. **Staff User** - A staff member assigned to projects from multiple admins
2. **Admin 1** - Active license (`license: 365` or `license: -1`)
3. **Admin 2** - Expired license (`license: 0`)

### Test Steps

#### 1. Prepare Test Data

**Set Admin 2's license to expired:**
```javascript
// In MongoDB or via API
db.clients.updateOne(
  { _id: ObjectId("admin2_id") },
  { $set: { license: 0, isLicenseActive: false } }
)
```

**Verify staff has projects from both admins:**
```javascript
// Check staff's assignedProjects array
db.staff.findOne({ _id: ObjectId("staff_id") })
// Should have projects with different clientId values
```

#### 2. Clear Cache (Important!)

```bash
# If redis-cli is available
redis-cli --scan --pattern "staff:*" | xargs -L 1 redis-cli DEL

# Or restart the backend server to clear cache
```

#### 3. Test in Mobile App

**Login as Staff User:**
1. Open mobile app
2. Login with staff credentials
3. Navigate to "My Projects" tab

**Expected Results:**

✅ **Projects from Admin 1 (Active License):**
- Show blue "View Details" button
- Clicking opens project details normally

❌ **Projects from Admin 2 (Expired License):**
- Show red "Project Blocked" button with lock icon (🔒)
- Display block reason below button: "Client's license has expired. Contact client to renew."
- Clicking shows alert: "Project Blocked" with full message

#### 4. Verify API Response

**Test API directly:**
```bash
# Get staff data with all projects
curl "http://localhost:8080/api/users/staff?id=STAFF_ID&getAllProjects=true"
```

**Check response structure:**
```json
{
  "success": true,
  "data": {
    "_id": "staff_id",
    "assignedProjects": [
      {
        "projectId": "project1_id",
        "projectName": "Project 1",
        "clientId": "admin1_id",
        "clientName": "Admin 1",
        "projectData": {
          "_id": "project1_id",
          "name": "Project 1",
          "isAccessible": true,
          "licenseStatus": "active"
        }
      },
      {
        "projectId": "project2_id",
        "projectName": "Project 2",
        "clientId": "admin2_id",
        "clientName": "Admin 2",
        "projectData": {
          "_id": "project2_id",
          "name": "Project 2",
          "isAccessible": false,
          "licenseStatus": "expired",
          "blockReason": "Client's license has expired. Contact client to renew."
        }
      }
    ]
  }
}
```

### Troubleshooting

#### Issue: All projects show "View Details" (no blocking)

**Possible causes:**
1. Cache not cleared - Clear Redis cache and retry
2. License value not set correctly - Check `license` field in Client collection
3. Backend not updated - Restart backend server

**Debug steps:**
```bash
# Check backend logs for license checking
# Look for these log messages:
# "🔐 Adding license status to staff projects..."
# "📋 License check result for..."
# "🚫 Project ... is BLOCKED - license: 0"
```

#### Issue: Projects not showing at all

**Possible causes:**
1. Staff not assigned to any projects
2. API error - Check backend logs
3. Frontend error - Check mobile app console

**Debug steps:**
```bash
# Check staff assignments
curl "http://localhost:8080/api/users/staff?id=STAFF_ID&getAllProjects=true"

# Check mobile app console for errors
# Look for: "❌ Error fetching staff data:"
```

#### Issue: Wrong block reason displayed

**Check:**
1. License value in database: `db.clients.findOne({ _id: ObjectId("client_id") })`
2. Backend logs for license check results
3. Frontend console for project data structure

### Test Checklist

- [ ] Staff user can see all assigned projects
- [ ] Projects from active license admins show "View Details"
- [ ] Projects from expired license admins show "Project Blocked"
- [ ] Block reason is displayed below blocked projects
- [ ] Clicking blocked project shows alert with reason
- [ ] Clicking active project opens details normally
- [ ] Admin users see all projects as accessible (no blocking)
- [ ] Cache is cleared before testing
- [ ] Backend logs show license checking for staff projects

### Success Criteria

✅ Staff can see all their projects in the list
✅ Blocked projects have red button with lock icon
✅ Active projects have blue "View Details" button
✅ Block reason provides clear feedback
✅ Staff is NOT blocked from entire app
✅ Only specific projects are blocked based on client license

## Additional Notes

- License values: `-1` = lifetime, `0` = expired, `>0` = active days
- Staff can work for multiple admins simultaneously
- Only projects from admins with expired licenses are blocked
- Projects remain visible with visual indicators (not filtered out)
- Cache expires after 24 hours automatically

# Testing License Access Control

Quick guide to test the license access control system.

## Prerequisites

- MongoDB access to update client license values
- Mobile app running on device/emulator
- Backend API running

## Test Scenarios

### Scenario 1: Expired License (Blocked)

**Setup:**
```javascript
// In MongoDB
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)
```

**Test Steps:**
1. Open mobile app
2. Login as admin@example.com
3. **Expected Result:**
   - ✅ Blocked screen appears immediately
   - ✅ Shows "License Expired" message
   - ✅ Shows lock icon and red theme
   - ✅ Contact support buttons visible
   - ✅ Cannot access any features
   - ✅ Logout button works

**API Test:**
```bash
curl -X GET "http://localhost:3000/api/project?clientId=CLIENT_ID"
```
**Expected Response:**
```json
{
  "success": false,
  "message": "License expired. Please contact support to renew.",
  "error": "LICENSE_EXPIRED",
  "license": 0
}
```
**Status Code:** 403

---

### Scenario 2: Active License (Allowed)

**Setup:**
```javascript
// In MongoDB
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 30, isLicenseActive: true } }
)
```

**Test Steps:**
1. Open mobile app
2. Login as admin@example.com
3. **Expected Result:**
   - ✅ App loads normally
   - ✅ Can access all features
   - ✅ Dashboard shows data
   - ✅ Projects are accessible
   - ✅ Profile shows "Active" status with 30 days

**API Test:**
```bash
curl -X GET "http://localhost:3000/api/project?clientId=CLIENT_ID"
```
**Expected Response:**
```json
{
  "success": true,
  "data": [...projects...],
  "message": "Retrieved X project(s) successfully"
}
```
**Status Code:** 200

---

### Scenario 3: Lifetime License (Never Blocked)

**Setup:**
```javascript
// In MongoDB
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: -1, isLicenseActive: true } }
)
```

**Test Steps:**
1. Open mobile app
2. Login as admin@example.com
3. **Expected Result:**
   - ✅ App loads normally
   - ✅ Profile shows "♾️ Lifetime" badge
   - ✅ Green border and shield icon
   - ✅ "🎉 Lifetime Access Activated!" message
   - ✅ Never gets blocked

**API Test:**
```bash
curl -X GET "http://localhost:3000/api/project?clientId=CLIENT_ID"
```
**Expected Response:**
```json
{
  "success": true,
  "data": [...projects...],
  "message": "Retrieved X project(s) successfully"
}
```
**Status Code:** 200

---

### Scenario 4: Staff User With Expired Client License (Blocked)

**Setup:**
```javascript
// Client (admin) has expired license
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)

// Staff user is assigned to this client
// staff.clientId = admin._id
```

**Test Steps:**
1. Open mobile app
2. Login as staff@example.com (staff user assigned to admin@example.com)
3. **Expected Result:**
   - ✅ Blocked screen appears
   - ✅ Shows "License Expired" message
   - ✅ Shows message: "Your assigned client's subscription has expired"
   - ✅ Shows notice: "Please contact your admin to resolve this issue"
   - ✅ NO support contact buttons (staff should contact admin)
   - ✅ Logout button works
   - ✅ Cannot access any features

**API Test:**
```bash
# Staff trying to access projects of expired client
curl -X GET "http://localhost:3000/api/project?clientId=EXPIRED_CLIENT_ID"
```
**Expected Response:**
```json
{
  "success": false,
  "message": "License expired. Please contact support to renew.",
  "error": "LICENSE_EXPIRED",
  "license": 0
}
```
**Status Code:** 403

---

### Scenario 5: Staff User With Active Client License (Allowed)

**Setup:**
```javascript
// Client (admin) has active license
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 30, isLicenseActive: true } }
)

// Staff user is assigned to this client
```

**Test Steps:**
1. Open mobile app
2. Login as staff@example.com
3. **Expected Result:**
   - ✅ App loads normally
   - ✅ Can access assigned projects
   - ✅ Full access to features
   - ✅ Works because client license is active

---

### Scenario 6: License Refresh

**Setup:**
```javascript
// Start with expired license
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)
```

**Test Steps:**
1. Open mobile app
2. Login as admin@example.com
3. See blocked screen
4. **Update license in database:**
   ```javascript
   db.clients.updateOne(
     { email: "admin@example.com" },
     { $set: { license: 30, isLicenseActive: true } }
   )
   ```
5. Click "Check Again" button on blocked screen
6. **Expected Result:**
   - ✅ License check runs again
   - ✅ App loads normally
   - ✅ Access granted

---

### Scenario 7: API Without clientId

**Test:**
```bash
curl -X GET "http://localhost:3000/api/project"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Client ID is required for license verification",
  "error": "MISSING_CLIENT_ID"
}
```
**Status Code:** 400

---

### Scenario 8: API With Invalid clientId

**Test:**
```bash
curl -X GET "http://localhost:3000/api/project?clientId=invalid_id"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Client not found",
  "error": "LICENSE_EXPIRED"
}
```
**Status Code:** 403

---

## Quick Test Commands

### MongoDB Commands

```javascript
// Expire license
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 0, isLicenseActive: false } }
)

// Activate license (30 days)
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: 30, isLicenseActive: true } }
)

// Lifetime license
db.clients.updateOne(
  { email: "admin@example.com" },
  { $set: { license: -1, isLicenseActive: true } }
)

// Check current license
db.clients.findOne(
  { email: "admin@example.com" },
  { license: 1, isLicenseActive: 1, licenseExpiryDate: 1 }
)
```

### API Test Commands

```bash
# Replace CLIENT_ID with actual client ID

# Test projects API
curl -X GET "http://localhost:3000/api/project?clientId=CLIENT_ID"

# Test labor API
curl -X GET "http://localhost:3000/api/labor?clientId=CLIENT_ID"

# Test equipment API
curl -X GET "http://localhost:3000/api/equipment?clientId=CLIENT_ID"
```

## Checklist

Use this checklist to verify all features:

### Frontend (Mobile App)
- [ ] Expired license shows blocked screen (admin)
- [ ] Expired license shows blocked screen (staff)
- [ ] Staff blocked screen shows different message
- [ ] Staff blocked screen has no support buttons
- [ ] Active license allows access (admin)
- [ ] Active license allows access (staff)
- [ ] Lifetime license shows special badge
- [ ] Staff users blocked when client license expires
- [ ] Blocked screen shows lock icon
- [ ] Contact support buttons work (admin only)
- [ ] Logout button works
- [ ] Retry button works
- [ ] License status displays correctly

### Backend (API)
- [ ] Expired license returns 403
- [ ] Active license returns 200
- [ ] Lifetime license returns 200
- [ ] Missing clientId returns 400
- [ ] Invalid clientId returns 403
- [ ] Error messages are clear
- [ ] All protected routes work

### Edge Cases
- [ ] License changes reflect immediately on retry
- [ ] Staff users blocked when client license expires
- [ ] Staff can access when client license is active
- [ ] Multiple simultaneous requests handled
- [ ] Cache doesn't interfere with license check

## Troubleshooting

### Issue: Blocked screen doesn't appear

**Check:**
1. Is `LicenseGuard` wrapping the tabs in `_layout.tsx`?
2. Is `useLicenseCheck` hook working?
3. Check console logs for errors
4. Verify `skipCache=true` is used in API call

### Issue: API still allows access with expired license

**Check:**
1. Is `withLicenseCheck` wrapping the route handler?
2. Is `clientId` being passed in request?
3. Check middleware logs
4. Verify license value in database

### Issue: Staff users are NOT blocked when client license expires

**Check:**
1. Is staff user's `clientId` field set correctly?
2. Check `useLicenseCheck` hook - it should check `userData.clientId` for staff
3. Verify client license value in database
4. Check console logs for which clientId is being checked

## Success Criteria

All tests pass when:
- ✅ Expired admins are completely blocked (UI + API)
- ✅ Expired client's staff are also blocked (UI + API)
- ✅ Active admins have full access
- ✅ Active client's staff have full access
- ✅ Lifetime admins never get blocked
- ✅ Lifetime client's staff never get blocked
- ✅ API returns proper error codes
- ✅ UI shows clear messages (different for admin vs staff)
- ✅ Retry/refresh works correctly
- ✅ Staff see appropriate message (contact admin, not support)

## Notes

- Always use `skipCache=true` when checking license to get fresh data
- License checks happen on app load and can be manually triggered
- **Staff users are now subject to license checks** - they check their assigned client's license
- If admin's license expires, all their staff are also blocked
- Staff should contact their admin, not support, when blocked
- Lifetime license (-1) is treated as unlimited access for both admin and staff

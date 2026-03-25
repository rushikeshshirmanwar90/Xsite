# Staff License Control Update

## Problem Statement

Previously, staff users could access projects even when the admin's (client's) license was expired. This was incorrect because:
- Admin owns the license
- Staff are assigned by admin
- If admin doesn't pay, staff shouldn't have access either

## Solution

Updated the license access control system to enforce proper hierarchy:

```
Admin (owns license: expired)
  ├── Staff 1 → BLOCKED ❌
  ├── Staff 2 → BLOCKED ❌
  └── Staff 3 → BLOCKED ❌
```

## Changes Made

### 1. Frontend - License Check Hook (`useLicenseCheck.ts`)

**Before:**
```typescript
// Staff users always have access
if (userData.role && userData.role !== 'admin') {
  return { hasAccess: true };  // Always allow
}
```

**After:**
```typescript
// Staff users check their assigned client's license
const clientId = userData.role !== 'admin' 
  ? userData.clientId  // Staff: check assigned client
  : userData._id;      // Admin: check own license

// Both admin and staff are subject to license check
```

### 2. Frontend - License Guard Component (`LicenseGuard.tsx`)

**Added:**
- Different messages for admin vs staff
- Admin sees: "Your subscription has expired. Please contact support..."
- Staff sees: "Your assigned client's subscription has expired. Please contact your admin..."
- Admin gets support contact buttons
- Staff gets notice to contact admin (no support buttons)

**Implementation:**
```typescript
const isStaff = userRole && userRole !== 'admin';

// Different message based on user type
{isStaff 
  ? "Your assigned client's subscription has expired. Please contact your admin..."
  : "Your subscription has expired. Please contact support..."
}

// Different actions based on user type
{!isStaff && (
  // Show support contact buttons for admin
)}

{isStaff && (
  // Show notice to contact admin for staff
)}
```

### 3. Backend - Middleware (`licenseCheck.ts`)

**Updated:**
- Added comment clarifying staff are also checked
- No code changes needed - middleware already checks the clientId passed

### 4. Documentation

**Updated files:**
- `LICENSE_ACCESS_CONTROL.md` - Updated staff section
- `LICENSE_IMPLEMENTATION_COMPLETE.md` - Updated flows and summary
- `TESTING_LICENSE_CONTROL.md` - Updated test scenarios
- Created `STAFF_LICENSE_UPDATE.md` - This file

## How It Works Now

### For Admin Users:
1. Admin logs in
2. System checks admin's own license (`userData._id`)
3. If expired → Admin is blocked
4. Admin sees support contact options

### For Staff Users:
1. Staff logs in
2. System checks assigned client's license (`userData.clientId`)
3. If client's license expired → Staff is blocked
4. Staff sees notice to contact admin

## Testing

### Test Scenario: Expired Client with Staff

**Setup:**
```javascript
// Expire the admin's license
db.clients.updateOne(
  { email: "admin@example.com", _id: "ADMIN_ID" },
  { $set: { license: 0, isLicenseActive: false } }
)

// Staff user assigned to this admin
db.staff.findOne({ email: "staff@example.com" })
// Should have: clientId: "ADMIN_ID"
```

**Test:**
1. Login as staff@example.com
2. **Expected Result:**
   - ✅ Blocked screen appears
   - ✅ Message: "Your assigned client's subscription has expired"
   - ✅ Notice: "Please contact your admin to resolve this issue"
   - ✅ No support contact buttons
   - ✅ Cannot access any projects

**API Test:**
```bash
curl -X GET "http://localhost:3000/api/project?clientId=ADMIN_ID"
```
**Expected:** 403 Forbidden

## Benefits

1. ✅ **Proper License Enforcement**: Admin doesn't pay → Entire team blocked
2. ✅ **Clear Communication**: Staff know to contact admin, not support
3. ✅ **Revenue Protection**: Can't bypass license by using staff accounts
4. ✅ **Hierarchical Control**: Admin owns license → Staff depend on admin
5. ✅ **Better UX**: Different messages for different user types

## Migration Notes

### For Existing Deployments:

1. **No database changes needed** - Staff already have `clientId` field
2. **Update mobile app** - Deploy new version with updated hook and component
3. **Backend already compatible** - Middleware already checks clientId
4. **Test thoroughly** - Verify staff are blocked when client license expires

### For Staff Users:

- Staff will now be blocked if their assigned client's license expires
- Staff should contact their admin to renew license
- Staff cannot contact support directly (admin owns the account)

## Code Files Changed

1. `Xsite/hooks/useLicenseCheck.ts` - Removed staff bypass, check clientId
2. `Xsite/components/LicenseGuard.tsx` - Different UI for staff vs admin
3. `real-estate-apis/lib/middleware/licenseCheck.ts` - Updated comment
4. `Xsite/LICENSE_ACCESS_CONTROL.md` - Updated documentation
5. `Xsite/LICENSE_IMPLEMENTATION_COMPLETE.md` - Updated documentation
6. `Xsite/TESTING_LICENSE_CONTROL.md` - Updated test scenarios

## Summary

Staff users are now properly subject to license checks based on their assigned client's license. If the admin's license expires, both the admin and all their staff are blocked from accessing the application.

This enforces the proper business model where:
- Admin pays for the license
- Staff work under the admin's account
- No license = No access for anyone (admin + staff)

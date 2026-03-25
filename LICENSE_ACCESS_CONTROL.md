# License Access Control System

## Overview

Complete license-based access control system that blocks expired users from accessing the application and its data.

## Features

### 1. **Frontend Protection (Mobile App)**
- ✅ Automatic license check on app load
- ✅ Full-screen block for expired licenses
- ✅ Real-time license verification
- ✅ Staff users bypass (they depend on assigned clients)
- ✅ Graceful error handling

### 2. **Backend Protection (API)**
- ✅ Middleware for API route protection
- ✅ License verification before data access
- ✅ 403 Forbidden for expired licenses
- ✅ Detailed error messages

### 3. **User Experience**
- ✅ Beautiful blocked screen with clear messaging
- ✅ Contact support buttons (email & phone)
- ✅ License status display
- ✅ Logout option
- ✅ Retry/refresh capability

## How It Works

### Architecture

The application has a hierarchical structure:
- **Admin**: Owns the license and manages the account
- **Staff**: Added by admin and assigned to projects
- **License Rule**: If admin's license expires, both admin AND staff are blocked

### License Values
- **`-1`**: Lifetime access (never blocked)
- **`0`**: Expired (blocked)
- **`> 0`**: Active with N days (allowed)

### Access Logic
```typescript
// Both Admin and Staff check the client's license
const clientId = userData.role !== 'admin' 
  ? userData.clientId  // Staff: check assigned client
  : userData._id;      // Admin: check own license

if (license === -1) {
  return { hasAccess: true }  // Lifetime - always allowed
}

if (license === 0) {
  return { hasAccess: false }  // Expired - blocked (admin AND staff)
}

if (license > 0 && isLicenseActive) {
  return { hasAccess: true }  // Active - allowed (admin AND staff)
}

return { hasAccess: false }  // Default - blocked
```

## Implementation

### 1. License Check Hook

**File**: `Xsite/hooks/useLicenseCheck.ts`

Automatically checks license status:
- Fetches client data with `skipCache=true`
- Determines access based on license value
- Handles staff users (always allowed)
- Provides recheck function

**Usage:**
```typescript
const { hasAccess, license, loading, recheckLicense } = useLicenseCheck();
```

### 2. License Guard Component

**File**: `Xsite/components/LicenseGuard.tsx`

Wraps the entire app to enforce license:
- Shows loading state while checking
- Displays blocked screen if expired
- Renders children if license valid

**Features:**
- 🔒 Lock icon with red theme
- 📧 Contact support button (email)
- 📞 Call support button (phone)
- 🚪 Logout button
- 🔄 Refresh/retry button
- 📊 License status display

### 3. Protected Layout

**File**: `Xsite/app/(tabs)/_layout.tsx`

Wraps all tabs with LicenseGuard:
```tsx
<LicenseGuard>
  <Tabs>
    {/* All tabs */}
  </Tabs>
</LicenseGuard>
```

### 4. Backend Middleware

**File**: `real-estate-apis/lib/middleware/licenseCheck.ts`

Protects API routes from expired clients:

**Functions:**
- `checkLicense(clientId)` - Verify license status
- `withLicenseCheck(handler)` - Wrap API routes

**Usage:**
```typescript
import { withLicenseCheck } from "@/lib/middleware/licenseCheck";

export const GET = withLicenseCheck(async (req: NextRequest) => {
  // Your API logic here
  // Only executes if license is valid
});
```

## User Flow

### Expired License Flow

1. **Admin or Staff opens app**
2. **LicenseGuard checks license**
   - Admin: Checks their own license
   - Staff: Checks their assigned client's license
3. **License is expired (0)**
4. **Blocked screen appears:**
   - 🔒 Lock icon with red theme
   - "License Expired" title
   - Explanation message (different for admin vs staff)
   - License status card
   - **For Admin**: Contact support buttons (email & phone)
   - **For Staff**: Notice to contact admin
   - Logout option

5. **User cannot access:**
   - ❌ Home screen
   - ❌ Dashboard
   - ❌ Projects
   - ❌ Staff management
   - ❌ Any data

6. **User can:**
   - ✅ View blocked screen
   - ✅ See license status
   - ✅ Contact support (admin) or admin (staff)
   - ✅ Logout
   - ✅ Retry license check

### Active License Flow

1. **User opens app**
2. **LicenseGuard checks license**
3. **License is active (>0 or -1)**
4. **App loads normally**
5. **User has full access**

## Blocked Screen UI

```
┌─────────────────────────────────┐
│                                 │
│         🔒 (Red Circle)         │
│                                 │
│      License Expired            │
│                                 │
│  Your subscription has expired. │
│  Please contact support to      │
│  renew your license.            │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📅 License Status: Expired│ │
│  │ ⏰ Days Remaining: 0      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📧 Contact Support        │ │ ← Opens email
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📞 Call Support           │ │ ← Opens phone
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🚪 Logout                 │ │ ← Logs out
│  └───────────────────────────┘ │
│                                 │
│         🔄 Check Again          │ ← Retry
│                                 │
└─────────────────────────────────┘
```

## API Protection

### How It Works

The `withLicenseCheck` middleware wraps API route handlers to verify license status before allowing access:

1. **Extract clientId** from query params or request body
2. **Verify license** by checking database
3. **Block if expired** with 403 Forbidden response
4. **Allow if valid** and proceed to handler

### Protected Routes

All critical data routes are now protected:

```typescript
// Example: Protected project route
import { withLicenseCheck } from "@/lib/middleware/licenseCheck";

export const GET = withLicenseCheck(async (req: NextRequest) => {
  // Only executes if license is valid
  const projects = await Projects.find({ clientId });
  return successResponse(projects);
});
```

### Protect a Route

**Before (unprotected):**
```typescript
export const GET = async (req: NextRequest) => {
  // Anyone can access
  const projects = await Project.find();
  return NextResponse.json({ data: projects });
};
```

**After (protected):**
```typescript
import { withLicenseCheck } from "@/lib/middleware/licenseCheck";

export const GET = withLicenseCheck(async (req: NextRequest) => {
  // Only valid license holders can access
  const projects = await Project.find();
  return NextResponse.json({ data: projects });
});
```

### API Response for Expired License

```json
{
  "success": false,
  "message": "License expired. Please contact support to renew.",
  "error": "LICENSE_EXPIRED",
  "license": 0
}
```

**Status Code**: `403 Forbidden`

## Routes to Protect

### Critical Routes (Protected ✅):
- ✅ `/api/project` - Project data (GET, POST, PATCH)
- ✅ `/api/labor` - Labor data (GET, POST, PUT, DELETE)
- ✅ `/api/equipment` - Equipment data (GET, POST, PUT, DELETE)

### Allow Without License:
- ✅ `/api/auth/login` - Login
- ✅ `/api/auth/logout` - Logout
- ✅ `/api/clients` - Client info (needed for license check)
- ✅ `/api/license` - License management

## Staff Users

**IMPORTANT CHANGE**: Staff users are now also subject to license checks!

### How It Works:
- Staff users are assigned to a client (admin)
- When staff tries to access the app, the system checks their assigned client's license
- If the client's license is expired, staff is also blocked

### Why This Change:
- Admin owns the license
- Staff work under the admin's account
- If admin doesn't pay, staff shouldn't have access either
- This enforces proper license compliance

### Staff Blocked Screen:
When a staff user's assigned client has an expired license:
- Shows "License Expired" message
- Explains: "Your assigned client's subscription has expired"
- Shows notice: "Please contact your admin to resolve this issue"
- No support contact buttons (staff should contact their admin, not support)
- Logout option available

### Detection:
```typescript
// Staff user detection
const isStaff = userData.role && userData.role !== 'admin';

// Get client ID to check
const clientId = isStaff 
  ? userData.clientId  // Staff: check assigned client's license
  : userData._id;      // Admin: check own license
```

## Testing

### Test Expired License

1. **Set license to 0:**
   ```javascript
   db.clients.updateOne(
     { email: "test@example.com" },
     { $set: { license: 0, isLicenseActive: false } }
   )
   ```

2. **Login as that client**
3. **Should see blocked screen**
4. **Cannot access any data**

### Test Active License

1. **Set license to 30:**
   ```javascript
   db.clients.updateOne(
     { email: "test@example.com" },
     { $set: { license: 30, isLicenseActive: true } }
   )
   ```

2. **Login as that client**
3. **Should access app normally**
4. **Can view all data**

### Test Lifetime License

1. **Set license to -1:**
   ```javascript
   db.clients.updateOne(
     { email: "test@example.com" },
     { $set: { license: -1, isLicenseActive: true } }
   )
   ```

2. **Login as that client**
3. **Should access app normally**
4. **Never gets blocked**

### Test API Protection

```bash
# Expired license (should return 403)
curl -X GET "http://localhost:3000/api/projects?clientId=EXPIRED_CLIENT_ID"

# Response:
# {
#   "success": false,
#   "message": "License expired. Please contact support to renew.",
#   "error": "LICENSE_EXPIRED",
#   "license": 0
# }
```

## Configuration

### Update Support Contact Info

**File**: `Xsite/components/LicenseGuard.tsx`

```typescript
// Email support
Linking.openURL('mailto:support@yourcompany.com?subject=License Renewal Request');

// Phone support
Linking.openURL('tel:+1234567890');
```

### Customize Blocked Screen

Edit `LicenseGuard.tsx`:
- Change colors
- Update messages
- Add/remove buttons
- Modify layout

## Benefits

1. **Security**: Prevents unauthorized access
2. **Revenue Protection**: Enforces subscription model
3. **Clear Communication**: Users know why they're blocked
4. **Easy Resolution**: Direct contact options
5. **Graceful Degradation**: Beautiful error screen
6. **Staff Friendly**: Doesn't block staff users
7. **API Protection**: Backend also enforces license

## Summary

The license access control system:
- ✅ Blocks expired users from app
- ✅ Blocks expired users from API
- ✅ Shows beautiful blocked screen
- ✅ Provides contact options
- ✅ Allows staff users
- ✅ Respects lifetime licenses
- ✅ Real-time verification
- ✅ Easy to implement
- ✅ Comprehensive protection

Users with `license: 0` are completely blocked from accessing the application and its data! 🔒

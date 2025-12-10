# Role-Based Access Control Implementation

## Overview

Implemented role-based access control (RBAC) to restrict certain actions to admin users only. Staff users can now only view data and cannot perform create/update operations.

## Changes Made

### 1. **Add Project Page** (`app/(tabs)/add-project.tsx`)

- **Added**: User role checking using `useUser()` hook and `isAdmin()` helper
- **Restricted**: "Add New Project" button - only visible to admins
- **Added**: Subtitle message for staff users: "View Only - Contact admin to add projects"
- **Updated**: Empty state message to show different text for staff vs admin

**Admin View:**

- ✅ Can see "Add New Project" button
- ✅ Can create new projects
- ✅ Empty state: "Tap 'Add New Project' to get started"

**Staff View:**

- ❌ Cannot see "Add New Project" button
- ❌ Cannot create projects
- ℹ️ Shows: "View Only - Contact admin to add projects"
- ℹ️ Empty state: "No projects available. Contact your admin to add projects."

---

### 2. **Home Page** (`app/(tabs)/index.tsx`)

- **Added**: User role checking using `useUser()` hook and `isAdmin()` helper
- **Updated**: Empty state message to show different text for staff vs admin

**Admin View:**

- ℹ️ Empty state: "Tap 'Add Project' to create your first project"

**Staff View:**

- ℹ️ Empty state: "No projects available. Contact your admin to add projects."

---

### 3. **Details Page** (`app/details.tsx`)

- **No Restrictions**: Material management is available to all users
- **Reason**: Both admin and staff need to add and use materials in their daily work

**All Users (Admin & Staff):**

- ✅ Can see "Add Material" button
- ✅ Can see "Add Usage" button
- ✅ Can import materials
- ✅ Can use materials
- ✅ Full access to material management features

**Note:** Material management is a core operational function that all users need access to for day-to-day project work.

---

## User Role Detection

The system uses the existing `useUser` hook from `hooks/useUser.ts` which provides:

### User Types:

1. **Admin** - Full access (create, read, update, delete)
2. **Staff** - Read-only access (view only)
3. **Customer** - Customer-specific access

### Helper Functions:

- `isAdmin(user)` - Returns true if user is admin
- `isStaff(user)` - Returns true if user is staff
- `isCustomer(user)` - Returns true if user is customer

### Detection Logic:

```typescript
// Admin: Has clientId but no 'role' or 'verified' fields
if ("clientId" in user && !("role" in user) && !("verified" in user)) {
  return "admin";
}

// Staff: Has 'role' field
if ("role" in user) {
  return "staff";
}

// Customer: Has 'verified' field
if ("verified" in user) {
  return "user";
}
```

---

## Implementation Details

### Import Statement:

```typescript
import { isAdmin, useUser } from "@/hooks/useUser";
```

### Usage in Component:

```typescript
const { user } = useUser();
const userIsAdmin = isAdmin(user);
```

### Conditional Rendering:

```typescript
{
  userIsAdmin && (
    <TouchableOpacity onPress={handleAction}>
      <Text>Admin Only Action</Text>
    </TouchableOpacity>
  );
}

{
  !userIsAdmin && (
    <View>
      <Text>View Only - Contact admin</Text>
    </View>
  );
}
```

---

## Testing

### Test as Admin:

1. Login as admin user
2. Navigate to "Add Project" tab
3. ✅ Should see "Add New Project" button
4. ✅ Should be able to create projects
5. Navigate to project details
6. ✅ Should see "Add Material" and "Add Usage" buttons

### Test as Staff:

1. Login as staff user
2. Navigate to "Add Project" tab
3. ❌ Should NOT see "Add New Project" button
4. ℹ️ Should see "View Only" message
5. Navigate to project details
6. ❌ Should NOT see "Add Material" and "Add Usage" buttons
7. ℹ️ Should see view-only banner

---

### 4. **Staff Management Page** (`app/(tabs)/staff.tsx`)

- **Added**: User role checking using `useUser()` hook and `isAdmin()` helper
- **Restricted**: "Add New Staff Member" button - only visible to admins
- **Added**: View-only banner for staff users
- **Updated**: UI redesign for cleaner, less congested layout

**Admin View:**

- ✅ Can see "Add New Staff Member" button (full width, prominent)
- ✅ Can add new staff members
- ✅ Clean, spacious layout with better visual hierarchy

**Staff View:**

- ❌ Cannot see "Add New Staff Member" button
- ❌ Cannot add staff members
- ℹ️ Shows banner: "View Only - Contact admin to add staff"
- ✅ Can search and view existing staff

**UI Improvements:**

- 📐 Full-width "Add Staff" button with gradient and shadow
- 🔍 Improved search bar with better spacing and styling
- 📱 Cleaner header layout with better typography
- 🎨 Consistent design language matching other pages
- ✨ Better visual hierarchy and reduced congestion

---

## Future Enhancements

Potential areas for additional role-based restrictions:

1. ❌ Edit project details
2. ❌ Delete projects
3. ❌ Add/remove staff members
4. ❌ Edit material specifications
5. ❌ Delete materials
6. ❌ Modify sections/mini-sections
7. ✅ View analytics (currently allowed for all)
8. ✅ View notifications (currently allowed for all)

---

## Files Modified

1. `app/(tabs)/add-project.tsx` - Added role check and conditional rendering
2. `app/(tabs)/index.tsx` - Updated empty state messages
3. `app/details.tsx` - Added role check, conditional buttons, and view-only banner
4. `app/(tabs)/staff.tsx` - Added role check and admin validation for adding staff
5. `components/staff/StaffHeader.tsx` - Complete UI redesign with role-based rendering

## Files Used (No Changes)

1. `hooks/useUser.ts` - Existing role detection system
2. `hooks/useUser.example.tsx` - Example usage documentation

---

## Summary

### Access Control by Feature:

**Projects:**

- ✅ **Admins**: Can create, view, and manage projects
- ❌ **Staff**: Can only view projects (cannot create)

**Staff Management:**

- ✅ **Admins**: Can add and manage staff members
- ❌ **Staff**: Can only view staff list (cannot add)

**Materials & Usage:**

- ✅ **Admins**: Full access to add and use materials
- ✅ **Staff**: Full access to add and use materials
- ℹ️ **Note**: Material management is available to all users as it's a core operational function

### Key Points:

- 🔒 Role-based access control is enforced at the UI level
- ℹ️ Clear messaging informs staff users about their restrictions
- 🎯 Material operations are unrestricted for operational efficiency

**Note**: For production, ensure backend APIs also enforce role-based permissions to prevent unauthorized access via API calls.

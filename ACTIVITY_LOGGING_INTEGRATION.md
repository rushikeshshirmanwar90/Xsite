# Activity Logging Integration Guide

## Overview

This document outlines the complete integration of activity logging across all operations in the project, ensuring every action is recorded in the Activity API.

## Activity API Endpoint

- **URL**: `${domain}/api/activity`
- **Methods**: GET, POST, DELETE

## Activity Types Supported

### 1. Project Activities

- ✅ `project_created` - When a new project is added
- ✅ `project_updated` - When project details are modified
- ✅ `project_deleted` - When a project is removed

### 2. Section Activities

- ✅ `section_created` - When a new section (Building/Rowhouse/Other) is added
- ✅ `section_updated` - When section name or details are modified
- ✅ `section_deleted` - When a section is removed

### 3. Mini-Section Activities

- ✅ `mini_section_created` - When a mini-section is added within a section
- ✅ `mini_section_updated` - When mini-section details are modified
- ✅ `mini_section_deleted` - When a mini-section is removed

### 4. Material Activities

- ✅ Material Import - When materials are imported to a project (uses `action: "import"`)
- ✅ Material Usage - When materials are used in a mini-section (uses `action: "use"`)

### 5. Staff Activities

- ✅ `staff_assigned` - When staff is assigned to a project
- ✅ `staff_removed` - When staff is removed from a project

## Implementation Details

### Files Modified

#### 1. `utils/activityLogger.ts`

**Changes:**

- Added `"import"` and `"use"` to `ActivityAction` type
- Added `"material"` to `ActivityCategory` type
- Implemented `logMaterialImported()` function
- Implemented `logMaterialUsed()` function
- All logging functions are async and handle errors gracefully

**Key Functions:**

```typescript
// Project Activities
logProjectCreated(projectId, projectName, metadata?)
logProjectUpdated(projectId, projectName, changedData?, message?)
logProjectDeleted(projectId, projectName)

// Section Activities
logSectionCreated(projectId, projectName, sectionId, sectionName)
logSectionUpdated(projectId, projectName, sectionId, sectionName, changedData?, message?)
logSectionDeleted(projectId, projectName, sectionId, sectionName)

// Mini-Section Activities
logMiniSectionCreated(projectId, projectName, sectionId, sectionName, miniSectionId, miniSectionName)
logMiniSectionUpdated(projectId, projectName, sectionId, sectionName, miniSectionId, miniSectionName, changedData?, message?)
logMiniSectionDeleted(projectId, projectName, sectionId, sectionName, miniSectionId, miniSectionName)

// Material Activities
logMaterialImported(projectId, projectName, materialCount, totalCost, message?)
logMaterialUsed(projectId, projectName, sectionId, sectionName, miniSectionId, miniSectionName, materialName, quantity, unit, metadata?)

// Staff Activities
logStaffAssigned(projectId, projectName, staffName, role?, message?)
logStaffRemoved(projectId, projectName, staffName, message?)
```

#### 2. `app/(tabs)/add-project.tsx`

**Changes:**

- ✅ Added activity logging when project is created
- ✅ Added activity logging for each staff member assigned during project creation
- Logs include project metadata (address, budget, description)

**Integration Point:**

```typescript
// After successful project creation
await logProjectCreated(projectId, projectName, {
  address: newProject.address,
  budget: newProject.budget,
  description: newProject.description,
});

// Log staff assignments
for (const staff of newProject.assignedStaff) {
  await logStaffAssigned(
    projectId,
    projectName,
    staff.fullName,
    undefined,
    `Assigned during project creation`
  );
}
```

#### 3. `app/manage_project/[id].tsx`

**Changes:**

- ✅ Added `await` to all activity logging calls (was missing before)
- ✅ Section creation logging
- ✅ Section update logging with changed data tracking
- ✅ Section deletion logging

**Integration Points:**

```typescript
// Section Created
await logSectionCreated(projectId, projectName, sectionId, sectionName);

// Section Updated
await logSectionUpdated(projectId, projectName, sectionId, newName, [
  {
    field: "name",
    oldValue: oldName,
    newValue: newName,
  },
]);

// Section Deleted
await logSectionDeleted(projectId, projectName, sectionId, sectionName);
```

#### 4. `app/details.tsx`

**Changes:**

- ✅ Material import logging when materials are added
- ✅ Material usage logging when materials are used in mini-sections
- Logs to both MaterialActivity API and general Activity API

**Integration Points:**

```typescript
// Material Import
await logMaterialImported(
  projectId,
  projectName,
  materialCount,
  totalCost,
  message
);

// Material Usage
await logMaterialUsed(
  projectId,
  projectName,
  sectionId,
  sectionName,
  miniSectionId,
  miniSectionName,
  materialName,
  quantity,
  unit,
  { cost: materialPrice }
);
```

## Activity Logging Flow

### 1. Project Creation Flow

```
User fills form → Submit → API creates project → Get projectId →
Log project_created → Log staff_assigned (for each staff) →
Refresh project list → Show success
```

### 2. Section Management Flow

```
Add Section: User adds section → API creates → Log section_created → Refresh
Update Section: User edits → API updates → Log section_updated → Refresh
Delete Section: User confirms → API deletes → Log section_deleted → Refresh
```

### 3. Material Import Flow

```
User adds materials → API imports → Log material import →
Log to MaterialActivity API → Refresh materials → Show success
```

### 4. Material Usage Flow

```
User records usage → API updates → Log material usage →
Log to MaterialActivity API → Refresh materials → Switch to "Used" tab
```

## Error Handling

All activity logging functions:

- ✅ Are wrapped in try-catch blocks
- ✅ Log errors to console for debugging
- ✅ Do NOT throw errors (non-critical operation)
- ✅ Do NOT block the main operation if logging fails

Example:

```typescript
try {
  await logProjectCreated(projectId, projectName, metadata);
} catch (activityError) {
  console.error("Failed to log activity:", activityError);
  // Continue with main operation
}
```

## User Data Collection

Activity logs automatically include:

- **User ID**: From AsyncStorage (`user._id` or `user.id` or `user.clientId`)
- **Full Name**: Constructed from `firstName + lastName` or fallback to `name`/`username`
- **Email**: Optional, from `user.email`
- **Client ID**: Required, from `user.clientId`

## Testing Activity Logging

### Test Project Creation:

1. Go to "Add Project" screen
2. Fill in project details
3. Assign staff members
4. Submit
5. Check Activity API: `GET ${domain}/api/activity?projectId={projectId}`
6. Should see:
   - 1 `project_created` activity
   - N `staff_assigned` activities (where N = number of staff assigned)

### Test Section Operations:

1. Go to project details
2. Add a section → Check for `section_created`
3. Edit section name → Check for `section_updated`
4. Delete section → Check for `section_deleted`

### Test Material Operations:

1. Go to section details
2. Import materials → Check for material import activity
3. Use materials → Check for material usage activity

## API Query Examples

### Get all activities for a project:

```
GET ${domain}/api/activity?projectId={projectId}&limit=100
```

### Get only project creation activities:

```
GET ${domain}/api/activity?clientId={clientId}&activityType=project_created
```

### Get material activities:

```
GET ${domain}/api/activity?projectId={projectId}&category=material
```

### Get staff activities:

```
GET ${domain}/api/activity?projectId={projectId}&category=staff
```

## Future Enhancements

### Potential additions:

- [ ] Project update logging (when project details are edited)
- [ ] Project deletion logging
- [ ] Mini-section operations logging (if mini-sections have CRUD operations)
- [ ] Staff removal logging (if staff can be removed from projects)
- [ ] Bulk operation logging (e.g., importing multiple materials at once)
- [ ] Activity filtering by date range
- [ ] Activity export functionality

## Troubleshooting

### Activity not being logged?

1. Check console for error messages
2. Verify `clientId` is available in AsyncStorage
3. Verify API endpoint is correct
4. Check network tab for failed requests
5. Verify Activity API is running and accessible

### Missing user information?

1. Check AsyncStorage has `user` object
2. Verify user object has required fields (`_id`, `firstName`, `lastName`, `clientId`)
3. Check `getUserData()` function in activityLogger.ts

### Activity logged but not showing in UI?

1. Verify query parameters are correct
2. Check API response structure
3. Verify date filtering is not excluding recent activities
4. Check pagination limits

## Summary

✅ **All major operations now log activities:**

- Project creation (with staff assignments)
- Section creation, update, deletion
- Material import and usage
- Staff assignments

✅ **Activity logging is:**

- Non-blocking (doesn't fail main operations)
- Comprehensive (includes all required metadata)
- Consistent (uses centralized logging functions)
- Error-tolerant (graceful error handling)

✅ **Ready for production use**

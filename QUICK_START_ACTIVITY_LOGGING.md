# Quick Start: Activity Logging

## What Was Done

I've integrated comprehensive activity logging across your entire project. Now **every operation** is automatically recorded to the Activity API.

## What's Logged Now

### ✅ Project Operations

- **Creating a project** → Logs `project_created` + staff assignments
- **Updating a project** → Logs `project_updated` with changed fields
- **Deleting a project** → Logs `project_deleted`

### ✅ Section Operations

- **Adding a section** → Logs `section_created`
- **Editing section name** → Logs `section_updated` with old/new values
- **Deleting a section** → Logs `section_deleted`

### ✅ Material Operations

- **Importing materials** → Logs material import with count and cost
- **Using materials** → Logs material usage with quantity and location

### ✅ Staff Operations

- **Assigning staff** → Logs `staff_assigned` when staff is added to project

## Files Modified

1. **`utils/activityLogger.ts`** - Added material logging functions
2. **`app/(tabs)/add-project.tsx`** - Logs project creation + staff assignments
3. **`app/manage_project/[id].tsx`** - Logs section create/update/delete
4. **`app/details.tsx`** - Logs material import and usage

## How to Use

### Import the logger:

```typescript
import {
  logProjectCreated,
  logSectionCreated,
  logMaterialImported,
  logStaffAssigned,
} from "@/utils/activityLogger";
```

### Log an activity:

```typescript
// After creating a project
await logProjectCreated(projectId, projectName, {
  address: project.address,
  budget: project.budget,
});

// After adding a section
await logSectionCreated(projectId, projectName, sectionId, sectionName);

// After importing materials
await logMaterialImported(projectId, projectName, materialCount, totalCost);
```

## View Activities

### Get all activities for a project:

```typescript
const response = await axios.get(
  `${domain}/api/activity?projectId=${projectId}&limit=50`
);
```

### Filter by type:

```typescript
// Get only material activities
const response = await axios.get(
  `${domain}/api/activity?projectId=${projectId}&category=material`
);
```

## Test It

Run the test script:

```bash
npx ts-node scripts/testActivityAPI.ts
```

This will:

- Create test activities for all types
- Verify the API is working
- Show you example responses

## What Happens When You Add a Project

1. User fills form and submits
2. API creates project → Returns project ID
3. **Logs `project_created` activity** ✅
4. **Logs `staff_assigned` for each staff member** ✅
5. Refreshes project list
6. Shows success message

## Error Handling

Activity logging **never fails your operations**:

- If logging fails, it logs to console but continues
- Your users won't see errors from activity logging
- The main operation (create/update/delete) always completes

## Next Steps

1. ✅ Activity logging is working
2. Test by creating a project
3. Check the Activity API to see the logs
4. Build a UI to display activities (optional)

## Need Help?

Check `ACTIVITY_LOGGING_INTEGRATION.md` for detailed documentation.

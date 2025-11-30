# Activity Logging Integration Guide

This guide shows you how to integrate activity logging throughout your application.

## Overview

The activity logging system tracks all user actions and stores them in the database. Activities are displayed in the notification page (`app/notification.tsx`).

## Setup

The activity logger is located at `utils/activityLogger.ts` and provides functions for logging different types of activities.

## Usage Examples

### 1. Project Activities

#### Creating a Project

```typescript
import { logProjectCreated } from "@/utils/activityLogger";

// After successfully creating a project
await logProjectCreated(
  projectId,
  projectName,
  { budget: 1000000, location: "Mumbai" } // Optional metadata
);
```

#### Updating a Project

```typescript
import { logProjectUpdated } from "@/utils/activityLogger";

// After updating project details
await logProjectUpdated(
  projectId,
  projectName,
  [
    { field: "budget", oldValue: 1000000, newValue: 1500000 },
    { field: "status", oldValue: "active", newValue: "completed" },
  ],
  "Updated project budget and status"
);
```

#### Deleting a Project

```typescript
import { logProjectDeleted } from "@/utils/activityLogger";

await logProjectDeleted(projectId, projectName);
```

### 2. Section Activities

#### Creating a Section

```typescript
import { logSectionCreated } from "@/utils/activityLogger";

// After creating a section
await logSectionCreated(projectId, projectName, sectionId, sectionName);
```

#### Updating a Section

```typescript
import { logSectionUpdated } from "@/utils/activityLogger";

await logSectionUpdated(
  projectId,
  projectName,
  sectionId,
  sectionName,
  [{ field: "name", oldValue: "Old Name", newValue: "New Name" }],
  "Renamed section"
);
```

#### Deleting a Section

```typescript
import { logSectionDeleted } from "@/utils/activityLogger";

await logSectionDeleted(projectId, projectName, sectionId, sectionName);
```

### 3. Mini-Section Activities

#### Creating a Mini-Section (Already Integrated in details.tsx)

```typescript
import { logMiniSectionCreated } from "@/utils/activityLogger";

await logMiniSectionCreated(
  projectId,
  projectName,
  sectionId,
  sectionName,
  miniSectionId,
  miniSectionName
);
```

#### Updating a Mini-Section

```typescript
import { logMiniSectionUpdated } from "@/utils/activityLogger";

await logMiniSectionUpdated(
  projectId,
  projectName,
  sectionId,
  sectionName,
  miniSectionId,
  miniSectionName,
  [{ field: "description", oldValue: "Old desc", newValue: "New desc" }],
  "Updated description"
);
```

#### Deleting a Mini-Section

```typescript
import { logMiniSectionDeleted } from "@/utils/activityLogger";

await logMiniSectionDeleted(
  projectId,
  projectName,
  sectionId,
  sectionName,
  miniSectionId,
  miniSectionName
);
```

### 4. Material Activities (Already Integrated in details.tsx)

#### Importing Materials

```typescript
import { logMaterialImported } from "@/utils/activityLogger";

// After importing materials
await logMaterialImported(
  projectId,
  projectName,
  5, // number of materials
  50000, // total cost
  "Imported cement, bricks, and steel"
);
```

#### Using Materials

```typescript
import { logMaterialUsed } from "@/utils/activityLogger";

// After using material
await logMaterialUsed(
  projectId,
  projectName,
  sectionId,
  sectionName,
  miniSectionId,
  miniSectionName,
  "Cement", // material name
  50, // quantity
  "bags", // unit
  25000 // cost (optional)
);
```

#### Updating Materials

```typescript
import { logMaterialUpdated } from "@/utils/activityLogger";

await logMaterialUpdated(
  projectId,
  projectName,
  "Cement",
  [{ field: "quantity", oldValue: 100, newValue: 150 }],
  "Adjusted quantity"
);
```

#### Deleting Materials

```typescript
import { logMaterialDeleted } from "@/utils/activityLogger";

await logMaterialDeleted(projectId, projectName, "Cement");
```

### 5. Staff Activities

#### Assigning Staff

```typescript
import { logStaffAssigned } from "@/utils/activityLogger";

await logStaffAssigned(
  projectId,
  projectName,
  "John Doe",
  "Site Engineer", // role (optional)
  "Assigned as lead engineer"
);
```

#### Removing Staff

```typescript
import { logStaffRemoved } from "@/utils/activityLogger";

await logStaffRemoved(projectId, projectName, "John Doe", "Contract completed");
```

## Integration Points

### Where to Add Activity Logging

1. **Project Management Screen**

   - When creating a new project → `logProjectCreated`
   - When editing project details → `logProjectUpdated`
   - When deleting a project → `logProjectDeleted`

2. **Section Management**

   - When adding a section → `logSectionCreated`
   - When editing section → `logSectionUpdated`
   - When deleting section → `logSectionDeleted`

3. **Mini-Section Management (✅ Already Done in details.tsx)**

   - When adding mini-section → `logMiniSectionCreated`
   - When editing mini-section → `logMiniSectionUpdated`
   - When deleting mini-section → `logMiniSectionDeleted`

4. **Material Management (✅ Already Done in details.tsx)**

   - When importing materials → `logMaterialImported`
   - When using materials → `logMaterialUsed`
   - When updating material → `logMaterialUpdated`
   - When deleting material → `logMaterialDeleted`

5. **Staff Management**
   - When assigning staff → `logStaffAssigned`
   - When removing staff → `logStaffRemoved`

## Best Practices

1. **Always log after successful operations**

   ```typescript
   try {
     // Perform operation
     const result = await createProject(data);

     // Log activity only if successful
     if (result.success) {
       await logProjectCreated(projectId, projectName);
     }
   } catch (error) {
     // Don't log if operation failed
   }
   ```

2. **Don't block user flow**

   - Activity logging is non-critical
   - Errors in logging won't affect the main operation
   - The logger catches errors internally

3. **Provide meaningful descriptions**

   ```typescript
   // Good
   await logProjectUpdated(
     projectId,
     projectName,
     [{ field: "budget", oldValue: 1000000, newValue: 1500000 }],
     "Increased budget due to scope change"
   );

   // Not as helpful
   await logProjectUpdated(projectId, projectName);
   ```

4. **Include relevant metadata**
   ```typescript
   await logProjectCreated(projectId, projectName, {
     budget: 1000000,
     location: "Mumbai",
     startDate: "2024-01-01",
     contractor: "ABC Builders",
   });
   ```

## Viewing Activities

Users can view all activities in the notification page:

- Navigate to `app/notification.tsx`
- Activities are filtered by:
  - All activities
  - Project activities only
  - Material activities only
- Activities show:
  - User who performed the action
  - Time ago
  - Description
  - Related project/section/material info
  - Cost information (for materials)

## API Endpoint

The activity API is located at:

```
POST {domain}/api/activity
GET {domain}/api/activity?clientId={clientId}&limit=50
```

## Troubleshooting

### Activities not showing up?

1. Check console logs for errors
2. Verify clientId is being passed correctly
3. Check if user data is available in AsyncStorage
4. Verify API endpoint is accessible

### "Unknown User" showing?

- The notification page now has a fallback to show the current user
- Check if user data is being saved correctly when logging activities
- Verify the `user` object has `userId` and `fullName` fields

## Next Steps

To complete the integration:

1. Find all places where projects are created/updated/deleted
2. Find all places where sections are created/updated/deleted
3. Find all places where staff is assigned/removed
4. Add the appropriate logging function after each successful operation

Example locations to check:

- `app/(tabs)/index.tsx` - Project list/creation
- `app/project/[id].tsx` - Project details/editing
- `app/section/[id].tsx` - Section management
- `app/staff/[id].tsx` - Staff management

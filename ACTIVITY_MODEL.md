# Activity Model for Project Tracking

## Model File: `lib/models/Xsite/Activity.ts`

```typescript
import { model, models, Schema } from "mongoose";

// User Schema - Who performed the action
const UserSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// Changed Data Schema - What was changed (before/after)
const ChangedDataSchema = new Schema(
  {
    field: {
      type: String,
      required: false,
    },
    oldValue: {
      type: Schema.Types.Mixed,
      required: false,
    },
    newValue: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { _id: false }
);

// Activity Schema
const ActivitySchema = new Schema(
  {
    // User who performed the action
    user: {
      type: UserSchema,
      required: true,
    },

    // Client and Project identification
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      required: false,
      index: true,
    },
    projectName: {
      type: String,
      required: false,
    },

    // Section identification (if applicable)
    sectionId: {
      type: String,
      required: false,
    },
    sectionName: {
      type: String,
      required: false,
    },

    // Mini-section identification (if applicable)
    miniSectionId: {
      type: String,
      required: false,
    },
    miniSectionName: {
      type: String,
      required: false,
    },

    // Activity details
    activityType: {
      type: String,
      required: true,
      enum: [
        // Project activities
        "project_created",
        "project_updated",
        "project_deleted",

        // Section activities
        "section_created",
        "section_updated",
        "section_deleted",

        // Mini-section activities
        "mini_section_created",
        "mini_section_updated",
        "mini_section_deleted",

        // Material activities
        "material_imported",
        "material_used",
        "material_updated",
        "material_deleted",

        // Staff activities
        "staff_assigned",
        "staff_removed",

        // Other activities
        "other",
      ],
      index: true,
    },

    // Activity category for filtering
    category: {
      type: String,
      required: true,
      enum: [
        "project",
        "section",
        "mini_section",
        "material",
        "staff",
        "other",
      ],
      index: true,
    },

    // Action performed
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "assign", "remove", "import", "use"],
    },

    // Description of the activity
    description: {
      type: String,
      required: true,
    },

    // Optional message or notes
    message: {
      type: String,
      required: false,
    },

    // Changed data (for update operations)
    changedData: {
      type: [ChangedDataSchema],
      required: false,
    },

    // Additional metadata
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },

    // IP address (optional)
    ipAddress: {
      type: String,
      required: false,
    },

    // Device information (optional)
    deviceInfo: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for better query performance
ActivitySchema.index({ clientId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });
ActivitySchema.index({ activityType: 1, createdAt: -1 });
ActivitySchema.index({ "user.userId": 1, createdAt: -1 });

export const Activity = models.Activity || model("Activity", ActivitySchema);
```

## API File: `app/api/activity/route.ts`

```typescript
import connect from "@/lib/db";
import { Activity } from "@/lib/models/Xsite/Activity";
import { errorResponse, successResponse } from "@/lib/models/utils/API";
import { NextRequest } from "next/server";

// GET: Fetch activities with filters
export const GET = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const clientId = searchParams.get("clientId");
  const userId = searchParams.get("userId");
  const activityType = searchParams.get("activityType");
  const category = searchParams.get("category");
  const action = searchParams.get("action");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = parseInt(searchParams.get("skip") || "0");

  try {
    await connect();

    if (!clientId && !projectId) {
      return errorResponse("clientId or projectId is required", 400);
    }

    const query: Record<string, any> = {};

    if (clientId) query.clientId = clientId;
    if (projectId) query.projectId = projectId;
    if (userId) query["user.userId"] = userId;
    if (activityType) query.activityType = activityType;
    if (category) query.category = category;
    if (action) query.action = action;

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Activity.countDocuments(query);

    return successResponse(
      {
        activities,
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      },
      "Activities fetched successfully",
      200
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return errorResponse("Something went wrong", 500, error.message);
    }
    return errorResponse("Unknown error occurred", 500);
  }
};

// POST: Create activity log
export const POST = async (req: NextRequest | Request) => {
  try {
    await connect();

    const body = await req.json();

    // Validation
    if (!body.user || !body.user.userId || !body.user.fullName) {
      return errorResponse("User information is required", 400);
    }

    if (!body.clientId) {
      return errorResponse("clientId is required", 400);
    }

    if (!body.activityType) {
      return errorResponse("activityType is required", 400);
    }

    if (!body.category) {
      return errorResponse("category is required", 400);
    }

    if (!body.action) {
      return errorResponse("action is required", 400);
    }

    if (!body.description) {
      return errorResponse("description is required", 400);
    }

    const newActivity = new Activity(body);
    await newActivity.save();

    return successResponse(newActivity, "Activity logged successfully", 201);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return errorResponse("Something went wrong", 500, error.message);
    }
    return errorResponse("Unknown error occurred", 500);
  }
};

// DELETE: Delete activities (admin only - optional)
export const DELETE = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("id");

  try {
    await connect();

    if (!activityId) {
      return errorResponse("Activity ID is required", 400);
    }

    const deletedActivity = await Activity.findByIdAndDelete(activityId);

    if (!deletedActivity) {
      return errorResponse("Activity not found", 404);
    }

    return successResponse(
      deletedActivity,
      "Activity deleted successfully",
      200
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return errorResponse("Something went wrong", 500, error.message);
    }
    return errorResponse("Unknown error occurred", 500);
  }
};
```

## Usage Examples

### 1. Project Created

```typescript
{
  user: {
    userId: "user123",
    fullName: "John Doe",
    email: "john@example.com"
  },
  clientId: "client123",
  projectId: "project123",
  projectName: "New Building Construction",
  activityType: "project_created",
  category: "project",
  action: "create",
  description: "Created new project: New Building Construction",
  message: "Initial project setup completed",
  metadata: {
    address: "123 Main St",
    budget: 1000000
  }
}
```

### 2. Section Updated

```typescript
{
  user: {
    userId: "user123",
    fullName: "John Doe"
  },
  clientId: "client123",
  projectId: "project123",
  projectName: "New Building Construction",
  sectionId: "section123",
  sectionName: "Ground Floor",
  activityType: "section_updated",
  category: "section",
  action: "update",
  description: "Updated section: Ground Floor",
  changedData: [
    {
      field: "name",
      oldValue: "Ground Floor",
      newValue: "Ground Floor - Phase 1"
    }
  ]
}
```

### 3. Mini-Section Created

```typescript
{
  user: {
    userId: "user123",
    fullName: "John Doe"
  },
  clientId: "client123",
  projectId: "project123",
  projectName: "New Building Construction",
  sectionId: "section123",
  sectionName: "Ground Floor",
  miniSectionId: "mini123",
  miniSectionName: "Living Room",
  activityType: "mini_section_created",
  category: "mini_section",
  action: "create",
  description: "Created mini-section: Living Room in Ground Floor"
}
```

### 4. Section Deleted

```typescript
{
  user: {
    userId: "user123",
    fullName: "John Doe"
  },
  clientId: "client123",
  projectId: "project123",
  projectName: "New Building Construction",
  sectionId: "section123",
  sectionName: "Basement",
  activityType: "section_deleted",
  category: "section",
  action: "delete",
  description: "Deleted section: Basement",
  message: "Section removed due to design changes"
}
```

## Activity Types Reference

### Project Activities

- `project_created` - New project created
- `project_updated` - Project details updated
- `project_deleted` - Project deleted

### Section Activities

- `section_created` - New section (Building/RowHouse/Other) created
- `section_updated` - Section details updated
- `section_deleted` - Section deleted

### Mini-Section Activities

- `mini_section_created` - New mini-section created
- `mini_section_updated` - Mini-section details updated
- `mini_section_deleted` - Mini-section deleted

### Material Activities

- `material_imported` - Materials imported to project
- `material_used` - Materials allocated/used
- `material_updated` - Material details updated
- `material_deleted` - Material removed

### Staff Activities

- `staff_assigned` - Staff member assigned to project
- `staff_removed` - Staff member removed from project

## Query Examples

### Get all activities for a project

```
GET /api/activity?projectId=project123&limit=50
```

### Get activities by user

```
GET /api/activity?clientId=client123&userId=user123
```

### Get only delete activities

```
GET /api/activity?projectId=project123&action=delete
```

### Get section activities

```
GET /api/activity?projectId=project123&category=section
```

### Pagination

```
GET /api/activity?clientId=client123&limit=20&skip=40
```

## Benefits

1. **Complete Audit Trail**: Every action is logged
2. **User Accountability**: Know who did what and when
3. **Change History**: Track what was changed (before/after)
4. **Filtering**: Query by project, user, type, category, action
5. **Pagination**: Handle large datasets efficiently
6. **Timestamps**: Automatic createdAt and updatedAt
7. **Indexed**: Fast queries on common fields
8. **Flexible**: Metadata field for custom data

## Integration Points

You'll need to call this API at:

1. Project creation/update/deletion
2. Section creation/update/deletion (Building, RowHouse, OtherSection)
3. Mini-section creation/update/deletion
4. Material import/usage/update/deletion
5. Staff assignment/removal

I can help you integrate this into your existing code if needed!

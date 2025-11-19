# Backend API Fix Required

## Issue

The delete operations for `rowHouse` and `otherSection` are missing the `await` keyword, causing them to return Promise objects instead of the actual deleted data.

## Files to Fix

### 1. `/api/rowHouse` - DELETE endpoint

**Current Code (BROKEN):**

```javascript
const deletedRowHouse = RowHouse.findByIdAndDelete(sectionId); // Missing await!
```

**Fixed Code:**

```javascript
const deletedRowHouse = await RowHouse.findByIdAndDelete(sectionId); // Added await
```

### 2. `/api/otherSection` - DELETE endpoint

**Current Code (BROKEN):**

```javascript
const deletedOtherSection = OtherSection.findByIdAndDelete(sectionId); // Missing await!
```

**Fixed Code:**

```javascript
const deletedOtherSection = await OtherSection.findByIdAndDelete(sectionId); // Added await
```

## Complete Fixed Code

### For `/api/rowHouse` DELETE:

```javascript
export const DELETE = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const sectionId = searchParams.get("sectionId");

  try {
    await connect();

    if (!projectId || !sectionId) {
      return NextResponse.json(
        { error: "Project ID and Section ID are required" },
        { status: 400 }
      );
    }

    const updatedProject = await Projects.findByIdAndUpdate(
      projectId,
      { $pull: { section: { sectionId: sectionId } } },
      { new: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // FIX: Added await keyword here
    const deletedRowHouse = await RowHouse.findByIdAndDelete(sectionId);

    if (!deletedRowHouse) {
      return NextResponse.json(
        { message: "Row house not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Row house deleted successfully",
        deletedRowHouse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting row house:", error);
    return NextResponse.json(
      {
        message: "Something went wrong!",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
```

### For `/api/otherSection` DELETE:

```javascript
export const DELETE = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const sectionId = searchParams.get("sectionId");

  try {
    await connect();

    if (!projectId || !sectionId) {
      return NextResponse.json(
        { error: "Project ID and Section ID are required" },
        { status: 400 }
      );
    }

    const updatedProject = await Projects.findByIdAndUpdate(
      projectId,
      { $pull: { section: { sectionId: sectionId } } },
      { new: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // FIX: Added await keyword here
    const deletedOtherSection = await OtherSection.findByIdAndDelete(sectionId);

    if (!deletedOtherSection) {
      return NextResponse.json(
        { message: "Section not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Section deleted successfully",
        deletedOtherSection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting section:", error);
    return NextResponse.json(
      {
        message: "Something went wrong!",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
```

## Why This Fix is Needed

Without `await`, the code returns a Promise object instead of waiting for the database operation to complete. This causes:

1. The API returns before the deletion actually happens
2. React tries to render the Promise object, causing the error: "Objects are not valid as a React child"
3. The deletion might fail silently

## Frontend Workaround

The frontend has been updated to handle this gracefully:

- Shows loading toast during deletion
- Better error handling for 500 errors
- Auto-refreshes the list even on 500 errors (in case deletion succeeded)
- More detailed error logging

However, **the backend should still be fixed** for proper operation.

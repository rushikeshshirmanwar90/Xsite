# Debugging 404 Error on Section Delete

## The Problem

You're getting a 404 error when trying to delete a section, which means the section is not found in the database.

## Possible Causes

### 1. Section Already Deleted

The section might have been deleted in a previous attempt (when you got the 500 error). The 500 error might have actually deleted it, but returned an error due to the missing `await` keyword.

**Solution:** Pull to refresh the page to see if the section is still there.

### 2. ID Mismatch

The `_id` field in your database might not match the `sectionId` you're sending.

## How to Debug

### Step 1: Check the Console Logs

When you try to delete a section, check your React Native console for these logs:

```
========================================
DELETING SECTION - DEBUG INFO
========================================
Full section object: { ... }
section._id: "..."
section.sectionId: "..."
Extracted sectionId: "..."
Section type: "..."
Project ID: "..."
========================================
```

### Step 2: Check Your Backend Logs

In your Next.js server console, you should see:

```
DELETE /api/otherSection?projectId=...&sectionId=... 404
```

### Step 3: Verify the Database

Check your MongoDB database to see:

1. Does the section with that `_id` exist?
2. What is the actual `_id` value in the database?
3. Does it match what you're sending in the API call?

## Common Issues

### Issue 1: Using `sectionId` instead of `_id`

Your section object might have both `_id` and `sectionId` fields, but they might be different values.

**Check in your database:**

```javascript
{
  _id: "691aed76abc187511d645098",  // MongoDB ObjectId
  sectionId: "SECT-001",             // Custom section ID
  name: "Ground Floor",
  type: "Buildings"
}
```

**The fix:** Make sure you're using the correct field. The `findByIdAndDelete()` method expects the MongoDB `_id`, not a custom `sectionId`.

### Issue 2: Section Already Deleted

The section was deleted in a previous attempt but the error made it seem like it failed.

**Solution:**

- Pull to refresh the page
- The frontend now auto-refreshes on 404 errors
- Check if the section is actually gone

## Backend Verification

Make sure your backend DELETE endpoint looks like this:

```javascript
export const DELETE = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const sectionId = searchParams.get("sectionId");

  try {
    await connect();

    console.log('DELETE Request:', { projectId, sectionId }); // Add this log

    if (!projectId || !sectionId) {
      return NextResponse.json(
        { error: "Project ID and Section ID are required" },
        { status: 400 }
      );
    }

    // First, remove from project's section array
    const updatedProject = await Projects.findByIdAndUpdate(
      projectId,
      { $pull: { section: { sectionId: sectionId } } },
      { new: true }
    );

    if (!updatedProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    console.log('Project updated, now deleting section...'); // Add this log

    // Then delete the actual section document
    const deletedOtherSection = await OtherSection.findByIdAndDelete(sectionId);

    console.log('Deleted section:', deletedOtherSection); // Add this log

    if (!deletedOtherSection) {
      return NextResponse.json(
        {
          message: "Section not found in database",
          hint: "It may have been already deleted or the ID is incorrect"
        },
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
  } catch (error: unknown) {
    console.error("Error deleting section:", error);
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

## Quick Fix

If the section is actually deleted but showing in the UI:

1. **Pull to refresh** the manage_project page
2. The frontend now auto-refreshes on 404 errors
3. Check if the section disappears

## Next Steps

1. Try deleting a section again
2. Check the console logs (both frontend and backend)
3. Share the logs with me if the issue persists
4. Verify in your MongoDB database if the section exists

The frontend is now updated to:

- Show better error messages for 404
- Auto-refresh the list when getting 404 (section might be already deleted)
- Provide detailed debug logs to help identify the issue

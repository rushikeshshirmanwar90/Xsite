# Material Usage "Material Not Found" Error - Fix

## Problem Analysis

When trying to add material usage from `app/details.tsx`, you're getting a "Material not found" error. This happens because:

1. **Materials are imported globally** (without a `sectionId`)
2. **Usage request includes a `sectionId`** (the current section)
3. **API search logic is too strict** - it's looking for materials where BOTH conditions match:
   - `_id` matches the requested material
   - `sectionId` is empty OR matches the requested section

## Root Cause

The issue is in the API's material search logic. When checking if `sectionId` matches, the code might not be properly handling `null`, `undefined`, or empty string values.

## Solution

Update your API file with this corrected logic:

```typescript
// Find material in MaterialAvailable by _id
// Accept materials that are:
// 1. Global (no sectionId set)
// 2. Scoped to the requested section
const availIndex = (project.MaterialAvailable || []).findIndex((m: MaterialSubdoc) => {
  try {
    const sameId =
      String((m as unknown as { _id: string | Types.ObjectId })._id) ===
      String(materialId);

    // Get the material's sectionId
    const materialSectionId = (m as unknown as { sectionId?: string }).sectionId;
    
    // Accept if:
    // - Material has no sectionId (global material)
    // - Material's sectionId matches the requested sectionId
    const sameSection =
      !materialSectionId || // No sectionId = global material
      materialSectionId === '' || // Empty string = global material
      String(materialSectionId) === String(sectionId || "");

    console.log('Material search:', {
      materialName: m.name,
      materialId: (m as unknown as { _id: string | Types.ObjectId })._id,
      materialSectionId: materialSectionId || '(none)',
      requestedSectionId: sectionId,
      sameId,
      sameSection,
      match: sameId && sameSection
    });

    return sameId && sameSection;
  } catch (error) {
    console.error('Error in material search:', error);
    return false;
  }
});
```

## Complete Fixed API Code

Replace your entire POST handler in the material-usage API with this:

```typescript
export const POST = async (req: NextRequest | Request) => {
  try {
    await connect();
    const body = await req.json();
    const { projectId, materialId, qnt, miniSectionId, sectionId } = body;

    console.log('\n========================================');
    console.log('MATERIAL USAGE API - REQUEST RECEIVED');
    console.log('========================================');
    console.log('Request Body:', JSON.stringify(body, null, 2));
    console.log('========================================\n');

    // Validation
    if (!projectId || !materialId || typeof qnt !== "number" || !sectionId) {
      return NextResponse.json({
        success: false,
        error: "projectId, materialId, sectionId and numeric qnt are required",
      }, { status: 400 });
    }

    if (qnt <= 0) {
      return NextResponse.json({
        success: false,
        error: "Quantity must be greater than 0",
      }, { status: 400 });
    }

    // Find project document
    const project = await Projects.findById(projectId);
    if (!project) {
      console.error("Project not found for ID:", projectId);
      return NextResponse.json({
        success: false,
        error: "Project not found",
      }, { status: 404 });
    }

    console.log('Project found:', project._id);
    console.log('MaterialAvailable count:', project.MaterialAvailable?.length || 0);

    // Find material in MaterialAvailable
    const availIndex = (project.MaterialAvailable || []).findIndex((m: MaterialSubdoc) => {
      try {
        const sameId =
          String((m as unknown as { _id: string | Types.ObjectId })._id) ===
          String(materialId);

        // Get the material's sectionId
        const materialSectionId = (m as unknown as { sectionId?: string }).sectionId;
        
        // Accept if:
        // - Material has no sectionId (global material)
        // - Material's sectionId matches the requested sectionId
        const sameSection =
          !materialSectionId || // No sectionId = global material
          materialSectionId === '' || // Empty string = global material
          String(materialSectionId) === String(sectionId || "");

        console.log('Checking material:', {
          name: m.name,
          _id: (m as unknown as { _id: string | Types.ObjectId })._id,
          materialSectionId: materialSectionId || '(none)',
          requestedSectionId: sectionId,
          sameId,
          sameSection,
          match: sameId && sameSection
        });

        return sameId && sameSection;
      } catch (error) {
        console.error('Error in material search:', error);
        return false;
      }
    });

    if (availIndex == null || availIndex < 0) {
      console.error('\n❌ MATERIAL NOT FOUND');
      console.error('Searched for materialId:', materialId);
      console.error('In sectionId:', sectionId);
      console.error('\nAvailable materials:');
      (project.MaterialAvailable || []).forEach((m: any, idx: number) => {
        console.error(`  ${idx + 1}. ${m.name} (_id: ${m._id}, sectionId: ${m.sectionId || '(none)'})`);
      });
      
      return NextResponse.json({
        success: false,
        error: "Material not found in MaterialAvailable. The material might be scoped to a different section or doesn't exist.",
      }, { status: 404 });
    }

    const available = project.MaterialAvailable![availIndex] as MaterialSubdoc;
    console.log('✓ Material found:', available.name, '- Available qty:', available.qnt);

    const costOfUsedMaterial = Number(available.cost || 0);

    // Check sufficient quantity
    if (Number(available.qnt || 0) < qnt) {
      return NextResponse.json({
        success: false,
        error: `Insufficient quantity available. Available: ${Number(available.qnt || 0)}, Requested: ${qnt}`,
      }, { status: 400 });
    }

    // Prepare used material clone
    const usedClone: MaterialSubdoc = {
      name: available.name,
      unit: available.unit,
      specs: available.specs || {},
      qnt: qnt,
      cost: available.cost || 0,
      sectionId: String(sectionId),
      miniSectionId:
        miniSectionId ||
        (available as unknown as { miniSectionId?: string }).miniSectionId ||
        undefined,
    };

    console.log('Creating used material entry:', usedClone);

    // Update project using findByIdAndUpdate
    const updatedProject = await Projects.findByIdAndUpdate(
      projectId,
      {
        $inc: {
          "MaterialAvailable.$[elem].qnt": -qnt,
          spent: costOfUsedMaterial,
        },
        $push: {
          MaterialUsed: usedClone,
        },
      },
      {
        arrayFilters: [{ "elem._id": new ObjectId(materialId) }],
        new: true,
        fields: {
          MaterialAvailable: 1,
          MaterialUsed: 1,
          spent: 1,
        },
      }
    );

    if (!updatedProject) {
      return NextResponse.json({
        success: false,
        error: "Failed to update project",
      }, { status: 500 });
    }

    console.log('✓ Project updated successfully');

    // Clean up: remove materials with 0 or negative quantity
    await Projects.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          MaterialAvailable: { qnt: { $lte: 0 } },
        },
      },
      { new: true }
    );

    console.log('✓ Cleanup completed');
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: `Successfully added ${qnt} ${available.unit} of ${available.name} to used materials`,
      data: {
        projectId: updatedProject._id,
        sectionId: sectionId,
        miniSectionId: miniSectionId,
        materialAvailable: updatedProject.MaterialAvailable,
        materialUsed: updatedProject.MaterialUsed,
        usedMaterial: usedClone,
        spent: updatedProject.spent,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in add-material-usage:", msg);
    return NextResponse.json({
      success: false,
      error: msg,
    }, { status: 500 });
  }
};
```

## Key Changes

1. **Improved sectionId matching logic**:
   - Explicitly checks for `null`, `undefined`, and empty string
   - Treats all these cases as "global material"

2. **Enhanced logging**:
   - Logs each material being checked
   - Shows why materials match or don't match
   - Lists all available materials when not found

3. **Better error messages**:
   - Explains why material wasn't found
   - Suggests possible causes

## Testing

After applying this fix:

1. **Test with global materials** (no sectionId):
   ```
   Material: { _id: "abc123", name: "Cement", sectionId: undefined }
   Request: { materialId: "abc123", sectionId: "section1" }
   Result: ✅ Should work (global material)
   ```

2. **Test with section-scoped materials**:
   ```
   Material: { _id: "abc123", name: "Cement", sectionId: "section1" }
   Request: { materialId: "abc123", sectionId: "section1" }
   Result: ✅ Should work (matching section)
   ```

3. **Test with wrong section**:
   ```
   Material: { _id: "abc123", name: "Cement", sectionId: "section1" }
   Request: { materialId: "abc123", sectionId: "section2" }
   Result: ❌ Should fail (different section)
   ```

## Additional Recommendations

1. **When importing materials**, consider whether they should be:
   - **Global** (available to all sections) - don't set `sectionId`
   - **Section-specific** (only for one section) - set `sectionId`

2. **Update the material import API** to allow specifying scope:
   ```typescript
   {
     materialName: "Cement",
     qnt: 100,
     unit: "bags",
     scope: "global" | "section",
     sectionId: "section1" // only if scope is "section"
   }
   ```

3. **Add a UI indicator** showing which materials are global vs section-specific

## Verification

After applying the fix, check the console logs when adding material usage. You should see:

```
========================================
MATERIAL USAGE API - REQUEST RECEIVED
========================================
Checking material: {
  name: 'Cement',
  _id: '...',
  materialSectionId: '(none)',
  requestedSectionId: 'section1',
  sameId: true,
  sameSection: true,
  match: true
}
✓ Material found: Cement - Available qty: 100
========================================
```

If you still see "Material not found", the logs will show exactly why each material didn't match.

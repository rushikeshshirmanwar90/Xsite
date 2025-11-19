# Material Usage - SectionId Matching Issue

## The Real Problem

After analyzing the API code, I found the actual issue. The API has a **strict matching logic** that checks BOTH `materialId` AND `sectionId`:

```typescript
// API Code (material-usage route)
const availIndex = (project.MaterialAvailable || []).findIndex(
  (m: MaterialSubdoc) => {
    const sameId = String(m._id) === String(materialId);

    // Material must have NO sectionId OR matching sectionId
    const sameSection =
      !m.sectionId || // Material has no sectionId (global)
      String(m.sectionId) === String(sectionId); // OR sectionId matches

    return sameId && sameSection; // BOTH must be true!
  }
);

if (availIndex < 0) {
  return { error: "Material not found in MaterialAvailable" };
}
```

## Why This Causes "Material not available" Error

### Scenario 1: Material has wrong sectionId

```
Material in DB:
  _id: "507f..."
  name: "Cement"
  sectionId: "abc123"  ← Different section!

Request:
  materialId: "507f..."
  sectionId: "xyz789"  ← Your current section

Result: ❌ NOT FOUND (sectionId doesn't match)
```

### Scenario 2: Material has no sectionId (Should work)

```
Material in DB:
  _id: "507f..."
  name: "Cement"
  sectionId: undefined  ← No section (global)

Request:
  materialId: "507f..."
  sectionId: "xyz789"

Result: ✅ FOUND (no sectionId means global)
```

### Scenario 3: Material has matching sectionId (Should work)

```
Material in DB:
  _id: "507f..."
  name: "Cement"
  sectionId: "xyz789"  ← Same section!

Request:
  materialId: "507f..."
  sectionId: "xyz789"

Result: ✅ FOUND (sectionId matches)
```

## How to Debug

With the new logging, you'll see:

```
========================================
ADD MATERIAL USAGE - DEBUG INFO
========================================
Material ID received: 507f1f77bcf86cd799439011
Section ID being sent: 674d8e9f8c1234567890abcd
Mini Section ID being sent: 674d8e9f8c1234567890def0

✓ Material found: {
  name: "Cement",
  _id: "507f1f77bcf86cd799439011",
  quantity: 100,
  unit: "bags",
  sectionId: "674d8e9f8c1234567890abcd"  ← CHECK THIS!
}

⚠️ IMPORTANT - API MATCHING LOGIC:
The API will look for a material where:
  1. _id matches: 507f1f77bcf86cd799439011
  2. AND (sectionId is empty OR sectionId matches: 674d8e9f8c1234567890abcd)

Material sectionId: 674d8e9f8c1234567890abcd
Request sectionId: 674d8e9f8c1234567890abcd

✓ These match! Should work.
```

OR if there's a mismatch:

```
⚠️ WARNING: Material has sectionId 674d8e9f8c1234567890abcd
            but request is for 674d8e9f8c1234567890xyz
This might cause "Material not found" error from API!
```

## Solutions

### Solution 1: Import Materials Without SectionId (Recommended)

When importing materials, don't assign them to a specific section. This makes them "global" and usable in any section.

**In your material import API:**

```typescript
// DON'T set sectionId when importing
const newMaterial = {
  name: "Cement",
  qnt: 100,
  unit: "bags",
  cost: 500,
  // sectionId: undefined  ← Leave empty for global materials
};
```

### Solution 2: Import Materials to Correct Section

If materials should be section-specific, import them with the correct `sectionId`:

```typescript
const newMaterial = {
  name: "Cement",
  qnt: 100,
  unit: "bags",
  cost: 500,
  sectionId: "674d8e9f8c1234567890abcd"  ← Set to target section
};
```

### Solution 3: Modify API to Ignore SectionId (Backend Change)

If you want materials to be usable across all sections regardless of their `sectionId`, modify the API:

```typescript
// BEFORE (strict matching):
const sameSection = !m.sectionId || String(m.sectionId) === String(sectionId);

// AFTER (ignore sectionId):
const sameSection = true; // Always match, ignore sectionId
```

### Solution 4: Filter Materials by Section in Frontend

Show only materials that match the current section:

```typescript
// In details.tsx, filter materials before passing to form
const sectionMaterials = availableMaterials.filter(m =>
  !m.sectionId || m.sectionId === sectionId
);

// Pass filtered materials to form
<MaterialUsageForm
  availableMaterials={sectionMaterials}  // Only matching materials
  ...
/>
```

## Recommended Approach

**Best Practice:** Import materials as **global** (no sectionId), then assign them to sections when used.

### Why?

1. ✅ Materials can be used in any section
2. ✅ No "material not found" errors
3. ✅ More flexible material management
4. ✅ Simpler logic

### Implementation:

**1. When Importing Materials:**

```typescript
// Don't set sectionId
POST /api/material
{
  projectId: "...",
  name: "Cement",
  qnt: 100,
  unit: "bags",
  cost: 500
  // NO sectionId field
}
```

**2. When Using Materials:**

```typescript
// Set sectionId and miniSectionId
POST /api/material-usage
{
  projectId: "...",
  materialId: "...",
  sectionId: "...",      // Assign to section here
  miniSectionId: "...",  // Assign to mini-section here
  qnt: 50
}
```

This way:

- Materials are imported once (global)
- Can be used in any section
- Get assigned to section when used
- No matching issues

## Testing Steps

1. **Check Material SectionId:**

   ```
   Open console → Add Usage → Check logs:
   "Material sectionId: (empty/undefined)" ← Good!
   OR
   "Material sectionId: 674d..." ← Check if it matches request
   ```

2. **Verify Request SectionId:**

   ```
   "Request sectionId: 674d..."
   ```

3. **Compare:**

   - If material has NO sectionId → ✅ Should work
   - If material sectionId === request sectionId → ✅ Should work
   - If material sectionId !== request sectionId → ❌ Will fail

4. **Check API Response:**
   ```
   If error: "Material not found in MaterialAvailable"
   → SectionId mismatch confirmed!
   ```

## Quick Fix for Existing Materials

If you have materials with wrong `sectionId`, you can:

### Option A: Update in Database

```javascript
// MongoDB query to remove sectionId from all materials
db.projects.updateMany(
  {},
  {
    $unset: {
      "MaterialAvailable.$[].sectionId": "",
    },
  }
);
```

### Option B: Update via API

Create a migration script to update existing materials:

```typescript
// Remove sectionId from all MaterialAvailable
await Projects.updateMany(
  {},
  {
    $unset: {
      "MaterialAvailable.$[].sectionId": "",
    },
  }
);
```

### Option C: Re-import Materials

1. Delete existing materials
2. Import them again without sectionId
3. Use them in sections

## Summary

**The Issue:**

- API requires material's `sectionId` to be empty OR match request's `sectionId`
- Materials imported with wrong `sectionId` can't be used in other sections

**The Solution:**

- Import materials WITHOUT `sectionId` (global materials)
- Assign `sectionId` when using materials
- This makes materials flexible and prevents matching errors

**The Logging:**

- Now shows material's `sectionId` vs request's `sectionId`
- Warns if there's a mismatch
- Explains API matching logic

---

**Try adding material usage again and check the console logs. They will show you exactly what `sectionId` the material has and whether it matches!**

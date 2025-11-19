# Material Usage Issue - Fix Applied

## Problem

Users were getting "Material not available" error when trying to add materials to material usage, even though the materials were clearly available.

## Root Cause

The issue was in the `MaterialUsageForm.tsx` component where it was selecting materials:

```typescript
// BEFORE (WRONG):
setSelectedMaterialId(material._id || material.id.toString());
```

This code had a fallback that would use `material.id.toString()` if `_id` was not available. However:

- `material.id` is a numeric index (1, 2, 3, etc.)
- `material._id` is the MongoDB ObjectId string (e.g., "507f1f77bcf86cd799439011")

When the form passed `material.id.toString()` (like "1", "2", "3"), but the API and backend expected the MongoDB `_id`, the material lookup failed.

## Solution Applied

### 1. Fixed Material Selection (MaterialUsageForm.tsx)

```typescript
// AFTER (CORRECT):
onPress={() => {
    if (!material._id) {
        alert('Error: Material ID not found. Please refresh and try again.');
        return;
    }
    setSelectedMaterialId(material._id);
}}
```

Now it:

- Only uses `material._id` (no fallback)
- Shows an error if `_id` is missing
- Prevents invalid IDs from being passed

### 2. Fixed Material Comparison

```typescript
// BEFORE:
const isSelected =
  selectedMaterialId === (material._id || material.id.toString());

// AFTER:
const isSelected = selectedMaterialId === material._id;
```

### 3. Added Better Debugging

Enhanced the `handleAddMaterialUsage` function to:

- Show detailed material ID information
- List all available materials with their IDs
- Clearly indicate which material matches
- Return early with error toast if material not found

### 4. Added Validation

Added a check when materials are loaded to warn if any material is missing `_id`:

```typescript
if (!material._id) {
  console.warn(
    `⚠️ Material "${material.name}" is missing _id field!`,
    material
  );
}
```

## How to Test

### 1. Verify Materials Have IDs

1. Open the app and navigate to a project
2. Open browser console/React Native debugger
3. Check the logs when materials load
4. Look for: "Transformed Available (first item)"
5. Verify each material has `_id` field

### 2. Test Material Usage

1. Click "Add Usage" button
2. Select a mini-section
3. Search and select a material
4. Enter quantity
5. Click "Record Usage"
6. Should work without "Material not available" error

### 3. Check Console Logs

If it still fails, check console for:

```
ADD MATERIAL USAGE - DEBUG INFO
Material ID received: [should be MongoDB ID]
Material ID type: string
Found material: [material name] or NOT FOUND
```

## Expected Behavior

### Success Case

```
✓ Material found: {
  name: "Cement",
  _id: "507f1f77bcf86cd799439011",
  quantity: 100,
  unit: "bags"
}
```

### Failure Case (if material missing \_id)

```
❌ Material not found in availableMaterials!
Total available materials: 5

All available materials:
  1. Cement:
     _id: "507f1f77bcf86cd799439011" (type: string)
     id: 1 (type: number)
     Match: ✓ YES
```

## Troubleshooting

### If Error Still Occurs

#### Check 1: Material Has \_id

```javascript
// In console, check:
availableMaterials.forEach((m) => {
  console.log(m.name, "has _id:", !!m._id, m._id);
});
```

#### Check 2: API Response

The material API should return:

```json
{
  "success": true,
  "MaterialAvailable": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Cement",
      "qnt": 100,
      "unit": "bags",
      "cost": 500
    }
  ]
}
```

#### Check 3: Refresh Materials

If materials were added before this fix:

1. Pull down to refresh the page
2. Or close and reopen the app
3. This ensures materials are loaded with correct structure

### Common Issues

#### Issue: Material \_id is undefined

**Cause**: API not returning \_id field
**Solution**: Check backend API to ensure it includes \_id in response

#### Issue: Material \_id is a number

**Cause**: Using numeric ID instead of MongoDB ObjectId
**Solution**: Backend should use MongoDB ObjectId, not auto-increment ID

#### Issue: Material found but usage fails

**Cause**: Different issue (API endpoint, permissions, etc.)
**Solution**: Check API logs and network tab for actual error

## Files Modified

1. **components/details/MaterialUsageForm.tsx**

   - Fixed material selection to only use `_id`
   - Added validation for missing `_id`
   - Fixed comparison logic

2. **app/details.tsx**
   - Enhanced debugging in `handleAddMaterialUsage`
   - Added early return with error toast
   - Added validation when transforming materials

## Prevention

To prevent this issue in the future:

1. **Always use `_id` for MongoDB documents**

   - Never use numeric `id` for database operations
   - Only use `id` for UI display/indexing

2. **Validate data structure**

   - Check that API responses include `_id`
   - Warn if `_id` is missing during transformation

3. **Type safety**
   - Use TypeScript interfaces that require `_id`
   - Make `_id` a required field, not optional

## Summary

The fix ensures that:
✅ Only MongoDB `_id` is used for material selection
✅ Clear error messages if `_id` is missing
✅ Better debugging to identify issues quickly
✅ Validation to catch problems early

The "Material not available" error should now be resolved!

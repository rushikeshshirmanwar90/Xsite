# Edit Section API Fix

## Issue

When editing sections, the wrong API endpoint parameter was being used:

- **Building** sections were correctly using `?id=` parameter ✅
- **RowHouse** sections were incorrectly using `?id=` instead of `?rh=` ❌
- **OtherSection** sections were incorrectly using `?id=` instead of `?rh=` ❌

## Root Cause

The `handleUpdateSection` function in `app/manage_project/[id].tsx` was using `?id=` parameter for all three section types, but the backend APIs for rowHouse and otherSection expect `?rh=` parameter.

## Backend API Expectations

### Building API (PUT)

```javascript
// Endpoint: /api/building
// Parameter: ?id={sectionId}
export const PUT = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id"); // ✅ Uses 'id'
  const body = await req.json();

  const updateBuilding = await Building.findByIdAndUpdate(id, body, {
    new: true,
  });
  // ...
};
```

### RowHouse API (PUT)

```javascript
// Endpoint: /api/rowHouse
// Parameter: ?rh={sectionId}
export const PUT = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const rowHouseId = searchParams.get("rh"); // ✅ Uses 'rh'
  const newData = await req.json();

  const newHouse = await RowHouse.findByIdAndUpdate(
    rowHouseId,
    { newData },
    { new: true }
  );
  // ...
};
```

### OtherSection API (PUT)

```javascript
// Endpoint: /api/otherSection
// Parameter: ?rh={sectionId}
export const PUT = async (req: NextRequest | Request) => {
  const { searchParams } = new URL(req.url);
  const OtherSectionId = searchParams.get("rh"); // ✅ Uses 'rh'
  const newData = await req.json();

  const newHouse = await OtherSection.findByIdAndUpdate(
    OtherSectionId,
    { newData },
    { new: true }
  );
  // ...
};
```

## Fix Applied

### Before (Incorrect)

```typescript
if (editingSection.type === "Buildings") {
  endpoint = `${domain}/api/building?id=${sectionId}`;
} else if (editingSection.type === "rowhouse") {
  endpoint = `${domain}/api/rowHouse?id=${sectionId}`; // ❌ Wrong parameter
} else {
  endpoint = `${domain}/api/otherSection?id=${sectionId}`; // ❌ Wrong parameter
}
```

### After (Correct)

```typescript
if (editingSection.type === "Buildings") {
  endpoint = `${domain}/api/building?id=${sectionId}`;
} else if (editingSection.type === "rowhouse") {
  endpoint = `${domain}/api/rowHouse?rh=${sectionId}`; // ✅ Correct parameter
} else {
  endpoint = `${domain}/api/otherSection?rh=${sectionId}`; // ✅ Correct parameter
}
```

## Testing

To verify the fix:

1. **Edit a Building section:**

   - Should call: `PUT /api/building?id={sectionId}`
   - Should work correctly ✅

2. **Edit a RowHouse section:**

   - Should call: `PUT /api/rowHouse?rh={sectionId}`
   - Should now work correctly ✅

3. **Edit an OtherSection:**
   - Should call: `PUT /api/otherSection?rh={sectionId}`
   - Should now work correctly ✅

## Console Logs

The fix includes console logs to help debug:

```
Updating section: { sectionId, type, newName }
Building endpoint: /api/building?id=...
Rowhouse endpoint: /api/rowHouse?rh=...
Other section endpoint: /api/otherSection?rh=...
```

## Summary

✅ **Fixed**: Edit function now calls the correct API endpoint for each section type
✅ **Building**: Uses `?id=` parameter (unchanged)
✅ **RowHouse**: Now uses `?rh=` parameter (fixed)
✅ **OtherSection**: Now uses `?rh=` parameter (fixed)

The edit functionality should now work correctly for all three section types!

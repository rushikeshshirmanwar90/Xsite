# Debug Edit Section Issue

## Problem

When editing a Building section, the otherSection API is being called instead of the building API.

## Enhanced Debugging

I've added comprehensive console logging to the `handleUpdateSection` function. When you try to edit a section, you'll now see:

```
========================================
UPDATING SECTION - DEBUG INFO
========================================
Full section object: { ... }
Section type: "Buildings"
Section type (typeof): "string"
Section type === "Buildings": true/false
Section type === "rowhouse": true/false
Section type === "other": true/false
Section ID: "..."
New name: "..."
========================================
✅ MATCHED: Building type
Building endpoint: /api/building?id=...
========================================
FINAL ENDPOINT: /api/building?id=...
========================================
```

## Steps to Debug

1. **Open your React Native console/debugger**
2. **Try to edit a Building section**
3. **Check the console output** - Look for the debug section above
4. **Share the output with me**, specifically:
   - What is the value of `Section type:`?
   - Which type matched (Building, Rowhouse, or Other)?
   - What is the `FINAL ENDPOINT:`?

## Possible Causes

### 1. Type Value Mismatch

The section type might not be exactly `"Buildings"`. It could be:

- `"building"` (lowercase)
- `"Building"` (singular)
- `"buildings"` (lowercase plural)
- Has extra spaces: `" Buildings "` or `"Buildings "`

### 2. Type Field Missing

The section object might not have a `type` field at all, causing it to fall through to the `else` block.

### 3. Data Corruption

The section data might be getting modified somewhere before reaching the edit function.

## Updated Logic

The code now checks for multiple variations:

```typescript
// For Buildings
if (editingSection.type === "Buildings" || editingSection.type === "building") {
  endpoint = `${domain}/api/building?id=${sectionId}`;
}
// For Rowhouse
else if (
  editingSection.type === "rowhouse" ||
  editingSection.type === "row house" ||
  editingSection.type === "Rowhouse"
) {
  endpoint = `${domain}/api/rowHouse?rh=${sectionId}`;
}
// For Other (default)
else {
  endpoint = `${domain}/api/otherSection?rh=${sectionId}`;
}
```

## What to Check

1. **In your database**, check what the actual `type` value is for a Building section
2. **In the API response** when fetching sections, check the `type` field
3. **In the console logs**, see what type value is being received

## Quick Fix Options

### Option 1: Normalize Type Values

Add type normalization before the check:

```typescript
const normalizedType = editingSection.type?.toLowerCase().trim();

if (normalizedType === "buildings" || normalizedType === "building") {
  // Building API
}
```

### Option 2: Use Type Mapping

Create a type map:

```typescript
const typeToEndpoint = {
  Buildings: { api: "building", param: "id" },
  building: { api: "building", param: "id" },
  rowhouse: { api: "rowHouse", param: "rh" },
  Rowhouse: { api: "rowHouse", param: "rh" },
  other: { api: "otherSection", param: "rh" },
};
```

### Option 3: Check Backend Response

Verify what `type` value the backend is returning when you fetch sections.

## Next Steps

1. Try editing a Building section
2. Copy the console output
3. Share it with me
4. I'll provide the exact fix based on the actual type value

The enhanced logging will tell us exactly what's happening!

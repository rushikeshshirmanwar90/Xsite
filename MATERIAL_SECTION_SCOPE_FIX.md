# Material Section Scope Issue - FIXED

## 🐛 The Real Problem

The "Material not available" error was caused by **section scoping** in the backend API.

### How It Works

When you import materials to a project, they can be:

1. **Global materials** - No `sectionId` set (available to all sections)
2. **Section-specific materials** - Have a `sectionId` (only available to that section)

### The Backend Logic

The backend API (`/api/material-usage`) checks:

```javascript
const sameSection =
  !m.sectionId || String(m.sectionId) === String(sectionId || "");
```

This means:

- ✅ If material has NO `sectionId` → Available for any section
- ✅ If material HAS a `sectionId` → Must match the requested section
- ❌ If material's `sectionId` doesn't match → **"Material not available"**

## 🔧 The Fix

### 1. Filter Materials by Section (app/details.tsx)

Added a filter to only show materials available for the current section:

```typescript
<MaterialUsageForm
  availableMaterials={availableMaterials.filter((m) => {
    // Show materials that have no sectionId (global) OR match current sectionId
    return !m.sectionId || m.sectionId === sectionId;
  })}
/>
```

### 2. Include sectionId in Transformed Materials

Updated material transformation to include `sectionId`:

```typescript
return {
  id: index + 1,
  _id: material._id,
  name: material.name,
  // ... other fields
  sectionId: material.sectionId, // ✅ Include this
};
```

### 3. Added Detailed Logging

Added logging to show which materials are available and why:

```typescript
console.log(`📦 Material: ${material.name}`);
console.log(`   _id: ${material._id}`);
console.log(`   sectionId: ${material.sectionId || "NONE"}`);
console.log(`   Current page sectionId: ${sectionId}`);
console.log(
  `   Match: ${
    !material.sectionId || material.sectionId === sectionId ? "✅" : "❌"
  }`
);
```

## 📊 How to Verify

### Step 1: Check Material Scope

When materials load, check console:

```
📦 Material: Cement
   _id: 507f1f77bcf86cd799439011
   sectionId: NONE
   Current page sectionId: 507f...
   Match: ✅

📦 Material: Steel
   _id: 507f1f77bcf86cd799439012
   sectionId: 507f... (different section)
   Current page sectionId: 507f...
   Match: ❌
```

### Step 2: Check Filtered Materials

When you open "Add Usage" form:

```
📝 MATERIAL USAGE FORM OPENED
Available Materials Count: 3  (only materials for this section)

🚫 Filtering out material: Steel (sectionId: 507f..., current: 507f...)
```

### Step 3: Try Adding Usage

Now only materials available for the current section will show up in the form!

## 🎯 Expected Behavior

### Before Fix

- ❌ All materials showed in the form
- ❌ Selecting a material from different section caused "Material not available" error
- ❌ No way to know which materials were available

### After Fix

- ✅ Only materials for current section show in the form
- ✅ Only materials with no `sectionId` (global) show in all sections
- ✅ Clear logging shows which materials are filtered and why
- ✅ No more "Material not available" errors

## 🔍 Understanding Section Scope

### Scenario 1: Global Materials

```
Material: Cement
sectionId: null/undefined
Result: Available in ALL sections ✅
```

### Scenario 2: Section-Specific Materials

```
Material: Foundation Steel
sectionId: "507f..." (Foundation section)
Current Section: "507f..." (Foundation)
Result: Available ✅

Current Section: "608a..." (Walls)
Result: NOT Available ❌ (filtered out)
```

## 🚨 Important Notes

### When Importing Materials

If you want materials to be available **across all sections**:

- Don't set a `sectionId` when importing
- Materials will be global

If you want materials **only for specific section**:

- Set the `sectionId` when importing
- Materials will only show in that section

### Checking Material Scope

To see which materials are global vs section-specific:

1. Open project details
2. Check console logs
3. Look for materials with `sectionId: NONE` (global)
4. Look for materials with `sectionId: 507f...` (section-specific)

## 🔧 Troubleshooting

### Issue: No materials showing in form

**Cause:** All materials belong to different sections

**Solution:**

1. Check console logs to see material `sectionId` values
2. Import materials without `sectionId` to make them global
3. Or import materials specifically for this section

### Issue: Material shows but still gets "not available" error

**Cause:** Material's `sectionId` changed after filtering

**Solution:**

1. Check the API payload in console
2. Verify `sectionId` in payload matches material's `sectionId`
3. Check backend logs for exact error

### Issue: Want to move material between sections

**Current Limitation:** Materials are scoped to sections

**Workaround:**

1. Materials without `sectionId` are available everywhere
2. Or implement a "transfer material" feature in backend

## 📝 Files Modified

1. **app/details.tsx**

   - Added filter for section-scoped materials
   - Added `sectionId` to transformed materials
   - Added detailed logging for material scope

2. **types/details.ts**

   - Already had `sectionId` in Material interface ✅

3. **MATERIAL_SECTION_SCOPE_FIX.md**
   - This documentation

## ✅ Summary

The fix ensures that:

- ✅ Only materials available for the current section show in the form
- ✅ Global materials (no `sectionId`) show in all sections
- ✅ Section-specific materials only show in their section
- ✅ Clear logging shows which materials are filtered
- ✅ No more "Material not available" errors

**The material usage feature should now work correctly!** 🎉

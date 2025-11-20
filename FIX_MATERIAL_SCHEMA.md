# Fix for MaterialSchema - Missing _id Field

## Problem

The `_id` field is not being populated in the `MaterialAvailable` array. When you query the project, the materials show `_id: undefined`.

## Root Cause

Your `MaterialSchema` (imported from `./Xsite/materials-activity`) likely doesn't have `_id: true` configured in the schema options.

## Solution

Find your `MaterialSchema` definition (in `lib/models/Xsite/materials-activity.ts` or similar) and ensure it has `_id: true`:

### Current Schema (Likely)

```typescript
const MaterialSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  specs: {
    type: Object,
    default: {},
  },
  qnt: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  sectionId: {
    type: String,
    required: false,
  },
  miniSectionId: {
    type: String,
    required: false,
  },
}, { timestamps: true }); // ❌ Missing _id: true
```

### Fixed Schema

```typescript
const MaterialSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  specs: {
    type: Object,
    default: {},
  },
  qnt: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  sectionId: {
    type: String,
    required: false,
  },
  miniSectionId: {
    type: String,
    required: false,
  },
}, { 
  timestamps: true,
  _id: true  // ✅ Add this to ensure _id is generated
});
```

## Alternative: Use toObject() in API

If you can't modify the schema immediately, the API fix I provided uses `project.toObject()` which should preserve the `_id` fields:

```typescript
// Get the plain object to ensure _id is accessible
const projectObj = project.toObject();
const availableList = projectObj.MaterialAvailable || [];
```

This converts the Mongoose document to a plain JavaScript object, which should include all fields including `_id`.

## Verification

After applying the fix, when you query the project, you should see:

```json
{
  "MaterialAvailable": [
    {
      "_id": "691dd5ede36235d711ae1c58",  // ✅ Now present
      "name": "Cement",
      "unit": "bags",
      "qnt": 30,
      "cost": 7500
    }
  ]
}
```

Instead of:

```json
{
  "MaterialAvailable": [
    {
      "_id": undefined,  // ❌ Missing
      "name": "Cement",
      "unit": "bags",
      "qnt": 30
    }
  ]
}
```

# Material Used Tab - Debugging Guide

## Current Status
✅ Mini-sections are loading
❌ Material used data is not showing

## API Analysis

### Material-Usage API (`/api/material-usage`)
**Status**: ✅ Properly implemented with Bearer token

**Expected Request**:
```
GET /api/material-usage?projectId=XXX&clientId=YYY&sectionId=ZZZ&page=1&limit=10
Headers:
  Authorization: Bearer TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "MaterialUsed": [
    {
      "name": "Cement",
      "qnt": 50,
      "unit": "bags",
      "perUnitCost": 400,
      "totalCost": 20000,
      "miniSectionId": "...",
      "miniSectionName": "Base Foundation",
      "sectionId": "...",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

## Debugging Steps

### Step 1: Check Browser/App Console Logs

Look for these log messages in the console:

**Frontend logs** (from `details.tsx`):
```
🔄 Fetching materials - Page: 1, Force Refresh: true
📋 Base params: { projectId, clientId, page, limit, sortBy, sortOrder }
🔧 Used params: { projectId, clientId, sectionId, page, limit, sortBy, sortOrder }
🌐 Used URL: http://domain/api/material-usage?projectId=...&clientId=...&sectionId=...
✅ Used response status: 200
📊 Used data: { success: true, MaterialUsed: [...] }
🔧 Used materials count: X
```

**Backend logs** (from `material-usage/route.ts`):
```
📥 Material Usage GET Request: { projectId, clientId, sectionId, miniSectionId, page, limit }
🔍 Query filter: { "projectDetails.projectId": "...", "mainSectionDetails.sectionId": "..." }
📊 Found mini-sections: X
📦 Total materials used: Y
📄 Paginated materials: Z
✅ Sending response: { materialsCount: Z, totalItems: Y, currentPage: 1, totalPages: 1 }
```

### Step 2: Check Database

**Verify mini-sections exist**:
```javascript
db.minisections.find({
  "projectDetails.projectId": "YOUR_PROJECT_ID",
  "mainSectionDetails.sectionId": "YOUR_SECTION_ID"
})
```

**Verify MaterialUsed array exists**:
```javascript
db.minisections.findOne({
  "projectDetails.projectId": "YOUR_PROJECT_ID",
  "mainSectionDetails.sectionId": "YOUR_SECTION_ID"
}, {
  MaterialUsed: 1,
  name: 1
})
```

### Step 3: Common Issues & Solutions

#### Issue 1: Empty MaterialUsed Array
**Symptom**: API returns `MaterialUsed: []`
**Cause**: No materials have been added to mini-sections yet
**Solution**: Add material usage using the "Add Usage" button

#### Issue 2: Wrong sectionId
**Symptom**: API returns empty array but materials exist
**Cause**: Frontend is sending wrong sectionId parameter
**Check**: 
```typescript
// In details.tsx, check this line:
const usedParams = {
  ...baseParams,
  sectionId: sectionId, // ← Should match the section you're viewing
};
```

#### Issue 3: Mini-sections not linked to section
**Symptom**: Mini-sections load but no materials show
**Cause**: Mini-sections in database don't have correct `mainSectionDetails.sectionId`
**Solution**: Check database:
```javascript
db.minisections.find({
  "mainSectionDetails.sectionId": { $exists: false }
})
// If found, update them with correct sectionId
```

#### Issue 4: Bearer Token Issue
**Symptom**: 401 Unauthorized error
**Cause**: Bearer token not being sent or invalid
**Check**: 
```typescript
// In axiosConfig.ts
const BEARER_TOKEN = 'eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9.';
// Make sure this matches the backend's expected token
```

#### Issue 5: Frontend Not Displaying Data
**Symptom**: API returns data but UI shows "No materials found"
**Cause**: Frontend transformation or filtering issue
**Check**:
```typescript
// In details.tsx, check:
const usedMaterialsArray = usedData.MaterialUsed || usedData.materials || [];
console.log('📦 Used materials array:', usedMaterialsArray);
```

### Step 4: Test API Directly

Use curl to test the API:

```bash
#!/bin/bash
BEARER_TOKEN="eyJhbGciOiJIUIsInRbaDas2344rr308ohagn0wer4XVCJ9."
DOMAIN="http://localhost:3000"
PROJECT_ID="YOUR_PROJECT_ID"
CLIENT_ID="YOUR_CLIENT_ID"
SECTION_ID="YOUR_SECTION_ID"

curl -X GET "$DOMAIN/api/material-usage?projectId=$PROJECT_ID&clientId=$CLIENT_ID&sectionId=$SECTION_ID&page=1&limit=10" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'
```

Expected output:
```json
{
  "success": true,
  "MaterialUsed": [...],
  "pagination": {...}
}
```

### Step 5: Check Frontend Rendering

In `details.tsx`, the "Used Materials" tab should show:

1. **Date groups** (if materials exist):
   ```typescript
   const groupedByDate = getGroupedByDate();
   // Should return array of { date, materials } objects
   ```

2. **Material cards**:
   ```typescript
   <MaterialCardEnhanced
     material={material}
     activeTab="used"
     ...
   />
   ```

## Quick Diagnostic Checklist

- [ ] Backend server is running
- [ ] Frontend app is running with cleared cache
- [ ] Bearer token is correct in `axiosConfig.ts`
- [ ] Project ID, Client ID, and Section ID are valid
- [ ] Mini-sections exist in database for this section
- [ ] Mini-sections have `MaterialUsed` array with data
- [ ] API returns 200 status code
- [ ] API returns `MaterialUsed` array with items
- [ ] Frontend console shows materials count > 0
- [ ] No JavaScript errors in console

## Next Steps

1. **Check Console Logs**: Look for the log messages mentioned above
2. **Check Database**: Verify data exists using MongoDB queries
3. **Test API**: Use curl to test the API directly
4. **Check Network Tab**: In browser DevTools, check the actual API request/response

## Need More Help?

If materials still don't show after checking all above:

1. Share the console logs (both frontend and backend)
2. Share the API response from curl test
3. Share a screenshot of the database query results
4. Share any error messages from the app

---

**Last Updated**: 2025-01-15
**Status**: Debugging in progress

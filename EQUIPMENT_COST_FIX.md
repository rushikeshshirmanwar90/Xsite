# Equipment Cost Not Showing in Report - FIXED

## Problem Summary
Equipment costs were not appearing in the generated PDF reports even though equipment data existed in the database.

## Root Cause
The issue was in the `ReportGenerator.tsx` component where equipment data was being fetched from the API. The code was trying to access the equipment data using an incorrect path:

```typescript
// ❌ INCORRECT - This path doesn't exist in the API response
if (equipmentResponse.data.success && equipmentResponse.data.data && equipmentResponse.data.data.equipment) {
    equipmentData = equipmentResponse.data.data.equipment;
}
```

However, the actual API response structure from `/api/equipment?projectId=xxx` returns:
```typescript
{
  success: true,
  data: [...equipment array...],  // ✅ Equipment array is directly in data field
  message: "Retrieved X equipment entries successfully"
}
```

## Solution Applied
Updated the equipment data fetching logic in `Xsite/components/profile/ReportGenerator.tsx` (around line 310-350) to correctly handle the API response:

```typescript
// ✅ FIXED - Correctly access equipment data from API response
if (equipmentResponse.data.success && equipmentResponse.data.data) {
    const rawEquipmentData = equipmentResponse.data.data;
    
    // Handle both array and object with equipment property
    if (Array.isArray(rawEquipmentData)) {
        equipmentData = rawEquipmentData;
    } else if (rawEquipmentData.equipment && Array.isArray(rawEquipmentData.equipment)) {
        equipmentData = rawEquipmentData.equipment;
    } else {
        console.warn('⚠️ Unexpected equipment data structure:', rawEquipmentData);
        equipmentData = [];
    }
}
```

## Additional Improvements
1. **Better Error Handling**: Added more detailed console logging to help debug equipment data fetching issues
2. **Section Filtering**: Added support for `projectSectionId` field when filtering equipment by sections
3. **Flexible Data Structure**: The fix now handles both direct array responses and nested object structures

## Testing
To verify the fix works:

1. Open the profile page in the Xsite mobile app
2. Click "Generate Complete Report"
3. Select a project that has equipment entries
4. Generate the PDF report
5. Check the console logs for:
   ```
   ✅ Equipment data fetched: X entries
   ✅ Equipment data sample: [...]
   ```
6. Open the generated PDF and verify the "Equipment Costs Summary" section appears with all equipment entries

## Files Modified
- `Xsite/components/profile/ReportGenerator.tsx` - Fixed equipment data fetching logic

## Related Files (No Changes Needed)
- `Xsite/utils/pdfReportGenerator.ts` - PDF generation logic was already correct
- `real-estate-apis/app/api/equipment/route.ts` - API endpoint was working correctly

## API Response Structure Reference
```typescript
// GET /api/equipment?projectId={projectId}
{
  success: true,
  data: [
    {
      _id: "...",
      type: "Excavator",
      category: "Heavy Machinery",
      quantity: 2,
      perUnitCost: 5000,
      totalCost: 10000,
      costType: "rental",
      projectId: "...",
      projectName: "...",
      projectSectionId: "...",
      projectSectionName: "...",
      // ... other fields
    }
  ],
  message: "Retrieved X equipment entries successfully"
}
```

## Summary
The equipment cost was not showing because the code was looking for the data in the wrong place (`response.data.data.equipment`) when it was actually at `response.data.data` (as a direct array). The fix now correctly extracts the equipment array from the API response and passes it to the PDF generator, which already had the correct logic to display equipment costs.

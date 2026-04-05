# Day-Wise Cost Integration - Labor & Equipment

## Summary
Successfully integrated labor and equipment costs into the daily activity sections of the PDF report, replacing the previous separate summary sections at the end.

## Changes Made

### 1. New Helper Methods Added to `pdfReportGenerator.ts`

#### `groupLaborByDate(laborData: any[])`
- Groups labor entries by their date field
- Returns a dictionary with dates as keys and labor arrays as values
- Handles both `date` and `createdAt` fields

#### `groupEquipmentByDate(equipmentData: any[])`
- Groups equipment entries by their date field
- Returns a dictionary with dates as keys and equipment arrays as values
- Handles both `date` and `createdAt` fields

#### `generateLaborHTML(laborEntries: any[])`
- Generates HTML for labor entries within a day
- Shows labor category, type, count, per-labor cost, and total cost
- Includes a day labor total footer
- Styled with 👷 icon and orange/amber color scheme

#### `generateEquipmentHTML(equipmentEntries: any[])`
- Generates HTML for equipment entries within a day
- Shows equipment type, category, quantity, cost type (rental/purchase), per-unit cost, and total cost
- Includes a day equipment total footer
- Styled with 🚜 icon and orange/amber color scheme

### 2. Updated `generateHTML()` Method

#### Date Aggregation
```typescript
// ✅ NEW: Get all unique dates from activities, labor, and equipment
const allDates = new Set([
    ...Object.keys(groupedActivities),
    ...Object.keys(groupedLabor),
    ...Object.keys(groupedEquipment)
]);
const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
```

#### Daily Section Structure
Each day now shows:
1. **Material Activities** (if any) - with 📦 icon
2. **Labor Costs** (if any) - with 👷 icon
3. **Equipment Costs** (if any) - with 🚜 icon
4. **Day Total** - Summary box showing breakdown by cost type

#### Day Total Calculation
```typescript
const dayMaterialTotal = // Sum of imported materials only
const dayLaborTotal = // Sum of all labor costs
const dayEquipmentTotal = // Sum of all equipment costs
const dayTotal = dayMaterialTotal + dayLaborTotal + dayEquipmentTotal;
```

### 3. Removed Separate Summary Sections
- Deleted the "Labor Costs Summary" section that appeared at the end
- Deleted the "Equipment Costs Summary" section that appeared at the end
- Labor and equipment are now integrated day-by-day with materials

## Report Structure (New)

```
┌─────────────────────────────────────┐
│ Header & Company Info               │
├─────────────────────────────────────┤
│ Summary (Total costs overview)      │
├─────────────────────────────────────┤
│ Daily Activity Details              │
│                                     │
│ ┌─ Day 1 (e.g., Monday, Jan 15) ───┐│
│ │ 📦 Material Activities (2)       ││
│ │   - Imported cement              ││
│ │   - Used steel                   ││
│ │                                  ││
│ │ 👷 Labor Costs (3)               ││
│ │   - Mason (5 workers)            ││
│ │   - Helper (10 workers)          ││
│ │   - Electrician (2 workers)      ││
│ │                                  ││
│ │ 🚜 Equipment Costs (1)           ││
│ │   - Excavator (rental)           ││
│ │                                  ││
│ │ Day Total: ₹45,000               ││
│ │   Materials: ₹20,000             ││
│ │   Labor: ₹15,000                 ││
│ │   Equipment: ₹10,000             ││
│ └──────────────────────────────────┘│
│                                     │
│ ┌─ Day 2 (e.g., Tuesday, Jan 16) ──┐│
│ │ ... (similar structure)          ││
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Benefits

1. **Better Context**: See all costs for a specific day in one place
2. **Easier Analysis**: Understand daily spending patterns across all cost types
3. **Cleaner Report**: No need to scroll to the end for labor/equipment summaries
4. **Consistent Structure**: All cost types follow the same day-wise organization

## Data Requirements

For labor and equipment to appear in the correct day:
- Labor entries must have a `date` or `createdAt` field
- Equipment entries must have a `date` or `createdAt` field
- Entries without dates will be skipped (not shown in any day)

## Testing

To verify the changes:

1. Generate a report for a project with:
   - Material activities on multiple days
   - Labor entries on some of those days
   - Equipment entries on some of those days

2. Check that:
   - Each day shows all three cost types (if data exists)
   - Day totals are calculated correctly
   - No separate labor/equipment sections appear at the end
   - The summary at the top still shows correct totals

## Files Modified

- `Xsite/utils/pdfReportGenerator.ts` - Complete restructuring of PDF generation logic

## Example Output

```
Monday, January 15, 2024
3 entries (1 material, 1 labor, 1 equipment)                    ₹35,000

📦 Material Activities (1)
┌─────────────────────────────────────────────────────────┐
│ IMPORTED - John Doe                                     │
│ Cement - 50 bags @ ₹400 = ₹20,000                      │
└─────────────────────────────────────────────────────────┘

👷 Labor Costs (1)
┌─────────────────────────────────────────────────────────┐
│ Mason - Skilled - 5 workers @ ₹500 = ₹2,500            │
│ Day Labor Total: ₹2,500                                 │
└─────────────────────────────────────────────────────────┘

🚜 Equipment Costs (1)
┌─────────────────────────────────────────────────────────┐
│ Excavator - Heavy Machinery - 1 unit (RENTAL)          │
│ @ ₹12,500 = ₹12,500                                    │
│ Day Equipment Total: ₹12,500                            │
└─────────────────────────────────────────────────────────┘

Day Total: ₹35,000
Materials: ₹20,000 • Labor: ₹2,500 • Equipment: ₹12,500
```

## Notes

- Material costs only count "imported" materials (not "used" materials) in totals
- Labor and equipment costs are always counted in full
- The summary section at the top still shows overall totals for the entire period
- Empty days (no activities, labor, or equipment) are not shown in the report

# Material Usage - Test Scenarios

## 🧪 Comprehensive Testing Guide

---

## Test Scenario 1: Basic Material Import & Usage

### Setup
1. Navigate to any project's details page
2. Ensure you're on the "Imported Materials" tab

### Test Steps
1. Click "Add Material" button
2. Fill in the form:
   - Name: "Cement"
   - Quantity: 100
   - Unit: "bags"
   - Per Unit Cost: 500
   - Total Cost: 50000 (auto-calculated)
3. Submit the form

### Expected Results
✅ Material card displays:
- Name: "Cement"
- Quantity: "100 bags"
- Per Unit Cost: "₹500/bag" (NOT ₹50,000/bag)
- Total Cost: "₹50,000"

### Test Usage
1. Click "Add Usage" button at the top
2. Select "Cement" from the dropdown
3. Enter quantity: 10
4. Submit

### Expected Results
✅ Usage recorded successfully:
- Toast message: "1 material usages recorded!"
- Switches to "Used Materials" tab
- Shows usage: 10 bags @ ₹500/bag = ₹5,000 (NOT ₹500,000)
- Available quantity reduced to 90 bags

---

## Test Scenario 2: Multiple Batch Import & Grouping

### Setup
1. Navigate to project details page
2. Clear any existing cement materials (optional)

### Test Steps - Batch 1
1. Add Material:
   - Name: "Cement"
   - Quantity: 100
   - Unit: "bags"
   - Per Unit Cost: 500
   - Specs: Grade: "OPC 43"

### Test Steps - Batch 2
1. Add Material:
   - Name: "Cement"
   - Quantity: 50
   - Unit: "bags"
   - Per Unit Cost: 520
   - Specs: Grade: "OPC 43"

### Expected Results
✅ Materials are grouped together:
- Name: "Cement"
- Total Quantity: "150 bags"
- Total Cost: "₹76,000"
- Average Per Unit: "₹506.67/bag"
- Shows 2 variants in the card

### Test Usage from Grouped Material
1. Click "Add Usage" on the grouped card
2. Select specific variant (e.g., the ₹500/bag batch)
3. Enter quantity: 25
4. Submit

### Expected Results
✅ Usage recorded correctly:
- Cost: 25 × ₹500 = ₹12,500 (NOT 25 × 50,000)
- Remaining in that batch: 75 bags
- Total available: 125 bags (75 + 50)

---

## Test Scenario 3: Insufficient Quantity Error

### Setup
1. Have a material with limited quantity (e.g., 10 bags)

### Test Steps
1. Click "Add Usage"
2. Select the material
3. Enter quantity: 15 (more than available)
4. Submit

### Expected Results
✅ Error handling:
- Backend returns error: "Insufficient quantity available"
- Toast shows error message
- No materials are deducted
- Form remains open for correction

---

## Test Scenario 4: Material with Zero Cost

### Setup
1. Navigate to project details page

### Test Steps
1. Add Material:
   - Name: "Donated Bricks"
   - Quantity: 1000
   - Unit: "pieces"
   - Per Unit Cost: 0
   - Total Cost: 0

### Expected Results
✅ Material imported successfully:
- Displays: "₹0/piece"
- Total: "₹0"
- Warning in console: "No valid cost found for material"

### Test Usage
1. Use 100 pieces
2. Submit

### Expected Results
✅ Usage recorded:
- Cost: 100 × ₹0 = ₹0
- No errors
- Quantity reduced correctly

---

## Test Scenario 5: Material Transfer Between Sections

### Setup
1. Have materials in one mini-section
2. Navigate to another mini-section

### Test Steps
1. In Mini-Section A, import 100 bags cement @ ₹500/bag
2. Switch to Mini-Section B
3. Click "Add Usage"
4. Select cement from Mini-Section A
5. Enter quantity: 20
6. Submit

### Expected Results
✅ Cross-section usage:
- Material used from Mini-Section A
- Usage recorded in Mini-Section B
- Cost: 20 × ₹500 = ₹10,000
- Mini-Section A shows 80 bags remaining
- Mini-Section B shows 20 bags used

---

## Test Scenario 6: Batch Material Usage

### Setup
1. Have multiple different materials available

### Test Steps
1. Click "Add Usage" button
2. Add multiple materials:
   - Cement: 10 bags
   - Steel: 5 tons
   - Bricks: 500 pieces
3. Submit all at once

### Expected Results
✅ Batch processing:
- Toast: "3 material usages recorded!"
- All materials processed correctly
- Each material's cost calculated individually:
  - Cement: 10 × ₹500 = ₹5,000
  - Steel: 5 × ₹50,000 = ₹250,000
  - Bricks: 500 × ₹10 = ₹5,000
- Total: ₹260,000
- All quantities reduced correctly

---

## Test Scenario 7: Material with Specifications

### Setup
1. Import materials with different specifications

### Test Steps
1. Add Material - Cement OPC 43:
   - Name: "Cement"
   - Quantity: 100
   - Unit: "bags"
   - Per Unit Cost: 500
   - Specs: { grade: "OPC 43", brand: "UltraTech" }

2. Add Material - Cement PPC:
   - Name: "Cement"
   - Quantity: 80
   - Unit: "bags"
   - Per Unit Cost: 480
   - Specs: { grade: "PPC", brand: "ACC" }

### Expected Results
✅ Separate material cards:
- Card 1: "Cement (OPC 43, UltraTech)" - 100 bags @ ₹500
- Card 2: "Cement (PPC, ACC)" - 80 bags @ ₹480
- NOT grouped together (different specs)

### Test Usage
1. Use 20 bags from OPC 43
2. Use 15 bags from PPC

### Expected Results
✅ Correct specification tracking:
- OPC 43: 80 bags remaining, cost ₹10,000
- PPC: 65 bags remaining, cost ₹7,200
- Each tracked separately

---

## Test Scenario 8: Pagination with Many Materials

### Setup
1. Import more than 7 materials (pagination limit)

### Test Steps
1. Import 15 different materials
2. Check pagination controls

### Expected Results
✅ Pagination works:
- Page 1 shows 7 materials
- Page 2 shows 7 materials
- Page 3 shows 1 material
- Navigation buttons work correctly
- Costs display correctly on all pages

---

## Test Scenario 9: Material Usage After Section Completion

### Setup
1. Have materials available in a section
2. Mark the section as completed

### Test Steps
1. Click "Mark as Complete" button
2. Try to click "Add Usage"

### Expected Results
✅ Completion blocking:
- "Add Usage" button is disabled
- Tooltip: "Section is completed"
- Cannot add usage to completed sections
- Must reopen section first

---

## Test Scenario 10: Cost Consistency Across Views

### Setup
1. Import material: 100 bags @ ₹500/bag

### Test Steps
1. Check "Imported Materials" tab
2. Use 30 bags
3. Check "Used Materials" tab
4. Check material analytics page
5. Check project financial report

### Expected Results
✅ Consistent costs everywhere:
- Imported tab: 70 bags @ ₹500/bag = ₹35,000
- Used tab: 30 bags @ ₹500/bag = ₹15,000
- Analytics: Shows ₹15,000 spent on cement
- Report: Total material cost includes ₹15,000
- NO discrepancies between views

---

## 🔍 Edge Cases to Test

### Edge Case 1: Decimal Quantities
- Import: 10.5 tons steel @ ₹50,000/ton
- Use: 2.3 tons
- Expected: Cost = 2.3 × ₹50,000 = ₹115,000

### Edge Case 2: Very Large Quantities
- Import: 10,000 bags @ ₹500/bag
- Use: 5,000 bags
- Expected: Cost = 5,000 × ₹500 = ₹2,500,000
- No overflow errors

### Edge Case 3: Very Small Costs
- Import: 1000 pieces @ ₹0.50/piece
- Use: 100 pieces
- Expected: Cost = 100 × ₹0.50 = ₹50
- Proper decimal handling

### Edge Case 4: Material Not Found
- Try to use a material that was deleted
- Expected: Error message "Material(s) not found"
- No API call made

### Edge Case 5: Network Failure
- Disconnect network
- Try to add usage
- Expected: Timeout error with clear message
- Loading animation stops

---

## 📊 Performance Tests

### Performance Test 1: Large Material List
- Import 100+ materials
- Check page load time
- Expected: < 2 seconds

### Performance Test 2: Batch Usage
- Use 20 materials at once
- Check processing time
- Expected: < 5 seconds

### Performance Test 3: Pagination
- Navigate through 10+ pages
- Check response time
- Expected: < 1 second per page

---

## ✅ Acceptance Criteria

All tests must pass with these criteria:

1. **Cost Accuracy**
   - ✅ Per-unit costs display correctly
   - ✅ Total costs calculate correctly
   - ✅ No inflated or deflated values

2. **Quantity Tracking**
   - ✅ Available quantities reduce correctly
   - ✅ Used quantities record correctly
   - ✅ No negative quantities

3. **Error Handling**
   - ✅ Clear error messages
   - ✅ No silent failures
   - ✅ Proper validation

4. **User Experience**
   - ✅ Smooth animations
   - ✅ Clear feedback
   - ✅ Intuitive interface

5. **Data Consistency**
   - ✅ Same costs across all views
   - ✅ Accurate financial reports
   - ✅ Reliable analytics

---

## 🐛 Known Issues (Pre-Fix)

These issues should be RESOLVED after the fix:

- ❌ Material costs showing 100x too high
- ❌ Usage calculations incorrect
- ❌ Grouped materials showing wrong totals
- ❌ Financial reports inflated

---

## 🎯 Post-Fix Verification

After applying the fix, verify:

1. ✅ All test scenarios pass
2. ✅ No console errors
3. ✅ Costs match expected values
4. ✅ User feedback is positive
5. ✅ Financial reports are accurate

---

## 📝 Test Report Template

```
Test Date: ___________
Tester: ___________
Environment: ___________

Scenario 1: Basic Import & Usage
- Status: [ ] Pass [ ] Fail
- Notes: ___________

Scenario 2: Multiple Batch Import
- Status: [ ] Pass [ ] Fail
- Notes: ___________

[... continue for all scenarios ...]

Overall Result: [ ] All Pass [ ] Some Failures
Issues Found: ___________
Recommendations: ___________
```

---

## 🚀 Automated Testing (Future)

Consider adding automated tests for:

1. Unit tests for cost calculations
2. Integration tests for API calls
3. E2E tests for user workflows
4. Performance tests for large datasets

---

**Testing Guide Version:** 1.0
**Last Updated:** March 24, 2026
**Status:** Ready for Testing

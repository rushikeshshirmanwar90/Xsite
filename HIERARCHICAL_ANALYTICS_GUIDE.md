# Hierarchical Analytics System - Complete Guide

## 📊 Overview

A 4-level drill-down analytics system that provides detailed financial insights from projects down to individual materials.

## 🎯 Navigation Hierarchy

```
Level 1: All Projects (Dashboard)
   ↓ (tap project)
Level 2: Project Sections
   ↓ (tap section)
Level 3: Mini-Sections
   ↓ (tap mini-section)
Level 4: Materials List
```

---

## 📁 File Structure

```
app/
├── (tabs)/
│   └── dashboard.tsx                    # Level 1: All Projects
└── analytics/
    ├── project-sections-analytics.tsx   # Level 2: Sections
    ├── mini-sections-analytics.tsx      # Level 3: Mini-Sections
    └── materials-analytics.tsx          # Level 4: Materials
```

---

## 🔄 Level 1: All Projects Dashboard

**File**: `app/(tabs)/dashboard.tsx`

### Features
- Displays all projects with material expenses
- Interactive pie chart showing expense distribution
- Pull-to-refresh functionality
- Statistics: Ongoing, Completed, Total projects

### Data Calculation
```typescript
// Calculates total expenses from MaterialAvailable
projectExpense = Sum of (material.cost) for all materials
```

### Navigation
```typescript
// Tapping a project navigates to Level 2
router.push({
  pathname: '/analytics/project-sections-analytics',
  params: {
    projectId, projectName, sections,
    materialAvailable, materialUsed
  }
});
```

### UI States
- **Loading**: Spinner with "Loading projects..."
- **Error**: Error icon + message + Retry button
- **Empty**: "No Project Data" message
- **Success**: Pie chart + legend + stats

---

## 🔄 Level 2: Project Sections Analytics

**File**: `app/analytics/project-sections-analytics.tsx`

### Features
- Shows expense breakdown by project sections
- Pie chart with section-wise distribution
- Breadcrumb: Project Name
- Statistics: Active sections, Total expenses

### Data Calculation
```typescript
// Filters MaterialUsed by sectionId
sectionExpense = Sum of materials where:
  material.sectionId === section._id
```

### Navigation
```typescript
// Tapping a section navigates to Level 3
router.push({
  pathname: '/analytics/mini-sections-analytics',
  params: {
    projectId, projectName, sectionId,
    sectionName, materialUsed
  }
});
```

### Key Logic
- Filters `MaterialUsed` by `sectionId`
- Only shows sections with expenses > 0
- Calculates percentage of total project expense

---

## 🔄 Level 3: Mini-Sections Analytics

**File**: `app/analytics/mini-sections-analytics.tsx`

### Features
- Shows expense breakdown by mini-sections
- Pie chart with mini-section distribution
- Breadcrumb: Project → Section
- Statistics: Active mini-sections, Total expenses

### Data Calculation
```typescript
// Fetches mini-sections using getSection(sectionId)
// Filters MaterialUsed by miniSectionId
miniSectionExpense = Sum of materials where:
  material.miniSectionId === miniSection._id
```

### Navigation
```typescript
// Tapping a mini-section navigates to Level 4
router.push({
  pathname: '/analytics/materials-analytics',
  params: {
    projectId, projectName, sectionId, sectionName,
    miniSectionId, miniSectionName, materialUsed
  }
});
```

### Key Logic
- Fetches mini-sections from API: `getSection(sectionId)`
- Filters `MaterialUsed` by `miniSectionId`
- Only shows mini-sections with expenses > 0

---

## 🔄 Level 4: Materials List

**File**: `app/analytics/materials-analytics.tsx`

### Features
- Lists all materials used in the mini-section
- Material cards with details (name, quantity, cost, specs)
- Breadcrumb: Project → Section → Mini-Section
- Total expense card at top

### Data Display
```typescript
// Shows materials filtered by miniSectionId
materials = MaterialUsed.filter(
  m => m.miniSectionId === miniSectionId
)
```

### Material Card Shows
- Material icon (dynamic based on name)
- Material name
- Quantity + Unit
- Total cost
- Specifications (if available)
- Date added

### Key Features
- Color-coded material icons
- Expandable specifications
- Date information
- Total expense summary

---

## 📊 Data Flow

### 1. Dashboard (Level 1)
```
Fetch Projects → Calculate Expenses → Display Pie Chart
                                           ↓
                                    User taps project
                                           ↓
                              Navigate to Level 2 with data
```

### 2. Project Sections (Level 2)
```
Receive sections + materialUsed → Filter by sectionId → Display Pie Chart
                                                              ↓
                                                      User taps section
                                                              ↓
                                                Navigate to Level 3 with data
```

### 3. Mini-Sections (Level 3)
```
Fetch mini-sections → Filter materialUsed by miniSectionId → Display Pie Chart
                                                                   ↓
                                                          User taps mini-section
                                                                   ↓
                                                      Navigate to Level 4 with data
```

### 4. Materials (Level 4)
```
Filter materialUsed by miniSectionId → Display Material Cards
```

---

## 🎨 UI Components Used

### Common Components
- `PieChart` - Interactive pie chart with animations
- `PieChartLegend` - Clickable legend with percentages
- `Ionicons` - Icons throughout the app
- `ActivityIndicator` - Loading states
- `SafeAreaView` - Safe area handling

### Custom Styling
- Consistent color scheme across levels
- Breadcrumb navigation
- Statistics cards with borders
- Material cards with icons
- Empty/Error/Loading states

---

## 🔧 Key Functions

### formatCurrency(amount)
```typescript
// Formats currency with Indian notation
₹1,50,000 → ₹1.5L
₹1,00,00,000 → ₹1.0Cr
```

### calculateExpenses()
```typescript
// Sums up material costs
total = materials.reduce((sum, m) => sum + m.cost, 0)
```

### getMaterialIcon(name)
```typescript
// Returns appropriate icon based on material name
'cement' → 'cube-outline'
'steel' → 'barbell-outline'
'paint' → 'color-palette-outline'
```

---

## 📱 User Journey Example

```
1. User opens Dashboard
   → Sees: "Project A: ₹15L, Project B: ₹17L"
   
2. User taps "Project A"
   → Navigates to Project Sections
   → Sees: "Foundation: ₹8L, Structure: ₹7L"
   
3. User taps "Foundation"
   → Navigates to Mini-Sections
   → Sees: "Base: ₹4L, Plinth: ₹4L"
   
4. User taps "Base"
   → Navigates to Materials
   → Sees: "Cement: ₹2L, Steel: ₹1.5L, Sand: ₹0.5L"
```

---

## 🎯 Data Requirements

### MaterialUsed Structure
```typescript
{
  _id: string;
  name: string;
  qnt: number;
  unit: string;
  cost: number;              // Total cost (not unit price)
  sectionId: string;         // Main section ID
  miniSectionId: string;     // Mini-section ID
  specs: Record<string, any>;
  addedAt?: string;
  createdAt?: string;
}
```

### Project Structure
```typescript
{
  _id: string;
  name: string;
  section: ProjectSection[];
  MaterialAvailable: MaterialItem[];
  MaterialUsed: MaterialItem[];
}
```

---

## ✅ Features Checklist

### Level 1 (Dashboard)
- [x] Fetch all projects
- [x] Calculate expenses from MaterialAvailable
- [x] Display pie chart
- [x] Pull-to-refresh
- [x] Loading/Error/Empty states
- [x] Navigate to Level 2

### Level 2 (Sections)
- [x] Filter MaterialUsed by sectionId
- [x] Display section expenses
- [x] Pie chart with sections
- [x] Breadcrumb navigation
- [x] Navigate to Level 3

### Level 3 (Mini-Sections)
- [x] Fetch mini-sections from API
- [x] Filter MaterialUsed by miniSectionId
- [x] Display mini-section expenses
- [x] Pie chart with mini-sections
- [x] Breadcrumb navigation
- [x] Navigate to Level 4

### Level 4 (Materials)
- [x] Display material cards
- [x] Show specifications
- [x] Material icons
- [x] Total expense summary
- [x] Breadcrumb navigation

---

## 🚀 Testing Guide

### Test Level 1
1. Open dashboard
2. Verify projects load
3. Check expense calculations
4. Tap a project slice
5. Verify navigation to Level 2

### Test Level 2
1. Verify sections display
2. Check expense totals match
3. Tap a section slice
4. Verify navigation to Level 3

### Test Level 3
1. Verify mini-sections load
2. Check expense calculations
3. Tap a mini-section slice
4. Verify navigation to Level 4

### Test Level 4
1. Verify materials display
2. Check total expense
3. Verify material details
4. Test back navigation

---

## 🎨 Color Scheme

```typescript
Primary: #3B82F6 (Blue)
Success: #10B981 (Green)
Warning: #F59E0B (Orange)
Error: #EF4444 (Red)
Gray: #64748B

Stat Cards:
- Primary: #5DADE2 (Light Blue)
- Secondary: #EC7063 (Coral)
- Tertiary: #F39C12 (Orange)
```

---

## 📝 Notes

- All expenses are calculated from `MaterialUsed` data
- Only items with expenses > 0 are shown in charts
- Back navigation works at all levels
- Breadcrumbs show current location
- Pull-to-refresh only on Level 1
- All data passed via route params (no global state)

---

## 🔮 Future Enhancements

1. **Export**: PDF/Excel export at each level
2. **Filters**: Date range, material type filters
3. **Comparison**: Compare sections/mini-sections
4. **Trends**: Show expense trends over time
5. **Alerts**: Budget threshold notifications
6. **Search**: Search materials across levels
7. **Sorting**: Sort by expense, name, date

---

**Status**: ✅ Complete and Ready for Testing
**Last Updated**: November 11, 2025

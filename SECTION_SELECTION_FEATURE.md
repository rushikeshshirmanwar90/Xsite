# Section Selection Feature for Report Generator

## Overview
Added section selection functionality to the Report Generator component. When a project has **multiple sections (2 or more)**, users can now select specific sections (or all sections) to include in the generated report.

## Critical Behavior: Section Filtering Logic

### Material Imported (Project-Wide)
- ✅ **NOT filtered by sections**
- Material imports are tracked at the project level
- All imported materials appear in the report regardless of section selection
- Rationale: Materials are purchased for the entire project, not specific sections

### Material Used (Section-Specific)
- ✅ **Filtered by selected sections**
- Only material usage from selected sections appears in the report
- Allows tracking which sections consumed which materials
- Rationale: Material consumption happens in specific construction areas/sections

### Labor & Equipment
- ✅ **Filtered by selected sections** (client-side)
- Labor and equipment costs are filtered to match selected sections
- Provides accurate cost breakdown per section

## Key Behavior
- **Single Section Projects**: Section filter is hidden, report includes the single section automatically
- **Multiple Section Projects**: Section filter appears, allowing users to select which sections to include

## Changes Made

### 1. New Interfaces
- Added `Section` interface with fields: `_id`, `sectionId`, `name`, `miniSections`
- Added `MiniSection` interface with fields: `_id`, `name`
- Updated `Project` interface to include optional `section` array

### 2. New State Variables
- `selectedSections: string[]` - Tracks which sections are selected
- `showSectionSelector: boolean` - Controls section selector visibility (for future modal implementation)
- `projectSections: Section[]` - Stores sections for the currently selected project

### 3. New Functions

#### `fetchProjectSections(projectId: string)`
- Fetches sections for a specific project from the API
- Auto-selects all sections by default
- Called when a project is selected

#### `handleProjectSelection(projectId: string)`
- Handles project selection
- Automatically fetches sections for the selected project

#### `toggleSectionSelection(sectionId: string)`
- Toggles individual section selection on/off

#### `toggleAllSections()`
- Selects or deselects all sections at once

#### `getSectionSelectionText()`
- Returns user-friendly text describing current section selection
- Examples: "All sections selected", "3 of 5 sections selected", "No sections selected"

### 4. Updated Functions

#### `generateReport()`
- Added validation: If project has sections and none are selected, shows alert
- Passes `sectionIds` parameter to API when sections are selected
- Filters labor and equipment data by selected sections
- Updates report title to include section names when specific sections are selected
- Enhanced error messages to mention sections

### 5. New UI Components

#### Section Filter Section
- Only displays when the selected project has sections
- Shows section count and selection status
- Includes "Select All" / "Deselect All" button
- Lists all sections with:
  - Section name
  - Mini-section count (if applicable)
  - Checkbox indicator (filled for selected, outline for unselected)
  - Purple theme to distinguish from project selection

#### Section Selection Info Bar
- Blue info bar showing current selection status
- Updates dynamically as sections are selected/deselected

### 6. Updated Preview Section
- Now shows selected sections information
- Displays section selection summary in the report preview

### 7. New Styles
- `sectionHeader` - Header with title and select all button
- `selectAllButton` - Button to select/deselect all sections
- `selectAllText` - Text styling for select all button
- `sectionSelectionInfo` - Info bar styling
- `sectionSelectionInfoText` - Info text styling
- `sectionButtons` - Container for section buttons
- `sectionButton` - Individual section button
- `sectionButtonActive` - Active state for selected sections
- `sectionButtonLeft` - Left side of section button
- `sectionButtonIcon` - Icon container for sections
- `sectionButtonText` - Text container for sections
- `sectionButtonLabel` - Section name label
- `sectionButtonLabelActive` - Active state for section label
- `sectionButtonDescription` - Mini-section count description

## User Experience Flow

1. User opens Report Generator
2. User selects a project
3. **If project has 2+ sections:**
   - Section filter appears automatically
   - All sections are pre-selected by default
   - User can deselect specific sections or use "Select All" toggle
4. **If project has 0 or 1 section:**
   - Section filter is hidden
   - Report automatically includes all data (no filtering needed)
5. User configures date range and other filters
6. User clicks "Generate PDF"
7. **If multiple sections exist and none are selected:**
   - Alert prompts user to select at least one section
8. Report is generated with data filtered by selected sections (if applicable)
9. Report title includes section names if specific sections were selected from a multi-section project

## API Integration

The report generator now sends section IDs to the backend:
```
GET /api/material-activity-report?clientId=...&projectId=...&sectionIds=section1&sectionIds=section2
```

### Backend Section Filtering Logic (API)
The API applies section filtering with the following rules:

1. **Fetch all activities** matching clientId, date range, and projectId
2. **Separate activities** into imported and used
3. **Keep ALL imported activities** (no section filtering)
4. **Filter ONLY used activities** by sectionId or miniSectionId
5. **Combine results**: All imported + Filtered used activities

```typescript
// Pseudo-code
if (sectionIds provided) {
  importedActivities = activities.filter(a => a.activity === 'imported')
  usedActivities = activities.filter(a => a.activity === 'used')
  
  filteredUsedActivities = usedActivities.filter(a => 
    sectionIds.includes(a.sectionId) || 
    sectionIds.includes(a.miniSectionId)
  )
  
  finalActivities = [...importedActivities, ...filteredUsedActivities]
}
```

### Client-Side Filtering
Labor and equipment data are filtered client-side by `sectionId` or `miniSectionId` fields:
- Only applied when multiple sections exist
- Only applied when specific sections are selected (not all)
- Filters both labor entries and equipment entries

## Visual Design

- Section selector uses purple theme (#8B5CF6) to distinguish from project selector (blue)
- Selected sections show filled checkmark icon
- Unselected sections show outline circle icon
- **Purple info box** explains that material imports are project-wide (not filtered)
- Blue info bar provides clear feedback on selection status
- Compact design fits well in the modal layout

## Example Report Scenarios

### Scenario 1: All Sections Selected
- User selects all sections (or project has only 1 section)
- Report includes:
  - ✅ All imported materials (project-wide)
  - ✅ All used materials (all sections)
  - ✅ All labor costs (all sections)
  - ✅ All equipment costs (all sections)

### Scenario 2: Specific Sections Selected (e.g., "First Floor" and "Second Floor")
- User selects 2 out of 5 sections
- Report includes:
  - ✅ All imported materials (project-wide, not filtered)
  - ✅ Used materials from First Floor and Second Floor only
  - ✅ Labor costs from First Floor and Second Floor only
  - ✅ Equipment costs from First Floor and Second Floor only
- Report title: "My Project - First Floor, Second Floor"

### Scenario 3: Single Section Project
- Project has only 1 section
- Section filter is hidden (no selection needed)
- Report includes all data from that section
- Behaves like "All Sections Selected" scenario

## Future Enhancements

- Add mini-section level selection (nested checkboxes)
- Add search/filter for projects with many sections
- Save section preferences per project
- Add section-based cost breakdown in the report

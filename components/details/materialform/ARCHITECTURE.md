# Material Form Architecture

## Component Hierarchy

```
MaterialFormModal (Main Container)
│
├── ProgressIndicator
│   └── Shows current step (1 or 2)
│
├── Animated.View (Horizontal Slider)
│   │
│   ├── Step 1: AddMaterialsStep
│   │   ├── FormHeader (with close button)
│   │   ├── AddedMaterialsList
│   │   │   └── Material cards with edit/delete
│   │   ├── MaterialTemplateSelector
│   │   │   └── Horizontal scroll of templates
│   │   ├── MaterialDetailsForm
│   │   │   ├── Material Name input
│   │   │   ├── Unit dropdown
│   │   │   └── Quantity input
│   │   ├── MaterialSpecifications
│   │   │   ├── Dynamic spec fields
│   │   │   ├── Custom specs list
│   │   │   └── Add Spec button
│   │   └── Add Material button
│   │
│   └── Step 2: ReviewPurposeStep
│       ├── FormHeader (with close button)
│       ├── Materials Summary
│       │   └── Material cards (read-only)
│       ├── Purpose Section
│       │   └── Multi-line text input
│       └── Back button
│
├── Floating Action Button (conditional)
│   ├── "Next: Review Materials →" (Step 1)
│   └── "📤 Send Material Request" (Step 2)
│
└── CustomSpecModal (overlay)
    ├── Spec Name input
    ├── Spec Value input
    └── Add button
```

## Data Flow

```
User Action → MaterialFormModal (State) → Child Components (Props)
                     ↓
              State Updates
                     ↓
         Re-render Child Components
```

## State Management

All state is managed in `MaterialFormModal.tsx`:

- `currentStep`: 0 or 1 (which step is visible)
- `addedMaterials`: Array of materials added
- `formData`: Current material being edited/added
- `customSpecs`: Custom specifications for current material
- `selectedTemplateKey`: Which template is selected
- `editingMaterialIndex`: Index of material being edited (null if adding new)
- `purposeMessage`: Purpose text from Step 2
- `slideAnim`: Animation value for horizontal slide
- `showSpecDropdown`: Which dropdown is open
- `showUnitDropdown`: Unit dropdown state
- `showAddSpecModal`: Custom spec modal visibility

## Animation Flow

### Step 1 → Step 2 (Next)
```
User clicks "Next" button
    ↓
Validate: at least 1 material added
    ↓
Animate slideAnim: 0 → -SCREEN_WIDTH (300ms)
    ↓
Set currentStep: 1
    ↓
Show "Send Request" button
```

### Step 2 → Step 1 (Back)
```
User clicks "Back" button
    ↓
Animate slideAnim: -SCREEN_WIDTH → 0 (300ms)
    ↓
Set currentStep: 0
    ↓
Show "Next" button
```

## Key Features

### 1. Template Selection
- Pre-defined material types
- Auto-fills name, unit, and spec fields
- Visual active state

### 2. Dynamic Specifications
- Spec fields based on selected template
- Support for select, number, and text types
- Custom specs can be added anytime

### 3. Material Editing
- Click edit icon on any added material
- Form populates with material data
- Update button replaces add button
- Visual highlight on editing material

### 4. Validation
- Required fields: name, unit, quantity
- Step 1 → 2: Must have at least 1 material
- Step 2 submit: Purpose message required

### 5. Clean State Management
- Reset form after adding material
- Clear all state on modal close
- Preserve materials when navigating between steps

## Styling Strategy

### Shared Styles (`styles.ts`)
- Common form elements
- Input fields
- Dropdowns
- Section containers

### Component-Specific Styles
- Each component has its own StyleSheet
- Only styles unique to that component
- Imports shared styles when needed

### Color Palette
- Primary: `#3B82F6` (Blue)
- Success: `#10B981` (Green)
- Background: `#F8FAFC` (Light Gray)
- Text Primary: `#1E293B` (Dark Gray)
- Text Secondary: `#64748B` (Medium Gray)
- Border: `#E2E8F0` (Light Border)

## Performance Optimizations

1. **Native Driver**: Animations use `useNativeDriver: true`
2. **Modular Components**: Small, focused components
3. **Minimal Re-renders**: State updates only affect relevant components
4. **ScrollView Refs**: Smooth scrolling to bottom when adding materials
5. **Conditional Rendering**: Only render visible step

## Future Enhancements

- [ ] Add material search/filter
- [ ] Save draft materials locally
- [ ] Material history/favorites
- [ ] Barcode scanner integration
- [ ] Photo attachment for materials
- [ ] Bulk import from CSV
- [ ] Material cost estimation

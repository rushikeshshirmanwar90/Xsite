# Visual Guide

## UI Flow

### Step 1: Add Materials

```
┌─────────────────────────────────────────┐
│  ①  ━━━━━━━━━━  ②                      │ ← Progress Indicator
│  Add Materials    Review & Purpose      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Add Material Entries              ✕    │ ← Header
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Added Materials (2)                    │
│  ┌───────────────────────────────────┐  │
│  │ ✓ Steel Rod                  ✏️ 🗑️ │  │
│  │   100 kg                           │  │
│  │   Specifications:                  │  │
│  │   • grade: A                       │  │
│  │   • diameter: 12mm                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ✓ Brick                      ✏️ 🗑️ │  │
│  │   500 pieces                       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Quick Select Material Type             │
│  ┌──────────┐ ┌──────┐ ┌────────┐      │
│  │Steel Rod │ │ Brick│ │ Cement │      │
│  └──────────┘ └──────┘ └────────┘      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Material Details                       │
│                                         │
│  Material Name *                        │
│  ┌───────────────────────────────────┐  │
│  │ e.g., Steel Rod, Brick            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Unit *                                 │
│  ┌───────────────────────────────────┐  │
│  │ Select Unit                    ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Quantity *                             │
│  ┌───────────────────────────────────┐  │
│  │ Enter quantity                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Material Specifications    + Add Spec  │
│                                         │
│  Grade                                  │
│  ┌───────────────────────────────────┐  │
│  │ Select Grade                   ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Diameter                               │
│  ┌───────────────────────────────────┐  │
│  │ Enter diameter in mm              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        + Add Material                   │
└─────────────────────────────────────────┘

┌═════════════════════════════════════════┐
║  Next: Review 2 Materials →             ║ ← Floating Button
└═════════════════════════════════════════┘
```

### Animation Transition

```
Step 1                    Step 2
┌─────┐                  ┌─────┐
│     │  ──────────────> │     │
│  1  │   Right Swipe    │  2  │
│     │  <────────────── │     │
└─────┘   Left Swipe     └─────┘
```

### Step 2: Review & Purpose

```
┌─────────────────────────────────────────┐
│  ①  ━━━━━━━━━━  ②                      │ ← Progress Indicator
│  Add Materials    Review & Purpose      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Review & Purpose                  ✕    │ ← Header
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📦 Materials Summary                   │
│  2 Materials Added                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ #1  Steel Rod                     │  │
│  │ ─────────────────────────────────│  │
│  │ Quantity:              100 kg     │  │
│  │ Specifications:                   │  │
│  │ • grade: A                        │  │
│  │ • diameter: 12mm                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ #2  Brick                         │  │
│  │ ─────────────────────────────────│  │
│  │ Quantity:              500 pieces │  │
│  │ Specifications:                   │  │
│  │ • type: Red                       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  💬 What are these materials needed for?│
│  Please describe the purpose or project │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ e.g., Construction of residential │  │
│  │ building, Renovation project...   │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ← Back to Edit Materials               │
└─────────────────────────────────────────┘

┌═════════════════════════════════════════┐
║  📤 Send Material Request               ║ ← Floating Button
└═════════════════════════════════════════┘
```

## Color Scheme

```
Primary Blue:     #3B82F6  ████████
Success Green:    #10B981  ████████
Background:       #F8FAFC  ████████
Text Primary:     #1E293B  ████████
Text Secondary:   #64748B  ████████
Border:           #E2E8F0  ████████
Error Red:        #EF4444  ████████
```

## Component States

### Material Card - Normal
```
┌───────────────────────────────────┐
│ ✓ Steel Rod                  ✏️ 🗑️ │
│   100 kg                           │
└───────────────────────────────────┘
```

### Material Card - Editing
```
┌───────────────────────────────────┐ ← Blue border
│ ✏️ Steel Rod                  ✏️ 🗑️ │ ← Blue background
│   100 kg                           │
└───────────────────────────────────┘
```

### Dropdown - Closed
```
┌───────────────────────────────────┐
│ Select Unit                    ▼  │
└───────────────────────────────────┘
```

### Dropdown - Open
```
┌───────────────────────────────────┐
│ Select Unit                    ▲  │
└───────────────────────────────────┘
┌───────────────────────────────────┐
│ kg                                │
│ meter                             │
│ sqmm                              │
│ pieces                            │
│ sheets                            │
│ cubic_meter                       │
│ bags                              │
└───────────────────────────────────┘
```

## Responsive Behavior

### Mobile Portrait
- Full width forms
- Stacked buttons
- Scrollable content
- Floating action buttons

### Mobile Landscape
- Same as portrait
- More vertical scrolling

### Tablet
- Centered modal
- Max width constraints
- Better spacing

## Animations

### Slide Animation
```
Duration: 300ms
Easing: Default
Native Driver: Yes (60 FPS)

Frame 0ms:   [Step 1]
Frame 100ms: [Step 1][Step 2]
Frame 200ms:    [Step 1][Step 2]
Frame 300ms:          [Step 2]
```

### Button Press
```
Active Opacity: 0.7-0.8
Feedback: Immediate
```

### Modal Open/Close
```
Animation: Slide from bottom
Duration: Default
```

## Accessibility

- ✅ Proper label associations
- ✅ Touch target sizes (44x44 minimum)
- ✅ Color contrast ratios
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Error messages clearly visible

## Best Practices Applied

1. **Visual Hierarchy**: Clear distinction between sections
2. **Consistency**: Uniform spacing and styling
3. **Feedback**: Visual states for all interactions
4. **Clarity**: Clear labels and placeholders
5. **Efficiency**: Quick select templates
6. **Safety**: Confirmation before destructive actions
7. **Flexibility**: Custom specifications support
8. **Progress**: Clear indication of current step

---

This visual guide helps understand the UI flow and component states! 🎨

# Quick Start Guide

## Installation

The components are already set up in your project at:
```
components/details/materialform/
```

## Basic Usage

### 1. Import the Component

```tsx
import MaterialFormModal from '@/components/details/materialform';
// or
import { MaterialFormModal } from '@/components/details/materialform';
```

### 2. Add to Your Component

```tsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import MaterialFormModal from '@/components/details/materialform';

function MyScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSubmit = (materials) => {
    console.log('Submitted materials:', materials);
    // Do something with the materials
    // materials is an array of: { name, unit, quantity, specs }
  };

  return (
    <View>
      <Button 
        title="Add Materials" 
        onPress={() => setIsModalVisible(true)} 
      />

      <MaterialFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | boolean | Yes | Controls modal visibility |
| `onClose` | () => void | Yes | Called when user closes modal |
| `onSubmit` | (materials: any[]) => void | Yes | Called when user submits materials |

## Material Data Structure

When `onSubmit` is called, you receive an array of materials:

```typescript
[
  {
    name: "Steel Rod",
    unit: "kg",
    quantity: 100,
    specs: {
      grade: "A",
      diameter: "12mm"
    }
  },
  {
    name: "Brick",
    unit: "pieces",
    quantity: 500,
    specs: {
      type: "Red"
    }
  }
]
```

## Customization

### Add New Material Templates

Edit `components/details/materialform/constants.ts`:

```typescript
export const MATERIAL_TEMPLATES: Record<string, MaterialTemplate> = {
  // Existing templates...
  
  // Add your new template
  sand: {
    name: 'Sand',
    unit: 'cubic_meter',
    icon: 'beach',
    specFields: ['type', 'grade']
  },
};
```

### Add New Specification Fields

Edit `components/details/materialform/constants.ts`:

```typescript
export const SPEC_FIELD_CONFIG: Record<string, SpecFieldConfig> = {
  // Existing fields...
  
  // Add your new field
  color: {
    label: 'Color',
    type: 'select',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
    placeholder: 'Select color'
  },
};
```

### Modify Styles

Edit `components/details/materialform/styles.ts` for shared styles, or edit individual component files for component-specific styles.

## User Flow

1. **User opens modal** → Sees Step 1 (Add Materials)
2. **User selects template** (optional) → Form auto-fills
3. **User fills material details** → Name, unit, quantity
4. **User adds specifications** (optional) → Dynamic or custom specs
5. **User clicks "Add Material"** → Material added to list
6. **User repeats 2-5** for more materials
7. **User clicks "Next"** → Smooth animation to Step 2
8. **User reviews materials** → Sees all added materials
9. **User enters purpose** → Why these materials are needed
10. **User clicks "Send Request"** → `onSubmit` called with data

## Features

✅ Two-step process with smooth animations  
✅ Quick select material templates  
✅ Dynamic specifications based on material type  
✅ Custom specifications support  
✅ Edit and delete added materials  
✅ Visual progress indicator  
✅ Form validation  
✅ Beautiful, clean UI  
✅ Fully typed with TypeScript  
✅ Modular and maintainable  

## Troubleshooting

### Modal doesn't open
- Check that `visible` prop is set to `true`
- Verify the component is properly imported

### Submit not working
- Ensure `onSubmit` callback is provided
- Check console for validation errors
- Verify at least one material is added
- Ensure purpose message is filled

### Styles look wrong
- Check if you have conflicting global styles
- Verify React Native version compatibility
- Clear cache and rebuild

## Examples

### With Custom Validation

```tsx
const handleSubmit = (materials) => {
  // Custom validation
  if (materials.length > 10) {
    Alert.alert('Error', 'Maximum 10 materials allowed');
    return;
  }
  
  // Process materials
  saveMaterials(materials);
  setIsModalVisible(false);
};
```

### With API Integration

```tsx
const handleSubmit = async (materials) => {
  try {
    const response = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materials })
    });
    
    if (response.ok) {
      Alert.alert('Success', 'Materials submitted!');
      setIsModalVisible(false);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to submit materials');
  }
};
```

### With State Management (Redux/Context)

```tsx
import { useDispatch } from 'react-redux';
import { addMaterials } from './materialsSlice';

function MyComponent() {
  const dispatch = useDispatch();
  
  const handleSubmit = (materials) => {
    dispatch(addMaterials(materials));
    setIsModalVisible(false);
  };
  
  // ... rest of component
}
```

## Need Help?

- Check `README.md` for detailed documentation
- See `ARCHITECTURE.md` for technical details
- Review `SUMMARY.md` for overview

---

Happy coding! 🚀

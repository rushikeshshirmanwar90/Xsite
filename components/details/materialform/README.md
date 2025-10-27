# Material Form Components

A clean, modular material form with a beautiful two-step process and smooth animations.

## Structure

```
materialform/
├── MaterialFormModal.tsx          # Main container with state management
├── AddMaterialsStep.tsx           # Step 1: Add materials
├── ReviewPurposeStep.tsx          # Step 2: Review & add purpose
├── MaterialTemplateSelector.tsx   # Quick material type selection
├── MaterialDetailsForm.tsx        # Material name, unit, quantity inputs
├── MaterialSpecifications.tsx     # Specifications section
├── AddedMaterialsList.tsx         # List of added materials
├── CustomSpecModal.tsx            # Modal for custom specifications
├── ProgressIndicator.tsx          # Progress bar component
├── types.ts                       # TypeScript types
├── constants.ts                   # Constants and mock data
├── styles.ts                      # Shared styles
└── index.ts                       # Exports
```

## Features

### Step 1: Add Materials
- Quick select material templates (Steel Rod, Brick, Cement)
- Material details form (name, unit, quantity)
- Dynamic specifications based on material type
- Custom specifications support
- Edit and delete added materials
- Visual feedback for editing state

### Step 2: Review & Purpose
- Beautiful material summary cards
- Purpose/message input
- Smooth right-swipe animation transition
- Back button to edit materials

## Usage

```tsx
import MaterialFormModal from '@/components/details/materialform';

function MyComponent() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSubmit = (materials: any[]) => {
    console.log('Submitted materials:', materials);
    setIsModalVisible(false);
  };

  return (
    <>
      <Button onPress={() => setIsModalVisible(true)}>
        Add Materials
      </Button>

      <MaterialFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

## Animation

The form uses React Native's `Animated` API for smooth transitions:
- Right-swipe animation when moving from Step 1 to Step 2
- Left-swipe animation when going back
- 300ms duration with native driver for optimal performance

## Customization

### Adding New Material Templates

Edit `constants.ts`:

```typescript
export const MATERIAL_TEMPLATES: Record<string, MaterialTemplate> = {
  // ... existing templates
  concrete: {
    name: 'Concrete',
    unit: 'cubic_meter',
    icon: 'layers',
    specFields: ['grade', 'type']
  },
};
```

### Adding New Specification Fields

Edit `constants.ts`:

```typescript
export const SPEC_FIELD_CONFIG: Record<string, SpecFieldConfig> = {
  // ... existing fields
  strength: {
    label: 'Strength',
    type: 'number',
    placeholder: 'Enter strength in MPa'
  },
};
```

## Component Breakdown

Each component is focused on a single responsibility:

- **MaterialFormModal**: State management and orchestration
- **AddMaterialsStep**: Composition of Step 1 components
- **ReviewPurposeStep**: Step 2 UI and logic
- **MaterialTemplateSelector**: Template selection UI
- **MaterialDetailsForm**: Basic material inputs
- **MaterialSpecifications**: Dynamic specs with custom support
- **AddedMaterialsList**: Display added materials with edit/delete
- **CustomSpecModal**: Modal for adding custom specs
- **ProgressIndicator**: Visual progress indicator

This modular structure makes the code:
- Easy to maintain
- Easy to test
- Easy to extend
- Easy to understand

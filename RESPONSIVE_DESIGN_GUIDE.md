# Responsive Design Implementation Guide

## Overview

This guide explains how to make your React Native application fully responsive across all device sizes including small phones, large phones, tablets, and foldable devices.

## Utility Functions

### Location: `utils/responsive.ts`

#### Core Functions:

1. **`wp(size)`** - Width Percentage

   - Scales width based on screen width
   - Example: `wp(16)` = 16px on base device, scales proportionally

2. **`hp(size)`** - Height Percentage

   - Scales height based on screen height
   - Example: `hp(44)` = 44px on base device, scales proportionally

3. **`fs(size)`** - Font Size

   - Scales font size with limits for tablets
   - Example: `fs(16)` = 16px on base device, scales proportionally

4. **`sp(size)`** - Spacing (padding/margin)

   - Scales spacing values
   - Example: `sp(12)` = 12px on base device, scales proportionally

5. **`br(size)`** - Border Radius

   - Scales border radius
   - Example: `br(8)` = 8px on base device, scales proportionally

6. **`iconSize(size)`** - Icon Size
   - Scales icon size with device-specific adjustments
   - Example: `iconSize(24)` = 24px on base device, larger on tablets

#### Device Detection:

- **`isTablet()`** - Returns true if device width >= 768px
- **`isFoldable()`** - Returns true if device is likely a foldable
- **`isSmallDevice()`** - Returns true if device width < 375px

#### Responsive Value Selection:

```typescript
responsiveValue(small, normal, tablet);
```

Returns appropriate value based on device type.

## How to Update Existing Pages

### Step 1: Import Responsive Utilities

```typescript
import { wp, hp, fs, sp, br, iconSize } from "@/utils/responsive";
import {
  responsiveText,
  spacing,
  borderRadius,
  componentSizes,
  shadows,
  containers,
} from "@/utils/responsiveStyles";
```

### Step 2: Update StyleSheet

#### Before (Fixed Sizes):

```typescript
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  button: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
});
```

#### After (Responsive Sizes):

```typescript
const styles = StyleSheet.create({
  container: {
    padding: spacing.lg, // or sp(16)
  },
  title: {
    ...responsiveText.h4, // or fontSize: fs(20)
  },
  button: {
    height: componentSizes.button, // or hp(44)
    borderRadius: borderRadius.md, // or br(8)
    paddingHorizontal: spacing.lg, // or sp(16)
  },
  icon: {
    width: componentSizes.iconMd, // or iconSize(24)
    height: componentSizes.iconMd,
  },
});
```

### Step 3: Update Icon Sizes in JSX

#### Before:

```typescript
<Ionicons name="home" size={24} color="#000" />
```

#### After:

```typescript
<Ionicons name="home" size={iconSize(24)} color="#000" />
```

## Quick Reference Table

| Fixed Value     | Responsive Function | Pre-defined Constant          |
| --------------- | ------------------- | ----------------------------- |
| width: 100      | width: wp(100)      | -                             |
| height: 50      | height: hp(50)      | height: componentSizes.button |
| fontSize: 16    | fontSize: fs(16)    | ...responsiveText.body        |
| padding: 16     | padding: sp(16)     | padding: spacing.lg           |
| margin: 12      | margin: sp(12)      | margin: spacing.md            |
| borderRadius: 8 | borderRadius: br(8) | borderRadius: borderRadius.md |
| Icon size: 24   | size={iconSize(24)} | size={componentSizes.iconMd}  |

## Common Patterns

### 1. Card Component

```typescript
const styles = StyleSheet.create({
  card: {
    ...containers.card, // Includes padding, borderRadius, shadow
    marginBottom: spacing.md,
  },
});
```

### 2. Header Text

```typescript
const styles = StyleSheet.create({
  header: {
    ...responsiveText.h3,
    color: "#1F2937",
    marginBottom: spacing.md,
  },
});
```

### 3. Button

```typescript
const styles = StyleSheet.create({
  button: {
    height: componentSizes.button,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    ...containers.center,
    ...shadows.medium,
  },
  buttonText: {
    ...responsiveText.button,
    color: "#FFFFFF",
  },
});
```

### 4. Responsive Layout

```typescript
const styles = StyleSheet.create({
  row: {
    ...containers.row,
    gap: spacing.md,
  },
  column: {
    gap: spacing.sm,
  },
});
```

## Device-Specific Adjustments

### For Tablets/Foldables:

```typescript
import { isTablet, isFoldable, responsiveValue } from "@/utils/responsive";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsiveValue(
      spacing.md, // small devices
      spacing.lg, // normal devices
      spacing.xxl // tablets/foldables
    ),
  },
});
```

### Conditional Rendering:

```typescript
{
  isTablet() && (
    <View style={styles.extraContent}>{/* Show only on tablets */}</View>
  );
}
```

## Migration Checklist

For each page, update:

- [ ] Import responsive utilities
- [ ] Replace fixed `fontSize` with `fs()` or `responsiveText`
- [ ] Replace fixed `padding/margin` with `sp()` or `spacing`
- [ ] Replace fixed `borderRadius` with `br()` or `borderRadius`
- [ ] Replace fixed `width/height` with `wp()`/`hp()`
- [ ] Replace icon `size` props with `iconSize()`
- [ ] Replace shadow styles with `shadows`
- [ ] Test on different screen sizes

## Testing

Test your responsive design on:

1. Small phone (iPhone SE, width: 320-375px)
2. Normal phone (iPhone 11, width: 375-414px)
3. Large phone (iPhone Pro Max, width: 414-428px)
4. Tablet (iPad, width: 768px+)
5. Foldable (Galaxy Fold, width: 600-900px)

## Example: Complete Page Update

See `app/notification-responsive.tsx` for a complete example of a responsive page.

# 🚀 Responsive Design Cheat Sheet

## Quick Import

```typescript
import { wp, hp, fs, sp, br, iconSize } from "@/utils/responsive";
import {
  responsiveText,
  spacing,
  borderRadius,
  componentSizes,
} from "@/utils/responsiveStyles";
```

## Common Conversions

### Font Sizes

```typescript
fontSize: 32  →  fontSize: fs(32)  or  ...responsiveText.h1
fontSize: 20  →  fontSize: fs(20)  or  ...responsiveText.h4
fontSize: 16  →  fontSize: fs(16)  or  ...responsiveText.h6
fontSize: 15  →  fontSize: fs(15)  or  ...responsiveText.body
fontSize: 14  →  fontSize: fs(14)  or  ...responsiveText.bodySmall
fontSize: 12  →  fontSize: fs(12)  or  ...responsiveText.caption
```

### Spacing

```typescript
padding: 4   →  padding: spacing.xs   or  padding: sp(4)
padding: 8   →  padding: spacing.sm   or  padding: sp(8)
padding: 12  →  padding: spacing.md   or  padding: sp(12)
padding: 16  →  padding: spacing.lg   or  padding: sp(16)
padding: 20  →  padding: spacing.xl   or  padding: sp(20)
padding: 24  →  padding: spacing.xxl  or  padding: sp(24)
```

### Border Radius

```typescript
borderRadius: 4   →  borderRadius: borderRadius.xs    or  borderRadius: br(4)
borderRadius: 8   →  borderRadius: borderRadius.md    or  borderRadius: br(8)
borderRadius: 12  →  borderRadius: borderRadius.lg    or  borderRadius: br(12)
borderRadius: 16  →  borderRadius: borderRadius.xl    or  borderRadius: br(16)
borderRadius: 100 →  borderRadius: borderRadius.round or  borderRadius: br(100)
```

### Dimensions

```typescript
width: 100   →  width: wp(100)
height: 50   →  height: hp(50)
```

### Icons

```typescript
<Ionicons size={16} />  →  <Ionicons size={iconSize(16)} />
<Ionicons size={24} />  →  <Ionicons size={iconSize(24)} />
<Ionicons size={32} />  →  <Ionicons size={iconSize(32)} />
```

### Component Heights

```typescript
height: 36  →  height: componentSizes.buttonSmall
height: 44  →  height: componentSizes.button
height: 52  →  height: componentSizes.buttonLarge
```

## VS Code Find & Replace

### Regex Patterns

```
Find: fontSize:\s*(\d+)
Replace: fontSize: fs($1)

Find: padding:\s*(\d+)
Replace: padding: sp($1)

Find: margin:\s*(\d+)
Replace: margin: sp($1)

Find: borderRadius:\s*(\d+)
Replace: borderRadius: br($1)

Find: size=\{(\d+)\}
Replace: size={iconSize($1)}
```

## Common Patterns

### Card

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
});
```

### Header

```typescript
const styles = StyleSheet.create({
  header: {
    ...responsiveText.h3,
    marginBottom: spacing.md,
  },
});
```

### Button

```typescript
const styles = StyleSheet.create({
  button: {
    height: componentSizes.button,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    ...responsiveText.button,
  },
});
```

### Row Layout

```typescript
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
```

## Device Detection

```typescript
import { isTablet, isFoldable, isSmallDevice } from "@/utils/responsive";

// Conditional rendering
{
  isTablet() && <TabletOnlyComponent />;
}

// Conditional values
const padding = isSmallDevice() ? spacing.sm : spacing.lg;
```

## Responsive Values

```typescript
import { responsiveValue } from "@/utils/responsive";

paddingHorizontal: responsiveValue(
  spacing.sm, // small devices
  spacing.md, // normal devices
  spacing.xl // tablets/foldables
);
```

## Pre-defined Sizes

### Spacing

`xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32`

### Icons

`iconXs: 16, iconSm: 20, iconMd: 24, iconLg: 28, iconXl: 32, iconXxl: 40`

### Buttons

`buttonSmall: 36, button: 44, buttonLarge: 52`

### Avatars

`avatarSmall: 32, avatar: 40, avatarLarge: 56, avatarXl: 72`

## Testing Sizes

- Small: 320-375px (iPhone SE)
- Normal: 375-414px (iPhone 11)
- Large: 414-428px (iPhone Pro Max)
- Tablet: 768px+ (iPad)
- Foldable: 600-900px (Galaxy Fold)

---

**Print this and keep it handy! 📄**

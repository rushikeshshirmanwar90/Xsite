/**
 * Script to help convert fixed styles to responsive styles
 *
 * This script provides regex patterns and replacement suggestions
 * for converting your existing StyleSheet to responsive design
 */

const conversionMap = {
  // Font sizes
  "fontSize: 32": "fontSize: fs(32) // or ...responsiveText.h1",
  "fontSize: 28": "fontSize: fs(28) // or ...responsiveText.h2",
  "fontSize: 24": "fontSize: fs(24) // or ...responsiveText.h3",
  "fontSize: 20": "fontSize: fs(20) // or ...responsiveText.h4",
  "fontSize: 18": "fontSize: fs(18) // or ...responsiveText.h5",
  "fontSize: 16": "fontSize: fs(16) // or ...responsiveText.h6",
  "fontSize: 15": "fontSize: fs(15) // or ...responsiveText.body",
  "fontSize: 14": "fontSize: fs(14) // or ...responsiveText.bodySmall",
  "fontSize: 13": "fontSize: fs(13) // or ...responsiveText.buttonSmall",
  "fontSize: 12": "fontSize: fs(12) // or ...responsiveText.caption",

  // Spacing
  "padding: 4": "padding: spacing.xs // or sp(4)",
  "padding: 8": "padding: spacing.sm // or sp(8)",
  "padding: 12": "padding: spacing.md // or sp(12)",
  "padding: 16": "padding: spacing.lg // or sp(16)",
  "padding: 20": "padding: spacing.xl // or sp(20)",
  "padding: 24": "padding: spacing.xxl // or sp(24)",
  "padding: 32": "padding: spacing.xxxl // or sp(32)",

  "margin: 4": "margin: spacing.xs // or sp(4)",
  "margin: 8": "margin: spacing.sm // or sp(8)",
  "margin: 12": "margin: spacing.md // or sp(12)",
  "margin: 16": "margin: spacing.lg // or sp(16)",
  "margin: 20": "margin: spacing.xl // or sp(20)",
  "margin: 24": "margin: spacing.xxl // or sp(24)",
  "margin: 32": "margin: spacing.xxxl // or sp(32)",

  // Border radius
  "borderRadius: 4": "borderRadius: borderRadius.xs // or br(4)",
  "borderRadius: 6": "borderRadius: borderRadius.sm // or br(6)",
  "borderRadius: 8": "borderRadius: borderRadius.md // or br(8)",
  "borderRadius: 12": "borderRadius: borderRadius.lg // or br(12)",
  "borderRadius: 16": "borderRadius: borderRadius.xl // or br(16)",
  "borderRadius: 20": "borderRadius: borderRadius.xxl // or br(20)",
  "borderRadius: 100": "borderRadius: borderRadius.round // or br(100)",

  // Component sizes
  "height: 36": "height: componentSizes.buttonSmall // or hp(36)",
  "height: 44": "height: componentSizes.button // or hp(44)",
  "height: 52": "height: componentSizes.buttonLarge // or hp(52)",

  // Icon sizes
  "size={16}": "size={iconSize(16)} // or componentSizes.iconXs",
  "size={20}": "size={iconSize(20)} // or componentSizes.iconSm",
  "size={24}": "size={iconSize(24)} // or componentSizes.iconMd",
  "size={28}": "size={iconSize(28)} // or componentSizes.iconLg",
  "size={32}": "size={iconSize(32)} // or componentSizes.iconXl",
};

console.log("=".repeat(60));
console.log("RESPONSIVE DESIGN CONVERSION GUIDE");
console.log("=".repeat(60));
console.log("\n1. Add imports to your file:\n");
console.log(
  `import { wp, hp, fs, sp, br, iconSize } from '@/utils/responsive';`
);
console.log(`import { 
  responsiveText, 
  spacing, 
  borderRadius, 
  componentSizes,
  shadows,
  containers 
} from '@/utils/responsiveStyles';`);

console.log("\n2. Common replacements:\n");
Object.entries(conversionMap).forEach(([old, newVal]) => {
  console.log(`  ${old.padEnd(25)} → ${newVal}`);
});

console.log("\n3. Regex patterns for find & replace:\n");
console.log("  Find: fontSize: (\\d+)");
console.log("  Replace: fontSize: fs($1)");
console.log("");
console.log("  Find: padding: (\\d+)");
console.log("  Replace: padding: sp($1)");
console.log("");
console.log("  Find: margin: (\\d+)");
console.log("  Replace: margin: sp($1)");
console.log("");
console.log("  Find: borderRadius: (\\d+)");
console.log("  Replace: borderRadius: br($1)");
console.log("");
console.log("  Find: size={(\\d+)}");
console.log("  Replace: size={iconSize($1)}");

console.log("\n4. Shadow replacements:\n");
console.log("  Replace shadow styles with: ...shadows.small / medium / large");

console.log("\n5. Common container patterns:\n");
console.log("  Screen container: ...containers.screen");
console.log("  Card: ...containers.card");
console.log("  Row: ...containers.row");
console.log("  Center: ...containers.center");

console.log("\n" + "=".repeat(60));
console.log("See RESPONSIVE_DESIGN_GUIDE.md for complete documentation");
console.log("=".repeat(60) + "\n");

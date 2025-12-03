# Scripts for Responsive Design

## makeResponsive.js

This script provides a quick reference guide for converting your existing styles to responsive design.

### Usage

```bash
node scripts/makeResponsive.js
```

This will display:

- Import statements to add
- Common conversion patterns
- Regex patterns for find & replace
- Quick reference guide

### What It Shows

1. **Imports** - What to add to your files
2. **Conversions** - Before/after examples
3. **Regex Patterns** - For VS Code find & replace
4. **Common Patterns** - Frequently used style combinations

### Example Output

```
==========================================================
RESPONSIVE DESIGN CONVERSION GUIDE
==========================================================

1. Add imports to your file:

import { wp, hp, fs, sp, br, iconSize } from '@/utils/responsive';
import {
  responsiveText,
  spacing,
  borderRadius,
  componentSizes,
  shadows,
  containers
} from '@/utils/responsiveStyles';

2. Common replacements:

  fontSize: 20              → fontSize: fs(20) // or ...responsiveText.h4
  padding: 16               → padding: spacing.lg // or sp(16)
  borderRadius: 8           → borderRadius: borderRadius.md // or br(8)
  ...
```

## How to Use the Guide

1. Run the script to see the conversion guide
2. Copy the imports to your file
3. Use the regex patterns in VS Code find & replace
4. Test your changes on different screen sizes

## Tips

- Start with one page at a time
- Use find & replace for bulk conversions
- Test frequently on different device sizes
- Refer to RESPONSIVE_CHEATSHEET.md for quick reference

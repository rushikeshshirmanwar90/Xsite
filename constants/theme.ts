import { Platform } from 'react-native';

// ─── Design System Tokens ───────────────────────────────────────────────────
// Single cohesive palette for the entire application.
// All screens must reference these tokens — never hardcode accent colors.

export const Colors = {
  // Primary brand blue
  primary:        '#3A78B5',
  primaryDark:    '#295E94',
  primaryLight:   '#DCEEFF',

  // Backgrounds
  background:     '#F8FAFC',
  surface:        '#FFFFFF',

  // Text
  textPrimary:    '#1E293B',
  textSecondary:  '#64748B',
  textTertiary:   '#94A3B8',

  // Border
  border:         '#E2E8F0',
  borderLight:    '#F1F5F9',

  // Semantic
  success:        '#22C55E',
  successLight:   '#F0FDF4',
  successBorder:  '#BBF7D0',
  warning:        '#F59E0B',
  warningLight:   '#FFFBEB',
  error:          '#EF4444',
  errorLight:     '#FEF2F2',
  errorBorder:    '#FEE2E2',

  // Legacy light/dark (kept for expo template compatibility)
  light: {
    text:             '#1E293B',
    background:       '#F8FAFC',
    tint:             '#3A78B5',
    icon:             '#64748B',
    tabIconDefault:   '#94A3B8',
    tabIconSelected:  '#3A78B5',
  },
  dark: {
    text:             '#ECEDEE',
    background:       '#151718',
    tint:             '#FFFFFF',
    icon:             '#9BA1A6',
    tabIconDefault:   '#9BA1A6',
    tabIconSelected:  '#FFFFFF',
  },
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  40,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor:   '#1E293B',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   '#1E293B',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  10,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#1E293B',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius:  20,
    elevation:     8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

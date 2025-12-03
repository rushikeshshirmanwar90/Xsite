import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import { br, fs, hp, sp, wp } from "./responsive";

/**
 * Create responsive styles
 * Automatically converts numeric values to responsive values
 */
export const createResponsiveStyles = <T extends StyleSheet.NamedStyles<T>>(
  styles: T | StyleSheet.NamedStyles<T>
): T => {
  return StyleSheet.create(styles);
};

/**
 * Common responsive text styles
 */
export const responsiveText = {
  // Headings
  h1: {
    fontSize: fs(32),
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: fs(40),
  },
  h2: {
    fontSize: fs(28),
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: fs(36),
  },
  h3: {
    fontSize: fs(24),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(32),
  },
  h4: {
    fontSize: fs(20),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(28),
  },
  h5: {
    fontSize: fs(18),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(24),
  },
  h6: {
    fontSize: fs(16),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(22),
  },

  // Body text
  body: {
    fontSize: fs(15),
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: fs(22),
  },
  bodyLarge: {
    fontSize: fs(16),
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: fs(24),
  },
  bodySmall: {
    fontSize: fs(14),
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: fs(20),
  },

  // Caption
  caption: {
    fontSize: fs(12),
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: fs(16),
  },
  captionSmall: {
    fontSize: fs(11),
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: fs(14),
  },

  // Button text
  button: {
    fontSize: fs(15),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(20),
  },
  buttonLarge: {
    fontSize: fs(16),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(22),
  },
  buttonSmall: {
    fontSize: fs(13),
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: fs(18),
  },
};

/**
 * Common responsive spacing
 */
export const spacing = {
  xs: sp(4),
  sm: sp(8),
  md: sp(12),
  lg: sp(16),
  xl: sp(20),
  xxl: sp(24),
  xxxl: sp(32),
};

/**
 * Common responsive border radius
 */
export const borderRadius = {
  xs: br(4),
  sm: br(6),
  md: br(8),
  lg: br(12),
  xl: br(16),
  xxl: br(20),
  round: br(100),
};

/**
 * Common responsive component sizes
 */
export const componentSizes = {
  // Button heights
  buttonSmall: hp(36),
  button: hp(44),
  buttonLarge: hp(52),

  // Input heights
  inputSmall: hp(36),
  input: hp(44),
  inputLarge: hp(52),

  // Icon sizes
  iconXs: wp(16),
  iconSm: wp(20),
  iconMd: wp(24),
  iconLg: wp(28),
  iconXl: wp(32),
  iconXxl: wp(40),

  // Avatar sizes
  avatarSmall: wp(32),
  avatar: wp(40),
  avatarLarge: wp(56),
  avatarXl: wp(72),

  // Card min heights
  cardSmall: hp(80),
  card: hp(120),
  cardLarge: hp(160),
};

/**
 * Common responsive shadows
 */
export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(1) },
    shadowOpacity: 0.05,
    shadowRadius: br(2),
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(2) },
    shadowOpacity: 0.08,
    shadowRadius: br(4),
    elevation: 2,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(4) },
    shadowOpacity: 0.12,
    shadowRadius: br(8),
    elevation: 4,
  },
};

/**
 * Common responsive container styles
 */
export const containers = {
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  row: {
    flexDirection: "row" as ViewStyle["flexDirection"],
    alignItems: "center" as ViewStyle["alignItems"],
  },
  center: {
    justifyContent: "center" as ViewStyle["justifyContent"],
    alignItems: "center" as ViewStyle["alignItems"],
  },
};

import { Dimensions, PixelRatio, Platform } from "react-native";

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 11 Pro as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Responsive width based on screen width
 * @param size - Size in pixels based on design (375px width)
 * @returns Scaled width for current device
 */
export const wp = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Responsive height based on screen height
 * @param size - Size in pixels based on design (812px height)
 * @returns Scaled height for current device
 */
export const hp = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Responsive font size
 * @param size - Font size in pixels
 * @returns Scaled font size for current device
 */
export const fs = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;

  // Limit scaling for very large screens (tablets/foldables)
  if (SCREEN_WIDTH > 600) {
    return Math.round(PixelRatio.roundToNearestPixel(size * 1.2));
  }

  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Responsive spacing (padding, margin)
 * @param size - Spacing in pixels
 * @returns Scaled spacing for current device
 */
export const sp = (size: number): number => {
  return wp(size);
};

/**
 * Check if device is a tablet
 * @returns true if device is tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Check if device is a foldable (unfolded state)
 * @returns true if device is likely a foldable in unfolded state
 */
export const isFoldable = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return SCREEN_WIDTH > 600 && aspectRatio < 1.6;
};

/**
 * Check if device is small (iPhone SE, etc.)
 * @returns true if device has small screen
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Get responsive icon size
 * @param size - Base icon size
 * @returns Scaled icon size
 */
export const iconSize = (size: number): number => {
  if (isTablet()) return size * 1.3;
  if (isSmallDevice()) return size * 0.9;
  return wp(size);
};

/**
 * Get responsive border radius
 * @param size - Base border radius
 * @returns Scaled border radius
 */
export const br = (size: number): number => {
  return wp(size);
};

/**
 * Device info
 */
export const deviceInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet: isTablet(),
  isFoldable: isFoldable(),
  isSmallDevice: isSmallDevice(),
  platform: Platform.OS,
};

/**
 * Responsive values based on device type
 * @param small - Value for small devices
 * @param normal - Value for normal devices
 * @param tablet - Value for tablets/foldables
 * @returns Appropriate value for current device
 */
export const responsiveValue = <T>(small: T, normal: T, tablet: T): T => {
  if (isTablet() || isFoldable()) return tablet;
  if (isSmallDevice()) return small;
  return normal;
};

// Export dimensions for direct use
export { SCREEN_HEIGHT, SCREEN_WIDTH };

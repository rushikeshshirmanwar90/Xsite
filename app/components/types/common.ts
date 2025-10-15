// This file contains common types used across components

export type MaterialIconName = keyof typeof import('@expo/vector-icons/build/Ionicons').Ionicons.glyphMap;

export type Period = 'Today' | '1 Week' | '15 Days' | '1 Month' | '3 Months' | '6 Months' | 'Custom';

export type MaterialTab = 'imported' | 'used';

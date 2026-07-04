import React from 'react';
import { DimensionValue } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from './skeletonTheme';

// One-off inline placeholder for small pieces of text (stat values, single fields)
// that load independently of the rest of a screen — e.g. a stat card whose number
// arrives after the page has already rendered.
export const InlineSkeleton: React.FC<{
  width?: number | DimensionValue;
  height?: number;
  radius?: number | 'round' | 'square';
}> = ({ width = 60, height = 14, radius = 6 }) => (
  <Skeleton colors={SKELETON_COLORS} width={width} height={height} radius={radius} />
);

export default InlineSkeleton;

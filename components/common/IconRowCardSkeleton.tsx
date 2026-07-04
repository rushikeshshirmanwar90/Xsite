import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from './skeletonTheme';

// Generic placeholder for the "icon chip + two-line info + right-aligned value"
// row pattern used across the analytics breakdown screens (materials, labor,
// equipment, other-cost, mini-sections, project-sections).
const IconRowCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton.Group show>
          <Skeleton colors={SKELETON_COLORS} radius={12} width={48} height={48} />
          <View style={styles.info}>
            <Skeleton colors={SKELETON_COLORS} width="60%" height={16} />
            <View style={{ height: 6 }} />
            <Skeleton colors={SKELETON_COLORS} width="35%" height={12} />
          </View>
          <View style={styles.valueBlock}>
            <Skeleton colors={SKELETON_COLORS} width={70} height={18} />
            <View style={{ height: 4 }} />
            <Skeleton colors={SKELETON_COLORS} width={50} height={10} />
          </View>
        </Skeleton.Group>
      </View>
    </View>
  );
};

export const IconRowCardListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <IconRowCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  valueBlock: {
    alignItems: 'flex-end',
  },
});

export default IconRowCardSkeleton;

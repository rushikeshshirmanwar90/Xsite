import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';
import { Colors } from '@/constants/theme';

// Placeholder mirroring the activity card — badge, location chips, one item row
// and the user footer — so the feed doesn't jump when real activity arrives.
const ActivityCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton.Group show>
        <Skeleton colors={SKELETON_COLORS} radius={20} width={112} height={28} />
        <View style={styles.chips}>
          <Skeleton colors={SKELETON_COLORS} radius={8} width={96} height={24} />
          <Skeleton colors={SKELETON_COLORS} radius={8} width={72} height={24} />
        </View>
        <View style={styles.item}>
          <Skeleton colors={SKELETON_COLORS} radius={11} width={38} height={38} />
          <View style={styles.itemText}>
            <Skeleton colors={SKELETON_COLORS} width="65%" height={15} />
            <View style={{ height: 6 }} />
            <Skeleton colors={SKELETON_COLORS} width="40%" height={12} />
          </View>
        </View>
        <View style={styles.footer}>
          <Skeleton colors={SKELETON_COLORS} radius={15} width={30} height={30} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Skeleton colors={SKELETON_COLORS} width="45%" height={12} />
          </View>
          <Skeleton colors={SKELETON_COLORS} width={44} height={12} />
        </View>
      </Skeleton.Group>
    </View>
  );
};

export const ActivityListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <ActivityCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    padding: 16,
    marginBottom: 14,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  itemText: {
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});

export default ActivityCardSkeleton;

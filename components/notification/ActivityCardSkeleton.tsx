import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder for an activity/notification row — icon chip + three text lines
// of decreasing width — shown while the activity feed loads.
const ActivityCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton.Group show>
        <Skeleton colors={SKELETON_COLORS} radius={16} width={52} height={52} />
        <View style={styles.content}>
          <Skeleton colors={SKELETON_COLORS} width="80%" height={16} />
          <View style={{ height: 8 }} />
          <Skeleton colors={SKELETON_COLORS} width="60%" height={12} />
          <View style={{ height: 6 }} />
          <Skeleton colors={SKELETON_COLORS} width="40%" height={10} />
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
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
});

export default ActivityCardSkeleton;

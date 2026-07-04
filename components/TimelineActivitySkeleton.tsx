import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder mirroring my-activities.tsx's timeline row (dot + connecting line,
// content card with description + time) shown while the activity feed loads.
const TimelineActivitySkeleton: React.FC<{ isLast?: boolean }> = ({ isLast = false }) => {
  return (
    <View style={styles.item}>
      <View style={styles.timeline}>
        <Skeleton colors={SKELETON_COLORS} radius="round" width={24} height={24} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.content}>
        <Skeleton.Group show>
          <View style={styles.header}>
            <Skeleton colors={SKELETON_COLORS} width="65%" height={13} />
            <Skeleton colors={SKELETON_COLORS} width={40} height={11} />
          </View>
          <Skeleton colors={SKELETON_COLORS} width="90%" height={11} />
        </Skeleton.Group>
      </View>
    </View>
  );
};

export const TimelineActivityListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={{ padding: 16 }}>
    {Array.from({ length: count }).map((_, i) => (
      <TimelineActivitySkeleton key={i} isLast={i === count - 1} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: '#EEF2F6',
    marginTop: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
});

export default TimelineActivitySkeleton;

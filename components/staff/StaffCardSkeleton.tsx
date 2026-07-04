import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder mirroring StaffCard's layout (accent bar, avatar, name/role/meta
// lines) shown while the staff list loads.
const StaffCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <Skeleton.Group show>
        <Skeleton colors={SKELETON_COLORS} radius={14} width={46} height={46} />
        <View style={styles.info}>
          <Skeleton colors={SKELETON_COLORS} width={140} height={15} />
          <View style={{ height: 4 }} />
          <Skeleton colors={SKELETON_COLORS} width={70} height={18} radius={8} />
          <View style={{ height: 4 }} />
          <Skeleton colors={SKELETON_COLORS} width={120} height={11} />
          <View style={{ height: 4 }} />
          <Skeleton colors={SKELETON_COLORS} width={160} height={11} />
        </View>
      </Skeleton.Group>
    </View>
  );
};

export const StaffListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <StaffCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    paddingVertical: 14,
    paddingRight: 14,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#EEF2F8',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
});

export default StaffCardSkeleton;

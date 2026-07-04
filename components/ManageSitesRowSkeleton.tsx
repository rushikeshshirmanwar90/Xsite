import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder mirroring the "Manage All Sites" row layout (name/address block +
// action buttons) shown while the site/project list loads.
const ManageSitesRowSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton.Group show>
        <View style={styles.info}>
          <Skeleton colors={SKELETON_COLORS} width="70%" height={16} />
          <View style={{ height: 6 }} />
          <Skeleton colors={SKELETON_COLORS} width="50%" height={13} />
        </View>
        <Skeleton colors={SKELETON_COLORS} width={80} height={34} radius={6} />
      </Skeleton.Group>
    </View>
  );
};

export const ManageSitesListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <ManageSitesRowSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
});

export default ManageSitesRowSkeleton;

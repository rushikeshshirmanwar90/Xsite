import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder card shown while materials are loading. Mirrors MaterialCardEnhanced's
// compact layout (icon, title, meta, three stat rows, action button) so the real
// content doesn't jump around once it arrives.
const MaterialCardSkeleton: React.FC = () => {
  return (
    <View style={styles.materialCard}>
      <View style={styles.cardContent}>
        <Skeleton.Group show>
          <View style={styles.materialHeader}>
            <View style={styles.materialTitleSection}>
              <Skeleton colors={SKELETON_COLORS} radius="round" width={34} height={34} />
              <View style={styles.materialTitleInfo}>
                <Skeleton colors={SKELETON_COLORS} width={120} height={15} />
                <View style={{ height: 6 }} />
                <Skeleton colors={SKELETON_COLORS} width={80} height={10} />
              </View>
            </View>
            <Skeleton colors={SKELETON_COLORS} width={50} height={11} />
          </View>

          <View style={styles.statsListSection}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.statsListRow}>
                <Skeleton colors={SKELETON_COLORS} width={90} height={12} />
                <Skeleton colors={SKELETON_COLORS} width={60} height={13} />
              </View>
            ))}
          </View>

          <Skeleton colors={SKELETON_COLORS} width="100%" height={34} radius={8} />
        </Skeleton.Group>
      </View>
    </View>
  );
};

// Renders a short stack of skeleton cards — used in place of the material list
// while the initial fetch is in flight.
export const MaterialListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <MaterialCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 10,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  materialTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  materialTitleInfo: {
    flex: 1,
    marginLeft: 8,
  },
  statsListSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  statsListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default MaterialCardSkeleton;

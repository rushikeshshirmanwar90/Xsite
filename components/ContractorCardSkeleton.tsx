import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder mirroring the contractor card layout (avatar + name, progress bar,
// three-column stats row, action button) shown while the contractor list loads.
const ContractorCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton.Group show>
        <View style={styles.cardTop}>
          <Skeleton colors={SKELETON_COLORS} radius={21} width={42} height={42} />
          <View style={styles.identityText}>
            <Skeleton colors={SKELETON_COLORS} width={120} height={14} />
            <View style={{ height: 6 }} />
            <Skeleton colors={SKELETON_COLORS} width={90} height={11} />
          </View>
        </View>

        <View style={styles.progressWrap}>
          <Skeleton colors={SKELETON_COLORS} width="100%" height={3} radius={2} />
        </View>

        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.statCol}>
              <Skeleton colors={SKELETON_COLORS} width={50} height={10} />
              <View style={{ height: 6 }} />
              <Skeleton colors={SKELETON_COLORS} width={60} height={13} />
            </View>
          ))}
        </View>

        <Skeleton colors={SKELETON_COLORS} width="100%" height={42} radius={12} />
      </Skeleton.Group>
    </View>
  );
};

export const ContractorListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <ContractorCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  identityText: {
    flex: 1,
    marginLeft: 12,
  },
  progressWrap: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
  },
});

export default ContractorCardSkeleton;
